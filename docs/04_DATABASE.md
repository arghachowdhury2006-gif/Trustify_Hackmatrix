# 04 · DATABASE — PostgreSQL 16 Schema

> Use SQLAlchemy 2 models + Alembic migrations. All PKs are UUID (`gen_random_uuid()`), all tables have `created_at`/`updated_at` (timestamptz, UTC). Never store plaintext passwords or API keys.

## 1. ER Overview
```
users 1─* scans 1─1 scan_results 1─* scan_findings
users 1─* alerts *─1 scans
users 1─* api_keys
users 1─* watchlist_domains
domains 1─* scans / certificates / threat_reports
certificates 1─* ct_entries (by domain)
users 1─* threat_reports 1─* report_votes *─1 users
brands (reference), feed_entries (external intel), audit_logs
```

## 2. Tables (DDL)
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE verdict AS ENUM ('safe','suspicious','malicious','unknown');
CREATE TYPE scan_status AS ENUM ('queued','running','completed','partial','failed');
CREATE TYPE severity AS ENUM ('low','medium','high','critical');
CREATE TYPE threat_category AS ENUM ('phishing','malware','spyware','scam','fake_recruitment','fake_payment','impersonation','other');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                -- argon2id
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',          -- user | analyst | admin
  reputation INT NOT NULL DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  notif_prefs JSONB DEFAULT '{"email":true,"inapp":true}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL, family_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ,
  user_agent TEXT, ip INET, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT, prefix TEXT NOT NULL, key_hash TEXT NOT NULL,   -- show prefix only
  last_used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                  -- punycode lowercase registrable domain/host
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  registered_at TIMESTAMPTZ, registrar TEXT,
  is_allowlisted BOOLEAN DEFAULT FALSE,
  reputation_score INT                         -- latest trust score cache
);
CREATE INDEX idx_domains_trgm ON domains USING gin (name gin_trgm_ops);

CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,   -- null = guest
  guest_fingerprint TEXT,
  domain_id UUID REFERENCES domains(id),
  input_url TEXT NOT NULL, normalized_url TEXT NOT NULL, url_hash CHAR(64) NOT NULL,
  status scan_status NOT NULL DEFAULT 'queued',
  from_cache BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ, finished_at TIMESTAMPTZ, duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_scans_user_created ON scans(user_id, created_at DESC);
CREATE INDEX idx_scans_hash ON scans(url_hash);

CREATE TABLE scan_results (
  scan_id UUID PRIMARY KEY REFERENCES scans(id) ON DELETE CASCADE,
  verdict verdict NOT NULL, score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence NUMERIC(4,3),
  threat_risk SMALLINT, cert_risk SMALLINT, websec_risk SMALLINT, intel_risk SMALLINT,
  final_url TEXT, redirect_chain JSONB, ip INET, asn TEXT, country CHAR(2),
  screenshot_path TEXT, explanation TEXT,
  engine_status JSONB,            -- {"threat":"ok","cert":"ok","websec":"timeout","intel":"ok"}
  raw JSONB                       -- full engine outputs
);

CREATE TABLE scan_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  engine TEXT NOT NULL,           -- threat|certificate|websec|intel
  code TEXT NOT NULL,             -- e.g. BRAND_LOOKALIKE
  title TEXT NOT NULL, detail TEXT, severity severity NOT NULL, weight NUMERIC(5,2),
  evidence JSONB
);
CREATE INDEX idx_findings_scan ON scan_findings(scan_id);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id),
  fingerprint_sha256 CHAR(64) UNIQUE NOT NULL,
  spki_sha256 CHAR(64) NOT NULL,                  -- for shared-key detection
  subject_cn TEXT, issuer_cn TEXT, issuer_org TEXT, serial TEXT,
  sans TEXT[], not_before TIMESTAMPTZ, not_after TIMESTAMPTZ,
  key_type TEXT, key_bits INT, sig_alg TEXT, sct_count INT,
  chain_pem TEXT, flags TEXT[], risk SMALLINT, first_seen_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cert_spki ON certificates(spki_sha256);
CREATE INDEX idx_cert_domain ON certificates(domain_id);

CREATE TABLE ct_entries (
  id BIGSERIAL PRIMARY KEY,
  domain_id UUID REFERENCES domains(id),
  ct_log_id BIGINT, issuer_name TEXT, common_name TEXT, name_value TEXT,
  not_before TIMESTAMPTZ, not_after TIMESTAMPTZ, logged_at TIMESTAMPTZ,
  is_anomalous BOOLEAN DEFAULT FALSE, UNIQUE (domain_id, ct_log_id)
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  type TEXT NOT NULL,             -- malicious_site|suspicious_activity|cert_issue|ct_anomaly|watchlist
  title TEXT NOT NULL, detail TEXT, url TEXT, severity severity NOT NULL,
  is_read BOOLEAN DEFAULT FALSE, is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read, created_at DESC);

CREATE TABLE threat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) NOT NULL,
  url TEXT NOT NULL, category threat_category NOT NULL, description TEXT,
  evidence_path TEXT, status TEXT DEFAULT 'pending',    -- pending|verified|rejected
  upvotes INT DEFAULT 0, downvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reports_domain ON threat_reports(domain_id);
CREATE INDEX idx_reports_created ON threat_reports(created_at DESC);

CREATE TABLE report_votes (
  report_id UUID REFERENCES threat_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  value SMALLINT CHECK (value IN (-1,1)), created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

CREATE TABLE feed_entries (            -- external threat intel
  id BIGSERIAL PRIMARY KEY, source TEXT NOT NULL,   -- openphish|urlhaus|phishtank
  indicator TEXT NOT NULL, indicator_type TEXT NOT NULL,  -- url|domain|ip
  category TEXT, first_seen TIMESTAMPTZ, last_seen TIMESTAMPTZ,
  UNIQUE (source, indicator)
);

CREATE TABLE brands (                  -- impersonation reference list
  id SERIAL PRIMARY KEY, name TEXT, official_domains TEXT[], keywords TEXT[], category TEXT
);

CREATE TABLE watchlist_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id), expected_issuers TEXT[],
  notify_days_before_expiry INT DEFAULT 14, UNIQUE (user_id, domain_id)
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY, user_id UUID, action TEXT, entity TEXT, entity_id TEXT,
  ip INET, meta JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Dashboard Aggregates
```sql
CREATE MATERIALIZED VIEW daily_scan_stats AS
SELECT date_trunc('day', s.created_at) AS day, s.user_id,
       count(*) total,
       count(*) FILTER (WHERE r.verdict='safe') safe,
       count(*) FILTER (WHERE r.verdict='suspicious') suspicious,
       count(*) FILTER (WHERE r.verdict='malicious') malicious,
       avg(s.duration_ms) avg_ms
FROM scans s JOIN scan_results r ON r.scan_id=s.id GROUP BY 1,2;
```
Refresh via Celery beat every minute, or compute incrementally with Redis counters (preferred for the demo).

## 4. Redis Keys
| Key | Purpose | TTL |
|---|---|---|
| `scan:{url_hash}` | cached result JSON | 6 h / 15 min |
| `scan:{id}:events` | pub/sub channel | – |
| `rl:{ip}:{route}` | rate limit counters | window |
| `stats:{user}:{yyyymmdd}` | hash of counters | 8 d |
| `feed:openphish` | cached feed set | 1 h |

## 5. Seed Data
- `brands`: top ~100 (PayPal, SBI, HDFC, ICICI, Google, Microsoft, Amazon, Flipkart, Paytm, PhonePe, Aadhaar/UIDAI, IRCTC, Instagram, WhatsApp, LinkedIn, Naukri, …) with official domains.
- Demo user + 30 days of synthetic scans so charts look alive.
- Allowlist: Tranco top 1,000.

## 6. Migration Rules
One Alembic revision per change; never edit applied migrations; `alembic upgrade head` runs in `api` container entrypoint.
