import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { inspectCertificate } from '@/lib/engines/certificateEngine';
import { validateUrlForSSRF } from '@/lib/engines/ssrfGuard';
import { db } from '@/lib/store';
import { Alert } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let host = body?.host || body?.domain || '';
    const port = Number(body?.port) || 443;

    if (!host) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Host is required.' } },
        { status: 422 }
      );
    }

    // Strip scheme if present
    host = host.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();

    // SSRF Guard Check: prevent probing internal networks or cloud metadata via TLS
    const ssrfCheck = await validateUrlForSSRF(`https://${host}`);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        {
          error: {
            code: 'SSRF_BLOCKED',
            message: ssrfCheck.reason || 'Target host blocked by security policy (SSRF protection).',
          },
        },
        { status: 400 }
      );
    }

    const result = await inspectCertificate(host, port, 6000);

    const testId = body?.testId;
    let singleTestResult = null;
    if (testId && result.summary.securityAudit?.tests) {
      const testsMap = result.summary.securityAudit.tests as Record<string, any>;
      const camelKey = testId.replace(/_([a-z])/g, (_: string, g: string) => g.toUpperCase());
      singleTestResult = testsMap[camelKey] || testsMap[testId] || null;
    }

    // Auto-create alert if certificate has anomalies or security audit failures
    const auditFailed = Boolean(
      result.summary.securityAudit && result.summary.securityAudit.failedCount > 0
    );
    const singleFailed = Boolean(
      singleTestResult && (singleTestResult.status === 'FAIL' || singleTestResult.status === 'WARNING')
    );
    const hasFlags = result.summary.flags && result.summary.flags.length > 0;
    const isInvalid = !result.summary.valid;

    if (auditFailed || singleFailed || hasFlags || isInvalid) {
      const topFlag = result.summary.flags[0] || (singleTestResult ? singleTestResult.id : 'CERT_ANOMALY');
      const matchingReason = result.reasons.find(r => r.code === topFlag);
      const isCriticalOrHigh =
        matchingReason?.severity === 'critical' ||
        matchingReason?.severity === 'high' ||
        (singleTestResult && singleTestResult.status === 'FAIL');

      const alertTitle =
        singleTestResult && singleTestResult.status === 'FAIL'
          ? `${singleTestResult.title} Failed: ${host}`
          : matchingReason?.title || `Certificate Anomaly Flagged: ${host}`;

      const alertDetail =
        singleTestResult && singleTestResult.summary
          ? singleTestResult.summary
          : matchingReason?.detail ||
            `Certificate for ${host} triggered security alerts (${result.summary.flags.join(', ')}).`;

      const alert: Alert = {
        id: 'alert-' + crypto.randomUUID().slice(0, 8),
        type: 'cert_issue',
        title: alertTitle,
        detail: alertDetail,
        url: `https://${host}`,
        severity: isCriticalOrHigh ? 'high' : 'medium',
        isRead: false,
        isDismissed: false,
        createdAt: new Date().toISOString(),
      };
      db.alerts.set(alert.id, alert);
    }

    return NextResponse.json({
      host,
      valid: result.summary.valid,
      risk: result.certRisk,
      chain: result.summary.chain,
      sans: result.summary.sans,
      flags: result.summary.flags.map(f => {
        const matchingReason = result.reasons.find(r => r.code === f);
        return {
          code: f,
          severity: matchingReason?.severity || 'medium',
          detail: matchingReason?.detail || f,
        };
      }),
      weak_key_analysis: result.summary.weakKeyAnalysis,
      ct: result.summary.ct,
      security_audit: result.summary.securityAudit,
      test_result: singleTestResult,
      summary: result.summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to inspect certificate' } },
      { status: 500 }
    );
  }
}

