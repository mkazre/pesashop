import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useWishlistStore, useRecentlyViewedStore, useAuthStore, useUIStore, useCurrencyStore } from '@/store';
import { useB2BPricing } from '@/hooks/useB2BPricing';
import { useQuery, useQueryClient } from 'react-query';
import { laybyAPI, reviewsAPI, loyaltyAPI } from '@/services/api';
import { useCartSuccessOverlay } from '@/components/common/CartSuccessOverlay';
import StarRating from '../common/StarRating';
import InlineLaybyePlans from './InlineLaybyePlans';
import CheckoutDrawer from './CheckoutDrawer';
import LaybyWidget from './LaybyWidget';
import LoyaltyPointsBadge from '../loyalty/LoyaltyPointsBadge';
import ProductAIAssistant from './ProductAIAssistant';
import RelatedProducts from './RelatedProducts';
import CustomersAlsoBought from './CustomersAlsoBought';
import RecommendedWithPurchase from './RecommendedWithPurchase';
import CustomersAlsoViewed from './CustomersAlsoViewed';
import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import WriteReview from './WriteReview';
import ProductQA from './ProductQA';
import RecurringWidget from './RecurringWidget';
import OfferSlot from '@/components/offers/OfferSlot';
import ServiceProviderAdSlot from '@/components/ads/ServiceProviderAdSlot';
import ServiceRequestWidget from '@/components/services/ServiceRequestWidget';
import toast from '@/utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Helpers ──────────────────────────────────────────────────────────────────
const imgUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${API_URL}${img}`;
};

// formatPrice is provided by useCurrencyStore inside the component

// ── CSS (injected once) ──────────────────────────────────────────────────────
const STYLES = `
.wp-page { font-family: var(--wp-body-font, 'DM Sans', sans-serif); color: var(--wp-text, #1a1a1a); background: var(--wp-bg, #f6f7f8); }
.wp-page * { box-sizing: border-box; }
.wp-grid { display: grid; gap: var(--wp-gap, 24px); max-width: var(--wp-max-w, 1440px); margin: 0 auto; padding: 24px; align-items: start; }
.wp-grid > * { align-self: start; min-width: 0; }
.wp-grid.three-col { grid-template-columns: var(--wp-gallery-w, 420px) 1fr var(--wp-fulfil-w, 300px); }
.wp-grid.two-col { grid-template-columns: 1fr 1fr; }
@media (max-width: 1024px) { .wp-grid.three-col, .wp-grid.two-col { grid-template-columns: 1fr; } .wp-sticky { position: static !important; } }
.wp-sticky { position: sticky; top: var(--wp-sticky-offset, 120px); align-self: start; }
.wp-card { background: var(--wp-card-bg, #fff); border: 1px solid var(--wp-border, #e5eae6); overflow: hidden; min-width: 0; }

/* Product title */
.wp-product-title { font-size: 22px; font-weight: 800; margin: 0 0 8px; line-height: 1.3; overflow-wrap: break-word; word-break: break-word; }

/* Price elements */
.wp-price-main { font-size: 28px; font-weight: 800; }
.wp-price-fulfil { font-size: 26px; font-weight: 800; }

/* Card padding */
.wp-info-card { padding: 20px; }
.wp-fulfil-card { padding: 16px; }

/* Gallery */
.wp-gallery-main { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; cursor: crosshair; background: #fff; }
.wp-gallery-main img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s; }
.wp-gallery-main:hover img { transform: scale(1.5); }
.wp-thumbs { display: flex; gap: 6px; margin-top: 8px; overflow-x: auto; }
.wp-thumb { width: 64px; height: 64px; border: 2px solid transparent; cursor: pointer; flex-shrink: 0; }
.wp-thumb.active { border-color: var(--wp-primary, #1b5e35); }
.wp-thumb img { width: 100%; height: 100%; object-fit: cover; }
.wp-badge-overlay { position: absolute; top: 12px; left: 12px; padding: 4px 10px; font-size: 12px; font-weight: 700; z-index: 2; }
.wp-wishlist-btn { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; z-index: 2; }
.wp-img-counter { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.6); color: #fff; padding: 2px 8px; font-size: 11px; font-weight: 600; z-index: 2; }
.wp-gallery-arrow { position: absolute; top: 50%; transform: translateY(-50%); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 3; transition: opacity 0.2s, transform 0.15s; }
.wp-gallery-arrow:hover { opacity: 0.85; transform: translateY(-50%) scale(1.08); }
.wp-gallery-arrow.prev { left: var(--wp-arrow-margin, 8px); }
.wp-gallery-arrow.next { right: var(--wp-arrow-margin, 8px); }

/* Neon Buttons */
.wp-btn-primary { width: 100%; padding: 14px; font-size: 15px; font-weight: 800; border: none; cursor: pointer; letter-spacing: 0.5px; position: relative; overflow: hidden; transition: all 0.2s; }
.wp-btn-primary.neon-glow { background: var(--wp-primary, #1b5e35); color: var(--wp-accent, #a8ffca); text-shadow: 0 0 12px var(--wp-glow, rgba(168,255,202,0.8)); }
.wp-btn-primary.neon-glow:hover { filter: brightness(1.1); box-shadow: 0 0 20px var(--wp-glow, rgba(168,255,202,0.4)); }
.wp-btn-secondary { width: 100%; padding: 14px; font-size: 14px; font-weight: 700; border: 2px solid var(--wp-border, #e5eae6); background: transparent; cursor: pointer; transition: all 0.2s; }
.wp-btn-secondary:hover { border-color: var(--wp-primary, #1b5e35); color: var(--wp-primary, #1b5e35); }

/* Shimmer */
.wp-shimmer::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); animation: wpShimmer 2.5s infinite; }
@keyframes wpShimmer { from { left: -100%; } to { left: 100%; } }

/* Pulse dot */
.wp-pulse { display: inline-block; width: 8px; height: 8px; border-radius: 50%; animation: wpPulse 1.5s infinite; }
@keyframes wpPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

/* Section accordion */
.wp-section-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: none; border: none; border-top: 1px solid var(--wp-border, #e5eae6); cursor: pointer; font-size: 14px; font-weight: 700; text-align: left; color: var(--wp-text, #1a1a1a); }
.wp-section-body { padding: 0 16px 16px; overflow: hidden; }

/* Social proof toast */
.wp-toast { position: fixed; bottom: 24px; left: 24px; padding: 12px 16px; background: #fff; border: 1px solid #e5eae6; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-size: 13px; z-index: 9998; display: flex; align-items: center; gap: 10px; animation: wpSlideUp 0.4s ease-out; max-width: 340px; }
@media (max-width: 768px) { .wp-toast { bottom: 80px; left: 12px; right: 12px; max-width: none; } }
@keyframes wpSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* Countdown Timer */
.wp-countdown { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: linear-gradient(135deg, #1b5e35, #2d7a4f); color: #fff; margin: 10px 0; font-size: 13px; font-weight: 700; flex-wrap: wrap; }
.wp-countdown-units { display: flex; gap: 6px; }
.wp-countdown-unit { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.15); padding: 4px 8px; min-width: 44px; }
.wp-countdown-num { font-size: 20px; font-weight: 800; line-height: 1; }
.wp-countdown-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85; }

/* Free Shipping Progress Bar */
.wp-shipping-bar { margin: 10px 0; padding: 10px 14px; border: 1px solid #fecaca; background: #fff5f5; font-size: 13px; transition: background 0.4s, border-color 0.4s; }
.wp-shipping-bar.bar-orange { border-color: #fed7aa; background: #fff7ed; }
.wp-shipping-bar.bar-green { border-color: #bbf7d0; background: #f0fdf4; }
.wp-shipping-bar-track { height: 7px; background: #e5e7eb; border-radius: 4px; margin-top: 7px; overflow: hidden; }
.wp-shipping-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease, background-color 0.4s; }

/* Exit Intent Overlay */
.wp-exit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 99990; display: flex; align-items: center; justify-content: center; animation: wpFadeIn 0.25s ease; }
@keyframes wpFadeIn { from { opacity: 0; } to { opacity: 1; } }
.wp-exit-popup { background: #fff; max-width: 440px; width: 90%; padding: 36px 32px; position: relative; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.25); animation: wpScaleIn 0.3s ease; }
@keyframes wpScaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.wp-exit-close { position: absolute; top: 12px; right: 14px; background: none; border: none; font-size: 22px; cursor: pointer; color: #999; line-height: 1; }
.wp-exit-coupon { font-size: 22px; font-weight: 800; letter-spacing: 2px; padding: 8px 20px; border: 2px dashed var(--wp-primary, #1b5e35); color: var(--wp-primary, #1b5e35); margin: 12px 0; display: inline-block; }
.wp-exit-expiry { font-size: 12px; color: #e53e3e; margin-top: 6px; }

/* Recently Viewed */
.wp-recently-viewed { padding: 20px; }
.wp-rv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin-top: 10px; }
.wp-rv-item { border: 1px solid var(--wp-border, #e5eae6); padding: 8px; cursor: pointer; transition: border-color 0.2s; text-align: center; background: #fff; }
.wp-rv-item:hover { border-color: var(--wp-primary, #1b5e35); }
.wp-rv-item img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.wp-rv-name { font-size: 11px; margin-top: 4px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wp-rv-price { font-size: 11px; color: var(--wp-primary, #1b5e35); font-weight: 700; margin-top: 2px; }

/* Urgency */
.wp-urgency { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 6px 10px; }

/* Sticky mobile bar */
.wp-sticky-mobile { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 2px solid var(--wp-border, #e5eae6); padding: 8px 16px; z-index: 9990; }
@media (max-width: 768px) { .wp-sticky-mobile.enabled { display: flex; align-items: center; gap: 12px; } }

/* ═══ Tablet: when grid collapses to 1 column ═══ */
@media (max-width: 1024px) {
  /* Reorder: gallery first, info second, fulfillment third */
  .wp-col-gallery { order: 1; }
  .wp-col-info { order: 2; }
  .wp-col-fulfil { order: 3; }

  /* Cap gallery width so the square doesn't fill viewport */
  .wp-col-gallery { max-width: 400px; margin: 0 auto; width: 100%; }

  .wp-product-title { font-size: 18px; }
  .wp-price-main { font-size: 24px; }
  .wp-price-fulfil { font-size: 22px; }
  .wp-info-card { padding: 16px; }
  .wp-fulfil-card { padding: 14px; }
}

/* ═══ Mobile ═══ */
@media (max-width: 768px) {
  .wp-page { padding-bottom: 72px; }
  .wp-grid { padding: 10px; gap: 10px; }
  .wp-card { overflow: hidden; }

  /* Gallery: keep square but cap size */
  .wp-col-gallery { max-width: 300px; margin: 0 auto; width: 100%; }
  .wp-thumbs { gap: 4px; margin-top: 4px; }
  .wp-thumb { width: 48px; height: 48px; }

  /* Title */
  .wp-product-title { font-size: 15px; margin: 0 0 6px; }

  /* Prices */
  .wp-price-main { font-size: 20px; }
  .wp-price-fulfil { font-size: 20px; }

  /* Card padding */
  .wp-info-card { padding: 12px; }
  .wp-fulfil-card { padding: 10px; }

  /* Buttons — match layby button height */
  .wp-btn-primary { font-size: 13px; padding: 12px; letter-spacing: 0; }
  .wp-btn-secondary { font-size: 13px; padding: 12px; }

  /* Section accordions */
  .wp-section-header { padding: 10px 12px; font-size: 13px; }
  .wp-section-body { padding: 0 12px 12px; }

  /* Specs & trust */
  .wp-specs-grid { grid-template-columns: 1fr; }
  .wp-trust { grid-template-columns: 1fr; gap: 4px; margin-top: 8px; }

  /* Urgency bars */
  .wp-urgency { font-size: 11px; padding: 4px 8px; }

  /* Badge overlay on gallery */
  .wp-badge-overlay { font-size: 10px; padding: 2px 6px; top: 8px; left: 8px; }
  .wp-wishlist-btn { width: 30px; height: 30px; font-size: 14px; top: 8px; right: 8px; }

  /* Collapsible sections: reduce gap above */
  .wp-card + .wp-card { margin-top: 10px; }

  /* Review bar chart */
  .wp-review-bar { gap: 4px; font-size: 11px; }

  /* Sticky mobile bar button */
  .wp-sticky-mobile .wp-btn-primary { width: auto; padding: 8px 14px; font-size: 12px; }
}

/* Quick specs grid */
.wp-specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.wp-spec-item { padding: 10px; background: var(--wp-bg, #f6f7f8); font-size: 12px; }
.wp-spec-item strong { display: block; font-size: 11px; color: var(--wp-muted, #76889a); font-weight: 500; margin-bottom: 2px; }

/* Review bar chart */
.wp-review-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; }
.wp-review-bar-fill { height: 8px; background: var(--wp-border, #e5eae6); flex: 1; position: relative; overflow: hidden; }
.wp-review-bar-fill span { display: block; height: 100%; background: var(--wp-secondary, #f5b800); }

/* Trust badges */
.wp-trust { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 12px; }
.wp-trust-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--wp-muted, #76889a); padding: 6px 8px; background: var(--wp-bg, #f6f7f8); }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WalmartProductPage({ product, settings }) {
  const navigate = useNavigate();
  const { addItem, getTotal } = useCartStore();
  const { products: recentlyViewed } = useRecentlyViewedStore();
  const { items: wishlistItems, addItem: addWish, removeItem: removeWish } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { displayPrice } = useB2BPricing(product);
  const { formatPrice } = useCurrencyStore();
  const showOverlay = useCartSuccessOverlay((s) => s.show);

  const s = settings || {};
  const theme = s.theme || {};
  const pi = s.productInfo || {};
  const gal = s.gallery || {};
  const fb = s.fulfillmentBox || {};
  const btn = s.buttons || {};
  const lay = s.layout || {};
  const bc = s.breadcrumbs || {};
  const ld = s.laybyeDisplay || {};
  const ce = s.conversionEnhancers || {};
  const rc = s.reviewsConfig || {};
  const specs = s.specifications || {};
  const mobile = s.mobile || {};
  const fd = s.fakeData || {};

  // Fetch reviews from API
  const { data: reviewsRes } = useQuery(
    ['reviews', product?._id],
    () => reviewsAPI.getForProduct(product._id, { limit: 20 }),
    { enabled: !!product?._id, staleTime: 30 * 1000 }
  );
  const reviews = reviewsRes?.data?.data || [];

  // State
  const [mainImg, setMainImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [laybyeSelection, setLaybyeSelection] = useState(null);
  const [laybyeApplicationOpen, setLaybyeApplicationOpen] = useState(false);
  const [recurringActive, setRecurringActive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [socialToast, setSocialToast] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [exitShown, setExitShown] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitExpiry, setExitExpiry] = useState(null);

  const cartTotal = getTotal();
  const price = displayPrice?.displayPrice || product?.salePrice || product?.regularPrice || 0;
  const originalPrice = displayPrice?.originalPrice || product?.regularPrice || 0;
  const saving = originalPrice > price ? originalPrice - price : 0;
  const savingPct = originalPrice > 0 ? Math.round((saving / originalPrice) * 100) : 0;
  const images = product?.images || [];
  const isInWishlist = wishlistItems.some(i => i._id === product?._id);

  // Initialize section collapsed state from settings
  useEffect(() => {
    const initial = {};
    (s.sections || []).forEach(sec => {
      initial[sec.id] = sec.collapsed;
    });
    setOpenSections(initial);
  }, [s.sections]);

  // Social proof toasts
  useEffect(() => {
    if (!ce.socialProofToasts?.enabled) return;
    const msgs = ce.socialProofToasts.messages?.[0];
    if (!msgs || !msgs.enabled) return;

    const show = () => {
      const name = msgs.names?.[Math.floor(Math.random() * msgs.names.length)] || 'Someone';
      const city = msgs.cities?.[Math.floor(Math.random() * msgs.cities.length)] || 'nearby';
      const action = msgs.actions?.[Math.floor(Math.random() * msgs.actions.length)] || 'is viewing this';
      const avatar = msgs.avatars?.[Math.floor(Math.random() * msgs.avatars.length)] || '🧑';
      const text = (msgs.template || '{name} from {city} {action}')
        .replace('{name}', name).replace('{city}', city).replace('{action}', action);
      setSocialToast({ avatar, text });
      setTimeout(() => setSocialToast(null), ce.socialProofToasts.displayDurationMs || 3800);
    };

    const delay = setTimeout(() => {
      show();
      const interval = setInterval(show, ce.socialProofToasts.intervalMs || 7500);
      return () => clearInterval(interval);
    }, ce.socialProofToasts.initialDelayMs || 3000);

    return () => clearTimeout(delay);
  }, [ce.socialProofToasts]);

  // Countdown timer
  useEffect(() => {
    if (!ce.countdownTimer?.enabled) return;
    // Priority: product's own saleEndDate → global endDate from settings
    const endDateRaw = product?.saleEndDate || ce.countdownTimer?.endDate;
    if (!endDateRaw) return;
    const endDate = new Date(endDateRaw);
    if (isNaN(endDate.getTime()) || endDate <= new Date()) return;
    // If showOnSaleOnly, only show when product has a sale price
    if (ce.countdownTimer.showOnSaleOnly && !product?.salePrice) return;

    const tick = () => {
      const diff = endDate - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ d, h, m, s });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [ce.countdownTimer, product?.saleEndDate, product?.salePrice]);

  // Exit intent popup
  useEffect(() => {
    if (!ce.exitIntent?.enabled || exitShown) return;
    const handleMouseLeave = (e) => {
      if (e.clientY <= 5) {
        setExitOpen(true);
        setExitShown(true);
        const secs = ce.exitIntent.expirySeconds || 480;
        setExitExpiry(secs);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [ce.exitIntent, exitShown]);

  // Exit intent expiry countdown
  useEffect(() => {
    if (!exitOpen || exitExpiry === null) return;
    if (exitExpiry <= 0) return;
    const iv = setInterval(() => setExitExpiry(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [exitOpen, exitExpiry]);

  // Urgency random values
  const viewerCount = useMemo(() =>
    Math.floor(Math.random() * ((ce.urgency?.viewerCountMax || 18) - (ce.urgency?.viewerCountMin || 3) + 1)) + (ce.urgency?.viewerCountMin || 3),
    [product?._id]
  );
  const recentPurchases = useMemo(() =>
    Math.floor(Math.random() * ((ce.urgency?.recentPurchaseMax || 42) - (ce.urgency?.recentPurchaseMin || 5) + 1)) + (ce.urgency?.recentPurchaseMin || 5),
    [product?._id]
  );

  // Fake / seed data — deterministic per product ID using simple hash
  const seedHash = useMemo(() => {
    const id = product?._id || 'default';
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = ((h << 5) - h + id.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }, [product?._id]);

  const fakeReviewCount = useMemo(() => {
    if (!fd.enabled) return 0;
    const min = fd.reviewCountMin ?? 5;
    const max = fd.reviewCountMax ?? 50;
    return min + (seedHash % (max - min + 1));
  }, [product?._id, fd.enabled, fd.reviewCountMin, fd.reviewCountMax, seedHash]);

  const fakeRating = useMemo(() => {
    if (!fd.enabled) return 0;
    const min = fd.ratingMin ?? 3;
    const max = fd.ratingMax ?? 5;
    return Math.round((min + ((seedHash * 7) % 100) / 100 * (max - min)) * 10) / 10;
  }, [product?._id, fd.enabled, fd.ratingMin, fd.ratingMax, seedHash]);

  const fakeSoldCount = useMemo(() => {
    if (!fd.enabled) return 0;
    const min = fd.soldCountMin ?? 10;
    const max = fd.soldCountMax ?? 500;
    return min + ((seedHash * 13) % (max - min + 1));
  }, [product?._id, fd.enabled, fd.soldCountMin, fd.soldCountMax, seedHash]);

  const fakeViewCount = useMemo(() => {
    if (!fd.enabled) return 0;
    const min = fd.viewCountMin ?? 100;
    const max = fd.viewCountMax ?? 5000;
    return min + ((seedHash * 17) % (max - min + 1));
  }, [product?._id, fd.enabled, fd.viewCountMin, fd.viewCountMax, seedHash]);

  // Effective values: use real data if available, otherwise use fake data
  const effectiveRating = product?.rating > 0 ? product.rating : (fd.enabled ? fakeRating : (product?.rating || 0));
  const effectiveReviewCount = (reviews.length > 0 || product?.reviewCount > 0)
    ? (reviews.length || product?.reviewCount)
    : (fd.enabled ? fakeReviewCount : 0);
  const effectiveSoldCount = fd.enabled ? fakeSoldCount : 0;
  const qtySoldText = fd.enabled
    ? (fd.soldTextTemplate || '{count}+ bought since yesterday').replace('{count}', effectiveSoldCount)
    : '1K+ bought since yesterday';

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddToCart = async () => {
    addItem({ ...product, quantity });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    showOverlay({ product, points: 0, cashValue: 0, coinLabel: 'PESA Coins' });
    try {
      const res = await loyaltyAPI.calculateProductPoints(product._id, quantity);
      const pts = res.data?.data?.points || 0;
      const cash = res.data?.data?.cashValueZAR || 0;
      if (pts > 0) showOverlay({ product, points: pts * quantity, cashValue: cash * quantity, coinLabel: 'PESA Coins' });
    } catch { /* overlay already showing */ }
  };

  const handleBuyNow = async () => {
    // If laybye is selected, check eligibility first
    if (laybyeSelection) {
      if (!isAuthenticated) {
        openAuthModal('login');
        toast('Please sign in or register to apply for a layby', { icon: '🔐' });
        return;
      }

      // Check if customer has a recent approved application (auto-approve flow)
      try {
        const res = await laybyAPI.checkEligibility();
        if (res.data?.eligible) {
          // Auto-approved — skip application modal, go straight to checkout
          toast.success('You\'re pre-approved for laybye! Proceeding to checkout.');
          if (btn.buyNowAction === 'checkout-drawer' && s.checkoutDrawer?.enabled) {
            setDrawerOpen(true);
          } else {
            addItem({ ...product, quantity });
            navigate('/checkout');
          }
          return;
        }
      } catch {
        // If check fails, fall through to normal application flow
      }

      // Not auto-approved — open laybye application modal
      setLaybyeApplicationOpen(true);
      return;
    }
    if (btn.buyNowAction === 'checkout-drawer' && s.checkoutDrawer?.enabled) {
      setDrawerOpen(true);
    } else if (btn.buyNowAction === 'cart-page') {
      addItem({ ...product, quantity });
      showOverlay({ product, points: 0, cashValue: 0, coinLabel: 'PESA Coins' });
      navigate('/cart');
    } else {
      addItem({ ...product, quantity });
      showOverlay({ product, points: 0, cashValue: 0, coinLabel: 'PESA Coins' });
      navigate('/checkout');
    }
  };

  const handleLaybyeApply = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      toast('Please sign in or register to apply for a layby', { icon: '🔐' });
      return;
    }
    setLaybyeApplicationOpen(true);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      toast.info('Please sign in to add items to your wishlist');
      return;
    }
    if (isInWishlist) { removeWish(product._id); toast.success('Removed from wishlist'); }
    else { addWish(product); toast.success('Added to wishlist!'); }
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: product.name, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }
  };

  // Estimated delivery date
  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (pi.estimatedDeliveryDays || 3));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [pi.estimatedDeliveryDays]);

  const sortedSections = useMemo(() =>
    (s.sections || []).filter(sec => sec.enabled).sort((a, b) => a.order - b.order),
    [s.sections]
  );

  const isThreeCol = lay.type === '3-col-walmart' && fb.enabled;
  const btnStyle = btn.style || 'neon-glow';

  const handlePrevImage = () => setMainImg(i => (i > 0 ? i - 1 : images.length - 1));
  const handleNextImage = () => setMainImg(i => (i < images.length - 1 ? i + 1 : 0));

  // Free shipping bar — reusable render (used in product info + fulfillment box)
  // Calculation is done entirely in BASE currency (ZAR). cartTotal is already ZAR.
  // formatPrice(remaining) automatically converts the ZAR remaining amount to whatever
  // currency the customer is viewing (GBP, USD, etc.) using the live exchange rate.
  // This means: threshold=1000 ZAR, cart=800 ZAR → remaining=200 ZAR → formatPrice shows £12 / $11 etc.
  const renderShippingBar = () => {
    if (!ce.freeShippingBar?.enabled) return null;
    const threshold = ce.freeShippingBar.threshold || 100;
    const pct = Math.min((cartTotal / threshold) * 100, 100);
    const remaining = Math.max(threshold - cartTotal, 0);
    const msg = pct >= 100
      ? (ce.freeShippingBar.completedMessage || '🎉 You qualify for FREE shipping!')
      : (ce.freeShippingBar.message || 'Spend {remaining} more for FREE shipping!').replace('{remaining}', formatPrice(remaining));
    // Color: red (0-40%) → orange (40-80%) → green (80-100%)
    const barColor = pct >= 80 ? '#16a34a' : pct >= 40 ? '#ea7c17' : '#ef4444';
    const barClass = pct >= 80 ? 'bar-green' : pct >= 40 ? 'bar-orange' : '';
    return (
      <div className={`wp-shipping-bar ${barClass}`}>
        <span style={{ color: pct >= 80 ? '#15803d' : pct >= 40 ? '#c2410c' : '#b91c1c', fontWeight: 600 }}>{msg}</span>
        <div className="wp-shipping-bar-track">
          <div className="wp-shipping-bar-fill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </div>
      </div>
    );
  };

  // CSS custom properties
  const cssVars = {
    '--wp-primary': theme.primaryColor || '#1b5e35',
    '--wp-secondary': theme.secondaryColor || '#f5b800',
    '--wp-accent': theme.accentColor || '#a8ffca',
    '--wp-glow': btn.primaryGlowColor || 'rgba(168,255,202,0.8)',
    '--wp-text': theme.textColor || '#1a1a1a',
    '--wp-muted': theme.mutedColor || '#76889a',
    '--wp-bg': theme.bgColor || '#f6f7f8',
    '--wp-card-bg': theme.cardBg || '#ffffff',
    '--wp-border': theme.borderColor || '#e5eae6',
    '--wp-body-font': theme.bodyFont || "'DM Sans', sans-serif",
    '--wp-gap': `${lay.gap || 24}px`,
    '--wp-max-w': `${lay.maxWidth || 1440}px`,
    '--wp-gallery-w': lay.galleryColumnWidth || '420px',
    '--wp-fulfil-w': lay.fulfillmentColumnWidth || '300px',
    '--wp-sticky-offset': `${lay.stickyOffset || 120}px`,
    '--wp-arrow-margin': `${gal.arrows?.margin ?? 8}px`,
  };

  return (
    <div className="wp-page" style={cssVars}>
      <style>{STYLES}</style>

      {/* Breadcrumbs */}
      {bc.enabled && (
        <div style={{ maxWidth: lay.maxWidth || 1440, margin: '0 auto', padding: '12px 16px', fontSize: 12, color: theme.mutedColor || '#76889a', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          {bc.showHome && <><a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</a><span style={{ margin: '0 6px' }}>/</span></>}
          {bc.showCategory && product?.categories?.[0] && (
            <><a href={`/shop/${product.categories[0].slug || ''}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.categories[0].name}</a><span style={{ margin: '0 6px' }}>/</span></>
          )}
          <span style={{ color: theme.textColor || '#1a1a1a', fontWeight: 600 }}>{product?.name}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className={`wp-grid ${isThreeCol ? 'three-col' : 'two-col'}`}>

        {/* ════ LEFT: GALLERY ════ */}
        {gal.enabled && (
          <div className={`wp-col-gallery ${lay.stickyGallery !== false ? 'wp-sticky' : ''}`}>
            <div className="wp-card">
              <div className="wp-gallery-main">
                {images[mainImg] && <img src={imgUrl(images[mainImg])} alt={product?.name} />}

                {/* Badge overlay */}
                {gal.showBadgeOverlay && saving > 0 && (
                  <div className="wp-badge-overlay" style={{ background: theme.dangerColor || '#d93025', color: '#fff' }}>
                    {gal.badgeOverlayType === 'percentage' ? `${savingPct}% OFF` :
                     gal.badgeOverlayType === 'save-amount' ? `Save ${formatPrice(saving)}` :
                     `${savingPct}% OFF`}
                  </div>
                )}

                {/* Wishlist */}
                {gal.showWishlistButton && (
                  <button className="wp-wishlist-btn" onClick={handleWishlist}>
                    {isInWishlist ? '❤️' : '🤍'}
                  </button>
                )}

                {/* Image counter */}
                {gal.showImageCounter && images.length > 1 && (
                  <div className="wp-img-counter">{mainImg + 1}/{images.length}</div>
                )}

                {/* Navigation Arrows */}
                {gal.showNavigationArrows !== false && images.length > 1 && (() => {
                  const ar = gal.arrows || {};
                  const arrowBg = ar.bgColor || 'rgba(27,94,53,0.85)';
                  const arrowColor = ar.iconColor || '#ffffff';
                  const arrowSize = ar.size ?? 36;
                  const padding = ar.padding ?? 8;
                  const borderRadius = ar.borderRadius ?? 4;
                  const border = ar.border || 'none';
                  const iconSize = Math.round(arrowSize * 0.45);
                  const ArrowIcon = ({ dir }) => {
                    if (ar.icon === 'chevron') {
                      return dir === 'prev'
                        ? <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        : <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
                    }
                    if (ar.icon === 'arrow-thin') {
                      return dir === 'prev'
                        ? <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        : <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
                    }
                    // default: filled triangle
                    return <span style={{ fontSize: iconSize, lineHeight: 1 }}>{dir === 'prev' ? '‹' : '›'}</span>;
                  };
                  const arrowStyle = { width: arrowSize, height: arrowSize, background: arrowBg, color: arrowColor, padding, borderRadius, border };
                  return (
                    <>
                      <button className="wp-gallery-arrow prev" style={arrowStyle} onClick={handlePrevImage} aria-label="Previous image">
                        <ArrowIcon dir="prev" />
                      </button>
                      <button className="wp-gallery-arrow next" style={arrowStyle} onClick={handleNextImage} aria-label="Next image">
                        <ArrowIcon dir="next" />
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Thumbnails */}
              {gal.showThumbnails && images.length > 1 && (
                <div className="wp-thumbs" style={{ padding: '8px' }}>
                  {images.map((img, i) => (
                    <div key={i} className={`wp-thumb ${i === mainImg ? 'active' : ''}`} onClick={() => setMainImg(i)}>
                      <img src={imgUrl(img)} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Share Icons */}
            {gal.showShareButton && (
              <div style={{ marginTop: 12, padding: '12px 0' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.textColor || '#1a1a1a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Share this product
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--wp-primary, #1b5e35)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: 16,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 53, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Share on Facebook"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${product?.name}`)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--wp-primary, #1b5e35)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: 16,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 53, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Share on Twitter"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href={`https://www.instagram.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--wp-primary, #1b5e35)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: 16,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 53, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Share on Instagram (opens app)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    href={`https://www.tiktok.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--wp-primary, #1b5e35)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: 16,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 53, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Share on TikTok (opens app)"
                  >
                    <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16.708.027C18.453 0 20.188.016 21.921.027c.105 1.88.784 3.797 2.148 5.147 1.365 1.381 3.271 2.141 5.189 2.413v4.934c-1.764-.07-3.537-.46-5.12-1.263-.672-.344-1.296-.756-1.876-1.216-.008 4.378.016 8.755-.032 13.125-.128 2.3-.988 4.561-2.472 6.291-2.016 2.432-5.177 3.86-8.391 3.82-1.952.02-3.876-.5-5.54-1.508C3.228 30.262 1.3 27.356.928 24.166c-.04-.62-.068-1.244-.044-1.864.22-2.88 1.628-5.592 3.828-7.372 2.476-2.044 5.9-2.936 9.064-2.404.028 1.88-.048 3.756-.048 5.636-1.344-.34-2.856-.18-4.032.548-1.792 1.004-2.68 3.224-2.336 5.208.196 1.156.82 2.244 1.74 2.988 1.088.916 2.612 1.264 4.012 1.032 1.376-.204 2.644-1.08 3.372-2.264.244-.396.452-.824.556-1.284.244-1.3.156-2.632.176-3.948.008-5.636-.008-11.264.016-16.896.008-1.172-.004-2.344.028-3.512z"/>
                    </svg>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Check out this ${product?.name}`)}&body=${encodeURIComponent(`I thought you might be interested in this product:\n\n${product?.name}\n${window.location.href}\n\n${product?.description || ''}`)}`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--wp-primary, #1b5e35)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: 16,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 53, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Share via Email"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out this ${product?.name}: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--wp-primary, #1b5e35)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: 16,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 53, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Share on WhatsApp"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* AI Assistant */}
            <ProductAIAssistant product={product} />
          </div>
        )}

        {/* ════ MIDDLE: PRODUCT INFO ════ */}
        <div className="wp-col-info">
          <div className="wp-card wp-info-card">
            {/* Brand */}
            {pi.showBrand && product?.brand && (
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.primaryColor || '#1b5e35', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                {product.brand}
              </div>
            )}

            {/* Name */}
            {pi.showName && (
              <h1 className="wp-product-title">{product?.name}</h1>
            )}

            {/* Rating & Qty Sold */}
            {(pi.showRating || pi.showQtySold || fd.enabled) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                {(pi.showRating || fd.enabled) && <StarRating rating={effectiveRating} count={effectiveReviewCount} size="sm" />}
                {(pi.showReviewCount || fd.enabled) && effectiveReviewCount > 0 && (
                  <span style={{ fontSize: 12, color: theme.mutedColor || '#76889a' }}>({effectiveReviewCount} reviews)</span>
                )}
                {(pi.showQtySold || fd.enabled) && effectiveSoldCount > 0 && (
                  <span style={{ fontSize: 12, color: theme.mutedColor || '#76889a' }}>{qtySoldText}</span>
                )}
              </div>
            )}

            {/* Price */}
            {pi.showPrice && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="wp-price-main">{formatPrice(price)}</span>
                {pi.showOriginalPrice && saving > 0 && (
                  <span style={{ fontSize: 16, color: theme.mutedColor || '#76889a', textDecoration: 'line-through' }}>{formatPrice(originalPrice)}</span>
                )}
                {pi.showSaveBadge && saving > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: theme.dangerColor || '#d93025', padding: '2px 8px' }}>
                    {pi.saveBadgeType === 'percentage' ? `${savingPct}% OFF` :
                     pi.saveBadgeType === 'both' ? `Save ${formatPrice(saving)} (${savingPct}%)` :
                     `Save ${formatPrice(saving)}`}
                  </span>
                )}
              </div>
            )}

            {/* PESA Coins */}
            {pi.showPesaCoins && (
              <LoyaltyPointsBadge productId={product?._id} quantity={quantity} />
            )}

            {/* Urgency indicators */}
            {ce.urgency?.enabled && (
              <div style={{ margin: '10px 0' }}>
                {ce.urgency.showViewerCount && (
                  <div className="wp-urgency" style={{ color: theme.dangerColor || '#d93025', background: '#fef2f2' }}>
                    👁 {(ce.urgency.viewerCountMessage || '{count} people viewing this right now').replace('{count}', viewerCount)}
                  </div>
                )}
                {ce.urgency.showRecentPurchaseCount && (
                  <div className="wp-urgency" style={{ color: '#c2410c', background: '#fff7ed', marginTop: 4 }}>
                    🔥 {(ce.urgency.recentPurchaseMessage || '{count} sold in last 24 hours').replace('{count}', recentPurchases)}
                  </div>
                )}
                {ce.urgency.showLowStockWarning && product?.stock > 0 && product.stock <= (pi.lowStockThreshold || 5) && (
                  <div className="wp-urgency" style={{ color: '#b91c1c', background: '#fef2f2', marginTop: 4 }}>
                    ⚠ {(ce.urgency.lowStockMessage || 'Only {count} units left — order soon!').replace('{count}', product.stock)}
                  </div>
                )}
              </div>
            )}

            {/* Countdown Timer */}
            {countdown && (
              <div className="wp-countdown">
                <span>{ce.countdownTimer?.label || '⏱ Sale ends in:'}</span>
                <div className="wp-countdown-units">
                  {countdown.d > 0 && (
                    <div className="wp-countdown-unit">
                      <span className="wp-countdown-num">{String(countdown.d).padStart(2, '0')}</span>
                      <span className="wp-countdown-label">days</span>
                    </div>
                  )}
                  <div className="wp-countdown-unit">
                    <span className="wp-countdown-num">{String(countdown.h).padStart(2, '0')}</span>
                    <span className="wp-countdown-label">hrs</span>
                  </div>
                  <div className="wp-countdown-unit">
                    <span className="wp-countdown-num">{String(countdown.m).padStart(2, '0')}</span>
                    <span className="wp-countdown-label">min</span>
                  </div>
                  <div className="wp-countdown-unit">
                    <span className="wp-countdown-num">{String(countdown.s).padStart(2, '0')}</span>
                    <span className="wp-countdown-label">sec</span>
                  </div>
                </div>
              </div>
            )}

            {/* Free Shipping Progress Bar — product info placement */}
            {(!ce.freeShippingBar?.showIn || ce.freeShippingBar.showIn === 'info' || ce.freeShippingBar.showIn === 'both') && renderShippingBar()}

            {/* Estimated Delivery */}
            {pi.showEstimatedDelivery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '10px 0', padding: 10, background: theme.bgColor || '#f6f7f8' }}>
                <span>🚚</span>
                <span>Get it by <strong>{deliveryDate}</strong></span>
              </div>
            )}

            {/* Free Shipping Zones */}
            {pi.showFreeShippingZones && pi.freeShippingZones?.length > 0 && (
              <div style={{ fontSize: 12, color: theme.mutedColor || '#76889a', margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Free shipping to:</span>
                {pi.freeShippingZones.filter(z => z.enabled).map(z => (
                  <span key={z.code} style={{ padding: '1px 6px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 11 }}>{z.label || z.code}</span>
                ))}
              </div>
            )}

            {/* Stock Status */}
            {pi.showStockStatus && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '10px 0' }}>
                {product?.stock > 0 ? (
                  <>
                    {pi.showStockPulse && <span className="wp-pulse" style={{ background: '#22c55e' }} />}
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>In Stock</span>
                    <span style={{ color: theme.mutedColor || '#76889a' }}>({product.stock} available)</span>
                  </>
                ) : (
                  <span style={{ color: theme.dangerColor || '#d93025', fontWeight: 600 }}>Out of Stock</span>
                )}
              </div>
            )}

            {/* Short Description */}
            {pi.showShortDescription && product?.shortDescription && (
              <p style={{ fontSize: 13, color: theme.mutedColor || '#76889a', lineHeight: 1.6, margin: '10px 0' }}>
                {product.shortDescription}
              </p>
            )}

            {/* Quick Specs */}
            {pi.showQuickSpecs && product?.specifications?.length > 0 && (
              <div className="wp-specs-grid" style={{ margin: '14px 0' }}>
                {product.specifications.slice(0, pi.quickSpecsCount || 4).map((spec, i) => (
                  <div key={i} className="wp-spec-item">
                    <strong>{spec.key}</strong>
                    {spec.value}
                  </div>
                ))}
              </div>
            )}

            {/* SKU / Categories */}
            {(pi.showSKU || pi.showCategories || pi.showTags) && (
              <div style={{ fontSize: 12, color: theme.mutedColor || '#76889a', margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                {pi.showSKU && product?.sku && <span>SKU: <strong>{product.sku}</strong></span>}
                {pi.showCategories && product?.categories?.length > 0 && (
                  <span>Category: <strong>{product.categories.map(c => c.name).join(', ')}</strong></span>
                )}
                {pi.showTags && product?.tags?.length > 0 && (
                  <span>Tags: {product.tags.join(', ')}</span>
                )}
              </div>
            )}
          </div>

          {/* ════ COLLAPSIBLE SECTIONS ════ */}
          <div className="wp-card" style={{ marginTop: lay.gap || 24 }}>
            {sortedSections.map((sec) => (
              <div key={sec.id}>
                <button className="wp-section-header" onClick={() => toggleSection(sec.id)}>
                  <span>{sec.label}</span>
                  <span style={{ fontSize: 18, color: theme.mutedColor || '#76889a' }}>{openSections[sec.id] ? '−' : '+'}</span>
                </button>
                {!openSections[sec.id] && (
                  <div className="wp-section-body">
                    {sec.id === 'about' && (
                      <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-line' }}>
                        {product?.description || 'No description available.'}
                      </div>
                    )}
                    {sec.id === 'specifications' && specs.enabled && (
                      <div>
                        {product?.specifications?.length > 0 ? (
                          specs.displayStyle === 'grid' ? (
                            <div className="wp-specs-grid">
                              {product.specifications.map((sp, i) => (
                                <div key={i} className="wp-spec-item"><strong>{sp.key}</strong>{sp.value}</div>
                              ))}
                            </div>
                          ) : (
                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                              <tbody>
                                {product.specifications.map((sp, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid var(--wp-border, #e5eae6)' }}>
                                    <td style={{ padding: '8px 12px', fontWeight: 600, width: '40%', color: theme.mutedColor || '#76889a' }}>{sp.key}</td>
                                    <td style={{ padding: '8px 12px' }}>{sp.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        ) : (
                          <p style={{ fontSize: 13, color: theme.mutedColor || '#76889a', fontStyle: 'italic' }}>No specifications available.</p>
                        )}
                      </div>
                    )}
                    {sec.id === 'reviews' && (
                      <div>
                        {/* Review bar chart */}
                        {rc.showBarChart && (
                          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 36, fontWeight: 800 }}>{(product?.rating || 0).toFixed(1)}</div>
                              <StarRating rating={product?.rating || 0} size="sm" showCount={false} />
                              <div style={{ fontSize: 11, color: theme.mutedColor || '#76889a', marginTop: 4 }}>{reviews.length || product?.reviewCount || 0} reviews</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              {[5, 4, 3, 2, 1].map(star => {
                                const count = reviews.filter(r => r.rating === star).length;
                                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                                return (
                                  <div key={star} className="wp-review-bar">
                                    <span style={{ width: 12 }}>{star}</span>
                                    <span>⭐</span>
                                    <div className="wp-review-bar-fill"><span style={{ width: `${pct}%` }} /></div>
                                    <span style={{ width: 24, textAlign: 'right', fontSize: 10, color: theme.mutedColor || '#76889a' }}>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {reviews.length > 0 ? (
                          reviews.slice(0, rc.perPage || 5).map((rev, i) => {
                            const reviewerName = rev.user
                              ? `${rev.user.firstName || ''} ${rev.user.lastName || ''}`.trim() || 'Customer'
                              : rev.guestName || 'Guest';
                            return (
                              <div key={rev._id || i} style={{ borderTop: '1px solid var(--wp-border)', padding: '12px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <div>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{reviewerName}</span>
                                    {rc.showVerifiedBadge && rev.isVerifiedPurchase && (
                                      <span style={{ fontSize: 10, color: '#16a34a', marginLeft: 8 }}>✓ Verified Purchase</span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: 11, color: theme.mutedColor || '#76889a' }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                                </div>
                                <StarRating rating={rev.rating} size="xs" showCount={false} />
                                {rev.title && <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginTop: 6 }}>{rev.title}</p>}
                                <p style={{ fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>{rev.content || rev.comment}</p>
                                {/* Review images */}
                                {rev.images?.length > 0 && (
                                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                    {rev.images.map((img, idx) => (
                                      <img key={idx} src={imgUrl(img.url || img)} alt={img.alt || ''} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5eae6' }} />
                                    ))}
                                  </div>
                                )}
                                {/* Admin response */}
                                {rev.adminResponse?.content && (
                                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderLeft: '3px solid #16a34a', borderRadius: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>Store Response</span>
                                    <p style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{rev.adminResponse.content}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ fontSize: 13, color: theme.mutedColor || '#76889a', textAlign: 'center', padding: 20 }}>No reviews yet. Be the first to share your experience!</p>
                        )}
                        {/* Write Review Form */}
                        {rc.showWriteReview !== false && (
                          <div style={{ marginTop: 16 }}>
                            <WriteReview productId={product?._id} productName={product?.name} />
                          </div>
                        )}
                      </div>
                    )}
                    {sec.id === 'related' && (
                      <CustomersAlsoViewed productId={product?._id} />
                    )}
                    {sec.id === 'upsells' && (
                      <FrequentlyBoughtTogether productId={product?._id} />
                    )}
                    {sec.id === 'also_bought' && (
                      <CustomersAlsoBought productId={product?._id} />
                    )}
                    {sec.id === 'recommended' && (
                      <RecommendedWithPurchase productId={product?._id} />
                    )}
                    {sec.id === 'qa' && (
                      <ProductQA productId={product?._id} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ════ RIGHT: FULFILLMENT BOX ════ */}
        {fb.enabled && (
          <div className={`wp-col-fulfil ${lay.stickyFulfillment !== false ? 'wp-sticky' : ''}`}>
            <div className="wp-card wp-fulfil-card">
              {/* Price */}
              {fb.showPrice && (
                <div style={{ marginBottom: 12 }}>
                  <div className="wp-price-fulfil">{formatPrice(price)}</div>
                  {saving > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 14, textDecoration: 'line-through', color: theme.mutedColor || '#76889a' }}>{formatPrice(originalPrice)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Save {formatPrice(saving)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PESA Coins in fulfillment */}
              {fb.showPesaCoins && (
                <div style={{ marginBottom: 12 }}>
                  <LoyaltyPointsBadge productId={product?._id} quantity={quantity} />
                </div>
              )}

              {/* Laybye — hidden when recurring is active */}
              {!recurringActive && fb.showLaybye && (ld.displayMode === 'inline-plans' || ld.displayMode === 'both') && ld.showInFulfillmentBox && (
                <InlineLaybyePlans product={product} settings={settings} onLaybyeSelect={setLaybyeSelection} />
              )}

              {/* Recurring Purchase Widget — only shown when layby plan is NOT selected (mutually exclusive) */}
              {!laybyeSelection && <RecurringWidget product={product} onRecurringChange={setRecurringActive} />}

              {/* Delivery Options */}
              {fb.showDeliveryOptions && fb.deliveryOptions?.length > 0 && (
                <div style={{ margin: '14px 0', borderTop: '1px solid var(--wp-border)', paddingTop: 14 }}>
                  {fb.deliveryOptions.filter(d => d.enabled).sort((a, b) => a.order - b.order).map(opt => (
                    <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 13 }}>
                      <span>{opt.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {opt.label}
                          {opt.isFree && <span style={{ color: '#16a34a', marginLeft: 6, fontSize: 11 }}>FREE</span>}
                        </div>
                        {opt.subtitle && <div style={{ fontSize: 11, color: theme.mutedColor || '#76889a' }}>{opt.subtitle}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Qty */}
              {fb.showQtyControl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '14px 0' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, height: 36, border: '1px solid var(--wp-border)', background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} style={{ width: 50, height: 36, textAlign: 'center', border: '1px solid var(--wp-border)', fontSize: 14, fontWeight: 700 }} />
                  <button onClick={() => setQuantity(quantity + 1)} style={{ width: 36, height: 36, border: '1px solid var(--wp-border)', background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
                </div>
              )}

              {/* Free Shipping Progress Bar — fulfillment box placement */}
              {(ce.freeShippingBar?.showIn === 'fulfillment' || ce.freeShippingBar?.showIn === 'both') && renderShippingBar()}

              {/* Buy Now Button */}
              {fb.showBuyNow && (
                <button
                  className={`wp-btn-primary ${btnStyle} ${btn.showShimmerEffect ? 'wp-shimmer' : ''}`}
                  onClick={handleBuyNow}
                  style={{ marginBottom: 8 }}
                >
                  {laybyeSelection
                    ? (btn.laybyeBuyLabel || '💳 Start Laybye — {deposit} deposit').replace('{deposit}', formatPrice(laybyeSelection.deposit))
                    : (btn.buyNowLabel || 'Buy Now →')}
                </button>
              )}

              {/* Add to Cart Button */}
              {fb.showAddToCart && (
                <button className="wp-btn-secondary" onClick={handleAddToCart} style={{ color: addedToCart ? '#16a34a' : undefined, borderColor: addedToCart ? '#16a34a' : undefined }}>
                  {addedToCart ? (btn.addedToCartLabel || '✓ Added to Cart!') : (btn.addToCartLabel || '🛒 Add to Cart')}
                </button>
              )}

              {/* Laybye widget (modal mode — standalone button) */}
              {fb.showLaybye && (ld.displayMode === 'widget-modal' || ld.displayMode === 'both') && !laybyeSelection && (
                <LaybyWidget product={product} showButton={true} />
              )}

              {/* Laybye application modal (triggered by "Start Laybye" button when plan is selected) */}
              {fb.showLaybye && (
                <LaybyWidget
                  product={product}
                  selectedPlan={laybyeSelection}
                  showButton={false}
                  isOpen={laybyeApplicationOpen}
                  onClose={() => setLaybyeApplicationOpen(false)}
                />
              )}

              {/* Special Offers — collapsible toggle */}
              <OfferSlot page="product_detail" />

              {/* Book a Service Professional */}
              <ServiceRequestWidget product={product} />

              {/* Trust Badges */}
              {fb.showTrustBadges && fb.trustBadges?.length > 0 && (
                <div className="wp-trust">
                  {fb.trustBadges.filter(b => b.enabled).sort((a, b) => a.order - b.order).map((badge, i) => (
                    <div key={i} className="wp-trust-item">
                      <span>{badge.icon}</span>
                      <span>{badge.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment methods */}
              {fb.showPaymentMethodLogos && fb.paymentMethods?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {fb.paymentMethods.map(m => (
                    <span key={m} style={{ fontSize: 10, padding: '2px 6px', background: theme.bgColor || '#f6f7f8', border: '1px solid var(--wp-border)', fontWeight: 600, color: theme.mutedColor || '#76889a' }}>{m}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price Match Guarantee */}
      {ce.priceMatchGuarantee?.enabled && (
        <div style={{ maxWidth: lay.maxWidth || 1440, margin: '0 auto', padding: '0 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13 }}>
            <span>{ce.priceMatchGuarantee.icon || '🏷️'}</span>
            <span>{ce.priceMatchGuarantee.text}</span>
          </div>
        </div>
      )}

      {/* Social Proof Toast */}
      {socialToast && (
        <div className="wp-toast">
          <span style={{ fontSize: 24 }}>{socialToast.avatar}</span>
          <span>{socialToast.text}</span>
        </div>
      )}

      {/* Sticky Mobile Bar */}
      {ce.stickyMobileBar?.enabled && (
        <div className={`wp-sticky-mobile ${ce.stickyMobileBar.enabled ? 'enabled' : ''}`}>
          {ce.stickyMobileBar.showImage && images[0] && (
            <img src={imgUrl(images[0])} alt="" style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid var(--wp-border)' }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {ce.stickyMobileBar.showPrice && <div style={{ fontSize: 16, fontWeight: 800 }}>{formatPrice(price)}</div>}
          </div>
          <button
            className={`wp-btn-primary ${btnStyle}`}
            onClick={handleBuyNow}
            style={{ width: 'auto', padding: '10px 20px', fontSize: 13 }}
          >
            Buy Now
          </button>
        </div>
      )}

      {/* Recently Viewed */}
      {ce.recentlyViewed?.enabled && (() => {
        const maxItems = ce.recentlyViewed.maxItems || 6;
        const rvItems = recentlyViewed.filter(p => p._id !== product?._id).slice(0, maxItems);
        if (!rvItems.length) return null;
        return (
          <div style={{ maxWidth: lay.maxWidth || 1440, margin: '0 auto', padding: '0 24px 24px' }}>
            <div className="wp-card wp-recently-viewed">
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Recently Viewed</div>
              <div className="wp-rv-grid">
                {rvItems.map(p => (
                  <div key={p._id} className="wp-rv-item" onClick={() => navigate(`/product/${p.slug || p._id}`)}>
                    {p.images?.[0] ? (
                      <img src={imgUrl(p.images[0])} alt={p.name} />
                    ) : (
                      <div style={{ aspectRatio: '1', background: '#f3f4f6' }} />
                    )}
                    <div className="wp-rv-name">{p.name}</div>
                    <div className="wp-rv-price">{formatPrice(p.salePrice || p.regularPrice || 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Exit Intent Popup */}
      {exitOpen && ce.exitIntent?.enabled && (
        <div className="wp-exit-overlay" onClick={() => setExitOpen(false)}>
          <div className="wp-exit-popup" onClick={e => e.stopPropagation()}>
            <button className="wp-exit-close" onClick={() => setExitOpen(false)}>✕</button>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: theme.textColor || '#1a1a1a' }}>
              {ce.exitIntent.title || "Wait! Don't go yet"}
            </h2>
            <p style={{ fontSize: 14, color: theme.mutedColor || '#76889a', margin: '0 0 16px' }}>
              {ce.exitIntent.subtitle || 'Grab this exclusive discount before you leave!'}
            </p>
            {ce.exitIntent.couponCode && (
              <div>
                <div style={{ fontSize: 12, color: theme.mutedColor || '#76889a', marginBottom: 4 }}>Use code:</div>
                <div className="wp-exit-coupon">{ce.exitIntent.couponCode}</div>
              </div>
            )}
            {exitExpiry > 0 && (
              <div className="wp-exit-expiry">
                Offer expires in {Math.floor(exitExpiry / 60)}:{String(exitExpiry % 60).padStart(2, '0')}
              </div>
            )}
            <button
              className={`wp-btn-primary ${btnStyle}`}
              style={{ marginTop: 20, background: theme.primaryColor || '#1b5e35', color: theme.accentColor || '#a8ffca' }}
              onClick={() => setExitOpen(false)}
            >
              {ce.exitIntent.discountText || 'Claim Discount Now'}
            </button>
          </div>
        </div>
      )}

      {/* Service Provider Ads — 5-column banner at bottom */}
      <div style={{ maxWidth: lay.maxWidth || 1440, margin: '0 auto', padding: '0 24px 12px' }}>
        <ServiceProviderAdSlot
          slotId="product_detail_below_buy"
          pageType="product"
          productId={product?._id}
          categorySlug={product?.categories?.[0]?.slug}
        />
      </div>

      {/* Checkout Drawer */}
      <CheckoutDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        product={product}
        quantity={quantity}
        selectedVariant={null}
        laybyeSelection={laybyeSelection}
        settings={settings}
      />
    </div>
  );
}
