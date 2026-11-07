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
  } | undefined;
}

function initDb() {
  if (global.__TRUSTIFY_DB) return global.__TRUSTIFY_DB;

  const scans = new Map<string, ScanResult>();
  const threatReports = new Map<string, ThreatReport>();
  const alerts = new Map<string, Alert>();
  const apiKeys = new Map<string, ApiKeyRecord>();
  const watchlist = new Map<string, WatchlistDomain>();
  const userVotes = new Map<string, number>();

  // 1. Seed Scans
  const initialScans: ScanResult[] = [
    {
      id: 'scan-paypa1-01',
      status: 'completed',
      inputUrl: 'https://paypa1-secure-login.com/auth/verify',
      normalizedUrl: 'https://paypa1-secure-login.com/auth/verify',
      finalUrl: 'https://paypa1-secure-login.com/auth/verify',
      verdict: 'malicious',
      score: 12,
      confidence: 0.96,
      risk: { threat: 92, certificate: 45, websec: 60, intel: 85 },
      reasons: [
        {
          code: 'BRAND_LOOKALIKE',
          engine: 'threat',
          severity: 'high',
          title: 'Pretends to be PAYPAL',
          detail: "Domain label 'paypa1' visually mimics 'paypal' using character substitution (number 1 instead of l).",
          weight: 40,
        },
        {
          code: 'NEW_DOMAIN_LT_30D',
          engine: 'threat',
          severity: 'medium',
          title: 'Recently registered domain (3 days old)',
          detail: 'Domain was created 3 days ago. Newly registered domains represent a high proportion of active phishing sites.',
          weight: 20,
        },
        {
          code: 'LOGIN_FORM_OFFDOMAIN',
          engine: 'threat',
          severity: 'high',
          title: 'Login form submits to external domain',
          detail: 'Password input field submits authentication credentials to third-party host drop-receiver.xyz.',
          weight: 35,
        },
        {
          code: 'MISSING_HSTS',
          engine: 'websec',
          severity: 'low',
          title: 'Missing HTTP Strict Transport Security (HSTS)',
          detail: 'Connections could be susceptible to SSL-stripping man-in-the-middle attacks.',
          weight: 15,
        }
      ],
      recommendation: 'DO NOT enter any passwords or payment details. Immediate risk of credential theft.',
      explanation: "Trustify has flagged paypa1-secure-login.com as malicious. Domain label 'paypa1' visually mimics 'paypal' using character substitution.",
      domain: {
        name: 'paypa1-secure-login.com',
        ageDays: 3,
        registrar: 'NameCheap Inc.',
        ip: '198.51.100.24',
        asn: 'AS16276 OVH SAS',
        country: 'NL',
      },
      redirectChain: ['https://paypa1-secure-login.com/auth/verify'],
      certificateSummary: {
        valid: true,
        subject: 'paypa1-secure-login.com',
        issuer: "Let's Encrypt Authority R3",
        expiresInDays: 78,
        keyType: 'RSA',
        keyBits: 2048,
        sigAlg: 'sha256WithRSAEncryption',
        sctCount: 2,
        flags: ['UNTRUSTED_ISSUER'],
        chain: [
          {
            role: 'leaf',
            subject: 'paypa1-secure-login.com',
            issuer: "Let's Encrypt Authority R3",
            validFrom: '2026-10-20T00:00:00Z',
            validTo: '2027-01-20T00:00:00Z',
            key: 'RSA 2048',
            keyBits: 2048,
            sigAlg: 'sha256WithRSAEncryption',
            sctCount: 2,
          }
        ],
        weakKeyAnalysis: {
          smallFactorTest: 'pass',
          knownBadFingerprint: false,
          sharedWithDomains: [],
          riskSummary: 'Standard free-tier automated certificate.'
        }
      },
      websecSummary: {
        grade: 'D',
        headers: {
          hsts: false,
          csp: false,
          xFrameOptions: false,
          xContentTypeOptions: false,
          referrerPolicy: false,
          permissionsPolicy: false,
        },
        cookieFlags: { secure: false, httpOnly: false, sameSite: false },
        httpsEnforced: true,
        exposedPaths: []
      },
      engineStatus: { threat: 'ok', certificate: 'ok', websec: 'ok', intel: 'ok' },
      durationMs: 1420,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'scan-example-01',
      status: 'completed',
      inputUrl: 'https://example.com',
      normalizedUrl: 'https://example.com',
      finalUrl: 'https://example.com',
      verdict: 'safe',
      score: 96,
      confidence: 0.98,
      risk: { threat: 2, certificate: 5, websec: 12, intel: 0 },
      reasons: [],
      recommendation: 'This website demonstrates valid security configurations, authentic TLS certificates, and reputable threat intelligence scores.',
      explanation: 'example.com has passed all verification stages. Digital certificates are valid, cryptographic keys are secure, and no phishing patterns were identified.',
      domain: {
        name: 'example.com',
        ageDays: 9800,
        registrar: 'Internet Assigned Numbers Authority',
        ip: '93.184.216.34',
        asn: 'AS15133 EDGECAST',
        country: 'US',
      },
      redirectChain: ['https://example.com'],
      certificateSummary: {
        valid: true,
        subject: 'example.com',
        issuer: 'DigiCert TLS RSA SHA256 2020 CA1',
        expiresInDays: 240,
        keyType: 'RSA',
        keyBits: 2048,
        sigAlg: 'sha256WithRSAEncryption',
        sctCount: 3,
        flags: [],
      },
      websecSummary: {
        grade: 'A',
        headers: {
          hsts: true,
          csp: true,
          xFrameOptions: true,
          xContentTypeOptions: true,
          referrerPolicy: true,
          permissionsPolicy: true,
        },
        cookieFlags: { secure: true, httpOnly: true, sameSite: true },
        httpsEnforced: true,
        exposedPaths: []
      },
      engineStatus: { threat: 'ok', certificate: 'ok', websec: 'ok', intel: 'ok' },
      durationMs: 820,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'scan-badssl-expired',
      status: 'completed',
      inputUrl: 'https://expired.badssl.com',
      normalizedUrl: 'https://expired.badssl.com',
      finalUrl: 'https://expired.badssl.com',
      verdict: 'suspicious',
      score: 54,
      confidence: 0.94,
      risk: { threat: 10, certificate: 65, websec: 40, intel: 5 },
      reasons: [
        {
          code: 'EXPIRED',
          engine: 'certificate',
          severity: 'high',
          title: 'TLS Certificate has expired',
          detail: 'Certificate expired on 2015-04-12. Browsers display security interruption warnings.',
          weight: 40,
        }
      ],
      recommendation: 'Website certificate is invalid and expired. Do not trust encrypted data transfer.',
      explanation: 'expired.badssl.com has configuration anomalies. TLS certificate has expired.',
      domain: {
        name: 'expired.badssl.com',
        ageDays: 3200,
        registrar: 'NameCheap',
        ip: '104.154.89.105',
        asn: 'AS15169 Google LLC',
        country: 'US',
      },
      redirectChain: ['https://expired.badssl.com'],
      certificateSummary: {
        valid: false,
        subject: 'badssl.com',
        issuer: 'BadSSL Intermediate Certificate Authority',
        expiresInDays: -3800,
        keyType: 'RSA',
        keyBits: 2048,
        sigAlg: 'sha256WithRSAEncryption',
        sctCount: 0,
        flags: ['EXPIRED'],
      },
      engineStatus: { threat: 'ok', certificate: 'ok', websec: 'ok', intel: 'ok' },
      durationMs: 980,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    }
  ];

  for (const s of initialScans) {
    scans.set(s.id, s);
  }

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

  // 3. Seed Alerts
  const initialAlerts: Alert[] = [
    {
      id: 'alert-01',
      scanId: 'scan-paypa1-01',
      type: 'malicious_site',
      title: 'Malicious Brand Impersonation Detected',
      detail: 'paypa1-secure-login.com detected attempting brand spoofing of PayPal.',
      url: 'https://paypa1-secure-login.com/auth/verify',
      severity: 'high',
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-02',
      scanId: 'scan-badssl-expired',
      type: 'cert_issue',
      title: 'Expired Certificate Encountered',
      detail: 'expired.badssl.com has an expired TLS certificate chain.',
      url: 'https://expired.badssl.com',
      severity: 'medium',
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'alert-03',
      type: 'watchlist',
      title: 'Watchlist Expiry Warning: api.trustify-demo.org',
      detail: 'Certificate expires in 11 days. Scheduled renewal recommended.',
      url: 'https://api.trustify-demo.org',
      severity: 'medium',
      isRead: true,
      isDismissed: false,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    }
  ];

  for (const a of initialAlerts) {
    alerts.set(a.id, a);
  }

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

