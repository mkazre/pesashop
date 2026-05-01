import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reviewsAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import SmartIcon from '@/components/common/SmartIcon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StarInput({ value, onChange, size = 'lg' }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`${sz} transition-transform hover:scale-110`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <svg viewBox="0 0 20 20" fill={(hover || value) >= star ? '#f59e0b' : '#d1d5db'}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

export default function WriteReview({ productId, productName, onReviewSubmitted }) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [categoryRatings, setCategoryRatings] = useState({}); // { categoryId: rating }

  // Get review settings
  const { data: settingsData } = useQuery(
    'review-settings-public',
    () => reviewsAPI.getSettings(),
    { staleTime: 60 * 1000 }
  );
  const settings = settingsData?.data?.data || {};

  // Get review categories
  const { data: categoriesData } = useQuery(
    'review-categories-public',
    () => reviewsAPI.getCategories(),
    { staleTime: 5 * 60 * 1000 }
  );
  const reviewCategories = (categoriesData?.data?.data || []).filter(c => c.isActive);

  // Check if user can review
  const { data: canReviewData, isLoading: checkingEligibility } = useQuery(
    ['can-review', productId],
    () => reviewsAPI.canReview(productId),
    { enabled: !!productId && isAuthenticated, staleTime: 30 * 1000 }
  );
  const canReviewInfo = canReviewData?.data?.data || {};

  // Submit mutation
  const submitMutation = useMutation(
    (formData) => reviewsAPI.create(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', productId]);
        queryClient.invalidateQueries(['can-review', productId]);
        setIsOpen(false);
        setRating(0);
        setTitle('');
        setContent('');
        setImages([]);
        setPreviews([]);
        setError('');
        setCategoryRatings({});
        onReviewSubmitted?.();
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to submit review');
      }
    }
  );

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = settings.maxImages || 5;
    const maxSize = (settings.maxFileSizeMB || 5) * 1024 * 1024;

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const oversized = files.find(f => f.size > maxSize);
    if (oversized) {
      setError(`Each image must be under ${settings.maxFileSizeMB || 5}MB`);
      return;
    }

    setError('');
    const newImages = [...images, ...files];
    setImages(newImages);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, { file, url: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!rating) { setError('Please select a rating'); return; }
    const minLen = settings.minimumContentLength || 10;
    if (content.length < minLen) { setError(`Review must be at least ${minLen} characters`); return; }

    const formData = new FormData();
    formData.append('product', productId);
    formData.append('rating', rating);
    formData.append('title', title);
    formData.append('content', content);
    images.forEach(img => formData.append('images', img));

    // Category ratings
    const catRatingsArr = Object.entries(categoryRatings)
      .filter(([, r]) => r > 0)
      .map(([categoryId, rating]) => {
        const cat = reviewCategories.find(c => c._id === categoryId);
        return { categoryId, categoryName: cat?.name || '', rating };
      });
    if (catRatingsArr.length) {
      formData.append('categoryRatings', JSON.stringify(catRatingsArr));
    }

    submitMutation.mutate(formData);
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          <a href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</a> to write a review
        </p>
      </div>
    );
  }

  // Can't review (already reviewed or hasn't purchased)
  if (!checkingEligibility && !canReviewInfo.canReview) {
    if (canReviewInfo.hasReviewed) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-sm text-emerald-700">✓ You've already reviewed this product</p>
        </div>
      );
    }
    if (canReviewInfo.reason === 'not_delivered') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-700">📦 You can review this product once your order has been delivered</p>
        </div>
      );
    }
    if (canReviewInfo.reason === 'not_purchased') {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">🛒 Purchase this product to leave a review</p>
        </div>
      );
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
      >
        ✍️ Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Write a Review</h4>
        <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating *</label>
        <div className="flex items-center gap-3">
          <StarInput value={rating} onChange={setRating} />
          {rating > 0 && <span className="text-sm font-medium text-amber-600">{RATING_LABELS[rating]}</span>}
        </div>
      </div>

      {/* Category Ratings (optional) */}
      {reviewCategories.length > 0 && (
        <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Optional: Rate specific aspects
          </p>
          {reviewCategories.map(cat => (
            <div key={cat._id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                {cat.icon && <SmartIcon value={cat.icon} size={14} />}
                <span className="text-sm text-gray-700 truncate">{cat.name}</span>
              </div>
              <StarInput
                value={categoryRatings[cat._id] || 0}
                onChange={(v) => setCategoryRatings(prev => ({ ...prev, [cat._id]: v }))}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={120}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell others about your experience with this product..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{content.length} / {settings.minimumContentLength || 10} min characters</p>
      </div>

      {/* Image Upload */}
      {settings.allowImages !== false && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos <span className="text-gray-400 font-normal">(up to {settings.maxImages || 5}, max {settings.maxFileSizeMB || 5}MB each)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {previews.map((preview, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={preview.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {images.length < (settings.maxImages || 5) && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="text-[10px] mt-0.5">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitMutation.isLoading}
          className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitMutation.isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Submitting...
            </span>
          ) : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
