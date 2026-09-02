# Frontend Architecture

Plain **Vite + React (JavaScript, not TypeScript) + Tailwind CSS** single-page app. No Redux/
Zustand/React Query — state is local `useState`/`useEffect` per page, and all server
communication goes through one hand-written fetch client.

## Routing (`App.jsx`)

| Path | Page | Notes |
|---|---|---|
| `/` | `LandingPage` | Marketing/landing content, category shortcuts into `/shop` |
| `/shop` | `ShopPage` | The actual product — chat panel + cart drawer |
| `/track/:orderId` | `OrderTrackingPage` | Public, token-gated (`?token=`) order status |
| `/admin/login` | `AdminLoginPage` | Password form |
| `/admin` | `AdminDashboardPage` | Behind `RequireAdminAuth` |
| `/admin/orders/:orderId` | `AdminOrderDetailPage` | Behind `RequireAdminAuth` |
| `*` | `NotFoundPage` | Catch-all |

## Component map

```
components/
├── Header.jsx              Top bar; shows cart count on the shop variant
├── AuditTrail.jsx           Renders an AuditLog[] timeline (shared: tracking page + admin)
├── StatusBadge.jsx           Colored order-status pill
├── ErrorBoundary.jsx          Class component, catches render errors
├── RequireAdminAuth.jsx       Route guard — calls the API, redirects on 401
├── HeroMockup.jsx              Decorative landing-page illustration
├── StitchDivider.jsx           Decorative section divider
├── chat/
│   ├── ChatPanel.jsx          The whole chat experience: input, message list, seed messages
│   ├── MessageBubble.jsx       One message (user or assistant)
│   ├── TypingIndicator.jsx     "..." while a turn is in flight
│   ├── ProductCard.jsx          A recommended-product card with its own Add button
│   └── UpsellCard.jsx            Visually distinct card for the one upsell offer per session
└── cart/
    ├── CartDrawer.jsx           Slide-over cart summary
    ├── CartLineItem.jsx          One cart line + qty stepper
    └── CheckoutFlow.jsx           Multi-step: delivery form → preview → confirm → Razorpay widget
```

## The chat experience (`ChatPanel.jsx`)

- Maintains its own local message list (separate from — and a UI-only mirror of — the backend's
  `Message` table and LangGraph checkpoint state; see
  [`03-agent-and-chat-flow.md`](./03-agent-and-chat-flow.md#two-separate-notions-of-chat-history)).
- Accepts a `seedMessage` prop (passed via React Router `location.state`) so the landing page's
  category buttons (`navigate('/shop', { state: { seed } })`) can pre-populate the very first
  chat turn — e.g. clicking "Running" on the landing page lands on `/shop` and immediately sends
  "Show me running shoes" as if the user typed it.
- Every `sendMessage` call is a single `await api.sendMessage(text)` — the UI shows a
  `TypingIndicator` for the entire round trip while the backend enqueues and processes the turn
  (see [`07-queues-and-background-jobs.md`](./07-queues-and-background-jobs.md)).
- On receiving a response, renders the reply text, then any `recommendedProducts` as
  `ProductCard`s and the `upsellProduct` (if present) as a distinct `UpsellCard`, and calls
  `onCartChange()` (passed down from `ShopPage`) whenever a card's own "Add" button succeeds, so
  the cart drawer badge count stays in sync without a full page reload.

## Cart UI (`ShopPage.jsx` + `cart/*`)

- `ShopPage` owns the actual cart state (`cart`, fetched via `api.getCart()` on mount and
  refreshed after any mutation) and passes handlers down to `CartDrawer`.
- `handleQtyChange` is a **remove-then-re-add** workaround for the backend's additive-only
  `addToCart` — documented in a code comment and explained fully in
  [`05-cart-and-checkout.md`](./05-cart-and-checkout.md#addtocart-is-additive-not-absolute).
- `CheckoutFlow.jsx` drives: delivery-details form → `checkoutPreview` (review screen, nothing
  written) → `checkoutConfirm` (creates the order + Razorpay order) → hands off to
  `lib/razorpay.js`, which dynamically loads Razorpay's `checkout.js` script and opens the
  payment widget using the `keyId`/`razorpayOrderId`/`amount` the backend returned.

## The API client (`lib/api.js`)

A single `request(path, options)` helper wraps `fetch` with:
- `credentials: 'include'` on every call (required so the session/admin cookies are sent).
- A consistent success/error contract matching the backend exactly (see
  [`10-logging-observability-and-error-handling.md`](./10-logging-observability-and-error-handling.md#the-apierror--apiresponse-contract)) —
  throws a typed `ApiError` (`code`, `message`, `status`, `details`) whenever `payload.success`
  is falsy, or a `code: 'NETWORK'` error if `fetch` itself throws (offline, CORS failure, etc.).
- Dev-only structured logging of every request/response/error via `devLogger` (see below).

`API_BASE` is read from `import.meta.env.VITE_API_URL` — the `VITE_` prefix is what Vite requires
for any env var to be exposed to client-side code (see the root
[`README.md`](../README.md#local-setup) for the exact `.env` setup).

`api.getProduct(id)` (`GET /api/products/:id`) is defined on the client for fetching a single
product by id, for use by any future single-product view.

## Dev-only tooling: browser-console-to-terminal logging

`frontend/vite-terminal-logger.js` is a small custom Vite plugin combined with
`frontend/src/lib/devLogger.js`: during `npm run dev`, every API request, response, timing, and
error logged by the frontend (via `devLogger`) is mirrored **into the terminal running the Vite
dev server**, not just the browser console — genuinely handy for watching frontend↔backend
traffic without opening devtools. Entirely gated behind `import.meta.env.DEV`, so none of this
plugin or logging code has any effect in a production build.

## Styling

Tailwind CSS (`tailwind.config` + utility classes throughout), a small custom design-token
palette (`ink`, `paper`, `pine`, `faint`, `muted`, `line`, etc. — visible throughout the JSX class
names), `lucide-react` for icons, and a custom `font-display`/`font-mono` type pairing. No
component library (no shadcn/MUI/etc.) — everything is hand-built Tailwind markup.

## Build & deploy

`vite build` produces a static `dist/` bundle; `frontend/vercel.json` sets a single SPA rewrite
rule (`/(.*) → /index.html`) so client-side routing works correctly on Vercel's static hosting.
See [`13-ci-cd-and-deployment.md`](./13-ci-cd-and-deployment.md) for the full deployment picture.
