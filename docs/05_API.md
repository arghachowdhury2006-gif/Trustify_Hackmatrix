# 05 · API — REST Contract (v1)

Base URL: `/api/v1` · JSON · UTF-8 · Auth: `Authorization: Bearer <access_jwt>` (or `X-API-Key` for public API). OpenAPI auto-served at `/docs`. Frontend types are generated from `/openapi.json` (`openapi-typescript`) — **never hand-write API types**.

## 1. Conventions
- Success: `200/201` with body. Errors use RFC 7807-style:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "URL is invalid", "details": [{"field":"url","issue":"scheme"}], "request_id": "9f1c…" } }
```
- Codes: `VALIDATION_ERROR 422`, `UNAUTHORIZED 401`, `FORBIDDEN 403`, `NOT_FOUND 404`, `RATE_LIMITED 429` (+`Retry-After`), `SSRF_BLOCKED 400`, `UPSTREAM_UNAVAILABLE 502`, `INTERNAL 500`.
- Pagination: `?page=1&page_size=20` → `{ "items": [], "page": 1, "page_size": 20, "total": 134 }`.
- Timestamps ISO-8601 UTC. IDs UUID.
- Rate limits: guest 10 scans/h/IP · user 60 scans/h · API key 300/h.

## 2. Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{email, password, display_name}` | 201 → user + tokens |
| POST | `/auth/login` | `{email, password}` | → `{access_token, expires_in, user}`; refresh in HttpOnly cookie |
| POST | `/auth/refresh` | – | rotates refresh cookie |
| POST | `/auth/logout` | – | revokes token family |
| GET | `/auth/me` | – | current user |
| POST | `/auth/change-password` | `{current, new}` | |

## 3. Scans
### POST `/scans`
```json
// request
{ "url": "https://paypa1-secure-login.example/verify", "deep": false }
// 202 (new) or 200 (cache hit)
{ "id": "…", "status": "queued", "from_cache": false, "events_url": "/api/v1/scans/{id}/events" }
```
### GET `/scans/{id}`
```json
{
  "id":"…","status":"completed","input_url":"…","normalized_url":"…","final_url":"…",
  "verdict":"malicious","score":12,"confidence":0.93,
  "risk":{"threat":88,"certificate":40,"websec":55,"intel":90},
  "reasons":[
    {"code":"BRAND_LOOKALIKE","engine":"threat","severity":"high","title":"Pretends to be PayPal","detail":"Domain 'paypa1' is 1 character away from 'paypal'.","weight":22.5},
    {"code":"NEW_DOMAIN_LT_30D","engine":"threat","severity":"medium","title":"Domain registered 3 days ago","detail":"…","weight":9.0}
  ],
  "recommendation":"Do not enter any passwords or payment details. Report this site.",
  "explanation":"Plain-language paragraph…",
  "domain":{"name":"…","age_days":3,"registrar":"…","ip":"…","asn":"AS…","country":"US"},
  "screenshot_url":"/files/screens/….png",
  "certificate_summary":{"valid":true,"issuer":"…","expires_in_days":82,"flags":["NO_SCT"]},
  "engine_status":{"threat":"ok","certificate":"ok","websec":"ok","intel":"ok"},
  "duration_ms":2140,"created_at":"…"
}
```
### GET `/scans/{id}/events` (SSE)
```
event: stage    data: {"stage":"certificate","state":"running","progress":0.4}
event: finding  data: {"code":"BRAND_LOOKALIKE","severity":"high","title":"…"}
event: done     data: {"scan_id":"…","verdict":"malicious","score":12}
event: error    data: {"code":"UPSTREAM_UNAVAILABLE","stage":"intel"}
```
### GET `/scans/{id}/report?format=pdf|json` · export
### DELETE `/scans/{id}` (owner)

## 4. History
| GET `/history` | `?q=&verdict=&from=&to=&page=` | paginated scan summaries `{id,url,verdict,score,created_at,duration_ms}` |
|---|---|---|
| GET `/history/export` | `?format=csv` | file |
| DELETE `/history` | – | clear all (confirm in UI) |

## 5. Certificates
| Method | Path | Notes |
|---|---|---|
| POST | `/certificates/check` | `{ "host":"example.com", "port":443 }` → full certificate analysis (sync, ≤ 6 s) |
| GET | `/certificates/ct/{domain}` | CT timeline from crt.sh + anomaly flags |
| GET | `/certificates/{fingerprint}` | stored cert detail, chain, `shared_key_domains[]` |
```json
// POST /certificates/check → 200
{ "host":"example.com","valid":true,"risk":18,
  "chain":[{"role":"leaf","subject":"…","issuer":"…","not_before":"…","not_after":"…","key":"RSA 2048","sig_alg":"sha256WithRSAEncryption","sct_count":2},
           {"role":"intermediate","subject":"…"},{"role":"root","subject":"…","trusted":true}],
  "sans":["example.com","www.example.com"],
  "flags":[{"code":"EXPIRES_SOON","severity":"medium","detail":"Expires in 9 days"}],
  "weak_key_analysis":{"small_factor_test":"pass","known_bad_fingerprint":false,"shared_with_domains":[]},
  "ct":{"total":42,"last_30d":2,"unexpected_issuers":[]} }
```

## 6. Threat Intelligence
| Method | Path | Notes |
|---|---|---|
| GET | `/intel/feed` | `?category=&severity=&window=24h|7d|30d&sort=new|top` community + verified feed |
| POST | `/intel/reports` | `{url, category, description?}` (auth) → 201; dedupes by domain |
| POST | `/intel/reports/{id}/vote` | `{value: 1|-1}` |
| GET | `/intel/trending` | top domains, top brands targeted, category breakdown |
| GET | `/intel/lookup?indicator=` | aggregated intel on domain/IP/URL |
| GET | `/intel/export?format=csv|json|stix` | IOC export |

## 7. Alerts
| GET `/alerts` | `?severity=&unread=true` | list |
|---|---|---|
| PATCH `/alerts/{id}` | `{is_read?, is_dismissed?}` | |
| POST `/alerts/read-all` | – | |
| GET `/alerts/unread-count` | – | `{count:3}` for badge |

## 8. Dashboard
`GET /dashboard/summary?range=7d`
```json
{ "kpis":{"total_scans":{"value":12548,"delta_pct":12},"safe":{"value":11870,"delta_pct":9.4},
          "threats":{"value":678,"delta_pct":-3},"avg_response_ms":{"value":1200,"delta_pct":-18}},
  "overview":{"safe_pct":94,"suspicious_pct":4,"malicious_pct":2,
              "trend":[{"day":"Mon","score_avg":88},…]},
  "threat_types":[{"type":"phishing","pct":42},{"type":"malware","pct":28},{"type":"spyware","pct":18},{"type":"others","pct":12}],
  "recent_alerts":[…3 items…] }
```

## 9. Users / Settings
`GET/PATCH /users/me` · `GET/POST/DELETE /users/me/api-keys` (key shown once) · `GET/POST/DELETE /users/me/watchlist` · `PATCH /users/me/notifications`

## 10. Public API (API-key; for browser extension & integrations)
`GET /public/check?url=` → `{ "verdict":"safe","score":93,"cached":true }` (cache-first, ≤ 300 ms; triggers background scan on miss)

## 11. Support
`POST /support/tickets` `{subject, message, email?}` · `GET /help/faq`

## 12. System
`GET /health` · `GET /ready` · `GET /metrics`

## 13. Validation Rules
- `url`: ≤ 2048 chars; schemes http/https only (auto-prefix `https://`); IDN → punycode; strip fragments; reject credentials in URL; reject hosts resolving to private/loopback/link-local/metadata ranges.
- `password`: ≥ 10 chars, not in top-10k breached list.
- `description`: ≤ 1000 chars, sanitised (no HTML).

## 14. Versioning & Compatibility
Breaking changes → `/api/v2`. Additive fields allowed in v1. Keep this file and `openapi.json` in sync — CI fails if they drift (`make check-api`).
