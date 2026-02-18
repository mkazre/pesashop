import { IoCartOutline } from 'react-icons/io5';
import Button from '../common/Button';
import { useCartStore, useUIStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function BuyButtons({ product, quantity, selectedVariant, disabled }) {
  const { addItem } = useCartStore();
  const { openCartSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    addItem(product, quantity, selectedVariant);
    toast.success('Added to cart!');
    openCartSidebar();
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
