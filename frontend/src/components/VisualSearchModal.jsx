import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { visualSearchAPI } from '../services/api';
import { useCurrencyStore } from '@/store';

const VisualSearchModal = ({ open, onClose }) => {
  const { formatPrice } = useCurrencyStore();
  const [results, setResults] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const fileRef = useRef(null);

  if (!open) return null;

  const reset = () => { setResults([]); setDescription(''); setQuery(''); };

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await visualSearchAPI.byImage(formData);
      setDescription(res.data.data.description);
      setResults(res.data.data.results || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  const handleText = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await visualSearchAPI.byText(query);
      setResults(res.data.data || []);
      setDescription('');
    } catch (e) {
      alert(e.response?.data?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full mt-10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">Find products by photo or description</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="border-2 border-gray-300 rounded flex-1 p-2 focus:border-primary focus:outline-none transition-colors"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleText()}
            />
            <button
              onClick={handleText}
              disabled={loading}
              className="px-5 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Search
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">or</p>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            <p className="text-gray-500">📸 Click to upload a photo</p>
            <p className="text-xs text-gray-400 mt-1">On mobile, this opens your camera.</p>
          </div>
        </div>

        {loading && <p className="text-center p-4 text-gray-500">Searching...</p>}

        {description && (
          <div className="px-4 py-2 bg-primary/10 text-sm text-primary">
            <strong>We see:</strong> {description}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {results.map(p => (
              <Link key={p._id} to={`/product/${p.slug}`} onClick={() => { reset(); onClose(); }} className="block border rounded hover:shadow-md transition">
                {p.images?.[0] && <img src={p.images[0].url || p.images[0]} alt={p.name} className="w-full aspect-square object-cover" />}
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-primary">{formatPrice(p.salePrice || p.price)}</span>
                    {p.salePrice && p.price && p.salePrice < p.price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</span>
                    )}
                  </div>
                  {p.similarity > 0 && <p className="text-xs text-primary mt-1">{Math.round(p.similarity * 100)}% match</p>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (query || description) && (
          <div className="text-center p-8 text-gray-500">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">No matching products yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              We're still indexing your catalogue. Try again in a few minutes, or use the regular search above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualSearchModal;
