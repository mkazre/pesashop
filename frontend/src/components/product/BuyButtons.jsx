import { IoCartOutline } from 'react-icons/io5';
import Button from '../common/Button';
import { useCartStore, useUIStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import toast from '@/utils/toast';
import { useCartSuccessOverlay } from '@/components/common/CartSuccessOverlay';
import { loyaltyAPI } from '@/services/api';

export default function BuyButtons({ product, quantity, selectedVariant, disabled }) {
  const { addItem } = useCartStore();
  const { openCartSidebar } = useUIStore();
  const navigate = useNavigate();
  const showOverlay = useCartSuccessOverlay((s) => s.show);

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    addItem(product, quantity, selectedVariant);

    // Show animated overlay instead of plain toast
    try {
      const res = await loyaltyAPI.calculateProductPoints(product._id, quantity);
      const pts = res.data?.data?.points || 0;
      const cash = res.data?.data?.cashValueZAR || 0;
      showOverlay({ product, points: pts * quantity, cashValue: cash * quantity, coinLabel: 'PESA Coins' });
    } catch {
      showOverlay({ product, points: 0, cashValue: 0 });
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
        icon={<IoCartOutline size={24} />}
        onClick={handleAddToCart}
        disabled={disabled || product.stock === 0}
      >
        Add to Cart
      </Button>
    </div>
  );
}
