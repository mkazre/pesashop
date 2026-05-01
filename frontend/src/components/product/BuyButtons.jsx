import { IoCart } from 'react-icons/io5';
import Button from '../common/Button';
import { useCartStore, useUIStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import toast from '@/utils/toast';
import { useCartSuccessOverlay } from '@/components/common/CartSuccessOverlay';
import { loyaltyAPI } from '@/services/api';

export default function BuyButtons({ product, quantity, selectedVariant, disabled }) {
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  const showOverlay = useCartSuccessOverlay((s) => s.show);

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    addItem(product, quantity, selectedVariant);
    // Show overlay immediately with 0 points, then update if loyalty API returns data
    showOverlay({ product, points: 0, cashValue: 0, coinLabel: 'PESA Coins' });
    try {
      const res = await loyaltyAPI.calculateProductPoints(product._id, quantity);
      const pts = res.data?.data?.points || 0;
      const cash = res.data?.data?.cashValueZAR || 0;
      if (pts > 0) {
        showOverlay({ product, points: pts * quantity, cashValue: cash * quantity, coinLabel: 'PESA Coins' });
      }
    } catch {
      // overlay already showing without points — that's fine
    }
  };

  const handleBuyNow = () => {
    if (product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    addItem(product, quantity, selectedVariant);
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-6">
      <Button
        variant="secondary-filled"
        size="lg"
        fullWidth
        onClick={handleBuyNow}
        disabled={disabled || product.stock === 0}
      >
        Buy Now
      </Button>
      <Button
        variant="primary-filled"
        size="lg"
        fullWidth
        icon={<IoCart size={24} />}
        onClick={handleAddToCart}
        disabled={disabled || product.stock === 0}
      >
        Add to Cart
      </Button>
    </div>
  );
}
