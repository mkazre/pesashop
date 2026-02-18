const cron = require('node-cron');
const couponEmailService = require('../services/couponEmailService');

/**
 * Initialize coupon email cron jobs
 */
function initCouponEmailCronJobs() {
  // Run daily at 9 AM to check for birthdays
  cron.schedule('0 9 * * *', async () => {
    console.log('Running birthday coupon check...');
    try {
      await couponEmailService.handleBirthdayCoupons();
    } catch (error) {
      console.error('Error in birthday coupon cron:', error);
    }
  });
  
  // Run daily at 10 AM to check for days since last purchase
  cron.schedule('0 10 * * *', async () => {
    console.log('Running days since last purchase coupon check...');
    try {
      await couponEmailService.handleDaysSinceLastPurchase();
    } catch (error) {
      console.error('Error in days since last purchase cron:', error);
    }
  });
  
  console.log('✅ Coupon email cron jobs initialized');
}

module.exports = { initCouponEmailCronJobs };
