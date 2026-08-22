# Convocart — Product Requirements Document

**Track:** Razorpay AI Buildathon — Track 1, AI Growth & Agentic Commerce
**Type:** Conversational shop-copilot agent — recommends products, upsells (bounded), and completes a real Razorpay test-mode payment in-chat
**Timeline:** 8-10 days, solo build, free-tier infra only

---

## 1. Problem & Goal

Standard e-commerce forces a customer through search → filters → product page → cart → checkout, one click at a time. Convocart replaces that with a conversation: tell it what you want, it recommends, it can suggest one relevant add-on, and it completes a real payment without leaving the chat — like a salesperson at a physical counter who can show you things and quote prices, but never decides anything on their own.

**Judging bar (Razorpay's own criteria for this track):** every money-related action must be **explainable**, **bounded**, and **gated** by an explicit human confirmation — backed by a visible **audit trail**, and with **at least one failure handled gracefully**, not just the happy path.

**Personal goals for this build:** hands-on practice with agent orchestration (LangGraph), async job processing under real free-tier rate limits (queue + bounded worker concurrency), payment webhook idempotency, structured logging/observability, and end-to-end deployment — not just another LLM-wraps-an-API demo.

---

## 2. Non-Goals (explicit MVP scope)

Deliberately out of scope for the 7-day build — stated on purpose, not gaps:

- **Shopper login/signup/accounts (Clerk or otherwise) — deliberately excluded.** Real e-commerce apps have auth because they serve long-term, cross-device account relationships at scale; a 7-day demo needs to prove a specific technical thesis (agentic commerce with guardrails) in a 5-minute pitch, and none of the judged criteria touch authentication. The phone number collected at checkout already gives a lightweight "returning customer" signal (§7) at zero build cost. Auth is a real, non-trivial time cost (signup/login UI, session integration across every protected route, guest-vs-logged-in forking) that would come directly out of days needed for the guardrails/queue/audit-trail work that's actually being judged. Worth adding later if this becomes a persistent side project past the hackathon — not now.
- Multi-merchant support, inventory sync with a real warehouse
- Refunds/cancellations flow
- Tax-slab logic (flat delivery fee, prices treated as final — see §7)
- Vector DB / semantic search (catalog is small and single-category — plain filtering covers it)
- Full admin panel (order management, analytics) — only what's needed to show the audit trail

---

## 3. Core User Flow

```
Shopper opens chat (UUID cookie = identity, no login)
 → says what they want → backend runs a structured product search (LLM only turns
   free text into structured filters — never picks products itself)
 → 3 relevant cards shown + "Show more" button (pure pagination, zero LLM cost)
 → shopper adds item(s) + quantity to cart (cart = wishlist, nothing reserved yet)
 → says "checkout" → cart summary shown (line items, qty, prices, delivery fee, total)
   + at most ONE upsell suggestion with a visible reason, only if not already declined
 → delivery details form (name, phone, address, pincode, notes) — structured form,
   not chat-parsed free text
 → confirm → stock reserved atomically for the exact quantities (with a 15-min TTL)
   → Razorpay order created (price always re-derived from DB, never from chat text)
 → Razorpay Checkout widget opens → shopper pays (test mode)
 → webhook confirms → order marked paid, stock reservation becomes permanent,
   confirmation email sent, audit log updated
 → chat shows confirmation; cart clears
```

---

## 4. Features

### Shopper-facing
- Natural-language product search with structured, catalog-constrained results (no hallucinated products)
- "Show more" pagination — zero additional LLM calls
- At most one clarifying question at a time if a query is too broad (never size+budget+color together)
- Persistent, always-visible cart (line items, qty, unit price, upsell if added, delivery fee, total) — rendered from backend state, never described only in chat prose
- One bounded, reasoned upsell per checkout, never repeated after a decline
- Structured delivery-details form before payment
- Real Razorpay test-mode payment, in-chat
- Graceful handling of: item selling out at checkout, and a declined payment
- Order confirmation email

### Merchant-facing (minimal, scoped to what's judged)
- Password-gated dashboard (env-var secret, not full auth)
- Order list with status
- Audit trail per order — the explainability evidence for the pitch
- Stock/exception events log

---

## 5. Guardrails (the actual judging criteria, made concrete)

| Principle | How it's enforced |
|---|---|
| **Explainable** | Every recommendation, upsell offer, and charge is logged with a reason string captured at decision time — not reconstructed after the fact |
| **Bounded** | Upsell capped at one per checkout, never re-offered after a decline, upsell price ≤ 30% of main item; max qty per line item capped (e.g. 5) |
| **Gated** | Nothing is charged until an explicit "confirm" step; the LLM proposes, it never executes a charge |
| **Price integrity** | The ₹ amount charged always comes from a server-side DB lookup at order-creation time — never from LLM-generated text. This is what makes prompt injection unable to touch real money, regardless of what a user tries to type |
| **Grounded product claims** | If the LLM phrases a description, it can only draw from real DB fields — never add an unverified claim |
| **Idempotency** | Stock reservation and webhook processing are both idempotent — no double-charge, no double-fulfillment on retry/duplicate delivery |
| **One failure, handled well** | Two are covered: (1) stock-race at checkout — reproducible on demand, (2) declined test card — Razorpay's test cards force this deterministically |

---

## 6. System Architecture

```
┌─────────────┐      ┌──────────────────────────┐      ┌─────────────┐
│  Frontend    │────▶│  Express + TS API          │────▶│  Postgres    │
│  (React/Vite,│      │  - chat endpoint           │      │  (Neon)      │
│  Tailwind,   │◀────│  - product search/pagination│◀────│              │
│  shadcn/ui)  │      │  - cart/checkout            │      └─────────────┘
└─────────────┘      │  - admin (password-gated)   │
                      └───────────┬──────────────┘
                                  │ enqueue
                                  ▼
                      ┌──────────────────────────┐
                      │  Redis (Upstash) + BullMQ  │
                      │  4 queues:                 │
                      │  - chat LLM calls (bounded  │
                      │    worker concurrency)      │
                      │  - webhook processing       │
                      │  - stock-reservation TTL     │
                      │    cleanup                  │
                      │  - confirmation email        │
                      └───────────┬──────────────┘
                                  ▼
                      ┌──────────────────────────┐
                      │  Worker process             │
                      │  - LangGraph.js agent graph  │
                      │    (traced via LangSmith)    │
                      │  - Razorpay SDK (orders,     │
                      │    webhook verify)           │
                      │  - Resend (email)            │
                      └──────────────────────────┘
```

LangGraph's Postgres checkpointer holds each session's running conversation state (short-term memory) — no separate hand-rolled "fetch last N messages" logic needed.

---

## 7. Business Rules (decided, not left ambiguous)

- Delivery fee: flat amount regardless of order total (MVP simplification)
- Prices: treated as final/tax-inclusive, no tax-slab logic
- Stock reservation: happens at **checkout confirm**, not at add-to-cart
- Reservation TTL: 15 minutes; released early on explicit payment failure, released by a cleanup job on TTL expiry if no webhook ever arrives
- Long-term memory: keyed by phone number (collected at checkout anyway) — no separate login needed to recognize a returning customer

---

## 8. Data Model

| Table | Key fields | Notes | Admin dashboard use |
|---|---|---|---|
| `products` | id, name, category, description, price, stock, image_url | Single category catalog (~40-150 items) | Read-only catalog view; seeded via script, not edited in UI |
| `product_cross_sells` | product_id, cross_sell_product_id | Curated upsell candidate pool — the LLM picks *from* this, never invents | Not shown — internal to the agent logic |
| `sessions` | id (UUID), created_at, last_active_at | Cookie-based identity | Not shown directly |
| `messages` | id, session_id, role, content, created_at | Full chat history, permanent | Shown inside an order's detail view — the actual conversation that led to the purchase, right next to the audit log. Reinforces "explainable" in the demo itself |
| `orders` | id, session_id, status (pending/paid/failed/expired), subtotal, delivery_fee, total, customer_name, phone, address, pincode, delivery_notes, razorpay_order_id, reserved_until, created_at | | The main order list — id, customer, total, status |
| `order_items` | id, order_id, product_id, qty, unit_price_at_order | Price snapshot — never re-read live product price after order creation | Expandable line items under each order row |
| `audit_log` | id, order_id (nullable), session_id, event_type, reason_text, metadata_json, created_at | The explainability evidence | The core "why" trail per order — the centerpiece of the pitch demo |
| `processed_webhook_events` | id, razorpay_event_id (unique), processed_at | Idempotency dedup table | Not shown — internal only |
| `customer_preferences` | id, phone (unique), preferences_json, updated_at | Long-term memory, MVP version | Shown as a small "returning customer" note on an order if the phone matches a past one |

**Single database — Postgres only, no Mongo.** Chat messages have a simple, stable shape (session_id, role, content, timestamp) that fits a relational table perfectly; there's no flexible/nested structure here that would justify a document store. Splitting data across two databases for a solo 7-day build adds real operational cost (two connection configs, two failure domains) for no actual benefit — it'd be infra for its own sake, the same trap as the vector-DB and admin-panel-scope calls earlier in this doc.

**ORM: Prisma.** Checked current comparisons rather than assuming — Drizzle's main edge is edge/serverless runtimes (Cloudflare Workers, Vercel Edge), which doesn't apply here since the backend runs on Railway/Fly.io as a normal long-lived Node process, not on the edge. For a solo 7-day build, Prisma's schema language is faster to sketch, its docs are the easier learning curve, and Prisma Studio gives you a visual DB browser for free during dev/demo. The one place we need hand-written atomic SQL — the stock reservation `UPDATE ... WHERE stock >= qty RETURNING stock` — Prisma supports directly via `$executeRaw`, so it's not a blocker.

**API style: plain REST, with shared types via Zod — not tRPC.** Reconsidered: tRPC is a new paradigm to learn, and with an 8-10 day timeline and zero prior experience with it, that's real risk for no must-have benefit. Plain REST endpoints, with request/response shapes defined once as Zod schemas in a shared file — the backend uses the schema to validate incoming data at runtime, and both backend and the AI-built frontend import the same TypeScript type derived from it (`z.infer<...>`). That gets you real type safety across the frontend/backend boundary without adopting a new framework mid-build.

---

## 9. Routes

Plain REST, request/response shapes validated + typed via shared Zod schemas (see §8):

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat` | session_id + message → agent response (enqueues to the LLM queue) |
| GET | `/api/products` | search/filter/paginate (deterministic, no LLM) |
| GET | `/api/products/:id` | single product detail |
| POST | `/api/cart/confirm` | items[{product_id, qty}] + delivery info → reserves stock, creates Razorpay order |
| GET | `/api/orders/:id` | status polling fallback |
| POST | `/api/admin/login` | password-gated |
| GET | `/api/admin/orders` | order list + audit trail + linked chat transcript (protected) |
| POST | `/api/webhooks/razorpay` | signature-verified → enqueued, never processed synchronously |
| GET | `/health` | checks DB + Redis connectivity |

---

## 10. Error Handling & Resilience

- **Typed, consistent error responses:** every endpoint returns errors in one shared shape (`{ error: { code, message } }`), with codes like `NOT_FOUND` or `CONFLICT` for a stock-out — the frontend branches on `code`, not by parsing a raw string. Zod validation errors on bad input get caught centrally and turned into this same shape automatically.
- **User-facing vs internal errors, kept separate:** expected failures (sold out, payment declined) get clear, specific messages. Unexpected internal errors get a generic "something went wrong, we're on it" to the user — full detail only ever goes to logs/Sentry, never leaked to the client.
- **Retries with backoff, not blind retries:** BullMQ's built-in per-queue retry config (exponential backoff, e.g. 3 attempts) handles transient failures — this is exactly the tool for free-tier 429s on the LLM queue and flaky network blips on webhook processing.
- **Provider fallback:** after N consecutive failures on the primary free LLM, the queue worker falls back to the single backup provider for that job rather than failing the user's request outright.
- **Graceful shutdown:** on `SIGTERM`, stop accepting new HTTP requests, let in-flight requests finish, close BullMQ workers cleanly (`worker.close()` waits out active jobs instead of killing them mid-job), close DB/Redis connections last. Matters the moment this is behind Railway/Fly.io's deploy process, not just in theory.
- **Every caught error is logged with context** (`session_id`/`order_id`/`event_type` via pino) and reported to Sentry — nothing fails silently into a swallowed catch block.

---

## 11. Monitoring & Logging (kept basic but real)

- **Structured logging:** `pino` (fast, JSON-structured, standard for Node/TS) instead of scattered `console.log`. Every log line carries `session_id`/`order_id`/`event_type` where relevant. Never log full phone/address values — mask them.
- **Request logging:** `pino-http` middleware — every request logged with method, path, status, duration.
- **Error tracking:** Sentry free tier — centralizes unhandled errors/rejections with stack traces into one dashboard instead of scattered logs. Quick to wire up, genuinely useful the moment something breaks mid-demo-prep.
- **Agent-layer tracing:** LangSmith (already part of the stack) — traces every LangGraph node, latency, token usage. This is your "why did the agent do that" tool during dev and a good screenshot for the pitch.
- **Health check:** `/health` verifies DB + Redis are reachable — useful for the hosting platform and for a pre-demo sanity check.
- **Business-level monitoring:** the audit log + admin dashboard *is* your monitoring for the thing actually being judged — order funnel, exceptions, upsell acceptance.
- *Stretch, not core:* simple counters (orders created/paid, queue depth) exposed on an internal endpoint — skip a full Prometheus/Grafana setup, not worth the time for 7 days.

---

## 12. Final Tech Stack

| Layer | Choice |
|---|---|
| Backend | Express + TypeScript |
| Agent orchestration | LangGraph.js + LangChain.js, traced with LangSmith |
| LLM | Gemini free tier (Flash), one backup free provider |
| ORM / DB | Prisma + Postgres (Neon free tier) |
| Queue | Redis (Upstash free) + BullMQ — chat LLM calls, webhook processing, stock TTL cleanup, confirmation email |
| Long-term memory | `customer_preferences` table keyed by phone (mem0 as an optional stretch swap-in) |
| Payments | Razorpay Orders API + Checkout.js + Webhooks (test mode) |
| Email | Resend (free tier) |
| Logging/monitoring | pino + pino-http, Sentry (free tier), `/health` endpoint |
| API style | REST + Zod (shared validation + derived TypeScript types) |
| Frontend | React (Vite) + Tailwind + shadcn/ui — AI-built |
| Hosting | Vercel (frontend only) · Railway or Fly.io (backend + worker) |
| Auth | None — session cookie + phone-based returning-customer recognition (see §2) |
| Database | Postgres only, no Mongo (see §8) |

---

## 13. Dev Plan — 8-10 Days

| Day | Build |
|---|---|
| **1** | Prisma schema + migrations, seed 40-150 products (one category) + cross-sell mapping, Express skeleton, pino logging, `/health` |
| **2** | Session cookie, chat endpoint, LangGraph.js graph skeleton (classify → search → respond) with Postgres checkpointer, deterministic product search + "show more" pagination |
| **3** | Cart state + persistent cart data contract, bounded/reasoned upsell logic, delivery-details form endpoint |
| **4** | Order-confirm flow: atomic qty-aware stock reservation, Razorpay order creation, Checkout.js wiring, end-to-end test payment |
| **5** | Webhook handler → BullMQ queue → idempotent processing, TTL cleanup job, per-session confirm lock, declined-payment path |
| **6** | Confirmation email (Resend), audit log wired everywhere, password-gated admin dashboard, Sentry + LangSmith wired in, `customer_preferences` wired |
| **7** | Break-it testing (concurrent stock race, injection attempt, double-click), fix whatever it finds |
| **8-9** | Buffer — frontend polish (this is where most of the AI-built UI iteration realistically happens), deployment hardening, edge cases you find while actually using it end to end |
| **10** | Record the pitch video, write the architecture README, final run-through |

---

## 14. Environment Variables (planning reference)

`DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `LANGSMITH_API_KEY`, `ADMIN_PASSWORD`, `SESSION_COOKIE_SECRET`