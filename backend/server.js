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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
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

// Mount routes
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start currency auto-update
currencyUpdater.startAutoUpdate();

// Initialize laybye cron jobs
initLaybyeCronJobs();

// Initialize coupon email cron jobs
initCouponEmailCronJobs();

// Initialize review reminder cron jobs
initReviewReminderCron();

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
