<p align="center">
  <img src="assets/trustify-logo.png" alt="Trustify Logo" width="140" />
</p>

<h1 align="center">🛡️ Trustify — AI-Powered Web Threat Detection & Digital Trust Intelligence</h1>

<p align="center">
  <em>Detect · Analyze · Stay Safe</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-HackMatrix%202026-468D8B?style=for-the-badge&logo=shield" alt="HackMatrix 2026" />
  <img src="https://img.shields.io/badge/Next.js%2014-App%20Router-213843?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Security-Passive%20Scan-74B3A8?style=for-the-badge&logo=security" alt="Passive Inspection" />
  <img src="https://img.shields.io/badge/License-MIT-FEAF76?style=for-the-badge" alt="License: MIT" />
</p>

<p align="center">
  <a href="#demo"><b>Demo</b></a> •
  <a href="#features"><b>Features</b></a> •
  <a href="#architecture"><b>Architecture</b></a> •
  <a href="#quick-start"><b>Quick Start</b></a> •
  <a href="#api"><b>API</b></a> •
  <a href="#team"><b>Team</b></a>
</p>

<p align="center">
  <img src="assets/trustify-dashboard.png" alt="Trustify – AI-Powered Digital Trust Intelligence Dashboard" width="100%" />
  <br />
  <em>Trustify – AI-Powered Digital Trust Intelligence Dashboard</em>
</p>

---

<a id="demo"></a>
## 🖥️ Demo & Overview

**Trustify** is an intelligent web security platform that provides real-time detection of phishing websites, fraudulent recruitment and payment portals, deceptive domain impersonation, and Certificate Authority (CA) trust infrastructure vulnerabilities in seconds.

- **Interactive Security Dashboard**: Real-time multi-engine inspection running on Next.js 14 with instant trust verdicts.
- **Local Application Access**: `http://localhost:3000`
- **Scenarios Ready-to-Test**: One-click assessment for deceptive domain impersonation, expired/self-signed SSL certificates, and phishing vectors.

---

<a id="features"></a>
## 🌟 Core Pillars & Architectural Engines

Trustify unifies four independent security inspection engines into an explainable **0–100 Digital Trust Score**:

1. **Threat Analysis Engine (ML & Heuristics)**
   - Brand lookalike and typosquatting detection using Levenshtein distance and phonetic/homoglyph character substitution (e.g. `paypa1`, `micros0ft`, `bank0famerica`).
   - Lexical URL feature extraction: Shannon entropy, subdomain depth, suspicious TLDs, Punycode/IDN attacks, `@` credentials deception, and raw IP address hostnames.
   - HTML DOM analysis: password forms submitting to external domains, obfuscated JavaScript payloads (`eval`, `unescape`, `atob`), and missing security attributes.

2. **Certificate Validation & CT Forensics Engine**
   - Cryptographic TLS chain validation: leaf, intermediate, and root trust anchors.
   - Flagging of expired certificates, self-signed chains, hostname mismatches, weak keys (`RSA < 2048` or `EC < 256`), and deprecated `SHA-1` signatures.
   - **eMudhra CA Weak-Key Heuristics**: Automated small-prime trial division on RSA moduli, duplicate SPKI public key detection across unrelated domains, and ROCA vulnerability tests.
   - **Certificate Transparency (CT) Monitoring**: Public `crt.sh` timeline extraction and alerting on anomalous or unexpected certificate authorities.

3. **Web Security Assessment Engine (Passive Only)**
   - Security headers audit: `Strict-Transport-Security` (HSTS), `Content-Security-Policy` (CSP), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
   - Cookie security validation: `Secure`, `HttpOnly`, and `SameSite` flags.
   - Cleartext HTTP-to-HTTPS redirect verification and server technology version disclosure detection.
   - Strictly passive inspection: no active exploitation, no port scanning.

4. **Collaborative Threat Intelligence Network**
   - Community-submitted threat reports with category tags (Phishing, Fake Payment, Fake Job Portal, Impersonation).
   - Peer voting (upvoting/downvoting) and dynamic analyst reputation scoring.
   - Indicators of Compromise (IOC) export in **CSV**, **JSON**, and **STIX 2.1** formats.

5. **SSRF Guard Protection**
   - Deep protection against Server-Side Request Forgery: blocks loopback (`127.0.0.0/8`), RFC1918 private subnets, link-local cloud metadata endpoints (`169.254.169.254`), CGNAT, and IPv6 mappings. Independent DNS resolution and pinned transport.

---

<a id="architecture"></a>
## 🧭 Architecture & System Design

```
                    ┌───────────────────────────────────────────────┐
                    │       Next.js 14 Frontend & Client UI        │
                    │   (App Router · Tailwind CSS · shadcn/ui)     │
                    └───────────────────────┬───────────────────────┘
                                            │ HTTPS / REST API & SSE Events
                                   ┌────────▼────────┐
                                   │ Next.js API / GW│  Auth · SSRF Guard · Rate Limit
                                   └───┬─────────┬───┘
                                       │         │
                 ┌─────────────────────┼─────────┴─────────────────────┐
                 │                     │                               │
        ┌────────▼────────┐   ┌────────▼────────┐             ┌────────▼────────┐
        │  Threat Engine  │   │   Cert Engine   │             │  WebSec Engine  │
        │  ML Heuristics  │   │  TLS / CT Logs  │             │ Security Headers│
        └────────┬────────┘   └────────┬────────┘             └────────┬────────┘
                 │                     │                               │
                 └─────────────────────┼───────────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Intel Engine   │
                              │ Community Feeds │
                              └────────┬────────┘
                                       │
                         ┌─────────────▼─────────────┐
                         │   0–100 Trust Score Agg   │
                         │ Safe | Suspicious | Alert │
                         └───────────────────────────┘
```

---

## 📐 Scoring Formula & Verdicts

$$\text{Risk} = 0.40 \times \text{ThreatRisk} + 0.25 \times \text{CertRisk} + 0.20 \times \text{WebSecRisk} + 0.15 \times \text{IntelRisk}$$
$$\text{Score} = \max(0, \min(100, 100 - \text{Risk}))$$

- **Safe ($\ge 80$)**: Valid TLS certificates, secure headers, reputable domain history, zero phishing indicators.
- **Suspicious ($50 - 79$)**: Configuration anomalies, expiring certificates, or newly registered infrastructure (< 30 days old).
- **Malicious ($< 50$)**: Brand impersonation, active threat feed hits, shared compromised cryptographic keys, or credential-harvesting forms.

---

<a id="quick-start"></a>
## 🚀 Quick Start

### 1. Installation
```bash
# Clone or navigate to the repository
cd Trustify

# Install dependencies
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 🧪 Quick Test Scenarios

Try scanning these test targets directly in the UI or via API:

| URL / Target | Expected Verdict | Primary Reason Codes |
|---|---|---|
| `https://paypa1-secure-login.com/auth/verify` | ✖ **Malicious** (Score 12) | `BRAND_LOOKALIKE`, `NEW_DOMAIN_LT_30D`, `LOGIN_FORM_OFFDOMAIN` |
| `https://expired.badssl.com` | ⚠ **Suspicious** (Score 54) | `EXPIRED` (Certificate expired) |
| `https://self-signed.badssl.com` | ⚠ **Suspicious** (Score 58) | `SELF_SIGNED` (Untrusted authority) |
| `https://example.com` | ✔ **Safe** (Score 96) | All security checks passed |
| `http://169.254.169.254/latest/meta-data` | 🛑 **Blocked** (HTTP 400) | `SSRF_BLOCKED` (Internal metadata access rejected) |

---

<a id="api"></a>
## 🔌 API Reference (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/scans` | Submit a URL for real-time multi-engine scan |
| `GET` | `/api/v1/scans/{id}/events` | Server-Sent Events (SSE) live progress stream |
| `POST` | `/api/v1/certificates/check` | Inspect TLS certificate, chain, and eMudhra weak-key heuristics |
| `GET` | `/api/v1/certificates/ct/{domain}` | Certificate Transparency audit trail from crt.sh |
| `GET` | `/api/v1/intel/feed` | Collaborative threat reports feed (filterable by category) |
| `POST` | `/api/v1/intel/reports` | Submit a community threat report |
| `POST` | `/api/v1/intel/reports/{id}/vote` | Upvote or downvote a reported threat |
| `GET` | `/api/v1/intel/export?format=csv\|json\|stix` | Export IOCs in CSV, JSON, or STIX 2.1 |
| `GET` | `/api/v1/public/check?url=` | High-speed cache-first check for extensions and AI agents |
| `GET` | `/api/v1/dashboard/summary` | Executive KPIs, donut ratios, and 7-day trend |
| `GET` | `/api/v1/health` | Service health status and engine status |

---

## 🤖 Model Context Protocol (MCP) Server

Connect Trustify to any MCP-compatible AI agent (Claude, Antigravity, Cursor):
```bash
# Start MCP server
python mcp/fraudguard_mcp/server.py
```
Tools provided:
- `scan_url(url, deep)`
- `check_certificate(host, port)`
- `report_threat(url, category, description)`
- `get_trending_threats(window)`

---

## 🎨 UI/UX Design System Tokens

- **Deep Teal (`#213843`)**: Sidebar, app background, primary text on cream
- **Teal (`#468D8B`)**: Primary buttons, active tabs, Safe status
- **Soft Teal (`#74B3A8`)**: Highlights, charts, subtle accents
- **Warm Cream (`#F6DAC0`)**: Clean card surfaces, readable content cards
- **Soft Cream (`#FBEBDA`)**: Inputs and nested cards
- **Peach (`#FEAF76`)**: Suspicious / medium severity warning
- **Coral (`#DA6D58`)**: Malicious / high severity alert

---

<a id="team"></a>
## Meet Our Team

| Number | Team Member | GitHub Profile |
|:---:|---|---|
| 1 | **Sibsankar Maity** | [@oii-siba](https://github.com/oii-siba) |
| 2 | **Arghya Chowdhury** | [@arghachowdhury2006-gif](https://github.com/arghachowdhury2006-gif) |
| 3 | **Sujan Bhowmik** | [@sujanbhowmik12](https://github.com/sujanbhowmik12) |
| 4 | **Sayan Pattanayak** | [@sayan3239](https://github.com/sayan3239) |

- **License**: MIT

<p align="center">
  Built with innovation, teamwork & passion ❤️<br />
  HackMatrix 2026
</p>

---

## ⚖️ Responsible Use Policy

Trustify is strictly designed for **defense, validation, and threat mitigation**. All scans are passive. No exploit payloads, unauthorized port scans, or intrusive attacks are ever performed.

