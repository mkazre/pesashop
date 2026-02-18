const cron = require('node-cron');
const laybyeReminderService = require('../services/laybyeReminderService');
const laybyeExpiryService = require('../services/laybyeExpiryService');

/**
 * Initialize laybye-related cron jobs
 */
const initLaybyeCronJobs = () => {
  // Run every day at 9:00 AM - Check for expired laybyes
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily laybye expiry check...');
    try {
      await laybyeExpiryService.checkAndProcessExpiredLaybyes();
      await laybyeExpiryService.markMissedPayments();
      await laybyeExpiryService.enforceLateFees();
    } catch (error) {
      console.error('❌ Error in laybye expiry cron job:', error);
    }
  });

  // Run every day at 10:00 AM - Send upcoming payment reminders
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running daily laybye reminder check...');
    try {
      await laybyeReminderService.sendUpcomingPaymentReminders();
      await laybyeReminderService.sendOverduePaymentReminders();
      await laybyeReminderService.sendExpiryReminders();
    } catch (error) {
      console.error('❌ Error in laybye reminder cron job:', error);
    }
  });

  // Run every hour - Check for overdue payments and send reminders
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly laybye overdue check...');
    try {
      await laybyeReminderService.sendOverduePaymentReminders();
    } catch (error) {
      console.error('❌ Error in hourly laybye reminder cron job:', error);
    }
  });

  console.log('✅ Laybye cron jobs initialized');
  console.log('   - Daily expiry check: 9:00 AM');
  console.log('   - Daily reminder check: 10:00 AM');
  console.log('   - Hourly overdue check: Every hour');
};

module.exports = {
  initLaybyeCronJobs
};
