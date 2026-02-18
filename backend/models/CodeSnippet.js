const mongoose = require('mongoose');

const codeSnippetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a snippet name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please provide code content']
  },
  
  // Code Type
  type: {
    type: String,
    required: true,
    enum: ['javascript', 'css', 'html'],
    default: 'javascript'
  },
  
  // Placement - Environment
  environment: {
    type: String,
    required: true,
    enum: ['frontend', 'admin', 'backend', 'all'],
    default: 'frontend'
  },
  
  // Placement - Location
  location: {
    type: String,
    required: true,
    enum: [
      'header',           // <head> section
      'footer',           // Before </body>
      'body_start',       // Right after <body>
      'body_end',         // Right before </body>
      'after_opening_head', // Right after <head>
      'before_closing_head', // Right before </head>
      'after_opening_body',  // Right after <body>
      'before_closing_body'  // Right before </body>
    ],
    default: 'header'
  },
  
  // Page Targeting
  pageTarget: {
    type: String,
    required: true,
    enum: [
      'all_pages',        // All pages
      'specific_pages',   // Specific pages (use pagePaths)
      'homepage',         // Homepage only
      'shop',             // Shop/Product listing
      'product',          // Single product pages
      'cart',             // Cart page
      'checkout',         // Checkout page
      'account',          // Account pages
      'login',            // Login page
      'register',         // Register page
      'custom'            // Custom paths (use pagePaths)
    ],
    default: 'all_pages'
  },
  
  // Specific page paths (for pageTarget: 'specific_pages' or 'custom')
  pagePaths: [{
    type: String,
    trim: true
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Priority (higher = loads first)
  priority: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  
  // Safety & Validation
  syntaxValid: {
    type: Boolean,
    default: null  // null = not checked, true = valid, false = invalid
  },
  syntaxErrors: [{
    line: Number,
    column: Number,
    message: String,
    severity: {
      type: String,
      enum: ['error', 'warning'],
      default: 'error'
    }
  }],
  lastValidated: Date,
  
  // Safety Settings
  wrapInTryCatch: {
    type: Boolean,
    default: true  // Wrap JS in try-catch for safety
  },
  allowUnsafeCode: {
    type: Boolean,
    default: false  // Allow potentially unsafe code (eval, innerHTML, etc.)
  },
  emergencyDisable: {
    type: Boolean,
    default: false  // Emergency disable flag (accessible even if site breaks)
  },
  
  // Advanced Options
  async: {
    type: Boolean,
    default: false  // For script tags
  },
  defer: {
    type: Boolean,
    default: false  // For script tags
  },
  deviceTarget: {
    type: String,
    enum: ['all', 'desktop', 'mobile', 'tablet'],
    default: 'all'
  },
  
  // Conditions (Code Snippets Pro feature)
  conditions: {
    loggedIn: {
      type: String,
      enum: ['any', 'logged_in', 'logged_out'],
      default: 'any'
    },
    userRoles: [{
      type: String,
      trim: true
    }],
    dateFrom: Date,
    dateTo: Date,
    urlContains: [{
      type: String,
      trim: true
    }],
    urlNotContains: [{
      type: String,
      trim: true
    }]
  },
  
  // Minify JS output
  minify: {
    type: Boolean,
    default: false
  },
  
  // Load CSS as external stylesheet (link tag instead of inline style)
  externalStylesheet: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Version History (keep last 10 versions)
  versions: [{
    code: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Shortcode name (for embedding snippet output inline)
  shortcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes for performance
codeSnippetSchema.index({ environment: 1, location: 1, isActive: 1, emergencyDisable: 1 });
codeSnippetSchema.index({ pageTarget: 1, isActive: 1 });
codeSnippetSchema.index({ priority: -1 });
codeSnippetSchema.index({ type: 1, isActive: 1 });

// Method to check if snippet should load on a specific page
codeSnippetSchema.methods.shouldLoadOnPage = function(pagePath, pageType) {
  // Emergency disable check
  if (this.emergencyDisable) return false;
  
  // Active check
  if (!this.isActive) return false;
  
  // Environment check (handled by injection service)
  
  // Page targeting logic
  if (this.pageTarget === 'all_pages') return true;
  if (this.pageTarget === 'homepage' && pagePath === '/') return true;
  if (this.pageTarget === 'shop' && pageType === 'shop') return true;
  if (this.pageTarget === 'product' && pageType === 'product') return true;
  if (this.pageTarget === 'cart' && pageType === 'cart') return true;
  if (this.pageTarget === 'checkout' && pageType === 'checkout') return true;
  if (this.pageTarget === 'account' && pagePath.startsWith('/account')) return true;
  if (this.pageTarget === 'login' && pagePath === '/login') return true;
  if (this.pageTarget === 'register' && pagePath === '/register') return true;
  
  // Specific pages or custom paths
  if ((this.pageTarget === 'specific_pages' || this.pageTarget === 'custom') && this.pagePaths) {
    return this.pagePaths.some(path => {
      // Support exact match or wildcard
      if (path === pagePath) return true;
      if (path.endsWith('*') && pagePath.startsWith(path.slice(0, -1))) return true;
      return false;
    });
  }
  
  return false;
};

// Method to get safe wrapped code
codeSnippetSchema.methods.getSafeCode = function() {
  let code = this.code;
  
  if (this.type === 'javascript') {
    // Minify if enabled
    if (this.minify) {
      code = code
        .replace(/\/\/.*$/gm, '')           // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')    // Remove multi-line comments
        .replace(/\s*\n\s*/g, '')            // Remove newlines and surrounding whitespace
        .replace(/\s{2,}/g, ' ')             // Collapse multiple spaces
        .trim();
    }
    
    if (this.wrapInTryCatch && !this.allowUnsafeCode) {
      return `(function(){try{${this.minify ? code : '\n    ' + code + '\n  '}}catch(e){console.error('Code Snippet Error [${this.name}]:',e)}})();`;
    }
  }
  
  return code;
};

// Static method to get active snippets for a location
codeSnippetSchema.statics.getActiveSnippets = async function(environment, location, pagePath, pageType, userContext) {
  const query = {
    environment: { $in: [environment, 'all'] },
    location,
    isActive: true,
    emergencyDisable: false
  };
  
  const snippets = await this.find(query).sort({ priority: -1, createdAt: 1 });
  
  // Filter by page targeting and conditions
  const now = new Date();
  return snippets.filter(snippet => {
    if (!snippet.shouldLoadOnPage(pagePath, pageType)) return false;
    
    // Check conditions
    const cond = snippet.conditions || {};
    
    // Date range condition
    if (cond.dateFrom && now < cond.dateFrom) return false;
    if (cond.dateTo && now > cond.dateTo) return false;
    
    // URL contains/not-contains conditions
    if (cond.urlContains && cond.urlContains.length > 0) {
      if (!cond.urlContains.some(u => pagePath.includes(u))) return false;
    }
    if (cond.urlNotContains && cond.urlNotContains.length > 0) {
      if (cond.urlNotContains.some(u => pagePath.includes(u))) return false;
    }
    
    // Logged-in condition (requires userContext)
    if (cond.loggedIn && cond.loggedIn !== 'any' && userContext) {
      if (cond.loggedIn === 'logged_in' && !userContext.isLoggedIn) return false;
      if (cond.loggedIn === 'logged_out' && userContext.isLoggedIn) return false;
    }
    
    // User role condition
    if (cond.userRoles && cond.userRoles.length > 0 && userContext) {
      if (!userContext.role || !cond.userRoles.includes(userContext.role)) return false;
    }
    
    return true;
  });
};

module.exports = mongoose.model('CodeSnippet', codeSnippetSchema);
