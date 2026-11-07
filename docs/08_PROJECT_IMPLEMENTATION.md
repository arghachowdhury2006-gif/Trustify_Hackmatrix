# 08 · PROJECT IMPLEMENTATION — Phased Build Plan

> Hackathon-oriented. Assumes ~36–48 hours; scale phases to your time. Each phase ends with a **demoable increment** and a verification checklist. Run phases in order; inside a phase, agents can work in parallel (see 06_AGENTS roles).

## Timeline Overview
| Phase | Goal | Est. | Output |
|---|---|---|---|
| 0 | Repo, tooling, docs, Docker | 1.5 h | `make dev` boots empty stack |
| 1 | DB + Auth + API skeleton + design system | 4 h | login works, app shell renders |
| 2 | Scan pipeline (fetch, SSRF guard, scoring) + Scan page | 6 h | URL → verdict (heuristics) |
| 3 | Certificate engine + Certificate page | 5 h | cert analysis + CT timeline |
| 4 | Threat ML engine + feeds | 6 h | ML verdict + reasons |
| 5 | WebSec engine | 3 h | headers/cookie findings |
| 6 | Dashboard, Alerts, History | 5 h | live KPIs & charts |
| 7 | Threat Intel community | 4 h | report/vote/feed |
| 8 | Settings, Help, API keys, MCP server | 3 h | public API + MCP tools |
| 9 | QA, polish, a11y, perf, seed, demo | 5 h | demo-ready |

---
## Phase 0 — Foundation
Tasks: init monorepo (layout in 03), `docker-compose.yml` (web, api, worker, postgres, redis), `.env.example`, `Makefile`, ESLint/Ruff/Prettier, GitHub Actions CI, copy docs to `/docs`, `AGENTS.md` to root, `.agent/rules`.
**Verify**: `docker compose up` → web :3000 shows placeholder, api `/health` 200.

## Phase 1 — Core Platform
1. Alembic migration for users, refresh_tokens, domains, scans, scan_results, scan_findings (04).
2. Auth endpoints (register/login/refresh/logout/me) with Argon2id + JWT (11).
3. Global error envelope, request-id, CORS, rate limiter.
4. **Design system**: `tokens.css`, Tailwind theme, shadcn components restyled, AppShell (Sidebar + Topbar), Auth pages.
5. Typed API client generated from OpenAPI.
**Verify**: register → login → see empty dashboard shell; unauthorised routes redirect.

## Phase 2 — Scan Pipeline (vertical slice)
1. `ssrf_guard.py` + `safe_http.py` (+ unit tests with private IP/redirect/rebinding cases) — **do this first**.
2. URL normaliser (punycode, strip fragments, default scheme).
3. Orchestrator + Celery task + Redis pub/sub + SSE endpoint.
4. Scoring service with stub engines returning mock risk → verify full flow.
5. Frontend `/scan`: input, ProgressTimeline (SSE), VerdictHero, reasons list, tabs shell.
**Verify**: scanning `example.com` shows live stages then verdict; scanning `http://127.0.0.1` returns `SSRF_BLOCKED`.

## Phase 3 — Certificate Engine
1. TLS fetch (SNI) → parse chain with `cryptography`; flags per 03 §5.2.
2. CT lookup via crt.sh (timeout 5 s, cache 12 h); anomaly rules.
3. Weak-key analysis (small-factor test, SPKI duplicate query, bad fingerprint list).
4. `/certificates/check` + `/certificates/ct/{domain}`; Certificate page with chain graphic + CT timeline.
**Verify**: badssl.com hosts produce the expected flags (see 14).

## Phase 4 — Threat Engine
1. `features.py` (URL, DNS/WHOIS, HTML features), brand list seed, homoglyph/lookalike module.
2. Dataset prep script (`ml/dataset/README`): download OpenPhish/URLhaus + Tranco sample; build CSV; `train.py` → `model.joblib` (+ metrics report, feature importances).
3. Inference service + reason-code mapping; heuristic fallback.
4. Feed ingestion job (hourly) into `feed_entries`; Safe Browsing / VirusTotal clients (optional keys).
**Verify**: held-out precision ≥ 0.90; lookalike fixtures flagged with explanation.

## Phase 5 — WebSec Engine
Headers, cookies, mixed content, redirects, disclosure; scoring table; findings with fix hints ("Add `Strict-Transport-Security`").

## Phase 6 — Dashboard / Alerts / History
Counters on scan completion; `/dashboard/summary`; Recharts donut/line/bars; KPI cards with delta; alerts generation rules (verdict≠safe, cert expiring, CT anomaly); alerts page; history table with filters/CSV export.
**Verify**: dashboard numbers match DB; badge count updates.

## Phase 7 — Threat Intelligence Community
Report form + modal, dedupe by domain, voting, reporter reputation (+1 verified, −2 rejected), trending query, IOC export; community_risk plugged into scoring.

## Phase 8 — Settings, Help, Public API, MCP
API keys (hash, show once), watchlist, notification prefs, FAQ/help/contact; `/public/check`; MCP server (12).

## Phase 9 — Hardening & Demo
Full QA pass (14), accessibility audit, Lighthouse, empty/error states, seed script with 30 days of data, README GIF, 3-min demo script rehearsal, backup screenshots, **offline demo mode** (cached fixtures if Wi-Fi fails).

---
## Cross-Cutting Checklists
**Per phase exit**: lint ✔ tests ✔ no console errors ✔ docs updated ✔ screenshot ✔.
**Risk Register**
| Risk | Mitigation |
|---|---|
| External APIs rate-limit/slow | cache, timeouts, `partial` results, mock mode `MOCK_EXTERNAL=true` |
| ML dataset time sink | start with heuristic scoring; ML is an upgrade, ship fallback |
| Wi-Fi fails at demo | fixtures + local mock threat host |
| Scope creep | PRD MUST list only; extras after Phase 9 |
| SSRF bug | write SSRF tests first; reviewed by Security agent |

## Suggested Antigravity Kickoff Prompts
1. *"Read /docs and AGENTS.md. Produce an implementation plan artifact for Phase 0 and Phase 1 only. Do not write code yet."*
2. After approval: *"Execute Phase 0. Verify with `docker compose up` and show a screenshot of the running web app."*
3. Then per phase: *"Execute Phase N from docs/08. Spawn Backend, Frontend, QA agents per AGENTS.md roles. Return screenshots, test results, and a summary."*
