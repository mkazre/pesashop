require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const currencyUpdater = require('./services/currencyUpdater');
const { initLaybyeCronJobs } = require('./cron/laybyeCron');
const { initCouponEmailCronJobs } = require('./cron/couponEmailCron');
const { initReviewReminderCron } = require('./cron/reviewReminderCron');
const { initRecurringOrderCronJobs } = require('./cron/recurringOrderCron');

// Initialize express app
const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', true);

// Connect to database
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 origin (dev proxies use random ports)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow production domains (pesashop.com and all subdomains)
    if (/^https?:\/\/([a-z0-9-]+\.)?pesashop\.com$/.test(origin)) {
      return callback(null, true);
    }
    // Allow Netlify domains
    if (/^https?:\/\/([a-z0-9-]+\.)?netlify\.app$/.test(origin)) {
      return callback(null, true);
    }
    // Also allow explicitly configured origins
    const allowed = [process.env.ADMIN_URL, process.env.FRONTEND_URL].filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      scriptSrc: ["'self'", "https://www.tiktok.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      frameSrc: ["'self'", "https://www.tiktok.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting - very lenient for development, more reasonable for production
// In development, disable rate limiting completely to avoid issues
if (process.env.NODE_ENV === 'development') {
  console.log('⚠️  Rate limiting DISABLED in development mode');
} else {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Serve static files - must be before API routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper content type for images
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    // Enable CORS for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  }
}));

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const laybyeRoutes = require('./routes/laybyes');
const laybyPlanRoutes = require('./routes/laybyPlans');
const loyaltyRoutes = require('./routes/loyalty');
const currencyRoutes = require('./routes/currencies');
const couponRoutes = require('./routes/coupons');
const giftCardRoutes = require('./routes/giftCards');
const reviewRoutes = require('./routes/reviews');
const emailRoutes = require('./routes/emails');
const pageBuilderRoutes = require('./routes/pageBuilder');
const pageTemplateRoutes = require('./routes/pageTemplates');
const menuRoutes = require('./routes/menus');
const snippetRoutes = require('./routes/snippets');
const importRoutes = require('./routes/import');
const imageRoutes = require('./routes/images');
const settingsRoutes = require('./routes/settings');
const emailTemplatesRoutes = require('./routes/emailTemplates');
const b2bkingRoutes = require('./routes/b2bking');
const codeSnippetsRoutes = require('./routes/codeSnippets');
const productAIRoutes = require('./routes/productAI');
const dashboardRoutes = require('./routes/dashboard');
const mediaRoutes = require('./routes/media');
const laybyApplicationRoutes = require('./routes/laybyApplications');
const laybyTransactionRoutes = require('./routes/laybyTransactions');
const badgeRoutes = require('./routes/badges');
const productPageSettingsRoutes = require('./routes/productPageSettings');
const productArchiveSettingsRoutes = require('./routes/productArchiveSettings');
const homePageConfigRoutes = require('./routes/homePageConfig');
const aiRoutes = require('./routes/ai');
const statsRoutes = require('./routes/stats');
const questionRoutes = require('./routes/questions');
const notificationRoutes = require('./routes/notifications');
const roleRoutes = require('./routes/roles');
const userRoutes = require('./routes/users');
const shippingRoutes = require('./routes/shipping');
const footerConfigRoutes = require('./routes/footerConfig');
const mobileAppConfigRoutes = require('./routes/mobileAppConfig');
const chatRoutes = require('./routes/chat');
const popupRoutes = require('./routes/popups');
require('./models/ServiceProviderAdOrder');
const serviceProviderRoutes = require('./routes/serviceProviders');
const serviceProviderAdRoutes = require('./routes/serviceProviderAds');
const recurringOrderRoutes = require('./routes/recurringOrders');
const offersRoutes = require('./routes/offers');
const demographicsRoutes = require('./routes/demographics');
const serviceTypesRoutes = require('./routes/serviceTypes');
const serviceRequestsRoutes = require('./routes/serviceRequests');
const importBatchesRoutes = require('./routes/importBatches');
const socialEngineRoutes  = require('./routes/socialEngine');
const digitalKioskRoutes = require('./routes/digitalKiosk');
const returnsRoutes = require('./routes/returns');
const referralsRoutes = require('./routes/referrals');
const whatsappRoutes = require('./routes/whatsapp');
const liveStreamsRoutes = require('./routes/liveStreams');
const visualSearchRoutes = require('./routes/visualSearch');

// Mount API routes FIRST (before static files)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/laybyes', laybyeRoutes);
app.use('/api/layby-plans', laybyPlanRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/page-builder', pageBuilderRoutes);
app.use('/api/page-templates', pageTemplateRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/import', importRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/email-templates', emailTemplatesRoutes);
app.use('/api/code-snippets', codeSnippetsRoutes);
app.use('/api/products-ai', productAIRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/b2bking', b2bkingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/layby-applications', laybyApplicationRoutes);
app.use('/api/layby-transactions', laybyTransactionRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/product-page-settings', productPageSettingsRoutes);
app.use('/api/product-archive-settings', productArchiveSettingsRoutes);
app.use('/api/home-page-config', homePageConfigRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/footer-config', footerConfigRoutes);
app.use('/api/mobile-app-config', mobileAppConfigRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api/service-provider-ads', serviceProviderAdRoutes);
app.use('/api/recurring-orders', recurringOrderRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/demographics', demographicsRoutes);
app.use('/api/service-types', serviceTypesRoutes);
app.use('/api/service-requests', serviceRequestsRoutes);
app.use('/api/import-batches', importBatchesRoutes);
app.use('/api/social-engine', socialEngineRoutes);
app.use('/api/digital-kiosk', digitalKioskRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/live-streams', liveStreamsRoutes);
app.use('/api/visual-search', visualSearchRoutes);

// Serve React frontend static files AFTER API routes
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'E-commerce Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      customers: '/api/customers',
      laybyes: '/api/laybyes',
      loyalty: '/api/loyalty',
      currencies: '/api/currencies',
      coupons: '/api/coupons',
      giftCards: '/api/gift-cards',
      reviews: '/api/reviews',
      emails: '/api/emails',
      pageBuilder: '/api/page-builder',
      snippets: '/api/snippets',
      import: '/api/import',
      images: '/api/images',
      settings: '/api/settings'
    }
  });
});

// 404 handler - Serve React app for non-API routes (SPA support)
app.use((req, res, next) => {
  // If it's an API route, return JSON 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // For all other routes, serve the React app
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Error handler
app.use(errorHandler);

// Start currency auto-update
currencyUpdater.startAutoUpdate();

// Seed missing email templates on startup
const seedEmailTemplates = require('./seeders/emailTemplates');
seedEmailTemplates();

// Initialize laybye cron jobs
initLaybyeCronJobs();

// Initialize coupon email cron jobs
initCouponEmailCronJobs();

// Initialize review reminder cron jobs
initReviewReminderCron();

// Initialize recurring order and service provider cron jobs
initRecurringOrderCronJobs();

// Process scheduled notifications every 60 seconds
const notificationService = require('./services/notificationService');
setInterval(async () => {
  try {
    const count = await notificationService.processScheduled();
    if (count > 0) console.log(`Processed ${count} scheduled notification(s)`);
  } catch (err) {
    console.error('Scheduled notification error:', err.message);
  }
}, 60000);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize Socket.io for chat
const { initializeSocket } = require('./sockets/chatSocket');
initializeSocket(server);

// Allow long-running requests (imports, bulk operations) — individual routes
// set their own timeouts via req.setTimeout() for finer control
server.timeout = 10800000; // 3 hours (for large imports with image processing)
server.keepAliveTimeout = 10800000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
