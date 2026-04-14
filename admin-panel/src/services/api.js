import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/admin/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (slugOrId) => api.get(`/products/${slugOrId}`), // Now accepts slug or ID
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`), // Moves to trash
  permanentDelete: (id) => api.delete(`/products/${id}/permanent`), // Permanently deletes
  restore: (id) => api.post(`/products/${id}/restore`), // Restore from trash
  bulkEdit: (data) => api.post('/products/bulk-edit', data),
  bulkTrash: (productIds) => api.post('/products/bulk-trash', { productIds }),
  getNextSKU: () => api.get('/products/next-sku'),
  // AI Generator
  generateDescription: (id, data = {}) => api.post(`/products-ai/generate-description/${id}`, data),
  applyDescription: (id, data) => api.post(`/products-ai/apply-description/${id}`, data),
  bulkGenerateAI: (data) => api.post('/products-ai/bulk-generate', data),
  // WooCommerce Import
  importWooCommerce: (formData) => api.post('/woocommerce-import/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadSampleCSV: () => api.get('/woocommerce-import/sample', { responseType: 'blob' })
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getTree: () => api.get('/categories', { params: { tree: 'true' } }),
  getProducts: (id) => api.get(`/categories/${id}/products`),
  removeProducts: (id, productIds) => api.put(`/categories/${id}/products/remove`, { productIds }),
  reassignProducts: (id, productIds, targetCategoryId) => api.put(`/categories/${id}/products/reassign`, { productIds, targetCategoryId }),
  addProducts: (id, productIds) => api.put(`/categories/${id}/products/add`, { productIds }),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
  updateAdminNote: (id, adminNote) => api.put(`/orders/${id}/admin-note`, { adminNote }),
  // Notes CRUD
  addNote: (id, data) => api.post(`/orders/${id}/notes`, data),
  updateNote: (id, noteId, data) => api.put(`/orders/${id}/notes/${noteId}`, data),
  deleteNote: (id, noteId) => api.delete(`/orders/${id}/notes/${noteId}`),
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id, force = false) => api.delete(`/customers/${id}${force ? '?force=true' : ''}`),
};

// Laybyes API
export const laybyesAPI = {
  getAll: (params) => api.get('/laybyes', { params }),
  getOne: (id) => api.get(`/laybyes/${id}`),
  create: (data) => api.post('/laybyes', data),
  update: (id, data) => api.put(`/laybyes/${id}`, data),
  recordPayment: (id, data) => api.post(`/laybyes/${id}/payments`, data),
  updatePaymentStatus: (id, paymentId, data) => api.put(`/laybyes/${id}/payments/${paymentId}`, data),
  cancel: (id, data) => api.put(`/laybyes/${id}/cancel`, data),
  delete: (id) => api.delete(`/laybyes/${id}`),
};

// Layby Plans API
export const laybyPlansAPI = {
  getAll: (params) => api.get('/layby-plans', { params }),
  getOne: (id) => api.get(`/layby-plans/${id}`),
  create: (data) => api.post('/layby-plans', data),
  update: (id, data) => api.put(`/layby-plans/${id}`, data),
  delete: (id) => api.delete(`/layby-plans/${id}`),
};

// Layby Applications API
export const laybyApplicationsAPI = {
  getAll: (params) => api.get('/layby-applications', { params }),
  getOne: (id) => api.get(`/layby-applications/${id}`),
  approve: (id, data) => api.put(`/layby-applications/${id}/approve`, data),
  reject: (id, data) => api.put(`/layby-applications/${id}/reject`, data),
  delete: (id) => api.delete(`/layby-applications/${id}`),
  downloadDocument: (id) => api.get(`/layby-applications/${id}/document`, { responseType: 'blob' }),
  getByCustomer: (customerId) => api.get(`/layby-applications/customer/${customerId}`),
};

// Email Templates API
export const emailTemplatesAPI = {
  getAll: (params) => api.get('/email-templates', { params }),
  getOne: (id) => api.get(`/email-templates/${id}`),
  create: (data) => api.post('/email-templates', data),
  update: (id, data) => api.put(`/email-templates/${id}`, data),
  delete: (id) => api.delete(`/email-templates/${id}`),
  preview: (id, sampleData) => api.post(`/email-templates/${id}/preview`, { sampleData }),
  test: (id, testEmail) => api.post(`/email-templates/${id}/test`, { testEmail }),
  seed: () => api.post('/email-templates/seed'),
  sendCampaign: (id, data) => api.post(`/email-templates/${id}/send-campaign`, data),
};

// Layby Transactions API
export const laybyTransactionsAPI = {
  getAll: (params) => api.get('/layby-transactions', { params }),
  getByLaybye: (laybyeId) => api.get(`/layby-transactions/laybye/${laybyeId}`),
};

// Loyalty API
export const loyaltyAPI = {
  // Settings
  getSettings: () => api.get('/loyalty/settings'),
  updateSettings: (data) => api.put('/loyalty/settings', data),
  
  // Points
  getBalance: () => api.get('/loyalty/balance'),
  getHistory: (params) => api.get('/loyalty/history', { params }),
  manualAssign: (data) => api.post('/loyalty/points/manual', data),
  bulkAssign: (data) => api.post('/loyalty/points/bulk', data),
  
  // Rules
  getRules: (params) => api.get('/loyalty/rules', { params }),
  getRule: (id) => api.get(`/loyalty/rules/${id}`),
  createRule: (data) => api.post('/loyalty/rules', data),
  updateRule: (id, data) => api.put(`/loyalty/rules/${id}`, data),
  deleteRule: (id) => api.delete(`/loyalty/rules/${id}`),
  
  // Levels
  getLevels: (params) => api.get('/loyalty/levels', { params }),
  getLevel: (id) => api.get(`/loyalty/levels/${id}`),
  createLevel: (data) => api.post('/loyalty/levels', data),
  updateLevel: (id, data) => api.put(`/loyalty/levels/${id}`, data),
  deleteLevel: (id) => api.delete(`/loyalty/levels/${id}`),
  
  // Banners
  getBanners: (params) => api.get('/loyalty/banners', { params }),
  getBanner: (id) => api.get(`/loyalty/banners/${id}`),
  createBanner: (data) => api.post('/loyalty/banners', data),
  updateBanner: (id, data) => api.put(`/loyalty/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/loyalty/banners/${id}`),
  
  // Ranking
  getRanking: (params) => api.get('/loyalty/ranking', { params }),
  awardTopCustomerBonus: () => api.post('/loyalty/ranking/top-customer-bonus'),
  
  // Redemption
  calculateRedemption: (data) => api.post('/loyalty/redemption/calculate', data),
  redeem: (data) => api.post('/loyalty/redemption/redeem', data),
  
  // User Management
  banUser: (id, data) => api.put(`/loyalty/users/${id}/ban`, data),
  getUserLevel: (id) => api.get(`/loyalty/users/${id}/level`),
};

// Currencies API
export const currenciesAPI = {
  getAll: (params) => api.get('/currencies', { params }),
  getOne: (id) => api.get(`/currencies/${id}`),
  getBase: () => api.get('/currencies/base/get'),
  create: (data) => api.post('/currencies', data),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  delete: (id) => api.delete(`/currencies/${id}`),
  bulkDelete: (ids) => api.post('/currencies/bulk-delete', { ids }),
  bulkUpdate: (ids, updates) => api.post('/currencies/bulk-update', { ids, updates }),
  setBase: (id) => api.post(`/currencies/set-base/${id}`),
  updateRates: () => api.post('/currencies/update-rates'),
  getUpdaterStatus: () => api.get('/currencies/updater/status'),
};

// Coupons API
export const couponsAPI = {
  getAll: (params) => api.get('/coupons', { params }),
  getOne: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  validate: (data) => api.post('/coupons/validate', data),
  // Email Settings
  getEmailSettings: () => api.get('/coupons/email/settings'),
  updateEmailSettings: (data) => api.put('/coupons/email/settings', data),
  sendTestEmail: (data) => api.post('/coupons/email/test', data),
};

// Gift Cards API
export const giftCardsAPI = {
  getAll: (params) => api.get('/gift-cards', { params }),
  getOne: (id) => api.get(`/gift-cards/${id}`),
  create: (data) => api.post('/gift-cards', data),
  update: (id, data) => api.put(`/gift-cards/${id}`, data),
  delete: (id) => api.delete(`/gift-cards/${id}`),
  validate: (code) => api.get(`/gift-cards/validate/${code}`),
  confirmPayment: (id) => api.put(`/gift-cards/${id}/confirm-payment`),
};

// Reviews API
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getOne: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  approve: (id) => api.post(`/reviews/${id}/approve`),
  reject: (id) => api.post(`/reviews/${id}/reject`),
  delete: (id) => api.delete(`/reviews/${id}`),
  canReview: (productId) => api.get(`/reviews/can-review/${productId}`),
  getSettings: () => api.get('/reviews/settings/get'),
  updateSettings: (data) => api.put('/reviews/settings/update', data),
  bulkStatus: (reviewIds, status) => api.post('/reviews/bulk-status', { reviewIds, status }),
  getSummary: () => api.get('/reviews/summary/stats'),
  adminResponse: (id, content) => api.post(`/reviews/${id}/admin-response`, { content }),
  // Review Categories
  getCategories: () => api.get('/reviews/categories/all'),
  createCategory: (data) => api.post('/reviews/categories', data),
  updateCategory: (id, data) => api.put(`/reviews/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/reviews/categories/${id}`),
  reorderCategories: (orderedIds) => api.put('/reviews/categories/reorder', { orderedIds }),
};

// Code Snippets API
export const codeSnippetsAPI = {
  getAll: (params) => api.get('/code-snippets', { params }),
  getOne: (id) => api.get(`/code-snippets/${id}`),
  create: (data) => api.post('/code-snippets', data),
  update: (id, data) => api.put(`/code-snippets/${id}`, data),
  delete: (id) => api.delete(`/code-snippets/${id}`),
  toggle: (id) => api.put(`/code-snippets/${id}/toggle`),
  validate: (code, type) => api.post('/code-snippets/validate', { code, type }),
  emergencyDisable: (id, token) => api.put(`/code-snippets/${id}/emergency-disable`, { emergencyToken: token }),
  bulk: (action, ids) => api.post('/code-snippets/bulk', { action, ids }),
  getActive: (environment, location, params) => api.get(`/code-snippets/active/${environment}/${location}`, { params }),
  duplicate: (id) => api.post(`/code-snippets/${id}/duplicate`),
  export: (ids) => api.post('/code-snippets/export', { ids }),
  import: (snippets, overwrite) => api.post('/code-snippets/import', { snippets, overwrite }),
  getVersions: (id) => api.get(`/code-snippets/${id}/versions`),
};

// Email Templates API
export const emailsAPI = {
  getAll: () => api.get('/emails/templates'),
  getOne: (id) => api.get(`/emails/templates/${id}`),
  create: (data) => api.post('/emails/templates', data),
  update: (id, data) => api.put(`/emails/templates/${id}`, data),
  test: (id) => api.post(`/emails/templates/${id}/test`),
};

// Page Builder API
export const pageBuilderAPI = {
  getAll: (type) => api.get('/page-builder', { params: { type } }),
  getOne: (id) => api.get(`/page-builder/${id}`),
  create: (data) => api.post('/page-builder', data),
  update: (id, data) => api.put(`/page-builder/${id}`, data),
  publish: (id) => api.post(`/page-builder/${id}/publish`),
  delete: (id) => api.delete(`/page-builder/${id}`),
};

// Popups API
export const popupsAPI = {
  getAll: (params) => api.get('/popups', { params }),
  getOne: (id) => api.get(`/popups/${id}`),
  create: (data) => api.post('/popups', data),
  update: (id, data) => api.put(`/popups/${id}`, data),
  delete: (id) => api.delete(`/popups/${id}`),
  setStatus: (id, status) => api.put(`/popups/${id}/status`, { status }),
  duplicate: (id) => api.post(`/popups/${id}/duplicate`),
  bulk: (action, ids) => api.post('/popups/bulk', { action, ids }),
  getActive: (params) => api.get('/popups/public/active', { params }),
};

// Import/Export API
export const importAPI = {
  validate: (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10800000, // 3 hours for large file validation (100K+)
    });
  },
  import: (type, file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processImages', options.processImages !== false ? 'true' : 'false');
    if (options.imageProcessingType) {
      formData.append('imageProcessingType', options.imageProcessingType);
    }
    formData.append('duplicateResolution', JSON.stringify(options.duplicateResolution || {}));
    formData.append('stripHtml', options.stripHtml !== false ? 'true' : 'false');
    formData.append('updateExisting', options.updateExisting ? 'true' : 'false');
    formData.append('replaceAll', options.replaceAll ? 'true' : 'false');
    formData.append('useJob', 'true'); // always use job-based import
    
    const endpoint = `/import/${type}`;
    
    return api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10800000, // 3 hours — covers file upload + job kickoff; actual import runs in background
    });
  },
  // Poll a background import job for status
  getJobStatus: (jobId) => api.get(`/import/job/${jobId}`),
  // Deduplicate products — dryRun=true to preview, false to delete
  deduplicateProducts: (dryRun = true) => api.post('/import/deduplicate-products', { dryRun }, { timeout: 10800000 }),
  export: (type, filters = {}) => 
    api.get(`/import/export/${type}`, { 
      params: { ...filters },
      responseType: 'blob' 
    }),
};

// Images API
export const imagesAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  process: (file, options = {}) => {
    const formData = new FormData();
    formData.append('image', file);
    // Add processing options
    if (options.trimWhitespace !== undefined) formData.append('trimWhitespace', options.trimWhitespace);
    if (options.backgroundColor) formData.append('backgroundColor', options.backgroundColor);
    if (options.targetWidth) formData.append('targetWidth', options.targetWidth);
    if (options.targetHeight) formData.append('targetHeight', options.targetHeight);
    if (options.targetRatio) formData.append('targetRatio', options.targetRatio);
    if (options.outputFormat) formData.append('outputFormat', options.outputFormat);
    if (options.imageQuality) formData.append('imageQuality', options.imageQuality);
    return api.post('/images/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  configureWatermark: (file, config) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    Object.keys(config).forEach(key => {
      if (config[key] !== undefined && config[key] !== null) {
        formData.append(key, config[key]);
      }
    });
    return api.post('/images/configure-watermark', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getWatermarkConfig: () => api.get('/images/watermark-config'),
  getConfig: () => api.get('/images/config'),
  updateConfig: (config) => api.post('/images/config', config),
  getProductImages: (params) => api.get('/images/products', { params }),
  processProductImage: (data) => api.post('/images/process-product-image', data),
  regenerateImages: (data) => api.post('/images/regenerate', data),
};

// Media Library API
export const mediaAPI = {
  getAll: (params) => api.get('/media', { params }),
  getOne: (id) => api.get("/media/" + id),
  upload: (file, meta = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(meta).forEach(([k,v]) => { if(v!=null) fd.append(k, typeof v==='object'?JSON.stringify(v):v); });
    return api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadMultiple: (files, folder) => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    if (folder) fd.append('folder', folder);
    return api.post('/media/upload-multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id, data) => api.put("/media/" + id, data),
  delete: (id) => api.delete("/media/" + id),
  bulkDelete: (ids) => api.post('/media/bulk-delete', { ids }),
  getFolders: () => api.get('/media/folders/list'),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  testEmail: (to) => api.post('/settings/test-email', { to }),
  verifyEmailConfig: () => api.post('/settings/verify-email-config'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getOne: (id) => api.get(`/notifications/${id}`),
  create: (data) => api.post('/notifications', data),
  update: (id, data) => api.put(`/notifications/${id}`, data),
  delete: (id) => api.delete(`/notifications/${id}`),
  send: (id) => api.post(`/notifications/${id}/send`),
  duplicate: (id) => api.post(`/notifications/${id}/duplicate`),
  cancel: (id) => api.post(`/notifications/${id}/cancel`),
  getStats: () => api.get('/notifications/admin/stats'),
  generateVapidKeys: () => api.post('/notifications/admin/generate-vapid-keys'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Page Templates API
export const pageTemplatesAPI = {
  getAll: (params) => api.get('/page-templates', { params }),
  getPublished: () => api.get('/page-templates/published'),
  getOne: (id) => api.get(`/page-templates/${id}`),
  getBySlug: (slug) => api.get(`/page-templates/slug/${slug}`),
  create: (data) => api.post('/page-templates', data),
  update: (id, data) => api.put(`/page-templates/${id}`, data),
  delete: (id) => api.delete(`/page-templates/${id}`),
  duplicate: (id) => api.post(`/page-templates/${id}/duplicate`),
  getVersions: (id) => api.get(`/page-templates/${id}/versions`),
  restoreVersion: (id, versionId) => api.post(`/page-templates/${id}/versions/${versionId}/restore`),
};

// Menus API
export const menusAPI = {
  getAll: (params) => api.get('/menus', { params }),
  getByLocation: (location) => api.get(`/menus/location/${location}`),
  getOne: (id) => api.get(`/menus/${id}`),
  create: (data) => api.post('/menus', data),
  update: (id, data) => api.put(`/menus/${id}`, data),
  delete: (id) => api.delete(`/menus/${id}`),
  duplicate: (id) => api.post(`/menus/${id}/duplicate`),
};

// B2Bking API
export const b2bkingAPI = {
  // Customer Groups
  getCustomerGroups: (params) => api.get('/b2bking/customer-groups', { params }),
  getCustomerGroup: (id) => api.get(`/b2bking/customer-groups/${id}`),
  createCustomerGroup: (data) => api.post('/b2bking/customer-groups', data),
  updateCustomerGroup: (id, data) => api.put(`/b2bking/customer-groups/${id}`, data),
  deleteCustomerGroup: (id) => api.delete(`/b2bking/customer-groups/${id}`),
  previewGroupCount: (data) => api.post('/b2bking/customer-groups/preview-count', data),
  syncGroupMembers: (id) => api.post(`/b2bking/customer-groups/${id}/sync`),

  // Price Lists
  getPriceLists: (params) => api.get('/b2bking/price-lists', { params }),
  getPriceList: (id) => api.get(`/b2bking/price-lists/${id}`),
  createPriceList: (data) => api.post('/b2bking/price-lists', data),
  updatePriceList: (id, data) => api.put(`/b2bking/price-lists/${id}`, data),
  deletePriceList: (id) => api.delete(`/b2bking/price-lists/${id}`),
  addPriceListItem: (id, data) => api.post(`/b2bking/price-lists/${id}/items`, data),
  updatePriceListItem: (id, itemId, data) => api.put(`/b2bking/price-lists/${id}/items/${itemId}`, data),
  deletePriceListItem: (id, itemId) => api.delete(`/b2bking/price-lists/${id}/items/${itemId}`),
  
  // Pricing Rules
  getPricingRules: (params) => api.get('/b2bking/pricing-rules', { params }),
  getPricingRule: (id) => api.get(`/b2bking/pricing-rules/${id}`),
  createPricingRule: (data) => api.post('/b2bking/pricing-rules', data),
  updatePricingRule: (id, data, params = {}) => api.put(`/b2bking/pricing-rules/${id}`, data, { params }),
  deletePricingRule: (id, params = {}) => api.delete(`/b2bking/pricing-rules/${id}`, { params }),
  getAffectedProducts: (id) => api.get(`/b2bking/pricing-rules/${id}/affected-products`),
  
  // Price Calculation
  calculatePrice: (data) => api.post('/b2bking/calculate-price', data),
  calculateBatchPrices: (data) => api.post('/b2bking/calculate-batch-prices', data),
  
  // Price Recalculation
  recalculatePrices: (data = {}) => api.post('/b2bking/recalculate-prices', data),
};

// Product Page Settings API
export const productPageSettingsAPI = {
  get: () => api.get('/product-page-settings'),
  update: (data) => api.put('/product-page-settings', data),
  updateSection: (sectionKey, data) => api.put(`/product-page-settings/section/${sectionKey}`, data),
  reset: () => api.post('/product-page-settings/reset'),
};

// Product Archive Settings API
export const productArchiveSettingsAPI = {
  get: () => api.get('/product-archive-settings'),
  update: (data) => api.put('/product-archive-settings', data),
  reset: () => api.post('/product-archive-settings/reset'),
};

// Home Page Config API
export const homePageConfigAPI = {
  get: () => api.get('/home-page-config'),
  update: (data) => api.put('/home-page-config', data),
  reset: () => api.post('/home-page-config/reset'),
};

// Footer Config API
export const footerConfigAPI = {
  get: () => api.get('/footer-config'),
  update: (data) => api.put('/footer-config', data),
  reset: () => api.post('/footer-config/reset'),
};

// Stats / Analytics API (admin endpoints)
export const statsAPI = {
  getOverview: (params) => api.get('/stats/admin/overview', { params }),
  getHotspots: (params) => api.get('/stats/admin/hotspots', { params }),
  getConversionInsights: (params) => api.get('/stats/admin/conversion-insights', { params }),
  getTrendingProducts: (params) => api.get('/stats/trending-products', { params }),
  getPopularProducts: (params) => api.get('/stats/popular-products', { params }),
  getTopSearches: (params) => api.get('/stats/top-searches', { params }),
  backfillOrders: () => api.post('/stats/admin/backfill-orders'),
};

// Products AI API (admin)
export const productsAIAPI = {
  generateSpecs: (id) => api.post(`/products-ai/generate-specifications/${id}`),
  applySpecs: (id, specifications) => api.post(`/products-ai/apply-specifications/${id}`, { specifications }),
  bulkGenerateSpecs: (data) => api.post('/products-ai/bulk-generate-specifications', data),
};

// Questions API (admin)
export const questionsAPI = {
  getAll: (params) => api.get('/questions/admin/all', { params }),
  getStats: () => api.get('/questions/admin/stats'),
  update: (id, data) => api.put(`/questions/admin/${id}`, data),
  delete: (id) => api.delete(`/questions/admin/${id}`),
  deleteAnswer: (questionId, answerId) => api.delete(`/questions/admin/${questionId}/answers/${answerId}`),
  bulkDelete: (questionIds) => api.post('/questions/admin/bulk-delete', { questionIds }),
  answer: (questionId, content) => api.post(`/questions/${questionId}/answer`, { content }),
};

// Users API (admin)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getStats: () => api.get('/users/stats'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
};

// Roles API (admin)
export const rolesAPI = {
  getAll: () => api.get('/roles'),
  getOne: (id) => api.get(`/roles/${id}`),
  getResources: () => api.get('/roles/meta/resources'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  seed: () => api.post('/roles/seed'),
};

// Mobile App Config API
export const mobileAppConfigAPI = {
  get: () => api.get('/mobile-app-config'),
  updateSplash: (data) => api.put('/mobile-app-config/splash', data),
  uploadSplashImage: (formData) => api.post('/mobile-app-config/splash/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Demographics API ──────────────────────────────────────────────
export const demographicsAPI = {
  getStats: () => api.get('/demographics/admin/stats'),
  recompute: (userId) => api.post(`/demographics/admin/recompute/${userId}`),
};

// ─── Import Batches API ─────────────────────────────────────────────
export const importBatchesAPI = {
  getAll:       (params) => api.get('/import-batches', { params }),
  getOne:       (id) => api.get(`/import-batches/${id}`),
  rollback:     (id, deleteImages = true) => api.delete(`/import-batches/${id}/rollback`, { params: { deleteImages } }),
  setDraft:     (id) => api.put(`/import-batches/${id}/draft`),
  publish:      (id) => api.put(`/import-batches/${id}/publish`),
  delete:       (id) => api.delete(`/import-batches/${id}`),
  reconstruct:        (gapMinutes = 60, groupByDate = false) => api.post('/import-batches/reconstruct', { gapMinutes, groupByDate }),
  reconstructPreview: (gapMinutes = 60, groupByDate = false) => api.get('/import-batches/reconstruct/preview', { params: { gapMinutes, groupByDate } }),
};

// ─── Service Providers API ─────────────────────────────────────────
// ─── Service Types & Requests API ─────────────────────────────────
export const serviceTypesAdminAPI = {
  getAll: () => api.get('/service-types/admin/all'),
  create: (data) => api.post('/service-types', data),
  update: (id, data) => api.put(`/service-types/${id}`, data),
  delete: (id) => api.delete(`/service-types/${id}`),
};

export const serviceRequestsAdminAPI = {
  getAll: (params) => api.get('/service-requests', { params }),
  getOne: (id) => api.get(`/service-requests/${id}`),
  update: (id, data) => api.put(`/service-requests/${id}`, data),
  delete: (id) => api.delete(`/service-requests/${id}`),
};

export const serviceProvidersAPI = {
  // Providers
  getAll: (params) => api.get('/service-providers', { params }),
  getOne: (id) => api.get(`/service-providers/${id}`),
  update: (id, data) => api.put(`/service-providers/${id}`, data),
  delete: (id) => api.delete(`/service-providers/${id}`),
  approve: (id, notes) => api.put(`/service-providers/${id}/approve`, { notes }),
  reject: (id, reason, notes) => api.put(`/service-providers/${id}/reject`, { reason, notes }),
  suspend: (id) => api.put(`/service-providers/${id}/suspend`),
  updateSubscription: (id, data) => api.put(`/service-providers/${id}/subscription`, data),
  // Categories
  getCategories: () => api.get('/service-providers/admin/categories'),
  createCategory: (data) => api.post('/service-providers/admin/categories', data),
  updateCategory: (id, data) => api.put(`/service-providers/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/service-providers/admin/categories/${id}`),
  // Plans
  getPlans: () => api.get('/service-providers/admin/plans'),
  createPlan: (data) => api.post('/service-providers/admin/plans', data),
  updatePlan: (id, data) => api.put(`/service-providers/admin/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/service-providers/admin/plans/${id}`),
  // Ad Slots
  getSlots: () => api.get('/service-providers/admin/slots'),
  createSlot: (data) => api.post('/service-providers/admin/slots', data),
  updateSlot: (id, data) => api.put(`/service-providers/admin/slots/${id}`, data),
  // Ad Orders
  getAdOrders: (params) => api.get('/service-providers/ad-orders', { params }),
  activateAdOrder: (id) => api.put(`/service-providers/ad-orders/${id}/activate`),
  declineAdOrder: (id, reason) => api.put(`/service-providers/ad-orders/${id}/decline`, { reason }),
};

// ─── Service Provider Ads API ──────────────────────────────────────
export const serviceProviderAdsAPI = {
  getAll: (params) => api.get('/service-provider-ads', { params }),
  approve: (id) => api.put(`/service-provider-ads/${id}/approve`),
  reject: (id, reason) => api.put(`/service-provider-ads/${id}/reject`, { reason }),
  update: (id, data) => api.put(`/service-provider-ads/${id}`, data),
  delete: (id) => api.delete(`/service-provider-ads/${id}`),
};

// ─── Recurring Orders API ──────────────────────────────────────────
export const recurringOrdersAPI = {
  getAll: (params) => api.get('/recurring-orders', { params }),
  getOne: (id) => api.get(`/recurring-orders/${id}`),
  cancel: (id, reason) => api.put(`/recurring-orders/${id}/cancel`, { reason }),
  sendReminder: (id) => api.post(`/recurring-orders/${id}/send-reminder`),
  // Plans
  getPlans: () => api.get('/recurring-orders/plans/all'),
  createPlan: (data) => api.post('/recurring-orders/plans', data),
  updatePlan: (id, data) => api.put(`/recurring-orders/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/recurring-orders/plans/${id}`),
};

// ─── Offers API ────────────────────────────────────────────────────
export const offersAPI = {
  getAll: (params) => api.get('/offers/admin/all', { params }),
  getOne: (id) => api.get(`/offers/admin/${id}`),
  create: (data) => api.post('/offers/admin', data),
  update: (id, data) => api.put(`/offers/admin/${id}`, data),
  delete: (id) => api.delete(`/offers/admin/${id}`),
  getCustomers: (id, params) => api.get(`/offers/admin/${id}/customers`, { params }),
  markContacted: (customerOfferId, notes) => api.put(`/offers/admin/customer-offers/${customerOfferId}/mark-contacted`, { notes }),
};

export default api;
