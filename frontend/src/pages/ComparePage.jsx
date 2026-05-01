import { Link } from 'react-router-dom';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import StarRating from '@/components/common/StarRating';
import Button from '@/components/common/Button';
import { useCompareStore, useCartStore, useUIStore, useCurrencyStore } from '@/store';
import { useProductArchiveSettings } from '@/hooks/useProductArchiveSettings';
import { IoTrash, IoCart, IoArrowBack } from 'react-icons/io5';
import toast from '@/utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getImageSrc(path) {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

export default function ComparePage() {
  const { formatPrice } = useCurrencyStore();
  const { items, removeItem, clearCompare } = useCompareStore();
  const { addItem: addToCart } = useCartStore();
  const { openCartSidebar } = useUIStore();
  const { settings } = useProductArchiveSettings();
  const compareConfig = settings?.compare || {};

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success('Added to cart!');
    openCartSidebar();
  };

  // Fields to show in the compare table
  const defaultFields = ['image', 'name', 'price', 'rating', 'description', 'stock', 'brand', 'category', 'specifications', 'addToCart', 'remove'];
  const fields = compareConfig.compareFields?.length > 0 ? compareConfig.compareFields : defaultFields;

  const fieldLabels = {
    image: 'Preview',
    name: 'Product',
    price: 'Price',
    rating: 'Rating',
    description: 'Description',
    stock: 'Availability',
    brand: 'Brand',
    category: 'Category',
    specifications: 'Specifications',
    addToCart: '',
    remove: '',
    sku: 'SKU',
    weight: 'Weight',
    dimensions: 'Dimensions',
  };

  const renderFieldValue = (field, product) => {
    switch (field) {
      case 'image':
        return (
          <Link to={`/product/${product.slug || product._id}`} className="block">
            <img
              src={getImageSrc(product.featuredImage || product.images?.[0])}
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
              onError={(e) => { e.target.src = '/placeholder.jpg'; }}
            />
          </Link>
        );
      case 'name':
        return (
          <Link to={`/product/${product.slug || product._id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors text-base leading-tight">
            {product.name}
          </Link>
        );
      case 'price':
        return (
          <div className="space-y-1">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(product.salePrice || product.regularPrice || 0)}
            </span>
            {product.salePrice && product.regularPrice > product.salePrice && (
              <div>
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.regularPrice)}</span>
                <span className="ml-1 text-xs text-green-600 font-medium">
                  {Math.round((1 - product.salePrice / product.regularPrice) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
        );
      case 'rating':
        return (
          <div className="flex items-center gap-2">
            <StarRating rating={product.rating || 0} size="sm" />
            <span className="text-sm text-gray-500">({product.reviewCount || 0})</span>
          </div>
        );
      case 'description':
        return (
          <p className="text-sm text-gray-600 line-clamp-3">{product.description || 'No description'}</p>
        );
      case 'stock':
        return product.stock === undefined || product.stock > 0 ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            In Stock {product.stock !== undefined ? `(${product.stock})` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Out of Stock
          </span>
        );
      case 'brand':
        return <span className="text-sm text-gray-700">{product.brand || '—'}</span>;
      case 'category':
        return <span className="text-sm text-gray-700">{product.category?.name || '—'}</span>;
      case 'sku':
        return <span className="text-sm text-gray-700 font-mono">{product.sku || '—'}</span>;
      case 'weight':
        return <span className="text-sm text-gray-700">{product.weight ? `${product.weight}g` : '—'}</span>;
      case 'dimensions':
        return <span className="text-sm text-gray-700">{product.dimensions || '—'}</span>;
      case 'specifications':
        if (!product.specifications?.length) return <span className="text-sm text-gray-400">—</span>;
        return (
          <div className="space-y-1">
            {product.specifications.slice(0, 5).map((spec, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-500">{spec.key}:</span>
                <span className="text-gray-800 font-medium">{spec.value}</span>
              </div>
            ))}
            {product.specifications.length > 5 && (
              <span className="text-xs text-primary">+{product.specifications.length - 5} more</span>
            )}
          </div>
        );
      case 'addToCart':
        return (product.stock === undefined || product.stock > 0) ? (
          <Button
            variant="primary-filled"
            size="sm"
            icon={<IoCart />}
            onClick={() => handleAddToCart(product)}
            fullWidth
          >
            Add to Cart
          </Button>
        ) : (
          <Button variant="primary" size="sm" disabled fullWidth>Out of Stock</Button>
        );
      case 'remove':
        return (
          <button
            onClick={() => { removeItem(product._id); toast.success('Removed from compare'); }}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors mx-auto"
          >
            <IoTrash size={14} />
            Remove
          </button>
        );
      default:
        return <span className="text-sm text-gray-400">—</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Compare Products' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length > 0
                ? `Comparing ${items.length} product${items.length > 1 ? 's' : ''}`
                : 'Add products to compare them side by side'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={() => { clearCompare(); toast.success('Compare list cleared'); }}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
            <Link to="/shop" className="flex items-center gap-1 text-sm text-primary hover:underline">
              <IoArrowBack size={14} />
              Continue Shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No products to compare</h2>
            <p className="text-gray-600 mb-6">Browse our shop and click the compare button on products you'd like to compare.</p>
            <Link to="/shop">
              <Button variant="primary-filled" icon={<IoArrowBack />}>
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {fields.map((field) => (
                    <tr key={field} className="border-b border-gray-100 last:border-0">
                      {/* Field label column */}
                      <th className="text-left py-4 px-5 bg-gray-50 font-medium text-sm text-gray-600 w-36 align-top whitespace-nowrap">
                        {fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1)}
                      </th>
                      {/* Product columns */}
                      {items.map((product) => (
                        <td
                          key={product._id}
                          className="py-4 px-5 align-top"
                          style={{ minWidth: '200px', maxWidth: '280px' }}
                        >
                          {renderFieldValue(field, product)}
                        </td>
                      ))}
                      {/* Empty slots */}
                      {Array.from({ length: Math.max(0, (compareConfig.maxItems || 4) - items.length) }).map((_, i) => (
                        <td key={`empty-${i}`} className="py-4 px-5 align-top" style={{ minWidth: '200px' }}>
                          {field === 'image' ? (
                            <Link to="/shop" className="block w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary transition-colors group">
                              <div className="text-center">
                                <div className="text-3xl text-gray-300 group-hover:text-primary transition-colors">+</div>
                                <span className="text-xs text-gray-400 group-hover:text-primary transition-colors">Add Product</span>
                              </div>
                            </Link>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
