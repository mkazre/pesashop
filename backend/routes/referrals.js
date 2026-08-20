const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Referral = require('../models/Referral');
const ReferralReward = require('../models/ReferralReward');
const ReferralSettings = require('../models/ReferralSettings');
const User = require('../models/User');
const { LoyaltyPoint } = require('../models/LoyaltyPoint');
const referralService = require('../services/referralService');
const emailService = require('../services/emailService');

const ADMIN_ROLES = ['admin', 'shop_manager', 'superadmin', 'super_admin'];

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

// GET /api/referrals/me — my referral stats + code + history + per-level breakdown
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

    // MLM per-level breakdown from the reward ledger (this reflects ALL
    // levels this user benefits from, not just their direct referrals).
    const byLevel = await ReferralReward.aggregate([
      { $match: { beneficiary: user._id } },
      {
        $group: {
          _id: { level: '$level', eventType: '$eventType' },
          count: { $sum: 1 },
          points: { $sum: '$pointsAwarded' },
        }
      },
      { $sort: { '_id.level': 1 } }
    ]);

    const levelBreakdown = {};
    for (const row of byLevel) {
      const lvl = row._id.level;
      levelBreakdown[lvl] = levelBreakdown[lvl] || { level: lvl, signupCount: 0, signupPoints: 0, purchaseCount: 0, purchasePoints: 0 };
      if (row._id.eventType === 'signup') {
        levelBreakdown[lvl].signupCount = row.count;
        levelBreakdown[lvl].signupPoints = row.points;
      } else {
        levelBreakdown[lvl].purchaseCount = row.count;
        levelBreakdown[lvl].purchasePoints = row.points;
      }
    }

    const totalMlmPoints = byLevel.reduce((sum, r) => sum + r.points, 0);

    // This month vs last month, for a simple trend widget.
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [thisMonth, lastMonth] = await Promise.all([
      ReferralReward.aggregate([
        { $match: { beneficiary: user._id, createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, points: { $sum: '$pointsAwarded' } } }
      ]),
      ReferralReward.aggregate([
        { $match: { beneficiary: user._id, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
        { $group: { _id: null, points: { $sum: '$pointsAwarded' } } }
      ]),
    ]);

    // Leaderboard rank among everyone who's earned at least one MLM reward.
    const rankAgg = await ReferralReward.aggregate([
      { $group: { _id: '$beneficiary', points: { $sum: '$pointsAwarded' } } },
      { $match: { points: { $gt: totalMlmPoints } } },
      { $count: 'higherCount' }
    ]);
    const rank = (rankAgg[0]?.higherCount || 0) + 1;

    // Downline network size (all levels combined) — cheap count, full
    // breakdown lives at /me/network.
    const networkSize = await User.countDocuments({ uplineChain: user._id });

    const spendableBalance = await LoyaltyPoint.getUserBalance(user._id);

    const baseUrl = process.env.FRONTEND_URL || 'https://pesashop.com';
    const shareUrl = `${baseUrl}/refer/${code}`;

    res.json({
      success: true,
      data: {
        code,
        shareUrl,
        whatsappShareUrl: `https://wa.me/?text=${encodeURIComponent(`Try PesaShop and earn PESA Coins! ${shareUrl}`)}`,
        summary,
        referrals,
        levelBreakdown: Object.values(levelBreakdown).sort((a, b) => a.level - b.level),
        totalMlmPoints,
        pointsThisMonth: thisMonth[0]?.points || 0,
        pointsLastMonth: lastMonth[0]?.points || 0,
        rank,
        networkSize,
        spendableBalance,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referrals/me/ledger — paginated reward ledger for the logged-in user
router.get('/me/ledger', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const query = { beneficiary: req.user.id };
    if (req.query.level) query.level = parseInt(req.query.level);
    if (req.query.eventType) query.eventType = req.query.eventType;

    const [rows, total] = await Promise.all([
      ReferralReward.find(query)
        .populate('sourceUser', 'firstName lastName email')
        .populate('order', 'orderNumber total')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ReferralReward.countDocuments(query),
    ]);

    res.json({ success: true, data: rows, pagination: { total, page, pages: Math.ceil(total / limit), limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referrals/me/network — downline members grouped by level (the "tree")
router.get('/me/network', protect, async (req, res) => {
  try {
    const members = await User.find({ uplineChain: req.user.id })
      .select('firstName lastName createdAt uplineChain isActive')
      .lean();

    const byLevel = {};
    for (const m of members) {
      const idx = m.uplineChain.findIndex((id) => String(id) === String(req.user.id));
      if (idx === -1) continue;
      const level = idx + 1;
      byLevel[level] = byLevel[level] || [];
      byLevel[level].push({
        _id: m._id,
        firstName: m.firstName,
        lastName: m.lastName,
        joinedAt: m.createdAt,
        active: m.isActive !== false,
      });
    }

    const levels = Object.keys(byLevel)
      .map(Number)
      .sort((a, b) => a - b)
      .map((level) => ({
        level,
        count: byLevel[level].length,
        members: byLevel[level].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt)),
      }));

    res.json({ success: true, data: { totalNetworkSize: members.length, levels } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referrals/levels — active levels' earning potential, for the
// customer-facing "here's what you can earn" motivational table. Only
// exposes what a level pays, not internal knobs like caps/vesting/base.
router.get('/levels', protect, async (req, res) => {
  try {
    const settings = await ReferralSettings.getSettings();
    res.json({
      success: true,
      data: {
        enabled: settings.enabled,
        levels: (settings.levels || [])
          .filter((l) => l.active)
          .sort((a, b) => a.level - b.level)
          .map((l) => ({
            level: l.level,
            signupPoints: l.signupPoints,
            purchaseRewardType: l.purchaseRewardType,
            purchaseRewardValue: l.purchaseRewardValue,
          })),
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

    // Reuse any existing record for this (referrer, email) pair — the schema
    // has a unique index on it, so we can't just create a fresh row on retry.
    // Only block resending once the referee has actually followed through
    // (or been flagged); a 'sent'/'failed'/'pending' record just means the
    // last attempt may not have actually reached their inbox, so re-invite.
    let referral = email ? await Referral.findOne({ referrer: req.user.id, refereeEmail: email.toLowerCase() }) : null;

    if (referral && ['signed_up', 'qualified', 'rewarded', 'fraud'].includes(referral.status)) {
      return res.json({ success: true, data: referral, message: 'Already invited' });
    }

    if (referral) {
      referral.referralCode = code;
      referral.channel = channel || referral.channel || 'link';
      referral.status = email ? 'pending' : 'sent';
      await referral.save();
    } else {
      referral = await Referral.create({
        referrer: req.user.id,
        refereeEmail: email?.toLowerCase(),
        refereePhone: phone,
        referralCode: code,
        status: email ? 'pending' : 'sent',
        channel: channel || 'link'
      });
    }

    if (email) {
      try {
        await emailService.sendReferralInvite(referral, user);
        referral.status = 'sent';
        await referral.save();
      } catch (emailErr) {
        console.error('Failed to send referral invite email:', emailErr);
        referral.status = 'failed';
        await referral.save();
      }
    }

    res.json({ success: true, data: referral });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ─────────────────────────────────────────────────────

// GET /api/referrals/admin/all — list referrals
router.get('/admin/all', protect, authorize(...ADMIN_ROLES), async (req, res) => {
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
router.get('/admin/stats', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const [byStatus, topReferrers, totalPointsAwarded] = await Promise.all([
      Referral.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ReferralReward.aggregate([
        { $group: { _id: '$beneficiary', points: { $sum: '$pointsAwarded' }, rewardCount: { $sum: 1 } } },
        { $sort: { points: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, points: 1, rewardCount: 1, firstName: '$user.firstName', lastName: '$user.lastName', email: '$user.email' } }
      ]),
      ReferralReward.aggregate([{ $group: { _id: null, points: { $sum: '$pointsAwarded' } } }])
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

// GET /api/referrals/admin/ledger — full MLM reward ledger, filterable
router.get('/admin/ledger', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const query = {};
    if (req.query.beneficiary) query.beneficiary = req.query.beneficiary;
    if (req.query.level) query.level = parseInt(req.query.level);
    if (req.query.eventType) query.eventType = req.query.eventType;
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
    }

    const [rows, total] = await Promise.all([
      ReferralReward.find(query)
        .populate('beneficiary', 'firstName lastName email')
        .populate('sourceUser', 'firstName lastName email')
        .populate('order', 'orderNumber total')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ReferralReward.countDocuments(query),
    ]);

    res.json({ success: true, data: rows, pagination: { total, page, pages: Math.ceil(total / limit), limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/referrals/admin/:id/flag — mark/unmark as fraud
router.put('/admin/:id/flag', protect, authorize(...ADMIN_ROLES), async (req, res) => {
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

// ─── Admin: MLM level settings ─────────────────────────────────

// GET /api/referrals/admin/settings
router.get('/admin/settings', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const settings = await ReferralSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/referrals/admin/settings
router.put('/admin/settings', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const settings = await ReferralSettings.getSettings();
    const { enabled, maxLevels, levels, purchaseRewardBase, excludeFraudFlagged, compressInactiveUplines } = req.body;

    if (enabled !== undefined) settings.enabled = enabled;
    if (purchaseRewardBase !== undefined) settings.purchaseRewardBase = purchaseRewardBase;
    if (excludeFraudFlagged !== undefined) settings.excludeFraudFlagged = excludeFraudFlagged;
    if (compressInactiveUplines !== undefined) settings.compressInactiveUplines = compressInactiveUplines;

    if (maxLevels !== undefined) {
      settings.maxLevels = Math.max(1, Math.min(10, parseInt(maxLevels) || 1));
    }

    if (Array.isArray(levels)) {
      // Clamp to maxLevels and valid level numbers 1..maxLevels — the
      // schema itself also enforces 1..10, this just keeps the doc tidy.
      settings.levels = levels
        .filter(l => l.level >= 1 && l.level <= settings.maxLevels)
        .map(l => ({
          level: l.level,
          active: l.active !== false,
          signupPoints: Math.max(0, parseInt(l.signupPoints) || 0),
          purchaseRewardType: l.purchaseRewardType === 'percentage' ? 'percentage' : 'fixed',
          purchaseRewardValue: Math.max(0, parseFloat(l.purchaseRewardValue) || 0),
          monthlyCap: l.monthlyCap != null && l.monthlyCap !== '' ? Math.max(0, parseInt(l.monthlyCap)) : null,
          vestingDays: Math.max(0, parseInt(l.vestingDays) || 0),
        }))
        .sort((a, b) => a.level - b.level);
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
