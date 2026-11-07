# 01 · PRD — FraudGuard AI

> Product Requirements Document. Antigravity agents: treat this as the single source of truth for WHAT we build. Do not add features that are not listed here without updating this file first.

## 1. Product Summary
**FraudGuard AI** is a web platform that tells a user, in under ~3 seconds, whether a website is safe. It combines four engines into one trust score:
1. **Threat Analysis** – phishing / malware / brand-impersonation detection (ML + threat feeds)
2. **Web Security Assessment** – headers, exposed services, outdated software, risky redirects
3. **Certificate Validation** – TLS chain, key strength, Certificate Transparency (CT) monitoring (inspired by the eMudhra CA key-generation incident)
4. **Collaborative Threat Intelligence** – community reports, voting, shared blocklist

Tagline: *Detect · Analyze · Stay Safe*

## 2. Problem
Phishing, fake payment links, fake recruitment portals, impersonated organisations, malicious redirects, and credential harvesting are growing. Existing tools solve each problem separately. Weak CA practices (e.g. weak key generation) can allow forged certificates. Normal users cannot judge a site by looking at it.

## 3. Target Users
| Persona | Need |
|---|---|
| **Everyday user (Asha, 22 student)** | Paste a suspicious link from WhatsApp/SMS, get a clear Safe / Suspicious / Malicious verdict in plain language |
| **Job seeker / shopper** | Check fake recruitment portals and fake shops before paying |
| **SME owner / IT admin** | Check own domain's security posture and certificate health |
| **Security analyst** | Deep technical report, IOC export, certificate forensics, community intel |

## 4. Goals & Success Metrics (hackathon demo)
- Scan result in **≤ 3 s** (p95 for cached/fast path ≤ 1.5 s; full deep scan ≤ 10 s with progress streaming)
- Detect **≥ 90 % precision** on a held-out phishing/benign set
- Every verdict has a **human-readable explanation** (why it was flagged)
- Complete demo flow: scan → verdict → certificate view → report to community → appears in threat feed

## 5. Scope
### MUST (MVP – build first)
- **F1 URL Scan**: input URL → verdict (Safe / Suspicious / Malicious), score 0–100, reasons
- **F2 Threat Analysis engine**: lexical URL features, domain age, brand lookalike/homoglyph detection, redirect chain, threat-feed lookup, ML classifier
- **F3 Certificate Check**: chain validity, issuer, expiry, key type/size, signature algorithm, SAN match, SCT/CT presence, weak-key heuristics, CT log lookup (crt.sh)
- **F4 Web Security Assessment**: security headers (HSTS, CSP, X-Frame-Options, etc.), HTTP→HTTPS, cookies flags, server banner/outdated software hints, exposed common paths (safe passive checks only)
- **F5 Dashboard**: KPIs, security overview donut, 7-day trend, recent alerts, threat types, quick tools
- **F6 Alerts**: generated for malicious/suspicious scans and cert problems; mark read
- **F7 History**: all past scans, filter/search/export CSV
- **F8 Threat Intelligence**: community feed, report a URL, upvote/downvote, trending threats, IOC export
- **F9 Auth**: register/login, JWT sessions, profile, guest scan (rate-limited)
- **F10 Settings & Help**: profile, API key, notification prefs, FAQ/support form

### SHOULD (if time)
- Browser-extension-ready public API (`/api/v1/public/check`)
- Watchlist: monitor own domains' certificate expiry / new CT entries
- PDF report export
- Claude/LLM-generated plain-language explanation (with deterministic fallback)
- Screenshot of the page (sandboxed headless browser) for visual brand matching

### WON'T (explicitly out of scope)
- Active exploitation, port scanning of third-party hosts, or any intrusive testing
- Storing user credentials of scanned sites
- Mobile native app

## 6. Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | System SHALL accept http/https URLs, normalise them, and reject private/internal targets (SSRF protection) | MUST |
| FR-2 | System SHALL return a verdict, 0–100 trust score, and ≥ 3 reason codes | MUST |
| FR-3 | System SHALL stream scan progress (queued → DNS → TLS → content → ML → done) | MUST |
| FR-4 | System SHALL validate certificate chain and flag: expired, self-signed, hostname mismatch, weak key (<2048 RSA), SHA-1, untrusted/unknown CA, no SCTs | MUST |
| FR-5 | System SHALL query CT logs for certificates issued for a domain and highlight unexpected issuers | SHOULD |
| FR-6 | Users SHALL submit threat reports with category + evidence; others can vote | MUST |
| FR-7 | Scan results SHALL be cached (TTL 6 h; 15 min for malicious) | MUST |
| FR-8 | All user data endpoints SHALL require auth; guests limited to 10 scans/hour/IP | MUST |
| FR-9 | UI SHALL work on 360 px → 1920 px | MUST |
| FR-10 | Every result page SHALL show "Why?" explanation + recommended action | MUST |

## 7. Non-Functional Requirements
- **Security**: OWASP ASVS L1 baseline; SSRF-safe fetcher; no secrets in repo
- **Performance**: p95 API < 300 ms (excluding scan); scan p95 < 3 s
- **Accessibility**: WCAG 2.1 AA (contrast checked against palette, keyboard navigation, aria labels)
- **Reliability**: graceful degradation – if an external API fails, the scan still completes with a `partial` flag
- **Privacy**: scan URLs stored per-user only; community reports store domain, not reporter PII
- **Observability**: structured JSON logs, request IDs, `/health` and `/metrics`

## 8. Trust Score Model (summary — details in ARCHITECTURE.md)
`score = 100 − weighted_risk`, weights: Threat/ML 40 %, Certificate 25 %, Web security 20 %, Community/feeds 15 %.
Verdict: **≥ 80 Safe**, **50–79 Suspicious**, **< 50 Malicious**. Hard overrides: confirmed feed hit → Malicious.

## 9. Key User Flows
1. **Quick scan**: Landing/Dashboard → paste URL → progress → verdict card → tabs (Threat · Certificate · Security · Community) → Report / Share / Re-scan.
2. **Certificate deep dive**: Certificate Check → domain → chain visual, key details, CT timeline, risk flags.
3. **Report threat**: Result page → "Report this site" → category → submit → toast → appears in Threat Intelligence feed.
4. **Alert triage**: Alerts → filter by severity → open → mark read / block.

## 10. Demo Script (3 minutes)
1. Scan a known benign site → Safe, green.
2. Scan a lookalike (`paypa1-secure-login.example`) → Malicious, show brand impersonation reason.
3. Show cert page for an expired/self-signed test host (badssl.com) → flags.
4. Submit community report → live feed update.
5. Show dashboard analytics + API/MCP tool call.

## 11. Acceptance Criteria (definition of MVP done)
- [ ] All MUST items working end-to-end locally via `docker compose up`
- [ ] 15 test URLs (badssl.com set + known benign) give expected verdicts
- [ ] Lighthouse accessibility ≥ 90
- [ ] No console errors on any page
- [ ] README demo GIF recorded
