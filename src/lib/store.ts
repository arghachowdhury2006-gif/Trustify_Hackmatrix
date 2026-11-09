import crypto from 'crypto';
import { Alert, ApiKeyRecord, DashboardSummary, ScanResult, ThreatReport, WatchlistDomain } from './types';

// Global in-memory storage singleton for demo / server persistence
declare global {
  // eslint-disable-next-line no-var
  var __TRUSTIFY_DB: {
    scans: Map<string, ScanResult>;
    threatReports: Map<string, ThreatReport>;
    alerts: Map<string, Alert>;
    apiKeys: Map<string, ApiKeyRecord>;
    watchlist: Map<string, WatchlistDomain>;
    userVotes: Map<string, number>; // `${userId}:${reportId}` -> 1 | -1
    userProfile: {
      name: string;
      email: string;
      role: string;
      reputation: number;
    };
  } | undefined;
}

function initDb() {
  if (global.__TRUSTIFY_DB) {
    // Clear out any previously seeded demo alerts and scans
    global.__TRUSTIFY_DB.alerts.delete('alert-01');
    global.__TRUSTIFY_DB.alerts.delete('alert-02');
    global.__TRUSTIFY_DB.alerts.delete('alert-03');
    global.__TRUSTIFY_DB.scans.delete('scan-paypa1-01');
    global.__TRUSTIFY_DB.scans.delete('scan-example-01');
    global.__TRUSTIFY_DB.scans.delete('scan-badssl-expired');
    return global.__TRUSTIFY_DB;
  }

  const scans = new Map<string, ScanResult>();
  const threatReports = new Map<string, ThreatReport>();
  const alerts = new Map<string, Alert>();
  const apiKeys = new Map<string, ApiKeyRecord>();
  const watchlist = new Map<string, WatchlistDomain>();
  const userVotes = new Map<string, number>();

  // 1. Scans (starts empty — scans are recorded dynamically when user performs tests)
  // No hardcoded scans seeded

  // 2. Seed Threat Intelligence Reports
  const initialReports: ThreatReport[] = [
    {
      id: 'rep-001',
      url: 'https://paypa1-secure-login.com/auth/verify',
      domain: 'paypa1-secure-login.com',
      category: 'phishing',
      description: 'SMS phishing link sent to users in India claiming their PayPal account is temporarily restricted.',
      status: 'verified',
      upvotes: 42,
      downvotes: 1,
      reporterReputation: 88,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'rep-002',
      url: 'https://sbi-card-kyc-update.top/login.html',
      domain: 'sbi-card-kyc-update.top',
      category: 'fake_payment',
      description: 'Fraudulent bank KYC portal requesting PAN, Aadhaar, and debit card PIN.',
      status: 'verified',
      upvotes: 68,
      downvotes: 0,
      reporterReputation: 95,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
    {
      id: 'rep-003',
      url: 'https://amazon-order-delivery-track.click/refund',
      domain: 'amazon-order-delivery-track.click',
      category: 'impersonation',
      description: 'Fake delivery tracking page harvesting Amazon login credentials and CVV.',
      status: 'verified',
      upvotes: 29,
      downvotes: 2,
      reporterReputation: 74,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: 'rep-004',
      url: 'https://careers-google-hiring-portal.buzz/apply',
      domain: 'careers-google-hiring-portal.buzz',
      category: 'fake_recruitment',
      description: 'Recruitment scam demanding interview registration fees via UPI QR code.',
      status: 'pending',
      upvotes: 15,
      downvotes: 1,
      reporterReputation: 50,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    }
  ];

  for (const r of initialReports) {
    threatReports.set(r.id, r);
  }

  // 3. Alerts (empty initially — alerts are created dynamically only when real tests/scans run)
  // No hardcoded alerts seeded

  // 4. Seed API Keys
  const defaultApiKey: ApiKeyRecord = {
    id: 'key-default-01',
    name: 'Production Extension Key',
    prefix: 'tf_live_9a7b',
    key: 'tf_live_9a7b4c81f02e5d6a78b9c0d1e2f3a4b5',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    lastUsedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  };
  apiKeys.set(defaultApiKey.id, defaultApiKey);

  // 5. Seed Watchlist
  const initialWatchlist: WatchlistDomain[] = [
    {
      id: 'watch-01',
      domain: 'trustify-portal.io',
      addedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      lastCheckedAt: new Date().toISOString(),
      status: 'healthy',
      expiresInDays: 85,
      certIssuer: "Let's Encrypt Authority R3",
    },
    {
      id: 'watch-02',
      domain: 'api.trustify-demo.org',
      addedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      lastCheckedAt: new Date().toISOString(),
      status: 'warning',
      expiresInDays: 11,
      certIssuer: 'DigiCert Global Root G2',
    }
  ];

  for (const w of initialWatchlist) {
    watchlist.set(w.id, w);
  }

  global.__TRUSTIFY_DB = {
    scans,
    threatReports,
    alerts,
    apiKeys,
    watchlist,
    userVotes,
    userProfile: {
      name: 'Security Analyst',
      email: 'analyst@trustify.local',
      role: 'Threat Analyst',
      reputation: 92,
    },
  };

  return global.__TRUSTIFY_DB;
}

export const db = initDb();

export function getDashboardSummary(): DashboardSummary {
  const allScans = Array.from(db.scans.values());
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;

  // 1. Scan Counts & Classification (Real database records)
  const totalScansCount = allScans.length;
  const safeScans = allScans.filter((s) => s.verdict === 'safe');
  const suspiciousScans = allScans.filter((s) => s.verdict === 'suspicious');
  const maliciousScans = allScans.filter((s) => s.verdict === 'malicious');

  const safeScansCount = safeScans.length;
  const suspiciousScansCount = suspiciousScans.length;
  const maliciousScansCount = maliciousScans.length;

  // Actual recorded blocked threats (flagged malicious)
  const threatsBlockedCount = maliciousScansCount;

  // 2. Average Latency (actual scan durations in milliseconds)
  const totalDuration = allScans.reduce((acc, s) => acc + (s.durationMs || 0), 0);
  const avgResponseMs = totalScansCount > 0 ? Math.round(totalDuration / totalScansCount) : 0;

  // 3. Weekly Comparisons (Current 7 Days vs Prior 7 Days)
  const currentWeekScans = allScans.filter(
    (s) => new Date(s.createdAt).getTime() >= now - ONE_WEEK_MS
  );
  const priorWeekScans = allScans.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t < now - ONE_WEEK_MS && t >= now - 2 * ONE_WEEK_MS;
  });

  const calcDelta = (curr: number, prev: number): number => {
    if (prev > 0) return Number((((curr - prev) / prev) * 100).toFixed(1));
    return curr > 0 ? 100 : 0;
  };

  const totalDeltaPct = calcDelta(currentWeekScans.length, priorWeekScans.length);
  const safeDeltaPct = calcDelta(
    currentWeekScans.filter((s) => s.verdict === 'safe').length,
    priorWeekScans.filter((s) => s.verdict === 'safe').length
  );
  const threatsDeltaPct = calcDelta(
    currentWeekScans.filter((s) => s.verdict === 'malicious').length,
    priorWeekScans.filter((s) => s.verdict === 'malicious').length
  );

  const currentWeekDuration = currentWeekScans.reduce((a, s) => a + (s.durationMs || 0), 0);
  const priorWeekDuration = priorWeekScans.reduce((a, s) => a + (s.durationMs || 0), 0);
  const currentAvgLatency =
    currentWeekScans.length > 0 ? currentWeekDuration / currentWeekScans.length : 0;
  const priorAvgLatency =
    priorWeekScans.length > 0 ? priorWeekDuration / priorWeekScans.length : 0;
  const latencyDeltaPct =
    priorAvgLatency > 0
      ? Number((((currentAvgLatency - priorAvgLatency) / priorAvgLatency) * 100).toFixed(1))
      : 0;

  // 4. Distribution Percentages (0 - 100% based on real data)
  const safePct = totalScansCount > 0 ? Math.round((safeScansCount / totalScansCount) * 100) : 0;
  const suspiciousPct =
    totalScansCount > 0 ? Math.round((suspiciousScansCount / totalScansCount) * 100) : 0;
  const maliciousPct =
    totalScansCount > 0 ? Math.max(0, 100 - safePct - suspiciousPct) : 0;

  // 5. Seven-Day Trend (Exact calendar days: 6 days ago up to today)
  const trend: {
    day: string;
    scoreAvg: number;
    scans: number;
    safe?: number;
    suspicious?: number;
    malicious?: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * ONE_DAY_MS);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const ymd = d.toISOString().slice(0, 10);

    const dayScans = allScans.filter((s) => {
      try {
        return new Date(s.createdAt).toISOString().slice(0, 10) === ymd;
      } catch {
        return false;
      }
    });

    const dayTotal = dayScans.length;
    const daySafe = dayScans.filter((s) => s.verdict === 'safe').length;
    const daySuspicious = dayScans.filter((s) => s.verdict === 'suspicious').length;
    const dayMalicious = dayScans.filter((s) => s.verdict === 'malicious').length;
    const dayScoreAvg =
      dayTotal > 0
        ? Math.round(dayScans.reduce((acc, s) => acc + (s.score || 0), 0) / dayTotal)
        : 0;

    trend.push({
      day: dayStr,
      scoreAvg: dayScoreAvg,
      scans: dayTotal,
      safe: daySafe,
      suspicious: daySuspicious,
      malicious: dayMalicious,
    });
  }

  // 6. Threat Classification Breakdown
  const allReports = Array.from(db.threatReports.values());
  let phishingCount = 0;
  let malwareCount = 0;
  let paymentCount = 0;
  let othersCount = 0;

  for (const r of allReports) {
    if (r.category === 'phishing' || r.category === 'impersonation') phishingCount++;
    else if (r.category === 'malware' || r.category === 'spyware') malwareCount++;
    else if (
      r.category === 'fake_payment' ||
      r.category === 'scam' ||
      r.category === 'fake_recruitment'
    )
      paymentCount++;
    else othersCount++;
  }

  for (const s of allScans) {
    if (s.verdict === 'malicious' || s.verdict === 'suspicious') {
      for (const r of s.reasons) {
        if (
          r.code === 'BRAND_LOOKALIKE' ||
          r.code === 'BRAND_SUBDOMAIN_DECEPTION' ||
          r.code === 'LOGIN_FORM_OFFDOMAIN'
        ) {
          phishingCount++;
        } else if (r.code === 'OBFUSCATED_JS' || r.code === 'HIGH_ENTROPY_URL') {
          malwareCount++;
        } else if (
          r.engine === 'certificate' ||
          r.code === 'EXPIRED' ||
          r.code === 'SELF_SIGNED' ||
          r.code === 'WEAK_KEY'
        ) {
          othersCount++;
        }
      }
    }
  }

  const totalThreatIncidents = phishingCount + malwareCount + paymentCount + othersCount;

  const threatTypes = [
    {
      type: 'phishing',
      label: 'Phishing & Impersonation',
      count: phishingCount,
      pct:
        totalThreatIncidents > 0
          ? Math.round((phishingCount / totalThreatIncidents) * 100)
          : 0,
    },
    {
      type: 'malware',
      label: 'Malware & Exploit Kits',
      count: malwareCount,
      pct:
        totalThreatIncidents > 0
          ? Math.round((malwareCount / totalThreatIncidents) * 100)
          : 0,
    },
    {
      type: 'fake_payment',
      label: 'Payment / Banking Scams',
      count: paymentCount,
      pct:
        totalThreatIncidents > 0
          ? Math.round((paymentCount / totalThreatIncidents) * 100)
          : 0,
    },
    {
      type: 'others',
      label: 'Certificate / Misconfig Anomalies',
      count: othersCount,
      pct:
        totalThreatIncidents > 0
          ? Math.max(
              0,
              100 -
                ((totalThreatIncidents > 0
                  ? Math.round((phishingCount / totalThreatIncidents) * 100)
                  : 0) +
                  (totalThreatIncidents > 0
                    ? Math.round((malwareCount / totalThreatIncidents) * 100)
                    : 0) +
                  (totalThreatIncidents > 0
                    ? Math.round((paymentCount / totalThreatIncidents) * 100)
                    : 0))
            )
          : 0,
    },
  ];

  // 7. Recent Alerts (Real active incidents)
  const alerts = Array.from(db.alerts.values())
    .filter((a) => !a.isDismissed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return {
    kpis: {
      totalScans: { value: totalScansCount, deltaPct: totalDeltaPct },
      safe: { value: safeScansCount, deltaPct: safeDeltaPct },
      threats: { value: threatsBlockedCount, deltaPct: threatsDeltaPct },
      avgResponseMs: { value: avgResponseMs, deltaPct: latencyDeltaPct },
    },
    overview: {
      safePct,
      suspiciousPct,
      maliciousPct,
      trend,
    },
    threatTypes,
    recentAlerts: alerts,
  };
}

