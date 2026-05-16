import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { visualSearchAPI } from '../services/api';

const SmartBundle = ({ productId, onAddBundle }) => {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    visualSearchAPI.bundleForProduct(productId)
      .then(res => setBundle(res.data.data))
      .catch(() => setBundle(null))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || !bundle?.bundle?.items?.length) return null;

  const b = bundle.bundle;
  const subtotal = b.subtotal ?? b.items.reduce((s, it) => s + ((it.salePrice || it.price || it.product?.salePrice || it.product?.price || 0) * (it.quantity || 1)), 0);
  const total = b.discountedTotal ?? (b.discountType === 'percent' ? subtotal * (1 - (b.discountValue || 0) / 100) : Math.max(0, subtotal - (b.discountValue || 0)));
  const save = subtotal - total;

  return (
    <div className="border-2 border-blue-200 rounded-lg bg-blue-50 p-4 my-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-blue-700">{b.name || 'Complete the look'}</h3>
          {bundle.type === 'ai' && <p className="text-xs text-blue-500">AI-curated bundle</p>}
        </div>
        {save > 0 && <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Save R {save.toFixed(2)}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {b.items.map((it, i) => {
          const prod = it.product || it;
          const img = (prod.images && (prod.images[0]?.url || prod.images[0])) || '';
          return (
            <Link key={i} to={`/product/${prod.slug}`} className="bg-white border rounded p-2 text-center hover:shadow">
              {img && <img src={img} alt={prod.name} className="w-full aspect-square object-cover rounded" />}
              <p className="text-xs mt-1 line-clamp-2">{prod.name}</p>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <p className="text-xs text-gray-500"><span className="line-through">R {subtotal.toFixed(2)}</span></p>
          <p className="text-lg font-bold text-blue-700">R {total.toFixed(2)}</p>
        </div>
        {onAddBundle && (
          <button onClick={() => onAddBundle(b)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold">Add all to cart</button>
        )}
      </div>
    </div>
  );
};

export default SmartBundle;
