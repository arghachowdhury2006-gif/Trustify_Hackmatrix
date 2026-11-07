import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { validateUrlForSSRF } from '@/lib/engines/ssrfGuard';
import { analyzeThreatFeatures } from '@/lib/engines/threatEngine';
import { computeUnifiedTrustScore } from '@/lib/engines/scoringEngine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Query parameter `url` is required.' } },
      { status: 422 }
    );
  }

  // Check cache first
  for (const scan of Array.from(db.scans.values())) {
    if (scan.inputUrl === targetUrl || scan.normalizedUrl === targetUrl) {
      return NextResponse.json({
        url: targetUrl,
        verdict: scan.verdict,
        score: scan.score,
        cached: true,
        recommendation: scan.recommendation,
        reasons_count: scan.reasons.length,
      });
    }
  }

  // Fast evaluation
  const ssrf = await validateUrlForSSRF(targetUrl);
  if (!ssrf.safe) {
    return NextResponse.json(
      { error: { code: 'SSRF_BLOCKED', message: ssrf.reason } },
      { status: 400 }
    );
  }

  const hostname = ssrf.hostname || 'target';
  const threat = analyzeThreatFeatures(targetUrl);
  const scoring = computeUnifiedTrustScore(
    threat.threatRisk,
    15,
    15,
    0,
    threat.reasons,
    hostname
  );

  return NextResponse.json({
    url: targetUrl,
    verdict: scoring.verdict,
    score: scoring.score,
    cached: false,
    recommendation: scoring.recommendation,
    reasons_count: scoring.reasons.length,
  });
}
