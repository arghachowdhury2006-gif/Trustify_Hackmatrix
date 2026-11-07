# 10 · FEATURE DEVELOPMENT — How to Build Each Feature

> A repeatable workflow so Antigravity agents ship features consistently. Use as the template for every F-item in the PRD.

## 1. Feature Workflow (7 steps)
1. **Spec** – restate acceptance criteria (PRD) in Given/When/Then.
2. **Contract** – add/adjust schema in 04 and endpoint in 05; regenerate OpenAPI types.
3. **Backend** – model → migration → schema → service → route → unit tests.
4. **Frontend** – mock against OpenAPI, build components with tokens, wire to API, add loading/empty/error.
5. **Verify** – Antigravity browser agent clicks the flow, records video + screenshots at 375/768/1440 px.
6. **Test** – unit + integration + one e2e path.
7. **Document** – update docs, add CHANGELOG line.

## 2. Feature Cards

### F1/F2 — URL Scan & Threat Analysis
- **Given** a logged-in or guest user **When** they submit a URL **Then** they see staged progress and a verdict with ≥ 3 reasons in ≤ 3 s (cached) / ≤ 10 s (deep).
- Backend: `services/url_normalizer.py` → `ssrf_guard.py` → `scan_orchestrator.py` → `engines/threat/*`.
- Frontend: `components/scan/{ScanInput,ProgressTimeline,VerdictHero,ReasonList,ResultTabs}.tsx`.
- Edge cases: unreachable host (verdict from DNS/cert/intel, `partial`), redirect loops, huge pages, non-HTML content, punycode, IP URL, URL shorteners (expand), login-required pages.

### F3 — Certificate Check
- Given a hostname → chain graphic, flags, CT timeline in ≤ 6 s.
- Components: `ChainGraphic`, `CertDetailGrid`, `CtTimeline`, `FlagList`, `WeakKeyCard`.
- Edge: non-443 ports, SNI-required, no TLS (plain HTTP → flag `NO_TLS`), IPv6, wildcard.

### F4 — Web Security Assessment
- Output list of findings with *what / why it matters / how to fix*. Grade A–F derived from websec_risk (display next to score).

### F5 — Dashboard
- Pull `/dashboard/summary`; animate counters; donut + line + bars; Recent Alerts (max 5). Skeleton while loading; "No scans yet — Scan your first website" empty state.

### F6/F7 — Alerts & History
- Alert creation rule table:
| Trigger | Severity | Title |
|---|---|---|
| verdict malicious | high | "Malicious Website Detected" |
| verdict suspicious | medium | "Suspicious Activity" |
| cert expiring ≤ 14 d (watchlist) | medium | "Certificate expiring" |
| CT anomaly on watchlist | high | "Unexpected certificate issued" |
| cert valid on watchlist scan | low | "Certificate Valid" |
- History: URL search (trigram), verdict filter, date range, CSV export, bulk delete.

### F8 — Threat Intelligence
- Report → dedupe → moderation status `pending`; auto-verify when ≥ 3 independent reports **or** feed hit. Voting one per user. Reputation changes. Feed sorted by `new` or `top`.

### F9/F10 — Auth, Settings, Help
- See 11. Settings tabs persist immediately with optimistic UI + toast.

## 3. Reason Code Catalogue (single source for UI copy)
| Code | Engine | Severity | User-facing title |
|---|---|---|---|
| BRAND_LOOKALIKE | threat | high | Pretends to be {brand} |
| NEW_DOMAIN_LT_30D | threat | medium | Domain registered {n} days ago |
| LOGIN_FORM_OFFDOMAIN | threat | high | Password form sends data to another site |
| REDIRECT_CHAIN_LONG | threat | medium | Multiple suspicious redirects |
| OBFUSCATED_JS | threat | medium | Hidden or scrambled code |
| FEED_HIT | intel | critical | Listed in {source} threat feed |
| COMMUNITY_REPORTS | intel | high | Reported by {n} users |
| EXPIRED / SELF_SIGNED / HOSTNAME_MISMATCH | certificate | high | Certificate problem |
| WEAK_KEY / SHA1_SIGNATURE | certificate | high | Weak cryptography |
| NO_SCT | certificate | low | No Certificate Transparency proof |
| CT_UNEXPECTED_ISSUER | certificate | high | Certificate issued by unexpected authority |
| SHARED_KEY | certificate | critical | Same private key used by unrelated sites |
| MISSING_HSTS / MISSING_CSP / INSECURE_COOKIE | websec | low–medium | Missing protection |
Add new codes here first, then in code.

## 4. Adding a New Engine Check (`/add-engine-check` workflow)
1. Add code to catalogue above. 2. Implement in engine module returning `Finding`. 3. Add weight to `scoring.py` config (YAML, not hard-coded). 4. Unit test with positive & negative fixture. 5. UI copy automatic via catalogue. 6. Update PRD if user-visible.

## 5. Adding a New Page (`/new-page`)
Route in `app/(app)/<name>/page.tsx` · use `PageHeader` · data via React Query hook · states (loading/empty/error) · add to Sidebar · a11y check · Playwright smoke test.

## 6. Performance Budget
Initial JS ≤ 200 KB gz per route; LCP ≤ 2.5 s; API p95 ≤ 300 ms (non-scan); images lazy + WebP; charts dynamic-imported.

## 7. UX Polish Checklist (user satisfaction)
- [ ] Paste-and-go: Ctrl+V into search auto-focuses and Enter scans
- [ ] Never show raw errors — friendly message + retry
- [ ] Every number has a unit/label; every icon has a tooltip/aria-label
- [ ] Copy is reassuring and actionable
- [ ] Consistent spacing; no layout shift; smooth skeletons
- [ ] Keyboard: `/` focuses search, `Esc` closes modals
- [ ] Dark-teal sidebar and cream cards identical across pages
