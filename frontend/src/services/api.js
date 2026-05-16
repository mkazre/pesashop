import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear Zustand persisted auth state so useAuthStore reflects logged-out
      try {
        const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        if (stored?.state) {
          stored.state.user = null;
          stored.state.token = null;
          stored.state.isAuthenticated = false;
          localStorage.setItem('auth-storage', JSON.stringify(stored));
        }
      } catch { /* ignore */ }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/update', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
  // Social Login
  getSocialLoginConfig: () => api.get('/api/settings/social-login'),
  googleLogin: (credential) => api.post('/api/auth/google', { credential }),
  facebookLogin: (accessToken) => api.post('/api/auth/facebook', { accessToken }),
  // Addresses
  getAddresses: () => api.get('/api/auth/addresses'),
  addAddress: (data) => api.post('/api/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/api/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/api/auth/addresses/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/api/products', { params }),
  getOne: (slugOrId) => api.get(`/api/products/${slugOrId}`), // Now accepts slug or ID
  getFeatured: () => api.get('/api/products?featured=true&limit=8'),
  getNew: () => api.get('/api/products?sort=-createdAt&limit=8'),
  search: (query) => api.get(`/api/products?search=${query}`),
  getFilters: () => api.get('/api/products/filters'),
  bulkEdit: (data) => api.post('/api/products/bulk-edit', data),
  bulkTrash: (productIds) => api.post('/api/products/bulk-trash', { productIds }),
  restore: (id) => api.post(`/api/products/${id}/restore`),
  permanentDelete: (id) => api.delete(`/api/products/${id}/permanent`),
  getNextSKU: () => api.get('/api/products/next-sku'),
  // AI Generator
  generateDescription: (id) => api.post(`/api/products-ai/generate-description/${id}`),
  applyDescription: (id, data) => api.post(`/api/products-ai/apply-description/${id}`, data),
  bulkGenerateAI: (data) => api.post('/api/products-ai/bulk-generate', data),
  // WooCommerce Import
  importWooCommerce: (formData) => api.post('/api/woocommerce-import/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadSampleCSV: () => api.get('/api/woocommerce-import/sample', { responseType: 'blob' })
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get('/api/categories', { params }),
  getOne: (id) => api.get(`/api/categories/${id}`),
  getBySlug: (slug) => api.get(`/api/categories/slug/${slug}`),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/api/orders', orderData),
  getAll: (params) => api.get('/api/orders', { params }),
  getOne: (id) => api.get(`/api/orders/${id}`),
  track: (orderNumber, email) => api.post('/api/orders/track', { orderNumber, email }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/update', data),
  getAddresses: () => api.get('/api/auth/addresses'),
  addAddress: (address) => api.post('/api/auth/addresses', address),
  getWishlist: () => api.get('/api/auth/wishlist'),
  addToWishlist: (productId) => api.post('/api/auth/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/api/auth/wishlist/${productId}`),
};

// Coupons API
export const couponsAPI = {
  validate: (code, cartTotal, cartItems) => api.post('/api/coupons/validate', { code, cartTotal, cartItems }),
  publicValidate: (code, cartTotal, cartItems) => api.post('/api/coupons/public/validate', { code, cartTotal, cartItems }),
  autoApply: (code) => api.get('/api/coupons/public/auto-apply', { params: { code } }),
  getMyCoupons: () => api.get('/api/coupons/my-coupons'),
};

// Gift Cards API
export const giftCardsAPI = {
  getPresets: () => api.get('/api/gift-cards/presets/list'),
  purchase: (data) => api.post('/api/gift-cards/purchase', data),
  validate: (code) => api.get(`/api/gift-cards/validate/${code}`),
  checkBalance: (code) => api.get(`/api/gift-cards/public/check-balance/${code}`),
  getMyGiftCards: () => api.get('/api/gift-cards/my-gift-cards'),
  sendToFriend: (data) => api.post('/api/gift-cards/send-to-friend', data),
  getHistory: (id) => api.get(`/api/gift-cards/my-gift-cards/${id}/history`),
};

// Menus API (public endpoints for frontend)
export const menusAPI = {
  getByLocation: (location, pageId) => api.get(`/api/menus/location/${location}`, { params: pageId ? { pageId } : {} }),
  getDefaultMenuData: () => api.get('/api/menus/default-menu-data'),
};

// Page Builder API (legacy - PageBuilder model)
export const pageBuilderAPI = {
  getBySlug: (slug) => api.get(`/api/page-builder/${slug}`),
};

// Page Templates API (admin page builder - used for frontend pages)
export const pageTemplatesAPI = {
  getHomepage: () => api.get('/api/page-templates/homepage'),
  getBySlug: (slug) => api.get(`/api/page-templates/slug/${slug}`),
  getByType: (type) => api.get(`/api/page-templates/type/${type}`),
  getPublished: () => api.get('/api/page-templates/published'),
};

// Loyalty API (customer-facing)
export const loyaltyAPI = {
  getPublicSettings: () => api.get('/api/loyalty/public/settings'),
  calculateProductPoints: (productId, quantity = 1) => api.post('/api/loyalty/public/calculate-product-points', { productId, quantity }),
  calculateCartPoints: (items) => api.post('/api/loyalty/public/calculate-cart-points', { items }),
  getCurrencies: () => api.get('/api/loyalty/public/currencies'),
  getMyOverview: () => api.get('/api/loyalty/my-overview'),
  getHistory: (params) => api.get('/api/loyalty/history', { params }),
  getBalance: () => api.get('/api/loyalty/balance'),
  sharePoints: (data) => api.post('/api/loyalty/share', data),
  convertPoints: (points) => api.post('/api/loyalty/convert', { points }),
  calculateRedemption: (points, orderTotal) => api.post('/api/loyalty/redemption/calculate', { points, orderTotal }),
  redeemPoints: (data) => api.post('/api/loyalty/redemption/redeem', data),
};

// Public Settings API
export const settingsAPI = {
  getBankDetails: () => api.get('/api/settings/bank-details'),
  getPublic: () => api.get('/api/settings/public'),
};

// Product Page Settings API (public)
export const productPageSettingsAPI = {
  get: () => api.get('/api/product-page-settings/public'),
};

// Product Archive Settings API (public)
export const productArchiveSettingsAPI = {
  get: () => api.get('/api/product-archive-settings/public'),
};

// Layby Plans API (public — for inline plan display)
export const laybyPlansAPI = {
  getActive: () => api.get('/api/layby-plans/active/list'),
  getForProduct: (productId) => api.get('/api/layby-plans/active/list', { params: { productId } }),
  checkProduct: (productId) => api.get(`/api/layby-plans/check-product/${productId}`),
  checkProducts: (productIds) => api.post('/api/layby-plans/check-products', { productIds }),
};

// Layby API (customer-facing)
export const laybyAPI = {
  getSettings: () => api.get('/api/layby-applications/settings'),
  checkEligibility: () => api.get('/api/layby-applications/check-eligibility'),
  submitApplication: (formData) => api.post('/api/layby-applications/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyApplications: () => api.get('/api/layby-applications/my-applications'),
  getMyLaybyes: () => api.get('/api/laybyes/my-laybyes'),
  getMyLaybye: (id) => api.get(`/api/laybyes/my-laybyes/${id}`),
  makePayment: (id, data) => api.post(`/api/laybyes/my-laybyes/${id}/pay`, data),
  getMyTransactions: (params) => api.get('/api/layby-transactions/my-transactions', { params }),
};

// Currencies API (public)
export const currenciesAPI = {
  getFrontend: () => api.get('/api/currencies', { params: { frontend: 'true' } }),
  getBase: () => api.get('/api/currencies/base/get'),
};

// Home Page Config API (public)
export const homePageConfigAPI = {
  getPublic: () => api.get('/api/home-page-config/public'),
};

// Footer Config API (public)
export const footerConfigAPI = {
  getPublic: () => api.get('/api/footer-config/public'),
};

// Badges API (public)
export const badgesAPI = {
  getActive: () => api.get('/api/badges/active/list'),
  evaluateProducts: (productIds) => api.post('/api/badges/evaluate/products', { productIds }),
  evaluateProduct: (productId) => api.get(`/api/badges/evaluate/product/${productId}`),
};

// Stats / Analytics API (public endpoints)
export const statsAPI = {
  trackEvent: (eventData) => api.post('/api/stats/event', eventData),
  trackBatch: (events) => api.post('/api/stats/events/batch', { events }),
  getTrendingProducts: (params) => api.get('/api/stats/trending-products', { params }),
  getPopularProducts: (params) => api.get('/api/stats/popular-products', { params }),
  getAlsoBought: (productId, params) => api.get(`/api/stats/also-bought/${productId}`, { params }),
  getRecommended: (productId, params) => api.get(`/api/stats/recommended/${productId}`, { params }),
  getAlsoViewed: (productId, params) => api.get(`/api/stats/also-viewed/${productId}`, { params }),
  getFrequentlyBoughtTogether: (productId, params) => api.get(`/api/stats/frequently-bought-together/${productId}`, { params }),
  getTopSearches: (params) => api.get('/api/stats/top-searches', { params }),
  getMegaMenuData: () => api.get('/api/stats/mega-menu-data'),
};

// Reviews API (public + authenticated)
export const reviewsAPI = {
  getForProduct: (productId, params) => api.get('/api/reviews', { params: { product: productId, public: 'true', ...params } }),
  getSettings: () => api.get('/api/reviews/settings/public'),
  canReview: (productId) => api.get(`/api/reviews/can-review/${productId}`),
  create: (formData) => api.post('/api/reviews', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  vote: (reviewId, vote) => api.post(`/api/reviews/${reviewId}/vote`, { vote }),
  report: (reviewId, reason) => api.post(`/api/reviews/${reviewId}/report`, { reason }),
  getCategories: () => api.get('/api/reviews/categories'),
};

// Q&A API (public + authenticated)
export const questionsAPI = {
  getForProduct: (productId, params) => api.get(`/api/questions/product/${productId}`, { params }),
  ask: (data) => api.post('/api/questions', data),
  answer: (questionId, content) => api.post(`/api/questions/${questionId}/answer`, { content }),
  voteAnswer: (questionId, answerId, vote) => api.post(`/api/questions/${questionId}/answers/${answerId}/vote`, { vote }),
};

// Notifications API (customer-facing)
export const notificationsAPI = {
  getMy: (params) => api.get('/api/notifications/my', { params }),
  getUnreadCount: () => api.get('/api/notifications/my/unread-count'),
  markAsRead: (id) => api.put(`/api/notifications/my/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/my/read-all'),
  recordClick: (id) => api.post(`/api/notifications/my/${id}/click`),
  dismiss: (id) => api.delete(`/api/notifications/my/${id}`),
  subscribe: (data) => api.post('/api/notifications/subscribe', data),
  subscribeAnonymous: (data) => api.post('/api/notifications/subscribe-anonymous', data),
  unsubscribe: (data) => api.delete('/api/notifications/subscribe', { data }),
  getVapidPublicKey: () => api.get('/api/notifications/vapid-public-key'),
};

// Demographics & Profile API
export const demographicsAPI = {
  getProfileCompletion: () => api.get('/api/demographics/profile-completion'),
  updateProfile: (data) => api.put('/api/demographics/update', data),
  getHobbyProducts: (hobbies, limit = 3) => api.get('/api/demographics/hobby-products', { params: { hobbies, limit } }),
  getRecommendations: (productId) => api.get('/api/demographics/recommendations', { params: { productId } }),
};

// Offers API (frontend)
export const offersAPI = {
  getForPage: (page) => api.get('/api/offers', { params: { page } }),
  take: (id) => api.post(`/api/offers/${id}/take`),
  contactRequest: (id) => api.post(`/api/offers/${id}/contact-request`),
  getMine: () => api.get('/api/offers/mine'),
  cancelMine: (id) => api.delete(`/api/offers/mine/${id}`),
};

// Recurring Orders API (frontend)
export const recurringOrdersAPI = {
  getActivePlans: () => api.get('/api/recurring-orders/plans/active'),
  getPlansForProduct: (productId) => api.get('/api/recurring-orders/plans/active', { params: productId ? { productId } : {} }),
  create: (data) => api.post('/api/recurring-orders', data),
  getMine: (params) => api.get('/api/recurring-orders/mine', { params }),
  pause: (id) => api.put(`/api/recurring-orders/${id}/pause`),
  resume: (id) => api.put(`/api/recurring-orders/${id}/resume`),
  cancel: (id, reason) => api.put(`/api/recurring-orders/${id}/cancel`, { reason }),
  updateFrequency: (id, frequency) => api.put(`/api/recurring-orders/${id}/update-frequency`, { frequency }),
};

// Service Provider Ads API (frontend)
export const serviceProviderAdsAPI = {
  getContextual: (params) => api.get('/api/service-provider-ads/contextual', { params }),
  recordImpression: (id) => api.post(`/api/service-provider-ads/${id}/impression`),
  recordClick: (id) => api.post(`/api/service-provider-ads/${id}/click`),
  submitEnquiry: (id, data) => api.post(`/api/service-provider-ads/${id}/enquire`, data),
  getAdSettings: () => api.get('/api/service-provider-ads/settings'),
};

// Social Engine API (TikTok video carousel)
export const socialEngineAPI = {
  getVideos:   (keywords, limit) => api.get('/api/social-engine/videos', { params: { keywords: keywords.join(','), limit } }),
  getSettings: ()                => api.get('/api/social-engine/settings'),
};

// Service Types & Requests API (frontend)
export const serviceTypesAPI = {
  getAll: (params) => api.get('/api/service-types', { params }),
  getOne: (id) => api.get(`/api/service-types/${id}`),
};

export const serviceRequestsAPI = {
  submit: (data) => api.post('/api/service-requests', data),
  getMine: () => api.get('/api/service-requests/mine'),
};

// Digital Kiosk API
export const digitalKioskAPI = {
  getConfig: (deviceId) => api.get('/api/digital-kiosk/config', { params: deviceId ? { deviceId } : {} }),
  registerDevice: (data) => api.post('/api/digital-kiosk/devices', data),
  heartbeat: (deviceId) => api.post(`/api/digital-kiosk/devices/${deviceId}/heartbeat`),
};

// ─── 2026-05 batch ─────────────────────────────────────────────────

// Returns
export const returnsAPI = {
  eligibility: (orderId) => api.get(`/api/returns/eligibility/${orderId}`),
  create: (formData) => api.post('/api/returns', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMine: () => api.get('/api/returns/mine'),
  getOne: (id) => api.get(`/api/returns/${id}`),
  dispute: (id, reason) => api.post(`/api/returns/${id}/dispute`, { reason }),
};

// Referrals
export const referralsAPI = {
  lookup: (code) => api.get(`/api/referrals/code/${code}`),
  getMine: () => api.get('/api/referrals/me'),
  invite: (data) => api.post('/api/referrals/invite', data),
};

// Live Streams
export const liveStreamsAPI = {
  list: (params) => api.get('/api/live-streams', { params }),
  current: () => api.get('/api/live-streams/current'),
  getOne: (id) => api.get(`/api/live-streams/${id}`),
  tap: (id, productId, action) => api.post(`/api/live-streams/${id}/tap`, { productId, action }),
};

// Invoices
export const invoicesAPI = {
  getMine: () => api.get('/api/invoices/mine'),
  forOrder: (orderId) => api.get(`/api/invoices/order/${orderId}`),
};

// Visual Search & Bundles
export const visualSearchAPI = {
  byText: (query, limit) => api.post('/api/visual-search/by-text', { query, limit }),
  byImage: (formData) => api.post('/api/visual-search/by-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  similar: (productId, limit) => api.get(`/api/visual-search/similar/${productId}`, { params: { limit } }),
  bundleForProduct: (productId) => api.get(`/api/visual-search/bundles/for-product/${productId}`),
  trackBundle: (id, event) => api.post(`/api/visual-search/bundles/${id}/track`, { event }),
};

export default api;
