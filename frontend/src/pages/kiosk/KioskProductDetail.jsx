import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import { useCartStore, useCurrencyStore } from '@/store';
import KioskHeader from '@/components/kiosk/KioskHeader';
import toast from 'react-hot-toast';
import { IoAddOutline, IoRemoveOutline, IoCartOutline, IoCheckmarkCircle, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

export default function KioskProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const { formatPrice } = useCurrencyStore();

  const { data, isLoading } = useQuery(
    ['kiosk-product', slug],
    () => productsAPI.getOne(slug),
    { refetchOnWindowFocus: false }
  );
  const product = data?.data?.data;

  const [quantity, setQuantity] = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [imgIdx, setImgIdx] = useState(0);

  const images = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.featuredImage) list.push(product.featuredImage);
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && url !== product.featuredImage) list.push(url);
      });
    }
    return list;
  }, [product]);

  const attrEntries = useMemo(() => {
    if (!product) return [];
    const raw = product.attributes;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const map = typeof raw.toJSON === 'function' ? raw.toJSON() : raw;
    return Object.entries(map || {});
  }, [product]);

  const matchedVariant = useMemo(() => {
    if (!product || !Array.isArray(product.variations) || product.variations.length === 0) return null;
    const entries = Object.entries(selectedAttrs);
    if (entries.length === 0) return null;
    return product.variations.find(v => {
      const va = v.attributes || {};
      const vaJson = typeof va.toJSON === 'function' ? va.toJSON() : va;
      return entries.every(([k, val]) => String(vaJson[k]) === String(val));
    }) || null;
  }, [product, selectedAttrs]);

  if (isLoading) return <Shell><div className="p-12 text-gray-500 text-center">Loading…</div></Shell>;
  if (!product) return <Shell><div className="p-12 text-gray-500 text-center">Product not found.</div></Shell>;

  const variantPrice = matchedVariant?.salePrice || matchedVariant?.regularPrice;
  const productPrice = product.salePrice || product.regularPrice || 0;
  const displayPrice = variantPrice ?? productPrice;
  const stock = matchedVariant?.stock ?? product.stock ?? 0;
  const variantImage = matchedVariant?.image;

  const fullyConfigured = product.productType !== 'variable' || (
    attrEntries.length > 0 && attrEntries.every(([k]) => selectedAttrs[k])
  );

  const addToCart = () => {
    if (!fullyConfigured) {
      toast.error('Please choose product options first');
      return;
    }
    if (stock <= 0) {
      toast.error('This item is out of stock');
      return;
    }
    addItem(product, quantity, matchedVariant ? { attributes: selectedAttrs, variantId: matchedVariant._id, sku: matchedVariant.sku, price: variantPrice, image: variantImage } : null);
    toast.success(`${quantity} × ${product.name} added to cart`);
    navigate('/kiosk/cart');
  };

  return (
    <Shell>
      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Gallery */}
        <div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden aspect-square relative">
            {(variantImage || images[imgIdx]) ? (
              <img src={resolveUrl(variantImage || images[imgIdx])} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
            {!variantImage && images.length > 1 && (
              <>
                <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full shadow flex items-center justify-center"><IoChevronBackOutline size={28} /></button>
                <button onClick={() => setImgIdx((imgIdx + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full shadow flex items-center justify-center"><IoChevronForwardOutline size={28} /></button>
              </>
            )}
          </div>
          {!variantImage && images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto kiosk-scroll">
              {images.map((src, i) => (
                <button key={src} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${i === imgIdx ? 'border-primary' : 'border-transparent'}`}>
                  <img src={resolveUrl(src)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.brand && <div className="text-sm uppercase tracking-wider text-gray-500 mb-1">{product.brand}</div>}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          {product.shortDescription && <p className="text-gray-600 mt-3 text-lg">{product.shortDescription}</p>}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl md:text-5xl font-bold text-primary">{formatPrice(Number(displayPrice))}</span>
            {variantPrice && product.regularPrice > variantPrice && (
              <span className="text-gray-400 text-xl line-through">{formatPrice(Number(product.regularPrice))}</span>
            )}
            {!variantPrice && product.salePrice && product.salePrice < product.regularPrice && (
              <span className="text-gray-400 text-xl line-through">{formatPrice(Number(product.regularPrice))}</span>
            )}
          </div>

          {attrEntries.length > 0 && (
            <div className="mt-6 space-y-5">
              {attrEntries.map(([key, values]) => {
                const list = Array.isArray(values) ? values : [];
                return (
                  <div key={key}>
                    <div className="text-base font-semibold text-gray-800 mb-2 capitalize">{key}</div>
                    <div className="flex flex-wrap gap-2">
                      {list.map(val => {
                        const selected = selectedAttrs[key] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => setSelectedAttrs({ ...selectedAttrs, [key]: val })}
                            className={`kiosk-tile px-5 py-3 rounded-xl text-base font-medium border-2 transition ${selected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="text-base font-semibold text-gray-800">Qty</div>
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 flex items-center justify-center text-gray-700 hover:bg-gray-50"><IoRemoveOutline size={26} /></button>
              <div className="w-14 text-center text-2xl font-bold">{quantity}</div>
              <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-14 flex items-center justify-center text-gray-700 hover:bg-gray-50"><IoAddOutline size={26} /></button>
            </div>
            <div className="text-sm text-gray-500">
              {stock > 0 ? <span className="text-green-700 inline-flex items-center gap-1"><IoCheckmarkCircle /> {stock} in stock</span> : <span className="text-red-600">Out of stock</span>}
            </div>
          </div>

          <button
            onClick={addToCart}
            disabled={stock <= 0}
            className="mt-8 w-full kiosk-tile kiosk-cta-pulse flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl text-2xl font-bold shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:animate-none"
          >
            <IoCartOutline size={28} />
            Add to Cart — {formatPrice(Number(displayPrice) * quantity)}
          </button>

          {product.description && (
            <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">About this product</h3>
              <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />
      {children}
    </div>
  );
}
