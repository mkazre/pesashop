const cron = require('node-cron');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ReviewSettings = require('../models/ReviewSettings');
const Product = require('../models/Product');
const emailService = require('../services/emailService');

// Send review reminder emails
const sendReviewReminders = async () => {
  try {
    const settings = await ReviewSettings.getSettings();
    
    if (!settings.emailReminderEnabled) {
      console.log('Review reminder emails are disabled');
      return;
    }
    
    if (!settings.emailTemplate) {
      console.log('No email template configured for review reminders');
      return;
    }
    
    // Calculate the date threshold
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - settings.emailReminderDays);
    
    // Find completed orders from the threshold date
    const orders = await Order.find({
      status: 'completed',
      createdAt: { $gte: daysAgo },
      'items.product': { $exists: true }
    })
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name slug');
    
    if (!orders || orders.length === 0) {
      console.log('No orders found for review reminders');
      return;
    }
    
    let remindersSent = 0;
    
    for (const order of orders) {
      if (!order.customer || !order.customer.email) {
        continue;
      }
      
      // Check if customer has already received a reminder for this order
      // (We'll track this by checking if they've reviewed any products from the order)
      const orderProductIds = order.items.map(item => item.product._id || item.product);
      
      // Check if customer has reviewed any products from this order
      const existingReviews = await Review.find({
        user: order.customer._id,
        product: { $in: orderProductIds }
      });
      
      // Skip if customer has already reviewed all products
      if (existingReviews.length >= order.items.length) {
        continue;
      }
      
      // Get products that haven't been reviewed
      const reviewedProductIds = existingReviews.map(r => r.product.toString());
      const unreviewedProducts = order.items.filter(
        item => !reviewedProductIds.includes((item.product._id || item.product).toString())
      );
      
      if (unreviewedProducts.length === 0) {
        continue;
      }
      
      // Send email for each unreviewed product (or combine into one email)
      for (const item of unreviewedProducts) {
        const product = await Product.findById(item.product._id || item.product);
        if (!product) continue;
        
        // Prepare email data
        const emailData = {
          customerName: order.customer.firstName || 'Customer',
          productName: product.name,
          productSlug: product.slug,
          productId: product._id,
          orderNumber: order.orderNumber,
          reviewLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${product.slug}/review?order=${order._id}`
        };
        
        try {
          await emailService.sendTemplatedEmail(
            order.customer.email,
            settings.emailTemplate,
            emailData
          );
          remindersSent++;
        } catch (emailError) {
          console.error(`Failed to send review reminder to ${order.customer.email}:`, emailError);
        }
      }
    }
    
    console.log(`Review reminders sent: ${remindersSent}`);
  } catch (error) {
    console.error('Error sending review reminders:', error);
  }
};

// Initialize cron job - run daily at 9 AM
const initReviewReminderCron = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running review reminder cron job...');
    await sendReviewReminders();
  });
  
  console.log('Review reminder cron job initialized (daily at 9:00 AM)');
};

module.exports = {
  initReviewReminderCron,
  sendReviewReminders
};
