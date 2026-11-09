-- Trustify PostgreSQL 16 Production Schema
-- Compatible with Neon, Supabase, and Vercel Postgres

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN
  CREATE TYPE verdict AS ENUM ('safe','suspicious','malicious','unknown');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_status AS ENUM ('queued','running','completed','partial','failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE severity AS ENUM ('low','medium','high','critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE threat_category AS ENUM ('phishing','malware','spyware','scam','fake_recruitment','fake_payment','impersonation','other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  reputation INT NOT NULL DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  notif_prefs JSONB DEFAULT '{"email":true,"inapp":true}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  registered_at TIMESTAMPTZ,
  registrar TEXT,
  is_allowlisted BOOLEAN DEFAULT FALSE,
  reputation_score INT
);

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_fingerprint TEXT,
  domain_id UUID REFERENCES domains(id),
  input_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  url_hash CHAR(64) NOT NULL,
  status scan_status NOT NULL DEFAULT 'completed',
  from_cache BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_results (
  scan_id UUID PRIMARY KEY REFERENCES scans(id) ON DELETE CASCADE,
  verdict verdict NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence NUMERIC(4,3),
  threat_risk SMALLINT,
  cert_risk SMALLINT,
  websec_risk SMALLINT,
  intel_risk SMALLINT,
  final_url TEXT,
  redirect_chain JSONB,
  ip INET,
  asn TEXT,
  country CHAR(2),
  screenshot_path TEXT,
  explanation TEXT,
  engine_status JSONB,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  url TEXT,
  severity severity NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS threat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  category threat_category NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  upvotes INT NOT NULL DEFAULT 0,
  downvotes INT NOT NULL DEFAULT 0,
  reporter_reputation INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

