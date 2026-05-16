const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const Referral = require('../models/Referral');
const User = require('../models/User');
const referralService = require('../services/referralService');

// ─── Public ────────────────────────────────────────────────────

// GET /api/referrals/code/:code — lookup referrer for a code (no PII)
router.get('/code/:code', async (req, res) => {
  try {
    const user = await User.findOne({ referralCode: req.params.code.toUpperCase() }).select('firstName').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Invalid referral code' });
    res.json({ success: true, data: { firstName: user.firstName, valid: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Customer ──────────────────────────────────────────────────

// GET /api/referrals/me — my referral stats + code + history
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const code = await referralService.ensureReferralCode(user);

    const referrals = await Referral.find({ referrer: req.user.id })
      .populate('referee', 'firstName lastName email createdAt')
      .sort({ createdAt: -1 });

    const summary = {
      sent: referrals.length,
      signedUp: referrals.filter(r => ['signed_up', 'qualified', 'rewarded'].includes(r.status)).length,
      qualified: referrals.filter(r => ['qualified', 'rewarded'].includes(r.status)).length,
      pointsEarned: referrals.reduce((sum, r) => sum + (r.referrerBonusPoints || 0), 0)
    };

    const tier = referralService.computeTier(summary.qualified);
    const baseUrl = process.env.FRONTEND_URL || 'https://pesashop.com';
    const shareUrl = `${baseUrl}/refer/${code}`;

    res.json({
      success: true,
      data: {
        code,
        shareUrl,
        whatsappShareUrl: `https://wa.me/?text=${encodeURIComponent(`Try PesaShop and earn PESA Coins! ${shareUrl}`)}`,
        tier,
        summary,
        referrals
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/referrals/invite — send invite by email or just create a tracked record
router.post('/invite', protect, async (req, res) => {
  try {
    const { email, phone, channel } = req.body;
    const user = await User.findById(req.user.id);
    const code = await referralService.ensureReferralCode(user);

    const existing = email ? await Referral.findOne({ referrer: req.user.id, refereeEmail: email.toLowerCase() }) : null;
    if (existing) return res.json({ success: true, data: existing, message: 'Already invited' });

    const referral = await Referral.create({
      referrer: req.user.id,
      refereeEmail: email?.toLowerCase(),
      refereePhone: phone,
      referralCode: code,
      status: 'sent',
      channel: channel || 'link'
    });

    res.json({ success: true, data: referral });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ─────────────────────────────────────────────────────

// GET /api/referrals/admin/all — list referrals
router.get('/admin/all', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const referrals = await Referral.find(query)
      .populate('referrer', 'firstName lastName email referralCode')
      .populate('referee', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 200);
    res.json({ success: true, data: referrals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referrals/admin/stats — funnel + top referrers
router.get('/admin/stats', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const [byStatus, topReferrers, totalPointsAwarded] = await Promise.all([
      Referral.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Referral.aggregate([
        { $match: { status: { $in: ['qualified', 'rewarded'] } } },
        { $group: { _id: '$referrer', qualified: { $sum: 1 }, points: { $sum: '$referrerBonusPoints' } } },
        { $sort: { qualified: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, qualified: 1, points: 1, firstName: '$user.firstName', lastName: '$user.lastName', email: '$user.email' } }
      ]),
      Referral.aggregate([{ $group: { _id: null, points: { $sum: '$referrerBonusPoints' } } }])
    ]);
    res.json({
      success: true,
      data: {
        funnel: byStatus,
        topReferrers,
        totalPointsAwarded: totalPointsAwarded[0]?.points || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/referrals/admin/:id/flag — mark/unmark as fraud
router.put('/admin/:id/flag', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const ref = await Referral.findByIdAndUpdate(req.params.id, {
      status: req.body.status || 'fraud',
      $addToSet: { fraudFlags: req.body.reason || 'admin_flagged' }
    }, { new: true });
    if (!ref) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ref });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
