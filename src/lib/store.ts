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
  const totalScansCount = allScans.length + 12540; // baseline demo volume
  const safeScansCount = Math.round(totalScansCount * 0.94);
  const threatScansCount = totalScansCount - safeScansCount;

  const alerts = Array.from(db.alerts.values())
    .filter(a => !a.isDismissed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    kpis: {
      totalScans: { value: totalScansCount, deltaPct: 14.2 },
      safe: { value: safeScansCount, deltaPct: 11.8 },
      threats: { value: threatScansCount, deltaPct: -4.5 },
      avgResponseMs: { value: 1150, deltaPct: -16.4 },
    },
    overview: {
      safePct: 94,
      suspiciousPct: 4,
      maliciousPct: 2,
      trend: [
        { day: 'Mon', scoreAvg: 92, scans: 1420 },
        { day: 'Tue', scoreAvg: 89, scans: 1680 },
        { day: 'Wed', scoreAvg: 91, scans: 1530 },
        { day: 'Thu', scoreAvg: 88, scans: 1820 },
        { day: 'Fri', scoreAvg: 90, scans: 1940 },
        { day: 'Sat', scoreAvg: 93, scans: 1120 },
        { day: 'Sun', scoreAvg: 94, scans: 1250 },
      ],
    },
    threatTypes: [
      { type: 'phishing', label: 'Phishing & Impersonation', pct: 44, count: 298 },
      { type: 'malware', label: 'Malware & Exploit Kits', pct: 26, count: 176 },
      { type: 'fake_payment', label: 'Payment / Banking Scams', pct: 18, count: 122 },
      { type: 'others', label: 'Certificate / Misconfig Anomalies', pct: 12, count: 82 },
    ],
    recentAlerts: alerts,
  };
}

