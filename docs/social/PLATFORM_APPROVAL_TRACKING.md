# Platform Developer Account Approval Tracking

Per Spec Section 25.5: "Add a one-row internal tracking table... Review weekly until all five (FB, IG, X, LinkedIn, TikTok) are green. If any rejection: document reason, address, resubmit. Don't let rejections sit."

This is the critical path for the whole module — none of the OAuth/publish code needs anything further from Claude; it's all built and waiting. Nothing below is a coding task.

## Status

| Platform | App created | Submitted | Approved | Direct-post approved (TikTok only) | Notes |
|---|---|---|---|---|---|
| Meta (Facebook) | ☐ | ☐ | ☐ | — | Typical review: 2–7 business days (Spec 3.1). Redirect URI env var: `META_OAUTH_REDIRECT_URI`. |
| Instagram | ☐ | ☐ | ☐ | — | Same Meta Business app as Facebook — one app, two products (Spec 25.1). |
| X (Twitter) | ☐ | ☐ | ☐ | — | Requires a paid Basic tier subscription (~$200/mo, confirm current pricing) before write access works at all. Redirect URI: `X_OAUTH_REDIRECT_URI`. |
| LinkedIn | ☐ | ☐ | ☐ | — | Typical review: 1–3 weeks (Spec 3.1) — the slowest of the four non-TikTok platforms. Redirect URI: `LINKEDIN_OAUTH_REDIRECT_URI`. |
| TikTok | ☐ | ☐ | ☐ | ☐ | Two separate approvals: Login Kit + Content Posting API first (enables Upload-to-Inbox), then Direct Post separately (up to 6 weeks additional, Spec 3.1). Redirect URI: `TIKTOK_OAUTH_REDIRECT_URI`. |

**Update this table yourself as you submit and hear back** — Claude has no way to check submission status on any of these developer portals. When a row changes, update it here so the next session (Claude or otherwise) has accurate context without re-asking.

## Exact steps per platform (Spec Section 25)

### Meta (Facebook + Instagram) — Spec 25.1
1. developers.facebook.com → create a Business app.
2. App settings → Basic: note the App ID and App Secret.
3. Add the Facebook Login product. Set Valid OAuth Redirect URI to `META_OAUTH_REDIRECT_URI`.
4. Add the Instagram Graph API product.
5. App Review → request: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.
6. Provide screencasts demonstrating each permission's use in the PesaShop admin (the Accounts/Compose pages already built are what you'd record).
7. Switch the app to Live mode once approved.

### X (Twitter) — Spec 25.2
1. developer.x.com → sign in with the PesaShop business X account.
2. Apply for a developer account; state the e-commerce auto-posting/marketing use case.
3. Subscribe to the Basic tier.
4. Create a Project, then an App within it.
5. User authentication settings: OAuth 2.0, Confidential client, Callback URI = `X_OAUTH_REDIRECT_URI`, scopes `tweet.read tweet.write users.read offline.access`.
6. Note the Client ID/Secret, and separately generate a v1.1 API Key/Secret (needed for chunked media upload — already implemented in `autoposterOAuthX.js`).

### LinkedIn — Spec 25.3
1. linkedin.com/developers → new app under a Company Page.
2. Auth tab: redirect URL = `LINKEDIN_OAUTH_REDIRECT_URI`.
3. Products tab: request Marketing Developer Platform + Share on LinkedIn.
4. Use-case write-up (copy-paste ready): *"PesaShop is an e-commerce platform serving Zimbabwe and its diaspora. We publish product announcements and trend-relevant content from a unified admin tool to our Company Page on LinkedIn."*
5. Once approved: `w_member_social` and `w_organization_social` scopes become available.

### TikTok — Spec 25.4
1. developers.tiktok.com → register using the PesaShop business TikTok account.
2. Create an app, submit business verification documents.
3. Apply for Login Kit + Content Posting API. Redirect URL = `TIKTOK_OAUTH_REDIRECT_URI`.
4. Initial approval enables Upload-to-Inbox (drafts land in the TikTok app for manual posting — the fallback already built if Direct Post is denied, per Spec 18's risk table).
5. Separately apply for Direct Post — needs evidence of production usage, so this naturally comes *after* the app has been live a while on Upload-to-Inbox.

## What happens in the meantime (already true today)

- Every OAuth flow, adapter, and publish/insights code path for all five platforms is fully built and tested (Phases 2–13) — there is nothing blocking on code.
- `AUTOPOSTER_DRY_RUN=true` lets you exercise the entire pipeline (trend → match → sample → compose → approve → publish → insights) against the stub publisher without any real credentials, which is how every phase's live verification in this build has worked so far.
- Once a platform's OAuth credentials are approved and added to the environment, connecting the account via `/autoposter/accounts` in the admin panel is the only remaining step — no further development work is needed for that platform to go live.
- Per the Phase 10+ default (and Phase 14's hard graduation gate), every platform starts in approval-required mode. Nothing auto-publishes anywhere until you explicitly review and approve individual posts for at least 4 weeks with a real track record.
