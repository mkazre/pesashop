const Laybye = require('../models/Laybye');
const Settings = require('../models/Settings');
const { LAYBYE_STATUS } = require('../config/constants');
const emailService = require('./emailService');

/**
 * Send email reminders for upcoming laybye payments
 */
const sendUpcomingPaymentReminders = async () => {
  try {
    const settings = await Settings.getSettings();
    
    if (!settings.layby?.sendEmailReminders) {
      console.log('Email reminders are disabled in settings');
      return;
    }

    const now = new Date();
    const activeLaybyes = await Laybye.find({
      status: LAYBYE_STATUS.ACTIVE,
      nextPaymentDate: { $exists: true, $ne: null }
    })
      .populate('customer')
      .populate('laybyPlan')
      .populate('order');

    let remindersSent = 0;

    for (const laybye of activeLaybyes) {
      if (!laybye.nextPaymentDate || !laybye.customer || !laybye.laybyPlan) {
        continue;
      }

      const daysUntilPayment = Math.ceil(
        (laybye.nextPaymentDate - now) / (1000 * 60 * 60 * 24)
      );

      // Check if reminder should be sent based on plan configuration
      const reminderDays = laybye.laybyPlan.emailReminders?.daysBefore || [];
      
      if (reminderDays.includes(daysUntilPayment)) {
        // Check if reminder already sent for this date
        const reminderAlreadySent = laybye.remindersSent?.some(
          r => r.type === 'upcoming' && 
          Math.abs(new Date(r.date) - now) < 24 * 60 * 60 * 1000 // Within 24 hours
        );

        if (!reminderAlreadySent) {
          try {
            await emailService.sendLaybyeReminder(laybye);
            
            // Record reminder
            if (!laybye.remindersSent) {
              laybye.remindersSent = [];
            }
            laybye.remindersSent.push({
              date: new Date(),
              type: 'upcoming',
              sent: true
            });
            laybye.lastReminderSent = new Date();
            await laybye.save();
            
            remindersSent++;
            console.log(`✅ Sent upcoming payment reminder for laybye ${laybye._id}`);
          } catch (error) {
            console.error(`❌ Failed to send reminder for laybye ${laybye._id}:`, error);
          }
        }
      }
    }

    console.log(`📧 Sent ${remindersSent} upcoming payment reminders`);
    return remindersSent;
  } catch (error) {
    console.error('❌ Error sending upcoming payment reminders:', error);
    throw error;
  }
};

/**
 * Send email reminders for overdue laybye payments
 */
const sendOverduePaymentReminders = async () => {
  try {
    const settings = await Settings.getSettings();
    
    if (!settings.layby?.sendEmailReminders) {
      return;
    }

    const now = new Date();
    const overdueLaybyes = await Laybye.find({
      status: LAYBYE_STATUS.ACTIVE,
      nextPaymentDate: { $lt: now }
    })
      .populate('customer')
      .populate('laybyPlan')
      .populate('order');

    let remindersSent = 0;
    const reminderInterval = 7; // Default 7 days between overdue reminders

    for (const laybye of overdueLaybyes) {
      if (!laybye.customer || !laybye.laybyPlan) {
        continue;
      }

      const planInterval = laybye.laybyPlan.emailReminders?.overdueReminderInterval || reminderInterval;
      const daysOverdue = Math.ceil((now - laybye.nextPaymentDate) / (1000 * 60 * 60 * 24));

      // Send reminder if it's been the right number of days since last reminder
      const shouldSend = !laybye.lastReminderSent || 
        Math.ceil((now - laybye.lastReminderSent) / (1000 * 60 * 60 * 24)) >= planInterval;

      if (shouldSend && daysOverdue > 0) {
        try {
          await emailService.sendLaybyeReminder(laybye, 'overdue');
          
          // Record reminder
          if (!laybye.remindersSent) {
            laybye.remindersSent = [];
          }
          laybye.remindersSent.push({
            date: new Date(),
            type: 'overdue',
            sent: true
          });
          laybye.lastReminderSent = new Date();
          await laybye.save();
          
          remindersSent++;
          console.log(`✅ Sent overdue payment reminder for laybye ${laybye._id}`);
        } catch (error) {
          console.error(`❌ Failed to send overdue reminder for laybye ${laybye._id}:`, error);
        }
      }
    }

    console.log(`📧 Sent ${remindersSent} overdue payment reminders`);
    return remindersSent;
  } catch (error) {
    console.error('❌ Error sending overdue payment reminders:', error);
    throw error;
  }
};

/**
 * Send email reminders for expiring laybyes
 */
const sendExpiryReminders = async () => {
  try {
    const settings = await Settings.getSettings();
    
    if (!settings.layby?.sendEmailReminders) {
      return;
    }

    const now = new Date();
    const expiringLaybyes = await Laybye.find({
      status: LAYBYE_STATUS.ACTIVE,
      expiryDate: { 
        $exists: true, 
        $ne: null,
        $gte: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Expiring within 7 days
      }
    })
      .populate('customer')
      .populate('laybyPlan')
      .populate('order');

    let remindersSent = 0;

    for (const laybye of expiringLaybyes) {
      if (!laybye.customer || !laybye.expiryDate) {
        continue;
      }

      const daysUntilExpiry = Math.ceil(
        (laybye.expiryDate - now) / (1000 * 60 * 60 * 24)
      );

      // Send reminder if expiring within 7 days and not already sent
      if (daysUntilExpiry <= 7) {
        const reminderAlreadySent = laybye.remindersSent?.some(
          r => r.type === 'expiry' && 
          Math.abs(new Date(r.date) - now) < 24 * 60 * 60 * 1000
        );

        if (!reminderAlreadySent) {
          try {
            await emailService.sendLaybyeReminder(laybye, 'expiry');
            
            // Record reminder
            if (!laybye.remindersSent) {
              laybye.remindersSent = [];
            }
            laybye.remindersSent.push({
              date: new Date(),
              type: 'expiry',
              sent: true
            });
            await laybye.save();
            
            remindersSent++;
            console.log(`✅ Sent expiry reminder for laybye ${laybye._id}`);
          } catch (error) {
            console.error(`❌ Failed to send expiry reminder for laybye ${laybye._id}:`, error);
          }
        }
      }
    }

    console.log(`📧 Sent ${remindersSent} expiry reminders`);
    return remindersSent;
  } catch (error) {
    console.error('❌ Error sending expiry reminders:', error);
    throw error;
  }
};

module.exports = {
  sendUpcomingPaymentReminders,
  sendOverduePaymentReminders,
  sendExpiryReminders
};
