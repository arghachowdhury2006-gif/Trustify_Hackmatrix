import { Reason, Verdict } from '../types';

export interface ScoreComputationResult {
  score: number;
  verdict: Verdict;
  confidence: number;
  reasons: Reason[];
  recommendation: string;
  explanation: string;
}

export function computeUnifiedTrustScore(
  threatRisk: number,
  certRisk: number,
  websecRisk: number,
  intelRisk: number,
  allReasons: Reason[],
  domainName: string
): ScoreComputationResult {
  // Formula per PRD & Architecture
  const weightedRisk =
    0.40 * threatRisk +
    0.25 * certRisk +
    0.20 * websecRisk +
    0.15 * intelRisk;

  let score = Math.round(100 - weightedRisk);
  score = Math.max(0, Math.min(100, score));

  // Sort and deduplicate reasons by severity and weight
  const seenCodes = new Set<string>();
  const uniqueReasons: Reason[] = [];

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

  const sortedReasons = [...allReasons].sort((a, b) => {
    const sevDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    if (sevDiff !== 0) return sevDiff;
    return b.weight - a.weight;
  });

  for (const r of sortedReasons) {
    if (!seenCodes.has(r.code)) {
      seenCodes.add(r.code);
      uniqueReasons.push(r);
    }
  }

  // Hard Overrides
  let verdict: Verdict;
  const hasCriticalOrLookalike = uniqueReasons.some(
    r => r.code === 'BRAND_LOOKALIKE' || 
         r.code === 'SHARED_KEY' || 
         r.code === 'FEED_HIT' || 
         r.severity === 'critical'
  );

  if (hasCriticalOrLookalike || score < 50) {
    verdict = 'malicious';
    if (score > 45) score = Math.min(score, 35);
  } else if (score < 80) {
    verdict = 'suspicious';
  } else {
    verdict = 'safe';
  }

  // Compute confidence (0.85 - 0.98)
  const confidence = Number((0.88 + Math.min(0.10, uniqueReasons.length * 0.02)).toFixed(2));

  // Actionable Recommendation
  let recommendation = '';
  if (verdict === 'malicious') {
    recommendation = 'DO NOT enter any passwords, payment info, or personal credentials on this website. Immediate risk of identity theft or credential harvesting.';
  } else if (verdict === 'suspicious') {
    recommendation = 'Proceed with heightened caution. Verify the domain spelling and avoid downloading files or submitting sensitive financial information.';
  } else {
    recommendation = 'This website demonstrates valid security configurations, authentic TLS certificates, and reputable threat intelligence scores.';
  }

  // Human-readable plain English explanation
  let explanation = '';
  if (verdict === 'malicious') {
    const topThreat = uniqueReasons.find(r => r.engine === 'threat' || r.engine === 'certificate');
    explanation = topThreat
      ? `Trustify has flagged ${domainName} as malicious. ${topThreat.title}: ${topThreat.detail}`
      : `Trustify detected critical indicators of fraud or website impersonation on ${domainName}. The site exhibits deception patterns commonly used in phishing attacks.`;
  } else if (verdict === 'suspicious') {
    explanation = `${domainName} has configuration anomalies or newly observed infrastructure. Multiple low-to-medium security warnings were triggered across certificates and domain age.`;
  } else {
    explanation = `${domainName} has passed all verification stages. Digital certificates are valid, cryptographic keys are secure, and no phishing patterns were identified.`;
  }

  return {
    score,
    verdict,
    confidence,
    reasons: uniqueReasons,
    recommendation,
    explanation,
  };
}
