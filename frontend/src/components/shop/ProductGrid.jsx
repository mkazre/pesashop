import ProductCard from '../common/ProductCard';
import Loading from '../common/Loading';

export default function ProductGrid({ products, isLoading, layout = 'grid' }) {
  if (isLoading) {
    return <Loading text="Loading products..." />;
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} layout="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
