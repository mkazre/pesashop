const CouponEmailSettings = require('../models/CouponEmailSettings');
const { Coupon } = require('../models/Coupon');
const User = require('../models/User');
const Order = require('../models/Order');
const EmailTemplate = require('../models/EmailTemplate');
const emailService = require('./emailService');

class CouponEmailService {
  /**
   * Generate a unique coupon code from template
   */
  async generateCouponFromTemplate(templateId, userId) {
    try {
      const template = await Coupon.findById(templateId);
      if (!template) {
        throw new Error('Coupon template not found');
      }
      
      // Generate unique code
      const user = await User.findById(userId);
      const userCode = user ? `${user.firstName}${user.lastName}`.toUpperCase().substring(0, 4) : 'USER';
      const timestamp = Date.now().toString().slice(-6);
      let code = `${userCode}${timestamp}`;
      
      // Ensure uniqueness
      let exists = await Coupon.findOne({ code });
      let attempts = 0;
      while (exists && attempts < 10) {
        code = `${userCode}${timestamp}${Math.floor(Math.random() * 10)}`;
        exists = await Coupon.findOne({ code });
        attempts++;
      }
      
      // Create new coupon from template
      const coupon = await Coupon.create({
        code,
        description: template.description,
        type: template.type,
        value: template.value,
        usageLimit: template.usageLimit,
        usageLimitPerUser: template.usageLimitPerUser || 1,
        minimumAmount: template.minimumAmount,
        maximumAmount: template.maximumAmount,
        allowedProducts: template.allowedProducts,
        excludedProducts: template.excludedProducts,
        allowedCategories: template.allowedCategories,
        excludedCategories: template.excludedCategories,
        allowedCustomerGroups: template.allowedCustomerGroups,
        allowedEmails: [user?.email].filter(Boolean),
        firstPurchaseOnly: template.firstPurchaseOnly,
        startDate: new Date(),
        endDate: template.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
        isActive: true,
        isStackable: template.isStackable
      });
      
      return coupon;
    } catch (error) {
      console.error('Error generating coupon from template:', error);
      throw error;
    }
  }
  
  /**
   * Send coupon email
   */
  async sendCouponEmail(userId, couponId, templateType) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        throw new Error('User not found or no email');
      }
      
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        throw new Error('Coupon not found');
      }
      
      const settings = await CouponEmailSettings.getSettings();
      let templateId;
      
      // Get appropriate template
      switch (templateType) {
        case 'firstPurchase':
          templateId = settings.templates?.firstPurchase;
          break;
        case 'newUser':
          templateId = settings.templates?.newUser;
          break;
        case 'spendingMilestone':
        case 'orderCount':
        case 'productPurchase':
        case 'daysSinceLastPurchase':
          templateId = settings.templates?.spendingMilestone;
          break;
        case 'birthday':
          templateId = settings.templates?.birthday;
          break;
      }
      
      if (!templateId) {
        // Use default template
        templateId = await EmailTemplate.getDefaultByType(`coupon_${templateType}`);
      }
      
      const emailTemplate = templateId 
        ? await EmailTemplate.findById(templateId)
        : await EmailTemplate.getDefaultByType('promotional');
      
      if (!emailTemplate) {
        throw new Error('Email template not found');
      }
      
      // Prepare variables
      const variables = {
        customerName: `${user.firstName} ${user.lastName}`,
        customerFirstName: user.firstName,
        couponCode: coupon.code,
        couponDescription: coupon.description || '',
        couponValue: coupon.type === 'percentage' 
          ? `${coupon.value}%` 
          : `R ${coupon.value.toFixed(2)}`,
        couponExpiryDate: coupon.endDate 
          ? new Date(coupon.endDate).toLocaleDateString()
          : 'No expiry',
        storeName: process.env.STORE_NAME || 'Our Store',
        storeUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      };
      
      // Render template
      const rendered = emailTemplate.render(variables);
      
      // Send email
      await emailService.sendEmail({
        to: user.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        from: emailTemplate.fromEmail || process.env.EMAIL_FROM,
        fromName: emailTemplate.fromName || process.env.STORE_NAME
      });
      
      return true;
    } catch (error) {
      console.error('Error sending coupon email:', error);
      return false;
    }
  }
  
  /**
   * Handle first purchase automation
   */
  async handleFirstPurchase(userId, orderId) {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.firstPurchase.enabled) {
        return;
      }
      
      // Check if already sent
      if (settings.wasCouponSent(userId, 'firstPurchase')) {
        return;
      }
      
      // Check if this is actually first purchase
      const orderCount = await Order.countDocuments({ customer: userId, status: 'completed' });
      if (orderCount > 1) {
        return; // Not first purchase
      }
      
      const template = settings.automations.firstPurchase.couponTemplate;
      if (!template) {
        return;
      }
      
      // Generate coupon
      const coupon = await this.generateCouponFromTemplate(template, userId);
      
      // Schedule email if delay is set
      const delayHours = settings.automations.firstPurchase.delayHours || 0;
      if (delayHours > 0) {
        // Schedule for later (could use a job queue)
        setTimeout(async () => {
          await this.sendCouponEmail(userId, coupon._id, 'firstPurchase');
          await settings.recordSentCoupon(userId, coupon._id, 'firstPurchase', true);
        }, delayHours * 60 * 60 * 1000);
      } else {
        // Send immediately
        const emailSent = await this.sendCouponEmail(userId, coupon._id, 'firstPurchase');
        await settings.recordSentCoupon(userId, coupon._id, 'firstPurchase', emailSent);
      }
    } catch (error) {
      console.error('Error handling first purchase:', error);
    }
  }
  
  /**
   * Handle new user registration
   */
  async handleNewUser(userId) {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.newUser.enabled) {
        return;
      }
      
      // Check if already sent
      if (settings.wasCouponSent(userId, 'newUser')) {
        return;
      }
      
      const template = settings.automations.newUser.couponTemplate;
      if (!template) {
        return;
      }
      
      // Generate coupon
      const coupon = await this.generateCouponFromTemplate(template, userId);
      
      // Schedule email if delay is set
      const delayHours = settings.automations.newUser.delayHours || 0;
      if (delayHours > 0) {
        setTimeout(async () => {
          await this.sendCouponEmail(userId, coupon._id, 'newUser');
          await settings.recordSentCoupon(userId, coupon._id, 'newUser', true);
        }, delayHours * 60 * 60 * 1000);
      } else {
        const emailSent = await this.sendCouponEmail(userId, coupon._id, 'newUser');
        await settings.recordSentCoupon(userId, coupon._id, 'newUser', emailSent);
      }
    } catch (error) {
      console.error('Error handling new user:', error);
    }
  }
  
  /**
   * Handle spending milestone
   */
  async handleSpendingMilestone(userId, orderTotal) {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.spendingMilestone.enabled) {
        return;
      }
      
      const user = await User.findById(userId);
      if (!user) return;
      
      const totalSpent = user.totalSpent || 0;
      
      // Check milestones
      for (const milestone of settings.automations.spendingMilestone.milestones || []) {
        if (totalSpent >= milestone.amount) {
          // Check if already sent
          if (milestone.sendOnce && settings.wasCouponSent(userId, `spending_${milestone.amount}`)) {
            continue;
          }
          
          if (!milestone.couponTemplate) continue;
          
          // Generate coupon
          const coupon = await this.generateCouponFromTemplate(milestone.couponTemplate, userId);
          
          const emailSent = await this.sendCouponEmail(userId, coupon._id, 'spendingMilestone');
          await settings.recordSentCoupon(userId, coupon._id, `spending_${milestone.amount}`, emailSent);
        }
      }
    } catch (error) {
      console.error('Error handling spending milestone:', error);
    }
  }
  
  /**
   * Handle order count milestone
   */
  async handleOrderCountMilestone(userId) {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.orderCount.enabled) {
        return;
      }
      
      const user = await User.findById(userId);
      if (!user) return;
      
      const orderCount = user.orderCount || 0;
      
      // Check milestones
      for (const milestone of settings.automations.orderCount.milestones || []) {
        if (orderCount >= milestone.orderCount) {
          // Check if already sent
          if (milestone.sendOnce && settings.wasCouponSent(userId, `orders_${milestone.orderCount}`)) {
            continue;
          }
          
          if (!milestone.couponTemplate) continue;
          
          // Generate coupon
          const coupon = await this.generateCouponFromTemplate(milestone.couponTemplate, userId);
          
          const emailSent = await this.sendCouponEmail(userId, coupon._id, 'orderCount');
          await settings.recordSentCoupon(userId, coupon._id, `orders_${milestone.orderCount}`, emailSent);
        }
      }
    } catch (error) {
      console.error('Error handling order count milestone:', error);
    }
  }
  
  /**
   * Handle product purchase
   */
  async handleProductPurchase(userId, orderId) {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.productPurchase.enabled) {
        return;
      }
      
      const order = await Order.findById(orderId).populate('items.product');
      if (!order) return;
      
      const purchasedProductIds = order.items.map(item => item.product._id.toString());
      
      // Check rules
      for (const rule of settings.automations.productPurchase.rules || []) {
        const ruleProductIds = rule.products.map(p => p.toString());
        const hasPurchased = ruleProductIds.some(id => purchasedProductIds.includes(id));
        
        if (hasPurchased) {
          // Check if already sent
          if (rule.sendOnce && settings.wasCouponSent(userId, `product_${rule.products[0]}`)) {
            continue;
          }
          
          if (!rule.couponTemplate) continue;
          
          // Generate coupon
          const coupon = await this.generateCouponFromTemplate(rule.couponTemplate, userId);
          
          const emailSent = await this.sendCouponEmail(userId, coupon._id, 'productPurchase');
          await settings.recordSentCoupon(userId, coupon._id, `product_${rule.products[0]}`, emailSent);
        }
      }
    } catch (error) {
      console.error('Error handling product purchase:', error);
    }
  }
  
  /**
   * Handle birthday coupon (called by cron)
   */
  async handleBirthdayCoupons() {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.birthday.enabled) {
        return;
      }
      
      const today = new Date();
      const sendDate = new Date(today);
      sendDate.setDate(sendDate.getDate() + (settings.automations.birthday.sendDaysBefore || 0));
      
      // Find users with birthday today (or on sendDate)
      const users = await User.find({
        birthday: {
          $gte: new Date(sendDate.getFullYear(), sendDate.getMonth(), sendDate.getDate()),
          $lt: new Date(sendDate.getFullYear(), sendDate.getMonth(), sendDate.getDate() + 1)
        }
      });
      
      for (const user of users) {
        // Check if already sent this year
        const thisYear = new Date().getFullYear();
        const wasSentThisYear = settings.sentCoupons.some(
          sc => sc.user.toString() === user._id.toString() &&
                sc.automationType === 'birthday' &&
                new Date(sc.sentAt).getFullYear() === thisYear
        );
        
        if (wasSentThisYear) continue;
        
        if (!settings.automations.birthday.couponTemplate) continue;
        
        // Generate coupon
        const coupon = await this.generateCouponFromTemplate(
          settings.automations.birthday.couponTemplate,
          user._id
        );
        
        const emailSent = await this.sendCouponEmail(user._id, coupon._id, 'birthday');
        await settings.recordSentCoupon(user._id, coupon._id, 'birthday', emailSent);
      }
    } catch (error) {
      console.error('Error handling birthday coupons:', error);
    }
  }
  
  /**
   * Handle days since last purchase (called by cron)
   */
  async handleDaysSinceLastPurchase() {
    try {
      const settings = await CouponEmailSettings.getSettings();
      if (!settings.enabled || !settings.automations.daysSinceLastPurchase.enabled) {
        return;
      }
      
      const days = settings.automations.daysSinceLastPurchase.days || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Find users with last order before cutoff
      const users = await User.find({
        role: 'customer',
        orderCount: { $gt: 0 }
      });
      
      for (const user of users) {
        const lastOrder = await Order.findOne({ customer: user._id })
          .sort({ createdAt: -1 });
        
        if (!lastOrder) continue;
        
        const lastOrderDate = new Date(lastOrder.createdAt);
        if (lastOrderDate >= cutoffDate) continue; // Too recent
        
        // Check if already sent
        if (settings.automations.daysSinceLastPurchase.sendOnce) {
          if (settings.wasCouponSent(user._id, 'daysSinceLastPurchase')) {
            continue;
          }
        }
        
        if (!settings.automations.daysSinceLastPurchase.couponTemplate) continue;
        
        // Generate coupon
        const coupon = await this.generateCouponFromTemplate(
          settings.automations.daysSinceLastPurchase.couponTemplate,
          user._id
        );
        
        const emailSent = await this.sendCouponEmail(user._id, coupon._id, 'daysSinceLastPurchase');
        await settings.recordSentCoupon(user._id, coupon._id, 'daysSinceLastPurchase', emailSent);
      }
    } catch (error) {
      console.error('Error handling days since last purchase:', error);
    }
  }
}

module.exports = new CouponEmailService();
