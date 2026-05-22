# PesaShop — Developer Handoff & Session History

> Last updated: 2026-05-22. This file is the portable "context brief" for continuing
> development on a new machine. Read this first when picking up the project on a fresh
> Claude Code install. It captures project state, conventions, and the recent work
> history that would otherwise live only in chat transcripts.

---

## 1. Project overview

Multi-platform e-commerce store serving the South Africa / Zimbabwe market.

| Area | Stack | Folder |
|---|---|---|
| Customer storefront | React + Vite | `frontend/` |
| Admin panel | React + Vite | `admin-panel/` |
| Backend API | Node.js / Express + MongoDB (Mongoose) | `backend/` |
| Mobile app | React Native + Expo | `mobile/` |
| In-store kiosk | React (part of frontend) | `frontend/src/pages/kiosk/` |

**Live URLs**
- Storefront: https://pesashop.com
- API: https://api.pesashop.com
- Both deploy on **Railway**, auto-deploying from `origin/main` (1–3 min per deploy).

**Mobile deploy:** Expo OTA from `mobile/`:
`EAS_SKIP_AUTO_FINGERPRINT=1 eas update --branch preview --message "…"`

---

## 2. Hard-won conventions (do not relearn these)

- **Always commit + push after a change.** The live site only updates when `origin/main` is pushed. Push proactively, don't leave changes local.
- **Product price field is `regularPrice`, NOT `price`.** Sale price is `salePrice`. Using `price` returns `undefined` → `NaN` in the UI. This bit us in the visual-search work.
- **Use `formatPrice()` from `useCurrencyStore`** for any customer-facing price so it converts to the selected currency. Never hardcode `R {amount}`.
- **Image URLs**: backend stores relative paths like `/uploads/...`. Frontend prefixes with `import.meta.env.VITE_API_URL`. In the admin panel, default that to `http://localhost:5000` (NOT `''`) or images break in dev.
- **No test framework** in the backend — validate with `node --check <file>` and by building the frontends (`npm run build`).
- **Never run local Android builds on `/Volumes/MKDrive`** (exFAT spawns `._` AppleDouble files that break Gradle). rsync to `~/pesa-build/` first. (Mac-only gotcha — irrelevant on Windows, see §6.)
- **Railway uploads are ephemeral**: files written to `backend/uploads/*` reset on each redeploy. Products use Cloudinary; returns/invoices/shipping photos currently use local disk. Migrate to Cloudinary if persistence matters.

---

## 3. Current feature set

Built earlier (stable): Loyalty/PESA Coins, Recurring Orders, Layby, Reviews, Coupons,
Gift Cards, B2B/Wholesale pricing, Service Provider marketplace + ads, Multi-currency,
Home/Page/Menu/Footer builders, Demographics + AI profiling, Offers, Kiosk, Mobile app,
Chat, Notifications, Shipping with POD.

### Recent batch (2026-05, this handoff's work) — 5 new features + fixes

All web + admin only. **Mobile integration is the outstanding follow-up.**

1. **Returns / RMA** — `backend/models/Return.js`, `routes/returns.js`, `services/returnService.js`.
   Customer return flow at `/account/returns/new/:orderId` with **mandatory invoice upload**
   (proof of purchase) + optional photos (compressed via sharp). Admin review at `/returns`
   shows invoice + photos. Refund via PESA Coins / original payment / store credit.
2. **Customer Referrals** — `models/Referral.js`, `routes/referrals.js`, `services/referralService.js`.
   `/refer/:code` landing, `/account/referrals` dashboard, admin funnel at `/referrals`.
   Reuses existing LoyaltySetting referral bonus fields. Tiered multipliers (1×/1.5×/2×).
   Hooked into `auth.js` signup + `orders.js` completion.
3. **WhatsApp Commerce** — `models/WhatsAppTemplate.js`, `routes/whatsapp.js`, `services/whatsappService.js`.
   Meta Cloud API. Admin at `/whatsapp` with hello_world + free-form test buttons.
   `sendByEvent` sends real approved templates (positional `{{1}}` params mapped from
   the template's `variableNames`). Order status changes fire WhatsApp messages.
   **Setup status: connected to Meta test number; production number + template approval pending.**
   Env vars: `WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. **Live Shopping** — `models/LiveStream.js`, `routes/liveStreams.js`. Admin scheduling +
   real-time pin control room (`/live-streams/:id/control`), customer viewer `/live/:id`
   (HLS / YouTube / Mux / Cloudflare). Pin a product → floating tap-to-cart on the player.
5. **AI Visual Search + Smart Bundles** — `services/visualSearchService.js`, `routes/visualSearch.js`,
   `models/Bundle.js`. OpenAI `text-embedding-3-small`. Camera icon in storefront search bar opens
   `VisualSearchModal`. **Auto-embed cron** (`cron/visualSearchCron.js`) embeds 50 products/min
   until the catalogue is covered (~5h for 15k), and re-embeds on product edit. Min similarity
   threshold 0.30 (`VISUAL_SEARCH_MIN_SIMILARITY`) filters noise matches.

### Customer account menu (`frontend/src/pages/AccountPage.jsx`)
Includes new links: Returns, Invoices, Invite & Earn (referrals).

### Invoices module — `backend/routes/invoices.js`, `services/pdfService.generateInvoicePDF`
Invoice number = order number with `ORD-` → `INV-`. Customer `/account/invoices` + View/Download
buttons on order detail. Admin "View Invoice" on order detail. Logo resolves like the waybill PDF.

### Shipping photos
Admin `WaybillDetailPage` renders pre-shipment photo thumbnails. Customer order detail shows them
via `GET /api/shipping/order/:orderId/photos` (owner-checked).

---

## 4. Outstanding / next steps

- **Mobile app** has none of the 2026-05 features yet. Mirror each web page into
  `mobile/app/...` using the existing `mobile/src/services/api.ts` client. Visual search:
  use `expo-image-picker` against `POST /api/visual-search/by-image`.
- **WhatsApp production**: move off Meta test number (needs business verification, 1–3 days),
  get templates `pesa_order_confirmed/shipped/delivered` approved, map them in admin with
  `variableNames`: `name,order_number,total` / `name,order_number,tracking` / `name,order_number`.
- **Visual search embeddings**: needs `openaiApiKey` in admin Settings (or `OPENAI_API_KEY` env).
  Cron backfills automatically once the key is set.
- **Wire `<SmartBundle>` into `ProductDetailPage`** if you want bundles on product pages
  (component exists, not yet placed).

---

## 5. Key commit history (this batch)

Recent relevant commits on `main` (newest first):
- `f60b23dc` visual-search: use regularPrice (fix NaN prices)
- `f2d4493d` visual-search: format prices with selected currency
- `ce5ba08b` visual-search: auto-embed cron, similarity threshold, green theme
- `90bee8a7` visual-search: camera button wired into storefront search bars
- `3799a263` whatsapp: Variable names field in template editor
- `69ac857c` whatsapp: sendByEvent uses real template sends
- `384f3c9d` whatsapp: hello_world template test button
- `2341622d` returns photo+invoice uploads, invoices module, shipping photos display
- `018502dc` the original 5-feature batch
- `a5abffdb` fix: profile completion bonus PESA Coins not awarded

Run `git log --oneline -30` for the full list.

---

## 6. (Migration instructions live in the chat, not here — see the message that created this file.)
