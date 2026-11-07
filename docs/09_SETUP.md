# 09 · SETUP — Environment & Tooling

## 1. Prerequisites
| Tool | Version |
|---|---|
| Git | ≥ 2.40 |
| Docker + Compose v2 | latest |
| Node.js | 20 LTS (+ pnpm 9) |
| Python | 3.11 (+ `uv` or `pip`) |
| Antigravity IDE | latest, signed in |
| (Optional) Make | for shortcuts |

## 2. Antigravity Workspace Setup
1. Open the repo folder as workspace.
2. Put `AGENTS.md` at repo root; create `.agent/rules/project.md` (copy) and `.agent/workflows/` (see 06 §11).
3. In Agent settings choose a **review policy** = *request review for terminal commands & destructive actions* (safer for a security project) and allow the browser tool for UI verification.
4. Add MCP servers (see 12).
5. Use **Planning mode** for features, **Fast mode** for tiny fixes.

## 3. Repo Bootstrap
```bash
mkdir fraudguard && cd fraudguard && git init
mkdir -p apps/web apps/api mcp docs .agent/rules .agent/workflows
cp <downloaded docs>/*.md docs/
cp docs/06_AGENTS.md AGENTS.md
```

## 4. Environment Variables (`.env.example`)
```ini
# --- App ---
ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000

# --- Database / Cache ---
DATABASE_URL=postgresql+asyncpg://fraud:fraud@postgres:5432/fraudguard
REDIS_URL=redis://redis:6379/0

# --- Auth ---
JWT_SECRET=change-me-32+chars-random
JWT_ACCESS_TTL_MIN=15
JWT_REFRESH_TTL_DAYS=14
COOKIE_SECURE=false          # true in prod

# --- Scanner ---
SCAN_TIMEOUT_S=10
MAX_REDIRECTS=8
MAX_BODY_BYTES=1048576
MOCK_EXTERNAL=false          # true = use fixtures, no external calls
ALLOW_PRIVATE_TARGETS=false  # NEVER true outside tests

# --- Optional integrations (leave blank to skip) ---
GOOGLE_SAFE_BROWSING_KEY=
VIRUSTOTAL_API_KEY=
WHOISXML_API_KEY=
ANTHROPIC_API_KEY=           # or GEMINI_API_KEY for explanations
OPENPHISH_FEED_URL=https://openphish.com/feed.txt
URLHAUS_FEED_URL=https://urlhaus.abuse.ch/downloads/text_recent/

# --- Frontend ---
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 5. `docker-compose.yml` (skeleton)
```yaml
services:
  postgres: { image: postgres:16, environment: {POSTGRES_USER: fraud, POSTGRES_PASSWORD: fraud, POSTGRES_DB: fraudguard}, volumes: [pg:/var/lib/postgresql/data], healthcheck: {test: ["CMD-SHELL","pg_isready -U fraud"], interval: 5s} }
  redis:    { image: redis:7-alpine }
  api:      { build: ./apps/api, env_file: .env, depends_on: {postgres: {condition: service_healthy}, redis: {condition: service_started}}, ports: ["8000:8000"], command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" }
  worker:   { build: ./apps/api, env_file: .env, command: celery -A app.workers.celery_app worker -l info -c 4, depends_on: [api] }
  web:      { build: ./apps/web, env_file: .env, ports: ["3000:3000"], depends_on: [api] }
  browser:  { image: mcr.microsoft.com/playwright:v1.47.0-jammy, command: npx playwright run-server --port 3001, security_opt: ["seccomp=unconfined"], networks: [sandbox] }
volumes: { pg: {} }
networks: { sandbox: { internal: false } }   # restrict egress to public internet only via firewall rules in prod
```

## 6. Makefile targets
```make
setup:   ; cp -n .env.example .env && cd apps/web && pnpm i && cd ../api && uv sync
dev:     ; docker compose up --build
migrate: ; docker compose exec api alembic upgrade head
seed:    ; docker compose exec api python -m app.scripts.seed
lint:    ; cd apps/api && ruff check . && mypy app ; cd ../web && pnpm lint && pnpm tsc --noEmit
test:    ; cd apps/api && pytest -q ; cd ../web && pnpm test
e2e:     ; cd apps/web && pnpm playwright test
train-model: ; docker compose exec api python -m ml.train
check-api:   ; python scripts/check_openapi_drift.py
```

## 7. Initial Dependencies
**api**: fastapi, uvicorn[standard], pydantic-settings, sqlalchemy[asyncio], asyncpg, alembic, redis, celery, argon2-cffi, pyjwt, httpx, dnspython, cryptography, certifi, python-whois / rdap, tldextract, beautifulsoup4, lxml, scikit-learn, xgboost, joblib, rapidfuzz, structlog, slowapi, pytest, pytest-asyncio, respx, ruff, mypy.
**web**: next, react, typescript, tailwindcss, shadcn/ui, lucide-react, recharts, @tanstack/react-query, zod, react-hook-form, openapi-typescript, vitest, @playwright/test.

## 8. First-Run Verification
```bash
docker compose up --build
curl localhost:8000/health        # {"status":"ok"}
open http://localhost:3000        # app shell
make seed && make test
```

## 9. Troubleshooting Setup
| Symptom | Fix |
|---|---|
| Port in use | change mapped port in compose |
| `asyncpg` build fail | use Python 3.11 image with `build-essential` |
| Playwright can't launch | add `--no-sandbox` only inside container; keep seccomp profile |
| CORS error | match `CORS_ORIGINS` with web origin |
