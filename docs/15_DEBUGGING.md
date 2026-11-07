# 15 · DEBUGGING — Playbook

## 1. Method (use every time)
1. **Reproduce** reliably (minimal URL/steps).  2. **Locate** layer: UI → API → worker → engine → external.  3. **Inspect** logs by `request_id`.  4. **Hypothesise** one cause; change one thing.  5. **Add a regression test**.  6. **Document** in the table at the bottom.
Agent rule: after 2 failed fixes, stop, summarise evidence, ask human.

## 2. Observability Tools
- `docker compose logs -f api worker web` · filter: `| grep <request_id>`
- Every response has `X-Request-ID`; error envelope includes it; UI error toast shows "Ref: abc123".
- API docs / try-it: `localhost:8000/docs` · Metrics: `/metrics` · Queue: `celery -A app.workers.celery_app inspect active`
- DB: `docker compose exec postgres psql -U fraud fraudguard` → `SELECT status,count(*) FROM scans GROUP BY 1;`
- Redis: `redis-cli monitor` (dev only), `redis-cli keys 'scan:*'`
- Frontend: React Query Devtools, browser Network tab (SSE shows under EventStream), Antigravity browser agent recordings.
- Debug flags: `LOG_LEVEL=debug`, `DEBUG_ENGINES=true` (dump raw engine output to `scan_results.raw`).

## 3. Common Problems & Fixes
| Symptom | Likely cause | Check / Fix |
|---|---|---|
| Scan stuck at "queued" | worker down / wrong Redis URL / queue name mismatch | `docker compose ps`; worker logs; same `REDIS_URL` in api & worker |
| SSE shows nothing / drops | proxy buffering, missing `Cache-Control: no-cache`, `X-Accel-Buffering: no` | add headers; disable gzip for `text/event-stream`; send heartbeat every 15 s |
| `SSRF_BLOCKED` on a public site | DNS returns private IP, or IPv6 ULA, or CDN anycast edge case | log resolved IPs; verify guard logic; never disable the guard — add test then fix |
| Cert check times out | SNI missing, firewall, host only on non-443 | pass `server_hostname`; try port param; fall back to `NO_TLS` |
| `CERTIFICATE_VERIFY_FAILED` in our own client | using `certifi` bundle vs system; we intentionally fetch with verification **off** for analysis but never send secrets | analysis connection uses `CERT_NONE` + manual validation; normal fetches keep verify on |
| crt.sh slow/500 | public service flakiness | timeout 5 s, cached; show "CT data unavailable" (no score penalty) |
| ML model false positives on popular sites | missing allowlist / feature drift | check Tranco allowlist hit; inspect SHAP top features; retrain with more benign |
| Model file not found in container | not built/copied | `make train-model`; mount `ml/` volume; fallback heuristics log a warning |
| 401 loops in frontend | refresh cookie not sent (SameSite/secure/CORS credentials) | `fetch(..., {credentials:'include'})`; CORS `allow_credentials=True` + exact origin; `COOKIE_SECURE=false` on http dev |
| CORS error | origin mismatch | `CORS_ORIGINS` env; no trailing slash |
| Alembic "multiple heads" | parallel migrations by agents | `alembic merge heads`; one agent owns migrations |
| `asyncpg` "another operation in progress" | shared session across tasks | session per request/task; no `gather` on same session |
| Hydration mismatch (Next.js) | date/random in SSR vs client | format dates client-side; `suppressHydrationWarning` only as last resort |
| Charts blank | zero-height container / SSR | give parent fixed height; dynamic import with `ssr:false` |
| Colour looks off / low contrast | hard-coded hex | grep for `#` in components; use tokens |
| Playwright container crash | missing shm / seccomp | `--shm-size=1gb`, `--ipc=host` in dev |
| Docker build slow | no layer cache / large context | `.dockerignore`, multi-stage, pin deps |
| Rate limit hits during demo | same IP | whitelist demo IP via `RATE_LIMIT_ALLOWLIST`; use logged-in user limit |
| Duplicate alerts | scan retried by Celery | idempotency key `(scan_id,type)` unique index |

## 4. Debugging the Scan Pipeline (step-through)
```bash
# 1. Run a scan directly in the shell
docker compose exec api python -m app.scripts.scan_cli https://example.com --verbose
# 2. Run a single engine
docker compose exec api python -m app.scripts.engine_cli certificate example.com
# 3. Inspect stored raw output
psql -c "select engine_status, raw->'certificate' from scan_results order by scan_id desc limit 1;"
```
Each engine must be runnable alone (CLI) — a requirement for fast debugging. Timing breakdown logged per stage (`stage_ms`).

## 5. Debugging with Antigravity
- Ask the agent to **reproduce via browser first** and attach the recording + console/network logs before proposing a fix.
- Prompt: *"Bug: <symptom>. Reproduce using the browser at 1440 px, capture console + network errors with request_id, find root cause in logs, propose a minimal fix + regression test. Do not refactor unrelated code."*
- Ban speculative large rewrites; require a diff summary and test evidence.
- Context hygiene: if the agent loops, start a new conversation with: the bug, the request_id, relevant file paths, and what was already tried.

## 6. Live-Demo Emergency Plan
1. Toggle `MOCK_EXTERNAL=true` + restart api/worker (fixture results, no network).
2. Pre-scanned URLs cached in Redis/DB → demo from **History**.
3. Backup: recorded 3-min video + screenshots in `/docs/demo/`.
4. Second laptop/hotspot ready; `docker compose up` tested offline with images pre-pulled.
5. Keep a "known-good" git tag: `demo-ready`.

## 7. Post-Mortem / Known Issues Log
| Date | Symptom | Root cause | Fix | Test added |
|---|---|---|---|---|
| | | | | |
