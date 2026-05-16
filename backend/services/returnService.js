const Return = require('../models/Return');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const LoyaltyPoint = require('../models/LoyaltyPoint');
const Settings = require('../models/Settings');
const emailService = require('./emailService');
const { LOYALTY_TYPES } = require('../config/constants');

const REFUND_WINDOW_DAYS = 30;

class ReturnService {
  isEligibleForReturn(order) {
    if (!order) return { ok: false, reason: 'Order not found' };
    if (!['delivered', 'completed'].includes(order.status)) {
      return { ok: false, reason: 'Order must be delivered before requesting a return' };
    }
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (days > REFUND_WINDOW_DAYS) {
      return { ok: false, reason: `Return window of ${REFUND_WINDOW_DAYS} days has passed` };
    }
    return { ok: true };
  }

  async issueRefund(rma) {
    if (rma.refundedAt) return;
    if (rma.refundMethod === 'pesa_coins' || rma.refundMethod === 'store_credit') {
      const points = Math.round(rma.refundAmount);
      if (points > 0) {
        await LoyaltyPoint.addPoints(
          rma.customer,
          points,
          LOYALTY_TYPES.EARNED || 'earned',
          `Refund for return ${rma.rmaNumber}`
        );
      }
      rma.refundReference = `PESA-COINS-${Date.now()}`;
    } else {
      // Original payment refunds need to be queued for the original payment provider.
      // We mark the intent here and leave actual provider reversal to an admin action / external job.
      rma.refundReference = `PENDING-PROVIDER-${Date.now()}`;
    }
    rma.refundedAt = new Date();
    await rma.save();
  }

  async restockItems(rma) {
    for (const item of rma.items) {
      if (!item.restock || !item.product) continue;
      try {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      } catch (e) {
        console.error('Restock error for product', item.product, e.message);
      }
    }
  }

  async notifyCustomer(rma, event) {
    try {
      const user = await User.findById(rma.customer).select('email firstName').lean();
      if (!user?.email) return;
      const subjects = {
        requested: `We received your return request (${rma.rmaNumber})`,
        approved: `Your return ${rma.rmaNumber} is approved`,
        rejected: `Your return ${rma.rmaNumber} was not approved`,
        received: `We received your returned items (${rma.rmaNumber})`,
        refunded: `Your refund has been processed (${rma.rmaNumber})`,
        closed: `Your return ${rma.rmaNumber} is now closed`
      };
      const body = `
        <h2>Hi ${user.firstName || 'there'},</h2>
        <p>Your return <strong>${rma.rmaNumber}</strong> status is now: <strong>${rma.status.replace('_', ' ')}</strong>.</p>
        ${rma.status === 'approved' ? '<p>You can now ship the items back to us. Tracking instructions will follow shortly.</p>' : ''}
        ${rma.status === 'rejected' && rma.rejectionReason ? `<p><strong>Reason:</strong> ${rma.rejectionReason}</p><p>You may open a dispute from your account.</p>` : ''}
        ${rma.status === 'refunded' ? `<p><strong>Refund amount:</strong> R ${rma.refundAmount.toFixed(2)}<br/><strong>Method:</strong> ${rma.refundMethod.replace('_', ' ')}</p>` : ''}
        <p>View details in <a href="${process.env.FRONTEND_URL || 'https://pesashop.com'}/account/returns/${rma._id}">your account</a>.</p>
      `;
      await emailService.sendEmail({ to: user.email, subject: subjects[event] || `Return update: ${rma.rmaNumber}`, html: body });
    } catch (e) {
      console.error('Return notify error:', e.message);
    }
  }

  async notifyAdmin(rma) {
    try {
      const settings = await Settings.getSettings();
      const adminEmail = settings.adminEmail || settings.storeEmail;
      if (!adminEmail) return;
      await emailService.sendEmail({
        to: adminEmail,
        subject: `New return request: ${rma.rmaNumber}`,
        html: `
          <h2>New Return Request</h2>
          <p><strong>RMA:</strong> ${rma.rmaNumber}</p>
          <p><strong>Order:</strong> ${rma.order}</p>
          <p><strong>Reason:</strong> ${rma.reasonCategory} — ${rma.reason}</p>
          <p>Review in admin panel.</p>
        `
      });
    } catch (e) {
      console.error('Return admin notify error:', e.message);
    }
  }
}

module.exports = new ReturnService();
