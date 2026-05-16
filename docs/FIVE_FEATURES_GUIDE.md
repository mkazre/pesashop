# Five New Features — Setup & Usage Guide

Shipped 2026-05-16. Web + admin only. Mobile app integration is a follow-up.

Each feature is independent. You can roll them out one at a time. Where a feature has external dependencies (WhatsApp Cloud API, OpenAI key, HLS host), those are called out under **Setup**.

---

## 1. Returns / Refunds / Disputes (RMA)

### What it does
- Customer goes to `/account/orders`, picks an order, taps **Request Return**.
- They select items, pick a reason, attach photos (optional), and choose a refund method (PESA Coins, original payment, or store credit).
- Admin reviews in **Admin → Returns**, approves or rejects. Approval changes status to `awaiting_shipment`.
- Once items arrive, admin marks **Received** → auto-restocks selected items.
- Admin issues refund. PESA Coins are credited instantly; original-payment refunds are flagged as needing manual provider reversal.
- Customers can dispute a rejected return.

### Setup
- **No external setup needed.** Works out of the box on the next deploy.
- Default return window: 30 days from delivery. Change `REFUND_WINDOW_DAYS` in `backend/services/returnService.js` if you want a different window.

### URLs
- Admin: `/returns`
- Customer: `/account/returns`, `/account/returns/new/:orderId`
- API: `/api/returns/*`

### Day-to-day flow
1. Customer requests return → you get an email.
2. Open the return in admin, hit **Approve** (or **Reject** with reason).
3. When the parcel lands at your warehouse, click **Mark Received**.
4. Click **Refund** → choose method and amount → confirm.
5. Close the return.

---

## 2. Customer Referral Engine

### What it does
- Every customer gets a unique referral code (e.g. `MNGUF2A91C`) and a shareable link `/refer/<code>`.
- Friend visits the link → lands on a branded "you've been invited" page → the code is stored in localStorage.
- When they sign up, the existing PESA Coins **signup bonus** is awarded.
- When they place their first qualifying (`completed`) order, the referrer earns the **referral purchase bonus**.
- Tiered multipliers: 1–5 qualified referrals = 1×, 6–20 = 1.5×, 21+ = 2× (and they get a "Pesa Insider" badge).
- Admin dashboard shows funnel (sent → signed up → qualified → rewarded), top referrers, and fraud signals.

### Setup
- **Configure the bonus amounts** in **Admin → PESA Coins → Settings**:
  - "Referral Registration Bonus" (the new friend's signup boost) — Try 100 coins.
  - "Referral Purchase Bonus" (the referrer's reward) — Try 250 coins.
- These were already settings on the LoyaltySetting model; the engine now actually uses them.

### URLs
- Public landing: `/refer/:code`
- Customer dashboard: `/account/referrals`
- Admin: `/referrals`
- API: `/api/referrals/*`

### Fraud controls
- Same-email and same-IP signups are auto-flagged as fraud and excluded from rewards.
- Admin can manually flag any referral as fraud from the table (icon at the right).
- A referral's `Referral` document stores IP, user-agent, and any device fingerprint the frontend chooses to send.

---

## 3. WhatsApp Commerce Suite

### What it does
- Send order confirmations, shipping updates, delivery notifications and layby reminders via WhatsApp instead of (or alongside) email.
- Receive inbound messages into the existing Chat admin (channel = `whatsapp`).
- Configurable templates with variable substitution (`{{name}}`, `{{order_number}}`, etc).
- Auto-reply for common keywords like "support" / "help".

### Setup (one-time, required before messages will send)

1. **Create a Meta Business app** with WhatsApp product enabled.
2. **Generate a permanent System User access token** with `whatsapp_business_messaging` and `whatsapp_business_management` scopes.
3. **Find your Phone Number ID** in the Meta WhatsApp setup screen.
4. **Set Railway env vars:**
   ```
   WHATSAPP_CLOUD_API_TOKEN=<your-token>
   WHATSAPP_PHONE_NUMBER_ID=<your-phone-number-id>
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=<any-secret-string>
   ```
5. **Configure the webhook in Meta:**
   - Callback URL: `https://api.pesashop.com/api/whatsapp/webhook`
   - Verify token: same string as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to: `messages`.
6. **Submit message templates in Meta Business Manager.** Each template you submit needs a matching record in **Admin → WhatsApp Commerce → Templates**:
   - `metaTemplateName` must exactly match the approved Meta template name.
   - `bodyTemplate` is your local copy used for testing & fallback (Meta's approved body is the one actually sent).
   - Map each template to a **Trigger event** (`order_confirmed`, `order_shipped`, etc).
   - Set status to `approved` once Meta approves it.

### Templates Meta typically pre-approves
- `order_confirmed` — "Hi {{name}}, your PesaShop order {{order_number}} for R{{total}} is confirmed. Track it at pesashop.com/account."
- `order_shipped` — "Hi {{name}}, your order {{order_number}} has shipped! Tracking: {{tracking}}"
- `order_delivered` — "Hi {{name}}, your order {{order_number}} has been delivered. Enjoy!"

### URLs
- Admin: `/whatsapp`
- Webhook: `POST/GET /api/whatsapp/webhook` (Meta calls this)
- API: `/api/whatsapp/*`

### Testing
- Use the **"Send a test message"** card on the admin page to fire a free-form text to your own number (you must have a recent inbound message from that number for free-form to work outside the 24-hour window).
- The "test event" endpoint fires a templated send through your stored templates.

### Where messages auto-fire from
- `backend/routes/orders.js` — status changes (`processing`, `shipped`, `delivered`) send a templated WhatsApp message if the customer's order has a phone number.
- All sends are non-blocking; failures only log.

---

## 4. Live Shopping & Shoppable Video

### What it does
- Schedule a live stream with a curated set of products and a host name.
- During the stream, host taps a product in admin → it "pins" on the customer-facing player as a floating tap-to-cart banner.
- Customer-facing player supports HLS (.m3u8), YouTube embeds, Mux, Cloudflare Stream.
- After the stream ends, the recording (VOD URL) becomes shoppable too.

### Setup
- **You need a video transport.** Cheapest options:
  - **YouTube Live** — free; just paste the embed URL into the stream's playback URL.
  - **Cloudflare Stream** — ~$1 per 1k minutes of viewing; HLS URL.
  - **Mux** — similar pricing; HLS URL.
- No backend env vars are required to use the feature; you just paste the playback URL when creating the stream.
- If you want HLS playback in browsers that don't support it natively (Chrome on desktop), include hls.js. The customer-facing `LivePage` already falls back to the browser's native HLS support if `window.Hls` isn't loaded. Simplest approach: add this in `frontend/index.html` head:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  ```
  Safari and mobile players support HLS natively without this.

### URLs
- Admin list: `/live-streams`
- Admin control room (real-time pin during a live show): `/live-streams/:id/control`
- Customer viewer: `/live/:id`
- API: `/api/live-streams/*`

### Day-to-day flow
1. **Schedule** — Admin → Live Shopping → New stream. Pick title, date, products, playback URL.
2. **Promote** — share `/live/<id>` link, or set **Featured** to surface it on the home page (you'll need to wire the home-builder block separately if you want it auto-displayed).
3. **Go live** — When the broadcast starts, click **Start** in admin. The status becomes `live` and the stream shows on the public list.
4. **Pin products** — During the stream, open the **Control Room** for that stream. Tap any product tile to pin it for 60 seconds (configurable). Customers see the pin overlay on the video.
5. **End** — Click **End**. Optionally paste a VOD URL so the recording stays shoppable.

---

## 5. AI Visual Search + Smart Bundles

### What it does
- **Visual search:** customer uploads a photo (or types a description) on the search modal → backend describes the image with GPT-4o-mini, embeds it with `text-embedding-3-small`, and returns the 12 most similar products from your catalogue.
- **Find similar:** any product page can fetch `/api/visual-search/similar/:productId` to render a "you might also like" list.
- **Smart Bundles:** for any product, the system returns either an admin-curated bundle (created in **Admin → Bundles**) or an AI-generated "Complete the look" bundle of 3 complementary products at a default 8% off.

### Setup
- **Add an OpenAI API key** in **Admin → Settings** under the AI section (the existing `openaiApiKey` field is reused). Alternatively set `OPENAI_API_KEY` as a Railway env var.
- **Generate embeddings** for your catalogue:
  1. Go to **Admin → Bundles & Visual Search**.
  2. Click **Embed next 50 products**. Repeat until coverage reaches ~100%.
  3. ~$0.02 per 1000 products at current OpenAI pricing.
- That's it — search starts working as soon as embeddings exist.

### URLs
- Admin: `/bundles`
- API:
  - `POST /api/visual-search/by-text`
  - `POST /api/visual-search/by-image` (multipart, field name `image`)
  - `GET  /api/visual-search/similar/:productId`
  - `GET  /api/visual-search/bundles/for-product/:productId`

### Adding the search modal to the storefront
The component is built but not yet wired into the header search button. To activate it on the existing search icon, import it in `frontend/src/components/layout/Header.jsx`:
```jsx
import VisualSearchModal from '../VisualSearchModal';
// inside the component
const [visualOpen, setVisualOpen] = useState(false);
// trigger button anywhere:
<button onClick={() => setVisualOpen(true)}>Search by photo</button>
<VisualSearchModal open={visualOpen} onClose={() => setVisualOpen(false)} />
```

### Adding the bundle widget to product pages
```jsx
import SmartBundle from '../components/SmartBundle';
// inside ProductDetailPage:
<SmartBundle productId={product._id} onAddBundle={(b) => addBundleToCart(b)} />
```
Place it after the product description, before reviews.

---

## Where to look in code

### Backend
- `backend/models/Return.js`, `routes/returns.js`, `services/returnService.js`
- `backend/models/Referral.js`, `routes/referrals.js`, `services/referralService.js`
- `backend/models/WhatsAppTemplate.js`, `routes/whatsapp.js`, `services/whatsappService.js`
- `backend/models/LiveStream.js`, `routes/liveStreams.js`
- `backend/models/Bundle.js`, `routes/visualSearch.js`, `services/visualSearchService.js`
- Mounts in `backend/server.js`
- Order completion hook (referrals) and order status hook (WhatsApp) in `backend/routes/orders.js`
- Signup hook (referrals) in `backend/routes/auth.js`

### Admin Panel
- `admin-panel/src/pages/ReturnsPage.jsx`
- `admin-panel/src/pages/ReferralsPage.jsx`
- `admin-panel/src/pages/WhatsAppPage.jsx`
- `admin-panel/src/pages/LiveStreamsPage.jsx`, `LiveStreamControlPage.jsx`
- `admin-panel/src/pages/BundlesPage.jsx`
- Sidebar entries added under **Growth & Engagement** group

### Customer Frontend
- `frontend/src/pages/account/ReturnsPage.jsx`, `RequestReturnPage.jsx`
- `frontend/src/pages/account/ReferralsPage.jsx`
- `frontend/src/pages/ReferLandingPage.jsx`
- `frontend/src/pages/LivePage.jsx`
- `frontend/src/components/VisualSearchModal.jsx`, `SmartBundle.jsx`

---

## Verification checklist (in the morning)

1. **Returns** — Place a test order, mark it `delivered` in admin, then from the customer side open `/account/returns/new/<orderId>` and submit a return. Confirm the RMA appears in `/returns`, approve it, mark received, issue a refund. Verify PESA Coins balance increased.
2. **Referrals** — Open `/account/referrals` as any customer, copy the link, sign up as a new user with `?ref=CODE` (or paste code into signup form), make sure the new user's `referredBy` field is populated, then `completed` their first order and confirm the referrer got the bonus PESA Coins.
3. **WhatsApp** — Once env vars are set, send a test message from `/whatsapp` admin to your phone.
4. **Live Shopping** — Create a stream with a YouTube Live URL, click Start, then Pin a product from the control room, and check the floating banner appears at `/live/<id>`.
5. **Visual Search** — Add OpenAI key in Settings, hit "Embed next 50" in `/bundles` admin, then `curl -X POST $API/api/visual-search/by-text -d '{"query":"black leather wallet"}' -H 'Content-Type: application/json'` and check matches.

## What still needs follow-up

- **Mobile app screens** — none of these features have been added to the Expo mobile app yet. The auto-memory has a project note tracking this.
- **Order completion phone capture** — the WhatsApp hook reads `order.shippingAddress.phone`. If you don't currently capture phone at checkout, messages won't fire.
- **Header search wiring** — the `VisualSearchModal` is built but not yet bound to the magnifying-glass icon in the storefront header. One-line addition (see above).
- **Product page bundle wiring** — the `SmartBundle` component is built but not yet inserted into `ProductDetailPage`. One-line addition (see above).
- **HLS.js script tag** — only needed if you stream non-Safari customers via a raw `.m3u8` URL. YouTube embeds and Mux/Cloudflare iframes don't need it.
