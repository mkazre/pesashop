import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKioskConfig } from '@/hooks/useKioskConfig';
import { useOrientation } from '@/hooks/useOrientation';
import { useCurrencyStore } from '@/store';
import KioskHeader from '@/components/kiosk/KioskHeader';
import { resolveUrl } from '@/utils/kioskUrl';

export default function KioskHome() {
  const navigate = useNavigate();
  const { config, isLoading } = useKioskConfig();
  const orientation = useOrientation();
  const { formatPrice } = useCurrencyStore();

  const featuredCategories = config?.featuredCategories || [];
  const featuredProducts = config?.featuredProducts || [];

  const tileGridCols = orientation === 'portrait'
    ? 'grid-cols-2'
    : (featuredCategories.length > 6 ? 'grid-cols-4 lg:grid-cols-5' : 'grid-cols-3 lg:grid-cols-4');

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-[1800px] mx-auto w-full">
        <section className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
            {config?.welcomeHeading || 'Welcome to PESA Shop'}
          </h2>
          <p className="text-base md:text-lg text-gray-500">
            {config?.welcomeSubheading || 'Choose a category to start browsing'}
          </p>
        </section>

        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Browse Categories</h3>
            <button onClick={() => navigate('/kiosk/shop')} className="text-base text-primary font-medium underline-offset-4 hover:underline">
              View all
            </button>
          </div>

          {isLoading ? (
            <div className="text-gray-500 py-12 text-center">Loading…</div>
          ) : featuredCategories.length === 0 ? (
            <div className="text-gray-500 py-12 text-center bg-white rounded-2xl shadow-sm">
              No featured categories yet — pick some from the admin panel under Digital Kiosks → Featured Content.
              <div className="mt-4">
                <button onClick={() => navigate('/kiosk/shop')} className="px-6 py-3 bg-primary text-white rounded-xl text-base font-semibold">
                  Browse all products
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid ${tileGridCols} gap-4 md:gap-6`}>
              {featuredCategories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => navigate(`/kiosk/shop/${cat.slug || cat._id}`)}
                  className="kiosk-tile relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl text-left aspect-[4/3]"
                >
                  {cat.bannerImage || cat.image ? (
                    <img src={resolveUrl(cat.bannerImage || cat.image)} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <div className="text-white text-2xl md:text-3xl font-bold leading-tight">{cat.name}</div>
                    {typeof cat.productCount === 'number' && (
                      <div className="text-white/80 text-sm mt-1">{cat.productCount} products</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Featured Products</h3>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto kiosk-scroll pb-3 -mx-2 px-2">
              {featuredProducts.map(p => (
                <button
                  key={p._id}
                  onClick={() => navigate(`/kiosk/product/${p.slug || p._id}`)}
                  className="kiosk-tile flex-shrink-0 w-64 md:w-72 bg-white rounded-2xl shadow-md overflow-hidden text-left"
                >
                  <div className="h-56 md:h-64 bg-white flex items-center justify-center p-4">
                    {p.featuredImage ? (
                      <img src={resolveUrl(p.featuredImage)} alt={p.name} className="max-w-full max-h-full object-contain" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2">{p.name}</div>
                    <div className="mt-2 text-primary font-bold text-lg">
                      {formatPrice(p.salePrice || p.regularPrice || 0)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
