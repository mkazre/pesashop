import { useState } from 'react';
import { IoClose, IoCartOutline } from 'react-icons/io5';
import { useUIStore, useCartStore } from '@/store';
import StarRating from '../common/StarRating';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { VariantSelector, QuantitySelector } from '../product/ProductVariants';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useProductDisplay, clampStyle } from '@/hooks/useProductDisplay';

export default function QuickViewModal() {
  const { quickViewProduct, closeQuickView } = useUIStore();
  const { addItem, openCartSidebar } = useCartStore();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const { titleLines, shortDescriptionLines } = useProductDisplay('other');
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const discount = product.salePrice 
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    const variant = selectedSize || selectedColor ? { size: selectedSize, color: selectedColor } : null;
    addItem(product, quantity, variant);
    toast.success('Added to cart!');
    closeQuickView();
    openCartSidebar();
  };

  // Extract unique sizes and colors from variants if available
  const sizes = product.variants?.map(v => v.size).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) || [];
  const colors = product.variants?.map(v => v.color).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) || [];

  return (
    <div className="modal-overlay" onClick={closeQuickView}>
      <div 
        className="modal-content max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white">
          {/* Close Button */}
          <button
            onClick={closeQuickView}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white hover:bg-gray-100 flex items-center justify-center shadow-md"
          >
            <IoClose size={24} />
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Left: Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-gray-100 aspect-square">
                <img
                  src={product.images?.[selectedImage] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.salePrice && <Badge variant="sale">SALES</Badge>}
                  {product.isNew && <Badge variant="new">NEW</Badge>}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-gray-100 border-2 overflow-hidden ${
                        index === selectedImage ? 'border-primary' : 'border-gray-200'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900" style={clampStyle(titleLines)}>{product.name}</h2>

              <StarRating rating={product.rating || 0} count={product.reviewCount || 0} />

              {/* Price */}
              <div className="flex items-center gap-3 py-4 border-y border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  R{product.salePrice || product.regularPrice}
                </div>
                {product.salePrice && (
                  <>
                    <div className="text-lg text-gray-400 line-through">
                      R{product.regularPrice}
                    </div>
                    <Badge variant="sale">{discount}% OFF</Badge>
                  </>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Stock Status:</span>
                {product.stock > 0 ? (
                  <span className="text-green-600">In Stock</span>
                ) : (
                  <span className="text-red-600">Out of Stock</span>
                )}
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-gray-600 text-sm" style={clampStyle(shortDescriptionLines)}>{product.shortDescription}</p>
              )}

              {/* Color Selector */}
              {colors.length > 0 && (
                <VariantSelector
                  variants={colors}
                  selectedVariant={selectedColor}
                  onSelect={setSelectedColor}
                  type="color"
                />
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <VariantSelector
                  variants={sizes}
                  selectedVariant={selectedSize}
                  onSelect={setSelectedSize}
                  type="size"
                />
              )}

              {/* Quantity */}
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                stock={product.stock}
              />

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary-filled"
                  fullWidth
                  icon={<IoCartOutline size={20} />}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </Button>
                <Link to={`/product/${product._id}`} onClick={closeQuickView}>
                  <Button variant="primary" fullWidth>
                    View Details
                  </Button>
                </Link>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-gray-600 space-y-1 pt-4 border-t border-gray-200">
                {product.sku && <div>SKU: {product.sku}</div>}
                {product.categories && (
                  <div>Categories: {product.categories.map(c => c.name).join(', ')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
