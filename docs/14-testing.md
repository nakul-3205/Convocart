# Testing

Backend only — there are no frontend tests in this repository (no test runner configured, no
`*.test.jsx` files under `frontend/`).

## Two test tiers

| Tier | Command | Config | What it hits |
|---|---|---|---|
| Unit | `npm test` / `npm run test:watch` | `vitest.config.ts` (default) | Pure logic, mocked/faked dependencies |
| Integration | `npm run test:integration` | `vitest.integration.config.ts` | Real ephemeral Postgres + Redis via Testcontainers |
| Both | `npm run test:all` | — | Runs unit then integration sequentially |

## Test files (`backend/src/test/`)

| File | Tier | Covers |
|---|---|---|
| `cart.services.test.ts` | Unit | `addToCart`/`getCartSummary` additive quantity logic, the 5-per-line cap |
| `checkout.schema.test.ts` | Unit | `DeliveryDetails` Zod validation edge cases |
| `graph.test.ts` | Unit | LangGraph helper functions (`normalizeMessageContent`, `toSafeMessages`, `wasAddToCartCalledThisTurn`-style logic) with fake message objects — not a live LLM call |
| `upsell.services.test.ts` | Unit | `getUpsellCandidate` eligibility filtering (stock, dedupe, cheapest-wins) |
| `order.services.integration.test.ts` | Integration | The real `confirmOrder` transaction against a real Postgres — concurrent-checkout stock-race behavior, rollback-on-insufficient-stock |
| `webhook.integration.test.ts` | Integration | Signature verification + idempotent processing against a real Postgres + Redis-backed queue |

## Why integration tests need real Postgres/Redis

`order.services.ts`'s stock reservation relies on a raw, atomic
`UPDATE ... WHERE stock >= qty RETURNING stock` SQL statement and Prisma interactive
transactions — behavior that a mocked Prisma client fundamentally cannot represent faithfully
(you cannot mock "this concurrent transaction lost the race and rolled back" without a real
database enforcing it). Similarly, the webhook flow's idempotency and BullMQ job processing
depend on real Redis semantics. `@testcontainers/postgresql` and `@testcontainers/redis` spin up
disposable, isolated containers per test run (locally, this requires Docker running; in CI,
GitHub-hosted `ubuntu-latest` runners have Docker pre-installed, so this works without any extra
CI setup).

`backend/src/test/setup.integration.ts` handles the container lifecycle (start containers, run
`prisma migrate deploy` against the ephemeral database, tear down after the suite).

## Test-mode env bypass

`backend/src/config/env.ts` short-circuits its own strict validation when `NODE_ENV=test`:

```ts
const parsed = EnvSchema.safeParse(
  isTest
    ? { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? 'test', ADMIN_PASSWORD: ... ?? 'test', ... }
    : process.env,
);
```

Every otherwise-required secret (`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_COOKIE_SECRET`,
`REDIS_URL`, the three Razorpay vars, the two Gmail vars) falls back to the literal string
`'test'` if not explicitly set — and the provider-API-key `.superRefine` check is skipped
entirely in test mode. This is why CI's `test` job only needs to set `GEMINI_API_KEY=test-key`
(unit tests don't make real LLM calls, so even that placeholder is never actually used for a real
request) and nothing else — real secrets are never needed to run the test suite, in CI or
locally.

## Running tests locally

```bash
cd backend
npm run test              # unit only, fast, no Docker needed
npm run test:integration  # needs Docker running locally (Testcontainers pulls postgres/redis images)
npm run test:all          # both
```

## Pre-commit / pre-push hooks (Husky)

`backend/.husky/`:

- **`pre-commit`**: `npx lint-staged` (ESLint `--fix` + Prettier on staged `.ts`/`.tsx`,
  Prettier on staged `.json`/`.md`) → `npm run typecheck` → `npm test`. So a commit that fails
  type-checking or unit tests is blocked locally before it even reaches CI.
- **`pre-push`**: `npm run test:integration` — the slower, Docker-dependent suite runs at push
  time rather than every commit, a sensible speed/safety trade-off.

These hooks only run if `npm install` (which triggers `prepare: husky`) has been run inside
`backend/` — they're local developer-experience guardrails, not a substitute for CI, which is the
actual required gate before merging to `main` (via GitHub's branch protection, if configured on
the repo — not something visible from the code itself).

## Coverage

`@vitest/coverage-v8` is a dev dependency but no `--coverage` invocation is wired into any
`package.json` script or the CI workflow — coverage can be generated ad hoc
(`npx vitest run --coverage`) but isn't tracked or enforced anywhere currently.
