# Pesa Shop Mobile App

React Native + Expo mobile app for Pesa Shop e-commerce platform. Connects to the same backend API as the web frontend — one admin panel manages everything.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React Native + Expo SDK 52 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) |
| State | Zustand (same pattern as web) |
| HTTP | Axios (same API service layer) |
| Auth Storage | expo-secure-store (JWT tokens) |
| General Storage | AsyncStorage (cart, wishlist, prefs) |
| Images | expo-image (fast, cached) |
| Backend | Existing Node/Express/MongoDB API |

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android)

### Install & Run

```bash
cd mobile
npm install

# Create your .env from the example
cp .env.example .env

# IMPORTANT: Set your API URL to your machine's local IP (not localhost)
# Your phone needs to reach the backend server
# Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:5000

# Start the dev server
npx expo start
```

Then scan the QR code with Expo Go on your phone.

### Running on Simulators

```bash
# iOS Simulator (macOS only)
npx expo start --ios

# Android Emulator
npx expo start --android
```

## Project Structure

```
mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout (Stack navigator)
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── _layout.tsx     # Tab layout config
│   │   ├── index.tsx       # Home screen
│   │   ├── shop.tsx        # Shop/browse screen
│   │   ├── cart.tsx        # Cart screen
│   │   ├── wishlist.tsx    # Wishlist screen
│   │   └── account.tsx     # Account/profile screen
│   ├── product/[slug].tsx  # Product detail screen
│   ├── category/[slug].tsx # Category products screen
│   ├── search.tsx          # Search screen
│   ├── checkout.tsx        # Checkout flow
│   ├── orders.tsx          # Order history
│   ├── order/[id].tsx      # Order detail
│   └── auth/               # Auth modals
│       ├── login.tsx
│       ├── register.tsx
│       └── forgot-password.tsx
├── src/
│   ├── services/
│   │   └── api.ts          # Axios API layer (mirrors web frontend)
│   ├── store/
│   │   └── index.ts        # Zustand stores (auth, cart, wishlist, currency, UI)
│   └── components/
│       ├── ProductCard.tsx
│       ├── ScreenHeader.tsx
│       ├── SearchBar.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── assets/                 # App icons, splash screen
├── app.json                # Expo config
├── tailwind.config.js      # NativeWind/Tailwind config
├── metro.config.js         # Metro bundler + NativeWind
├── babel.config.js         # Babel + Reanimated
└── package.json
```

## Key Features

- **Same backend** — Uses the same Node/Express/MongoDB API as the web app
- **Same state patterns** — Zustand stores mirror the web frontend exactly
- **Currency-aware** — Uses `useCurrencyStore().formatPrice` for all prices
- **Correct price fields** — Uses `product.regularPrice` and `product.salePrice`
- **Analytics tracking** — product_view, search, add_to_cart, remove_from_cart events
- **Secure auth** — JWT stored in expo-secure-store (encrypted on device)
- **Pull-to-refresh** — Home screen supports pull-to-refresh
- **Infinite scroll** — Shop and category screens load more on scroll
- **Pickup/delivery** — Checkout supports configurable pickup addresses from settings
- **OTA updates** — Expo supports over-the-air updates without app store review

## Placeholder Assets

You need to add proper images for:
- `assets/icon.png` — App icon (1024x1024)
- `assets/splash.png` — Splash screen (1284x2778)
- `assets/adaptive-icon.png` — Android adaptive icon (1024x1024)
- `assets/favicon.png` — Web favicon (48x48)
- `assets/placeholder.png` — Product image placeholder

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL (use your machine's IP for dev) |

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```
