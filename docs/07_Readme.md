# 🛡️ FraudGuard AI — AI-Powered Web Threat Detection & Digital Trust Intelligence

*Detect · Analyze · Stay Safe*

FraudGuard AI is an accessible platform that tells anyone — in seconds — whether a website is trustworthy. It fuses **ML-based phishing detection**, **web security assessment**, **TLS certificate validation with Certificate Transparency monitoring**, and **collaborative threat intelligence** into a single, explainable trust score.

> Built for the *AI-Powered Web Threat Detection & Digital Trust Intelligence* hackathon challenge.

## ✨ Features
- 🔍 **One-click scan** → Safe / Suspicious / Malicious with a 0–100 trust score and plain-language reasons
- 🧠 **Threat engine**: lexical + host + page-content features, brand-lookalike & homoglyph detection, XGBoost model, live threat feeds
- 🔐 **Certificate engine**: chain validation, key strength, SHA-1/weak-key detection, shared-key detection, CT timeline & anomaly flags (inspired by the eMudhra CA incident)
- 🧱 **Web security assessment**: headers, cookies, redirects, information disclosure (passive only)
- 🤝 **Community intel**: report, vote, trending threats, IOC export (CSV/JSON/STIX-lite)
- 🔔 **Alerts & history**, **watchlist** for certificate expiry/CT anomalies
- 🔌 **Public API + MCP server** so other tools and AI agents can check URLs

## 🧭 Architecture (short)
Next.js frontend → FastAPI gateway → Celery scan workers (Threat · Certificate · WebSec · Intel engines) → PostgreSQL + Redis. Real-time progress via SSE. Full details: [`docs/03_ARCHITECTURE.md`](docs/03_ARCHITECTURE.md).

## 🚀 Quick Start
```bash
git clone <repo> fraudguard && cd fraudguard
cp .env.example .env            # add optional API keys
docker compose up --build       # web :3000 · api :8000/docs
make seed                       # demo data
```
Open http://localhost:3000 → demo login `demo@fraudguard.ai / Demo@12345`.

## 🧪 Try These
| URL | Expected |
|---|---|
| `https://example.com` | Safe |
| `https://expired.badssl.com` | Certificate flags: EXPIRED |
| `https://self-signed.badssl.com` | SELF_SIGNED |
| `https://wrong.host.badssl.com` | HOSTNAME_MISMATCH |
| `http://paypa1-secure-login.test` (fixture) | Malicious – BRAND_LOOKALIKE |

## 🗂️ Docs
| # | Doc |
|---|---|
| 01 | PRD · 02 Design · 03 Architecture · 04 Database · 05 API · 06 AGENTS |
| 08 | Project Implementation · 09 Setup · 10 Feature Development |
| 11 | Authentication & Security · 12 MCP · 13 Integrations · 14 Testing & QA · 15 Debugging |

## 🎨 Design Language
Deep teal `#213843` · Teal `#468D8B` · Soft teal `#74B3A8` · Cream `#F6DAC0` · Peach `#FEAF76` · Coral `#DA6D58`.

## 🔒 Responsible Use
Scanning is **passive** (no exploitation, no port scanning). Use only on sites you are permitted to test. See `docs/11_AUTH_SECURITY.md`.

## 🧱 Tech Stack
Next.js 14 · TypeScript · Tailwind · shadcn/ui · Recharts · FastAPI · SQLAlchemy · Celery · PostgreSQL · Redis · XGBoost · Playwright · Docker

## 🗺️ Roadmap
Browser extension · PDF reports · org dashboards · CT-log streaming monitor · STIX/TAXII sharing

## 👥 Team
<names> · Hackathon: <name/date>

## 📄 License
MIT
