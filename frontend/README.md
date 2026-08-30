# Convocart frontend

React + Vite + Tailwind + React Router. Talks to the Express backend via cookie-based
sessions (`credentials: 'include'` everywhere) — no client-side auth state at all for shoppers.

## Run it

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your running backend
npm run dev
```

## Before it'll fully work against the backend

Two backend bugs will block the checkout flow until fixed:

1. `order.services.ts` → `confirmOrder`: `tx.order.create(...)` isn't assigned to a variable,
   but the next line reads `order.id` for the audit log — throws at runtime on every checkout.
2. `index.ts` CORS: `origin: '*'` + `credentials: true` — browsers won't set/send the session
   cookie cross-origin with that combo. Set `origin` to your actual frontend URL (the
   `FRONTEND_URL` env var is already there, just commented out).

## Structure

- `src/lib/api.js` — fetch wrapper matching the `{ success, data }` / `{ success:false, error }` envelope
- `src/lib/razorpay.js` — Checkout.js loader + open helper (handles success/failure/dismiss)
- `src/lib/format.js` — paise→₹ and date formatting
- `src/components/chat/` — message bubbles, inline product/upsell cards, typing indicator
- `src/components/cart/` — cart drawer + the delivery→review→pay→confirmation flow
- `src/pages/` — one file per route

## Design tokens

Palette, type scale, and the dashed "stitch" motif (a nod to shoe stitching / a receipt
perforation, used as the recurring divider) live in `tailwind.config.js` and `src/index.css`.
