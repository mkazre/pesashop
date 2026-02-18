import { IoClose, IoTrashOutline, IoChevronForward } from 'react-icons/io5';
import { useCartStore, useUIStore, useAuthStore } from '@/store';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { calculateBatchB2BPrices, getDisplayPrice } from '@/utils/pricing';
import Button from '../common/Button';

export default function CartSidebar() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const { cartSidebarOpen, closeCartSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [b2bPricing, setB2bPricing] = useState({});

  useEffect(() => {
    if (items.length > 0 && user) {
      const products = items.map(item => ({
        productId: item.product._id,
        variationId: item.variant?._id,
        quantity: item.quantity
      }));

      calculateBatchB2BPrices(products, user._id, getTotal())
        .then((results) => {
          const pricingMap = {};
          results.forEach((result, index) => {
            if (result && !result.error) {
              pricingMap[items[index].product._id] = result;
            }
          });
          setB2bPricing(pricingMap);
        })
        .catch(() => {
          setB2bPricing({});
        });
    } else {
      setB2bPricing({});
    }
  }, [items, user, getTotal()]);

  if (!cartSidebarOpen) return null;

  // Calculate subtotal with B2B pricing
  const subtotal = items.reduce((total, item) => {
    const pricing = b2bPricing[item.product._id];
    const displayPrice = getDisplayPrice(item.product, pricing);
    return total + (displayPrice.displayPrice * item.quantity);
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCartSidebar}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h2>
          <button
            onClick={closeCartSidebar}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Button
                variant="primary-filled"
                onClick={closeCartSidebar}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const price = item.product.salePrice || item.product.regularPrice;
                const itemTotal = price * item.quantity;

                return (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-200">
                    {/* Product Image */}
                    <Link
                      to={`/product/${item.product._id}`}
                      onClick={closeCartSidebar}
                      className="flex-shrink-0"
                    >
                      <img
                        src={item.product.images?.[0] || '/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product._id}`}
                        onClick={closeCartSidebar}
                        className="font-medium text-gray-900 hover:text-primary line-clamp-2 mb-1"
                      >
                        {item.product.name}
                      </Link>

                      {/* Variant */}
                      {item.variant && (
                        <div className="text-sm text-gray-600">
                          {item.variant.color && `Color: ${item.variant.color}`}
                          {item.variant.size && `, Size: ${item.variant.size}`}
                        </div>
                      )}

                      {/* Price & Quantity */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-0 border border-gray-300">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              updateQuantity(index, qty);
                            }}
                            className="w-12 text-center border-x border-gray-300 py-1 text-sm"
                          />
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            R{itemTotal.toFixed(2)}
                          </div>
                          {displayPrice.originalPrice > displayPrice.displayPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              R{(displayPrice.originalPrice * item.quantity).toFixed(2)}
                            </div>
                          )}
                          {displayPrice.isB2B && (
                            <div className="text-xs text-blue-600">B2B</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove item"
                    >
                      <IoTrashOutline size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Totals */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">Subtotal:</span>
              <span className="font-bold text-2xl">R{subtotal.toFixed(2)}</span>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <Link to="/checkout" onClick={closeCartSidebar}>
                <Button
                  variant="primary-filled"
                  fullWidth
                  icon={<IoChevronForward />}
                >
                  Proceed to Checkout
                </Button>
              </Link>
              <Link to="/cart" onClick={closeCartSidebar}>
                <Button variant="primary" fullWidth>
                  View Cart
                </Button>
              </Link>
            </div>

            {/* Free Shipping Message */}
            <div className="text-center text-sm text-gray-600">
              <span className="text-green-600 font-medium">Free Shipping</span> on orders over R500
            </div>
          </div>
        )}
      </div>
    </>
  );
}
