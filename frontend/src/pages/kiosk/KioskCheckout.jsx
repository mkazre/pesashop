import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore } from '@/store';
import { useProductPageSettings } from '@/hooks/useProductPageSettings';
import CheckoutDrawer from '@/components/product/CheckoutDrawer';
import KioskHeader from '@/components/kiosk/KioskHeader';

/**
 * KioskCheckout — fullscreen wrapper around the existing CheckoutDrawer.
 *
 * The drawer is the single source of truth for checkout logic on web, mobile, AND kiosk.
 * We pass through the admin-configured settings (`useProductPageSettings`) and only override
 * cosmetic shell settings (width = 100vw, no overlay) so the same component renders fullscreen.
 */
export default function KioskCheckout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const items = useCartStore(s => s.items);
  const { settings } = useProductPageSettings();

  // Empty cart → bounce back to cart page
  useEffect(() => {
    if (items.length === 0) navigate('/kiosk/cart', { replace: true });
  }, [items.length, navigate]);

  // Override only the checkoutDrawer SHELL settings; everything else (payment methods,
  // fulfilment, fields, coupons, gift cards, loyalty, laybye, recurring, offers) stays
  // sourced from the admin so changes propagate everywhere automatically.
  const kioskSettings = useMemo(() => {
    if (!settings) return null;
    return {
      ...settings,
      checkoutDrawer: {
        ...(settings.checkoutDrawer || {}),
        width: '100vw',
        position: 'right',
        showOverlay: false,
      },
    };
  }, [settings]);

  if (!settings) {
    return (
      <div className="min-h-screen flex flex-col">
        <KioskHeader />
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading checkout…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <KioskHeader />
      <CheckoutDrawer
        open={true}
        onClose={() => navigate('/kiosk/cart')}
        product={null}
        quantity={1}
        selectedVariant={null}
        laybyeSelection={null}
        settings={kioskSettings}
        onOrderPlaced={(orderId) => navigate(`/kiosk/order-success/${orderId || ''}`, { replace: true })}
      />
      {!isAuthenticated && (
        <button
          onClick={() => navigate('/kiosk/auth?redirect=/kiosk/checkout')}
          className="fixed bottom-6 left-6 z-[10001] px-5 py-3 bg-secondary text-black rounded-xl shadow-lg font-semibold"
        >
          Sign in to use loyalty / saved addresses
        </button>
      )}
    </div>
  );
}
