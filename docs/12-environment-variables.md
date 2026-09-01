# Environment Variables

Full reference, derived directly from `backend/src/config/env.ts` — the Zod schema that is the
runtime source of truth. If a required variable is missing at boot, the process logs the exact
Zod field errors and calls `process.exit(1)` — it will not start in a half-configured state.

## Backend (`backend/.env`)

| Variable | Required? | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `PORT` | No | `4000` | |
| `DATABASE_URL` | **Yes** | — | Postgres connection string. Also used directly by LangGraph's `PostgresSaver` checkpointer. |
| `REDIS_URL` | **Yes** | — | Backs all three BullMQ queues and the checkout mutual-exclusion lock. |
| `ADMIN_PASSWORD` | **Yes** | — | Single shared admin password. See [`08-admin-dashboard-and-auth.md`](./08-admin-dashboard-and-auth.md). |
| `SESSION_COOKIE_SECRET` | **Yes** | — | Reserved for session cookie signing. |
| `FRONTEND_URL` | Effectively required | — | Used for CORS `origin` and in email tracking links. |
| `APP_URL` | No | — | Reserved for a distinct application base URL. |
| `SENTRY_DSN` | No | — | Omit to run Sentry as a local no-op. |
| `LANGSMITH_API_KEY` | No | — | LangChain/LangGraph pick up standard `LANGCHAIN_*`/`LANGSMITH_*` env vars automatically for tracing — see LangSmith's docs. |
| `RAZORPAY_KEY_ID` | **Yes** | — | Razorpay dashboard → API Keys. |
| `RAZORPAY_KEY_SECRET` | **Yes** | — | |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | — | Set when you configure the webhook endpoint in the Razorpay dashboard; must match exactly. |
| `GMAIL_USER_NAME` | **Yes** | — | The Gmail address confirmation emails are sent from. |
| `GMAIL_APP_PASSWORD` | **Yes** | — | A Gmail [app password](https://support.google.com/accounts/answer/185833), not your real account password. |
| `MODEL_PROVIDER` | No | `gemini` | `anthropic` \| `openrouter` \| `groq` \| `openai` \| `gemini` \| `ollama` |
| `MODEL_NAME` | No | `gemini-3.5-flash` | Model id/string for whichever provider you pick. |
| `ANTHROPIC_API_KEY` | Only if `MODEL_PROVIDER=anthropic` | — | |
| `OPENROUTER_API_KEY` | Only if `MODEL_PROVIDER=openrouter` | — | |
| `GROQ_API_KEY` | Only if `MODEL_PROVIDER=groq` | — | |
| `OPENAI_API_KEY` | Only if `MODEL_PROVIDER=openai` | — | |
| `GEMINI_API_KEY` | Only if `MODEL_PROVIDER=gemini` | — | |
| `GEMINI_API_KEY_BACKUP` | No | — | Reserved secondary Gemini key. |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Only relevant if `MODEL_PROVIDER=ollama`. |
| `LOG_LEVEL` | No | `info` (pino default) | Read directly via `process.env.LOG_LEVEL` in `logger.ts`, not part of the Zod schema. |

The provider-key requirement is enforced dynamically (`env.ts`'s `.superRefine`): only the key
matching whatever `MODEL_PROVIDER` you chose is actually required; the rest can be left blank.
`ollama` needs no key at all (just a reachable `OLLAMA_BASE_URL`). This whole block of validation
is **skipped entirely when `NODE_ENV=test`** (see [`14-testing.md`](./14-testing.md)).

## Frontend (`frontend/.env`)

| Variable | Required? | Notes |
|---|---|---|
| `VITE_API_URL` | **Yes** | Base URL of the backend API, e.g. `http://localhost:4000` locally, or `https://convocart-backend.onrender.com` against the live backend. Must have the `VITE_` prefix — Vite only exposes prefixed variables to client code (`import.meta.env.VITE_API_URL` in `lib/api.js`). |

## Quick-reference: minimal working local `.env` files

See the root [`README.md`](../README.md#local-setup) for copy-pasteable `.env` templates using
the variable names above.
