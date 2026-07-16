# Social Auto-Poster — User Manual

Everything below describes what's actually built and running in this codebase (all 15 phases complete). Where a feature depends on something you haven't done yet (submitting a platform app, letting real time pass), that's called out explicitly rather than glossed over.

**Where to find it**: Admin panel sidebar → **Marketing** section → the "Auto-Poster: ..." entries. The main hub is **Auto-Poster: Trend Dashboard**.

---

## 1. What this module does, in one paragraph

The Auto-Poster watches what's trending (Google Trends via SerpAPI, X, TikTok, and your own site's search/order data), matches trends to real products in your catalogue using AI embeddings, writes platform-specific captions with Claude, runs every caption through three layers of brand-safety checking, and — by default — puts every single post in front of you for approval before anything goes out to Facebook, Instagram, X, LinkedIn, or TikTok. You can also compose and publish posts manually at any time, independent of the trend engine.

**Nothing posts automatically today.** Every platform starts in approval-required mode, and a hard server-side rule (see §12, Graduation Criteria) prevents switching any platform to full-auto until it has a real four-week track record. This is deliberate, not a limitation to work around.

---

## 2. Before anything can post for real: platform accounts

None of the five platforms will accept a real post until you've registered a developer app with that platform and connected it. See `docs/social/PLATFORM_APPROVAL_TRACKING.md` for the exact steps and a tracking checklist. Short version per platform:

| Platform | What you need | Typical wait |
|---|---|---|
| Facebook + Instagram | One Meta Business app (covers both) | 2–7 business days |
| X (Twitter) | A paid Basic-tier developer account (~$200/mo) | Same day–few days |
| LinkedIn | A Company Page + app | 1–3 weeks |
| TikTok | Business verification + Content Posting API, then a *separate* Direct Post approval | Weeks, then more weeks |

Once approved, you set the app credentials as environment variables (below) and connect the account from **Auto-Poster: Accounts** — click "Connect Facebook" (etc.), you'll be sent through that platform's real login/consent screen, and it comes back connected.

**Until you do this**, the whole engine still works end-to-end — trends get found, products get matched, captions get written, you can approve things — they just won't actually publish anywhere (nothing to publish *to* yet). You can test the full pipeline safely with `AUTOPOSTER_DRY_RUN=true` (see §3), which fakes a successful publish so you can see the whole flow work without touching a real account.

---

## 3. Environment variables — what each one does

Set these in your backend `.env` (never commit real values — see the standing security rule that `.env` is never staged to git).

### Required for any real platform connection
| Variable | What it's for |
|---|---|
| `META_APP_ID`, `META_APP_SECRET`, `META_OAUTH_REDIRECT_URI` | Facebook + Instagram (one Meta app covers both) |
| `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_OAUTH_REDIRECT_URI` | X (Twitter) |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_OAUTH_REDIRECT_URI` | LinkedIn |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_OAUTH_REDIRECT_URI` | TikTok |
| `SOCIAL_TOKEN_KEY` | 64-character hex string (generate with `openssl rand -hex 32`). Encrypts every stored access/refresh token at rest. **Back this up separately and securely** — if you lose it, every connected account's stored token becomes unreadable and every account needs reconnecting. |

### Trend engine data sources (all optional — each degrades gracefully if unset)
| Variable | What it's for | If unset |
|---|---|---|
| `SERPAPI_KEY` | Google Trends data (the primary, highest-confidence trend source) | Ingestion silently skips this source; falls back to a free unofficial scraper + your own site's search/order data |
| `ANTHROPIC_API_KEY` | Powers caption generation, the caption safety check, and the trend-term safety classifier (all use Claude Haiku) | Captions fall back to a plain templated sentence; safety checks fall back to "static blocklist only" |
| `OPENAI_API_KEY` | Powers the semantic trend↔product matching (text embeddings) — same key your existing Visual Search feature uses | Matching can't run at all — no candidates get generated |

### Cost controls (§10)
| Variable | What it's for |
|---|---|
| `LLM_MONTHLY_BUDGET_USD` | Soft monthly cap on Claude spend. Unset = no cap. Once exceeded, captions/safety-checks fall back to their template/static-only paths for the rest of the month. |
| `X_MONTHLY_POST_CAP` | X's Basic-tier monthly post limit, for the usage monitor. Defaults to 3000 if unset — check your actual plan and set this to match. |

### Alerts (§10)
| Variable | What it's for |
|---|---|
| `SLACK_WEBHOOK_URL` | If set, alerts post to this Slack incoming webhook. If unset, alerts still fire and log to the audit trail — you just won't get a Slack message. |
| (Admin email) | Alerts also try to email your store's admin address (Settings → store email) — no separate env var needed. |

### Operational
| Variable | What it's for |
|---|---|
| `SOCIAL_MODULE_ENABLED` | Set to `false` to instantly disable the entire module (all routes return 503, no crons run) without touching any data. Your emergency "make it stop" switch — see §13. |
| `AUTOPOSTER_DRY_RUN` | Set to `true` to make the publisher use a fake stub instead of calling real platforms — everything else (trend matching, captions, approval) is 100% real. The safe way to test the full pipeline. |
| `LOG_LEVEL` | Controls pino log verbosity for this module (`info` by default). |

---

## 4. Connected Accounts page

**Route**: `/autoposter/accounts`

Shows one card per platform (Facebook, Instagram, X, LinkedIn, TikTok). Each connected account shows its status:

- **active** — working normally.
- **needs_reauth** — the platform revoked or expired the token and it couldn't auto-refresh. Any posts scheduled to this account are paused (not failed, not lost) until you reconnect. Reconnecting is the same "Connect" button flow as the first time.
- **expired** — token has a known future problem, refresh will be attempted automatically overnight (daily at 3am).
- **revoked** — you (or the platform) disconnected it.

**Refresh** button forces an immediate token refresh attempt instead of waiting for the nightly job. **Disconnect** revokes and removes the account — anything scheduled to it gets paused.

---

## 5. Live Trends Panel

**Route**: `/autoposter/trend-dashboard` → **Live Trends** tab

A table of every trend the engine currently knows about, refreshed hourly automatically (or on demand).

**Columns and what they mean**:
- **Term** — the trending phrase itself.
- **Sources** — which of `firstparty_order_velocity`, `firstparty_search`, `serpapi`, `google_trends_scraper`, `x`, `tiktok` reported it. More sources = more confidence.
- **Score** — the composite 0–1 trend score: 30% volume, 40% velocity (how fast it's rising — weighted highest deliberately), 15% source confidence, 10% cultural-event boost, 5% cross-source validation.
- **Velocity (sparkline)** — a real mini line chart of this trend's score over its last 14 ingestion runs. Shows "not enough history yet" for a brand-new trend — this is never faked.
- **Audience** — local Zimbabwe, diaspora, or global.
- **Sensitivity** — `safe`, `review`, or `blocked`. A blocked trend never gets matched to products at all.
- **Last refreshed** — when the hourly job last touched this trend.

**Row actions**:
- **View matched products** (eye icon) — shows which real products in your catalogue this trend matched to, and how strong each match is.
- **Pin** (tag icon) — forces this trend's effective score to maximum for the next 24 hours, so it dominates the next sampling run. Use this to deliberately push a promotion or a trend you know is good, overriding the algorithm temporarily.
- **Block** (ban icon) — immediately flags the trend as unsafe and optionally adds it to the permanent blocklist so it's rejected automatically in future.

**Force-refresh** button — runs a full ingestion cycle right now instead of waiting for the hourly cron.

---

## 6. Approval Queue

**Route**: `/autoposter/approval-queue`, or the **Approval Queue** tab on the main dashboard

This is where you review AI-generated posts before they go live. Every card shows the product, the trend that triggered it, the platform, and the generated caption (with a second variant to pick from if one was generated).

**Actions per card**:
- **Swipe right / Approve** — creates the real scheduled post; it publishes on the normal schedule.
- **Swipe left / Reject** — discards it. You can optionally check "ban this trend" to blocklist the term that produced it.
- **Snooze** (clock icon) — hides it for 1 hour, then it reappears. Useful when you're unsure and want to think about it.
- **Edit caption** — you can rewrite the caption before approving; your edit still goes through the safety check.

**Bulk actions** (above the card list): "Approve all pending" per platform, and "Reject all" per trend — for when a trend produced several near-identical candidates and you want to decide once, not one card at a time.

**Kill switch**: see §8 — it's in the dashboard header, always visible, not just on this page.

New candidates arrive here automatically every 15 minutes (the composer worker generates captions for whatever the trend engine selected).

---

## 7. Manual composer, caption templates, profiles, and the Visual Designer

You don't have to wait for the trend engine — you can compose and publish a post to any connected platform right now.

- **Compose** (`/autoposter/compose`) — pick a product, write or generate a caption, pick a design/image, choose platforms, schedule or publish immediately.
- **Caption Templates** (`/autoposter/caption-templates`) — reusable caption patterns with placeholders (product name, price, discount, etc.) you can apply instead of writing from scratch each time.
- **Post Profiles** (`/autoposter/profiles`) — a saved bundle of "what to include" toggles per post (images, price, stock status, delivery info, rating, SKU, CTA phrase, brand watermark, and more), with per-platform overrides. Set one up once, reuse it on every manual post.
- **Visual Designer** (`/autoposter/designer`, saved designs at `/autoposter/designs`) — a drag-and-drop canvas (Konva-based) for building the actual image graphic that goes with a post — product photo, price badge, text overlay, brand colours — exported and uploaded automatically when you publish.

---

## 8. Kill Switch

**Where**: top of the Trend Dashboard, visible on every tab — this is deliberate (Spec explicitly requires it to be prominent, not buried in a settings menu).

**What it does when engaged**: pauses publishing of trend-driven posts only. It does **not** touch:
- Manually composed posts (from §7) — those still publish on schedule.
- Product auto-posts you set up directly on a product.
- Any admin function — approving/rejecting, viewing trends, editing config, everything else keeps working.

**When to use it**: something in the trend engine's output looks wrong, a trend feels politically sensitive despite passing the automated checks, or you just want a pause button while you investigate something — without losing manually scheduled content.

**How it differs from `SOCIAL_MODULE_ENABLED=false`** (§13): the kill switch is a soft, in-app pause for the trend engine specifically. The env var is a hard, total shutdown of the entire module (every route, every cron) — the one you'd use in a genuine incident, not day-to-day.

---

## 9. Cultural Calendar

**Route**: Trend Dashboard → **Cultural Calendar** tab

Zimbabwe-specific recurring demand events (paydays, holidays, diaspora return seasons) that temporarily boost matched products' scores. Each event has:

- **Boost** (1.0–2.0) — how much to multiply the effective trend score by while active. 1.0 = no boost.
- **Lead-time (days)** — the boost doesn't just switch on/off on the day; it ramps up linearly starting this many days before, reaching full strength exactly on the day. Set to 0 for "only on the exact day."
- **Recurrence** — annual (same date every year), monthly (e.g. month-end payday window), or a **one-off event** (a specific single date — for things like an unscheduled national football match or a one-time viral moment).

**Add one-off event** button — for exactly those unscheduled moments; give it a name, a single date, a boost, and optionally a lead-time ramp.

---

## 10. Performance Insights, Observability & Cost tabs

### Performance Insights tab
- **Decisions by status**, **top rejected trends**, **variant style performance** — all real, derived from your actual approval history and (once posts have real engagement data) which caption opening style (question/price-led/story) performs best per platform+category.
- **Attributed orders by campaign** — every trend-driven post's link is tagged with UTM parameters; if a customer clicks through and completes a real order, it shows up here with real order count and revenue. Requires zero setup — it's automatic.
- Honest empty states: anything needing real published-post engagement data (which needs a real connected account and real time to pass) shows "no data yet," never a fabricated number.

### Observability & Cost tab
- **Publishing (24h)**: published/failed counts, success:failure ratio, average time from scheduled to actually published, current queue depth, token-refresh failures.
- **Trend engine**: candidates in the most recent sampling run, brand-safety rejections, average caption-generation latency, embedding spend.
- **Cost budget**: real spend this month (computed from actual token usage at Claude Haiku's and OpenAI's real published rates — not an estimate) against your `LLM_MONTHLY_BUDGET_USD` if you've set one.
- **X usage monitor**: real posts this month vs your `X_MONTHLY_POST_CAP`.
- **Next 10 scheduled posts**.

### Alerts (run automatically every 15 minutes, no UI toggle needed)
Fires (to Slack if configured, email always attempted, and always logged) when:
1. More than 5 publish failures on one platform in an hour.
2. Any account moves to `needs_reauth`.
3. X usage crosses 80% of the monthly cap.
4. The approval queue exceeds 50 pending items.
5. The primary trend source (SerpAPI) genuinely fails a real attempt (not just "key not configured").

Each condition only fires once per 15-minute window even if it stays true, so you're not spammed by the same ongoing issue.

---

## 11. Configuration tab — every setting explained

**Per-platform**: 
- **Enabled** — master on/off switch for that platform. Disabled = its posts stay queued, nothing publishes there.
- **Auto-publish** — off by default and *cannot* be turned on until the platform meets all three graduation criteria (§12, hard server-side rule, not just a checkbox).
- **Hourly cap** — an optional extra publish-rate limit on top of the built-in per-platform rate limits.

**Sampler weight tuning** *(advanced)* — the five factors that make up a trend's composite score (volume/velocity/source-confidence/cultural-boost/cross-source-validation). Should sum to roughly 1.0. Only touch this if you understand the trade-off you're making — e.g. raising "velocity" further favors fast-rising trends over high-volume steady ones.

**Cool-down windows**:
- Max posts per product per region per 7 days, and globally per 7 days — hard caps preventing the same product being pushed too often.
- Minimum spacing between posts (same region, and same platform any region) — prevents feed-flooding.
- Max category share (%) — no single category can dominate a platform's feed within a week.

**Category graduation** — per category, whether it's included in trend matching at all. Un-graduating a category is a manual quality gate — e.g. if a category's matches have been consistently poor, exclude it until you're confident.

**Blocklist editor** — exact terms, regex patterns, or category-level blocks. This is brand-safety layer 1 of 3 (checked before the AI ever sees the term).

---

## 12. Graduation Criteria — how a platform gets to full-auto

**This is a hard rule, enforced by the server, not a suggestion.** A platform's "Auto-publish" checkbox physically cannot be saved as ON until all three of these are genuinely true, computed from real data:

1. **Clean run**: at least 4 consecutive weeks with no ">5 failures/hour" alert firing for that platform.
2. **Approval rate**: over 90% of your own approve/reject decisions for that platform (over the last 4 weeks) were approvals.
3. **Engagement coverage**: over 80% of that platform's published posts got at least some real engagement (likes/comments/shares/clicks).

The **Graduation Status** card in the Configuration tab shows the real, current numbers for every platform — including "no data yet" where that's honestly the case (which, until you've connected real accounts and run for real weeks, is every platform right now). If you try to save `autoPublish: true` before all three pass, you get a clear rejection message explaining exactly which criterion is missing and by how much.

---

## 13. Emergency controls — what to flip when something's wrong

| Situation | What to do |
|---|---|
| One trend/post looks wrong, need to pause trend-driven posting only | Kill switch (§8) — one click, dashboard header |
| A whole platform is misbehaving | Configuration tab → uncheck "Enabled" for that platform |
| Something is seriously wrong and you need the entire module off, instantly, everywhere | Set `SOCIAL_MODULE_ENABLED=false` and restart the backend. All autoposter routes return a clean 503; no crons run; zero data is touched. Flip it back to remove and restart to re-enable. |
| Checking if it's actually healthy right now | `GET /api/autoposter/health` (admin-authenticated) — real DB connection state, queue depth, kill switch state, which background jobs are currently mid-run |

Deploys/restarts are safe: the server waits (up to 2 minutes) for any in-progress background job to finish before shutting down, so a deploy never cuts off a job mid-publish.

---

## Tips and tricks

- **Test everything safely first**: set `AUTOPOSTER_DRY_RUN=true` before connecting any real account. You'll see the entire pipeline work — trends found, products matched, captions written, approval queue populated, "publishing" succeeding — without a single real post going anywhere.
- **Pin, don't fight the algorithm**: if you know a particular trend is worth pushing harder than its computed score suggests, use Pin (§5) for a temporary 24h boost rather than manually editing scores.
- **Snooze liberally**: if you're not sure about a candidate, snooze it — an hour later you'll often have a clearer read, and nothing is lost by waiting.
- **Watch the Observability tab weekly**: it's the fastest way to notice a platform quietly degrading (rising failure rate, falling engagement) before it becomes an alert.
- **Don't rush graduation**: the four-week/90%/80% bar exists because a bad auto-published post is far more visible and costly than a slightly slower manual-approval workflow. Let the real data accumulate.
- **Set `LLM_MONTHLY_BUDGET_USD` once you have real usage data**: watch the Cost tab for a month first to see your actual baseline spend, then set a budget with headroom above it — rather than guessing a number up front.
- **The blocklist is your fastest safety lever**: if a term should never be posted about again, block it directly from the Live Trends row action rather than waiting to reject each individual post it produces.
