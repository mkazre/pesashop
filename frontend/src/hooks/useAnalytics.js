import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { statsAPI } from '@/services/api';

// Generate a persistent session ID
const getSessionId = () => {
  let sid = sessionStorage.getItem('pesa_sid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('pesa_sid', sid);
  }
  return sid;
};

// Debounced event queue — batches events and sends them periodically
let eventQueue = [];
let flushTimer = null;

function queueEvent(eventData) {
  eventQueue.push({ ...eventData, sessionId: getSessionId() });

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      const batch = eventQueue.splice(0, 50);
      if (batch.length === 1) {
        statsAPI.trackEvent(batch[0]).catch(() => {});
      } else if (batch.length > 1) {
        statsAPI.trackBatch(batch).catch(() => {});
      }
      flushTimer = null;
    }, 2000); // Flush every 2 seconds
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      const batch = eventQueue.splice(0, 50);
      // Use sendBeacon for reliability on unload
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stats/events/batch`;
      navigator.sendBeacon(url, JSON.stringify({ events: batch }));
    }
  });
}

/**
 * useAnalytics — Hook for tracking site events.
 * Auto-tracks page views. Exposes manual tracking methods.
 */
export function useAnalytics() {
  const location = useLocation();
  const lastTrackedPage = useRef(null);

  // Auto-track page views on route change
  useEffect(() => {
    const page = location.pathname;
    if (page !== lastTrackedPage.current) {
      lastTrackedPage.current = page;
      queueEvent({
        type: 'page_view',
        page,
        pageTitle: document.title,
        referrer: document.referrer,
      });
    }
  }, [location.pathname]);

  const trackProductView = useCallback((productId, productName) => {
    queueEvent({
      type: 'product_view',
      productId,
      page: location.pathname,
      pageTitle: productName,
    });
  }, [location.pathname]);

  const trackProductClick = useCallback((productId, productName, section) => {
    queueEvent({
      type: 'product_click',
      productId,
      elementSection: section || 'listing',
      pageTitle: productName,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackCategoryView = useCallback((categoryId, categoryName) => {
    queueEvent({
      type: 'category_view',
      categoryId,
      page: location.pathname,
      pageTitle: categoryName,
    });
  }, [location.pathname]);

  const trackSearch = useCallback((query, resultCount) => {
    queueEvent({
      type: 'search',
      searchQuery: query,
      searchResultCount: resultCount,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackSearchClick = useCallback((query, productId, position) => {
    queueEvent({
      type: 'search_click',
      searchQuery: query,
      productId,
      searchResultPosition: position,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackAddToCart = useCallback((productId, quantity = 1) => {
    queueEvent({
      type: 'add_to_cart',
      productId,
      quantity,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackRemoveFromCart = useCallback((productId) => {
    queueEvent({
      type: 'remove_from_cart',
      productId,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackAddToWishlist = useCallback((productId) => {
    queueEvent({
      type: 'add_to_wishlist',
      productId,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackQuickView = useCallback((productId) => {
    queueEvent({
      type: 'quick_view',
      productId,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackButtonClick = useCallback((elementText, elementSection, elementId) => {
    queueEvent({
      type: 'button_click',
      elementText,
      elementSection,
      elementId,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackMegaMenuClick = useCallback((categoryId, categoryName) => {
    queueEvent({
      type: 'mega_menu_click',
      categoryId,
      pageTitle: categoryName,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackPurchase = useCallback((orderId, items) => {
    (items || []).forEach(item => {
      queueEvent({
        type: 'purchase',
        orderId,
        productId: item.product || item.productId,
        quantity: item.quantity,
        revenue: item.total || item.price * item.quantity,
      });
    });
  }, []);

  return {
    trackProductView,
    trackProductClick,
    trackCategoryView,
    trackSearch,
    trackSearchClick,
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToWishlist,
    trackQuickView,
    trackButtonClick,
    trackMegaMenuClick,
    trackPurchase,
  };
}

export default useAnalytics;
