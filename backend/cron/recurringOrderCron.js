const cron = require('node-cron');
const RecurringOrder = require('../models/RecurringOrder');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

/**
 * Process due recurring deliveries.
 * Creates an Order record for each delivery instance that is due today,
 * advances the schedule, and marks instances as complete.
 */
async function processDueDeliveries() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const dueOrders = await RecurringOrder.find({
    status: 'active',
    nextDeliveryDate: { $lte: today }
  }).populate('customer', 'firstName lastName email phone addresses')
    .populate('product', 'name sku regularPrice salePrice');

  console.log(`[recurringOrderCron] Found ${dueOrders.length} due recurring deliveries`);

  for (const ro of dueOrders) {
    try {
      // Create an Order record for this delivery
      const shippingAddress = ro.shippingAddress || ro.customer?.addresses?.find(a => a.isDefault) || {};
      const unitPrice = ro.unitPrice;
      const total = unitPrice * ro.quantity;

      const order = await Order.create({
        customer: ro.customer._id,
        items: [{
          product: ro.product._id,
          name: ro.productName || ro.product?.name,
          sku: ro.productSku || ro.product?.sku,
          quantity: ro.quantity,
          price: unitPrice,
          total,
          variation: ro.variant || undefined,
          isRecurring: true,
          recurringOrderId: ro._id
        }],
        subtotal: total,
        tax: 0,
        total,
        shippingAddress,
        billingAddress: shippingAddress,
        paymentStatus: ro.paymentMode === 'upfront' ? 'completed' : 'pending',
        paymentMethod: ro.paymentMode === 'upfront' ? 'recurring_upfront' : 'recurring_payg',
        status: 'processing',
        notes: `Recurring delivery ${ro.completedInstances + 1} — ${ro.frequency}`
      });

      // Update delivery instance record
      const deliveryIdx = ro.deliveries.findIndex(
        d => d.status === 'scheduled' && new Date(d.scheduledDate) <= today
      );
      if (deliveryIdx >= 0) {
        ro.deliveries[deliveryIdx].status = 'delivered';
        ro.deliveries[deliveryIdx].order = order._id;
        ro.deliveries[deliveryIdx].paymentStatus = ro.paymentMode === 'upfront' ? 'paid' : 'pending';
      }

      ro.completedInstances += 1;
      if (ro.remainingInstances != null) {
        ro.remainingInstances = Math.max(0, ro.remainingInstances - 1);
      }

      // Check if upfront mode is complete
      if (ro.paymentMode === 'upfront' && ro.remainingInstances === 0) {
        ro.status = 'completed';
        ro.completedAt = new Date();

        // Send completion email
        await emailService.sendTemplatedEmail('recurring_order_completed', ro.customer.email, {
          customerName: ro.customer.firstName,
          productName: ro.productName,
          frequency: ro.frequency,
          totalDeliveries: ro.totalInstances
        }).catch(e => console.error('[recurringOrderCron] completion email error:', e.message));
      } else {
        // Advance schedule
        const nextMs = new Date(ro.nextDeliveryDate).getTime() + ro.intervalDays * 24 * 60 * 60 * 1000;
        ro.nextDeliveryDate = new Date(nextMs);

        // Add new scheduled delivery for upfront mode
        if (ro.paymentMode === 'upfront' && ro.remainingInstances > 0) {
          ro.deliveries.push({
            scheduledDate: ro.nextDeliveryDate,
            status: 'scheduled',
            paymentStatus: 'paid'
          });
        }

        // Send delivery reminder for PAYG (update next payment date)
        if (ro.paymentMode === 'pay_as_you_go') {
          const settings = await Settings.getSettings();
          const reminderDays = settings.recurringReminderDays || 3;
          ro.nextPaymentDate = new Date(nextMs - reminderDays * 24 * 60 * 60 * 1000);
        }
      }

      await ro.save();
    } catch (err) {
      console.error(`[recurringOrderCron] Error processing recurring order ${ro._id}:`, err.message);
    }
  }
}

/**
 * Send payment reminders for pay-as-you-go recurring orders.
 * Sends reminder emails when nextPaymentDate has arrived.
 */
async function sendPaymentReminders() {
  const now = new Date();

  const dueReminders = await RecurringOrder.find({
    status: 'active',
    paymentMode: 'pay_as_you_go',
    nextPaymentDate: { $lte: now },
    lastReminderSentAt: {
      $not: { $gte: new Date(now - 23 * 60 * 60 * 1000) } // not sent in last 23h
    }
  }).populate('customer', 'firstName email')
    .populate('product', 'name');

  console.log(`[recurringOrderCron] Sending ${dueReminders.length} PAYG payment reminders`);

  for (const ro of dueReminders) {
    try {
      await emailService.sendTemplatedEmail('recurring_payment_reminder', ro.customer.email, {
        customerName: ro.customer.firstName,
        productName: ro.productName || ro.product?.name,
        nextDeliveryDate: ro.nextDeliveryDate?.toLocaleDateString('en-ZA'),
        frequency: ro.frequency,
        quantity: ro.quantity,
        amount: (ro.unitPrice * ro.quantity).toFixed(2)
      });

      ro.lastReminderSentAt = new Date();
      await ro.save();
    } catch (err) {
      console.error(`[recurringOrderCron] Payment reminder error for ${ro._id}:`, err.message);
    }
  }
}

/**
 * Send subscription expiry reminders for service providers.
 */
async function sendServiceProviderExpiryReminders() {
  try {
    const ServiceProvider = require('../models/ServiceProvider');
    const settings = await Settings.getSettings();
    const reminderDays = settings.serviceProviderRenewalReminderDays || 7;
    const cutoff = new Date(Date.now() + reminderDays * 24 * 60 * 60 * 1000);

    const expiring = await ServiceProvider.find({
      subscriptionStatus: 'active',
      subscriptionExpiry: { $lte: cutoff, $gte: new Date() },
      subscriptionRenewalRemindedAt: {
        $not: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }
      }
    });

    for (const sp of expiring) {
      await emailService.sendTemplatedEmail('service_provider_subscription_expiring', sp.email, {
        businessName: sp.businessName,
        contactName: sp.contactName,
        expiryDate: sp.subscriptionExpiry?.toLocaleDateString('en-ZA'),
        daysRemaining: reminderDays
      }).catch(e => console.error('[recurringOrderCron] SP expiry reminder error:', e.message));

      sp.subscriptionRenewalRemindedAt = new Date();
      await sp.save();
    }
  } catch (err) {
    console.error('[recurringOrderCron] SP expiry check error:', err.message);
  }
}

/**
 * Initialize all recurring-related cron jobs.
 */
function initRecurringOrderCronJobs() {
  // Process due deliveries daily at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    console.log('⏰ [Recurring] Processing due deliveries...');
    try {
      await processDueDeliveries();
    } catch (err) {
      console.error('❌ [Recurring] Delivery processing error:', err);
    }
  });

  // Send PAYG payment reminders daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [Recurring] Sending PAYG payment reminders...');
    try {
      await sendPaymentReminders();
    } catch (err) {
      console.error('❌ [Recurring] Payment reminder error:', err);
    }
  });

  // Service provider subscription expiry reminders daily at 9:30 AM
  cron.schedule('30 9 * * *', async () => {
    console.log('⏰ [Recurring] Checking service provider subscription expiry...');
    try {
      await sendServiceProviderExpiryReminders();
    } catch (err) {
      console.error('❌ [Recurring] SP expiry check error:', err);
    }
  });

  console.log('✅ Recurring order cron jobs initialized');
  console.log('   - Delivery processing: 7:00 AM daily');
  console.log('   - PAYG reminders: 8:00 AM daily');
  console.log('   - SP subscription reminders: 9:30 AM daily');
}

module.exports = { initRecurringOrderCronJobs };
