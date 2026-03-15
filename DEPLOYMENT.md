# PesaShop — Full Production Deployment Guide

## Architecture

| Component | Host | Domain |
|---|---|---|
| **Frontend** (React/Vite) | Netlify | `pesashop.com` |
| **Admin Panel** (React/Vite) | Netlify | `admin.pesashop.com` |
| **Backend API** (Express) | Railway | `api.pesashop.com` |
| **Database** (MongoDB) | MongoDB Atlas | (internal connection string) |
| **Mobile App** (Expo) | EAS Build → App Store / Play Store | N/A |

---

## PHASE 1: Git Repository Setup

### 1.1 Initialize & Push to GitHub

```bash
cd "/Volumes/MKDrive/Websites/Pesa/React App/ecommerce-platform-complete/PesaWindsurf"

# Initialize if not already done
git init
git add .
git commit -m "Initial commit: PesaShop e-commerce platform"

# Create a PRIVATE repo on GitHub called "pesashop", then:
git remote add origin https://github.com/YOUR_USERNAME/pesashop.git
git branch -M main
git push -u origin main
```

### 1.2 Create Development Branch

```bash
git checkout -b develop
git push -u origin develop
```

From now on, work on `develop` and only merge to `main` when you want to deploy.

---

## PHASE 2: MongoDB Atlas (Cloud Database)

### 2.1 Create Atlas Account & Cluster

1. Go to https://mongodb.com/atlas and sign up (or log in)
2. **Create a Free Cluster** (M0 Sandbox — 512MB, free forever)
   - Provider: AWS
   - Region: Choose closest to South Africa (eu-west-1 Ireland, or af-south-1 if available)
3. Wait for cluster to provision (~2 min)

### 2.2 Configure Database Access

1. In Atlas sidebar → **Database Access** → **Add New Database User**
   - Username: `pesashop_prod`
   - Password: Generate a strong password (SAVE THIS)
   - Privileges: "Read and write to any database"
2. **Network Access** → **Add IP Address**
   - For initial setup: "Allow Access from Anywhere" (0.0.0.0/0)
   - Later: restrict to Railway's IP range for security

### 2.3 Get Connection String

1. Go to **Database** → **Connect** → **Drivers**
2. Copy the connection string, it looks like:
   ```
   mongodb+srv://pesashop_prod:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual password
4. Add database name: `pesashop` before the `?`:
   ```
   mongodb+srv://pesashop_prod:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pesashop?retryWrites=true&w=majority
   ```

### 2.4 Migrate Local Data to Atlas

```bash
# Export your local database
mongodump --db ecommerce_platform --out ./db-backup

# Import to Atlas
mongorestore --uri "mongodb+srv://pesashop_prod:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net" \
  --db pesashop ./db-backup/ecommerce_platform
```

---

## PHASE 3: Backend → Railway

### 3.1 Create Railway Account

1. Go to https://railway.app and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select your `pesashop` repository
4. Railway will detect the monorepo — set **Root Directory** to `backend`

### 3.2 Set Environment Variables

In Railway dashboard → your service → **Variables**, add ALL of these:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://pesashop_prod:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pesashop?retryWrites=true&w=majority
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRE=7d
ADMIN_URL=https://admin.pesashop.com
FRONTEND_URL=https://pesashop.com
BASE_CURRENCY=ZAR
CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest/ZAR
CURRENCY_UPDATE_INTERVAL=6
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
IMAGE_QUALITY=90
IMAGE_MAX_WIDTH=2000
IMAGE_MAX_HEIGHT=2000
WATERMARK_OPACITY=0.7
```

Also add your SMTP / payment keys if you have them:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@pesashop.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3.3 Deploy

Railway auto-deploys from `main` branch. It will:
1. Install dependencies (`npm install` in `/backend`)
2. Run `npm start` (which runs `node server.js`)
3. Give you a URL like `https://pesashop-backend-production.up.railway.app`

### 3.4 Custom Domain for API

1. In Railway → your service → **Settings** → **Networking** → **Custom Domain**
2. Add: `api.pesashop.com`
3. Railway gives you a CNAME target (e.g., `xxx.up.railway.app`)
4. In your domain registrar's DNS settings, add:
   ```
   Type: CNAME
   Name: api
   Value: xxx.up.railway.app
   ```
5. Wait for DNS propagation (~5-30 min)
6. Test: `curl https://api.pesashop.com/health`

### 3.5 Important: File Uploads

Railway's filesystem is **ephemeral** — uploaded files are lost on redeploy. For product images, you have two options:

**Option A (recommended): Use Cloudinary or AWS S3**
- Sign up for Cloudinary (free tier: 25GB)
- Update image upload routes to use cloud storage

**Option B (quick): Use Railway Volume**
- In Railway → service → **Volumes** → Add volume
- Mount path: `/app/uploads`
- This persists files across deploys (Railway paid plan required)

---

## PHASE 4: Frontend → Netlify

### 4.1 Create Netlify Account & Site

1. Go to https://netlify.com and sign up with GitHub
2. Click **"Add new site"** → **"Import an existing project"** → **GitHub**
3. Select your `pesashop` repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **Deploy site**

### 4.2 Set Environment Variable

In Netlify → Site settings → **Environment variables**, add:
```
VITE_API_URL = https://api.pesashop.com
```

> **Note**: The `netlify.toml` file in `frontend/` already has this, but setting it in the dashboard takes priority and is easier to change.

### 4.3 Custom Domain

1. In Netlify → **Domain management** → **Add custom domain**
2. Add: `pesashop.com`
3. Netlify will ask you to update your DNS. You have two options:

**Option A: Use Netlify DNS (recommended)**
- Point your domain's nameservers to Netlify's nameservers
- Netlify handles SSL automatically

**Option B: External DNS**
- Add these DNS records at your registrar:
  ```
  Type: A
  Name: @
  Value: 75.2.60.5  (Netlify load balancer)

  Type: CNAME
  Name: www
  Value: your-site-name.netlify.app
  ```

4. Enable HTTPS: Netlify auto-provisions a Let's Encrypt certificate

### 4.4 Trigger Redeploy

After setting the env var, trigger a redeploy:
- Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## PHASE 5: Admin Panel → Netlify (Separate Site)

### 5.1 Create Second Netlify Site

1. In Netlify → **Add new site** → **Import from GitHub** → same repo
2. Build settings:
   - **Base directory**: `admin-panel`
   - **Build command**: `npm run build`
   - **Publish directory**: `admin-panel/dist`
3. Deploy

### 5.2 Set Environment Variable

```
VITE_API_URL = https://api.pesashop.com
```

### 5.3 Custom Domain

1. **Domain management** → Add: `admin.pesashop.com`
2. Add DNS record:
   ```
   Type: CNAME
   Name: admin
   Value: your-admin-site-name.netlify.app
   ```
3. HTTPS is automatic

---

## PHASE 6: DNS Summary

At your domain registrar (where pesashop.com is registered), your DNS should look like:

| Type | Name | Value | Purpose |
|---|---|---|---|
| A | @ | 75.2.60.5 | Frontend → Netlify |
| CNAME | www | your-site.netlify.app | www redirect |
| CNAME | admin | your-admin-site.netlify.app | Admin panel |
| CNAME | api | xxx.up.railway.app | Backend API |

> If using Netlify DNS, you only need the `api` and `admin` CNAMEs — Netlify handles the root domain automatically.

---

## PHASE 7: Mobile App — Android

### 7.1 Install EAS CLI

```bash
npm install -g eas-cli
eas login
# Create an Expo account if you don't have one: https://expo.dev/signup
```

### 7.2 Initialize EAS Project

```bash
cd mobile
eas init
# This creates a project on expo.dev and sets the projectId in app.json
```

The `eas.json` is already configured with 3 profiles:
- **development** — Dev client for local testing
- **preview** — APK for sideloading on your phone
- **production** — AAB for Google Play Store

### 7.3 Build Preview APK (for testing on your phone)

```bash
cd mobile
eas build --platform android --profile preview
```

- Build runs in Expo's cloud (~10-15 min)
- When done, you get a download link for the `.apk` file
- Download it on your Android phone and install (enable "Unknown sources" in settings)

### 7.4 Build Production AAB (for Google Play Store)

```bash
eas build --platform android --profile production
```

- Produces a `.aab` file ready for Play Store submission
- Upload to Google Play Console → Internal testing track

### 7.5 Google Play Setup

1. Go to https://play.google.com/console
2. Pay the one-time $25 developer registration fee
3. **Create app** → Fill in details
4. Upload the `.aab` file under **Production** → **Create new release**
5. Fill in store listing (screenshots, description, privacy policy)
6. Submit for review

---

## PHASE 8: Mobile App — iOS

### 8.1 Apple Developer Account

1. Go to https://developer.apple.com
2. Enroll in the Apple Developer Program ($99/year)
3. Wait for approval (~24-48h)

### 8.2 Build iOS IPA

```bash
cd mobile
eas build --platform ios --profile production
```

- EAS will ask you to log in with your Apple ID
- It auto-generates provisioning profiles and signing certificates
- Build takes ~15-20 min

### 8.3 Submit to App Store

```bash
eas submit --platform ios
```

Or manually:
1. Download the `.ipa` from EAS
2. Upload via **Transporter** app (macOS) or **App Store Connect** web

### 8.4 App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Fill in app details, screenshots, privacy policy
4. Select the build you uploaded
5. Submit for review (~24-48h)

---

## PHASE 9: Git Workflow (Ongoing Development)

### How to Do Local Development

Your local `.env` files keep pointing to `localhost`:
- Backend `.env`: `MONGODB_URI=mongodb://localhost:27017/ecommerce_platform`
- Frontend: Uses Vite proxy (`localhost:5000`) in dev mode
- Admin: Uses Vite proxy (`localhost:5000`) in dev mode
- Mobile: `EXPO_PUBLIC_API_URL=http://192.168.x.x:5000`

**Nothing changes locally.** Production env vars are set in Railway/Netlify dashboards.

### Deploying Updates

```bash
# 1. Work on develop branch
git checkout develop
# ... make changes, test locally ...
git add .
git commit -m "feat: add new feature"
git push origin develop

# 2. When ready to deploy to production
git checkout main
git merge develop
git push origin main
# ← This automatically triggers:
#    - Railway redeploy (backend)
#    - Netlify redeploy (frontend + admin)

# 3. Go back to develop for more work
git checkout develop
```

### Deploy Only Specific Parts

If you only want to deploy frontend changes (no backend changes):
- Netlify and Railway only redeploy when files in their base directory change
- Or: manually trigger deploys in their dashboards

---

## Troubleshooting

### "CORS error" in production
- Check that `ADMIN_URL` and `FRONTEND_URL` env vars are set correctly on Railway
- The backend already allows all `*.pesashop.com` subdomains

### "API not reachable" from frontend
- Verify `VITE_API_URL=https://api.pesashop.com` is set in Netlify env vars
- Check `https://api.pesashop.com/health` returns `{"status":"ok"}`

### "Images not loading" after redeploy
- Railway filesystem is ephemeral; see Phase 3.5 for solutions

### Mobile app shows "Network Error"
- Ensure `EXPO_PUBLIC_API_URL` is set in `eas.json` for the build profile used
- On Android, HTTP (non-HTTPS) is blocked by default — always use `https://api.pesashop.com`

### Updating mobile app
```bash
cd mobile
# Bump version in app.json
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

---

## Cost Summary

| Service | Free Tier | Paid (if needed) |
|---|---|---|
| MongoDB Atlas | 512MB free cluster | From $9/mo for 2GB+ |
| Railway | $5 free credit/mo | ~$5-10/mo |
| Netlify (x2 sites) | 100GB bandwidth/mo | From $19/mo |
| EAS Build | 30 builds/mo | From $3/mo |
| Google Play | — | $25 one-time |
| Apple Developer | — | $99/year |
| **Domain** | — | ~$12/year |

**Estimated monthly cost: ~$5-15/mo** (most services have generous free tiers)
