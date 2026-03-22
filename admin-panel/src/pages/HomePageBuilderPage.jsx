import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from '@/utils/toast';
import {
  IoAdd, IoTrash, IoChevronUp, IoChevronDown, IoEye, IoEyeOff,
  IoSettings, IoClose, IoSave, IoRefresh, IoCopy, IoImage,
  IoReorderThree, IoChevronForward, IoHome, IoLayers,
  IoDesktop, IoTabletPortrait, IoPhonePortrait, IoGlobe, IoApps
} from 'react-icons/io5';
import { homePageConfigAPI, imagesAPI, pageTemplatesAPI } from '../services/api';
import { useAuthStore } from '@/store';

const BADGE_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// ── Block type definitions ──────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'hero-slider-full', label: 'Hero Slider (Full Width)', icon: '🖼️', category: 'Hero' },
  { type: 'hero-slider-with-side-banner', label: 'Hero Slider + Side Banner', icon: '📐', category: 'Hero' },
  { type: 'banner-grid-3col', label: 'Banner Grid (3 Columns)', icon: '🏷️', category: 'Banners' },
  { type: 'banner-full-width', label: 'Banner (Full Width)', icon: '🖼️', category: 'Banners' },
  { type: 'banner-grid-2col', label: 'Banner Grid (2 Columns)', icon: '📰', category: 'Banners' },
  { type: 'product-grid-tabs', label: 'Product Grid with Tabs', icon: '🛍️', category: 'Products' },
  { type: 'product-carousel-tabs', label: 'Product Carousel with Tabs', icon: '🎠', category: 'Products' },
  { type: 'deals-of-the-day', label: 'Deals of the Day', icon: '🔥', category: 'Products' },
  { type: 'product-columns-grid', label: 'Product Columns (4-col)', icon: '📊', category: 'Products' },
  { type: 'category-carousel', label: 'Category Carousel', icon: '📂', category: 'Categories' },
  { type: 'feature-icons-row', label: 'Feature Icons Row', icon: '✨', category: 'Other' },
  { type: 'spacer', label: 'Spacer', icon: '↕️', category: 'Other' },
  { type: 'rich-text', label: 'Rich Text', icon: '📝', category: 'Other' },
  { type: 'custom-html', label: 'Custom HTML', icon: '🧩', category: 'Other' },
  { type: 'custom-template', label: 'Page Builder Template', icon: '🎨', category: 'Templates' },
  { type: 'banner-slider-carousel', label: 'Banner Slider Carousel', icon: '🎞️', category: 'Banners' },
  { type: 'coupon-carousel', label: 'Coupon / Offer Carousel', icon: '🎟️', category: 'Promotions' },
  { type: 'product-with-deal-sidebar', label: 'Products + Deal Sidebar', icon: '🔥', category: 'Products' },
  { type: 'offer-strip', label: 'Offer Strip / Marquee', icon: '📢', category: 'Promotions' },
  { type: 'blog-carousel', label: 'Blog / Articles Carousel', icon: '📰', category: 'Content' },
  { type: 'newsletter', label: 'Newsletter Subscribe', icon: '✉️', category: 'Content' },
  { type: 'category-grid', label: 'Category Grid (Image Cards)', icon: '🗂️', category: 'Categories' },
  { type: 'product-vertical-tabs', label: 'Product Vertical List (Tabs)', icon: '📋', category: 'Products' },
  { type: 'image-text-cta', label: 'Image + Text CTA Banner', icon: '🖼️', category: 'Banners' },
];

const BLOCK_CATEGORIES = ['Hero', 'Banners', 'Products', 'Categories', 'Promotions', 'Content', 'Templates', 'Other'];

// ── Default block settings ──────────────────────────────────────────
function getDefaultBlock(blockType) {
  const base = {
    blockType,
    enabled: true,
    order: 0,
    sectionTitle: '',
    sectionSubtitle: '',
    showSectionTitle: true,
    viewAllLink: '/shop',
    viewAllText: 'View All',
    showViewAll: false,
    containerWidth: 'contained',
    backgroundColor: '',
    paddingTop: '40px',
    paddingBottom: '40px',
  };

  switch (blockType) {
    case 'hero-slider-full':
      return {
        ...base,
        showSectionTitle: false,
        slides: [
          { image: '', heading: 'Welcome to Our Store', subtitle: 'Shop the best deals', buttonText: 'Shop Now', buttonLink: '/shop', overlayColor: 'rgba(0,0,0,0.3)', textColor: '#ffffff', textAlign: 'left' }
        ],
        sliderAutoplay: true,
        sliderSpeed: 5000,
        sliderEffect: 'slide',
        sliderHeight: '450px',
        sliderBorderRadius: '12px',
        showArrows: true,
        showDots: true,
      };
    case 'hero-slider-with-side-banner':
      return {
        ...base,
        showSectionTitle: false,
        slides: [
          { image: '', heading: 'Amazing Deals', subtitle: 'Save up to 50%', buttonText: 'Shop Now', buttonLink: '/shop', overlayColor: 'rgba(0,0,0,0.3)', textColor: '#ffffff', textAlign: 'left' }
        ],
        sliderAutoplay: true,
        sliderSpeed: 5000,
        sliderEffect: 'fade',
        sliderHeight: '450px',
        sliderBorderRadius: '12px',
        showArrows: true,
        showDots: true,
        sideBannerImage: '',
        sideBannerHeading: 'Delivered to your home',
        sideBannerButtonText: 'Shop Now',
        sideBannerButtonLink: '/shop',
        sideBannerTextColor: '#333333',
      };
    case 'banner-grid-3col':
      return {
        ...base,
        showSectionTitle: false,
        banners: [
          { image: '', heading: 'Fresh & Clean Products', subtitle: '', label: '', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Healthy Breakfast', subtitle: '', label: '', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Best Products Online', subtitle: '', label: '', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
        ],
      };
    case 'banner-full-width':
      return {
        ...base,
        showSectionTitle: false,
        banners: [
          { image: '', heading: 'Big Sale Up to 40%', subtitle: 'Shop Today\'s Deals', label: '', buttonText: 'Learn More', buttonLink: '/shop', textColor: '#333333' }
        ],
      };
    case 'banner-grid-2col':
      return {
        ...base,
        showSectionTitle: false,
        banners: [
          { image: '', heading: 'Save 17% on Autumn Collection', subtitle: '', label: 'Accessories', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Save 20% on Winter Items', subtitle: '', label: 'Big Offer', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Smart Deals Everyday', subtitle: '', label: 'Smart Offer', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
        ],
      };
    case 'product-grid-tabs':
      return {
        ...base,
        sectionTitle: 'Popular Products',
        tabs: [
          { label: 'All', source: 'all', categoryId: '' },
          { label: 'Featured', source: 'featured', categoryId: '' },
          { label: 'On Sale', source: 'sale', categoryId: '' },
        ],
        productLimit: 10,
        productColumns: 5,
        showAddToCart: true,
        showWishlist: true,
        showRating: true,
      };
    case 'product-carousel-tabs':
      return {
        ...base,
        sectionTitle: 'Daily Best Sells',
        showViewAll: true,
        tabs: [
          { label: 'Featured', source: 'featured', categoryId: '' },
          { label: 'Best Selling', source: 'best-selling', categoryId: '' },
          { label: 'Newest', source: 'newest', categoryId: '' },
        ],
        productLimit: 10,
        showAddToCart: true,
        showWishlist: true,
        showRating: true,
      };
    case 'deals-of-the-day':
      return {
        ...base,
        sectionTitle: 'Deals of the Day',
        showViewAll: true,
        viewAllText: 'All Deals',
        productSource: 'sale',
        productLimit: 4,
        dealsEndDate: '',
        showCountdown: true,
        showAddToCart: true,
        showRating: true,
      };
    case 'product-columns-grid':
      return {
        ...base,
        showSectionTitle: false,
        columns: [
          { title: 'Top Selling', source: 'best-selling', categoryId: '', limit: 3 },
          { title: 'Trending', source: 'trending', categoryId: '', limit: 3 },
          { title: 'Recently Added', source: 'newest', categoryId: '', limit: 3 },
          { title: 'Top Rated', source: 'top-rated', categoryId: '', limit: 3 },
        ],
      };
    case 'category-carousel':
      return {
        ...base,
        sectionTitle: 'Shop by Categories',
        showViewAll: true,
        viewAllText: 'All Categories',
        categorySource: 'all',
        categoryIds: [],
        categoryLimit: 10,
        categoryColumns: 10,
        showCategoryProductCount: true,
      };
    case 'feature-icons-row':
      return {
        ...base,
        showSectionTitle: false,
        features: [
          { icon: '🚚', iconImage: '', title: 'Free Shipping', subtitle: 'Orders over R500', color: '#1b5e35' },
          { icon: '🛒', iconImage: '', title: 'Online Order', subtitle: 'Easy & Fast', color: '#e8a317' },
          { icon: '💰', iconImage: '', title: 'Save Money', subtitle: 'Best Prices', color: '#d32f2f' },
          { icon: '🎁', iconImage: '', title: 'Promotions', subtitle: 'Daily Deals', color: '#7b1fa2' },
          { icon: '😊', iconImage: '', title: 'Happy Sell', subtitle: 'Satisfaction Guaranteed', color: '#0288d1' },
          { icon: '🎧', iconImage: '', title: '24/7 Support', subtitle: 'Always Here', color: '#388e3c' },
        ],
      };
    case 'spacer':
      return { ...base, showSectionTitle: false, spacerHeight: '40px' };
    case 'rich-text':
      return { ...base, showSectionTitle: false, content: '<p>Your content here</p>' };
    case 'custom-html':
      return { ...base, showSectionTitle: false, content: '' };
    case 'custom-template':
      return { ...base, showSectionTitle: false, templateId: '' };
    case 'banner-slider-carousel':
      return {
        ...base,
        sectionTitle: '',
        showSectionTitle: false,
        banners: [
          { image: '', heading: '50% Discount', label: 'Summer Sale', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Today Special', label: 'Fresh Arrivals', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Combo Offer', label: 'Save More', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
          { image: '', heading: 'Amazing Deals', label: 'Limited Time', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' },
        ],
        slidesToShow: 4,
        autoplay: true,
        autoplaySpeed: 4000,
        bannerHeight: '200px',
        bannerBorderRadius: '12px',
      };
    case 'coupon-carousel':
      return {
        ...base,
        sectionTitle: 'Coupons & Offers',
        coupons: [
          { title: 'GET 10% OFF', description: 'When you spend R500', validText: 'Valid for 30 days', code: 'PESA10', bgColor: '#0F604B', textColor: '#ffffff' },
          { title: 'GET 15% OFF', description: 'First order discount', validText: 'Valid for 7 days', code: 'WELCOME15', bgColor: '#e8a317', textColor: '#ffffff' },
          { title: 'FREE DELIVERY', description: 'On orders over R300', validText: 'This weekend only', code: 'FREEDELIVERY', bgColor: '#d32f2f', textColor: '#ffffff' },
        ],
        slidesToShow: 3,
        autoplay: true,
      };
    case 'product-with-deal-sidebar':
      return {
        ...base,
        sectionTitle: 'Top Selling Items',
        productSource: 'best-selling',
        productLimit: 10,
        showAddToCart: true,
        showWishlist: true,
        showRating: true,
        dealEnabled: true,
        dealTitle: 'Special Offer',
        dealBadgeText: 'Hot Deal',
        dealProductSource: 'featured',
        showCountdown: true,
        dealsEndDate: '',
        dealPosition: 'right',
      };
    case 'offer-strip':
      return {
        ...base,
        showSectionTitle: false,
        stripText: 'FREE GIFT ON EVERY ORDER',
        highlightText: '70% OFF',
        stripBgColor: '#0F604B',
        stripTextColor: '#ffffff',
        stripHighlightColor: '#f7bd20',
        stripFontSize: '18px',
        stripLink: '/shop',
        enableMarquee: false,
        marqueeSpeed: 30,
      };
    case 'blog-carousel':
      return {
        ...base,
        sectionTitle: 'Latest Articles',
        sectionSubtitle: 'From our blog',
        blogSource: 'latest',
        blogLimit: 6,
        slidesToShow: 3,
        showDate: true,
        showExcerpt: true,
        showReadMore: true,
        cardBorderRadius: '12px',
      };
    case 'newsletter':
      return {
        ...base,
        showSectionTitle: false,
        heading: 'Join Our Newsletter',
        subtitle: 'Subscribe to get special offers, free giveaways, and amazing deals.',
        placeholder: 'Enter your email address',
        buttonText: 'Subscribe',
        bgColor: '#0F604B',
        textColor: '#ffffff',
        buttonBgColor: '#f7bd20',
        buttonTextColor: '#333333',
        bgImage: '',
        showIcon: true,
      };
    case 'category-grid':
      return {
        ...base,
        sectionTitle: 'Shop By Categories',
        categorySource: 'all',
        categoryLimit: 8,
        columns: 4,
        showProductCount: true,
        showImage: true,
        cardStyle: 'card',
        cardBorderRadius: '12px',
        imageHeight: '180px',
      };
    case 'product-vertical-tabs':
      return {
        ...base,
        sectionTitle: 'Browse Products',
        tabs: [
          { label: 'Best Selling', source: 'best-selling', categoryId: '' },
          { label: 'Trending', source: 'trending', categoryId: '' },
          { label: 'Recently Added', source: 'newest', categoryId: '' },
        ],
        productLimit: 4,
        showPrice: true,
        showRating: true,
        showImage: true,
        layout: 'horizontal',
      };
    case 'image-text-cta':
      return {
        ...base,
        showSectionTitle: false,
        mainImage: '',
        sideImage: '',
        heading: 'Safe Delivery to Your Door',
        description: 'Fast, reliable and safe delivery right to your doorstep.',
        bulletPoints: ['Get live order tracking', 'Fast & secure checkout', 'Easy returns & refunds'],
        buttonText: 'Learn More',
        buttonLink: '/about',
        layout: '8-4',
        textPosition: 'right',
        textColor: '#333333',
      };
    default:
      return base;
  }
}

// ── Image upload helper ─────────────────────────────────────────────
function ImageUploadField({ value, onChange, label }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await imagesAPI.upload(file);
      onChange(res.data?.data?.url || res.data?.url || '');
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative w-20 h-14 rounded border overflow-hidden flex-shrink-0">
            <img src={value.startsWith('http') ? value : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${value}`} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onChange('')} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><IoClose size={10} /></button>
          </div>
        ) : (
          <div className="w-20 h-14 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 flex-shrink-0">
            <IoImage size={20} />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          {uploading ? 'Uploading...' : value ? 'Change' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {value && (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full text-xs px-2 py-1 border rounded" placeholder="Or paste URL" />
      )}
    </div>
  );
}

// ── Overlay control (color picker + opacity slider + preview) ────────
function OverlayControl({ color, opacity, onColorChange, onOpacityChange }) {
  const c = color || '#000000';
  const o = opacity ?? 0;
  // Convert hex + opacity% to rgba for preview
  const r = parseInt(c.slice(1, 3), 16) || 0;
  const g = parseInt(c.slice(3, 5), 16) || 0;
  const b = parseInt(c.slice(5, 7), 16) || 0;
  const rgba = `rgba(${r},${g},${b},${o / 100})`;

  return (
    <div className="space-y-2 p-3 bg-white border rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600">Image Overlay</label>
        <div
          className="w-16 h-5 rounded border border-gray-300"
          style={{ background: `linear-gradient(${rgba}, ${rgba}), repeating-conic-gradient(#d4d4d4 0% 25%, white 0% 50%) 50% / 8px 8px` }}
          title={`${c} @ ${o}%`}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={c}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-8 h-8 rounded border-0 cursor-pointer flex-shrink-0"
          title="Overlay color"
        />
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={o}
            onChange={(e) => onOpacityChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>
        <span className="text-xs text-gray-500 w-10 text-right font-mono">{o}%</span>
      </div>
      <p className="text-[10px] text-gray-400">0% = no overlay · 100% = solid color</p>
    </div>
  );
}

// ── Slide editor (for hero sliders) ─────────────────────────────────
function SlideEditor({ slide, index, onChange, onRemove }) {
  const update = (key, val) => onChange({ ...slide, [key]: val });
  return (
    <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Slide {index + 1}</span>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
      </div>
      <ImageUploadField label="Background Image" value={slide.image || ''} onChange={(v) => update('image', v)} />
      <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Heading" value={slide.heading || ''} onChange={(e) => update('heading', e.target.value)} />
      <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Subtitle" value={slide.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="text-sm px-3 py-2 border rounded" placeholder="Button Text" value={slide.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} />
        <input className="text-sm px-3 py-2 border rounded" placeholder="Button Link" value={slide.buttonLink || ''} onChange={(e) => update('buttonLink', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Text Color</label>
          <input type="color" value={slide.textColor || '#ffffff'} onChange={(e) => update('textColor', e.target.value)} className="w-full h-8 rounded" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Text Align</label>
          <select value={slide.textAlign || 'left'} onChange={(e) => update('textAlign', e.target.value)} className="w-full text-xs px-2 py-1.5 border rounded">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      <OverlayControl
        color={slide.overlayColor}
        opacity={slide.overlayOpacity}
        onColorChange={(v) => update('overlayColor', v)}
        onOpacityChange={(v) => update('overlayOpacity', v)}
      />
    </div>
  );
}

// ── Banner item editor ──────────────────────────────────────────────
function BannerItemEditor({ banner, index, onChange, onRemove, showRemove }) {
  const update = (key, val) => onChange({ ...banner, [key]: val });
  return (
    <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Banner {index + 1}</span>
        {showRemove && <button onClick={onRemove} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>}
      </div>
      <ImageUploadField label="Image" value={banner.image || ''} onChange={(v) => update('image', v)} />
      <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Heading" value={banner.heading || ''} onChange={(e) => update('heading', e.target.value)} />
      <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Label / Tag" value={banner.label || ''} onChange={(e) => update('label', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="text-sm px-3 py-2 border rounded" placeholder="Button Text" value={banner.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} />
        <input className="text-sm px-3 py-2 border rounded" placeholder="Button Link" value={banner.buttonLink || ''} onChange={(e) => update('buttonLink', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500">Text Color</label>
        <input type="color" value={banner.textColor || '#333333'} onChange={(e) => update('textColor', e.target.value)} className="w-full h-8 rounded" />
      </div>
      <OverlayControl
        color={banner.overlayColor}
        opacity={banner.overlayOpacity}
        onColorChange={(v) => update('overlayColor', v)}
        onOpacityChange={(v) => update('overlayOpacity', v)}
      />
    </div>
  );
}

// ── Tab item editor ─────────────────────────────────────────────────
function TabItemEditor({ tab, index, onChange, onRemove, showRemove }) {
  const update = (key, val) => onChange({ ...tab, [key]: val });
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
      <input className="flex-1 text-sm px-2 py-1 border rounded" placeholder="Tab Label" value={tab.label || ''} onChange={(e) => update('label', e.target.value)} />
      <select value={tab.source || 'all'} onChange={(e) => update('source', e.target.value)} className="text-sm px-2 py-1 border rounded">
        <option value="all">All</option>
        <option value="featured">Featured</option>
        <option value="sale">On Sale</option>
        <option value="newest">Newest</option>
        <option value="best-selling">Best Selling</option>
        <option value="most-viewed">Most Viewed</option>
        <option value="top-rated">Top Rated</option>
        <option value="trending">Trending</option>
        <option value="category">Category</option>
      </select>
      {tab.source === 'category' && (
        <input className="w-32 text-xs px-2 py-1 border rounded" placeholder="Category ID" value={tab.categoryId || ''} onChange={(e) => update('categoryId', e.target.value)} />
      )}
      {showRemove && <button onClick={onRemove} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>}
    </div>
  );
}

// ── Feature item editor ─────────────────────────────────────────────
function FeatureItemEditor({ feature, index, onChange, onRemove }) {
  const update = (key, val) => onChange({ ...feature, [key]: val });
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
      <input className="w-12 text-center text-lg px-1 py-1 border rounded" value={feature.icon || ''} onChange={(e) => update('icon', e.target.value)} title="Emoji icon" />
      <input className="flex-1 text-sm px-2 py-1 border rounded" placeholder="Title" value={feature.title || ''} onChange={(e) => update('title', e.target.value)} />
      <input className="flex-1 text-sm px-2 py-1 border rounded" placeholder="Subtitle" value={feature.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} />
      <input type="color" value={feature.color || '#1b5e35'} onChange={(e) => update('color', e.target.value)} className="w-8 h-8 rounded border-0" />
      <button onClick={onRemove} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
    </div>
  );
}

// ── Column editor (for product-columns-grid) ────────────────────────
function ColumnEditor({ column, index, onChange, onRemove }) {
  const update = (key, val) => onChange({ ...column, [key]: val });
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
      <input className="flex-1 text-sm px-2 py-1 border rounded" placeholder="Column Title" value={column.title || ''} onChange={(e) => update('title', e.target.value)} />
      <select value={column.source || 'newest'} onChange={(e) => update('source', e.target.value)} className="text-sm px-2 py-1 border rounded">
        <option value="best-selling">Best Selling</option>
        <option value="trending">Trending</option>
        <option value="most-viewed">Most Viewed</option>
        <option value="newest">Newest</option>
        <option value="top-rated">Top Rated</option>
        <option value="featured">Featured</option>
        <option value="sale">On Sale</option>
        <option value="category">Category</option>
      </select>
      <input type="number" min={1} max={6} className="w-16 text-sm px-2 py-1 border rounded" value={column.limit || 3} onChange={(e) => update('limit', parseInt(e.target.value) || 3)} />
      <button onClick={onRemove} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
    </div>
  );
}

// ── Badge picker for product blocks ─────────────────────────────────
function BadgePicker({ selectedIds = [], onChange }) {
  const token = useAuthStore?.getState?.()?.token;
  const { data: badgesData } = useQuery('allBadgesForPicker', async () => {
    const res = await fetch(`${BADGE_API}/badges?limit=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  }, { staleTime: 5 * 60 * 1000 });

  const badges = badgesData || [];

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(b => b !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (!badges.length) return <p className="text-xs text-gray-400">No badges found. Create badges in Badge Manager first.</p>;

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {badges.map(badge => (
        <label key={badge._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={selectedIds.includes(badge._id)}
            onChange={() => toggle(badge._id)}
            className="rounded"
          />
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: badge.style?.backgroundColor || '#0F604B',
              color: badge.style?.textColor || '#fff',
            }}
          >
            {badge.name}
          </span>
        </label>
      ))}
    </div>
  );
}

// ── Color input helper ──────────────────────────────────────────────
function ColorField({ label, value, onChange, placeholder = '#0F604B' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input type="color" value={value || placeholder} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 text-xs px-2 py-1.5 border rounded" placeholder={placeholder} />
      </div>
    </div>
  );
}

// ── Template picker (for custom-template block) ─────────────────────
function TemplatePicker({ value, onChange }) {
  const { data: templatesData, isLoading } = useQuery('allTemplatesForPicker', async () => {
    const res = await pageTemplatesAPI.getAll({ limit: 100 });
    return res.data?.data?.templates || res.data?.data || res.data?.templates || [];
  }, { staleTime: 30 * 1000 });

  const templates = (templatesData || []).filter(t => t.isPublished);

  return (
    <div className="space-y-3 pb-4 border-b">
      <h4 className="text-sm font-semibold text-gray-700">Page Builder Template</h4>
      <p className="text-xs text-gray-400">Select a template created in the Page Manager to embed it as a block on the home page.</p>
      {isLoading ? (
        <div className="text-xs text-gray-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-xs text-gray-400">No published templates found. Create and publish a template in the Page Manager first.</div>
      ) : (
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded"
          >
            <option value="">— Select a template —</option>
            {templates.map(t => (
              <option key={t._id} value={t.slug}>{t.name} ({t.templateType})</option>
            ))}
          </select>
          {value && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
              <span className="text-lg">🎨</span>
              <span>Template slug: <strong>{value}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Block settings panel ────────────────────────────────────────────
function BlockSettingsPanel({ block, onChange }) {
  const update = (key, val) => onChange({ ...block, [key]: val });
  const blockDef = BLOCK_TYPES.find(b => b.type === block.blockType);

  const updateSlide = (i, slide) => {
    const slides = [...(block.slides || [])];
    slides[i] = slide;
    update('slides', slides);
  };
  const removeSlide = (i) => {
    const slides = [...(block.slides || [])];
    slides.splice(i, 1);
    update('slides', slides);
  };
  const addSlide = () => {
    update('slides', [...(block.slides || []), { image: '', heading: '', subtitle: '', buttonText: 'Shop Now', buttonLink: '/shop', overlayColor: 'rgba(0,0,0,0.3)', textColor: '#ffffff', textAlign: 'left' }]);
  };

  const updateBanner = (i, banner) => {
    const banners = [...(block.banners || [])];
    banners[i] = banner;
    update('banners', banners);
  };
  const removeBanner = (i) => {
    const banners = [...(block.banners || [])];
    banners.splice(i, 1);
    update('banners', banners);
  };
  const addBanner = () => {
    update('banners', [...(block.banners || []), { image: '', heading: '', subtitle: '', label: '', buttonText: 'Shop Now', buttonLink: '/shop', textColor: '#333333' }]);
  };

  const updateTab = (i, tab) => {
    const tabs = [...(block.tabs || [])];
    tabs[i] = tab;
    update('tabs', tabs);
  };
  const removeTab = (i) => {
    const tabs = [...(block.tabs || [])];
    tabs.splice(i, 1);
    update('tabs', tabs);
  };
  const addTab = () => {
    update('tabs', [...(block.tabs || []), { label: 'New Tab', source: 'all', categoryId: '' }]);
  };

  const updateFeature = (i, feature) => {
    const features = [...(block.features || [])];
    features[i] = feature;
    update('features', features);
  };
  const removeFeature = (i) => {
    const features = [...(block.features || [])];
    features.splice(i, 1);
    update('features', features);
  };
  const addFeature = () => {
    update('features', [...(block.features || []), { icon: '⭐', iconImage: '', title: '', subtitle: '', color: '#1b5e35' }]);
  };

  const updateColumn = (i, column) => {
    const columns = [...(block.columns || [])];
    columns[i] = column;
    update('columns', columns);
  };
  const removeColumn = (i) => {
    const columns = [...(block.columns || [])];
    columns.splice(i, 1);
    update('columns', columns);
  };
  const addColumn = () => {
    update('columns', [...(block.columns || []), { title: 'New Column', source: 'newest', categoryId: '', limit: 3 }]);
  };

  const vis = block.visibility || { desktop: true, tablet: true, mobile: true };
  const plat = block.platform || { web: true, mobileApp: true };
  const resp = block.responsive || { desktopColumns: 0, tabletColumns: 0, mobileColumns: 0 };

  const updateVis = (key, val) => update('visibility', { ...vis, [key]: val });
  const updatePlat = (key, val) => update('platform', { ...plat, [key]: val });
  const updateResp = (key, val) => update('responsive', { ...resp, [key]: val });

  return (
    <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
      {/* Visibility & Platform */}
      <div className="space-y-3 pb-4 border-b">
        <h4 className="text-sm font-semibold text-gray-700">Visibility & Platform</h4>
        <div>
          <label className="block text-xs text-gray-500 mb-2">Show on Devices</label>
          <div className="flex gap-2">
            {[
              { key: 'desktop', icon: IoDesktop, label: 'Desktop' },
              { key: 'tablet', icon: IoTabletPortrait, label: 'Tablet' },
              { key: 'mobile', icon: IoPhonePortrait, label: 'Mobile' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => updateVis(key, !vis[key])}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border-2 transition-all text-xs font-medium ${
                  vis[key]
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">Show on Platform</label>
          <div className="flex gap-2">
            {[
              { key: 'web', icon: IoGlobe, label: 'Web App' },
              { key: 'mobileApp', icon: IoApps, label: 'Mobile App' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => updatePlat(key, !plat[key])}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border-2 transition-all text-xs font-medium ${
                  plat[key]
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">Responsive Columns <span className="text-gray-400">(0 = use block default)</span></label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'desktopColumns', icon: IoDesktop, label: 'Desktop' },
              { key: 'tabletColumns', icon: IoTabletPortrait, label: 'Tablet' },
              { key: 'mobileColumns', icon: IoPhonePortrait, label: 'Mobile' },
            ].map(({ key, icon: Icon, label }) => (
              <div key={key}>
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={12} className="text-gray-400" />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={resp[key] || 0}
                  onChange={(e) => updateResp(key, parseInt(e.target.value) || 0)}
                  className="w-full text-sm px-2 py-1.5 border rounded"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Common section settings */}
      <div className="space-y-3 pb-4 border-b">
        <h4 className="text-sm font-semibold text-gray-700">Section Settings</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Container</label>
            <select value={block.containerWidth || 'contained'} onChange={(e) => update('containerWidth', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="contained">Contained</option>
              <option value="full">Full Width</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Background</label>
            <input type="text" value={block.backgroundColor || ''} onChange={(e) => update('backgroundColor', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" placeholder="#ffffff" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Padding Top</label>
            <input type="text" value={block.paddingTop || '40px'} onChange={(e) => update('paddingTop', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Padding Bottom</label>
            <input type="text" value={block.paddingBottom || '40px'} onChange={(e) => update('paddingBottom', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
        </div>
        {block.showSectionTitle !== false && (
          <>
            <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Section Title" value={block.sectionTitle || ''} onChange={(e) => update('sectionTitle', e.target.value)} />
            <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Subtitle (optional)" value={block.sectionSubtitle || ''} onChange={(e) => update('sectionSubtitle', e.target.value)} />
          </>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={block.showViewAll || false} onChange={(e) => update('showViewAll', e.target.checked)} />
          Show "View All" link
        </label>
        {block.showViewAll && (
          <div className="grid grid-cols-2 gap-2">
            <input className="text-sm px-2 py-1.5 border rounded" placeholder="Text" value={block.viewAllText || ''} onChange={(e) => update('viewAllText', e.target.value)} />
            <input className="text-sm px-2 py-1.5 border rounded" placeholder="Link" value={block.viewAllLink || ''} onChange={(e) => update('viewAllLink', e.target.value)} />
          </div>
        )}
      </div>

      {/* Typography & Colors */}
      <div className="space-y-3 pb-4 border-b">
        <h4 className="text-sm font-semibold text-gray-700">Typography & Colors</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title Font Size</label>
            <input type="text" value={block.sectionTitleSize || '24px'} onChange={(e) => update('sectionTitleSize', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" placeholder="24px" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subtitle Font Size</label>
            <input type="text" value={block.sectionSubtitleSize || '14px'} onChange={(e) => update('sectionSubtitleSize', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" placeholder="14px" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Title Color" value={block.sectionTitleColor} onChange={(v) => update('sectionTitleColor', v)} placeholder="#111827" />
          <ColorField label="Subtitle Color" value={block.sectionSubtitleColor} onChange={(v) => update('sectionSubtitleColor', v)} placeholder="#6b7280" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Primary Color" value={block.primaryColor} onChange={(v) => update('primaryColor', v)} placeholder="#0F604B" />
          <ColorField label="Link / View All Color" value={block.linkColor} onChange={(v) => update('linkColor', v)} placeholder="#0F604B" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Button Background" value={block.buttonBgColor} onChange={(v) => update('buttonBgColor', v)} placeholder="#0F604B" />
          <ColorField label="Button Text" value={block.buttonTextColor} onChange={(v) => update('buttonTextColor', v)} placeholder="#ffffff" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Button Hover BG" value={block.buttonHoverBgColor} onChange={(v) => update('buttonHoverBgColor', v)} placeholder="#0a4a39" />
          <ColorField label="Price Color" value={block.priceColor} onChange={(v) => update('priceColor', v)} placeholder="#0F604B" />
        </div>
        {(block.blockType === 'product-grid-tabs' || block.blockType === 'product-carousel-tabs') && (
          <ColorField label="Active Tab Color" value={block.tabActiveColor} onChange={(v) => update('tabActiveColor', v)} placeholder="#0F604B" />
        )}
      </div>

      {/* Product Card Settings (for product blocks) */}
      {['product-grid-tabs', 'product-carousel-tabs', 'deals-of-the-day', 'product-columns-grid'].includes(block.blockType) && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Product Card Settings</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title Line Clamp</label>
              <input type="number" min={1} max={5} value={block.cardTitleClamp ?? 2} onChange={(e) => update('cardTitleClamp', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title Font Size</label>
              <input type="text" value={block.cardTitleSize || '14px'} onChange={(e) => update('cardTitleSize', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" placeholder="14px" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price Font Size</label>
              <input type="text" value={block.cardPriceSize || '16px'} onChange={(e) => update('cardPriceSize', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" placeholder="16px" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category Font Size</label>
              <input type="text" value={block.cardCategorySize || '12px'} onChange={(e) => update('cardCategorySize', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" placeholder="12px" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Button Text</label>
            <input type="text" value={block.cardButtonText || 'View Product'} onChange={(e) => update('cardButtonText', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <ColorField label="Card Text Color" value={block.textColor} onChange={(v) => update('textColor', v)} placeholder="#1f2937" />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.cardEqualHeight !== false} onChange={(e) => update('cardEqualHeight', e.target.checked)} /> Equal Height Cards</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showSaleBadge !== false} onChange={(e) => update('showSaleBadge', e.target.checked)} /> Show "SALE" Badge</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showPercentOff !== false} onChange={(e) => update('showPercentOff', e.target.checked)} /> Show Percent Off Badge</label>
          </div>

          {/* Badge Assignment */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">Badge Assignment</h4>
            <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={block.showBadges !== false} onChange={(e) => update('showBadges', e.target.checked)} /> Show Custom Badges</label>
            {block.showBadges !== false && (
              <BadgePicker selectedIds={block.badgeIds || []} onChange={(ids) => update('badgeIds', ids)} />
            )}
          </div>
        </div>
      )}

      {/* Hero Slider settings */}
      {(block.blockType === 'hero-slider-full' || block.blockType === 'hero-slider-with-side-banner') && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Slider Settings</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Effect</label>
              <select value={block.sliderEffect || 'slide'} onChange={(e) => update('sliderEffect', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Speed (ms)</label>
              <input type="number" value={block.sliderSpeed || 5000} onChange={(e) => update('sliderSpeed', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input type="text" value={block.sliderHeight || '450px'} onChange={(e) => update('sliderHeight', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
              <input type="text" value={block.sliderBorderRadius || '12px'} onChange={(e) => update('sliderBorderRadius', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.sliderAutoplay !== false} onChange={(e) => update('sliderAutoplay', e.target.checked)} /> Autoplay</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showArrows !== false} onChange={(e) => update('showArrows', e.target.checked)} /> Arrows</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showDots !== false} onChange={(e) => update('showDots', e.target.checked)} /> Dots</label>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-2">Slides</h4>
          <div className="space-y-2">
            {(block.slides || []).map((slide, i) => (
              <SlideEditor key={i} slide={slide} index={i} onChange={(s) => updateSlide(i, s)} onRemove={() => removeSlide(i)} />
            ))}
          </div>
          <button onClick={addSlide} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Slide</button>
        </div>
      )}

      {/* Side banner (for hero-slider-with-side-banner) */}
      {block.blockType === 'hero-slider-with-side-banner' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Side Banner</h4>
          <ImageUploadField label="Image" value={block.sideBannerImage || ''} onChange={(v) => update('sideBannerImage', v)} />
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Heading (supports <br>)" value={block.sideBannerHeading || ''} onChange={(e) => update('sideBannerHeading', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="text-sm px-3 py-2 border rounded" placeholder="Button Text" value={block.sideBannerButtonText || ''} onChange={(e) => update('sideBannerButtonText', e.target.value)} />
            <input className="text-sm px-3 py-2 border rounded" placeholder="Button Link" value={block.sideBannerButtonLink || ''} onChange={(e) => update('sideBannerButtonLink', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Text Color</label>
            <input type="color" value={block.sideBannerTextColor || '#333333'} onChange={(e) => update('sideBannerTextColor', e.target.value)} className="w-full h-8 rounded" />
          </div>
          <OverlayControl
            color={block.sideBannerOverlayColor}
            opacity={block.sideBannerOverlayOpacity}
            onColorChange={(v) => update('sideBannerOverlayColor', v)}
            onOpacityChange={(v) => update('sideBannerOverlayOpacity', v)}
          />
        </div>
      )}

      {/* Banner items */}
      {(block.blockType === 'banner-grid-3col' || block.blockType === 'banner-full-width' || block.blockType === 'banner-grid-2col') && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Banners</h4>
          <div className="space-y-2">
            {(block.banners || []).map((b, i) => (
              <BannerItemEditor key={i} banner={b} index={i} onChange={(b2) => updateBanner(i, b2)} onRemove={() => removeBanner(i)} showRemove={(block.banners || []).length > 1} />
            ))}
          </div>
          <button onClick={addBanner} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Banner</button>
        </div>
      )}

      {/* Product Tab settings */}
      {(block.blockType === 'product-grid-tabs' || block.blockType === 'product-carousel-tabs') && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Tabs</h4>
          <div className="space-y-2">
            {(block.tabs || []).map((tab, i) => (
              <TabItemEditor key={i} tab={tab} index={i} onChange={(t) => updateTab(i, t)} onRemove={() => removeTab(i)} showRemove={(block.tabs || []).length > 1} />
            ))}
          </div>
          <button onClick={addTab} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Tab</button>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Products per page</label>
              <input type="number" min={2} max={20} value={block.productLimit || 10} onChange={(e) => update('productLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            {block.blockType === 'product-grid-tabs' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Columns</label>
                <input type="number" min={2} max={6} value={block.productColumns || 5} onChange={(e) => update('productColumns', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showAddToCart !== false} onChange={(e) => update('showAddToCart', e.target.checked)} /> Add to Cart</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showWishlist !== false} onChange={(e) => update('showWishlist', e.target.checked)} /> Wishlist</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showRating !== false} onChange={(e) => update('showRating', e.target.checked)} /> Rating</label>
          </div>
        </div>
      )}

      {/* Deals settings */}
      {block.blockType === 'deals-of-the-day' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Deals Settings</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Product Source</label>
            <select value={block.productSource || 'sale'} onChange={(e) => update('productSource', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="sale">On Sale</option>
              <option value="featured">Featured</option>
              <option value="all">All</option>
              <option value="best-selling">Best Selling</option>
              <option value="most-viewed">Most Viewed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Products to show</label>
            <input type="number" min={1} max={8} value={block.productLimit || 4} onChange={(e) => update('productLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showCountdown !== false} onChange={(e) => update('showCountdown', e.target.checked)} /> Show Countdown</label>
          {block.showCountdown && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input type="datetime-local" value={block.dealsEndDate || ''} onChange={(e) => update('dealsEndDate', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          )}
        </div>
      )}

      {/* Product Columns Grid */}
      {block.blockType === 'product-columns-grid' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Columns</h4>
          <div className="space-y-2">
            {(block.columns || []).map((col, i) => (
              <ColumnEditor key={i} column={col} index={i} onChange={(c) => updateColumn(i, c)} onRemove={() => removeColumn(i)} />
            ))}
          </div>
          <button onClick={addColumn} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Column</button>
        </div>
      )}

      {/* Category Carousel */}
      {block.blockType === 'category-carousel' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Category Settings</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <select value={block.categorySource || 'all'} onChange={(e) => update('categorySource', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="all">All Categories</option>
              <option value="top">Top Categories</option>
              <option value="manual">Manual Selection</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Limit</label>
              <input type="number" min={2} max={20} value={block.categoryLimit || 10} onChange={(e) => update('categoryLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Visible Columns</label>
              <input type="number" min={2} max={12} value={block.categoryColumns || 10} onChange={(e) => update('categoryColumns', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showCategoryProductCount !== false} onChange={(e) => update('showCategoryProductCount', e.target.checked)} /> Show product count</label>
        </div>
      )}

      {/* Feature Icons Row */}
      {block.blockType === 'feature-icons-row' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Features</h4>
          <div className="space-y-2">
            {(block.features || []).map((f, i) => (
              <FeatureItemEditor key={i} feature={f} index={i} onChange={(f2) => updateFeature(i, f2)} onRemove={() => removeFeature(i)} />
            ))}
          </div>
          <button onClick={addFeature} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Feature</button>
        </div>
      )}

      {/* Spacer */}
      {block.blockType === 'spacer' && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Spacer</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Height</label>
            <input type="text" value={block.spacerHeight || '40px'} onChange={(e) => update('spacerHeight', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
        </div>
      )}

      {/* Custom Template (Page Builder) */}
      {block.blockType === 'custom-template' && (
        <TemplatePicker value={block.templateId || ''} onChange={(v) => update('templateId', v)} />
      )}

      {/* Rich Text / Custom HTML */}
      {(block.blockType === 'rich-text' || block.blockType === 'custom-html') && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">{block.blockType === 'rich-text' ? 'Content' : 'HTML'}</h4>
          <textarea
            value={block.content || ''}
            onChange={(e) => update('content', e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded font-mono"
            rows={8}
            placeholder={block.blockType === 'rich-text' ? 'Enter HTML content...' : 'Enter custom HTML...'}
          />
        </div>
      )}

      {/* Banner Slider Carousel */}
      {block.blockType === 'banner-slider-carousel' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Banner Cards</h4>
          <div className="space-y-2">
            {(block.banners || []).map((b, i) => (
              <BannerItemEditor key={i} banner={b} index={i} onChange={(b2) => updateBanner(i, b2)} onRemove={() => removeBanner(i)} showRemove={(block.banners || []).length > 1} />
            ))}
          </div>
          <button onClick={addBanner} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Banner</button>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slides to Show</label>
              <input type="number" min={1} max={6} value={block.slidesToShow || 4} onChange={(e) => update('slidesToShow', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Autoplay Speed (ms)</label>
              <input type="number" min={1000} max={10000} step={500} value={block.autoplaySpeed || 4000} onChange={(e) => update('autoplaySpeed', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Banner Height</label>
              <input type="text" value={block.bannerHeight || '200px'} onChange={(e) => update('bannerHeight', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
              <input type="text" value={block.bannerBorderRadius || '12px'} onChange={(e) => update('bannerBorderRadius', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.autoplay !== false} onChange={(e) => update('autoplay', e.target.checked)} /> Autoplay</label>
        </div>
      )}

      {/* Coupon / Offer Carousel */}
      {block.blockType === 'coupon-carousel' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Coupon Cards</h4>
          <div className="space-y-3">
            {(block.coupons || []).map((coupon, i) => (
              <div key={i} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Coupon {i + 1}</span>
                  {(block.coupons || []).length > 1 && (
                    <button onClick={() => { const c = [...(block.coupons || [])]; c.splice(i, 1); update('coupons', c); }} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
                  )}
                </div>
                <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Title (e.g. GET 10% OFF)" value={coupon.title || ''} onChange={(e) => { const c = [...(block.coupons || [])]; c[i] = { ...c[i], title: e.target.value }; update('coupons', c); }} />
                <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Description" value={coupon.description || ''} onChange={(e) => { const c = [...(block.coupons || [])]; c[i] = { ...c[i], description: e.target.value }; update('coupons', c); }} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="text-sm px-3 py-2 border rounded" placeholder="Valid text" value={coupon.validText || ''} onChange={(e) => { const c = [...(block.coupons || [])]; c[i] = { ...c[i], validText: e.target.value }; update('coupons', c); }} />
                  <input className="text-sm px-3 py-2 border rounded" placeholder="Coupon code" value={coupon.code || ''} onChange={(e) => { const c = [...(block.coupons || [])]; c[i] = { ...c[i], code: e.target.value }; update('coupons', c); }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">BG Color</label>
                    <input type="color" value={coupon.bgColor || '#0F604B'} onChange={(e) => { const c = [...(block.coupons || [])]; c[i] = { ...c[i], bgColor: e.target.value }; update('coupons', c); }} className="w-full h-8 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Text Color</label>
                    <input type="color" value={coupon.textColor || '#ffffff'} onChange={(e) => { const c = [...(block.coupons || [])]; c[i] = { ...c[i], textColor: e.target.value }; update('coupons', c); }} className="w-full h-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => update('coupons', [...(block.coupons || []), { title: 'NEW OFFER', description: '', validText: '', code: 'CODE', bgColor: '#0F604B', textColor: '#ffffff' }])} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Coupon</button>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slides to Show</label>
              <input type="number" min={1} max={5} value={block.slidesToShow || 3} onChange={(e) => update('slidesToShow', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.autoplay !== false} onChange={(e) => update('autoplay', e.target.checked)} /> Autoplay</label>
        </div>
      )}

      {/* Products + Deal Sidebar */}
      {block.blockType === 'product-with-deal-sidebar' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Product Carousel</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Product Source</label>
            <select value={block.productSource || 'best-selling'} onChange={(e) => update('productSource', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="best-selling">Best Selling</option>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="sale">On Sale</option>
              <option value="trending">Trending</option>
              <option value="most-viewed">Most Viewed</option>
              <option value="top-rated">Top Rated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Products to show</label>
            <input type="number" min={2} max={20} value={block.productLimit || 10} onChange={(e) => update('productLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showAddToCart !== false} onChange={(e) => update('showAddToCart', e.target.checked)} /> Add to Cart</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showWishlist !== false} onChange={(e) => update('showWishlist', e.target.checked)} /> Wishlist</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showRating !== false} onChange={(e) => update('showRating', e.target.checked)} /> Rating</label>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-3">Deal Sidebar</h4>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.dealEnabled !== false} onChange={(e) => update('dealEnabled', e.target.checked)} /> Enable Deal Sidebar</label>
          {block.dealEnabled !== false && (
            <>
              <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Deal Title" value={block.dealTitle || ''} onChange={(e) => update('dealTitle', e.target.value)} />
              <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Badge Text (e.g. Hot Deal)" value={block.dealBadgeText || ''} onChange={(e) => update('dealBadgeText', e.target.value)} />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deal Product Source</label>
                <select value={block.dealProductSource || 'featured'} onChange={(e) => update('dealProductSource', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
                  <option value="featured">Featured</option>
                  <option value="sale">On Sale</option>
                  <option value="best-selling">Best Selling</option>
                  <option value="trending">Trending</option>
                  <option value="most-viewed">Most Viewed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deal Position</label>
                <select value={block.dealPosition || 'right'} onChange={(e) => update('dealPosition', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showCountdown !== false} onChange={(e) => update('showCountdown', e.target.checked)} /> Show Countdown</label>
              {block.showCountdown !== false && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input type="datetime-local" value={block.dealsEndDate || ''} onChange={(e) => update('dealsEndDate', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Offer Strip / Marquee */}
      {block.blockType === 'offer-strip' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Offer Strip</h4>
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Main text" value={block.stripText || ''} onChange={(e) => update('stripText', e.target.value)} />
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Highlight text (e.g. 70% OFF)" value={block.highlightText || ''} onChange={(e) => update('highlightText', e.target.value)} />
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Link URL" value={block.stripLink || ''} onChange={(e) => update('stripLink', e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <ColorField label="BG Color" value={block.stripBgColor} onChange={(v) => update('stripBgColor', v)} placeholder="#0F604B" />
            <ColorField label="Text Color" value={block.stripTextColor} onChange={(v) => update('stripTextColor', v)} placeholder="#ffffff" />
            <ColorField label="Highlight" value={block.stripHighlightColor} onChange={(v) => update('stripHighlightColor', v)} placeholder="#f7bd20" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Font Size</label>
            <input type="text" value={block.stripFontSize || '18px'} onChange={(e) => update('stripFontSize', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.enableMarquee || false} onChange={(e) => update('enableMarquee', e.target.checked)} /> Enable Marquee (scrolling text)</label>
          {block.enableMarquee && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Marquee Speed (px/s)</label>
              <input type="number" min={10} max={200} value={block.marqueeSpeed || 30} onChange={(e) => update('marqueeSpeed', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          )}
        </div>
      )}

      {/* Blog / Articles Carousel */}
      {block.blockType === 'blog-carousel' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Blog Settings</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <select value={block.blogSource || 'latest'} onChange={(e) => update('blogSource', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="latest">Latest</option>
              <option value="featured">Featured</option>
              <option value="popular">Popular</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Posts to show</label>
              <input type="number" min={1} max={12} value={block.blogLimit || 6} onChange={(e) => update('blogLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slides visible</label>
              <input type="number" min={1} max={5} value={block.slidesToShow || 3} onChange={(e) => update('slidesToShow', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Card Border Radius</label>
            <input type="text" value={block.cardBorderRadius || '12px'} onChange={(e) => update('cardBorderRadius', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showDate !== false} onChange={(e) => update('showDate', e.target.checked)} /> Show Date</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showExcerpt !== false} onChange={(e) => update('showExcerpt', e.target.checked)} /> Show Excerpt</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showReadMore !== false} onChange={(e) => update('showReadMore', e.target.checked)} /> Read More</label>
          </div>
        </div>
      )}

      {/* Newsletter Subscribe */}
      {block.blockType === 'newsletter' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Newsletter Settings</h4>
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Heading" value={block.heading || ''} onChange={(e) => update('heading', e.target.value)} />
          <textarea className="w-full text-sm px-3 py-2 border rounded" placeholder="Subtitle / description" value={block.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} rows={2} />
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Input placeholder text" value={block.placeholder || ''} onChange={(e) => update('placeholder', e.target.value)} />
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Button text" value={block.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} />
          <ImageUploadField label="Background Image (optional)" value={block.bgImage || ''} onChange={(v) => update('bgImage', v)} />
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="BG Color" value={block.bgColor} onChange={(v) => update('bgColor', v)} placeholder="#0F604B" />
            <ColorField label="Text Color" value={block.textColor} onChange={(v) => update('textColor', v)} placeholder="#ffffff" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Button BG" value={block.buttonBgColor} onChange={(v) => update('buttonBgColor', v)} placeholder="#f7bd20" />
            <ColorField label="Button Text" value={block.buttonTextColor} onChange={(v) => update('buttonTextColor', v)} placeholder="#333333" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showIcon !== false} onChange={(e) => update('showIcon', e.target.checked)} /> Show mail icon</label>
        </div>
      )}

      {/* Category Grid (Image Cards) */}
      {block.blockType === 'category-grid' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Category Grid Settings</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <select value={block.categorySource || 'all'} onChange={(e) => update('categorySource', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="all">All Categories</option>
              <option value="top">Top Categories</option>
              <option value="manual">Manual Selection</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Limit</label>
              <input type="number" min={2} max={16} value={block.categoryLimit || 8} onChange={(e) => update('categoryLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Columns</label>
              <input type="number" min={2} max={6} value={block.columns || 4} onChange={(e) => update('columns', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Card Style</label>
            <select value={block.cardStyle || 'card'} onChange={(e) => update('cardStyle', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="card">Card</option>
              <option value="circle">Circle</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
              <input type="text" value={block.cardBorderRadius || '12px'} onChange={(e) => update('cardBorderRadius', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Image Height</label>
              <input type="text" value={block.imageHeight || '180px'} onChange={(e) => update('imageHeight', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showProductCount !== false} onChange={(e) => update('showProductCount', e.target.checked)} /> Show count</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showImage !== false} onChange={(e) => update('showImage', e.target.checked)} /> Show image</label>
          </div>
        </div>
      )}

      {/* Product Vertical List (Tabs) */}
      {block.blockType === 'product-vertical-tabs' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Tabs</h4>
          <div className="space-y-2">
            {(block.tabs || []).map((tab, i) => (
              <TabItemEditor key={i} tab={tab} index={i} onChange={(t) => updateTab(i, t)} onRemove={() => removeTab(i)} showRemove={(block.tabs || []).length > 1} />
            ))}
          </div>
          <button onClick={addTab} className="flex items-center gap-1 text-sm text-primary hover:underline"><IoAdd size={16} /> Add Tab</button>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Products per tab</label>
            <input type="number" min={1} max={10} value={block.productLimit || 4} onChange={(e) => update('productLimit', parseInt(e.target.value))} className="w-full text-sm px-2 py-1.5 border rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Layout</label>
            <select value={block.layout || 'horizontal'} onChange={(e) => update('layout', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
              <option value="horizontal">Horizontal (thumbnail + details)</option>
              <option value="vertical">Vertical (stacked)</option>
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showPrice !== false} onChange={(e) => update('showPrice', e.target.checked)} /> Price</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showRating !== false} onChange={(e) => update('showRating', e.target.checked)} /> Rating</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.showImage !== false} onChange={(e) => update('showImage', e.target.checked)} /> Image</label>
          </div>
        </div>
      )}

      {/* Image + Text CTA Banner */}
      {block.blockType === 'image-text-cta' && (
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">CTA Banner</h4>
          <ImageUploadField label="Main Image" value={block.mainImage || ''} onChange={(v) => update('mainImage', v)} />
          <ImageUploadField label="Side Image (optional)" value={block.sideImage || ''} onChange={(v) => update('sideImage', v)} />
          <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Heading" value={block.heading || ''} onChange={(e) => update('heading', e.target.value)} />
          <textarea className="w-full text-sm px-3 py-2 border rounded" placeholder="Description" value={block.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bullet Points (one per line)</label>
            <textarea
              className="w-full text-sm px-3 py-2 border rounded font-mono"
              rows={3}
              value={(block.bulletPoints || []).join('\n')}
              onChange={(e) => update('bulletPoints', e.target.value.split('\n').filter(Boolean))}
              placeholder="Get live order tracking&#10;Fast & secure checkout&#10;Easy returns & refunds"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="text-sm px-3 py-2 border rounded" placeholder="Button Text" value={block.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} />
            <input className="text-sm px-3 py-2 border rounded" placeholder="Button Link" value={block.buttonLink || ''} onChange={(e) => update('buttonLink', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Layout</label>
              <select value={block.layout || '8-4'} onChange={(e) => update('layout', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
                <option value="8-4">8/4 (wide + narrow)</option>
                <option value="6-6">6/6 (equal)</option>
                <option value="4-8">4/8 (narrow + wide)</option>
                <option value="full">Full width (no side image)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Text Position</label>
              <select value={block.textPosition || 'right'} onChange={(e) => update('textPosition', e.target.value)} className="w-full text-sm px-2 py-1.5 border rounded">
                <option value="right">Right (overlay)</option>
                <option value="left">Left (overlay)</option>
                <option value="center">Center</option>
              </select>
            </div>
          </div>
          <ColorField label="Text Color" value={block.textColor} onChange={(v) => update('textColor', v)} placeholder="#333333" />
        </div>
      )}
    </div>
  );
}

// ── Block card (in the canvas) ──────────────────────────────────────
function BlockCard({ block, index, isSelected, onSelect, onMove, onToggle, onDuplicate, onRemove, totalBlocks }) {
  const blockDef = BLOCK_TYPES.find(b => b.type === block.blockType);
  return (
    <div
      onClick={() => onSelect(index)}
      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
        isSelected ? 'border-emerald-500 bg-emerald-50 shadow-lg' : block.enabled ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow' : 'border-gray-200 bg-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl cursor-grab"><IoReorderThree size={20} className="text-gray-400" /></span>
          <span className="text-xl">{blockDef?.icon || '🧩'}</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">{blockDef?.label || block.blockType}</div>
            {block.sectionTitle && block.showSectionTitle && (
              <div className="text-xs text-gray-500 mt-0.5">"{block.sectionTitle}"</div>
            )}
            {block.blockType === 'custom-template' && block.templateId && (
              <div className="text-xs text-emerald-600 mt-0.5">Template: {block.templateId}</div>
            )}
            {/* Visibility badges */}
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {block.visibility && (!block.visibility.desktop || !block.visibility.tablet || !block.visibility.mobile) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                  {block.visibility.desktop && <IoDesktop size={10} />}
                  {block.visibility.tablet && <IoTabletPortrait size={10} />}
                  {block.visibility.mobile && <IoPhonePortrait size={10} />}
                  {!block.visibility.desktop && !block.visibility.tablet && !block.visibility.mobile && 'Hidden'}
                </span>
              )}
              {block.platform && (!block.platform.web || !block.platform.mobileApp) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">
                  {block.platform.web && !block.platform.mobileApp && <>Web only</>}
                  {!block.platform.web && block.platform.mobileApp && <>App only</>}
                  {!block.platform.web && !block.platform.mobileApp && <>No platform</>}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" title="Move up">
            <IoChevronUp size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove(index, 1); }} disabled={index === totalBlocks - 1} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" title="Move down">
            <IoChevronDown size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggle(index); }} className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${block.enabled ? 'text-emerald-600' : 'text-gray-400'}`} title={block.enabled ? 'Disable' : 'Enable'}>
            {block.enabled ? <IoEye size={14} /> : <IoEyeOff size={14} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(index); }} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Duplicate">
            <IoCopy size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(index); }} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors" title="Remove">
            <IoTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────
export default function HomePageBuilderPage() {
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasChanges, setHasChanges] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  // Fetch config
  const { data, isLoading } = useQuery('homePageConfig', () => homePageConfigAPI.get(), {
    onSuccess: (res) => {
      const cfg = res.data?.data;
      if (cfg?.blocks) {
        setBlocks(cfg.blocks.sort((a, b) => a.order - b.order));
      }
    },
  });

  // Save mutation
  const saveMutation = useMutation(
    (payload) => homePageConfigAPI.update(payload),
    {
      onSuccess: () => {
        toast.success('Home page saved!');
        setHasChanges(false);
        queryClient.invalidateQueries('homePageConfig');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
    }
  );

  // Reset mutation
  const resetMutation = useMutation(
    () => homePageConfigAPI.reset(),
    {
      onSuccess: () => {
        toast.success('Reset to default');
        setBlocks([]);
        setSelectedIndex(-1);
        setHasChanges(false);
        queryClient.invalidateQueries('homePageConfig');
      },
    }
  );

  const markChanged = useCallback(() => setHasChanges(true), []);

  // Block operations
  const addBlock = (blockType) => {
    const newBlock = { ...getDefaultBlock(blockType), order: blocks.length };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedIndex(blocks.length);
    setAddMenuOpen(false);
    markChanged();
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    newBlocks.forEach((b, i) => b.order = i);
    setBlocks(newBlocks);
    setSelectedIndex(target);
    markChanged();
  };

  const toggleBlock = (index) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], enabled: !newBlocks[index].enabled };
    setBlocks(newBlocks);
    markChanged();
  };

  const duplicateBlock = (index) => {
    const newBlocks = [...blocks];
    const clone = JSON.parse(JSON.stringify(newBlocks[index]));
    delete clone._id;
    clone.order = newBlocks.length;
    newBlocks.push(clone);
    setBlocks(newBlocks);
    setSelectedIndex(newBlocks.length - 1);
    markChanged();
  };

  const removeBlock = (index) => {
    if (!confirm('Remove this block?')) return;
    const newBlocks = blocks.filter((_, i) => i !== index);
    newBlocks.forEach((b, i) => b.order = i);
    setBlocks(newBlocks);
    setSelectedIndex(-1);
    markChanged();
  };

  const updateBlock = (updatedBlock) => {
    const newBlocks = [...blocks];
    newBlocks[selectedIndex] = updatedBlock;
    setBlocks(newBlocks);
    markChanged();
  };

  const handleSave = () => {
    const payload = {
      blocks: blocks.map((b, i) => ({ ...b, order: i })),
      isPublished: true,
    };
    saveMutation.mutate(payload);
  };

  const handleReset = () => {
    if (!confirm('Reset home page to empty? This cannot be undone.')) return;
    resetMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <IoHome size={20} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Home Page Builder</h1>
              <p className="text-sm text-gray-500">{blocks.length} block{blocks.length !== 1 ? 's' : ''} configured</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">Unsaved changes</span>}
            <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 border rounded-lg hover:border-red-300 transition-colors">
              <IoRefresh size={16} className="inline mr-1" /> Reset
            </button>
            <button onClick={handleSave} disabled={saveMutation.isLoading || !hasChanges} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors">
              <IoSave size={16} className="inline mr-1" /> {saveMutation.isLoading ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left: Block list (canvas) */}
          <div className="flex-1 min-w-0">
            {blocks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <IoLayers size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No blocks yet</h3>
                <p className="text-sm text-gray-400 mb-4">Click "Add Block" to start building your home page</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, i) => (
                  <BlockCard
                    key={block._id || `block-${i}`}
                    block={block}
                    index={i}
                    isSelected={selectedIndex === i}
                    onSelect={setSelectedIndex}
                    onMove={moveBlock}
                    onToggle={toggleBlock}
                    onDuplicate={duplicateBlock}
                    onRemove={removeBlock}
                    totalBlocks={blocks.length}
                  />
                ))}
              </div>
            )}

            {/* Add Block Button */}
            <div className="relative mt-4">
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="w-full py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex items-center justify-center gap-2"
              >
                <IoAdd size={20} /> Add Block
              </button>

              {addMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border z-50 max-h-[400px] overflow-y-auto">
                    {/* Category filter */}
                    <div className="sticky top-0 bg-white border-b p-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => setFilterCategory('')}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${!filterCategory ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-gray-100'}`}
                      >All</button>
                      {BLOCK_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${filterCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-gray-100'}`}
                        >{cat}</button>
                      ))}
                    </div>
                    <div className="p-2">
                      {BLOCK_TYPES.filter(b => !filterCategory || b.category === filterCategory).map(bt => (
                        <button
                          key={bt.type}
                          onClick={() => addBlock(bt.type)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <span className="text-xl">{bt.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{bt.label}</div>
                            <div className="text-xs text-gray-400">{bt.category}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Block settings panel */}
          <div className="w-[420px] flex-shrink-0">
            {selectedIndex >= 0 && selectedIndex < blocks.length ? (
              <div className="bg-white rounded-xl border shadow-sm sticky top-[85px]">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <IoSettings size={16} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {BLOCK_TYPES.find(b => b.type === blocks[selectedIndex]?.blockType)?.label || 'Block Settings'}
                    </span>
                  </div>
                  <button onClick={() => setSelectedIndex(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <IoClose size={16} />
                  </button>
                </div>
                <BlockSettingsPanel block={blocks[selectedIndex]} onChange={updateBlock} />
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-8 text-center sticky top-[85px]">
                <IoSettings size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Select a block to edit its settings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
