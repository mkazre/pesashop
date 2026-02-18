import { useNavigate } from 'react-router-dom';
import { useCartStore, useWishlistStore } from '@/store';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { CartItem, CartSummary } from '@/components/cart/CartComponents';
import TrustBadges from '@/components/product/TrustBadges';
import CartLoyaltyPoints from '@/components/loyalty/CartLoyaltyPoints';
import CouponWidget from '@/components/coupon/CouponWidget';
import toast from 'react-hot-toast';
import { usePageTemplate } from '@/hooks/usePageTemplate';
import PageRenderer from '@/components/pagebuilder/PageRenderer';

export default function CartPage() {
  const { components: templateComponents, hasTemplate } = usePageTemplate('cart');
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();

  const subtotal = getTotal();

  const handleUpdateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
    } else {
      updateQuantity(index, quantity);
    }
  };

  const handleRemoveItem = (index) => {
    if (confirm('Remove this item from your cart?')) {
      removeItem(index);
      toast.success('Item removed from cart');
    }
  };

  const handleMoveToWishlist = (item) => {
    addToWishlist(item.product);
    const index = items.indexOf(item);
    removeItem(index);
    toast.success('Moved to wishlist!');
  };

  const handleClearCart = () => {
    if (confirm('Clear all items from your cart?')) {
      clearCart();
      toast.success('Cart cleared');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleApplyCoupon = (code) => {
    // TODO: Implement coupon validation
    toast.success(`Coupon "${code}" applied successfully!`);
  };

  // If a published cart template exists, render it via page builder
  if (hasTemplate && templateComponents) {
    return <PageRenderer components={templateComponents} />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-6">
          <Breadcrumbs items={[{ label: 'Cart' }]} />
          
          <div className="text-center py-16">
            <div className="text-gray-400 text-8xl mb-6">🛒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="btn-primary-filled px-8 py-4 text-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Cart' }]} />

        {/* Page Header */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-200 p-6">
              {items.map((item, index) => (
                <CartItem
                  key={index}
                  item={item}
                  index={index}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  onMoveToWishlist={handleMoveToWishlist}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={subtotal}
              onCheckout={handleCheckout}
              onApplyCoupon={handleApplyCoupon}
            />
            <CouponWidget compact />
            <CartLoyaltyPoints />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 bg-white border-2 border-gray-200 p-8">
          <TrustBadges />
        </div>
      </div>
    </div>
  );
}
