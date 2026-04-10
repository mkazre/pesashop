import { useState, useEffect } from 'react';
import { useCurrencyStore, useCartStore, useUIStore } from '@/store';
import { useCartSuccessOverlay } from '@/components/common/CartSuccessOverlay';
import { loyaltyAPI } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveImg = (src) => {
  if (!src) return '';
  if (typeof src === 'object') src = src.url || src.src || '';
  if (!src || typeof src !== 'string') return '';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

export default function StickyAddToCart({ product, quantity = 1, selectedVariant, disabled }) {
  const [visible, setVisible] = useState(false);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const addItem = useCartStore((s) => s.addItem);
  const openCartSidebar = useUIStore((s) => s.openCartSidebar);
  const showOverlay = useCartSuccessOverlay((s) => s.show);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    addItem(product, quantity, selectedVariant);
    try {
      const res = await loyaltyAPI.calculateProductPoints(product._id, quantity);
      const pts = res.data?.data?.points || 0;
      const cash = res.data?.data?.cashValueZAR || 0;
      showOverlay({ product, points: pts * quantity, cashValue: cash * quantity, coinLabel: 'PESA Coins' });
    } catch {
      showOverlay({ product, points: 0, cashValue: 0 });
    }
  };

  if (!product || !visible) return null;

  const price = product.salePrice || product.regularPrice;
  const inStock = product.stock === undefined || product.stock > 0;
  const imageUrl = resolveImg(product.images?.[0] || product.image);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-md transition-transform duration-300"
      style={{ animation: 'slideDown 0.25s ease-out' }}
    >
      <div className="container-custom py-3 flex items-center gap-4">
        {imageUrl && (
          <img src={imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
          <p className="text-primary font-bold text-base">{formatPrice(price)}</p>
        </div>
        {inStock ? (
          <button
            onClick={handleAddToCart}
            disabled={disabled}
            className="btn-primary px-6 py-2 text-sm font-semibold flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        ) : (
          <span className="text-sm font-semibold text-red-500 flex-shrink-0">Out of Stock</span>
        )}
      </div>
    </div>
  );
}
