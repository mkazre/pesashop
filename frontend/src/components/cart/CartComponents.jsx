import { Link } from 'react-router-dom';
import { IoTrashOutline, IoHeartOutline, IoGift, IoClose } from 'react-icons/io5';
import { useState } from 'react';
import { useCartStore, useCurrencyStore } from '@/store';
import { giftCardsAPI } from '@/services/api';
import Button from '../common/Button';
import toast from '@/utils/toast';

// CartItem Component
export function CartItem({ item, index, onUpdateQuantity, onRemove, onMoveToWishlist }) {
  const { formatPrice } = useCurrencyStore();
  const price = item.product.salePrice || item.product.regularPrice;
  const itemTotal = price * item.quantity;

  return (
    <div className="flex gap-6 py-6 border-b border-gray-200">
      {/* Product Image */}
      <Link to={`/product/${item.product._id}`} className="flex-shrink-0">
        <img
          src={item.product.images?.[0] || '/placeholder.jpg'}
          alt={item.product.name}
          className="w-32 h-32 object-cover"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1">
        <Link
          to={`/product/${item.product._id}`}
          className="font-medium text-lg text-gray-900 hover:text-primary mb-2 block"
        >
          {item.product.name}
        </Link>

        {/* Variant Info */}
        {item.variant && (
          <div className="text-sm text-gray-600 mb-3">
            {item.variant.color && (
              <span>Color: <strong>{item.variant.color}</strong></span>
            )}
            {item.variant.color && item.variant.size && ' | '}
            {item.variant.size && (
              <span>Size: <strong>{item.variant.size}</strong></span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="text-xl font-bold text-gray-900 mb-3">
          {formatPrice(price)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onMoveToWishlist?.(item)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <IoHeartOutline size={18} />
            Move to Wishlist
          </button>
          <button
            onClick={() => onRemove(index)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <IoTrashOutline size={18} />
            Remove
          </button>
        </div>
      </div>

      {/* Quantity & Total */}
      <div className="flex flex-col items-end gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center gap-0 border-2 border-gray-300">
          <button
            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            -
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const qty = parseInt(e.target.value) || 1;
              onUpdateQuantity(index, qty);
            }}
            className="w-16 text-center border-x-2 border-gray-300 py-2"
          />
          <button
            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            +
          </button>
        </div>

        {/* Item Total */}
        <div className="text-xl font-bold text-gray-900">
          {formatPrice(itemTotal)}
        </div>
      </div>
    </div>
  );
}

// CartSummary Component
export function CartSummary({ subtotal, onCheckout, couponCode, onApplyCoupon }) {
  const [code, setCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [validatingGiftCard, setValidatingGiftCard] = useState(false);
  const { giftCardCode: appliedGiftCard, giftCardAmount, giftCardBalance, setGiftCard, clearGiftCard } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  
  const shipping = 0; // Free shipping
  const tax = subtotal * 0.15; // 15% VAT
  const discount = 0; // Apply discount logic here
  const giftCardDiscount = giftCardAmount || 0;
  const totalBeforeGiftCard = subtotal + shipping + tax - discount;
  const total = Math.max(0, totalBeforeGiftCard - giftCardDiscount);

  const handleApplyCoupon = () => {
    if (code.trim()) {
      onApplyCoupon?.(code);
      setCode('');
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }

    setValidatingGiftCard(true);
    try {
      const response = await giftCardsAPI.validate(giftCardCode.trim().toUpperCase().replace(/-/g, ''));
      const giftCard = response.data.data.giftCard;
      const balance = response.data.data.balance;
      
      if (balance <= 0) {
        toast.error('This gift card has no remaining balance');
        return;
      }

      const discountAmount = Math.min(balance, totalBeforeGiftCard);
      setGiftCard(giftCard.code, discountAmount, balance);
      toast.success(`Gift card applied! ${formatPrice(discountAmount)} discount applied.`);
      setGiftCardCode('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired gift card');
    } finally {
      setValidatingGiftCard(false);
    }
  };

  const handleRemoveGiftCard = () => {
    clearGiftCard();
    toast.success('Gift card removed');
  };

  return (
    <div className="bg-white border-2 border-gray-200 p-6 sticky top-4">
      <h3 className="text-xl font-bold mb-6">Order Summary</h3>

      {/* Coupon Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Coupon Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 px-4 py-2 border-2 border-gray-300 focus:border-primary focus:outline-none"
          />
          <Button
            variant="primary"
            onClick={handleApplyCoupon}
          >
            Apply
          </Button>
        </div>
        {couponCode && (
          <div className="mt-2 text-sm text-green-600">
            ✓ Coupon "{couponCode}" applied
          </div>
        )}
      </div>

      {/* Gift Card */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gift Card
        </label>
        {appliedGiftCard ? (
          <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IoGift className="text-green-600" size={20} />
                <div>
                  <div className="text-sm font-medium text-green-800">
                    Gift Card: {appliedGiftCard}
                  </div>
                  <div className="text-xs text-green-600">
                    {formatPrice(giftCardAmount)} applied | {formatPrice(giftCardBalance)} remaining
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveGiftCard}
                className="p-1 hover:bg-green-100 rounded"
                title="Remove gift card"
              >
                <IoClose size={18} className="text-green-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
              placeholder="Enter gift card code"
              className="flex-1 px-4 py-2 border-2 border-gray-300 focus:border-primary focus:outline-none"
            />
            <Button
              variant="primary"
              onClick={handleApplyGiftCard}
              loading={validatingGiftCard}
            >
              Apply
            </Button>
          </div>
        )}
        <Link to="/gift-cards" className="text-sm text-primary hover:underline mt-2 block">
          Purchase a gift card →
        </Link>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-gray-700">
          <span>Sub-Total</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-700">
          <span>VAT (15%)</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatPrice(discount)}</span>
          </div>
        )}
        {giftCardDiscount > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Gift Card</span>
            <span className="font-medium">-{formatPrice(giftCardDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-gray-700">
          <span>Shipment</span>
          <span className="font-medium text-green-600">
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex items-center justify-between text-gray-700">
          <span>Tax</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between text-xl font-bold border-t-2 border-gray-200 pt-4 mb-6">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {/* Checkout Button */}
      <Button
        variant="primary-filled"
        fullWidth
        size="lg"
        onClick={onCheckout}
      >
        Proceed to checkout
      </Button>

      {/* Continue Shopping */}
      <Link to="/shop">
        <Button variant="ghost" fullWidth className="mt-3">
          Continue shopping →
        </Button>
      </Link>
    </div>
  );
}
