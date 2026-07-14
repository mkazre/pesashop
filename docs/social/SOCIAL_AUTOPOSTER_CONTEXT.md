# Social Auto-Poster — Session Context & Decisions Already Made

Read this **first**, then read the two governing docs alongside it:

- `PesaShop_Social_AutoPoster_Spec.md` — the WHAT (v2.1, 31 sections). Source of truth for requirements.
- `PesaShop_VSCode_Implementation_Brief.md` — the HOW (v1.0). Source of truth for process: 15 phases, each ending in a STOP AND CONFIRM gate.

These were converted from the original `.docx` files, which live on MK's laptop and are not in this repo.

## Scope

This module is for the **PesaShop web admin panel** (production: GitHub → Railway / Netlify, with Cloudinary and MongoDB). It is **not initially** for the Expo mobile apps in `mobile/` — but MK wants the validated feature set ported to mobile once the web admin build is tested and signed off (not built simultaneously; a deliberate follow-up phase after Phase 14/15, not a parallel track). It adds multi-platform social posting (Facebook, Instagram, X, TikTok, LinkedIn), a trend engine, a visual post designer, and a human approval queue.

## Workflow: commit and push to GitHub as we go

MK's standing instruction (2026-07-14): every logical chunk of work gets committed and pushed to `origin` (`github.com/mkazre/pesashop`), directly to `main` — this matches how the rest of this repo has always been worked (see recent commit history: direct commits to main, no PR flow). Don't batch multiple phases' worth of changes into one commit; push after each meaningful chunk so everything stays tracked and accounted for.

## Decisions already made by MK (do not re-litigate)

**1. MongoDB-native data layer.**

The spec assumes **PostgreSQL + pgvector** throughout — the 15-migration sequence in Section 24, the `ALTER TABLE products ADD COLUMN` statements in Section 9.5.2, the SQL cool-down query in Section 10.8.3, the `social` schema concept, and the `vector(1536)` columns in Section 11.1.

PesaShop production runs **MongoDB**. Per the Brief's own precedence rule ("if any part of the spec conflicts with the existing PesaShop convention, the existing PesaShop convention wins"), MK has chosen to go **MongoDB-native**: redesign the social data model, migrations, and vector search for Mongo rather than provisioning a second database alongside it.

*Why:* adding Postgres purely for this module would fork the production data layer and double the ops surface on a live system.

*How to apply:* treat every Postgres-specific instruction in the spec as needing translation to Mongo. **Verify the MongoDB assumption during the Phase 0 audit** — it comes from MK's description of production, not yet from reading the code.

**2. Known open risk — vector search.**

MongoDB has no pgvector equivalent. The semantic trend–product matcher (Spec Section 10.6) is the core of the trend engine: it is what makes "back to school" match uniforms and lunchboxes rather than matching nothing. On MongoDB the realistic path is **Atlas Vector Search**, which requires MongoDB **Atlas** — if PesaShop's Mongo is a plain Railway instance, that is a hosting change, not a code change.

Establish which one it is during Phase 0. This does **not** block Phases 0–7; it must be resolved before Phase 9.

## Process rules (from the Brief, Section 4)

- Work in phases. **Never skip a STOP AND CONFIRM gate.** Wait for MK to reply "proceed".
- Never invent conventions — audit and follow existing PesaShop patterns for folder structure, routing, auth, logging, migrations, and testing.
- Never commit secrets. Credentials go in `.env.local` (gitignored) or the existing secret-management pattern.
- TypeScript strict mode for all new social-module code.
- Never log raw tokens, full platform API request/response bodies, or user PII beyond `user_id`.
- Log every action: what file is being created, what file is being edited, what decision is being made and why.
- Begin each response with the current phase; end with the exit state.

## Where we are

**Phase 0 (Codebase Audit) is complete (2026-07-14).** Full findings live in the audit report delivered in-session; the decisions arising from it are below. Phase 1 (Database Schema and Migrations) has not started — waiting on MK's "proceed."

## Phase 0 findings, confirmed facts

- MongoDB is **Atlas-hosted** (organization "mkhaliphi's Org", project/cluster "PesaShop") — confirmed directly by MK via the Atlas Data Explorer, not inferred from docs. The self-hosted-looking `mongodb://` in `.env`/`docs/DEPLOYMENT.md` is stale/local-dev only.
- Active catalogue size is **10,000+ products**.
- A working embeddings + semantic-search pipeline already exists in production for visual search (`backend/services/visualSearchService.js`, `backend/cron/visualSearchCron.js`): OpenAI `text-embedding-3-small`, vector stored as a plain array field on `Product`, brute-force in-memory cosine similarity (no Atlas Vector Search in use).
- First-party search signal is **already live**: `frontend/src/hooks/useAnalytics.js`'s `trackSearch` is wired into `DefaultHeader.jsx` and writes to the `SiteEvent` Mongo collection via `POST /api/stats/event`. Cart signal was NOT wired (see decisions below).
- No Redis/BullMQ anywhere; background jobs use `node-cron` (`backend/cron/*.js`).
- No event-emitter/domain-event pattern for anything product-related.
- No structured logger in actual use (winston is an unused dependency; real convention is `console.*` + morgan).
- No test framework anywhere in the repo (no Jest/Mocha/Playwright, zero test files).
- No Konva/Fabric anywhere — clean slate for the Visual Post Designer.
- Naming collision: `backend/{routes,services}/socialEngine.js` already exists and is unrelated (TikTok UGC video feed for the storefront) — the new module must NOT be named `social`/`socialEngine`.
- Brand tokens: the spec's quoted hex values (#1a5c2e/#e8a000/#eceae6, Public Sans) are the **email-template** brand system only (Brevo). The actual admin-panel/storefront UI runs a different, already-established Tailwind theme (`primary` #0e604a, `secondary` #f7bd20, font Inter).

## Decisions confirmed by MK (2026-07-14) — do not re-litigate

1. **Scheduling/background jobs (blocks Phase 4)**: `node-cron` + MongoDB-based job state, not Redis+BullMQ. *Why:* matches the existing pattern used by all 5 current cron jobs; avoids introducing infrastructure nothing else in PesaShop uses. *How to apply:* retry/backoff/rate-limiting for the publisher worker must be hand-rolled (no BullMQ primitives).
2. **Vector search for Trend Engine (blocks Phase 9)**: brute-force in-memory cosine similarity, reusing the exact pattern in `visualSearchService.js`, not Atlas Vector Search — for now. *Why:* zero new setup, proven pattern already in production. *How to apply:* catalogue is confirmed 10,000+ products — watch trend-matching latency in Phase 9; an Atlas Vector Search migration is the planned next step if brute-force starts showing latency, not an afterthought.
3. **Product-publish hook (blocks Phase 6)**: direct service call from the existing product save/update route, not an EventEmitter bus. *Why:* matches how every other cross-feature interaction in this codebase works; no EventEmitter pattern exists anywhere for this.
4. **Logging**: introduce **pino** for the new social-poster module specifically, despite the rest of PesaShop using plain `console.*`. *Why:* MK's explicit call — structured logs are worth it for OAuth/money-adjacent code even as the first structured logger in the app. *How to apply:* pino is scoped to the social-poster module only; don't retrofit the rest of the backend.
5. **Brand tokens**: use the existing admin-panel Tailwind tokens (`primary` #0e604a, `secondary` #f7bd20, Inter) for all new admin UI (Composer, Designer, Trend Dashboard), not the spec's email hex values.
6. **Cart-signal tracking**: fix the dead `trackAddToCart`/`trackRemoveFromCart` wiring **now, ahead of Phase 1** (not deferred to just before Phase 9), to maximize first-party data accumulation lead time.
7. **Test strategy**: introduce Jest now as a lightweight foundation, scoped to just the new social-poster module (scoring functions, samplers, encryption helpers per Spec 26.1) — not a retrofit of the rest of PesaShop.

## Correction to the original Phase 0 audit (2026-07-14)

The audit's original claim that `trackAddToCart`/`trackRemoveFromCart` were unwired dead code was **wrong**. `frontend/src/store/index.js`'s Zustand cart store (`addItem`/`removeItem`) calls `statsAPI.trackEvent(...)` directly, bypassing the `useAnalytics` hook entirely — `add_to_cart`/`remove_from_cart` SiteEvents have been live in production all along. The hook's own `trackAddToCart`/`trackRemoveFromCart` functions remain genuinely unused, but that's cosmetic (dead code, not a missing signal).

The real gap, found on closer inspection: `trackPurchase` (also in `useAnalytics.js`) was never called from either checkout flow, so there was no `purchase`-type SiteEvent to close the search→cart→purchase funnel. Additionally, `Order` had no `sessionId` field — only `customer` (a User ref) — so an abandoned-cart join would only have worked for logged-in users, not anonymous browsing sessions that log in only at checkout.

## Pre-Phase-1 fixes applied (2026-07-14)

Per MK's decision to fix the (corrected) cart/purchase signal gap now rather than defer it:
- `backend/models/Order.js`: added a `sessionId` field (indexed), populated from the frontend's existing `pesa_sid` sessionStorage value — lets analytics join pre-login SiteEvents to the eventual order even when earlier events had no `userId`.
- `backend/routes/orders.js`: `POST /` now accepts and persists `sessionId` on order creation.
- `frontend/src/pages/CheckoutPage.jsx` and `frontend/src/components/product/CheckoutDrawer.jsx` (the only two places that call `ordersAPI.create` — `KioskCheckout.jsx` just wraps `CheckoutDrawer`): both now send `sessionId` in the order payload and call `trackPurchase(orderId, items)` on success.
- Backend: added `jest`, `supertest` (devDependencies) and `pino` (dependency, per the logging decision) to `backend/package.json`; added a `test` script; created `backend/tests/social/harness.test.js` as a smoke test proving the Jest foundation works (`npx jest` passes). No other tests exist yet — real coverage starts with Phase 1 migrations.

## Next step

With the cart/purchase signal fix and the Jest foundation now in place, next is MK's "proceed" to begin Phase 1 (Database Schema and Migrations) per Brief Section 3.2 — noting throughout that "migrations" now means Mongoose schemas/scripts, not SQL, per the MongoDB-native decision above.

## Separate, time-sensitive, not blocked by code

Platform developer approvals are the critical path (Spec Section 3.1): Meta 2–7 business days, LinkedIn 1–3 weeks, TikTok up to 6 weeks *plus* a separate Direct Post approval. **Submit all five applications on day one** (Spec Section 25). None of this depends on any code existing.
