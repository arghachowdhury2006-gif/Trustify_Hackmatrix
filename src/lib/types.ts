export type Verdict = 'safe' | 'suspicious' | 'malicious' | 'unknown';
export type ScanStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ThreatCategory = 
  | 'phishing'
  | 'malware'
  | 'spyware'
  | 'scam'
  | 'fake_recruitment'
  | 'fake_payment'
  | 'impersonation'
  | 'other';

export interface Reason {
  code: string;
  engine: 'threat' | 'certificate' | 'websec' | 'intel';
  severity: Severity;
  title: string;
  detail: string;
  weight: number;
}

export interface CertNode {
  role: 'leaf' | 'intermediate' | 'root';
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  key: string;
  keyBits?: number;
  sigAlg: string;
  sctCount?: number;
  trusted?: boolean;
  fingerprintSha256?: string;
  spkiSha256?: string;
}

export interface WeakKeyAnalysis {
  smallFactorTest: 'pass' | 'fail' | 'skipped';
  knownBadFingerprint: boolean;
  sharedWithDomains: string[];
  exponentAnomaly?: boolean;
  rocaVulnerable?: boolean;
  riskSummary: string;
}

export interface CTEntry {
  id: string;
  issuerName: string;
  commonName: string;
  notBefore: string;
  notAfter: string;
  loggedAt: string;
  isAnomalous: boolean;
}

export interface CertificateSummary {
  valid: boolean;
  subject: string;
  issuer: string;
  expiresInDays: number;
  keyType: string;
  keyBits: number;
  sigAlg: string;
  sctCount: number;
  flags: string[];
  chain?: CertNode[];
  sans?: string[];
  weakKeyAnalysis?: WeakKeyAnalysis;
  ct?: {
    total: number;
    last30d: number;
    unexpectedIssuers: string[];
    entries?: CTEntry[];
  };
}

export interface WebsecSummary {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  headers: {
    hsts: boolean;
    csp: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    referrerPolicy: boolean;
    permissionsPolicy: boolean;
  };
  cookieFlags: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: boolean;
  };
  httpsEnforced: boolean;
  serverBanner?: string;
  exposedPaths: {
    path: string;
    status: number;
    exposed: boolean;
  }[];
}

export interface ScanResult {
  id: string;
  status: ScanStatus;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  verdict: Verdict;
  score: number; // 0-100
  confidence: number; // 0.0 - 1.0
  risk: {
    threat: number;
    certificate: number;
    websec: number;
    intel: number;
  };
  reasons: Reason[];
  recommendation: string;
  explanation: string;
  domain: {
    name: string;
    ageDays?: number;
    registrar?: string;
    ip?: string;
    asn?: string;
    country?: string;
  };
  redirectChain: string[];
  screenshotUrl?: string;
  certificateSummary?: CertificateSummary;
  websecSummary?: WebsecSummary;
  engineStatus: {
    threat: 'ok' | 'partial' | 'failed' | 'timeout';
    certificate: 'ok' | 'partial' | 'failed' | 'timeout';
    websec: 'ok' | 'partial' | 'failed' | 'timeout';
    intel: 'ok' | 'partial' | 'failed' | 'timeout';
  };
  durationMs: number;
  createdAt: string;
}

export interface ThreatReport {
  id: string;
  url: string;
  domain: string;
  category: ThreatCategory;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  upvotes: number;
  downvotes: number;
  reporterReputation: number;
  createdAt: string;
  userVoted?: 1 | -1;
}

export interface Alert {
  id: string;
  scanId?: string;
  type: 'malicious_site' | 'suspicious_activity' | 'cert_issue' | 'ct_anomaly' | 'watchlist';
  title: string;
  detail: string;
  url?: string;
  severity: Severity;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  key?: string; // only returned when generated
  createdAt: string;
  lastUsedAt?: string;
}

export interface WatchlistDomain {
  id: string;
  domain: string;
  addedAt: string;
  lastCheckedAt?: string;
  status: 'healthy' | 'warning' | 'critical';
  expiresInDays?: number;
  certIssuer?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  reputation: number;
}

export interface DashboardSummary {
  kpis: {
    totalScans: { value: number; deltaPct: number };
    safe: { value: number; deltaPct: number };
    threats: { value: number; deltaPct: number };
    avgResponseMs: { value: number; deltaPct: number };
  };
  overview: {
    safePct: number;
    suspiciousPct: number;
    maliciousPct: number;
    trend: { day: string; scoreAvg: number; scans: number }[];
  };
  threatTypes: { type: string; label: string; pct: number; count: number }[];
  recentAlerts: Alert[];
}

