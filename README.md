# Convocart

A conversational, AI-agent-driven shoe storefront. Instead of browsing a category grid, the
customer talks to a chat assistant that searches the catalog, adds items to a cart, and hands off
to a Razorpay-powered checkout — with a small admin dashboard for order visibility and a full
"why did the agent do that" audit trail.

**Live app:**
- Frontend: **https://convocart-oqc5.vercel.app/**
- Backend API: **https://convocart-backend.onrender.com** (liveness check at
  [`/health`](https://convocart-backend.onrender.com/health))

**Full documentation:** everything about how this system works — architecture, the LangGraph
agent, the upsell logic, payments/webhooks, queues, admin, security, logging, the database
schema, CI/CD, testing, known issues, and the feature roadmap — lives in [`docs/`](./docs). Start
with [`docs/01-architecture-overview.md`](./docs/01-architecture-overview.md) for the map, then
dive into whichever piece you're working on:

| Doc | Covers |
|---|---|
| [`01-architecture-overview.md`](./docs/01-architecture-overview.md) | The system map — start here |
| [`02-database-schema.md`](./docs/02-database-schema.md) | Every table, every field, the ERD |
| [`03-agent-and-chat-flow.md`](./docs/03-agent-and-chat-flow.md) | The LangGraph agent, tools, system prompt |
| [`04-upsell-logic.md`](./docs/04-upsell-logic.md) | How the one-shot upsell recommendation works |
| [`05-cart-and-checkout.md`](./docs/05-cart-and-checkout.md) | Cart model, stock reservation, checkout |
| [`06-payments-and-webhooks.md`](./docs/06-payments-and-webhooks.md) | Razorpay, webhooks, self-healing reconciliation |
| [`07-queues-and-background-jobs.md`](./docs/07-queues-and-background-jobs.md) | BullMQ queues & workers |
| [`08-admin-dashboard-and-auth.md`](./docs/08-admin-dashboard-and-auth.md) | Admin login & dashboard |
| [`09-security.md`](./docs/09-security.md) | Sessions, cookies, CORS, rate limiting, webhook auth |
| [`10-logging-observability-and-error-handling.md`](./docs/10-logging-observability-and-error-handling.md) | Pino, Sentry, error contract |
| [`11-frontend-architecture.md`](./docs/11-frontend-architecture.md) | React app structure |
| [`12-environment-variables.md`](./docs/12-environment-variables.md) | Every env var, required or not |
| [`13-ci-cd-and-deployment.md`](./docs/13-ci-cd-and-deployment.md) | GitHub Actions, Docker, Render/Vercel |
| [`14-testing.md`](./docs/14-testing.md) | Unit + integration tests, Testcontainers |
| [`15-known-issues-and-bugs.md`](./docs/15-known-issues-and-bugs.md) | Status tracker for in-progress items |
| [`16-improvement-ideas.md`](./docs/16-improvement-ideas.md) | Feature & architecture roadmap |

## Tech stack at a glance

- **Backend**: Node.js + TypeScript, Express, Prisma (PostgreSQL), LangGraph + LangChain
  (multi-provider LLM support), BullMQ (Redis), Razorpay, Nodemailer (Gmail), Sentry, Pino.
- **Frontend**: React (JavaScript) + Vite + Tailwind CSS, no state-management library.
- **Infra**: PostgreSQL, Redis, Docker (backend image), GitHub Actions CI.

```mermaid
flowchart LR
    UI[React SPA<br/>Vercel] -->|fetch, cookies| API[Express API<br/>Render]
    API --> PG[(PostgreSQL)]
    API --> REDIS[(Redis / BullMQ)]
    API --> LLM[LLM provider]
    API --> RZP[Razorpay]
```

See [`docs/01-architecture-overview.md`](./docs/01-architecture-overview.md) for the full diagram
and request-flow breakdown.

---

## Local setup

### Prerequisites

- Node.js 24+ and npm
- A running PostgreSQL instance (local or cloud)
- A running Redis instance (local or cloud)
- (Optional, for the full integration test suite) Docker, for
  [Testcontainers](./docs/14-testing.md)

If you don't already have Postgres/Redis running locally, the fastest path is Docker:

```bash
docker run -d --name convocart-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=convocart -p 5432:5432 postgres:16
docker run -d --name convocart-redis -p 6379:6379 redis:7
```

### 1. Clone and install

```bash
git clone <this-repo-url>
cd Convocart-main

cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend env (`backend/.env`)

```dotenv
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/convocart
REDIS_URL=redis://localhost:6379

ADMIN_PASSWORD=changeme
SESSION_COOKIE_SECRET=some-long-random-string

FRONTEND_URL=http://localhost:5173

# Payments — get test-mode keys from the Razorpay dashboard
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Order-confirmation email — a Gmail address + an App Password
# (https://support.google.com/accounts/answer/185833), not your normal password
GMAIL_USER_NAME=
GMAIL_APP_PASSWORD=

# LLM provider — pick one and set the matching key
MODEL_PROVIDER=gemini
MODEL_NAME=gemini-3.5-flash
GEMINI_API_KEY=

# Optional
SENTRY_DSN=
LOG_LEVEL=info
```

See [`docs/12-environment-variables.md`](./docs/12-environment-variables.md) for the full
reference, including every alternate LLM provider's key name and every optional variable.

> **Webhook testing locally**: Razorpay needs a publicly reachable URL to deliver webhooks to.
> Use a tunnel (e.g. `ngrok http 4000`) and point the Razorpay dashboard's webhook config at
> `https://<your-tunnel>/api/webhooks/razorpay`, using that same secret as
> `RAZORPAY_WEBHOOK_SECRET`. Without this, payments will still complete client-side, but the
> order won't flip to `paid` until the cleanup worker's reconciliation sweep catches it a couple
> of minutes later (see [`docs/06-payments-and-webhooks.md`](./docs/06-payments-and-webhooks.md)).

### 3. Frontend env (`frontend/.env`)

```dotenv
VITE_API_URL=http://localhost:4000
```

The `VITE_` prefix is required — Vite only exposes prefixed variables to client-side code.

### 4. Set up the database

```bash
cd backend
npx prisma migrate dev
```

This creates all the app's tables. It also causes LangGraph's checkpointer to set up its own
tables automatically the first time the server boots.

### Seeding product data

The product catalog (shoes + accessories + their cross-sell relationships) is inserted by
`backend/prisma/seed.ts`. The script ships with its body commented out (`// uncomment this
script to run and get products in your db`) so seeding is opt-in:

1. Open `backend/prisma/seed.ts` and uncomment the script body.
2. Run:
   ```bash
   npx prisma db seed
   ```

Without this step, `/shop` will load with an empty catalog and the agent's `search_products` tool
will always return zero results. See
[`docs/02-database-schema.md`](./docs/02-database-schema.md#migrations--seeding) for what the
seed data contains.

### 5. Run it

Two terminals:

```bash
# Terminal 1 — backend (API + all BullMQ workers, one process)
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

- Backend: `http://localhost:4000` (health check: `http://localhost:4000/health`)
- Frontend: `http://localhost:5173`

Open the frontend, go to `/shop`, and start chatting. To reach the admin dashboard, go to
`/admin/login` and use the `ADMIN_PASSWORD` you set above.

### Running against the live backend instead

If you just want to work on the frontend without running the backend locally, point
`VITE_API_URL` at the live API instead:

```dotenv
VITE_API_URL=https://convocart-backend.onrender.com
```

### Running tests

```bash
cd backend
npm run test              # unit tests, fast
npm run test:integration  # needs Docker running (Testcontainers)
npm run test:all          # both
```

See [`docs/14-testing.md`](./docs/14-testing.md) for what each tier covers.

---

## Deployment

The live app deploys via each platform's own GitHub integration — Vercel for the frontend, Render
for the backend — independently of the GitHub Actions workflow, which runs the backend's full
test suite on every push/PR and additionally builds a Docker image. Full details, including the
Dockerfile and the alternate self-hosted deployment path, are in
[`docs/13-ci-cd-and-deployment.md`](./docs/13-ci-cd-and-deployment.md).

---

## Repository layout

```
Convocart-main/
├── backend/     Express + TypeScript API, Prisma schema, agent, queues
├── frontend/    Vite + React SPA
├── docs/        Full documentation (this is the good stuff — start here)
└── .github/     CI workflow
```

For anything not covered above, the [`docs/`](./docs) folder is the source of truth.
