// WishlistPage.jsx
import { useNavigate } from 'react-router-dom';
import { useWishlistStore, useCartStore } from '@/store';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProductCard from '@/components/common/ProductCard';
import Button from '@/components/common/Button';

export function WishlistPage() {
  const navigate = useNavigate();
  const { items, clearWishlist } = useWishlistStore();

  const handleClearWishlist = () => {
    if (confirm('Clear all items from your wishlist?')) {
      clearWishlist();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-6">
          <Breadcrumbs items={[{ label: 'Wishlist' }]} />
          
          <div className="text-center py-16">
            <div className="text-gray-400 text-8xl mb-6">❤️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Save your favorite items here for later.
            </p>
            <Button variant="primary-filled" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <Breadcrumbs items={[{ label: 'Wishlist' }]} />

        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={handleClearWishlist}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear Wishlist
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

// OrderSuccessPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI } from '@/services/api';
import { IoCheckmarkCircle } from 'react-icons/io5';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';

export function OrderSuccessPage() {
  const { orderId } = useParams();

  const { data, isLoading } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOne(orderId),
    { enabled: !!orderId }
  );

  const order = data?.data;

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white border-2 border-gray-200 p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <IoCheckmarkCircle className="text-green-600" size={60} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Thanks For You Order
        </h1>
        <p className="text-gray-600 mb-8">
          We're excited to let you know that we've received your order and it's all set to begin processing!
        </p>

        {/* Order Details */}
        {order && (
          <div className="bg-gray-50 p-6 mb-8 text-left">
            <h3 className="font-bold text-lg mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{order._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span className="font-medium">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold">
                    {order.status}
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Payable:</span>
                <span className="font-bold text-lg">R{order.total.toFixed(2)} (Paid)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary-filled" size="lg">
              Back to Home
            </Button>
          </Link>
          {order && (
            <Link to={`/account/orders/${order._id}`}>
              <Button variant="primary" size="lg">
                View Order Details
              </Button>
            </Link>
          )}
        </div>

        {/* Trust Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-200">
          {[
            { icon: '📦', title: 'Free Shipping' },
            { icon: '🎧', title: '24x7 Support' },
            { icon: '↩️', title: '30 Days Return' },
            { icon: '🔒', title: 'Secure Payment' }
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <div className="text-sm font-medium">{feature.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
