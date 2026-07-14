PesaShop
Social Auto-Poster Module
Technical Specification — v2.1

Prepared for: Khuphukile Group / PesaShop
Owner: Magiq Web & Mobile Applications
Date: 26 May 2026


1. Executive Summary
This document specifies the design and implementation of a Social Auto-Poster Module for PesaShop, an e-commerce platform built on React.js with a Node.js backend. The module enables PesaShop administrators to publish content to Facebook, Instagram, X (formerly Twitter), TikTok, and LinkedIn from a single admin interface, with support for both automated product announcements and manually scheduled marketing campaigns.
The architecture follows a native-integration approach (no third-party publishing middleware), giving PesaShop full control over data, costs, and platform behaviour. All five platform integrations are built into the existing PesaShop Node.js backend, with persistent token storage, a Redis-backed job queue for scheduled posts, and a unified React composer UI in admin.pesashop.com.

1.1 Goals
Single admin interface for composing and scheduling posts across five social networks.
Automatic posting of new products to selected platforms on publish.
Manual scheduling of marketing campaigns with per-platform content overrides.
Trend-driven auto-posting: detect what Zimbabwean buyers are searching for and surface matching PesaShop products on social media.
Multi-signal trend stack combining Google Trends (Zimbabwe geo), X/TikTok trending data, and PesaShop's own first-party search and cart signals.
Per-platform format generation: same trend rendered differently per network (caption tone, length, media style).
Weighted randomisation so posting feels organic rather than repetitive, while still favouring high-margin, in-stock, recently-untouched products.
Brand safety filter: trends flagged as politically charged, sensitive, or off-brand are excluded automatically.
Human-in-the-loop approval queue (default ON for the first weeks of auto-posting, switchable to full auto per category).
Reliable delivery with retries, error logging, and an audit trail.
Per-post analytics retrieval (impressions, engagement) where the platform supports it.
A/B variant generation per auto-post with engagement-weighted learning over time.

1.2 Non-Goals (v1)
This is NOT a greenfield build. Every part of this module integrates into the existing, in-production PesaShop application (React frontend, Node.js backend, Postgres database). No parallel repo, no parallel admin app, no parallel auth system.
Comment monitoring or social inbox functionality.
Direct messaging or customer-service workflows.
Paid ads management.
Multi-tenant support — v1 is single-tenant (PesaShop only).

1.3 Existing System Context
PesaShop is a live e-commerce platform already in production. This specification describes additions to that codebase. Before implementing any part of this document, the IDE / developer must orient against what already exists. The following items are assumptions about the current PesaShop state — each must be verified in the codebase audit (see Section 10.2 IDE Action callout for the trend-engine-specific verification, and Section 22.4 for the broader setup audit).

1.3.1 What already exists in PesaShop
React.js frontend at pesashop.com (customer-facing storefront).
React.js admin panel at admin.pesashop.com.
Node.js backend serving both frontend and admin via REST API, with JWT-based admin authentication.
PostgreSQL database with existing product, order, customer, and admin user tables.
Cloudinary integration for media hosting.
Brevo for transactional email; finalized email template design system (PesaShop green #1a5c2e, gold #e8a000, background #eceae6, Public Sans font, 680px wrapper).
TikTok UGC product review feed using TikTok oEmbed API.
Google OAuth credentials for main and admin subdomains.
NocoDB integration for order management.

1.3.2 What this spec adds
New Node module mounted under the existing PesaShop backend at /api/social/*.
New admin routes under admin.pesashop.com /admin/social/*.
New worker processes (publisher, trend, composer, insights) sharing the existing codebase.
New database tables under a social schema in the existing Postgres instance.
Redis dependency (verify if already in use; otherwise provision).
pgvector extension on the existing Postgres.
Reuse of the existing admin auth (JWT), existing Cloudinary for media, and existing design system (brand colours, fonts) for all new UI.

1.3.3 What this spec does NOT touch
Existing customer-facing storefront pages (no changes).
Existing product, order, customer schemas (read-only access; only minor additive columns where stated).
Existing checkout flow (read-only signal source for trend engine).
Existing Brevo / email templates.
Existing admin authentication (reuse, don't replace).

1.3.4 IDE Orientation Checklist
Before writing any new code, Windsurf / VS Code + Claude should audit the existing codebase to confirm:
Backend framework in use (Express, Fastify, NestJS, Koa) — determines module structure and routing conventions.
ORM / query builder in use (Knex, TypeORM, Prisma, raw pg) — determines migration syntax.
Existing folder structure under src/ — the new social module must follow the same conventions.
Existing admin auth middleware location and JWT verification helper — reuse, do not duplicate.
Existing logger setup (pino, winston, console) — reuse the same configuration.
Existing test framework and conventions — follow them.
Whether Redis is already provisioned and configured.
Whether pgvector is installed; if not, install before migrations.
Existing event-emitter / domain-event pattern — the product.published hook (Section 9) must use it. If no such pattern exists, this spec's introduction of one needs to be confirmed with the developer first.
Existing Cloudinary helper and upload flow — reuse, do not duplicate.
How env vars are currently loaded — follow the existing pattern, don't introduce a parallel one.
The result of this audit determines how some sections of this spec are implemented in practice. Where conventions differ from what the spec assumes, the existing PesaShop convention wins.

1.4 Realistic Timeline
Solo development, sequential platform delivery, bottlenecked by external API approvals:
Weeks 1–2: Database, OAuth, and backend skeleton; submit all five platform app applications.
Weeks 3–4: React composer UI with mocked adapters; scheduling engine and worker.
Weeks 5–6: Meta adapter (Facebook + Instagram) — typically first approved.
Week 7: LinkedIn adapter.
Week 8: X adapter.
Weeks 9–10: TikTok adapter (longest review cycle); product auto-post trigger; analytics.
Weeks 11–12: Trend Ingestion Service (Google Trends + SerpAPI + X + TikTok + first-party signals); Trend Cache schema.
Weeks 13–14: Semantic Trend–Product Matcher (embeddings + cosine similarity); Cultural Calendar layer.
Week 15: Weighted Randomiser; Cool-Down & Saturation Guard; Brand Safety Filter.
Week 16: Per-Platform Format Generator (Claude API integration); A/B variant engine; approval queue UI.
Week 17: End-to-end testing in shadow mode (system generates posts but admin approves all); tuning.
Week 18: Gradual transition to selective full-auto per category.


2. System Architecture

2.1 High-Level Diagram

admin.pesashop.com (React)
        |
        | HTTPS / JWT
        v
PesaShop Node.js API  ----+
        |                 |
        |                 +--> Postgres (accounts, posts, logs,
        |                 |              trends, cultural_events)
        |                 |
        |                 +--> Redis (BullMQ queue, OAuth state,
        |                 |          rate-limit buckets, trend cache)
        |                 |
        |                 +--> S3 / Cloudinary (media)
        |                 |
        |                 +--> Vector store (product embeddings)
        v
Workers (same codebase, multiple entry points):
  - publisher worker  (consumes social:* queues)
  - trend worker      (ingests Trends, scores, matches products)
  - composer worker   (LLM-generates platform variants)
  - insights worker   (fetches metrics post-publish)
        |
        +--> Meta Graph API     (Facebook, Instagram)
        +--> LinkedIn API
        +--> X API v2
        +--> TikTok Content Posting API
        +--> SerpAPI Google Trends     (paid, primary)
        +--> google-trends-api (npm)   (unofficial, fallback)
        +--> Anthropic API             (caption variants, safety check)
        +--> OpenAI embeddings         (or local model for matching)

2.2 Component Responsibilities
React Admin (admin.pesashop.com)
Account connection screens (one per platform) initiating OAuth.
Post composer with shared content and per-platform overrides.
Calendar/queue view of scheduled, published, and failed posts.
Per-product toggle: "Auto-post on publish" with platform selection.
Analytics dashboard pulling stored insights.

Node.js API
OAuth initiation and callback endpoints per platform.
Encrypted token storage and refresh logic.
CRUD for posts, schedules, and templates.
Webhook receivers for platform callbacks (where available).
Event listener on product.published to trigger auto-post creation.

Worker (BullMQ consumer)
Picks up scheduled-post jobs at fire time.
Routes each post to the correct platform adapter.
Handles retries, error classification, and result persistence.

Platform Adapters
One per platform, all implementing a shared interface:

interface PlatformAdapter {
  platform: 'facebook' | 'instagram' | 'x' | 'tiktok' | 'linkedin';
  publish(post: PreparedPost, account: SocialAccount): Promise<PublishResult>;
  refreshToken(account: SocialAccount): Promise<TokenSet>;
  fetchInsights(externalPostId: string, account: SocialAccount): Promise<Insights>;
}


3. Platform-Specific Considerations
Each platform has different APIs, approval processes, token lifetimes, and content rules. The table below summarises the constraints that drive the per-adapter implementation.

Platform | API | Token TTL | Approval | Key constraints
Facebook | Meta Graph API v19+ | 60 days | App Review required | Page tokens; posts via Page ID; pages_manage_posts scope.
Instagram | Meta Graph API v19+ | 60 days | App Review required | Business/Creator account linked to FB Page. 2-step container create then publish.
X | X API v2 | ~2 hours (OAuth 2.0 PKCE) + refresh | Paid tier required for writes | Basic tier ~$200/mo; tight monthly post caps; media upload via v1.1.
TikTok | Content Posting API | 24 hours | Two approvals (basic + Direct Post) | Strict content rules; Direct Post needs separate approval; chunked video upload.
LinkedIn | LinkedIn Marketing API | 60 days | Marketing Developer Platform application | w_member_social (personal) or w_organization_social (company page).

3.1 Approval Bottlenecks
Platform approvals are the critical path. Submit all five applications on day one and build against mocked adapters while waiting.
Meta App Review typically takes 2–7 business days. Provide a screencast showing how PesaShop uses each requested permission.
LinkedIn Marketing Developer Platform review is opaque; can take 1–3 weeks. Apply with a clear use case (e-commerce product announcements).
X Developer is instant for read access but Basic tier billing must be active for any write endpoint. Budget for this from day one.
TikTok is the slowest and least predictable; expect 2–6 weeks. Direct Post approval is separate from base API access.


4. Data Model
All tables live in the existing PesaShop Postgres database under a dedicated schema social. Token columns are encrypted at rest using AES-256-GCM with keys stored in the existing env-based secret manager.

4.1 social_accounts
One row per connected platform account. A single PesaShop install may connect multiple accounts on the same platform (e.g. main FB Page + secondary brand Page).

id                uuid PK
platform          enum('facebook','instagram','x','tiktok','linkedin')
display_name      text       -- "PesaShop Main", "PesaShop ZW"
external_id       text       -- page_id / user_id / channel_id
access_token_enc  bytea      -- AES-256-GCM
refresh_token_enc bytea
token_expires_at  timestamptz
scopes            text[]
status            enum('active','expired','revoked','needs_reauth')
metadata          jsonb      -- platform-specific extras
created_at        timestamptz
updated_at        timestamptz

4.2 posts
The canonical post record. One post may fan out to multiple platforms; each fan-out is tracked in post_targets.

id                uuid PK
title             text       -- internal label only
base_caption      text
media_refs        jsonb      -- [{ type:'image'|'video', url, alt }]
link_url          text       -- e.g. product URL
source            enum('manual','product_auto','campaign')
source_ref        text       -- product_id when source='product_auto'
scheduled_for     timestamptz
status            enum('draft','scheduled','publishing','partial','published','failed','cancelled')
created_by        uuid       -- admin user
created_at        timestamptz
updated_at        timestamptz

4.3 post_targets
One row per (post, platform-account, region) tuple. Holds per-platform overrides, regional targeting, and the resulting external post ID.

id                  uuid PK
post_id             uuid FK -> posts.id
account_id          uuid FK -> social_accounts.id
platform            enum(...)
target_region       enum('local_zw','diaspora_za','diaspora_uk',
                          'diaspora_us','diaspora_ca','diaspora_au',
                          'diaspora_eu','diaspora_bw','global')
caption_override    text
hashtags            text[]
first_comment       text       -- IG strategy
extra               jsonb      -- platform-specific (e.g. IG type: feed/reel)
scheduled_for       timestamptz  -- per-target, computed from region peak window
status              enum('pending','publishing','published','failed','skipped')
external_post_id    text
external_url        text
error_code          text
error_message       text
published_at        timestamptz
attempt_count       int default 0

4.4 post_insights
Snapshots of platform-reported metrics, fetched on a schedule (1h, 24h, 7d after publish).

id              uuid PK
post_target_id  uuid FK -> post_targets.id
captured_at     timestamptz
impressions     int
reach           int
likes           int
comments        int
shares          int
clicks          int
raw             jsonb

4.5 audit_log
Immutable record of all admin actions and adapter responses for compliance and debugging.

id           bigserial PK
actor_id     uuid
action       text       -- 'connect_account','publish_attempt',...
entity_type  text
entity_id    text
payload      jsonb
created_at   timestamptz default now()


5. OAuth and Token Management

5.1 Connection Flow
Admin clicks "Connect Facebook" in admin.pesashop.com.
Frontend calls GET /api/social/oauth/:platform/start.
Backend generates state (signed CSRF token) and PKCE verifier (where applicable), stores them in Redis with a 10-minute TTL, returns the authorize URL.
Browser redirects to platform authorize URL.
Platform redirects back to /api/social/oauth/:platform/callback?code=...&state=...
Backend validates state, exchanges code for tokens, fetches the connected account's profile/page list, and writes one or more social_accounts rows.
Admin sees the new connection in the UI.

5.2 Token Refresh Strategy
A daily cron scans social_accounts where token_expires_at is within 72 hours and triggers refresh per platform.
On any 401/expired-token response from a platform, the adapter attempts an inline refresh and retries once.
If refresh fails, the account is marked needs_reauth and the admin is shown a banner; scheduled posts targeting that account are paused (not failed).

5.3 Encryption
Tokens are encrypted at rest with AES-256-GCM. The encryption key is loaded from an environment variable (SOCIAL_TOKEN_KEY) and rotated on a schedule. Both ciphertext and IV are stored; the auth tag is appended to the ciphertext column.


6. Composer UI (React)

6.1 Layout
The composer is a single-page React component at /admin/social/compose with three regions: a left content panel (shared fields), a right preview panel (live mock of each selected platform), and a top bar with platform toggles, schedule control, and publish button.

6.2 Shared Fields
Media uploader (drag-and-drop, multi-file, image/video).
Base caption (used as fallback for any platform without an override).
Link URL (auto-populated when composing from a product).
Hashtag picker with reusable saved sets.

6.3 Per-Platform Tabs
Each selected platform gets a tab with the fields it specifically needs:
Facebook: Account selector (multiple Pages), caption override, link preview toggle, schedule for native FB scheduling vs PesaShop scheduling.
Instagram: Type: Feed / Reel / Story / Carousel. Caption (2,200 char limit). First-comment hashtag block (toggle). Cover frame selector for Reels.
X: Thread mode (split caption into 280-char tweets). Per-tweet media assignment. Reply settings (everyone / following / mentioned).
TikTok: Privacy (Public / Friends / Private). Allow comments / duet / stitch toggles. Disclose commercial content (required for branded). Direct post vs Upload to Inbox.
LinkedIn: Author: personal vs Company Page. Visibility (Public / Connections). Article-style vs short-post mode.

6.4 Character Counters and Validation
Real-time per-platform validation with visual indicators:
X: 280 characters, single tweet; warn at 270, block at 280 unless thread mode is on.
Instagram caption: 2,200 characters; hashtag count warning at 25, block at 30.
LinkedIn: 3,000 characters.
Facebook: 63,206 characters (effectively unlimited).
TikTok caption: 2,200 characters.
Media validation: aspect ratio, file size, duration limits enforced per platform before scheduling.

6.5 Scheduling Control
"Publish now" enqueues with delay 0.
"Schedule for" uses a datetime picker in the admin's timezone (Africa/Johannesburg by default), converted to UTC server-side.
"Add to queue" places the post in the next available slot of a recurring schedule template (e.g. "Mon/Wed/Fri 09:00").


7. Visual Post Designer
The Composer UI in Section 6 is the fast path: a form-based interface where the admin writes captions and uploads media. The Visual Post Designer is the rich path: a canvas-based editor where the admin can compose graphic posts visually — combining product images, background colours, text overlays, stickers, logos, video clips, and links — then export the result as the media payload for one or more platforms.
This is a single-page React component at /admin/social/designer, reachable from the Composer ("Open in designer") or directly from the admin nav.

7.1 Use Cases
Building a branded promotional graphic from a plain product photo (add price tag, discount badge, brand logo, gradient background).
Composing a multi-image carousel for Instagram from product gallery shots.
Creating a TikTok-aspect-ratio video composition by overlaying text and brand watermark on a clip.
Designing announcement posts (new arrivals, sales, holiday greetings) with no specific product attached.
Producing platform-specific variants from a single base design (LinkedIn 1.91:1, Instagram 1:1 or 9:16, X 1.91:1, etc.).

7.2 Canvas Architecture
The designer is built on a 2D canvas library suitable for production React. Recommended: Fabric.js (mature, React-friendly via react-fabric) or Konva.js (better React integration via react-konva). Konva.js is the preferred default — it has a declarative React API and better performance for our use case. Final choice confirmed during the IDE audit if either is already in use.

7.2.1 Canvas presets per platform
The designer opens with a preset selector that sets canvas dimensions and safe zones for the target platform and post type:
Instagram Feed Square: 1080×1080, 1:1. Safe zone: 80px margin all sides.
Instagram Feed Portrait: 1080×1350, 4:5. Largest feed footprint; best for engagement.
Instagram Story / Reel: 1080×1920, 9:16. Top 250px and bottom 250px reserved for UI overlays — keep text in middle.
TikTok: 1080×1920, 9:16. Similar safe-zone discipline to Reels.
Facebook Feed: 1200×630, 1.91:1. Open Graph standard; also used for link previews.
Facebook Square: 1200×1200, 1:1. Better for feed engagement than 1.91:1.
X (Twitter): 1600×900, 16:9. X also accepts square and 4:3.
LinkedIn Feed: 1200×627, 1.91:1. Open Graph standard.
Multi-platform Square: 1080×1080, 1:1. Universal fallback. Works on every platform.

7.3 Toolset
The designer toolbar exposes the following layer types and tools. All layers are independently movable, scalable, rotatable, and editable.

7.3.1 Image layer
Upload from disk (drag-and-drop or file picker).
Pick from PesaShop product gallery (search by product name or SKU; pulls all gallery images for that product).
Pick from a shared brand asset library (logos, watermarks, badges, brand patterns).
Pick from previously uploaded designer assets (the designer's own media library).
Apply filters: brightness, contrast, saturation, blur, vignette, grayscale, sepia.
Crop, rotate, flip horizontal/vertical.
Background removal (optional, paid: integrate with remove.bg or Cloudinary AI background removal). Toggleable to avoid surprise cost.

7.3.2 Video layer
Upload video (max 200MB for v1; larger requires chunked upload via Cloudinary).
Trim start/end (no advanced editing in v1; for that the admin uses external tools).
Volume control, mute toggle.
Auto-extract first frame as fallback thumbnail.
Aspect adjust: crop or letterbox to canvas.

7.3.3 Text layer
Font family: brand-approved set (Public Sans default per PesaShop design system; also include Inter, Roboto, Playfair Display, Bebas Neue, Montserrat).
Font size, weight, italic, underline, alignment.
Colour: free pick + brand palette quick-access (PesaShop green #1a5c2e, gold #e8a000, background #eceae6, white, black).
Drop shadow, text outline / stroke.
Background fill behind text (with adjustable opacity and corner radius) — useful for readability over images.
Line spacing, letter spacing.
Template snippets: "Price tag", "Discount badge", "New arrival ribbon", "Limited offer pill" — one-tap insert with default styling.

7.3.4 Shape layer
Rectangle, rounded rectangle, circle, line, arrow, star.
Fill colour, stroke colour, stroke width.
Opacity, drop shadow.
Useful for: price tags behind text, dividers, call-out arrows pointing at product details.

7.3.5 Sticker / Icon layer
Curated icon library (Lucide or Heroicons, brand-coloured).
Brand stickers: PesaShop logo variants, "Free delivery" badge, "100% Genuine" badge, payment-method icons, social-platform glyphs.
Custom sticker upload: admin can upload SVGs/PNGs into the brand sticker library for future reuse.

7.3.6 Background layer
Solid colour, gradient (linear or radial), image (uploaded or brand pattern), transparent.
Pre-built brand backgrounds: green gradient, gold gradient, subtle textures.

7.3.7 Link layer (data-bound)
Special non-visual layer attached to a post. Defines the destination URL when the platform supports clickable links separately from the image (Facebook, LinkedIn, TikTok link-in-bio, Instagram story link sticker). Not rendered on the canvas; rendered as metadata in the post payload.

7.4 Editing Behaviour
Layer panel on the right shows all layers with reorder via drag-and-drop, lock/unlock, visibility toggle, rename, delete.
Snap-to-grid and snap-to-other-layers for alignment; toggleable.
Guides: rule-of-thirds, centre lines, safe-zone outlines (per preset).
Full undo/redo stack (50 steps min).
Keyboard shortcuts: Cmd/Ctrl-Z undo, Cmd/Ctrl-Shift-Z redo, Cmd/Ctrl-D duplicate layer, Delete remove layer, arrow keys nudge by 1px (shift = 10px).
Multi-select: shift-click or drag-marquee; group transform.
Auto-save every 10 seconds to a designs table in Postgres so a crash doesn't lose work.

7.5 Designs Library
Saved designs live in a designs table and are reusable. Each design is editable, duplicable, and can be exported per-platform.

designs table:
id               uuid PK
title            text
description      text
canvas_preset    text         -- e.g. 'instagram_feed_square'
canvas_width     int
canvas_height    int
layers           jsonb        -- full layer tree, persisted
thumbnail_url    text         -- generated on save
linked_product   text nullable -- if associated with a product
tags             text[]
template_flag    boolean       -- if true, appears under "Templates"
created_by       uuid
created_at       timestamptz
updated_at       timestamptz

7.6 Templates
A starter pack of PesaShop-branded templates ships with the build. Admin can mark any saved design as a template for the team.
"New Arrival": product image left, price tag right, brand colours, "New Arrival" ribbon top-left.
"Flash Sale": high-contrast background, large discount percentage, time-limited copy area.
"Back in Stock": clean product photo, badge, simple CTA.
"Festive Greeting": brand-themed seasonal templates (Independence Day, Heroes Day, Christmas, Easter).
"Diaspora Special": "For family back home" framing, supports the diaspora cross-targeting strategy from Section 10.12.
"Quote / Testimonial": customer review with star rating, photo, product link.

7.7 Bulk Variant Generation
From a single base design, the designer can emit per-platform variants at the correct dimensions in one operation. This is essential for the cross-platform posting workflow.
Admin completes a base design at the largest target dimension (typically 1080×1350 IG Portrait).
Selects "Generate variants" and picks target platforms.
System renders each preset, attempting to preserve layout: re-anchors layers based on per-platform safe zones, scales background to fill, scales product image to fit, repositions text to remain within safe zones.
Admin previews each variant; manually adjusts any that need tweaks.
On save, all variants are stored as related designs (parent_design_id linking back to the base).

7.8 Export
Designs export as PNG (default), JPEG (smaller files), or MP4 (when video layer present).
Rendered server-side by a render-worker process using Konva-node or Puppeteer screenshot for parity with browser rendering.
Saved to Cloudinary with a stable URL; the design record references the URL.
When a design is used in a post, the Cloudinary URL is what the publisher sends to the platform adapter — same media flow as a directly-uploaded image.
Original layer tree is preserved alongside the rendered output so the design can always be re-opened and edited.

7.9 Integration with Composer
The Composer (Section 6) and the Designer (Section 7) are not duplicates — they are linked stages of the same flow:
From the Composer, the admin clicks "Design image" — opens the Designer with the selected platform preset and any existing media as a starting layer.
On save in the Designer, the rendered output replaces the media slot in the Composer.
Alternatively, the admin opens the Designer directly (e.g. to design a graphic ahead of time), saves it to the library, then attaches it to a post from the Composer.


8. Scheduling Engine

8.1 Queue Topology
BullMQ on Redis, one queue per platform to isolate rate limits and failures.

Queues:
  social:facebook
  social:instagram
  social:x
  social:tiktok
  social:linkedin

Job payload:
  { post_target_id: uuid, attempt: number }

8.2 Worker Lifecycle
Worker picks up job, sets post_targets.status = 'publishing'.
Loads post, post_target, and social_account from Postgres.
Calls adapter.publish() with prepared content.
On success: stores external_post_id, sets status = 'published', writes audit log, schedules insights fetch jobs (1h, 24h, 7d).
On failure: classifies the error (transient vs permanent), increments attempt_count.
Transient (rate-limit, 5xx, network): retry with exponential backoff (1m, 5m, 15m, 1h, 4h — max 5 attempts).
Permanent (validation, auth, content policy): mark failed, surface error in admin, write audit log.

8.3 Rate Limit Handling
Each adapter declares its own rate-limit profile (e.g. X v2 Basic: 100 tweets / 24h).
A Redis-backed token bucket per (platform, account) gates dispatch before the API call.
If the bucket is empty, the job is delayed (not failed) until the next refill.


9. Product Auto-Post Trigger

9.1 Hook Point
The existing PesaShop product publish flow emits a product.published domain event. The Social module subscribes and creates posts based on per-product settings.

9.2 Per-Product Settings
In the existing product admin screen (admin.pesashop.com /products/:id), a new "Social" tab adds:
Toggle: "Auto-post when this product goes live".
Multi-select: platforms to post to (defaults from store-level setting).
Caption template selector (with preview).
Override media selector (defaults to the first product image).
Content configuration profile (see 9.5) — controls exactly what product data gets included.

9.3 Caption Templates
Templates live in a templates table and use Handlebars-style variables drawn from the product record:

Variables:
  {{product_name}}        e.g. "Premium Cotton T-Shirt"
  {{product_price}}        e.g. "R 249.00"
  {{product_short_desc}}
  {{product_url}}          e.g. https://pesashop.com/p/premium-cotton
  {{product_category}}
  {{store_name}}           "PesaShop"
  {{currency}}              "ZAR" / "USD"
  {{hashtags}}              auto-derived from category
  {{discount_percent}}     if on sale, else empty
  {{stock_status}}         "In Stock" / "Limited" / "Pre-Order"

Example template (Instagram):
  New drop  {{product_name}} — now {{product_price}}
  Shop the link in our bio.
  {{hashtags}}

9.4 Flow
Admin publishes product.
product.published event fires.
Social handler checks the product's auto-post setting; if enabled, resolves templates and content config per platform.
Creates one posts row and N post_targets rows (one per selected platform).
Enqueues immediately, or applies the store's "delay before social announce" setting (e.g. publish to social 15 minutes after store goes live to allow checks).

9.5 Product Post Content Configuration
Every product auto-post is rendered using a Content Configuration Profile that controls exactly what product data is included. This is essential because a product post on TikTok should not look like a product post on LinkedIn, and an admin needs full control over what's shown. Profiles are reusable across products.

9.5.1 Configurable fields
Images: featured only / featured + N gallery / all gallery / none. Default: featured only. Carousel platforms (IG, FB) can use multiple; X uses up to 4; LinkedIn uses 1–9.
Video: include / exclude. If product has a video asset, include it on platforms that prefer video (TikTok, Reels) or fallback to image.
Product name: include / exclude / abbreviate. Abbreviate option uses first N chars for short-format platforms (X).
Price: show / hide / show on overlay only. "On overlay only" means the designer-generated graphic shows the price but caption doesn't. Useful when you want price visibility without giving comparison shoppers easy text scraping.
Currency: ZWL / USD / ZAR / multi. Multi shows price in 2–3 currencies (useful for diaspora-targeted posts).
Discount / sale info: show / hide / show only if > X%. Threshold prevents showing trivial 5% discounts that may feel like noise.
Short description: include / exclude / truncate to N chars. Auto-truncated per-platform character limits.
Full description: include / exclude. Only suitable for LinkedIn / Facebook (long-form platforms). Usually excluded.
Category / tags: include as text / as hashtags / exclude. "As hashtags" auto-prefixes # and joins. Excellent on IG / TikTok.
Stock status: show / hide / show only if low. Urgency lever; "only if low" emits "Only 3 left"-style copy.
Product URL: full / shortened / hide / link-in-bio note. Shortened via existing URL shortener (or PesaShop's own short domain if available). TikTok requires the link-in-bio note.
UTM tracking: auto-tag / off. Auto-tag appends utm_source, utm_medium, utm_campaign for analytics attribution. Default: ON.
Rating / reviews: show / hide / show if ≥ N stars. Pulls from existing PesaShop review data; threshold avoids surfacing weak ratings.
SKU / item code: show / hide. Default: hide. Rarely needed for consumer posts.
Delivery info: show / hide / region-aware. Region-aware: shows "Delivery to Zimbabwe" for diaspora-targeted posts; "Same-day in Harare" for local.
CTA phrase: dropdown / custom / none. Pre-set options: "Shop now", "Order today", "Send to family" (diaspora), "Link in bio", etc.
Brand watermark: on / off / position. Applies to designer-generated media; logo overlay at chosen corner.

9.5.2 Profile management
Profiles live in their own table and are reusable. A product references either an explicit profile or falls back to the store-default profile.

product_post_profiles table:
id                  uuid PK
name                text         -- e.g. "Premium Apparel", "Bulk Grocery", "Diaspora Default"
is_default          boolean
config              jsonb        -- the full set of switches above
per_platform        jsonb        -- platform-specific overrides
created_by          uuid
created_at          timestamptz
updated_at          timestamptz

products table additions (existing PesaShop products table):
ALTER TABLE products ADD COLUMN post_profile_id uuid NULL
  REFERENCES social.product_post_profiles(id);
ALTER TABLE products ADD COLUMN auto_post_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN auto_post_platforms text[] DEFAULT '{}';

9.5.3 Starter profiles
Seed migration ships these defaults:
Default: featured image, product name, price (single currency), short description, hashtags, shortened URL with UTMs, CTA "Shop now".
Diaspora: featured + 2 gallery, product name, dual-currency price (USD + ZAR), no stock status, shortened URL, CTA "Send to family", region-aware delivery info.
Premium / High-Ticket: featured + 4 gallery (carousel), product name, no price (drives DM enquiry), full description, rating, brand watermark on.
Flash Sale: featured image, product name (abbreviated), price + discount %, stock status (if low), short description excluded, urgent CTA "Limited — grab today".
Stealth: image only, no text fields, no price; for cases where the visual carries everything or testing organic reach.

9.5.4 Per-platform overrides
Within a profile, platform-specific overrides can flip any field. Examples:
Default profile shows price; LinkedIn override hides it (professional audience, not a price-sensitive context).
Default uses 1 image; Instagram override uses 4 gallery images (carousel).
Default uses ZWL; X override uses USD (less currency friction in 280 chars).
Default has full URL; TikTok override uses "link in bio" note + sets bio link to product URL.

9.5.5 Preview before save
Before activating auto-post on a product, the admin can hit "Preview" on the Social tab — it renders the post exactly as it would appear on each selected platform, using the resolved profile + template. This catches misconfigurations before the product publishes and triggers a live social post.


10. Trend-Driven Auto-Posting
Beyond the new-product trigger, the system detects what Zimbabwean consumers are actively searching for and surfaces matching PesaShop products to social media automatically. This section specifies the trend ingestion, scoring, product matching, content generation, and safety pipeline. The end-to-end flow runs on a configurable cron (default: hourly trend refresh, every 4 hours post generation).

10.1 Pipeline Overview

[Trend Ingestion] -> [Trend Cache] -> [Velocity & Safety Scoring]
        |
        v
[Semantic Product Matcher] -> [Candidate Set]
        |
        v
[Cultural Calendar Boost] -> [Cool-Down Filter] -> [Saturation Guard]
        |
        v
[Weighted Random Sampler] -> [Selected Trend+Product Pair]
        |
        v
[Per-Platform Composer (LLM)] -> [A/B Variant Generation]
        |
        v
[Brand Safety Filter] -> [Approval Queue OR Auto-Publish]
        |
        v
[Existing Publisher Pipeline] -> Social Platforms

10.2 Multi-Signal Trend Stack
Google does not provide an official public Trends API. We use a hybrid signal stack to get reliable, broad, and resilient trend data:

IDE ACTION REQUIRED (Windsurf / VS Code + Claude):
Before implementing the Trend Engine, audit the existing PesaShop codebase to verify whether customer search queries are being logged. Specifically check:
  1. Does the React frontend search component fire an analytics/telemetry event when a user submits a search query?
  2. Is there a backend endpoint (e.g. /api/search or /api/analytics/search) that persists queries to the database?
  3. Are zero-result searches captured separately or flagged?
  4. Is search-to-cart conversion tracked (the buyer's intent funnel)?
  5. Are abandoned-cart product IDs and timestamps stored?
If any of these are missing, they are prerequisites for the Trend Engine — the highest-quality trend signal (PesaShop's own first-party data) cannot exist without them. Implement logging FIRST, then accumulate at least 2–4 weeks of data before the trend matcher will produce useful first-party-driven recommendations. Add migration: search_query_log (id, query, normalised_query, user_id_nullable, session_id, result_count, results_clicked_count, converted_to_cart_bool, created_at).

Once logging is confirmed (or added), this stack feeds the Trend Engine:
SerpAPI Google Trends — ~$50/mo, High reliability. Primary source. Daily trending searches geo=ZW, interest-over-time for terms, related queries.
google-trends-api (npm) — Free, Medium reliability. Unofficial scraper. Fallback when SerpAPI fails. Breaks periodically when Google changes markup.
X trending hashtags — Included in X plan, High reliability. GET /2/trends/by/woeid/{Zimbabwe}. Real-time, but Zimbabwe WOEID may need fallback to South Africa for proxy signal.
TikTok Discover — Free (scraped) / Free (Research API), Medium reliability. Trending sounds, effects, hashtags. TikTok Research API requires separate application.
PesaShop first-party search — Free, Very high reliability. On-site search queries (including zero-result searches), abandoned-cart product IDs, wishlist adds. Zero rate limit, zero noise, exact buyer intent.
PesaShop order velocity — Free, Very high reliability. Products with rising sell-through rate in the last 24/72 hours. Confirms a trend has already converted on PesaShop.
First-party signals are the highest-quality input and should be weighted accordingly in the scorer. External trend data is for discovery and validation — your own buyers tell you what they actually want.

10.3 Trend Ingestion Service
A scheduled worker (BullMQ repeatable job) runs every 60 minutes:
Fetch top 25 trending search terms for geo=ZW from SerpAPI Google Trends.
Fetch interest-over-time (last 7 days) for each new term not already in the cache.
Fetch X trending list for Zimbabwe WOEID; fallback to SA if rate-limited.
Fetch TikTok Discover trending hashtags.
Read PesaShop's own search query log (last 24h, aggregated and deduplicated).
Read PesaShop's order velocity table (last 24h vs 72h baseline).
Normalise everything into a unified raw_trends row.
Compute scores (see 9.4) and write into the trends table.

10.4 Trend Scoring
Every cached trend has a composite score driven by multiple dimensions:

trend_score =
    0.30 * normalised_volume        (current absolute interest, 0-1)
  + 0.40 * velocity_score           (7-day rate of change, capped, 0-1)
  + 0.15 * source_confidence         (1.0 first-party, 0.8 SerpAPI, 0.5 scraped)
  + 0.10 * cultural_event_boost     (multiplier for calendar matches)
  + 0.05 * cross_source_validation  (count of sources reporting the same term)

velocity matters more than raw volume — a small rising trend
beats a saturated large one for "feels prescient" content.

10.5 Cultural Calendar Layer
Zimbabwe-specific demand patterns are predictable and should be baked in. A cultural_events table holds recurring and one-off events with associated product categories and a boost multiplier.
Month-end payday: 23rd–30th. Electronics, fashion, appliances. Largest spending window each month; ramp up posting 24h before.
Diaspora return season: 15 Dec – 15 Jan. Gifts, electronics, fashion, alcohol. Highest-value window; target global diaspora (UK, US, CA, AU, ZA, EU) ahead of arrival in Zim.
Back-to-school: Jan, May, Sep. Stationery, uniforms, shoes, bags. Three Zim school terms; pre-term posting 2 weeks ahead.
Independence Day: 18 April. Apparel, flags, decor. Patriotic-themed content; avoid political angles.
Heroes & Defence Forces: 2nd week Aug. Outdoor, leisure, food. Long weekend; travel and braai demand.
Unity Day: 22 December. Gifts, groceries, alcohol. Kicks off festive buying.
Black Friday: Last Fri Nov. All categories. Highest single-day promotional volume. Plan campaigns separately.
Harvest season: Apr–Jun. Storage, dry goods, kitchen. Rural-leaning demand; less relevant if PesaShop is urban-only.

10.6 Semantic Product Matcher
Literal keyword matching breaks down quickly. "Back to school" should match uniforms, stationery, lunchboxes, and shoes — none of which contain those words. We use embedding-based semantic similarity:
On product create/update, the product's title + short description + category is embedded (OpenAI text-embedding-3-small or local sentence-transformers) and stored in a pgvector column on the products table.
Each trending term is embedded the same way at ingestion time.
For matching, the matcher computes cosine similarity between the trend embedding and all in-stock product embeddings; returns top 20 with similarity > 0.55.
Optional keyword overlay: products containing the trend term verbatim get a +0.1 similarity bonus.
Output: a ranked candidate set of (trend, product, similarity) tuples.

10.7 Weighted Random Sampler
Pure random feels chaotic; pure ranked-top-N feels repetitive. The sampler picks from the candidate set with probability proportional to a composite weight:

weight(candidate) =
    trend_score
  * semantic_similarity
  * product_margin_factor     (0.5–1.5 based on margin band)
  * stock_factor              (0 if out of stock, 1.2 if >50 units)
  * recency_penalty           (1.0 if not posted in 14d, 0.3 at 7d, 0.05 at 3d)
  * platform_fit              (per-target adjustment, see 9.8)
  * cultural_event_boost      (1.0–2.0 multiplier)

Sampler: numpy.random.choice with normalised weights.
Pick N candidates per run (default 3–5 across platforms).

10.8 Cool-Down and Saturation Guard
Hard and soft ceilings prevent spammy behaviour. Caps are scoped per (platform, region) rather than globally per platform — a product can legitimately appear once in the Zim local window and once in the UK diaspora window on the same day without triggering the guard, because those posts reach different audiences. The global guards still exist as an outer envelope.

10.8.1 Hard caps
No product may be auto-posted to the same (platform, region) pair more than twice in any rolling 7-day window.
No product may be auto-posted globally (across all platforms and regions) more than 6 times in any rolling 7-day window. This is the outer envelope that prevents over-exposure even when region splits are legitimate.
No category may exceed 40% of auto-posts per (platform, region) pair in any rolling 7-day window.
No category may exceed 30% of auto-posts globally in any rolling 7-day window.
Minimum 90 minutes between auto-posts on the same (platform, region) pair.
Minimum 30 minutes between auto-posts on the same platform across any region (prevents three regional posts firing within seconds of each other due to overlapping evening windows).

10.8.2 Soft caps
recency_penalty in the weight function is computed per (platform, region) pair, not globally. A product posted to Zim local 6 days ago is still nearly fully eligible for a UK diaspora slot today.
A secondary cross-region recency penalty applies at 40% strength: if a product was posted to any region in the last 24 hours, all other regions see a mild discount on that product to avoid the catalogue feeling thin.
Post-velocity governor — if engagement on the last 5 auto-posts on a (platform, region) pair is below median by 50%, halve the rate for that pair until it recovers. Other regions on the same platform are unaffected.

10.8.3 Implementation notes

-- Cool-down lookup query pattern
SELECT COUNT(*) FROM post_targets pt
JOIN posts p ON p.id = pt.post_id
WHERE p.source_ref = :product_id
  AND pt.platform = :platform
  AND pt.target_region = :region            -- new column
  AND pt.published_at > NOW() - INTERVAL '7 days'
  AND pt.status = 'published';
-- If result >= 2 -> exclude this (product, platform, region) candidate

-- Add target_region to post_targets:
ALTER TABLE social.post_targets
  ADD COLUMN target_region text
  CHECK (target_region IN ('local_zw','diaspora_za','diaspora_uk',
                           'diaspora_us','diaspora_ca','diaspora_au',
                           'diaspora_eu','diaspora_bw','global'));

-- Default is 'local_zw' for legacy / manual / product-auto posts that
-- don't specify; trend-engine auto-posts always set explicitly.

10.9 Per-Platform Format Generator
Same trend + same product, but rendered differently per platform. The composer worker calls the Anthropic API with a system prompt that includes the platform's style guide and constraints, plus the trend context, product details, and any cultural event currently active.

10.9.1 Style guides by platform
TikTok: punchy hook in first 5 words; 1–2 trending hashtags; conversational, Gen-Z friendly; ask a question; suggest a sound from trending list.
Instagram: visual-first caption; lifestyle framing; 8–15 hashtags in first comment; clear CTA; Zim slang sparingly and only where natural.
Facebook: slightly longer; community-oriented; works for diaspora audience (mention Zim context explicitly); link preview optimised.
X: single tweet under 240 chars; sharp, witty, current-events aware; one hashtag max; thread only if the trend has depth.
LinkedIn: professional framing; insights angle (e.g. "what consumer demand for X tells us about Zim retail"); product as proof point; 0–2 hashtags.

10.9.2 A/B variant generation
For each (trend, product, platform) the composer generates 2–3 caption variants. One is chosen per the experiment policy below; the others are stored for analytics and future learning.
Variants must differ in opening hook, not just minor word choice.
Variant winners are tracked per platform-category combination.
After 50+ posts in a (platform, category) cell, the system shifts to exploit-mode: 80% winning style, 20% exploration.

10.10 Brand Safety Filter
Zimbabwean trending topics frequently include politically charged terms (elections, currency, fuel, ZESA, sanctions, specific political figures). PesaShop must never auto-post adjacent to these, even tangentially. Three layers of defence:
Static blocklist of terms (political figures, parties, opposition movements, currency-crisis terms, fuel-queue references, ZESA outage references, religious controversy, tribal references). Maintained by admin and reviewable in the UI.
LLM-based safety classifier: every generated caption is reviewed by Claude with a prompt asking "Is this caption safe for a politically neutral commercial e-commerce brand in Zimbabwe to publish? Return yes/no + reason." Any "no" response halts the post.
Trend itself flagged at ingestion: any trend term that matches the blocklist or that the LLM classifies as politically sensitive is excluded from candidacy entirely — we don't even attempt to match products to it.
Bypass: an admin may manually compose a post on a flagged trend through the regular composer (full editorial control), but auto-posting on it is impossible.

10.11 Human-in-the-Loop Approval Queue
The default state for trend-driven auto-posts is OFF for fully autonomous publishing. Posts land in a "Pending Approval" queue in admin.pesashop.com with a mobile-optimised swipe interface.
Each queue item shows: trend rationale, matched product, generated caption (with platform preview), confidence score, and platform target.
Actions: Approve (publishes immediately), Edit then Approve, Reject (with optional reason), Snooze 1h, Reject + ban this trend.
Approval analytics: rejection rate per trend source, per category, per platform. High rejection rates auto-penalise that source/category in the sampler.
Graduation rule: a category can be promoted to full-auto after (a) 4 weeks of approval-mode operation, (b) > 90% admin approval rate, (c) > 0 engagement events on > 80% of posts in that category.
Even in full-auto, hard kill switch at the top of admin: "Pause all auto-posting" — immediate, reversible.

10.12 Diaspora Cross-Targeting
Zimbabweans living abroad are a major commercial audience for PesaShop: they buy groceries, school fees, electronics, gifts, and services for family back home. Diaspora is not just South Africa — it is a worldwide footprint with distinct income levels, time zones, platform preferences, and product affinities. The trend-product matcher considers an additional dimension: which audience-platform-region combination this trend should fire on, not just whether to fire at all.

10.12.1 Diaspora regions in scope
South Africa: SAST (CAT). FB, WhatsApp, TikTok. High volume, mid value. Largest diaspora by count; frequent low–mid value parcels; groceries, electronics, school supplies, regular remittance-in-kind.
United Kingdom: GMT/BST (UTC+0/+1). FB, IG, WhatsApp, X. High frequency, high value. Strong concentrations in Leicester, Luton, Manchester, London. Active community pages and groups. Premium gifts, appliances, school fees, holiday packages.
United States: EST–PST (UTC-5 to -8). FB, IG, LinkedIn. Lower frequency, very high value. Higher-income segment; bigger-ticket purchases (appliances, electronics, vehicles parts, building materials). Atlanta, Dallas, DC metro hubs.
Canada: EST–PST (UTC-5 to -8). FB, IG, LinkedIn. Mid–high frequency, high value. Growing community in Alberta, Ontario. Similar profile to US but more remittance-style and festive-period spikes.
Australia: AEST/AEDT (UTC+10/+11). FB, IG, WhatsApp. Mid frequency, high value. Perth, Melbourne, Sydney. Time-zone challenge: AU evening is Zim morning — schedule posts accordingly. Premium goods, festive gifting.
Europe (non-UK): CET (UTC+1/+2). FB, IG, LinkedIn. Lower frequency, mid value. Smaller pockets in Ireland, Germany, Netherlands. Skews professional/student. Mostly festive and event-driven buying.
Botswana: CAT (UTC+2). FB, WhatsApp. High frequency, mid value. Border-region diaspora; similar dynamics to SA but smaller. Cross-border logistics simpler.

10.12.2 Geographic audience inference
Each trend, when matched to products, is also tagged with a recommended audience map:

audience_map: {
  local_zw:       0-1,  // people in Zimbabwe right now
  diaspora_za:    0-1,
  diaspora_uk:    0-1,
  diaspora_us:    0-1,
  diaspora_ca:    0-1,
  diaspora_au:    0-1,
  diaspora_eu:    0-1,
  diaspora_bw:    0-1
}

Inference is via LLM classification at trend ingestion time
on a prompt like: "Which audiences are most likely to act on
this trend in the context of e-commerce purchases for Zimbabwe?"

10.12.3 Region-aware posting decisions
Local-only trends (load shedding accessories, mobile data top-ups, ZESA-related, fuel solutions): fire on TikTok / X / IG with Zim-only audience hints; skip Facebook diaspora amplification.
Diaspora-relevant trends (groceries-for-family, school fees season, festive gifting, bereavement support, building materials): boost Facebook posting; tailor caption per region ("for family in Zim" framing); LinkedIn for higher-value items targeting US/Canada/UK professional diaspora.
Universal trends (fashion, beauty, electronics launches): broadcast wide; let platform algorithms find audiences across all regions.
Festive / season-of-return content (Dec 15 – Jan 15): triple-weight diaspora audience targeting; lead times of 4–6 weeks for shipping and gift planning.

10.12.4 Time-zone-aware scheduling
A single post can be scheduled to fan out at the optimal local time per region. Each diaspora audience has different peak engagement windows; the scheduler resolves them per platform-region:
SA / Botswana / Zim local: 12:00 and 19:00 CAT.
UK: 18:00–21:00 GMT/BST (commute home + evening scroll).
US East / Canada: 19:00–22:00 EST.
US West: 18:00–21:00 PST.
Australia: 18:00–21:00 AEST.
Europe: 18:00–21:00 CET.
Implementation: when a trend's audience_map flags multiple regions, the engine creates one post record but multiple post_targets, each with its own scheduled_for in UTC computed from the target region's optimal window. Caption variants per region (e.g. "for family back home" for UK/US/CA/AU, vs direct local framing for Zim/SA).

10.12.5 Diaspora-specific captioning
The composer worker is given an additional context block when generating diaspora-targeted variants. Examples of the framing differences the LLM should produce:
Local Zim variant: "Fresh stock of [product] just landed. Order today, collect tomorrow."
SA diaspora variant: "Send [product] to family in Zim this weekend. Delivery to door, anywhere in Zimbabwe."
UK / US / CA / AU diaspora variant: "Pay from [country], delivered in Zim. [product] for your family this [event/season] — no queues, no hassle."
These framings tie directly into the Khuphukile Group narrative: PesaLogistics handling diaspora-commissioned fulfilment, and PesaShop as the catalogue layer. The trend engine should be aware of this strategic positioning so its outputs reinforce it.

10.12.6 First-party diaspora signals
Once geo-IP and account country are captured at checkout (verify in IDE audit: are these stored?), PesaShop's own data becomes a diaspora signal source:
Orders placed by buyers in UK/US/CA/AU/EU shipping to Zim addresses — these are diaspora-confirmed transactions.
Browsing patterns from non-Zim IPs but interacting with the Zim catalogue.
Repeat diaspora buyers — identify and segment for higher-touch campaigns.
Diaspora cart abandonment is a strong signal of consideration and a perfect trigger for retargeting auto-posts.


11. Trend Engine Data Model
New tables added under the social schema:

11.1 trends

id                   uuid PK
term                 text
slug                 text       -- normalised for matching
sources              text[]     -- ['serpapi','x','firstparty',...]
geo                  text       -- 'ZW' usually
volume_normalised    numeric    -- 0-1
velocity             numeric    -- 7d % change, clamped
trend_score          numeric    -- composite (see 9.4)
audience             enum('local_zw','diaspora_za','diaspora_uk','diaspora_us',
                          'diaspora_ca','diaspora_au','diaspora_eu','diaspora_bw',
                          'youth','professional','mixed')
embedding            vector(1536)
sensitivity_flag     enum('safe','review','blocked')
blocklist_reason     text
first_seen           timestamptz
last_refreshed       timestamptz
active               boolean default true

11.2 trend_product_candidates

id              uuid PK
trend_id        uuid FK
product_id      text
similarity      numeric    -- cosine, 0-1
weight          numeric    -- final sampler weight
last_evaluated  timestamptz

11.3 cultural_events

id              uuid PK
name            text
recurrence      jsonb       -- {type:'annual', month:4, day:18} or {type:'monthly', day_range:[23,30]}
boost           numeric     -- 1.0-2.0
category_ids    text[]
active          boolean
notes           text

11.4 auto_post_decisions
Full audit trail of every decision the engine makes, even ones not published.

id                uuid PK
run_id            uuid       -- groups one sampler run
trend_id          uuid FK
product_id        text
platform          enum(...)
selected          boolean
weight            numeric
variants          jsonb       -- all generated variants
chosen_variant    int
safety_passed     boolean
safety_reason     text
approval_status   enum('auto_published','approved','rejected','pending','expired')
approval_actor    uuid
created_at        timestamptz
acted_at          timestamptz

11.5 trend_blocklist

id           uuid PK
term         text       -- exact or regex
type         enum('exact','regex','category')
reason       text
added_by     uuid
created_at   timestamptz

11.6 ab_variant_performance

id                uuid PK
platform          enum(...)
category          text
variant_style     text       -- 'question_hook', 'price_lead', 'story_lead', etc.
posts_count       int
total_engagement  int
last_updated      timestamptz


12. Admin Trend Dashboard
A new section in admin.pesashop.com at /admin/social/trends gives full visibility and control over the engine.

12.1 Live Trends Panel
Table of currently-tracked trends with: term, sources, score, velocity sparkline, audience tag, sensitivity flag, last refreshed.
Filters: by source, sensitivity, audience, score range.
Per-row actions: View matched products, Force-refresh, Block, Pin (force high weight for 24h).

12.2 Approval Queue
Card-based UI, mobile-optimised, swipeable.
Each card: platform icon, generated caption, product image, trend chip, confidence bar.
Swipe right = approve, left = reject, up = edit, down = snooze.
Bulk actions: approve all under one platform, reject all from one trend.

12.3 Cultural Calendar Manager
Calendar view of upcoming events; click to edit boost, categories, notes.
"Add one-off event" for unscheduled moments (e.g. a national football match, a viral incident).
Lead-time setting: how many days before the event posting begins to ramp.

12.4 Performance Insights
Auto-post engagement by source: which trend source produces the best-performing posts?
Engagement by variant style: which caption styles win in which categories?
Rejection analysis: which trends/products are consistently rejected by the admin?
Conversion link: when integrated with PesaShop analytics, attribute orders back to auto-posts.

12.5 Configuration
Per-platform: master ON/OFF, auto-publish vs approval-required, hourly post cap.
Per-category: graduation status, max share of auto-posts.
Sampler weight tuning sliders (advanced users only).
Blocklist editor: terms, regexes, categories.
Cool-down settings: per-product and per-category windows.
Kill switch: pause all trend-driven posting instantly.


13. Trend Engine API Surface
Endpoints added under /api/social/trends, admin-authenticated.
GET /trends — List trends with filters.
POST /trends/refresh — Force a trend ingestion run.
POST /trends/:id/block — Add term to blocklist.
POST /trends/:id/pin — Force high weight 24h.
GET /trends/:id/candidates — Matched product candidates.
GET /trends/blocklist — Read blocklist.
POST /trends/blocklist — Add entry.
DELETE /trends/blocklist/:id — Remove entry.
GET /approvals — Pending queue.
POST /approvals/:id/approve — Approve (optional caption edit).
POST /approvals/:id/reject — Reject with reason.
POST /approvals/:id/snooze — Snooze N minutes.
GET /cultural-events — List events.
POST /cultural-events — Create event.
PATCH /cultural-events/:id — Update event.
GET /insights/auto-posts — Performance analytics.
POST /engine/pause — Kill switch (idempotent).
POST /engine/resume — Resume engine.


14. Adapter Implementation Notes

14.1 Facebook (Meta Graph API)
Endpoint: POST /{page-id}/feed for text+link; /{page-id}/photos for image; /{page-id}/videos for video.
Use Page access tokens (long-lived, 60 days), not user tokens.
Required scopes: pages_show_list, pages_read_engagement, pages_manage_posts.
For scheduled posts, can use FB's native scheduled_publish_time — but PesaShop handles its own scheduling for consistency across platforms.

14.2 Instagram (Meta Graph API)
Two-step publish: 1) POST /{ig-user-id}/media to create a container (returns container ID); 2) POST /{ig-user-id}/media_publish with the container ID.
Carousels: create child containers, then a parent carousel container, then publish.
Reels: media_type=REELS with cover_url; status polling required (container moves through IN_PROGRESS → FINISHED before publish is allowed).
First-comment posting: separate POST to /{media-id}/comments after the publish call returns.
Required scopes: instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement.

14.3 X (API v2)
Tweets: POST /2/tweets with text and media_ids array.
Media upload still uses v1.1 (chunked init/append/finalize for video; simple for images).
Threads: chain POST /2/tweets calls with reply.in_reply_to_tweet_id.
OAuth 2.0 with PKCE; refresh tokens rotate on each refresh — always store the new refresh token.
Watch monthly post cap on Basic tier; surface usage in admin.

14.4 TikTok (Content Posting API)
Two upload modes: PULL_FROM_URL (TikTok fetches from a public URL) and FILE_UPLOAD (chunked upload from server).
FILE_UPLOAD is preferred: avoids exposing media on a public URL, more reliable.
Direct Post requires the additional video.publish scope and a separate approval; without it, content goes to the user's inbox/drafts for manual posting.
Mandatory fields: disclose_commercial_content, branded_content_toggle, and privacy_level on every post.
Status polling: after upload, poll the publish status endpoint until PROCESSING_UPLOAD → PUBLISH_COMPLETE.

14.5 LinkedIn
Endpoint: POST /rest/posts with author URN (urn:li:person:{id} or urn:li:organization:{id}).
Images: register upload via /rest/images?action=initializeUpload, PUT the binary, then reference the asset URN in the post.
Videos: similar two-step with /rest/videos.
Required scopes: w_member_social (personal posting), w_organization_social (company Page).
Use the LinkedIn-Version header (e.g. 202404) and X-Restli-Protocol-Version: 2.0.0.


15. Social Module API Surface (PesaShop Backend)
All endpoints are namespaced under /api/social and require admin authentication via the existing PesaShop JWT scheme.
GET /oauth/:platform/start — Begin OAuth; returns redirect URL.
GET /oauth/:platform/callback — OAuth callback; persists account.
GET /accounts — List connected accounts.
DELETE /accounts/:id — Disconnect / revoke.
POST /accounts/:id/refresh — Force token refresh.
POST /posts — Create draft or scheduled post.
GET /posts — List posts (filter by status, date, platform).
GET /posts/:id — Get post + targets + insights.
PATCH /posts/:id — Edit before publish.
DELETE /posts/:id — Cancel.
POST /posts/:id/publish-now — Move scheduled → immediate.
GET /templates — Caption templates.
POST /templates — Create template.
GET /insights/:post_target_id — Latest metrics.
POST /webhooks/:platform — Public webhook receiver.


16. Security and Compliance
Token encryption at rest (AES-256-GCM). Keys never logged.
OAuth state and PKCE verifiers stored in Redis with strict TTL; CSRF protection on all state-changing endpoints.
Webhook endpoints verify signatures (HMAC for Meta, signature header for LinkedIn) before processing.
Rate limiting on all admin endpoints (per-user) to prevent abuse from a compromised admin session.
Audit log entries for: account connect/disconnect, manual publishes, template edits, settings changes.
POPIA considerations: token data, account display names, and any captured user content are treated as personal information; retention policy of 90 days post-deletion for audit logs.
Platform compliance: each adapter respects rate limits and platform-specific content policies; the audit log is the evidence trail if a platform queries usage.

16.1 Failure Modes
Token revoked by user from platform side → next API call returns 401 → account marked needs_reauth → admin notified → dependent posts paused.
Platform-wide outage → transient retries with backoff; circuit-breaker after 10 consecutive failures across the queue to avoid hammering.
Content rejection (e.g. TikTok content policy) → marked failed-permanent with platform's error message surfaced verbatim in the admin UI.
Worker process dies mid-publish → BullMQ stalled-job detection re-queues; idempotency key (post_target_id + attempt) prevents duplicate posts.


17. Observability
Structured JSON logs (existing PesaShop logger) tagged with module=social, platform, post_target_id.
Metrics: publishes per platform per hour, success/failure ratio, average end-to-end latency from schedule to published, queue depth, token refresh failures.
Trend engine metrics: trends ingested per source per hour, candidates generated per run, approval rate per category, brand-safety rejections per day, average composer LLM latency, embedding cost per day.
Admin dashboard surfaces: count of needs_reauth accounts, count of failed posts in last 24h, next 10 scheduled posts, top 10 trending terms now, approval queue depth.
Email/Slack alert on: > 5 failures in 1h on any platform, any account moving to needs_reauth, X usage > 80% of monthly cap, approval queue > 50 items, trend ingestion failures from primary source.


18. Risks and Mitigations
TikTok Direct Post approval denied (High) — Ship Upload-to-Inbox fallback so admin posts manually from TikTok app.
X Basic tier pricing changes / endpoints deprecated (Medium) — Adapter interface isolates X logic; ability to disable platform per-account without code change.
Meta App Review rejection (High) — Provide thorough screencasts; have a fallback explainer ready; resubmit quickly.
LinkedIn API version sunsets (Low) — Pin LinkedIn-Version header; monitor LinkedIn developer changelog quarterly.
Token compromise via DB leak (High) — AES-256-GCM at rest + key rotation; tokens never in logs; row-level access only via service role.
Admin posts content violating platform policy (Medium) — Surface platform error verbatim; pre-publish lint warnings for likely violations (e.g. excessive hashtags).
Worker fails silently (Medium) — BullMQ stalled-job detection + health-check endpoint + alert.
Google Trends scraper breaks (unofficial) (Medium) — SerpAPI primary; multiple fallbacks; engine degrades gracefully (falls back to first-party + X signals).
LLM generates politically sensitive caption (High) — Three-layer brand safety: blocklist + LLM safety classifier + trend-level sensitivity flag. Default to approval queue, never auto-publish high-risk.
Auto-poster floods feed and audience disengages (High) — Hard caps per platform/category; cool-down windows; engagement governor that throttles when performance drops.
Trend–product mismatch produces nonsense (Medium) — Similarity threshold of 0.55 + admin approval queue + rejection-rate penalty in sampler.
Embedding API cost spirals (Low) — Embed products only on create/update; embed trends once at ingestion; switch to local sentence-transformers if monthly spend exceeds threshold.
LLM caption costs spiral (Medium) — Cache per (trend, product, platform) for 24h; cap variants at 3; budget alert at 80% of monthly cap.
Cultural calendar misfires in a sensitive year (Medium) — Annual review of cultural events before December; ability to disable any event from the admin UI in seconds.


19. Deliverables and Acceptance Criteria

19.1 Deliverables
Pre-build audit (executed by Windsurf / VS Code + Claude in the existing PesaShop codebase) confirming presence of search query logging, zero-result search capture, cart-conversion tracking, and abandoned-cart capture. Any missing items implemented before Trend Engine work begins.
Postgres migration files for the social schema (accounts, posts, targets, insights, audit, trends, candidates, cultural events, decisions, blocklist, A/B performance) plus search_query_log if not already present.
pgvector extension enabled and product/trend embedding columns populated.
OAuth flow code + connection UI for all five platforms.
Composer UI deployed to admin.pesashop.com.
Publisher worker process running alongside the existing PesaShop API.
Trend worker (ingestion + matching), composer worker (LLM caption variants), insights worker.
Five working platform adapters, each with unit tests + recorded integration test.
Product auto-post hook integrated with the product publish event.
Trend engine end-to-end (ingestion → scoring → matching → sampling → composition → safety → approval/publish).
Trend admin dashboard at /admin/social/trends (live trends, approval queue, cultural calendar manager, insights, config).
Cultural events seeded with the Zimbabwe calendar from section 10.5.
Brand safety blocklist seeded with initial Zimbabwe-specific terms.
Insights collection scheduled jobs.
Admin docs: how to connect each platform, how to compose, how to use the trend engine, troubleshooting common errors, brand-safety guidelines.

19.2 Acceptance Criteria
An admin can connect at least one account per platform via OAuth in admin.pesashop.com.
An admin can compose a post in the unified composer with per-platform overrides and successfully publish to all five platforms simultaneously.
A scheduled post fires within 60 seconds of its target time.
A new product with auto-post enabled produces correctly-formatted posts on all selected platforms within 5 minutes of product publish.
A revoked token causes the account to move to needs_reauth without crashing the worker, and the admin is notified.
Failed posts surface the platform's actual error message in the admin UI.
All publishes appear in audit_log within 1 second of completion.
The trend engine ingests at least 4 sources hourly and writes scored rows to the trends table.
The semantic matcher returns relevant product candidates (manual sample of 20 trends shows > 70% relevance rating by admin).
The weighted sampler produces distributed selections (no single product picked more than twice in any 7-day rolling window).
Brand safety filter blocks 100% of seeded political-trigger test trends and any caption containing seeded sensitive terms.
Approval queue is operational end-to-end on mobile, with swipe interactions working under 200ms response.
Kill switch halts all engine activity within 5 seconds and survives worker restart.
Cost: monthly LLM + embeddings + SerpAPI spend stays under the agreed ceiling (default: $200/mo).


20. Open Questions
Will PesaShop run on a single FB Page / IG account, or multiple regional brand accounts (e.g. PesaShop ZA, PesaShop ZW)? Affects account model and UI.
Is the X Basic tier ($200/mo) budgeted, or should X be deferred from v1?
Should product auto-post be opt-in per product (admin toggles each time) or opt-out (default on, admin disables for exceptions)?
Do we need approval workflow for manual posts (draft → reviewer → publish), or does a single admin role suffice for v1?
UGC repost workflow (taking TikTok reviews and re-sharing to IG/FB) — in v1 or v2?
Trend engine target geography: confirmed as Zimbabwe-local + global diaspora (ZA, UK, US, CA, AU, EU, BW). SerpAPI Trends ingestion is geo=ZW for trend discovery; diaspora targeting is via audience inference and platform-side audience hints (not separate Trends queries per region) to keep API costs sane.
LLM provider for caption generation: Anthropic only, or also Gemini/OpenAI for variant diversity?
Embeddings: managed (OpenAI text-embedding-3-small at ~$0.02/1M tokens) or self-hosted sentence-transformers? Trade-off is cost vs ops complexity.
Approval-queue notification channel: email, WhatsApp via Twilio, push notification through a future PesaShop mobile admin app?
Conversion attribution: do we have UTM tagging set up on product URLs to attribute orders back to specific auto-posts?
Engine "graduation" governance: who signs off on a category moving from approval-required to full-auto?


21. Environment Variables and Secrets
All secrets are loaded from environment variables, never committed. In production, use the existing PesaShop secret manager (e.g. AWS Secrets Manager, Doppler, or .env on the host depending on current setup — IDE should confirm which is in use). Local development uses a .env.local file (gitignored).

21.1 Required Environment Variables
SOCIAL_TOKEN_KEY — Yes — 32-byte hex string for AES-256-GCM token encryption. Generate: openssl rand -hex 32.
DATABASE_URL — Yes (existing) — Existing PesaShop Postgres connection string.
REDIS_URL — Yes — Redis connection for BullMQ queues and OAuth state.
META_APP_ID — Yes — Facebook/Instagram app ID from developers.facebook.com.
META_APP_SECRET — Yes — Facebook/Instagram app secret. Treat as highest-sensitivity.
META_OAUTH_REDIRECT_URI — Yes — https://admin.pesashop.com/api/social/oauth/facebook/callback
X_CLIENT_ID — Yes — X (Twitter) OAuth 2.0 client ID from developer.x.com.
X_CLIENT_SECRET — Yes — X OAuth 2.0 client secret.
X_OAUTH_REDIRECT_URI — Yes — https://admin.pesashop.com/api/social/oauth/x/callback
LINKEDIN_CLIENT_ID — Yes — LinkedIn app client ID from linkedin.com/developers.
LINKEDIN_CLIENT_SECRET — Yes — LinkedIn app client secret.
LINKEDIN_OAUTH_REDIRECT_URI — Yes — https://admin.pesashop.com/api/social/oauth/linkedin/callback
TIKTOK_CLIENT_KEY — Yes — TikTok app client key from developers.tiktok.com.
TIKTOK_CLIENT_SECRET — Yes — TikTok app client secret.
TIKTOK_OAUTH_REDIRECT_URI — Yes — https://admin.pesashop.com/api/social/oauth/tiktok/callback
ANTHROPIC_API_KEY — Yes — Claude API key for caption generation and brand safety filter.
OPENAI_API_KEY — Conditional — Only if using OpenAI embeddings (vs self-hosted).
SERPAPI_KEY — Yes — SerpAPI key for Google Trends (Zimbabwe geo).
CLOUDINARY_URL — Likely existing — Existing PesaShop Cloudinary; confirm in IDE audit.
SLACK_WEBHOOK_URL — Recommended — For alerting (failures, kill-switch events, approval queue depth).
AUTOPOSTER_KILL_SWITCH — Optional — Set to 'true' as emergency override; engine refuses to publish anything.
LLM_MONTHLY_BUDGET_USD — Recommended — Soft cap for LLM spend. Default 200. Engine pauses LLM calls when exceeded.
EMBEDDING_PROVIDER — Yes — 'openai' | 'local'. Determines OPENAI_API_KEY requirement.
NODE_ENV — Yes — 'development' | 'staging' | 'production'. Affects test-mode adapters.
LOG_LEVEL — Recommended — 'debug' | 'info' | 'warn' | 'error'. Default 'info'.

21.2 Secret Rotation Policy
SOCIAL_TOKEN_KEY: rotate every 90 days. Implement key-versioning (encrypt new tokens with the new key, decrypt existing with whichever key matches stored key_version).
Platform OAuth secrets: rotate annually or immediately on suspected compromise.
ANTHROPIC_API_KEY / OPENAI_API_KEY / SERPAPI_KEY: rotate quarterly or on team changes.
All rotations logged in audit_log with actor and timestamp.


22. Setup and Installation

22.1 System Dependencies
Node.js ≥ 20.x (confirm existing PesaShop version).
PostgreSQL ≥ 15.x with the pgvector extension installed.
Redis ≥ 7.x for BullMQ queues, OAuth state, and rate-limit token buckets.
ImageMagick + libvips for media preprocessing (TikTok/IG aspect-ratio enforcement).
ffmpeg for video probe and basic transformations.

22.2 npm Packages

# Core
npm install bullmq ioredis pg pg-vector
npm install axios got                          # HTTP clients
npm install jsonwebtoken cookie-parser          # auth
npm install zod                                 # input validation
npm install pino pino-pretty                    # structured logging

# Platform SDKs / helpers
npm install facebook-nodejs-business-sdk        # Meta (optional; raw HTTP also fine)
npm install twitter-api-v2                      # X v2
npm install linkedin-api-client                 # LinkedIn (or use raw HTTP)
# TikTok has no official Node SDK — implement raw HTTP

# LLM and embeddings
npm install @anthropic-ai/sdk
npm install openai                              # only if EMBEDDING_PROVIDER=openai

# Trend ingestion
npm install google-trends-api                   # unofficial fallback
npm install serpapi                             # SerpAPI client

# Utilities
npm install date-fns date-fns-tz                # timezone math for region scheduling
npm install crypto-js                           # AES-256-GCM helpers
npm install handlebars                          # caption templating
npm install lru-cache                           # in-memory caches
npm install adm-zip                             # if media archive ops needed

# Dev / testing
npm install --save-dev jest @types/jest ts-jest nock supertest

22.3 Postgres Extension Setup

-- Run once as superuser before migrations
CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- for trend/product fuzzy text search
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE SCHEMA IF NOT EXISTS social;

22.4 First-Time Setup Checklist
Clone PesaShop repo; create feature branch feature/social-autoposter.
Copy .env.example to .env.local; fill in all required variables (see 20.1).
Install system deps (Node, Postgres + pgvector, Redis, ImageMagick, ffmpeg).
Run npm install at repo root.
Run Postgres extension setup (21.3).
Run database migrations (see 22).
Seed cultural_events with the Zimbabwe calendar from section 10.5.
Seed trend_blocklist with initial Zimbabwe-sensitive terms.
Start Redis and confirm connectivity.
Start API server (npm run dev) and worker (npm run worker:dev).
Open http://localhost:3000/admin/social and confirm the empty connections screen renders.
Connect at least one platform via OAuth (start with Meta dev test account).
Run npm test to confirm full unit + integration suite passes.


23. Repository Structure
The social module integrates into the existing PesaShop Node.js codebase. Treat this as a directive for code organisation — don't create a separate repo. Exact paths depend on the existing PesaShop convention (Express vs NestJS vs Fastify); the structure below assumes a typical layered Express app. IDE should adapt if conventions differ.

pesashop/
├─ src/
│  ├─ modules/
│  │  ├─ social/                          # NEW MODULE
│  │     ├─ adapters/                     # one per platform
│  │     │  ├─ facebook.adapter.ts
│  │     │  ├─ instagram.adapter.ts
│  │     │  ├─ x.adapter.ts
│  │     │  ├─ tiktok.adapter.ts
│  │     │  ├─ linkedin.adapter.ts
│  │     │  ├─ base.adapter.ts            # shared interface
│  │     ├─ oauth/
│  │     │  ├─ oauth.controller.ts
│  │     │  ├─ oauth.service.ts
│  │     │  ├─ token.crypto.ts            # AES-256-GCM
│  │     ├─ posts/
│  │     │  ├─ post.controller.ts
│  │     │  ├─ post.service.ts
│  │     │  ├─ post.repository.ts
│  │     │  ├─ composer.service.ts
│  │     ├─ scheduler/
│  │     │  ├─ publisher.worker.ts
│  │     │  ├─ queue.factory.ts
│  │     │  ├─ rate-limit.ts
│  │     ├─ trends/                       # Trend Engine
│  │     │  ├─ ingestion/
│  │     │  │  ├─ serpapi.source.ts
│  │     │  │  ├─ google-trends.source.ts
│  │     │  │  ├─ x-trends.source.ts
│  │     │  │  ├─ tiktok-discover.source.ts
│  │     │  │  ├─ firstparty.source.ts
│  │     │  ├─ scoring/
│  │     │  │  ├─ velocity.ts
│  │     │  │  ├─ composite.ts
│  │     │  ├─ matching/
│  │     │  │  ├─ embeddings.ts
│  │     │  │  ├─ matcher.service.ts
│  │     │  ├─ sampling/
│  │     │  │  ├─ weighted-sampler.ts
│  │     │  ├─ safety/
│  │     │  │  ├─ blocklist.ts
│  │     │  │  ├─ llm-safety-classifier.ts
│  │     │  ├─ calendar/
│  │     │  │  ├─ cultural-events.service.ts
│  │     │  ├─ trend.worker.ts
│  │     ├─ composer/
│  │     │  ├─ llm-composer.service.ts
│  │     │  ├─ platform-styles.ts
│  │     │  ├─ ab-variants.ts
│  │     ├─ approvals/
│  │     │  ├─ approval.controller.ts
│  │     │  ├─ approval.service.ts
│  │     ├─ insights/
│  │     │  ├─ insights.worker.ts
│  │     │  ├─ insights.service.ts
│  │     ├─ events/
│  │     │  ├─ product-published.handler.ts
│  │     ├─ social.module.ts
│  ├─ migrations/
│  │  ├─ [timestamped social migrations]
│  ├─ seeds/
│  │  ├─ cultural-events.seed.ts
│  │  ├─ trend-blocklist.seed.ts
│  ├─ ...existing PesaShop code

admin/                                          # admin.pesashop.com
├─ src/
   ├─ pages/
      ├─ social/
         ├─ accounts/
         ├─ compose/
         ├─ calendar/
         ├─ trends/
         │  ├─ live/
         │  ├─ approvals/
         │  ├─ cultural-events/
         │  ├─ insights/
         ├─ settings/


24. Migration Order and Rollback Strategy

24.1 Migration Sequence
Migrations are applied in strict order. Each must be reversible. Use the existing PesaShop migration tool (likely Knex or TypeORM — confirm in IDE).
001_create_social_schema — schema social, pgvector extension check.
002_search_query_log — only if missing per the IDE audit (Section 10.2 callout).
003_social_accounts — OAuth-connected accounts table.
004_posts — canonical post records.
005_post_targets — includes target_region column from day one.
006_post_insights — metrics snapshots.
007_social_audit_log — immutable action log.
008_product_embeddings — adds vector(1536) column to products table; backfill job.
009_trends — trends table with vector column.
010_trend_product_candidates.
011_cultural_events — includes seed of Zim calendar.
012_trend_blocklist — includes initial blocklist seed.
013_auto_post_decisions.
014_ab_variant_performance.
015_indexes — all secondary indexes (separate migration for online creation).

24.2 Backfill Operations
Product embeddings: a one-time job iterates over all existing products and computes embeddings. Estimated cost at OpenAI rates: < $1 for a catalogue of 10,000 products. Run in batches of 100 with retry logic.
Existing manual posts (if any): leave with target_region = 'global' default.
Cultural events: seed migration includes the 8 base Zimbabwe events from section 10.5.

24.3 Rollback Strategy
Each migration has an explicit down() that drops created tables / columns / indexes in reverse order.
Feature flag: SOCIAL_MODULE_ENABLED toggles all routes and workers without requiring schema rollback. Use this for fast disable in production incidents.
Kill switch (section 10.11): pauses just the auto-poster engine while leaving manual composing functional.
Never drop the audit_log table in rollback — it must persist for compliance even if the module is removed.
Tested rollback: every migration's down() must be tested on a copy of production data before deployment.


25. Platform Developer Account Setup
All four platforms require developer-side configuration before any OAuth flow will work. These are the exact pages and steps. Submit applications on day one of the build — they are the critical path.

25.1 Meta (Facebook + Instagram)
Go to developers.facebook.com and create a Business app.
App settings → Basic: note the App ID and App Secret for env vars.
Add the Facebook Login product. Set Valid OAuth Redirect URI to META_OAUTH_REDIRECT_URI.
Add the Instagram Graph API product.
App Review → Permissions and Features: request the following:
pages_show_list — enumerate Pages.
pages_read_engagement — read Page data.
pages_manage_posts — publish to Pages.
instagram_basic — read IG account info.
instagram_content_publish — publish to IG.
Provide screencasts demonstrating each permission's use in PesaShop admin.
Switch app to Live mode once approved.

25.2 X (Twitter)
Go to developer.x.com and sign in with the PesaShop business X account.
Apply for a developer account; specify e-commerce auto-posting and marketing use case.
Subscribe to the Basic tier (currently ~$200/month — confirm pricing in IDE audit, X changes pricing).
Create a Project, then an App within the project.
User authentication settings: enable OAuth 2.0; set Type to Confidential client; set Callback URI to X_OAUTH_REDIRECT_URI; required scopes tweet.read tweet.write users.read offline.access.
Note Client ID and Client Secret. Also generate API Key + API Secret (v1.1 — needed for chunked media upload).

25.3 LinkedIn
Go to linkedin.com/developers and create a new app under a Company Page.
Auth tab: set OAuth 2.0 redirect URL to LINKEDIN_OAUTH_REDIRECT_URI.
Products tab: request Marketing Developer Platform and Share on LinkedIn.
Provide use-case write-up: "PesaShop is an e-commerce platform serving Zimbabwe and its diaspora. We publish product announcements and trend-relevant content from a unified admin tool to our Company Page on LinkedIn."
Wait for approval (1–3 weeks).
Once approved, scopes w_member_social and w_organization_social become available.

25.4 TikTok
Go to developers.tiktok.com and register as a developer using the PesaShop business TikTok account.
Create an app. Submit business verification documents.
Apply for the Login Kit and Content Posting API products.
Set Redirect URL to TIKTOK_OAUTH_REDIRECT_URI.
Initial approval enables Upload to Inbox (drafts in TikTok app).
Separately apply for the Direct Post permission. This requires demonstrating production usage and may take an additional 2–6 weeks.
If TikTok Research API is desired (for Discover trends), apply separately.

25.5 Tracking Approval Status
Add a one-row internal tracking table or shared sheet:
Platform | App created | Submitted | Approved | Direct-post approved (TikTok) | Notes.
Review weekly until all five (FB, IG, X, LinkedIn, TikTok) are green.
If any rejection: document reason, address, resubmit. Don't let rejections sit.


26. Testing Strategy

26.1 Test Pyramid
Unit tests (Jest): cover scoring functions, samplers, encryption helpers, caption templating, validation. Run on every commit.
Integration tests: hit a real Postgres + Redis (Docker compose) but mock external HTTP via nock. Test full publish flow, queue handling, retry logic.
Contract tests: per-platform adapter, recorded responses (VCR-style). Re-record quarterly.
End-to-end tests (Playwright): admin login → connect a sandbox account → compose post → verify publish → verify analytics. Run before each deploy.
Manual smoke tests: at least one real post per platform to a test account after each platform adapter goes live.

26.2 Sandbox / Test Accounts Required
Meta: use Facebook test users + a test Page + a test IG Business account linked to the test Page.
X: a dedicated PesaShop staging X account on the same Basic plan, or use developer portal test accounts (limited).
LinkedIn: a personal LinkedIn test profile and a test Company Page.
TikTok: a dedicated test TikTok account (TikTok does not support sandbox accounts; use a real account in test mode).

26.3 Trend Engine Testing
Fixture-based trend ingestion: replay captured SerpAPI / X / TikTok responses to test deterministic scoring.
Sampler distribution test: run sampler 10,000 times against a fixed candidate set; assert that no single product wins more than expected probability + 3 sigma.
Brand safety: maintained list of "must-block" test inputs (politically sensitive Zim terms); assert filter blocks 100% of them in CI.
LLM caption tests: snapshot 50 generated captions against known trends; manual review on first build, automated drift detection after.
Region cool-down: golden test that a (product, FB, UK) slot does not also fire (product, FB, ZW) within 30 minutes.

26.4 Pre-Production Gate
Before flipping any platform from approval-mode to full-auto:
All unit + integration tests passing on CI.
Manual end-to-end test of full flow on that platform with a real account.
At least 4 weeks of approval-mode operation with > 90% admin approval rate.
At least one full rollback test exercised on staging.


27. Deployment and Infrastructure

27.1 Process Topology
The module adds new processes alongside the existing PesaShop API. Use PM2, systemd, or the existing process manager.
api (existing) — 2+ instances — HTTP requests, OAuth, CRUD, webhook receivers. Existing PesaShop process; add social routes.
publisher-worker — 1–2 instances — Consumes social:* queues; calls platform adapters; manages retries.
trend-worker — 1 instance — Hourly trend ingestion, scoring, matching, sampling, decision-creation.
composer-worker — 1 instance — LLM caption generation for sampled candidates; A/B variants; safety check.
insights-worker — 1 instance — Fetches platform metrics at 1h, 24h, 7d after publish.

27.2 Scaling Notes
publisher-worker scales horizontally with queue depth; BullMQ handles distribution. Each instance must have a unique worker ID.
trend-worker is a singleton (use a Redis lock to enforce). Running two would double-charge SerpAPI.
composer-worker can scale to 2–3 if approval queue grows; LLM API is the bottleneck.
insights-worker is low-volume; one instance is sufficient.

27.3 Health Checks
API: GET /api/social/health — returns DB + Redis + queue depth status.
Each worker exposes a lightweight HTTP /health endpoint on a separate port (9001+).
External uptime monitor (existing PesaShop tooling) polls these every 60 seconds.

27.4 Backup Considerations
Postgres: existing PesaShop backup covers social schema automatically.
Redis: BullMQ jobs are persisted; in disaster, the queue rebuilds from scheduled_for timestamps in Postgres on worker restart.
Encrypted tokens: backed up with the database; SOCIAL_TOKEN_KEY must be backed up separately and securely (otherwise restored tokens are unreadable).

27.5 Zero-Downtime Deploy Checklist
Run migrations first (forward-only).
Deploy API behind existing PesaShop load balancer with rolling restart.
Drain workers before stopping: signal SIGTERM, wait for active jobs to complete (up to 2 minutes), then exit.
Start new worker instances; confirm queue depth not growing.
Smoke test: publish one test post; verify in audit_log.


28. Cost Budget
Estimated monthly running costs. All figures USD, current as of spec date. Confirm at implementation time.
X API (Basic) — Basic tier — ~$200 — Required for any write access. Confirm current pricing.
SerpAPI — Production — $50–$75 — Google Trends data; hourly ingestion ~720 calls/month.
Anthropic API (Claude) — Pay-as-go — $50–$150 — Caption generation + safety filter. Cache aggressively to reduce.
OpenAI Embeddings — Pay-as-go — $5–$20 — text-embedding-3-small; only embed on product create/update. Skip if EMBEDDING_PROVIDER=local.
Meta / Instagram / LinkedIn / TikTok / Facebook APIs — Free — $0 — All four are free for posting use cases at current rates.
Redis hosting — Small — $10–$30 — If not already in PesaShop infra. Cloud providers offer free small tiers.
Cloudinary (media) — Existing — $0–$50 — Confirm existing PesaShop usage; auto-poster adds modest media traffic.
TOTAL (estimated): $315–$525 — Excluding existing PesaShop infrastructure costs.

28.1 Cost Controls
LLM_MONTHLY_BUDGET_USD env var sets a soft cap; engine pauses LLM-driven composition when exceeded, falling back to template-only captions.
LLM response cache (24h TTL keyed on trend+product+platform) reduces repeat costs.
Embedding cache: products only re-embedded on title/description/category change, never on every match.
SerpAPI hourly cron can be reduced to every 2–4 hours if cost pressure; trend velocity calculation degrades slightly but remains useful.
X usage monitor surfaces % of Basic-tier monthly post cap consumed; alert at 80%.


29. Coding Standards and Conventions

29.1 General
Follow existing PesaShop conventions where they exist; don't introduce a parallel style.
TypeScript strict mode on for the social module (even if rest of PesaShop is JS — the additional safety is worth it for OAuth and money-adjacent code).
No any types in adapter code or token-handling code. Use unknown + zod parsing at API boundaries.
All async functions return typed promises; no fire-and-forget without an explicit .catch logging.

29.2 Naming
Files: kebab-case (publisher.worker.ts).
Classes: PascalCase (FacebookAdapter).
Functions/variables: camelCase.
DB tables and columns: snake_case (post_targets.target_region).
Env vars: SCREAMING_SNAKE_CASE.
Queue names: kebab-case (social-facebook, social-trend-ingest).

29.3 Error Handling
Custom error classes per category: SocialOAuthError, SocialPublishError, SocialRateLimitError, BrandSafetyRejectedError.
Every adapter classifies errors as transient or permanent before throwing; the publisher worker uses this classification for retry decisions.
Never swallow errors silently. If catching, either re-throw, log + classify, or convert to a typed return value.
User-facing error messages never leak internal paths, tokens, or stack traces. Platform-returned error messages are surfaced verbatim only in the audit log and admin UI — not in public responses.

29.4 Logging
Use pino with the existing PesaShop logger config. Every log line includes structured fields:

logger.info({
  module: 'social',
  submodule: 'publisher',
  platform: 'facebook',
  post_target_id: 'uuid',
  account_id: 'uuid',
  attempt: 2,
  duration_ms: 450
}, 'Publish succeeded');

// NEVER log:
//   - tokens (raw or encrypted)
//   - full request/response bodies of platform APIs
//   - user PII beyond user_id
// Log payload IDs and lengths; not the payloads themselves.

29.5 Database Conventions
All queries parameterised; no string concatenation.
Every query has a transaction context or is explicitly read-only.
Soft delete only where required by audit policy; otherwise hard delete with audit_log entry.
Foreign keys with ON DELETE behaviour explicit (RESTRICT for audit references, CASCADE for ephemeral).

29.6 Commit and Branch Conventions
Branch per feature: feature/social-oauth-meta, feature/trend-engine-sampler, etc.
Commit messages follow conventional commits (feat:, fix:, chore:, docs:, refactor:).
PR template includes: summary, migration impact, env var changes, test evidence, rollback plan.
No direct pushes to main; all changes via reviewed PR.


30. Glossary
Adapter — Module that translates the unified post format into a specific platform's API calls (Facebook adapter, X adapter, etc.).
BullMQ — Redis-backed Node.js job queue used for scheduled publishing and async workers.
Container (IG) — Instagram's two-step publish: first create a media container, then publish it.
Cool-down — Time window during which the same product/category cannot be re-posted to the same (platform, region) pair.
Cosine similarity — Measure of similarity between two embedding vectors (−1 to 1; closer to 1 = more similar).
Embedding — Numerical vector representation of text used for semantic similarity (here: matching trends to products).
First-party signal — Trend data sourced from PesaShop's own logs (search queries, cart actions) rather than third-party APIs.
Graph API — Meta's HTTP API used to interact with Facebook and Instagram.
LLM — Large Language Model. Here: Claude (Anthropic) for caption generation and safety classification.
OAuth 2.0 PKCE — Authorisation Code flow with Proof Key for Code Exchange. Used by X to prevent code-interception attacks.
Page token — Long-lived (60-day) access token issued by Meta for a specific Facebook Page.
pgvector — PostgreSQL extension that stores and indexes high-dimensional vectors (used for embeddings).
Rate-limit token bucket — Algorithm that meters API calls; each call costs one token, refilled at a fixed rate.
SerpAPI — Paid API that returns structured Google search and Trends data.
Target region — The geographic audience a specific post_target is intended to reach (local_zw, diaspora_uk, etc.).
Velocity (trend) — Rate-of-change of a trend's volume over a recent window; high velocity = rising trend.
WOEID — Where On Earth ID. Yahoo geographic identifier used by X trending endpoints.
Worker — Background process that consumes queues and executes async work (publishing, ingestion, composing).


31. Document Changelog
v1.0 (26 May 2026) — Initial specification: 5-platform native social auto-poster, OAuth, composer, scheduler, product auto-post trigger.
v1.1 (26 May 2026) — Added Trend Engine (sections 9–12): multi-signal ingestion, semantic product matching, weighted sampler, per-platform format generator, brand safety filter, approval queue, cultural calendar, A/B variants.
v1.2 (26 May 2026) — Added IDE Action Required callout for search-query logging audit. Expanded diaspora targeting from SA-only to global (ZA, UK, US, CA, AU, EU, BW) with regional time zone, platform preference, and spend profile data.
v1.3 (26 May 2026) — Region-aware cool-down and saturation guard. Added target_region column to post_targets. Per (platform, region) caps with global outer envelope.
v2.0 (26 May 2026) — Added sections 20–30: environment variables, setup/installation, repository structure, migration order and rollback, platform developer account setup, testing strategy, deployment and infrastructure, cost budget, coding standards, glossary, changelog. Spec now build-ready with no implicit requirements.
v2.1 (26 May 2026) — Added explicit Existing System Context (Section 1.3): assumptions about live PesaShop state, what this spec adds, what it does NOT touch, and an IDE Orientation Checklist. Added new Section 7: Visual Post Designer (Konva canvas, layers, templates, bulk variant generation, export). Added Section 9.5: Product Post Content Configuration Profiles with 17 configurable fields, 5 starter profiles, per-platform overrides, and preview-before-save. All downstream sections renumbered.

Specification complete.
Ready for handoff to Windsurf / VS Code + Claude for implementation.
