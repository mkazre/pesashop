PesaShop
Social Auto-Poster Module
Implementation Brief for VS Code + Claude
Companion to: PesaShop_Social_AutoPoster_Spec.md (v2.1)
For: Windsurf / VS Code with Claude
Owner: Magiq Web & Mobile Applications
Version: 1.0


1. How to Use This Document
This brief is written to be pasted directly into Claude in VS Code as the opening instructions for the PesaShop Social Auto-Poster build. It works alongside the full specification (PesaShop_Social_AutoPoster_Spec.md v2.1), which is the source of truth for what to build. This document tells Claude how to work, when to stop for confirmation, and what artifacts to produce at each phase.

1.1 Recommended workflow in VS Code
Open the existing PesaShop repository in VS Code.
Attach both documents to Claude's context: PesaShop_Social_AutoPoster_Spec.md (the WHAT) and this Implementation Brief (the HOW).
Start a fresh conversation and paste the prompt from Section 2 (Opening Prompt) below.
Claude will begin Phase 0: Codebase Audit. Review its findings before letting it proceed to Phase 1.
At every phase gate (marked STOP AND CONFIRM), review Claude's output, run the checks it produced, and only reply "proceed" when the phase is truly done.
If Claude drifts or hallucinates conventions, refer it back to the corresponding spec section.

1.2 What this brief expects from Claude
Read both documents fully before producing any code.
Follow the phase sequence in Section 3. Do not skip ahead.
Never invent conventions; audit and follow existing PesaShop patterns.
Ask for confirmation at every STOP AND CONFIRM gate.
Use TypeScript strict mode for the social module even if the rest of the codebase is JavaScript (Spec Section 29.1).
Log clearly at every step: what file being created, what file being modified, what decision being made and why.


2. Opening Prompt to Paste into Claude
Copy the block below into Claude in VS Code as the first message. It sets context, defines guardrails, and initiates Phase 0. Claude should respond with the audit findings and wait for your confirmation before proceeding.

You are helping me extend the existing PesaShop application with a
Social Auto-Poster Module. Two documents govern this work:

  1. PesaShop_Social_AutoPoster_Spec.md (v2.1) — the full technical
     specification. This is the source of truth for WHAT to build.

  2. PesaShop VS Code Implementation Brief (this document) — the
     source of truth for HOW to work: phases, guardrails, stopping
     points, and what to hand back at each phase gate.

Read both fully before writing any code.

# Ground rules

- PesaShop is a live production system. Do not treat this as a
  greenfield build. Every module you add integrates into the existing
  React frontend, Node.js backend, PostgreSQL database, and admin panel.

- Never invent conventions. Always audit the existing PesaShop codebase
  and follow its patterns for folder structure, routing, auth, logging,
  migrations, and testing.

- Work in phases. Do not skip ahead. At every "STOP AND CONFIRM"
  gate, hand me a clear summary of what you did, and wait for me
  to reply "proceed" before continuing.

- If any part of the spec conflicts with the existing PesaShop
  convention you discovered in the audit, the existing PesaShop
  convention wins. Flag the conflict, propose a resolution, wait
  for confirmation.

- Never commit secrets. All credentials go into .env.local (not
  committed) or the existing PesaShop secret management pattern
  (confirm during audit).

- Use TypeScript strict mode for all new social module code.

- Log every action you take in each response: what file you are
  creating, what file you are editing, what decision you are making
  and why.

# Start now

Begin Phase 0: Codebase Audit (Implementation Brief, Section 3.1).
Do NOT write any code yet. Only produce the audit report.

Confirm you have read and understood both documents, then proceed
with the audit.


3. Phased Implementation Plan
The build is divided into 15 phases. Each phase has: a clear goal, exact inputs from the spec, expected outputs, and a STOP AND CONFIRM gate. Claude should complete each phase in full and hand you a summary before moving on.

3.1 Phase 0 — Codebase Audit
Goal: understand the existing PesaShop codebase before touching it.

Spec references
Section 1.3 Existing System Context, including 1.3.4 IDE Orientation Checklist.
Section 10.2 IDE Action Required callout (search-query logging audit).
Section 22 Setup and Installation — First-Time Setup Checklist.

Claude actions
Read the repository structure. Identify: backend framework (Express, Fastify, NestJS, Koa), ORM or query builder (Knex, TypeORM, Prisma, raw pg), and folder-structure conventions.
Locate: admin auth middleware and JWT verification helper; existing logger setup; test framework; env-loading pattern; Cloudinary helper; existing event-emitter / domain-event pattern (if any).
Verify Redis is provisioned and reachable. If not, flag it.
Verify Postgres version and whether pgvector is installed. If not, produce the install instructions.
Search the codebase for existing search query logging. Report findings against the 5 questions in Spec Section 10.2 callout.
Search for existing use of Konva or Fabric (for the Visual Post Designer).
Confirm existing PesaShop brand design tokens are accessible from the admin app (green #1a5c2e, gold #e8a000, background #eceae6, Public Sans font).

Expected output
A written audit report answering each item above.
An explicit list of prerequisites that must be resolved before Phase 1 (missing Redis, missing pgvector, missing search logging, missing event-emitter pattern, etc.).
A recommendation on whether to introduce any missing patterns (e.g. domain events) or work around them.

STOP AND CONFIRM: Claude waits for you to review the audit and confirm any prerequisite work (installing Redis, adding pgvector, implementing search logging) is complete. Do not proceed to Phase 1 until this is green.

3.2 Phase 1 — Database Schema and Migrations
Goal: create every social schema table and product-table extensions in the correct order.

Spec references
Section 4 Data Model (social_accounts, posts, post_targets, post_insights, audit_log).
Section 11 Trend Engine Data Model (trends, trend_product_candidates, cultural_events, auto_post_decisions, trend_blocklist, ab_variant_performance).
Section 7.5 Designs Library (designs table).
Section 9.5.2 Product Post Profiles (product_post_profiles table, plus additive columns on products).
Section 24 Migration Order and Rollback Strategy — the strict 15-migration sequence.

Claude actions
Enable pgvector, pg_trgm, uuid-ossp extensions and create the social schema.
Create migration 002 (search_query_log) ONLY if the audit found it missing.
Create migrations 003 through 015 in the exact sequence in Spec Section 24.
Additionally create migrations for the designs table and product_post_profiles table with the products table additions.
Every migration must have a working down() that reverses cleanly.
Seed cultural_events with the Zimbabwe calendar (Spec Section 10.5).
Seed trend_blocklist with initial Zimbabwe-sensitive terms.
Seed product_post_profiles with the 5 starter profiles (Spec Section 9.5.3): Default, Diaspora, Premium, Flash Sale, Stealth.

Expected output
All migration files in the existing migrations folder.
Seed files for cultural events, blocklist, and post profiles.
A migration-runner command that applies all up() cleanly against a fresh database, and a rollback command that reverses them cleanly.
Evidence: successful migration run against a local Postgres, followed by a successful rollback run.

STOP AND CONFIRM: Do not proceed to Phase 2 until all migrations run cleanly forward and backward, and the seed data is present.

3.3 Phase 2 — OAuth Foundations and Account Connection
Goal: connect at least one platform account per social network from the admin UI.

Spec references
Section 5 OAuth and Token Management.
Section 21 Environment Variables and Secrets — all OAuth-related env vars.
Section 25 Platform Developer Account Setup — exact steps per platform.

Prerequisite check: submit platform app applications
The gating item on this build is external platform approval. Claude reminds MK before implementation that developer apps must be submitted on day one — review timelines are 2–6 weeks. If applications are not yet in, Claude produces a one-page checklist based on Spec Section 25 that MK can execute the same day.

Claude actions
Create AES-256-GCM token encryption helper (Spec Section 5.3).
Create OAuth controller and service under src/modules/social/oauth/.
Implement one connection flow per platform: Meta (Facebook + Instagram), X, LinkedIn, TikTok.
Redis-backed state and PKCE storage with 10-minute TTL.
Token refresh cron and inline-refresh-on-401 logic.
Admin UI screens under admin.pesashop.com /admin/social/accounts: list connections, connect new, disconnect, needs-reauth banner.

Expected output
Working OAuth for all five platforms end-to-end against sandbox/test accounts (Spec Section 26.2).
Tokens stored encrypted; verify with a query that raw column values are not readable as tokens.
Admin UI can connect, list, and disconnect at least one test account per platform.

STOP AND CONFIRM: Do not proceed to Phase 3 until each of the five platforms shows a green connected account in the admin UI — or, for any platform still awaiting approval, a documented blocker.

3.4 Phase 3 — Composer UI (Form-Based Fast Path)
Goal: the form-based composer for manual post creation with per-platform overrides.

Spec references
Section 6 Composer UI (React).
Section 15 Social Module API Surface — posts endpoints.

Claude actions
Build the composer page at admin.pesashop.com /admin/social/compose.
Implement shared fields, per-platform tabs, character counters, media validation, and scheduling control (Spec Sections 6.2–6.5).
Wire up POST /api/social/posts (create draft or scheduled) and related CRUD.
Live preview per selected platform that mirrors platform layout.

Expected output
Composer functional end-to-end (create, save draft, schedule, publish now — publish will 501 until adapters are built in Phase 5).
All character counters, validators, and previews working.

STOP AND CONFIRM: Claude presents a screencast or step-by-step demonstration of composing a multi-platform post with overrides. Do not proceed to Phase 4 until UI is validated.

3.5 Phase 4 — Scheduling Engine and Publisher Worker
Goal: publisher worker infrastructure ready to consume jobs. Adapters still stubbed.

Spec references
Section 8 Scheduling Engine (queues, worker lifecycle, rate limits).
Section 27 Deployment and Infrastructure — process topology.

Claude actions
BullMQ queues per platform (social:facebook, social:instagram, social:x, social:tiktok, social:linkedin).
Publisher worker as a separate entry point in the same codebase.
Retry classification (transient vs permanent), exponential backoff, max attempts.
Redis-backed per-account token bucket for rate limits.
Health-check endpoints for each worker.
Stubbed platform adapters that log "would publish X" but do not call any real API.

Expected output
Composer-scheduled post creates a job; worker consumes it at the scheduled time; audit_log entry written.
Stalled-job recovery works: kill the worker mid-job, restart, job re-runs cleanly.

STOP AND CONFIRM: Do not proceed to Phase 5 until you can prove end-to-end scheduling with the stubs — including retry and rate-limit behaviour.

3.6 Phase 5 — Platform Adapters (per approval order)
Goal: replace stubs with real adapters, one platform at a time. Delivery order is dictated by which platform approves your developer app first — typically Meta, then LinkedIn, then X, then TikTok (Spec Section 3.1).

Spec references
Section 14 Adapter Implementation Notes — detailed per-platform mechanics.
Section 26 Testing Strategy — contract tests and manual smoke tests.

Claude actions per adapter
Implement the shared PlatformAdapter interface (Spec Section 2.2).
Media upload flow specific to that platform.
Post creation call.
Error mapping (platform error codes → transient/permanent classification).
Analytics endpoint for insights fetch.
Contract tests with recorded HTTP fixtures (nock).
Manual smoke test to a test account before enabling in production.

Expected output
Adapter delivered in this order (or as approvals arrive): Meta, LinkedIn, X, TikTok.
For each platform: a working publish to a real test account, verifiable in the platform's own UI.
Failure handling covered by tests, including rate-limit and auth-expiry paths.

STOP AND CONFIRM: STOP AND CONFIRM after each platform adapter, not once at the end. Do not stack multiple platform integrations before verifying one works end-to-end.

3.7 Phase 6 — Product Auto-Post Hook and Configuration Profiles
Goal: publishing a product in PesaShop admin triggers automated social posts using content configuration profiles.

Spec references
Section 9 Product Auto-Post Trigger, including 9.5 Product Post Content Configuration.

Claude actions
Hook into the existing product publish event (or add one if the audit found none).
Extend the product admin page with a Social tab (auto-post toggle, platforms multi-select, template selector, override media, profile selector).
Implement the 17 configurable fields from Spec Section 9.5.1.
Wire up profile CRUD and per-platform overrides.
Preview action that renders the post exactly as it will appear.

Expected output
Publishing a product with auto-post enabled and a chosen profile fires N posts on the selected platforms within 5 minutes.
Different profiles produce visibly different posts for the same product (e.g. Default shows price, Premium hides it).

STOP AND CONFIRM: Verify by creating three test products with three different profiles and letting them auto-post. Confirm each visually matches its profile config.

3.8 Phase 7 — Visual Post Designer
Goal: canvas-based visual design tool for manual richly-composed posts.

Spec references
Section 7 Visual Post Designer (full section).

Claude actions
Introduce Konva.js (or confirm Fabric.js if the audit found it already in use).
Build the designer page at /admin/social/designer.
Implement all 7 layer types (Spec Sections 7.3.1–7.3.7): image, video, text, shape, sticker/icon, background, link.
Canvas presets per platform (Spec Section 7.2.1).
Editing behaviour: layer panel, snap, guides, undo/redo, keyboard shortcuts, auto-save every 10s (Spec Section 7.4).
Designs library (Spec Section 7.5) and starter templates (Spec Section 7.6).
Bulk variant generation across platform presets (Spec Section 7.7).
Server-side render via Konva-node or Puppeteer; upload to Cloudinary (Spec Section 7.8).
Wire integration with the composer (Spec Section 7.9).

Expected output
Designer functional end-to-end: build a design, save it, use it in a composer post, publish.
At least the 6 starter templates seeded.
Bulk variant generation demonstrated with a single base design producing IG square, IG portrait, TikTok, and Facebook variants.

STOP AND CONFIRM: Design one PesaShop new-arrival graphic end-to-end using product gallery images, price tag text, brand watermark, and post it to the test IG account. Do not proceed until this works.

3.9 Phase 8 — Trend Engine: Ingestion
Goal: hourly trend ingestion from all sources, scored and cached.

Spec references
Section 10.2 Multi-Signal Trend Stack (including the IDE Action Required callout).
Section 10.3 Trend Ingestion Service.
Section 10.4 Trend Scoring.

Prerequisite check
Before starting: confirm PesaShop's search_query_log is populated. If not, delay this phase and let logs accumulate for 2–4 weeks.

Claude actions
Build trend worker as a separate entry point.
Implement ingestion sources: SerpAPI, google-trends-api fallback, X trending, TikTok Discover, first-party search log, first-party order velocity.
Trend scoring formula (Spec Section 10.4).
Redis lock for singleton behaviour (Spec Section 27.2).
Alert on primary-source failure.

Expected output
Trend worker runs hourly and populates the trends table with scored entries.
Cross-source dedup and normalisation working.

STOP AND CONFIRM: Let ingestion run for 24 hours. Review the trends table and confirm results look sane (relevant terms, reasonable scores).

3.10 Phase 9 — Trend Engine: Matching, Sampling, Safety
Goal: match trends to products, sample intelligently, filter for brand safety.

Spec references
Section 10.6 Semantic Product Matcher.
Section 10.7 Weighted Random Sampler.
Section 10.8 Cool-Down and Saturation Guard (region-aware, per Spec Section 10.12).
Section 10.10 Brand Safety Filter (three layers).

Claude actions
Product embeddings pipeline: embed on create/update, backfill for existing catalogue.
Trend embedding at ingestion; cosine similarity matcher; keyword bonus overlay.
Weighted sampler with all factors (trend score, similarity, margin, stock, recency, region fit, cultural boost).
Region-scoped cool-down and saturation guard (Spec Sections 10.8.1–10.8.3).
Brand safety: static blocklist, LLM safety classifier, trend-level flag.

Expected output
Given a set of trends, the matcher produces relevant candidate products; sampler picks fairly.
Political-trigger test trends are 100% blocked.
Sampler distribution test passes (no single product > expected + 3 sigma).

STOP AND CONFIRM: Manually review 20 selected candidate posts. Approval rate must be > 70% before proceeding. Below that, tune the matcher.

3.11 Phase 10 — Trend Engine: Composer Worker and Approval Queue
Goal: end-to-end trend engine with LLM caption generation, A/B variants, and admin approval queue.

Spec references
Section 10.9 Per-Platform Format Generator (LLM composer, style guides, A/B variants).
Section 10.11 Human-in-the-Loop Approval Queue.
Section 10.12 Diaspora Cross-Targeting (regional captioning and time-zone-aware scheduling).

Claude actions
Composer worker calling Anthropic API with per-platform style prompts.
Region-aware caption variants (local Zim, SA diaspora, UK/US/CA/AU diaspora framings, per Spec Section 10.12.5).
A/B variant generation and storage.
Brand safety classifier as post-composition gate.
Approval queue UI: card-based, mobile-optimised, swipe interactions.
Kill switch and pause endpoints.
LLM response caching to control cost.

Expected output
Trend-driven posts flow all the way to the approval queue.
Admin can approve/reject/edit/snooze from mobile with < 200ms interaction latency.
Kill switch halts engine within 5 seconds and survives worker restart.

STOP AND CONFIRM: Verify a full trend-to-published cycle: pick a trend, approve the queued post, watch it publish, verify audit_log.

3.12 Phase 11 — Admin Trend Dashboard
Goal: give MK full visibility and control over the engine.

Spec references
Section 12 Admin Trend Dashboard (all subsections).

Claude actions
Live Trends panel with filters and per-row actions.
Approval queue as its own tab (linked from Phase 10 work).
Cultural Calendar manager (edit boosts, add one-off events).
Performance insights: engagement per source, variant style, category, region.
Full configuration panel: per-platform / per-category / sampler weights / blocklist / cool-down / kill switch.

Expected output
MK can see and steer the engine end-to-end without needing developer intervention.

STOP AND CONFIRM: MK walks through every dashboard section and confirms it is genuinely usable.

3.13 Phase 12 — Insights Collection and Analytics
Goal: collect and surface post performance data.

Spec references
Section 4.4 post_insights table.
Section 15 API surface (insights endpoints).
Section 17 Observability.

Claude actions
Insights worker with scheduled fetches at 1h, 24h, 7d post-publish.
Per-platform insights API integration.
Feedback loop: engagement data feeds A/B variant scoring and cool-down governors.
Attribution: UTM tags on product URLs and correlation with PesaShop order data.

Expected output
Analytics visible in the composer, product Social tab, and trend dashboard.
Winning A/B variant styles per (platform, category) starting to emerge.

STOP AND CONFIRM: Verify insights populate for at least a full 7-day window on a real published post.

3.14 Phase 13 — Observability, Alerts, Cost Controls
Goal: production-grade monitoring.

Spec references
Section 17 Observability.
Section 28 Cost Budget.

Claude actions
Structured logging with pino, tagged by module/submodule/platform/post_target_id (Spec Section 29.4).
Metrics: publishes per platform per hour, success/failure ratio, queue depth, token refresh failures, trend metrics.
Slack (or configured channel) alerts on defined thresholds.
Cost controls: LLM budget cap, embedding cache, SerpAPI throttle option, X usage monitor.
Kill switch is prominent in the dashboard header and behaves correctly under load.

Expected output
Simulated failure scenarios all fire the correct alerts.
Cost dashboard shows current spend against LLM_MONTHLY_BUDGET_USD.

STOP AND CONFIRM: Force a failure of each critical path (auth expiry, rate limit, worker crash, trend ingestion failure). Confirm alert fires each time.

3.15 Phase 14 — Hardening and Production Rollout
Goal: safe promotion from staging to production and controlled activation of full-auto features.

Spec references
Section 24 Migration Order and Rollback Strategy.
Section 26.4 Pre-Production Gate.
Section 27.5 Zero-Downtime Deploy Checklist.

Claude actions
Full test-pyramid pass (unit, integration, contract, E2E) on staging.
Rollback rehearsal against a copy of production data.
Zero-downtime deploy per the checklist.
Auto-poster starts in approval-required mode for all categories.
Set up graduation criteria monitoring (4-week clean run, > 90% approval, > 0 engagement on > 80% of posts) before any category is promoted to full-auto.

Expected output
Module live in production behind feature flag SOCIAL_MODULE_ENABLED.
First real posts published, monitored closely.

STOP AND CONFIRM: Do NOT promote any category to full-auto without meeting all three graduation criteria. Manual approval remains the default state for at least 4 weeks.


4. Global Rules Claude Must Follow

4.1 Non-negotiables
Never commit secrets, tokens, or API keys. All credentials via env vars.
Never disable brand safety filters, blocklists, or the approval queue for convenience during development. Use test fixtures instead.
Never skip a STOP AND CONFIRM gate.
Never reformat or restructure existing PesaShop code that is not part of this build. If a change is needed for integration, flag it and wait for confirmation.
Never invent database columns. If new columns are needed on existing tables, produce a migration, do not modify seed data or ORM entities directly.
Never log raw tokens, full request/response bodies of platform APIs, or user PII beyond user_id. See Spec Section 29.4.

4.2 When in doubt
Ask MK. Do not proceed on ambiguous requirements.
Refer to the specific spec section by number. Example: "Per Spec Section 10.8.1, the hard cap is twice per (platform, region) in a 7-day window — confirm this applies here."
Prefer explicit over implicit. Prefer safe defaults over clever ones.
Prefer boring, well-tested libraries over the newest option.

4.3 Communication style expected
Begin each response with what the current phase is.
List every file being created or modified before writing it.
Explain design decisions briefly and cite spec sections.
End every response with the exit state: "Phase X complete. Waiting for you to review [artifacts] and reply 'proceed'."
Do not celebrate progress; report facts.


5. Handy Prompts for Later Sessions
Copy and paste these as needed when returning to a session.

5.1 Resume prompt

We are continuing the PesaShop Social Auto-Poster build. Read the spec
(PesaShop_Social_AutoPoster_Spec.md v2.1) and the Implementation Brief.

Report:
  1. Which phase are we currently in?
  2. What was completed in the last session?
  3. What is the next STOP AND CONFIRM gate?

Do not write code until I reply "proceed".

5.2 Get me unstuck prompt

I hit [describe the issue]. Before proposing a fix:

  1. Confirm where in the spec this is covered.
  2. List possible causes ranked by likelihood.
  3. Propose the minimal-risk fix aligned with existing PesaShop
     conventions (do not introduce a new pattern).

Wait for me to pick an option.

5.3 Audit-my-code prompt

Review the code you produced in this phase against the corresponding
spec section. Flag:

  - Anything that deviates from spec.
  - Anything that adds unnecessary complexity beyond spec.
  - Anything that violates the Non-negotiables in Section 4.1 of
    the Implementation Brief.
  - Anything using tokens, secrets, or PII in an unsafe way.

Be blunt.

5.4 Cost check prompt

Estimate monthly running cost of the current implementation based on
Spec Section 28. Flag anything above the $315–$525 target range and
propose optimisations without breaking behaviour.

5.5 Kill-switch drill prompt

Simulate an emergency where I need to stop all auto-posting immediately.
Walk me through the exact steps: environment variable, endpoint call,
worker behaviour, and verification queries. Confirm nothing is lost.


6. Quick Reference

6.1 Spec section index (frequently needed)
Existing system context — Section 1.3 (audit checklist in 1.3.4)
OAuth flows — Section 5
Composer UI — Section 6
Visual Post Designer — Section 7 (full section)
Scheduling / worker — Section 8
Product auto-post — Section 9
Product post profiles — Section 9.5
Trend Engine core — Section 10
Trend data model — Section 11
Trend dashboard — Section 12
Adapter implementation — Section 14
Security — Section 16
Deliverables and acceptance — Section 19
Environment variables — Section 21
Repository structure — Section 23
Migration sequence — Section 24
Platform dev account setup — Section 25
Cost budget — Section 28
Coding standards — Section 29

6.2 Environment variable quick list
Full list in Spec Section 21.1. The must-have set for local development is:

SOCIAL_TOKEN_KEY               # openssl rand -hex 32
DATABASE_URL                    # existing
REDIS_URL                       # provision if not present
META_APP_ID / META_APP_SECRET / META_OAUTH_REDIRECT_URI
X_CLIENT_ID / X_CLIENT_SECRET / X_OAUTH_REDIRECT_URI
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET / LINKEDIN_OAUTH_REDIRECT_URI
TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_OAUTH_REDIRECT_URI
ANTHROPIC_API_KEY
OPENAI_API_KEY                  # only if EMBEDDING_PROVIDER=openai
SERPAPI_KEY
LLM_MONTHLY_BUDGET_USD=200
EMBEDDING_PROVIDER=openai
NODE_ENV=development
LOG_LEVEL=info

6.3 File tree (target end state)
Reference: Spec Section 23. Follow existing PesaShop conventions if different.

End of Implementation Brief. Version 1.0.
Companion document to PesaShop_Social_AutoPoster_Spec.md v2.1.
