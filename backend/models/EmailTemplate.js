const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a template name'],
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please provide email subject'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'order_confirmation',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'new_account',
      'password_reset',
      'laybye_created',
      'laybye_payment',
      'laybye_completed',
      'loyalty_points_earned',
      'loyalty_points_redeemed',
      'gift_card_issued',
      'coupon_first_purchase',
      'coupon_new_user',
      'coupon_spending_milestone',
      'coupon_birthday',
      'promotional',
      'custom'
    ]
  },
  htmlContent: {
    type: String,
    required: [true, 'Please provide HTML content']
  },
  textContent: {
    type: String
  },
  variables: [{
    name: String,
    description: String,
    example: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  fromName: {
    type: String,
    default: 'Your Store'
  },
  fromEmail: {
    type: String
  },
  replyTo: {
    type: String
  },
  previewText: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

emailTemplateSchema.index({ slug: 1, type: 1 });
emailTemplateSchema.index({ isActive: 1 });

// Static method to get default template by type
emailTemplateSchema.statics.getDefaultByType = function(type) {
  return this.findOne({ type, isDefault: true, isActive: true });
};

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

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
