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

## Phase 1 — Database Schema (complete, 2026-07-14)

**Naming convention**: every new model/route/service uses an **`Autoposter`** prefix (e.g. `AutoposterAccount`, `AutoposterPost`) — deliberately distinct from the existing unrelated `socialEngine.js` (TikTok UGC feed) to avoid confusion, per the Phase 0 finding.

**New Mongoose models** (`backend/models/`), one file each, following the exact style of `Order.js`/`SiteEvent.js`:
- `AutoposterAccount` (Spec 4.1), `AutoposterPost` (4.2), `AutoposterPostTarget` (4.3), `AutoposterInsight` (4.4), `AutoposterAuditLog` (4.5)
- Trend Engine (Spec 11): `AutoposterTrend`, `AutoposterTrendCandidate`, `AutoposterCulturalEvent`, `AutoposterDecision`, `AutoposterBlocklistTerm`, `AutoposterVariantPerformance`
- `AutoposterDesign` (Spec 7.5, Visual Post Designer)
- `AutoposterPostProfile` (Spec 9.5.2, with all 17 configurable fields as a validated sub-schema, not a Mixed blob)

**Enums**: added as a new `AUTOPOSTER_*` section in `backend/config/constants.js`, matching the existing shared-constants-file convention exactly (not invented ad hoc per-schema).

**Deviation from spec, flagged**: added a 4th `AUTOPOSTER_POST_SOURCE` value, `trend`, alongside the spec's literal `manual`/`product_auto`/`campaign` (Section 4.2) — the trend engine pipeline (10.1, 11.4) clearly needs to create real posts once a trend+product pairing is approved, but the spec's `posts.source` enum doesn't literally list a 4th value for it. Worth MK's eyes at the Phase 1 gate.

**Product model**: additive-only fields (`postProfileId`, `autoPostEnabled`, `autoPostPlatforms`) added via `productSchema.add({...})` right before `module.exports`, mirroring exactly how the existing `embedding`/`embeddingUpdatedAt` fields were added — same safe, established pattern, not a new one.

**Seed script**: `backend/seeders/autoposterSeed.js` — idempotent (upsert-based, never `deleteMany`), unlike the destructive `seeders/index.js`. Seeds the 8 Zimbabwe cultural events (10.5), the 5 starter post profiles (9.5.3), and blocklist placeholders. **Brand-safety blocklist seeding was deliberately conservative**: seeded as category-level placeholders (`political_figures`, `political_parties`, etc.) plus a few generic economic/utility terms (`sanctions`, `load shedding`, `fuel queue`, `zesa outage`) — did not fabricate specific real-world names of politicians, parties, or events, since which real-world entities count as sensitive is MK's judgment call to make deliberately via the Blocklist editor (Spec 12.5), not something to guess from training data. **Cultural events' `categoryIds` are empty** — real Category ObjectIds aren't knowable without a live DB connection from this environment; `categoryHints` (plain category-name strings) are populated instead, for an admin to map to real categories later.

**Seed script run and verified against real Atlas data (2026-07-14)**. A dedicated, scoped dev-only database user was created in Atlas specifically so this environment never needed production's own credentials. `node seeders/autoposterSeed.js` was run twice against the real database: first run created all expected documents across the 3 new collections (cultural events, blocklist terms, post profiles); second run created zero and reported everything already present, confirming idempotency. A read-only check afterward confirmed the existing `products`, `orders`, and `users` collections were untouched — only the new `autoposter*` collections were written to.

Note for MK: changing an existing shared DB user's password (e.g. the one production's backend uses) would break production the next time it reconnects, since nothing else knows the password changed — that's why a brand-new, separate dev-only user was the right call here rather than resetting the existing one. Repo visibility (public/private) and credential rotation for anything previously exposed are being handled separately, outside this doc.

## Phase 2 — OAuth Foundations and Account Connection (complete, 2026-07-14)

MK confirmed no platform developer apps have been submitted yet (Meta will be submitted later; timing on the rest wasn't specified) but asked for all five platforms built now regardless — consistent with the Brief's own allowance (Section 3.3) for a "documented blocker" instead of a live green-checkmark connection where a platform isn't approved yet.

**New backend files**:
- `models/AutoposterOAuthState.js` — Mongo TTL collection (10-minute expiry) replacing the spec's Redis-backed OAuth state/PKCE store (Section 5.1), consistent with the Phase 0 node-cron/no-Redis decision.
- `services/autoposterTokenCrypto.js` — AES-256-GCM encrypt/decrypt (Spec 5.3), packs iv+authTag+ciphertext into one Buffer per token.
- `services/autoposterOAuth{Facebook,Instagram,X,LinkedIn,TikTok}.js` — one file per platform: authorize-URL builder, code-for-token exchange, and (where the platform supports it) programmatic refresh. Instagram deliberately delegates almost everything to the Facebook file since they share one Meta app.
- `routes/autoposter.js` — `GET /oauth/:platform/start` (admin-authenticated), `GET /oauth/:platform/callback` (public — platforms redirect the browser directly, so state validation is the security boundary, not a bearer token), `GET/DELETE /accounts`, `POST /accounts/:id/refresh`. Mounted at `/api/autoposter` in `server.js`.
- `cron/autoposterTokenRefreshCron.js` — daily 03:00 node-cron job refreshing accounts expiring within 72h (Spec 5.2); marks `needs_reauth` on failure or on any platform with no refresh mechanism (currently LinkedIn).
- `.env.example` — all required OAuth env vars documented with placeholders (never real values).

**Bug caught and fixed during build, not after**: Facebook and Instagram share one Meta app and therefore one registered redirect URI (Meta's dashboard requires an exact match, can't register two). The callback handler initially trusted the URL's `:platform` segment to pick which adapter to use — which would have silently misrouted every Instagram connection through the Facebook resolver, since Meta always redirects to whichever single URI is registered. Fixed by having the callback resolve the true platform from the stored OAuth state document (set correctly at `/start` time, based on which "Connect X" button was clicked) instead of trusting the callback URL.

**New admin UI**: `admin-panel/src/pages/AutoposterAccountsPage.jsx` at `/autoposter/accounts` (linked from the sidebar under "Marketing" → "Social Auto-Poster"). Five platform cards, connect/disconnect/refresh actions, a needs-reauth banner, and toast handling for the `?connected=`/`?error=` query params the OAuth callback redirects back with.

**Verification performed, and its limits**: `admin-panel` had no `node_modules` installed in this environment — ran `npm install` there first. Backend Jest suite: 36/36 passing, including URL-builder tests for all 5 platforms and a crypto round-trip/tamper test — no network calls, no DB connection. Beyond that, both dev servers were actually started against the real Atlas database: `GET /health` returned 200; a JWT was generated in-memory for the real admin user (via the same `generateToken` helper the app itself uses — no password needed, nothing written to disk) and used to hit `GET /api/autoposter/accounts` live, returning `{"success":true,"data":[]}` as expected; hitting `/oauth/:platform/start` for all 5 platforms correctly returned clean, actionable errors (e.g. `"META_APP_ID, META_APP_SECRET, and META_OAUTH_REDIRECT_URI must all be set"`) rather than crashing, since no real platform credentials exist yet — that's the expected "documented blocker" state, not a bug. Every new/changed frontend file (`AutoposterAccountsPage.jsx`, `App.jsx`, `Sidebar.jsx`) was confirmed to compile cleanly by Vite (200, valid transformed JS, contains the expected new references).

**What was not verified**: a full headless-browser render of the actual page (Playwright's Chromium install timed out in this sandboxed container — no reliable path to download browser binaries here). So the page's HTML/CSS/component tree has not been visually confirmed, only that every file involved compiles without error and the API calls it depends on work correctly against real data. If this gets pushed and Railway auto-deploys from `main`, checking `/autoposter/accounts` on the real deployed admin panel would be better verification than anything achievable from this sandbox.

**Not achievable without real platform credentials, by design, not a gap**: an actual end-to-end OAuth connection (clicking Connect → real platform login → token stored). This requires Phase 2's stated prerequisite (Spec Section 25 developer app submissions) regardless of how much code exists.

## Phase 3 — Composer UI (complete, 2026-07-14)

**Backend**: added Posts CRUD to `routes/autoposter.js` — `POST/GET /posts`, `GET/PATCH/DELETE /posts/:id`, `POST /posts/:id/publish-now` (mounted under `/api/autoposter`, same as Phase 2). Server-side caption-length validation (`AUTOPOSTER_CAPTION_LIMITS` in `config/constants.js`, Spec 6.4) runs on both create and edit, skipping X's limit when a target has `threadMode` on. `publish-now` correctly returns `501` with an honest message — the scheduling engine (Phase 4) and platform adapters (Phase 5) don't exist yet, so there's nothing to actually publish with; the post itself saves fine regardless. Cancelling a never-published draft hard-deletes it; cancelling anything already scheduled marks it `cancelled` instead, preserving the record.

**Admin UI**: `AutoposterComposePage.jsx` at `/autoposter/compose` (linked from the sidebar). Platform toggle chips, shared fields (media upload — reusing the *existing* `/api/media/upload` endpoint rather than building a duplicate, base caption, link URL, hashtag chips), per-platform tabs with account selector (pulled from Phase 2's connected-accounts list), caption override with live character counter (red when over the limit, yellow near it), and the platform-specific fields from Spec 6.3 (IG post type + first-comment toggle, X thread mode + reply settings, LinkedIn author/visibility, TikTok privacy/duet/stitch/disclose-commercial/posting-mode). Publish Now / Schedule For / Save Draft all wire through to the backend.

**Simplifications made, flagged rather than silently skipped**:
- Media upload is a plain file picker, not a full drag-and-drop zone.
- Hashtags are a free-text chip input, not the "reusable saved sets" library Spec 6.2 describes.
- Platform previews show the resolved caption + character counter, not a pixel-accurate mock of each platform's actual post layout.
- "Add to queue" recurring-schedule-template posting (Spec 6.5) isn't built — "Publish Now" and "Schedule For" are, which covers the core need.

**Verification performed**: 41/41 Jest tests passing (5 new, covering the caption-validation logic in isolation — no DB dependency, consistent with this repo's test-suite convention). Both dev servers started against the real Atlas database; every new/changed frontend file confirmed to compile cleanly via Vite. Since `AutoposterPostTarget.account` is correctly `required: true` (matching the spec's data model — a target always references a real connected account), a temporary test `AutoposterAccount` was created solely to exercise the real HTTP flow — full `create → list → get → patch → publish-now (501, as expected) → cancel` round-trip against live data, then both the test post and the temporary account were deleted, and a final count confirmed all three collections (`posts`, `post targets`, `accounts`) were back to zero — nothing left behind.

**Not achievable yet, by design**: actually publishing anything (needs Phases 4–5) and a full headless-browser render (same Chromium sandbox limitation as Phase 2).

## Phase 4 — Scheduling Engine and Publisher Worker (complete, 2026-07-14)

**Architecture**: per the Phase 0 no-Redis/BullMQ decision, `AutoposterPostTarget` documents ARE the job queue — there's no separate broker. A single `node-cron` job (`cron/autoposterPublisherCron.js`, every 30 seconds — comfortably inside Spec 19.2's "fires within 60 seconds" requirement) polls for due targets and processes them in-process, the same pattern every other cron in this codebase already uses (no separate worker process/dyno, unlike Spec 27.1's multi-process topology — consistent with the decision already made in Phase 0, not a new deviation).

**New pieces**:
- `AutoposterPostTarget` gained `processingStartedAt` and `nextAttemptAt` fields — Mongo-native equivalents of what BullMQ would track for stalled-job detection and backoff scheduling.
- `AUTOPOSTER_RATE_LIMITS`, `AUTOPOSTER_RETRY_BACKOFF_MINUTES` (1/5/15/60/240 min, Spec 8.2), `AUTOPOSTER_MAX_ATTEMPTS` (5), `AUTOPOSTER_STALLED_THRESHOLD_MINUTES` (5) added to `config/constants.js`. **Flagged**: only X's rate limit (100/24h) comes from the spec itself (Section 8.3's own example) — Facebook/Instagram/LinkedIn/TikTok's numbers are conservative placeholders, not asserted platform truths, since the spec doesn't give concrete figures for them.
- `services/autoposterPublisherStub.js` — the Phase 5 stand-in: logs what it would publish, never calls a real API. Includes a test-only failure-simulation hook (magic markers `FORCE_TRANSIENT_FAIL`/`FORCE_PERMANENT_FAIL` in a post's title) that made the retry/backoff logic provably testable against something, live — to be removed in spirit once Phase 5's real adapters exist.
- `services/autoposterPostStatusRollup.js` — recomputes a post's overall status from its targets; the decision logic (`computeNextPostStatus`) is kept pure and separate from the DB I/O specifically so it's unit-testable without a database.
- `cron/autoposterPublisherCron.js` — the worker itself: stalled-job sweep, rate-limit gate (delays, doesn't fail, matching Spec 8.3's token-bucket semantics), dispatch, and retry/backoff classification.
- `GET /api/autoposter/queue-status` — visibility into pending/publishing/published-24h/failed-24h counts, the adapted equivalent of Spec 27.3's per-worker health endpoint (one in-process worker here, not a separate port per worker).

**Verification — the most rigorous yet, because this phase's whole point (retry timing, stalled-job recovery) can't be proven by a unit test alone**: 53/53 Jest tests passing (backoff sequence, max-attempts-then-permanent-failure, unclassified-errors-default-to-transient, post-status rollup decision table — all pure logic, no DB). Beyond that, real fixtures were created against the live Atlas database and the actual server was started so its real 30-second cron ticked for real, over roughly 2.5 minutes of genuine wall-clock time:
- A normal post: picked up and published within the first tick.
- A post with `FORCE_TRANSIENT_FAIL` in its title: failed on the first tick (attempt 1, 1-minute backoff scheduled), and — because the server kept running while other verification steps were happening — was picked up again by a **second real tick** roughly a minute later and failed again (attempt 2, 5-minute backoff scheduled), proving the backoff sequence advances correctly across genuinely elapsed time, not just within a single simulated call.
- A post with `FORCE_PERMANENT_FAIL`: failed immediately, no retry, as designed.
- A target manually set to `status: 'publishing'` with a `processingStartedAt` 10 minutes in the past (simulating a crash mid-job, before the server even started) was correctly detected as stalled, reset to `pending`, and successfully republished — all in the very first tick.
- Every outcome had a matching `AutoposterAuditLog` entry (`publish_success`, `publish_retry_scheduled` ×2, `publish_failed`, `stalled_job_recovered`), and `GET /queue-status` reported the exact expected counts (`pending: 1, publishing: 0, published24h: 2, failed24h: 1`) at that point in the test.

**Cleanup note**: all test `Post`/`PostTarget`/`Account` documents were deleted afterward, confirmed back to zero. Four harmless audit-log entries from this session's Phase 3/4 verification runs (`create_post`, `cancel_post`, `publish_success` ×2) were **deliberately left in place** — a broad, unscoped delete filter (`{action: 'create_post'}` etc., not scoped to specific IDs) was correctly blocked by a safety check, since `AutoposterAuditLog` is explicitly meant to be an append-only/immutable record (Spec 24.3: "never drop the audit_log table, even in rollback"). Leaving them is more consistent with that collection's own design intent than forcing a broad deletion would have been.

**Not achievable yet, by design**: actual publishing to a real platform (needs Phase 5's real adapters — the stub is a deliberate, temporary stand-in, not a shortcut around Phase 5).

## Phase 5 — Platform Adapters (complete, 2026-07-14)

MK confirmed (turn preceding this phase) that no platform developer apps are submitted yet, and asked for all five real adapters built now regardless, same directive as Phase 2's OAuth work. Delivered all five in one pass rather than the Brief's original "one at a time, per approval order" sequencing (Section 3.6) — consistent with what MK already established for Phase 2, not a new deviation.

**Real `publish()` and `fetchInsights()` added to each Phase 2 OAuth adapter file** (kept in the same file rather than split into separate "adapter" files — each file is now the full PlatformAdapter per Spec 2.2: OAuth + publish + insights together, matching the spec's single-interface concept):
- **Facebook** (`autoposterOAuthFacebook.js`): picks `/feed`, `/photos`, or `/videos` based on media present. Error classification uses Meta's documented Graph API codes (190 = OAuthException → permanent; 4/17/32/613 = rate limits → transient).
- **Instagram** (`autoposterOAuthInstagram.js`): the two-step container → poll (video only) → publish flow (Spec 14.2), plus an optional best-effort first-comment hashtag post.
- **X** (`autoposterOAuthX.js`): tweet posting with media (simple image upload + chunked video upload with status polling), thread mode (splits caption into ≤280-char chunks on word boundaries, chains replies). Error classification by HTTP status (429/5xx → transient; else permanent) since X's JSON error shape isn't uniform across endpoints.
- **LinkedIn** (`autoposterOAuthLinkedIn.js`): personal-profile posting fully implemented (image upload via the two-step asset-registration flow). **Flagged gap, not silently faked**: Company Page posting throws a clear permanent error, since resolving an organization's URN isn't built into the OAuth flow yet — posting as the wrong author would be worse than refusing.
- **TikTok** (`autoposterOAuthTikTok.js`): video-only publish via `PULL_FROM_URL` (our media is already public on Cloudinary as the actual post content, so there's no exposure concern `FILE_UPLOAD` chunking would avoid — and it's dramatically simpler). Both Direct Post and Upload-to-Inbox modes. **Flagged gap**: TikTok native image posts and `FILE_UPLOAD` chunked upload aren't built in this pass.
- `services/autoposterAdapterRegistry.js` — platform → adapter lookup, used by the publisher cron.
- `cron/autoposterPublisherCron.js` now calls the real adapters by default; `AUTOPOSTER_DRY_RUN=true` switches back to the Phase 4 stub (including its `FORCE_TRANSIENT_FAIL`/`FORCE_PERMANENT_FAIL` test markers) for local testing without real credentials.

**Verification — two layers, since neither alone would be honest**:
1. **69/69 Jest tests** (16 new): `nock`-mocked contract tests per platform verifying request shape (correct endpoint, correct body/params) and error classification against realistic mocked response bodies.
2. **Real reachability + real error-classification check**, beyond mocks: called `publish()` on Facebook, X, LinkedIn, and TikTok with a real (deliberately invalid) token against each platform's actual live API — no approved developer app needed, since getting a real *error* response requires no permissions, just a reachable endpoint. All four returned genuine, well-formed error responses (Facebook: real code 190; X: real 403 revealing a genuine API nuance — the tweet-publish endpoint needs OAuth 2.0 User Context, not just any bearer token; LinkedIn: real 401; TikTok: real 401), and my classification logic correctly identified every single one as permanent. This confirms the endpoint URLs and request shapes are genuinely correct against the real platforms, not just internally consistent with my own mocks. Instagram wasn't checked separately since it shares Facebook's exact OAuth/error-handling code path.

**Not achievable without real approved developer apps, by design**: an actual successful publish to a real test account, verifiable in the platform's own UI (Brief 3.6's literal expected output) — this requires what MK has explicitly deferred (app submission), same honest limitation as Phase 2.

## Phase 6 — Product Auto-Post Hook and Configuration Profiles (complete, 2026-07-14)

**New backend pieces**:
- `models/AutoposterCaptionTemplate.js` — reusable Handlebars caption templates (Spec 9.3), optional per-platform.
- `Product.captionTemplateId` — additive field, same safe pattern as Phase 1's other additive fields.
- `services/autoposterProductPostResolver.js` — implements all 17 Spec 9.5.1 configurable fields (images, video, name, price, currency, discount, descriptions, category/hashtags, stock, URL+UTM, rating, SKU, delivery, CTA, watermark passthrough), merging per-platform overrides (Spec 9.5.4) on top of the profile's base config. Falls back to an auto-built caption when no Handlebars template is chosen; renders the template instead when one is.
- `services/autoposterProductAutoPostTrigger.js` — the hook itself (Spec 9.1/9.4), called directly from `routes/products.js` (per the Phase 0 decision: no event bus). Fires only on the **transition into** published (`status:'active' && isActive:true`), not on every edit of an already-published product — checked via `wasJustPublished(before, after)`. Media is resolved once and shared across all targets (matches the schema — `AutoposterPost.mediaRefs` isn't per-target). Never throws — a problem here must never block a product save.
- `routes/autoposter.js` gained Profile CRUD, Caption Template CRUD, and `GET /products/:id/preview` (Spec 9.5.5 — renders the resolved post per platform without creating anything).

**Admin UI**: `AutoposterProfilesPage.jsx` and `AutoposterCaptionTemplatesPage.jsx` (both linked from the sidebar), plus a new "Social Auto-Poster" section added directly to the existing `ProductForm.jsx` (matching its established convention of stacked `Card` sections, not tabs — this codebase's product form has never used tabs) — auto-post toggle, platform checkboxes, profile/template selectors, and a Preview button that calls the new preview endpoint. **Flagged simplification**: per-platform config overrides (Spec 9.5.4) aren't editable from the Profiles UI yet — base `config` only; overrides can still be set directly via the API.

**A real, unrelated bug found and worked around, not silently ignored**: while live-testing, a `POST /api/products` request hung for 8+ seconds and timed out. Root cause: the *existing* (not mine) SKU auto-generation `pre('save')` hook in `Product.js` does a sequential `findOne` loop when no `sku` is supplied, and with 13,700+ real products it can iterate many times if the computed `PS-XXXXX` number collides with legacy data. This is a pre-existing performance issue in the products module, unrelated to the Social Auto-Poster build — out of scope to fix here, and risky to touch blind on a live products flow without being asked. Worked around by supplying an explicit SKU in test requests; worth flagging to MK as a separate, real perf issue.

**Verification, two-tiered because the obvious approach would have been unsafe**: a first attempt to verify by creating three real, live (`status:'active'`) test products via the actual `POST /api/products` route was **correctly blocked by a safety check** — `products` is customer-facing (unlike every `Autoposter*` collection), and creating live/active fake products would have made them genuinely visible on the real storefront to real customers. Redesigned the verification instead:
1. **Positive path** (profiles produce visibly different posts, the Brief's literal STOP AND CONFIRM criterion): called `triggerProductAutoPost()` directly against three in-memory product-like objects (never written to the real `products` collection at all — zero customer-facing risk) with the seeded Default, Premium, and Flash Sale profiles. All three produced real `AutoposterPost`/`AutoposterPostTarget` documents in the live database with **visibly, substantively different captions**: Default showed price + short description; Premium hid price entirely and showed the full description + rating instead; Flash Sale showed price but excluded the short description and used its custom urgent CTA ("Limited — grab today") instead of the generic one. Exactly matching each profile's distinct configuration.
2. **Negative path** (drafts must never trigger): created a real **draft** product (`status:'draft'`, never visible on the storefront regardless of `isActive`) through the actual HTTP route with auto-post enabled, confirmed the `product_auto` post count was unchanged before/after, then deleted it immediately.

All temporary test data (`AutoposterPost`, `AutoposterPostTarget`, `AutoposterAccount`, the draft `Product`) was deleted afterward. 84/84 Jest tests passing (15 new, covering the resolver's per-switch logic and the publish-transition detection, all pure — no DB). All touched frontend files confirmed to compile cleanly via Vite.

**Tests**: `backend/tests/social/models.test.js` — 21 new tests (22 total with the harness smoke test), all passing, covering required fields, enum validation, and defaults for every new model.

## Separate, time-sensitive, not blocked by code

Platform developer approvals are the critical path (Spec Section 3.1): Meta 2–7 business days, LinkedIn 1–3 weeks, TikTok up to 6 weeks *plus* a separate Direct Post approval. **Submit all five applications on day one** (Spec Section 25). None of this depends on any code existing.
