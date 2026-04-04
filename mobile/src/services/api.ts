import axios from 'axios';
import { Platform } from 'react-native';
import { tokenStorage } from '@/utils/tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach JWT token & handle FormData
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    // When sending FormData (file uploads), remove Content-Type so
    // React Native's networking layer auto-sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Helper: upload FormData using fetch (bypasses Axios serialization issues) ───
export async function uploadFormData(path: string, formData: FormData): Promise<any> {
  const token = await tokenStorage.get().catch(() => null);
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw { response: { status: res.status, data: json } };
  return { data: json };
}

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await tokenStorage.remove();
      } catch {}
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  register: (userData: any) => api.post('/api/auth/register', userData),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/update', data),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),
  getSocialLoginConfig: () => api.get('/api/settings/social-login'),
  googleLogin: (credential: string) =>
    api.post('/api/auth/google', { credential }),
  getAddresses: () => api.get('/api/auth/addresses'),
  addAddress: (data: any) => api.post('/api/auth/addresses', data),
  updateAddress: (id: string, data: any) =>
    api.put(`/api/auth/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/api/auth/addresses/${id}`),
};

// ─── Products API ────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params?: any) => api.get('/api/products', { params }),
  getOne: (slugOrId: string) => api.get(`/api/products/${slugOrId}`),
  getFeatured: () => api.get('/api/products?featured=true&limit=8'),
  getNew: () => api.get('/api/products?sort=-createdAt&limit=8'),
  search: (query: string) => api.get(`/api/products?search=${query}`),
  getFilters: () => api.get('/api/products/filters'),
};

// ─── Categories API ──────────────────────────────────────────────
export const categoriesAPI = {
  getAll: (params?: any) => api.get('/api/categories', { params }),
  getOne: (id: string) => api.get(`/api/categories/${id}`),
  getBySlug: (slug: string) => api.get(`/api/categories/slug/${slug}`),
};

// ─── Orders API ──────────────────────────────────────────────────
export const ordersAPI = {
  create: (orderData: any) => api.post('/api/orders', orderData),
  getAll: (params?: any) => api.get('/api/orders', { params }),
  getOne: (id: string) => api.get(`/api/orders/${id}`),
  track: (orderNumber: string, email: string) =>
    api.post('/api/orders/track', { orderNumber, email }),
};

// ─── User API ────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/update', data),
  getAddresses: () => api.get('/api/auth/addresses'),
  addAddress: (address: any) => api.post('/api/auth/addresses', address),
  getWishlist: () => api.get('/api/auth/wishlist'),
  addToWishlist: (productId: string) =>
    api.post('/api/auth/wishlist', { productId }),
  removeFromWishlist: (productId: string) =>
    api.delete(`/api/auth/wishlist/${productId}`),
};

// ─── Coupons API ─────────────────────────────────────────────────
export const couponsAPI = {
  validate: (code: string, cartTotal: number, cartItems: any[]) =>
    api.post('/api/coupons/validate', { code, cartTotal, cartItems }),
  publicValidate: (code: string, cartTotal: number, cartItems: any[]) =>
    api.post('/api/coupons/public/validate', { code, cartTotal, cartItems }),
  getMyCoupons: () => api.get('/api/coupons/my-coupons'),
};

// ─── Gift Cards API ──────────────────────────────────────────────
export const giftCardsAPI = {
  getPresets: () => api.get('/api/gift-cards/presets/list'),
  purchase: (data: any) => api.post('/api/gift-cards/purchase', data),
  validate: (code: string) => api.get(`/api/gift-cards/validate/${code}`),
  checkBalance: (code: string) =>
    api.get(`/api/gift-cards/public/check-balance/${code}`),
  getMyGiftCards: () => api.get('/api/gift-cards/my-gift-cards'),
};

// ─── Menus API ───────────────────────────────────────────────────
export const menusAPI = {
  getByLocation: (location: string) =>
    api.get(`/api/menus/location/${location}`),
  getDefaultMenuData: () => api.get('/api/menus/default-menu-data'),
};

// ─── Home Page Config API ────────────────────────────────────────
export const homePageConfigAPI = {
  getPublic: () => api.get('/api/home-page-config/public'),
};

// ─── Settings APIs ───────────────────────────────────────────────
export const settingsAPI = {
  getBankDetails: () => api.get('/api/settings/bank-details'),
  getPublic: () => api.get('/api/settings/public'),
  getFreeShipping: () => api.get('/api/settings/public'),
};

export const paymentMethodsAPI = {
  getActive: () => api.get('/api/payment-methods/active'),
};

export const productPageSettingsAPI = {
  get: () => api.get('/api/product-page-settings/public'),
};

export const productArchiveSettingsAPI = {
  get: () => api.get('/api/product-archive-settings/public'),
};

// ─── Layby APIs ──────────────────────────────────────────────────
export const laybyPlansAPI = {
  getActive: () => api.get('/api/layby-plans/active/list'),
  getForProduct: (productId: string) =>
    api.get('/api/layby-plans/active/list', { params: { productId } }),
  checkProduct: (productId: string) =>
    api.get(`/api/layby-plans/check-product/${productId}`),
  checkProducts: (productIds: string[]) =>
    api.post('/api/layby-plans/check-products', { productIds }),
};

export const laybyAPI = {
  getSettings: () => api.get('/api/layby-applications/settings'),
  checkEligibility: () => api.get('/api/layby-applications/check-eligibility'),
  submitApplication: (formData: any) =>
    uploadFormData('/api/layby-applications/apply', formData),
  getMyApplications: () => api.get('/api/layby-applications/my-applications'),
  getMyLaybyes: () => api.get('/api/laybyes/my-laybyes'),
  getMyLaybye: (id: string) => api.get(`/api/laybyes/my-laybyes/${id}`),
  makePayment: (id: string, data: any) =>
    api.post(`/api/laybyes/my-laybyes/${id}/pay`, data),
  getMyTransactions: (params?: any) =>
    api.get('/api/layby-transactions/my-transactions', { params }),
};

// ─── Currencies API ──────────────────────────────────────────────
export const currenciesAPI = {
  getFrontend: () =>
    api.get('/api/currencies', { params: { frontend: 'true' } }),
  getBase: () => api.get('/api/currencies/base/get'),
};

// ─── Stats API ───────────────────────────────────────────────────
export const statsAPI = {
  trackEvent: (eventData: any) => api.post('/api/stats/event', eventData),
  trackBatch: (events: any[]) =>
    api.post('/api/stats/events/batch', { events }),
  getTrendingProducts: (params?: any) =>
    api.get('/api/stats/trending-products', { params }),
  getPopularProducts: (params?: any) =>
    api.get('/api/stats/popular-products', { params }),
  getAlsoBought: (productId: string, params?: any) =>
    api.get(`/api/stats/also-bought/${productId}`, { params }),
  getRecommended: (productId: string, params?: any) =>
    api.get(`/api/stats/recommended/${productId}`, { params }),
  getAlsoViewed: (productId: string, params?: any) =>
    api.get(`/api/stats/also-viewed/${productId}`, { params }),
  getFrequentlyBoughtTogether: (productId: string, params?: any) =>
    api.get(`/api/stats/frequently-bought-together/${productId}`, { params }),
  getTopSearches: (params?: any) =>
    api.get('/api/stats/top-searches', { params }),
};

// ─── Reviews API ─────────────────────────────────────────────────
export const reviewsAPI = {
  getForProduct: (productId: string, params?: any) =>
    api.get('/api/reviews', {
      params: { product: productId, public: 'true', ...params },
    }),
  getSettings: () => api.get('/api/reviews/settings/public'),
  canReview: (productId: string) =>
    api.get(`/api/reviews/can-review/${productId}`),
  create: (formData: any) =>
    uploadFormData('/api/reviews', formData),
  vote: (reviewId: string, vote: string) =>
    api.post(`/api/reviews/${reviewId}/vote`, { vote }),
};

// ─── Q&A API ─────────────────────────────────────────────────────
export const questionsAPI = {
  getForProduct: (productId: string, params?: any) =>
    api.get(`/api/questions/product/${productId}`, { params }),
  ask: (data: any) => api.post('/api/questions', data),
  answer: (questionId: string, content: string) =>
    api.post(`/api/questions/${questionId}/answer`, { content }),
};

// ─── Loyalty API ─────────────────────────────────────────────────
export const loyaltyAPI = {
  getPublicSettings: () => api.get('/api/loyalty/public/settings'),
  getMyOverview: () => api.get('/api/loyalty/my-overview'),
  getBalance: () => api.get('/api/loyalty/balance'),
  getHistory: (params?: any) => api.get('/api/loyalty/history', { params }),
  calculateProductPoints: (productId: string, quantity: number = 1) =>
    api.post('/api/loyalty/public/calculate-product-points', { productId, quantity }),
  convertPoints: (points: number) =>
    api.post('/api/loyalty/convert', { points }),
  sharePoints: (data: { recipientEmail: string; points: number; message?: string }) =>
    api.post('/api/loyalty/share', data),
  calculateRedemption: (points: number, orderTotal: number) =>
    api.post('/api/loyalty/redemption/calculate', { points, orderTotal }),
  redeemPoints: (data: any) => api.post('/api/loyalty/redemption/redeem', data),
};

// ─── Badges API ──────────────────────────────────────────────────
export const badgesAPI = {
  getActive: () => api.get('/api/badges/active/list'),
  evaluateProduct: (productId: string) =>
    api.get(`/api/badges/evaluate/product/${productId}`),
};

// ─── Pages API (Page Builder custom pages) ─────────────────────
export const pagesAPI = {
  getPublished: () => api.get('/api/page-templates/published'),
  getBySlug: (slug: string) => api.get(`/api/page-templates/slug/${slug}`),
  getByType: (type: string) => api.get(`/api/page-templates/type/${type}`),
};

// ─── Mobile App Config API ──────────────────────────────────────
export const mobileAppConfigAPI = {
  getSplash: () => api.get('/api/mobile-app-config/public/splash'),
};

// ─── AI API ─────────────────────────────────────────────────────
export const aiAPI = {
  askProductAssistant: (data: {
    question: string;
    productId: string;
    productName: string;
    productDescription?: string;
  }) => api.post('/api/ai/product-assistant', data),
};

// ─── Store Credit / Transactions API ────────────────────────────
export const storeCreditAPI = {
  getBalance: () => api.get('/api/store-credit/balance'),
  getTransactions: (params?: any) => api.get('/api/store-credit/transactions', { params }),
};

// ─── Notifications API ──────────────────────────────────────────
export const notificationsAPI = {
  getMy: (params?: any) => api.get('/api/notifications/my', { params }),
  getUnreadCount: () => api.get('/api/notifications/my/unread-count'),
  markAsRead: (id: string) => api.put(`/api/notifications/my/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/my/read-all'),
  recordClick: (id: string) => api.post(`/api/notifications/my/${id}/click`),
  dismiss: (id: string) => api.delete(`/api/notifications/my/${id}`),
  subscribe: (data: any) => api.post('/api/notifications/subscribe', data),
  subscribeAnonymous: (data: any) => api.post('/api/notifications/subscribe-anonymous', data),
  unsubscribe: (data: any) => api.delete('/api/notifications/subscribe', { data }),
};

// ─── Chat API ───────────────────────────────────────────────────
export const chatAPI = {
  getSettings: () => api.get('/api/chat/settings'),
  initVisitor: (data: any) => api.post('/api/chat/visitor/init', data),
  startConversation: (data: any) => api.post('/api/chat/conversations/start', data),
  getVisitorConversations: (visitorId: string) => api.get(`/api/chat/conversations/visitor/${visitorId}`),
};

export default api;
