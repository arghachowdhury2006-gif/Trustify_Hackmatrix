# 03 · ARCHITECTURE — System Design

> Antigravity agents: follow this architecture exactly. If you must deviate, record an ADR at the bottom of this file.

## 1. Tech Stack (decided — do not change)
| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts + TanStack Query** | Fast to build, SSR, great DX |
| Backend API | **FastAPI (Python 3.11)** + Pydantic v2 + SQLAlchemy 2 + Alembic | Async, ML/security libs are Python-native |
| Workers | **Celery + Redis** (or `arq`) | Long scans off the request path |
| DB | **PostgreSQL 16** | Relational + JSONB for raw scan data |
| Cache/Queue/Rate-limit | **Redis 7** | Result cache, pub/sub for scan progress, rate limiting |
| ML | **scikit-learn / XGBoost**, `joblib` model artifact | Lightweight, explainable (SHAP/feature importance) |
| Headless browser | **Playwright (Chromium) in isolated container** | Screenshots, DOM/form analysis |
| LLM (optional) | Claude / Gemini API | Plain-language explanation; deterministic fallback |
| Infra | **Docker Compose** (dev + demo), optional Render/Fly/Vercel | Zero-friction hackathon deploy |
| CI | GitHub Actions | lint + test + build |

## 2. High-Level Diagram
```
                    ┌───────────────────────────────────────┐
  Browser  ───────► │  Next.js Frontend (SSR + client)      │
  Extension (opt.)  └───────────────┬───────────────────────┘
                                    │ HTTPS / JSON + SSE
                           ┌────────▼─────────┐
                           │  FastAPI Gateway │  auth · rate limit · validation
                           └───┬─────────┬────┘
                 enqueue scan  │         │ read/write
                   ┌───────────▼──┐   ┌──▼───────────┐     ┌───────────┐
                   │ Redis        │   │ PostgreSQL   │     │ Object    │
                   │ queue/cache/ │   │ users, scans,│     │ storage   │
                   │ pubsub       │   │ certs, intel │     │ screenshots│
                   └───────┬──────┘   └──────────────┘     └───────────┘
                           │ consume
                  ┌────────▼───────────────────────────────────────┐
                  │ Scan Worker (Celery) – Orchestrator             │
                  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────┐ │
                  │  │ Threat   │ │ Cert     │ │ WebSec    │ │Intel│ │
                  │  │ Engine   │ │ Engine   │ │ Engine    │ │Eng. │ │
                  │  └──────────┘ └──────────┘ └───────────┘ └────┘ │
                  └──────┬───────────────┬───────────────┬─────────┘
                         │               │               │
                 SSRF-safe fetcher   crt.sh / CT      Threat feeds
                 + Playwright sandbox  logs           (OpenPhish, URLhaus,
                                                       PhishTank, Safe Browsing)
```

## 3. Repository Layout (monorepo)
```
fraudguard/
├─ apps/
│  ├─ web/                    # Next.js
│  │  ├─ app/(auth)/login, register
│  │  ├─ app/(app)/page.tsx (dashboard), scan, certificate, intel, alerts, history, settings, help
│  │  ├─ components/ui, components/charts, components/scan
│  │  ├─ lib/api.ts, lib/auth.ts, lib/format.ts
│  │  └─ styles/tokens.css
│  └─ api/                    # FastAPI
│     ├─ app/main.py
│     ├─ app/core/ (config, security, rate_limit, logging)
│     ├─ app/api/v1/ (auth, scans, certificates, intel, alerts, history, users, public, health)
│     ├─ app/models/ (SQLAlchemy)  app/schemas/ (Pydantic)
│     ├─ app/services/ (scan_orchestrator, scoring, ssrf_guard, cache)
│     ├─ app/engines/ (threat/, certificate/, websec/, intel/)
│     ├─ app/workers/celery_app.py, tasks.py
│     ├─ ml/ (train.py, features.py, model.joblib, dataset/README)
│     └─ alembic/
├─ mcp/fraudguard_mcp/        # MCP server exposing scan tools
├─ docs/                      # these 15 docs
├─ docker-compose.yml  .env.example  Makefile
└─ .github/workflows/ci.yml
```

## 4. Scan Pipeline (core flow)
1. `POST /api/v1/scans` → validate + normalise URL → **SSRF guard** → cache lookup.
2. Cache hit → return instantly. Miss → insert `scans(status=queued)` → enqueue `run_scan(scan_id)`.
3. Client opens `GET /api/v1/scans/{id}/events` (SSE) for progress.
4. Worker runs stages (parallel where possible, per-stage timeout 4 s):
   - **S1 Resolve**: DNS (A/AAAA/NS/MX), WHOIS/RDAP domain age, IP geo/ASN.
   - **S2 Fetch**: redirect chain (max 8 hops) via SSRF-safe HTTP client; final URL, status, headers, body (≤ 1 MB).
   - **S3 Certificate Engine**.
   - **S4 Threat Engine**.
   - **S5 WebSec Engine**.
   - **S6 Intel Engine** (feeds + community reports + CT anomalies).
   - **S7 Scoring + Explanation**.
5. Persist `scan_results` + `scan_findings`; create `alerts` if verdict ≠ Safe; publish `done` event; update cache + dashboard aggregates.

## 5. Engines (details)
### 5.1 Threat Engine
Features (≈ 40): URL length, digits ratio, special chars, subdomain depth, entropy, suspicious TLD, punycode/IDN, `@` in URL, IP-as-host, URL shorteners, brand keywords (`login`, `secure`, `verify`, `bank`), **brand lookalike** (Levenshtein/Jaro-Winkler + homoglyph map against Top-N brand list), domain age, DNS TTL anomalies, redirect count/cross-domain, HTML signals (password input + off-domain form action, hidden iframes, obfuscated JS `eval/atob`, favicon mismatch, missing/mismatching title vs domain), page-text brand mention vs domain.
Model: XGBoost classifier → probability `p_malicious`. Explanations via top-k feature contributions mapped to **reason codes** (e.g. `BRAND_LOOKALIKE`, `NEW_DOMAIN_<30D`, `LOGIN_FORM_OFFDOMAIN`).
Training data: PhishTank / OpenPhish / URLhaus (malicious) + Tranco top-1M (benign). Ship pre-trained `model.joblib` + `train.py`. Heuristic rule-engine fallback if model missing.

### 5.2 Certificate Engine (eMudhra-inspired)
- Retrieve chain with `ssl` + `cryptography`.
- Checks → flags: `EXPIRED`, `EXPIRES_SOON(<14d)`, `SELF_SIGNED`, `HOSTNAME_MISMATCH`, `UNTRUSTED_ROOT` (not in certifi store), `INCOMPLETE_CHAIN`, `WEAK_KEY` (RSA<2048, EC<256), `SHA1_SIGNATURE`, `NO_SCT` (no Certificate Transparency proof), `VERY_LONG_VALIDITY(>398d)`, `WILDCARD_RISK`, `REVOKED` (OCSP/CRL best effort).
- **Weak-key heuristics** (CA key-generation weakness class of bugs): RSA public exponent anomalies, small prime factor test on modulus (trial division by first N primes), **shared-modulus / duplicate public key across unrelated domains** (hash SPKI and check in our DB + CT results), known-bad key fingerprint list (Debian weak keys / ROCA-vulnerable fingerprint check via public detector logic).
- **CT monitoring**: query crt.sh JSON for domain; flag certs from unexpected/new issuers, certs issued in last 30 d the owner did not request (watchlist), and rapid reissues. Store in `certificates` + `ct_entries`.
- Output: chain graph, flags, CT timeline, `cert_risk` 0–100.

### 5.3 WebSec Engine (passive only)
Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), cookie flags (Secure/HttpOnly/SameSite), mixed content, HTTP→HTTPS redirect, `Server`/`X-Powered-By` version disclosure vs small known-outdated table, exposed common files via **HEAD/GET of 10 benign paths** (`/.git/HEAD`, `/.env`, `/robots.txt`, `/server-status`, `/admin`) — only on **domains the user claims to own OR rate-limited passive mode**; no port scans, no exploitation. `websec_risk` 0–100.

### 5.4 Intel Engine
- Local DB lookup of domain/IP/SPKI-hash.
- External: Google Safe Browsing v4, VirusTotal (domain), URLhaus, OpenPhish feed (cached hourly).
- Community: report count, weighted votes, reporter reputation → `community_risk`.
- Output includes IOC records.

## 6. Scoring (`services/scoring.py`)
```
risk = 0.40*threat_risk + 0.25*cert_risk + 0.20*websec_risk + 0.15*intel_risk   # each 0..100
score = round(100 - risk)
verdict = SAFE if score>=80 else SUSPICIOUS if score>=50 else MALICIOUS
overrides: feed_confirmed_malicious -> MALICIOUS (score<=10) ; allowlisted_top_domain & no flags -> SAFE
confidence = f(number of engines that completed, agreement between engines)
```
Return `reasons[]` sorted by contribution, each with `code`, `title`, `detail`, `severity`, `engine`, `weight`.

## 7. Security Architecture (summary; full doc = 11)
SSRF guard (block private/link-local/loopback/metadata IPs, re-validate after every redirect, DNS-rebinding safe by pinning resolved IP), sandboxed browser (no-network-to-internal, read-only FS, 10 s kill), JWT + refresh rotation, Argon2id, rate limits, CORS allow-list, CSP on frontend, secrets via env, dependency scanning.

## 8. Caching & Performance
- Key `scan:{sha256(normalised_url)}`; TTL 6 h (15 min if malicious, 24 h if allowlisted).
- Parallel engine execution with `asyncio.gather` and per-stage timeouts → `partial` results rather than failure.
- Dashboard aggregates via materialised counters updated on scan completion (no heavy queries on load).

## 9. Realtime
SSE endpoint per scan (`text/event-stream`), events: `stage`, `finding`, `done`, `error`. Redis pub/sub bridges worker → API.

## 10. Deployment
- `docker compose`: `web`, `api`, `worker`, `postgres`, `redis`, `browser` (playwright), `mcp`.
- Env: `.env.example` lists all variables (see 09_SETUP.md).
- Optional cloud: Vercel (web) + Render/Fly (api/worker) + Neon (Postgres) + Upstash (Redis).

## 11. Observability
JSON logs (`structlog`), request-id middleware, `/health` (liveness), `/ready` (db+redis), Prometheus `/metrics` (scan duration histogram, verdict counters, engine failure counters).

## 12. ADR Log
| # | Decision | Status |
|---|---|---|
| 1 | FastAPI over Node for ML/security ecosystem | Accepted |
| 2 | Passive-only web security checks for legal/safety reasons | Accepted |
| 3 | SSE over WebSockets for one-way progress | Accepted |
