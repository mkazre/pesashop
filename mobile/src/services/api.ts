import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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
  getCategories: () => api.get('/api/reviews/categories'),
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

// ─── Returns API ──────────────────────────────────────────────────
export const returnsAPI = {
  eligibility: (orderId: string) => api.get(`/api/returns/eligibility/${orderId}`),
  create: (formData: FormData) => uploadFormData('/api/returns', formData),
  getMine: () => api.get('/api/returns/mine'),
  getOne: (id: string) => api.get(`/api/returns/${id}`),
  dispute: (id: string, reason: string) => api.post(`/api/returns/${id}/dispute`, { reason }),
};

// ─── Referrals API ────────────────────────────────────────────────
export const referralsAPI = {
  lookup: (code: string) => api.get(`/api/referrals/code/${code}`),
  getMine: () => api.get('/api/referrals/me'),
  invite: (data: { email: string; channel: string }) => api.post('/api/referrals/invite', data),
};

// ─── Live Shopping API ────────────────────────────────────────────
export const liveStreamsAPI = {
  list: (params?: any) => api.get('/api/live-streams', { params }),
  current: () => api.get('/api/live-streams/current'),
  getOne: (id: string) => api.get(`/api/live-streams/${id}`),
  tap: (id: string, productId: string, action: string) =>
    api.post(`/api/live-streams/${id}/tap`, { productId, action }),
};

// ─── Invoices API ─────────────────────────────────────────────────
export const invoicesAPI = {
  getMine: () => api.get('/api/invoices/mine'),
  forOrder: (orderId: string) => api.get(`/api/invoices/order/${orderId}`),
};

// Downloads the invoice PDF to local cache, then opens the native share/view sheet.
export async function viewInvoicePDF(orderId: string, invoiceNumber: string): Promise<void> {
  const token = await tokenStorage.get().catch(() => null);
  const fileUri = `${FileSystem.cacheDirectory}${invoiceNumber || orderId}.pdf`;
  const { uri } = await FileSystem.downloadAsync(
    `${API_URL}/api/invoices/order/${orderId}/download`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

// ─── Chat API ───────────────────────────────────────────────────
export const chatAPI = {
  getSettings: () => api.get('/api/chat/settings'),
  initVisitor: (data: any) => api.post('/api/chat/visitor/init', data),
  startConversation: (data: any) => api.post('/api/chat/conversations/start', data),
  getVisitorConversations: (visitorId: string) => api.get(`/api/chat/conversations/visitor/${visitorId}`),
};

// ─── Demographics & Profile API ─────────────────────────────────
export const demographicsAPI = {
  getProfileCompletion: () => api.get('/api/demographics/profile-completion'),
  updateProfile: (data: any) => api.put('/api/demographics/update', data),
  getHobbyProducts: (hobbies: string[], limit = 3) =>
    api.get('/api/demographics/hobby-products', { params: { hobbies, limit } }),
  getRecommendations: (productId?: string) =>
    api.get('/api/demographics/recommendations', { params: { productId } }),
};

// ─── Offers API ──────────────────────────────────────────────────
export const offersAPI = {
  getForPage: (page: string) => api.get('/api/offers', { params: { page } }),
  take: (id: string) => api.post(`/api/offers/${id}/take`),
  contactRequest: (id: string) => api.post(`/api/offers/${id}/contact-request`),
  getMine: () => api.get('/api/offers/mine'),
  cancelMine: (id: string) => api.delete(`/api/offers/mine/${id}`),
};

// ─── Recurring Orders API ────────────────────────────────────────
export const recurringOrdersAPI = {
  getPlansForProduct: (productId: string) =>
    api.get('/api/recurring-orders/plans/active', { params: { productId } }),
  create: (data: any) => api.post('/api/recurring-orders', data),
  getMine: (params?: any) => api.get('/api/recurring-orders/mine', { params }),
  pause: (id: string) => api.put(`/api/recurring-orders/${id}/pause`),
  resume: (id: string) => api.put(`/api/recurring-orders/${id}/resume`),
  cancel: (id: string, reason: string) => api.put(`/api/recurring-orders/${id}/cancel`, { reason }),
  updateFrequency: (id: string, frequency: string) =>
    api.put(`/api/recurring-orders/${id}/update-frequency`, { frequency }),
};

// ─── Service Types API ───────────────────────────────────────────
export const serviceTypesAPI = {
  getAll: (params?: any) => api.get('/api/service-types', { params }),
};

// ─── Service Requests API ────────────────────────────────────────
export const serviceRequestsAPI = {
  submit: (data: any) => api.post('/api/service-requests', data),
  getMine: () => api.get('/api/service-requests/mine'),
};

// ─── Social Engine API (TikTok carousel) ─────────────────────────
export const socialEngineAPI = {
  getVideos: (keywords: string[], limit?: number) =>
    api.get('/api/social-engine/videos', { params: { keywords: (keywords || []).join(','), limit } }),
  getSettings: () => api.get('/api/social-engine/settings'),
};

// ─── Service Provider Ads API ────────────────────────────────────
export const serviceProviderAdsAPI = {
  getContextual: (params: any) =>
    api.get('/api/service-provider-ads/contextual', { params }),
  recordImpression: (id: string) =>
    api.post(`/api/service-provider-ads/${id}/impression`),
  recordClick: (id: string) =>
    api.post(`/api/service-provider-ads/${id}/click`),
  submitEnquiry: (id: string, data: any) =>
    api.post(`/api/service-provider-ads/${id}/enquire`, data),
  getAdSettings: () =>
    api.get('/api/service-provider-ads/settings'),
};

export default api;
