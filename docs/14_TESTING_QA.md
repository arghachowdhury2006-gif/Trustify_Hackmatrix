# 14 · TESTING & QA

> Goal: the demo never breaks. Test pyramid: many fast unit tests, fewer integration tests, a handful of e2e flows. Antigravity QA agent runs `make test` and `make e2e` after every task and attaches results.

## 1. Test Pyramid & Tools
| Level | Backend | Frontend |
|---|---|---|
| Unit | pytest, pytest-asyncio, respx | Vitest + Testing Library |
| Integration | pytest + test Postgres/Redis (docker) | MSW (mock API) |
| E2E | – | Playwright (Chromium, 3 viewports) |
| Static | ruff, mypy, bandit | ESLint, tsc, axe-core |
| Security | pip-audit, SSRF/IDOR suites | npm audit, CSP check |
| ML | metrics script, golden samples | – |

Coverage targets: backend services/engines ≥ 80 %, auth & SSRF ≥ 95 %, frontend critical components ≥ 70 %.

## 2. Test Fixtures (safe, deterministic)
| Fixture | Purpose |
|---|---|
| `https://example.com` | benign baseline |
| `https://expired.badssl.com` | EXPIRED |
| `https://self-signed.badssl.com` | SELF_SIGNED |
| `https://untrusted-root.badssl.com` | UNTRUSTED_ROOT |
| `https://wrong.host.badssl.com` | HOSTNAME_MISMATCH |
| `https://sha1-intermediate.badssl.com` | SHA1_SIGNATURE |
| `https://rsa1024.badssl.com` (if available) | WEAK_KEY |
| `http://neverssl.com` | NO_TLS |
| Local **mock phishing server** (`tests/fixtures/phish_site/`) | password form → off-domain action, lookalike title, obfuscated JS |
| Lookalike domain list (strings only, no network) | `paypa1.com`, `rnicrosoft.com`, `g00gle.com`, `sbi-secure-login.xyz` |
With `MOCK_EXTERNAL=true`, CI uses recorded payloads instead of live network.

## 3. Backend Test Matrix
**Unit**
- URL normaliser (IDN, fragments, creds, default scheme, long URLs)
- SSRF guard (full list in 11 §3) — **parametrised, ≥ 30 cases**
- Feature extraction (golden vectors)
- Lookalike/homoglyph scoring (`paypa1`→paypal ✔, `paypal-support.com` ✔, `payroll.com` ✘)
- Scoring: weights, overrides, thresholds boundary (49/50, 79/80)
- Certificate flags per fixture (use generated certs with `cryptography` for expired, weak key, SHA-1, mismatched SAN, self-signed)
- Weak-key detectors: small-factor modulus, duplicate SPKI
- Reason catalogue completeness (every code has title/detail template)
**Integration**
- Register/login/refresh rotation/reuse detection
- Full scan flow with stub engines → DB rows → alerts → dashboard counters
- Cache hit/miss + TTL; partial results when an engine times out
- SSE stream order of events
- Reports: dedupe, vote uniqueness, reputation changes
- IDOR: cross-user access returns 404
- Rate limit returns 429 with `Retry-After`

## 4. ML Evaluation
`make eval-model` outputs: precision, recall, F1, ROC-AUC, confusion matrix, false-positive rate on **top-1k benign** (must be < 1 %), feature importances. Gate: precision ≥ 0.90 & FPR ≤ 1 % else fall back to heuristics. Keep a `golden_urls.csv` (50 URLs with expected verdicts) as regression test.

## 5. Frontend Tests
- Component: VerdictBadge variants, ScoreRing, KPICard delta, SeverityPill, DataTable states
- Hooks: scan SSE hook (mock EventSource), auth refresh flow
- Forms: validation messages, disabled/loading state
- **Accessibility**: `axe` in Playwright on every page, 0 serious/critical violations; contrast of every token pair verified
- **Visual regression** (optional): Playwright screenshots for Dashboard, Scan result, Certificate page at 375/768/1440

## 6. E2E Scenarios (Playwright)
1. **Auth**: register → login → logout; protected route redirect.
2. **Scan safe**: paste `example.com` → progress → Safe badge → tabs render.
3. **Scan malicious (fixture)** → Malicious badge, BRAND_LOOKALIKE reason, alert appears with count badge.
4. **Certificate check**: expired.badssl.com → EXPIRED flag visible, chain graphic present.
5. **Report threat**: from result → submit → appears in Intel feed → vote.
6. **History**: filter by verdict, export CSV downloads.
7. **Settings**: create API key (shown once), revoke; public check with key.
8. **Responsive**: 375 px menu drawer works; no horizontal scroll.
9. **Error paths**: invalid URL message; blocked private IP message; API down → friendly error + retry.

## 7. Manual QA Checklist (pre-demo)
- [ ] Fresh clone → `docker compose up` works in < 5 min
- [ ] Every sidebar link loads, no console errors/warnings
- [ ] Dashboard matches mockup layout & palette (compare side by side)
- [ ] Verdict colours + icons correct; no colour-only meaning
- [ ] Tab order logical; focus ring visible; `/` focuses search
- [ ] Empty/loading/error states on every page
- [ ] Works Chrome, Firefox, Safari, mobile Chrome
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] Offline/mock demo mode works with Wi-Fi off
- [ ] Seed data present; demo account works

## 8. Performance Testing
`k6`/`locust` script: 50 concurrent cached scans → p95 < 300 ms; 10 concurrent uncached → p95 < 10 s, no worker crash. Check Redis hit ratio and memory.

## 9. CI Pipeline (`.github/workflows/ci.yml`)
Jobs: `lint` → `unit` → `integration (services: postgres, redis)` → `web build` → `e2e (mock mode)` → `security (pip-audit, npm audit, gitleaks, trivy)`. Block merge on failure. Cache deps.

## 10. Bug Report Template
```
Title · Severity (S1 demo-breaker … S4 cosmetic) · Steps · Expected · Actual · Screenshot/video · Logs (request_id) · Env
```
Triage rule in last 6 hours: only S1/S2 fixed; freeze features at T-6h.

## 11. Antigravity QA Agent Prompt
*"Act as QA. Read docs/14. Run `make lint test`. Then use the browser to execute E2E scenarios 1–9 at 375/768/1440 px, record screenshots, list failures with request_ids, and propose fixes as separate tasks. Do not modify production code."*
