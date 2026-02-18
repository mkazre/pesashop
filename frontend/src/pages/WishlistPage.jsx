import { useNavigate } from 'react-router-dom';
import { useWishlistStore } from '@/store';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProductCard from '@/components/common/ProductCard';
import Button from '@/components/common/Button';

export default function WishlistPage() {
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
