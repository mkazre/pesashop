import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useCurrencyStore } from '@/store';
import KioskHeader from '@/components/kiosk/KioskHeader';
import { resolveUrl } from '@/utils/kioskUrl';
import { IoAddOutline, IoRemoveOutline, IoTrashOutline, IoArrowForwardOutline, IoBagOutline } from 'react-icons/io5';

export default function KioskCart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  const subtotal = items.reduce((sum, item) => {
    const variantPrice = item.variant?.price;
    const price = variantPrice ?? (item.product.salePrice || item.product.regularPrice || 0);
    return sum + price * item.quantity;
  }, 0);

  const goCheckout = () => {
    if (items.length === 0) return;
    navigate('/kiosk/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm py-20 text-center">
            <IoBagOutline size={64} className="mx-auto text-gray-300" />
            <p className="mt-4 text-lg text-gray-500">Your cart is empty</p>
            <button onClick={() => navigate('/kiosk')} className="mt-6 px-8 py-4 bg-primary text-white rounded-xl text-lg font-semibold kiosk-tile">
              Start shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <div className="space-y-3">
              {items.map((item, idx) => {
                const variantPrice = item.variant?.price;
                const price = variantPrice ?? (item.product.salePrice || item.product.regularPrice || 0);
                const image = item.variant?.image || item.product.featuredImage;
                return (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {image && <img src={resolveUrl(image)} alt={item.product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg md:text-xl font-semibold text-gray-800 leading-tight">{item.product.name}</div>
                      {item.variant?.attributes && (
                        <div className="text-sm text-gray-500 mt-1">
                          {Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </div>
                      )}
                      {item.laybye && (
                        <div className="mt-1 text-xs inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded">
                          Laybye · {item.laybye.plan?.name}
                        </div>
                      )}
                      <div className="mt-2 text-primary font-bold text-lg">{formatPrice(price)}</div>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
                      <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-12 h-12 flex items-center justify-center"><IoRemoveOutline size={22} /></button>
                      <div className="w-10 text-center font-bold">{item.quantity}</div>
                      <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-12 h-12 flex items-center justify-center"><IoAddOutline size={22} /></button>
                    </div>
                    <button onClick={() => removeItem(idx)} className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl">
                      <IoTrashOutline size={22} />
                    </button>
                  </div>
                );
              })}
            </div>

            <aside className="lg:sticky lg:top-24 self-start space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="flex justify-between text-base mb-2">
                  <span className="text-gray-600">Subtotal ({items.length} item{items.length === 1 ? '' : 's'})</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="text-sm text-gray-500 mb-4">Coupon, gift card, PESA Coins and final fees applied at checkout.</div>
                <button
                  onClick={goCheckout}
                  className="w-full kiosk-tile kiosk-cta-pulse inline-flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl text-xl font-bold shadow-lg"
                >
                  Proceed to Checkout
                  <IoArrowForwardOutline size={24} />
                </button>
              </div>

              <button onClick={() => navigate('/kiosk')} className="w-full text-center py-3 text-gray-600 underline-offset-4 hover:underline">
                Continue shopping
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
