const Laybye = require('../models/Laybye');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const LaybyTransaction = require('../models/LaybyTransaction');
const { LAYBYE_STATUS } = require('../config/constants');

/**
 * Check and process expired laybyes
 */
const checkAndProcessExpiredLaybyes = async () => {
  try {
    const settings = await Settings.getSettings();
    
    if (!settings.layby?.autoCancelOnExpiry) {
      console.log('Auto-cancel on expiry is disabled in settings');
      return;
    }

    const now = new Date();
    const expiredLaybyes = await Laybye.find({
      status: LAYBYE_STATUS.ACTIVE,
      expiryDate: { 
        $exists: true, 
        $ne: null,
        $lt: now 
      },
      isExpired: false
    })
      .populate('customer')
      .populate('laybyPlan')
      .populate('order');

    let processedCount = 0;
    let cancelledCount = 0;

    for (const laybye of expiredLaybyes) {
      try {
        // Mark as expired
        laybye.isExpired = true;
        laybye.status = LAYBYE_STATUS.DEFAULTED;
        
        // Calculate refund based on plan settings
        const plan = laybye.laybyPlan;
        let refundAmount = laybye.paidAmount;
        let keepDeposit = false;

        if (plan) {
          keepDeposit = plan.keepDepositOnCancellation || false;
          
          if (keepDeposit) {
            refundAmount = Math.max(0, laybye.paidAmount - laybye.depositAmount);
          }

          // Apply cancellation fees if any
          if (plan.cancellationFee > 0) {
            refundAmount = Math.max(0, refundAmount - plan.cancellationFee);
          } else if (plan.cancellationFeePercentage > 0) {
            const fee = (laybye.totalAmount * plan.cancellationFeePercentage) / 100;
            refundAmount = Math.max(0, refundAmount - fee);
          }
        }

        laybye.cancelledDate = new Date();
        laybye.cancellationReason = 'Laybye expired automatically';
        laybye.refundAmount = refundAmount;
        laybye.keepDeposit = keepDeposit;
        laybye.refundProcessed = false; // Admin needs to process refund manually

        await laybye.save();

        // Update associated order
        if (laybye.order) {
          await Order.findByIdAndUpdate(laybye.order, {
            status: 'cancelled',
            paymentStatus: 'refunded',
            adminNote: `Laybye expired on ${new Date().toLocaleDateString('en-ZA')}. Refund amount: R ${refundAmount.toFixed(2)}`
          });
        }

        processedCount++;
        cancelledCount++;
        
        console.log(`✅ Processed expired laybye ${laybye._id} - Refund: R ${refundAmount.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Failed to process expired laybye ${laybye._id}:`, error);
      }
    }

    console.log(`⏰ Processed ${processedCount} expired laybyes (${cancelledCount} cancelled)`);
    return { processed: processedCount, cancelled: cancelledCount };
  } catch (error) {
    console.error('❌ Error checking expired laybyes:', error);
    throw error;
  }
};

/**
 * Mark missed payments for overdue laybyes
 */
const markMissedPayments = async () => {
  try {
    const now = new Date();
    const overdueLaybyes = await Laybye.find({
      status: LAYBYE_STATUS.ACTIVE,
      nextPaymentDate: { 
        $exists: true, 
        $ne: null,
        $lt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Overdue by at least 1 day
      }
    })
      .populate('laybyPlan');

    let markedCount = 0;

    for (const laybye of overdueLaybyes) {
      try {
        // Check if payment was missed (no payment recorded after due date)
        const lastPayment = laybye.payments
          .filter(p => p.status === 'completed')
          .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];

        const paymentWasMissed = !lastPayment || 
          new Date(lastPayment.paymentDate) < laybye.nextPaymentDate;

        if (paymentWasMissed) {
          // Check if already marked for this payment period
          const daysSinceDue = Math.ceil(
            (now - laybye.nextPaymentDate) / (1000 * 60 * 60 * 24)
          );

          // Only mark once per payment period (approximately)
          const paymentPeriodDays = laybye.installmentPlan.frequency === 'weekly' ? 7 :
            laybye.installmentPlan.frequency === 'biweekly' ? 14 : 30;

          if (daysSinceDue >= paymentPeriodDays) {
            await laybye.markMissedPayment();
            markedCount++;
            console.log(`✅ Marked missed payment for laybye ${laybye._id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to mark missed payment for laybye ${laybye._id}:`, error);
      }
    }

    console.log(`⏰ Marked ${markedCount} missed payments`);
    return markedCount;
  } catch (error) {
    console.error('❌ Error marking missed payments:', error);
    throw error;
  }
};

/**
 * Enforce late payment fees on overdue laybyes
 */
const enforceLateFees = async () => {
  try {
    const now = new Date();
    const overdueLaybyes = await Laybye.find({
      status: LAYBYE_STATUS.ACTIVE,
      nextPaymentDate: {
        $exists: true,
        $ne: null,
        $lt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // At least 1 day overdue
      }
    }).populate('laybyPlan');

    let feesCharged = 0;

    for (const laybye of overdueLaybyes) {
      try {
        const plan = laybye.laybyPlan;
        if (!plan) continue;

        // Calculate late fee
        let lateFee = 0;
        if (plan.latePaymentFee > 0) {
          lateFee = plan.latePaymentFee;
        } else if (plan.latePaymentFeePercentage > 0) {
          const installmentAmount = laybye.installmentPlan?.installmentAmount || 0;
          lateFee = (installmentAmount * plan.latePaymentFeePercentage) / 100;
        }

        if (lateFee <= 0) continue;

        // Check if a late fee was already charged for this payment period
        const existingFee = await LaybyTransaction.findOne({
          laybye: laybye._id,
          type: 'late_fee',
          createdAt: {
            $gte: laybye.nextPaymentDate // Fee charged after the due date
          }
        });

        if (existingFee) continue; // Already charged for this period

        // Add late fee to remaining amount
        laybye.remainingAmount = (laybye.remainingAmount || 0) + lateFee;
        await laybye.save();

        // Log the late fee transaction
        await LaybyTransaction.create({
          laybye: laybye._id,
          customer: laybye.customer,
          type: 'late_fee',
          amount: lateFee,
          order: laybye.order,
          balanceBefore: laybye.remainingAmount - lateFee,
          balanceAfter: laybye.remainingAmount,
          status: 'completed',
          note: `Late payment fee charged (payment was due ${laybye.nextPaymentDate.toLocaleDateString('en-ZA')})`,
          source: 'cron'
        });

        feesCharged++;
        console.log(`💰 Late fee R ${lateFee.toFixed(2)} charged on laybye ${laybye._id}`);
      } catch (error) {
        console.error(`❌ Failed to charge late fee for laybye ${laybye._id}:`, error);
      }
    }

    console.log(`💰 Charged ${feesCharged} late payment fees`);
    return feesCharged;
  } catch (error) {
    console.error('❌ Error enforcing late fees:', error);
    throw error;
  }
};

module.exports = {
  checkAndProcessExpiredLaybyes,
  markMissedPayments,
  enforceLateFees
};
