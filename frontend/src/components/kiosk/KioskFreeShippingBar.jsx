import React from 'react';
import { useCurrencyStore, useCartStore } from '@/store';
import { useProductPageSettings } from '@/hooks/useProductPageSettings';

/**
 * Free shipping progress bar — same data shape as the website's WalmartProductPage.
 * settings.conversionEnhancers.freeShippingBar = { enabled, threshold, message, completedMessage }
 *
 * The threshold is in BASE currency (ZAR). cartTotal is also in ZAR.
 * formatPrice() converts the remaining amount into the customer's chosen currency
 * (USD, EUR, GBP, …) using the live exchange rate.
 *
 * @param extraAmount: ZAR amount to add hypothetically (e.g. about-to-add-to-cart line).
 */
export default function KioskFreeShippingBar({ extraAmount = 0 }) {
  const { formatPrice } = useCurrencyStore();
  const { settings } = useProductPageSettings();
  const items = useCartStore(s => s.items);

  const ce = settings?.conversionEnhancers || {};
  const cfg = ce.freeShippingBar;
  if (!cfg || cfg.enabled === false) return null;

  const cartTotal = items.reduce((sum, it) => {
    const variantPrice = it.variant?.price;
    const price = variantPrice ?? (it.product?.salePrice || it.product?.regularPrice || 0);
    return sum + price * (it.quantity || 0);
  }, 0) + (extraAmount || 0);

  const threshold = cfg.threshold || 100;
  const pct = Math.min((cartTotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - cartTotal, 0);
  const completed = pct >= 100;

  const msg = completed
    ? (cfg.completedMessage || '🎉 You qualify for FREE shipping!')
    : (cfg.message || 'Spend {remaining} more for FREE shipping!').replace('{remaining}', formatPrice(remaining));

  // red (0–40%) → orange (40–80%) → green (80–100%)
  const fill = pct >= 80 ? '#16a34a' : pct >= 40 ? '#ea7c17' : '#ef4444';
  const bg = pct >= 80 ? '#f0fdf4' : pct >= 40 ? '#fff7ed' : '#fff5f5';
  const border = pct >= 80 ? '#bbf7d0' : pct >= 40 ? '#fed7aa' : '#fecaca';
  const text = pct >= 80 ? '#15803d' : pct >= 40 ? '#c2410c' : '#b91c1c';

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm md:text-base font-semibold" style={{ color: text }}>{msg}</span>
      </div>
      <div className="h-2 bg-white/60 rounded overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}
