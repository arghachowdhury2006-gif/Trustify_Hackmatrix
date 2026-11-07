# 02 · DESIGN — UI/UX System

> Antigravity agents: every screen MUST use only the tokens below. Never hard-code a colour in a component; use CSS variables / Tailwind theme tokens. Reference mockup: the "FraudGuard AI" dashboard image (sidebar left, hero banner with mountain/sun motif, KPI cards, cream content cards).

## 1. Design Principles
1. **Calm authority** – security product, not alarmist. Colour carries meaning; use red sparingly.
2. **Answer first** – verdict is visible within 1 second of load.
3. **Explain everything** – every flag has a plain-language "why".
4. **One primary action per screen.**
5. **Accessible by default** – AA contrast, focus rings, keyboard flow, reduced-motion support.

## 2. Colour Tokens
| Token | Hex | Use |
|---|---|---|
| `--color-ink` (Deep teal) | `#213843` | Sidebar, app background, primary text on cream |
| `--color-primary` (Teal) | `#468D8B` | Primary buttons, active nav, links, "Safe" strokes |
| `--color-accent` (Soft teal) | `#74B3A8` | Charts, highlights, hover fills, success tint |
| `--color-surface` (Warm cream) | `#F6DAC0` | Cards, content backgrounds |
| `--color-warning` (Peach) | `#FEAF76` | Suspicious / medium severity |
| `--color-danger` (Coral) | `#DA6D58` | Malicious / high severity / destructive |

### Derived tokens (generate, don't invent new hues)
```css
:root {
  --color-ink: #213843;
  --color-ink-80: #2d4a57;          /* hover on sidebar */
  --color-ink-60: #4b6671;          /* secondary text on cream */
  --color-primary: #468D8B;
  --color-primary-hover: #3a7a78;
  --color-accent: #74B3A8;
  --color-surface: #F6DAC0;
  --color-surface-soft: #FBEBDA;    /* lighter card / inputs (cream +40% white) */
  --color-surface-line: #E8C9AA;    /* borders on cream */
  --color-warning: #FEAF76;
  --color-danger: #DA6D58;
  --color-safe-bg: rgba(116,179,168,.25);
  --color-warn-bg: rgba(254,175,118,.30);
  --color-danger-bg: rgba(218,109,88,.22);
  --text-on-dark: #F6DAC0;          /* text on #213843 */
  --text-on-cream: #213843;
  --radius-card: 20px; --radius-btn: 999px; --radius-input: 14px;
  --shadow-card: 0 8px 24px rgba(33,56,67,.12);
}
```
**Semantic mapping**: Safe = primary/accent · Suspicious = warning · Malicious = danger · Info = accent · Disabled = ink at 40 %.

### Contrast rules (must pass WCAG AA)
- `#213843` on `#F6DAC0` ✅ (high contrast) — default text on cards.
- `#F6DAC0` on `#213843` ✅ — text in sidebar.
- White/cream text on `#468D8B` is OK for **large/bold text (≥ 16px bold)**; for small text on primary buttons use `#FFFFFF` at 600 weight and verify ≥ 4.5:1, else darken to `--color-primary-hover`.
- Never put `#FEAF76` text on cream; use ink text on a peach badge instead.
- Never rely on colour alone: always pair with icon + label (✔ Safe, ⚠ Suspicious, ✖ Malicious).

## 3. Typography
- Font: **Inter** (UI) via `next/font`; **JetBrains Mono** for URLs, hashes, certificate data.
- Scale (px): 12 / 14 / 16 / 20 / 24 / 32 / 44. Weights 400/500/600/700.
- Headings: tight tracking (-0.01em); hero title 44/48 bold; page title 28/32 semi-bold; card title 16 semi-bold.

## 4. Layout & Spacing
- 8-pt grid (4, 8, 12, 16, 24, 32, 48).
- **App shell**: left sidebar 260 px (ink), top bar 72 px (search, notifications, user menu), content max-width 1440, gutters 24 px.
- Dashboard grid: 12 cols; KPI row = 4 cards; middle = 7/5 split (Security Overview | Recent Alerts); bottom = 4/4/4 (Threat Types | Quick Tools | Community CTA).
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Below `lg` the sidebar becomes a slide-over drawer; KPI cards stack 2×2 then 1×4.

## 5. Components (build as reusable, in `/components/ui`)
- **Sidebar** (ink bg, logo top, nav items with icon, active item = primary pill with ink text, alert badge in danger), footer card "Stay Safe Online".
- **Topbar**: rounded search input (`Search for a website…`, Enter = scan), notification bell with count, avatar menu.
- **HeroBanner**: gradient `ink → primary` with mountain/sun SVG, H1, subtitle, 2 CTAs (primary filled "Scan a Website", ghost outlined "View Threat Intel").
- **KPICard**: icon, label, big number, delta chip, sparkline (accent). Variants: neutral (ink/teal), success (teal), danger (coral gradient), info (cream).
- **Card**: cream bg, radius 20, shadow-card, 24 px padding, title row with icon + right-aligned action.
- **VerdictBadge**: Safe / Suspicious / Malicious with icon + tinted bg.
- **ScoreRing**: donut, 94 % style, centre label; colours accent / warning / danger.
- **SeverityPill**: High (danger-bg), Medium (warn-bg), Low/Safe (safe-bg).
- **Charts**: Recharts; line = primary stroke + accent area gradient; bars = accent / warning / danger / muted; rounded bars, no gridline clutter.
- **DataTable**: sticky header, zebra none, row hover `surface-soft`, mono URL column, pagination, empty/loading/error states.
- **Stepper/ProgressTimeline** for scan stages.
- **CertificateChainGraphic**: Root → Intermediate → Leaf nodes with status ticks.
- **Toast**, **Modal**, **Tabs**, **Tooltip**, **Skeleton**, **EmptyState** (illustration + CTA).
- **Buttons**: Primary (teal fill, pill), Secondary (outline cream), Ghost, Danger (coral). Min height 44 px.

## 6. Page Specifications
### 6.1 Auth (Login / Register)
Split screen: left = ink panel with mountain illustration + tagline; right = cream card form (email, password, show/hide, "Continue as guest"). Inline validation, password strength meter.

### 6.2 Dashboard (`/`)
Matches reference mockup. Hero → 4 KPIs (Total Scans, Safe Websites, Threats Detected, Avg Response Time) → Security Overview (donut 94/4/2 + 7-day line) → Recent Alerts (3–5 items, severity pill, relative time) → Threat Types bars (Phishing, Malware, Spyware, Others) → Quick Tools (Scan URL, Check Certificate, Threat Intel, View Reports) → "Build a Safer Internet Together" community CTA.

### 6.3 Scan Website (`/scan`)
Large centred input card, "Scan" primary button, recent scans chips. On submit: ProgressTimeline (live via SSE). Result: **Verdict hero** (ScoreRing + badge + domain + screenshot thumbnail) → "Why this verdict" top 3 reasons → Tabs: *Threat Analysis · Certificate · Web Security · Community · Raw data*. Actions: Re-scan, Report, Copy share link, Export PDF/JSON.

### 6.4 Certificate Check (`/certificate`)
Domain input → chain graphic → detail grid (Subject, Issuer, Valid from/to, Key type/size, Signature alg, SANs, SCT count, OCSP) → risk flags list → **CT timeline** (certs issued for the domain, unusual issuer highlighted in coral) → Weak-key analysis card.

### 6.5 Threat Intelligence (`/intel`)
Filters (category, severity, time). Left: community feed (cards with votes, domain in mono, category chip, reporter reputation). Right: Trending domains, Top targeted brands, IOC export (CSV/JSON/STIX-lite). "Report a URL" modal.

### 6.6 Alerts (`/alerts`)
Tabs All / Unread / High / Medium. List rows with severity icon, title, detail, time, actions (View, Mark read, Dismiss). Bulk actions.

### 6.7 History (`/history`)
Searchable table: URL, verdict, score, date, duration; row → result page; export CSV; delete.

### 6.8 Settings (`/settings`)
Tabs: Profile · Security (password, sessions) · API keys · Notifications · Watchlist.

### 6.9 Help & Support (`/help`)
FAQ accordion, "How scoring works", contact form, glossary (phishing, CT log, HSTS…).

## 7. Motion
150–250 ms ease-out; fade/slide-up on cards; number count-up on KPIs; ring animates on load. Respect `prefers-reduced-motion`.

## 8. Content & Tone
Plain English, no jargon in headings. Examples: "This site is pretending to be PayPal." / "Certificate expires in 3 days." Always give a next step ("Do not enter your password").

## 9. States Checklist (every page)
Loading (skeleton) · Empty · Error (with retry) · Offline · Partial data · Unauthorised.

## 10. Tailwind theme snippet
```ts
// tailwind.config.ts
colors: {
  ink: { DEFAULT:'#213843', 80:'#2d4a57', 60:'#4b6671' },
  primary: { DEFAULT:'#468D8B', hover:'#3a7a78' },
  accent: '#74B3A8',
  surface: { DEFAULT:'#F6DAC0', soft:'#FBEBDA', line:'#E8C9AA' },
  warning: '#FEAF76',
  danger: '#DA6D58',
}
```
