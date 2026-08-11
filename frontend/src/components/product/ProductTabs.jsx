import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import StarRating from '../common/StarRating';
import { useProductDisplay, clampStyle } from '@/hooks/useProductDisplay';

export default function ProductTabs({ product }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('description');
  const { descriptionLines, reviewLines } = useProductDisplay('detail');

  const tabs = [
    { id: 'description', label: t('product.description') },
    { id: 'additional', label: t('product.additionalInformation') },
    { id: 'reviews', label: `${t('product.reviews')} (${product.reviewCount || 0})` },
  ];

  return (
    <div className="border-t border-gray-200 mt-12">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p style={clampStyle(descriptionLines)} className="whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="space-y-4">
            <table className="w-full">
              <tbody>
                {product.weight && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium text-gray-700 w-1/3">{t('product.weight')}</td>
                    <td className="py-3 text-gray-600">{product.weight} kg</td>
                  </tr>
                )}
                {product.dimensions && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium text-gray-700">{t('product.dimensions')}</td>
                    <td className="py-3 text-gray-600">{product.dimensions}</td>
                  </tr>
                )}
                {product.material && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium text-gray-700">{t('product.material')}</td>
                    <td className="py-3 text-gray-600">{product.material}</td>
                  </tr>
                )}
                {product.brand && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium text-gray-700">{t('product.brand')}</td>
                    <td className="py-3 text-gray-600">{product.brand}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Reviews Summary */}
            <div className="flex items-center gap-8 pb-6 border-b border-gray-200">
              <div>
                <div className="text-4xl font-bold mb-2">
                  {product.rating?.toFixed(1) || '0.0'}
                </div>
                <StarRating rating={product.rating || 0} size="lg" showCount={false} />
                <div className="text-sm text-gray-600 mt-2">
                  {t('product.basedOnReviews', { count: product.reviewCount || 0 })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{review.userName}</div>
                        <StarRating rating={review.rating} size="sm" showCount={false} />
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed" style={clampStyle(reviewLines)}>{review.comment}</p>
                    {review.isVerifiedPurchase && (
                      <span className="inline-block mt-2 text-xs text-green-600 font-medium">
                        ✓ {t('product.verifiedPurchase')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('product.noReviewsYet')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
