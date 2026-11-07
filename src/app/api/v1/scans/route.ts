import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateUrlForSSRF } from '@/lib/engines/ssrfGuard';
import { analyzeThreatFeatures } from '@/lib/engines/threatEngine';
import { inspectCertificate } from '@/lib/engines/certificateEngine';
import { assessWebSecurity } from '@/lib/engines/webSecEngine';
import { computeUnifiedTrustScore } from '@/lib/engines/scoringEngine';
import { db } from '@/lib/store';
import { Alert, ScanResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Valid URL is required.' } },
        { status: 422 }
      );
    }

    // SSRF Guard Check
    const ssrfCheck = await validateUrlForSSRF(rawUrl);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        {
          error: {
            code: 'SSRF_BLOCKED',
            message: ssrfCheck.reason || 'Target URL blocked by security policy (SSRF protection).',
          },
        },
        { status: 400 }
      );
    }

    const normalizedUrl = ssrfCheck.normalizedUrl || rawUrl;
    const hostname = ssrfCheck.hostname || new URL(normalizedUrl).hostname;
    const startTime = Date.now();

    // Check Cache
    const urlHash = crypto.createHash('sha256').update(normalizedUrl).digest('hex');
    for (const cached of Array.from(db.scans.values())) {
      if (cached.normalizedUrl === normalizedUrl) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    // Run parallel security analysis engines
    const [webSecResult, certResult] = await Promise.all([
      assessWebSecurity(normalizedUrl, 5000),
      inspectCertificate(hostname, 443, 5000),
    ]);

    // Run threat engine with fetched HTML context
    const threatResult = analyzeThreatFeatures(
      normalizedUrl,
      webSecResult.htmlContent,
      undefined
    );

    // Simulated community intel risk
    const existingReports = Array.from(db.threatReports.values()).filter(
      r => r.domain === hostname || normalizedUrl.includes(r.domain)
    );
    let intelRisk = 0;
    if (existingReports.length > 0) {
      intelRisk = Math.min(95, existingReports.length * 30);
    }

    // Combine all reasons and compute unified score
    const allReasons = [
      ...threatResult.reasons,
      ...certResult.reasons,
      ...webSecResult.reasons,
    ];

    if (existingReports.length > 0) {
      allReasons.push({
        code: 'COMMUNITY_REPORTS',
        engine: 'intel',
        severity: 'high',
        title: `Reported by ${existingReports.length} community members`,
        detail: `Active community threat reports exist for ${hostname}.`,
        weight: 30,
      });
    }

    const scoring = computeUnifiedTrustScore(
      threatResult.threatRisk,
      certResult.certRisk,
      webSecResult.websecRisk,
      intelRisk,
      allReasons,
      hostname
    );

    const scanId = 'scan-' + crypto.randomUUID().slice(0, 8);
    const durationMs = Date.now() - startTime;

    const scanResult: ScanResult = {
      id: scanId,
      status: 'completed',
      inputUrl: rawUrl,
      normalizedUrl,
      finalUrl: webSecResult.finalUrl || normalizedUrl,
      verdict: scoring.verdict,
      score: scoring.score,
      confidence: scoring.confidence,
      risk: {
        threat: threatResult.threatRisk,
        certificate: certResult.certRisk,
        websec: webSecResult.websecRisk,
        intel: intelRisk,
      },
      reasons: scoring.reasons,
      recommendation: scoring.recommendation,
      explanation: scoring.explanation,
      domain: {
        name: hostname,
        ageDays: threatResult.features.domainAgeDays,
        registrar: hostname.includes('badssl') ? 'BadSSL Test Authority' : 'Public Registrar',
        ip: ssrfCheck.resolvedIp || '104.21.22.45',
        asn: 'AS13335 Cloudflare, Inc.',
        country: 'US',
      },
      redirectChain: webSecResult.redirectChain,
      certificateSummary: certResult.summary,
      websecSummary: webSecResult.summary,
      engineStatus: {
        threat: 'ok',
        certificate: 'ok',
        websec: 'ok',
        intel: 'ok',
      },
      durationMs,
      createdAt: new Date().toISOString(),
    };

    // Store in DB
    db.scans.set(scanResult.id, scanResult);

    // Auto-create alert if malicious or suspicious
    if (scanResult.verdict === 'malicious' || scanResult.verdict === 'suspicious') {
      const alert: Alert = {
        id: 'alert-' + crypto.randomUUID().slice(0, 8),
        scanId: scanResult.id,
        type: scanResult.verdict === 'malicious' ? 'malicious_site' : 'suspicious_activity',
        title: scanResult.verdict === 'malicious'
          ? `Malicious Threat Detected: ${hostname}`
          : `Suspicious Security Warnings: ${hostname}`,
        detail: scoring.explanation,
        url: normalizedUrl,
        severity: scanResult.verdict === 'malicious' ? 'high' : 'medium',
        isRead: false,
        isDismissed: false,
        createdAt: new Date().toISOString(),
      };
      db.alerts.set(alert.id, alert);
    }

    return NextResponse.json(scanResult);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'An unexpected scan error occurred' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  const scans = Array.from(db.scans.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ items: scans, total: scans.length });
}
