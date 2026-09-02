# Security

A consolidated view of every security-relevant mechanism in the codebase — most of these are
covered in more depth in their respective feature docs; this file exists to look at them
together.

## Identity & sessions

- **Customers**: anonymous, cookie-based `Session` (`convocart_session`, httpOnly, `secure` in
  prod, `sameSite: none` in prod / `lax` in dev, 30-day expiry). No password, no PII required to
  browse or chat — PII (name/phone/email/address) is only collected at checkout, attached to the
  `Order`, not the `Session`.
- **Admin**: single shared password (`ADMIN_PASSWORD` env var), compared with
  `crypto.timingSafeEqual`, gating a flat `httpOnly` cookie (`convocart_admin=authenticated`, 4h
  expiry). See [`08-admin-dashboard-and-auth.md`](./08-admin-dashboard-and-auth.md) for the full
  design.
- **Order tracking**: a per-order random UUID (`Order.trackingToken`), independent of the primary
  key, required as a query param and compared with `crypto.timingSafeEqual` in
  `track.services.ts` — prevents guessing another customer's order by iterating ids, and the
  constant-time compare avoids leaking how many characters matched via response timing.

Every one of these three secret comparisons in the codebase (`admin.middleware.ts`,
`webhook.controller.ts`, `track.services.ts`) consistently uses the length-check-then-
`timingSafeEqual` pattern — a genuinely good, consistent security habit across the codebase.

## Transport & headers

- **Helmet** (`helmet()`) is applied globally in `index.ts` with a customized CSP that allows
  images from `'self'`, `data:`, Cloudinary (`res.cloudinary.com`), and `placehold.co` (used for
  product imagery/placeholders), on top of Helmet's secure defaults for everything else.
- **CORS** is locked to a single explicit origin — `env.FRONTEND_URL` — with `credentials: true`
  (required so the session/admin cookies are actually sent cross-origin between the Vercel
  frontend and the Render backend). If `FRONTEND_URL` isn't set, a boot-time warning is logged
  ("CORS will reject all browser origins") rather than silently allowing everything — a safe
  failure mode.
- **`trust proxy`** is enabled (`app.set('trust proxy', 1)`), correct for running behind
  Render's/Vercel's reverse proxies so `express-rate-limit` and `secure` cookies see the real
  client IP/protocol.

## Rate limiting

A single global limiter (`express-rate-limit`, 30 requests/minute per IP, standard headers) is
applied to every route **except** anything under `/api/webhooks` (Razorpay's own delivery cadence
shouldn't be throttled). This is a blunt, IP-wide limit — it doesn't distinguish `/api/chat`
(expensive, LLM-backed) from `/api/products` (cheap, DB-only), and it's shared with
`/api/admin/login` (see [`08-admin-dashboard-and-auth.md`](./08-admin-dashboard-and-auth.md) for
why that's a soft rather than strong brute-force defense).

## Webhook authenticity

Razorpay webhooks are verified with an HMAC-SHA256 signature over the **raw** request body
(`RAZORPAY_WEBHOOK_SECRET`), compared with `timingSafeEqual`, before the event is trusted or
enqueued for processing. See [`06-payments-and-webhooks.md`](./06-payments-and-webhooks.md).

## Prompt-injection resistance

The LLM system prompt explicitly treats all customer input as untrusted data, never as
instructions — with direct rules against revealing/paraphrasing the system prompt, honoring fake
system/developer messages embedded in customer text, or complying with false-authority claims
("I'm the store owner"). See
[`03-agent-and-chat-flow.md`](./03-agent-and-chat-flow.md#the-system-prompt-promptssystempromptts).
This is prompt-level defense only — there's no separate output-side moderation/classification
layer checking the model's replies before they reach the customer.

## Input validation

Every mutating/parsing endpoint validates its input with a Zod schema before touching the
database (`schemas/*.ts`) — chat message length (1–1000 chars), cart quantity bounds (1–5),
delivery details (name/phone/email/address/pincode length + email format), product search
filters. Validation failures return a structured `400 BAD_REQUEST` with the Zod field errors
attached (`ApiError` + `.flatten()`), consistently across controllers.

## PII handling

- `logger.ts`'s Pino instance redacts `*.phone`, `*.address`, `req.headers.authorization`,
  `req.headers.cookie`, and `res.headers["set-cookie"]` from structured logs, keeping the most
  sensitive fields out of log aggregation.
- Order PII (name, phone, email, address, pincode) is stored in plaintext in the `Order` table —
  standard for this kind of application, but worth noting there's no field-level encryption.
- `GMAIL_APP_PASSWORD` is an app-specific password (not the real Gmail account password), which
  is the correct pattern for SMTP credentials, but it's still a long-lived static secret with no
  rotation mechanism built in.

## CSRF

The current attack surface is deliberately low: the only state-changing admin action is
`POST /api/admin/login` (which requires knowing the password — the resulting session cookie is
only ever usable by the browser that received it), and customer-facing mutations (cart, checkout)
are scoped to an anonymous session with no cross-session blast radius. Explicit CSRF tokens are a
natural addition alongside any future destructive admin actions (refunds, order edits) — see
[`16-improvement-ideas.md`](./16-improvement-ideas.md).
