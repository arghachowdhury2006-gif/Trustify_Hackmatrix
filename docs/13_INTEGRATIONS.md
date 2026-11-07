# 13 · INTEGRATIONS — External Services & Data Sources

> All integrations sit behind adapters in `app/integrations/` implementing `IntelProvider`. Each has: timeout (4 s), retry (1×, jittered), circuit breaker, Redis cache, **mock fixture** (`MOCK_EXTERNAL=true`). Failure ⇒ stage marked `error`, scan continues as `partial`.

```python
class IntelProvider(Protocol):
    name: str
    async def lookup(self, indicator: Indicator) -> ProviderResult: ...
```

## 1. Threat Intelligence Feeds
| Source | Use | Access | Refresh |
|---|---|---|---|
| **OpenPhish** (community feed) | phishing URLs | public text feed | hourly → `feed_entries` |
| **URLhaus (abuse.ch)** | malware distribution URLs | public feed / API | hourly |
| **PhishTank** | verified phishing | free API key | daily dump |
| **Google Safe Browsing v4** | URL reputation | API key (free for non-commercial) | per-scan lookup (hash prefixes) |
| **VirusTotal** | domain/URL multi-engine verdicts | free key (4 req/min) | per-scan, cached 24 h, only on deep scans |
Check each provider's current terms/rate limits before relying on them; keep keys optional.

## 2. Certificate Transparency
- **crt.sh** (`https://crt.sh/?q=%25.example.com&output=json`) — public, can be slow/flaky: 5 s timeout, cache 12 h, fallback to "CT unavailable" (no penalty).
- Optional: **Certspotter** API as backup; stretch: stream CT logs (certstream-style) for watchlist domains.
- Parse: issuer, CN, SANs, not_before/after, log timestamp; anomaly rules: new issuer vs 12-month baseline, burst (≥ 5 certs/24 h), certificate for watchlist domain from non-expected issuer.

## 3. Domain & Network Intelligence
| Need | Provider | Fallback |
|---|---|---|
| Domain age/registrar | RDAP (`rdap.org` / registry RDAP) via `httpx` | python-whois; WhoisXML key optional |
| DNS | `dnspython` (A, AAAA, NS, MX, TXT; SPF/DMARC presence) | – |
| IP → ASN/country | MaxMind GeoLite2 (offline DB) or `ipinfo` | skip |
| Popularity/allowlist | **Tranco** top-1M list (offline CSV) | – |
| TLD risk | local table (e.g. high-abuse TLDs) | – |

## 4. ML Data
Training sets: OpenPhish/PhishTank/URLhaus (positive), Tranco (negative) → `ml/dataset/`. Don't commit raw dumps; commit the `build_dataset.py` and the small sample. Optional public datasets (e.g. PhiUSIIL / UCI phishing) for benchmarking — cite them in README.

## 5. LLM (explanation layer, optional)
`ANTHROPIC_API_KEY` (Claude) or `GEMINI_API_KEY`. Input: structured findings JSON only + escaped excerpt; output: ≤ 80 words, plain English, ends with one recommended action. Cache per scan; fallback template-based explanation from reason catalogue (10 §3). Never send user PII.

## 6. Screenshots & Visual Matching (stretch)
Playwright container → PNG (1280×800) → stored under `/data/screens` → served via signed URL. Brand matching: perceptual hash vs reference logos (`imagehash`) for top brands.

## 7. Notifications
- In-app alerts (default). Email via **Resend/SMTP (MailHog in dev)** for watchlist/critical alerts. Optional Telegram/Slack webhook in Settings.

## 8. Browser Extension (stretch)
Chrome MV3 extension calling `GET /public/check?url=` with API key; shows badge (green/peach/coral) per tab; link to full report.

## 9. Export / Interop
CSV, JSON, **STIX 2.1-lite** bundle (indicator objects with `pattern: [domain-name:value = '…']`), PDF report via WeasyPrint.

## 10. Integration Config Matrix
| Provider | Env var | Required | Mock available |
|---|---|---|---|
| OpenPhish | `OPENPHISH_FEED_URL` | no | yes |
| URLhaus | `URLHAUS_FEED_URL` | no | yes |
| Safe Browsing | `GOOGLE_SAFE_BROWSING_KEY` | no | yes |
| VirusTotal | `VIRUSTOTAL_API_KEY` | no | yes |
| WhoisXML | `WHOISXML_API_KEY` | no | RDAP fallback |
| LLM | `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | no | template |
| SMTP/Resend | `SMTP_URL` / `RESEND_API_KEY` | no | MailHog |

## 11. Integration Tests
Use `respx` to mock HTTP; one **contract test** per provider with recorded sample payload in `tests/fixtures/providers/`; a nightly optional live-smoke test (skipped in CI by default).

## 12. Legal / Ethical Notes
Respect provider ToS and rate limits; attribute data sources in Help → "Data Sources"; don't redistribute paid/restricted feeds via the IOC export.
