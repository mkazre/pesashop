const mongoose = require('mongoose');
const { EMAIL_TYPES, SNIPPET_LOCATIONS } = require('../config/constants');

// Email Template Schema
const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(EMAIL_TYPES),
    required: true
  },
  
  subject: {
    type: String,
    required: true
  },
  
  // Email Content
  htmlContent: {
    type: String,
    required: true
  },
  textContent: String,
  
  // Template Variables
  availableVariables: [{
    key: String,
    description: String,
    example: String
  }],
  
  // Design Settings
  headerColor: {
    type: String,
    default: '#0e604a'
  },
  footerColor: {
    type: String,
    default: '#000000'
  },
  buttonColor: {
    type: String,
    default: '#0e604a'
  },
  logo: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  testRecipient: String,
  lastTestedAt: Date
  
}, {
  timestamps: true
});

// Indexes
emailTemplateSchema.index({ slug: 1 });
emailTemplateSchema.index({ type: 1 });
emailTemplateSchema.index({ isDefault: 1 });

// Method to render template with variables
emailTemplateSchema.methods.render = function(variables = {}) {
  let html = this.htmlContent;
  let text = this.textContent;
  let subject = this.subject;
  
  // Replace all variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const value = variables[key] || '';
    
    if (html) html = html.replace(regex, value);
    if (text) text = text.replace(regex, value);
    if (subject) subject = subject.replace(regex, value);
  });
  
  return {
    subject,
    html,
    text
  };
};

// Static method to get default template by type
emailTemplateSchema.statics.getDefaultByType = function(type) {
  return this.findOne({ type, isDefault: true, isActive: true });
};

// Code Snippet Schema
const codeSnippetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  
  code: {
    type: String,
    required: true
  },
  
  location: {
    type: String,
    enum: Object.values(SNIPPET_LOCATIONS),
    required: true
  },
  
  // Conditions
  conditions: {
    pages: [String], // ['home', 'product', 'checkout']
    deviceTypes: [String], // ['desktop', 'mobile', 'tablet']
    userRoles: [String] // ['customer', 'admin']
  },
  
  // Priority (lower number = earlier execution)
  priority: {
    type: Number,
    default: 10
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Type
  type: {
    type: String,
    enum: ['javascript', 'css', 'html'],
    default: 'javascript'
  }
  
}, {
  timestamps: true
});

// Indexes
codeSnippetSchema.index({ location: 1 });
codeSnippetSchema.index({ isActive: 1 });
codeSnippetSchema.index({ priority: 1 });

// Static method to get snippets by location
codeSnippetSchema.statics.getByLocation = function(location, page = null, userRole = null) {
  const query = {
    location,
    isActive: true
  };
  
  // Add conditions if provided
  if (page || userRole) {
    query.$or = [];
    
    if (page) {
      query.$or.push(
        { 'conditions.pages': { $size: 0 } },
        { 'conditions.pages': page }
      );
    }
    
    if (userRole) {
      query.$or.push(
        { 'conditions.userRoles': { $size: 0 } },
        { 'conditions.userRoles': userRole }
      );
    }
  }
  
  return this.find(query).sort({ priority: 1 });
};

// Page Builder Schema
const pageBuilderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  
  type: {
    type: String,
    enum: ['web', 'app'],
    required: true
  },
  
  // JSON structure for the page/screen
  structure: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Template Type
  templateType: {
    type: String,
    enum: ['homepage', 'product', 'category', 'cart', 'checkout', 'custom', 
           'app_home', 'app_product', 'app_category', 'app_cart', 'app_profile'],
    default: 'custom'
  },
  
  // SEO (for web pages)
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  ogImage: String,
  
  // Settings
  settings: {
    backgroundColor: String,
    padding: String,
    customCSS: String,
    customJS: String
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  versions: [{
    version: Number,
    structure: mongoose.Schema.Types.Mixed,
    createdAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Status
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Indexes
pageBuilderSchema.index({ slug: 1 });
pageBuilderSchema.index({ type: 1 });
pageBuilderSchema.index({ templateType: 1 });
pageBuilderSchema.index({ isPublished: 1 });

// Method to create new version
pageBuilderSchema.methods.createVersion = async function(userId) {
  this.versions.push({
    version: this.version,
    structure: this.structure,
    createdAt: new Date(),
    createdBy: userId
  });
  
  this.version += 1;
  await this.save();
};

// Method to restore version
pageBuilderSchema.methods.restoreVersion = async function(versionNumber) {
  const version = this.versions.find(v => v.version === versionNumber);
  
  if (!version) {
    throw new Error('Version not found');
  }
  
  this.structure = version.structure;
  await this.save();
};

// Only export PageBuilder - EmailTemplate and CodeSnippet are now in their own files
// EmailTemplate model is now in ./EmailTemplate.js
// CodeSnippet model is now in ./CodeSnippet.js
module.exports = {
  PageBuilder: mongoose.model('PageBuilder', pageBuilderSchema)
};
