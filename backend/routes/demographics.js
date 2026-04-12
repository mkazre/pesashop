const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const LoyaltyPoint = require('../models/LoyaltyPoint');
const {
  computeProfileCompletionScore,
  computeProfileInsights,
  getPersonalisedRecommendations,
  getHobbyProducts,
  evaluateDynamicGroups,
  COMPLETION_FIELDS
} = require('../services/customerProfileAI');

// ─── Customer: Get profile completion status ──────────────────────
// GET /api/demographics/profile-completion
router.get('/profile-completion', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const { score, missingFields, missingLabels } = computeProfileCompletionScore(user);

    // Get reward amount from active profile_complete loyalty rule
    let rewardPoints = 0;
    try {
      const LoyaltyRule = require('../models/LoyaltyRule');
      const rule = await LoyaltyRule.findOne({ ruleType: 'profile_complete', isActive: true }).lean();
      rewardPoints = rule?.fixedPoints || 0;
    } catch (e) {}

    res.json({
      success: true,
      data: {
        score,
        missingFields,
        missingLabels,
        isComplete: score === 100,
        rewardAlreadyClaimed: user.profileCompletionRewardClaimed || false,
        rewardPoints,
        fields: COMPLETION_FIELDS
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Customer: Update demographics ───────────────────────────────
// PUT /api/demographics/update
router.put('/update', protect, async (req, res) => {
  try {
    const allowedFields = [
      'gender', 'dateOfBirth', 'maritalStatus', 'householdSize',
      'employmentStatus', 'incomeRange', 'educationLevel', 'province', 'suburb',
      'hobbies', 'interests', 'lifeStage', 'marketingOptIn', 'demographicsConsentGiven'
    ];

    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    // Compute new completion score with merged data
    const currentUser = await User.findById(req.user.id).lean();
    const merged = { ...currentUser, ...update };
    const { score, missingFields } = computeProfileCompletionScore(merged);
    update.profileCompletionScore = score;
    update.profileCompletionFields = missingFields;

    const wasComplete = currentUser.profileCompletionScore === 100;
    const nowComplete = score === 100;

    // Award PESA Coins if profile just reached 100% for first time
    let pointsAwarded = 0;
    if (!wasComplete && nowComplete && !currentUser.profileCompletionRewardClaimed) {
      try {
        const LoyaltyRule = require('../models/LoyaltyRule');
        const profileRule = await LoyaltyRule.findOne({ ruleType: 'profile_complete', isActive: true }).lean();
        const rewardPoints = profileRule?.fixedPoints || 0;
        if (rewardPoints > 0) {
          // Create loyalty point record
          const loyaltyService = require('../services/loyaltyService');
          await loyaltyService.awardPoints(req.user.id, rewardPoints, 'profile_complete', 'Profile completion reward');
          update.profileCompletionRewardClaimed = true;
          pointsAwarded = rewardPoints;
        }
      } catch (e) {
        console.error('Profile completion reward error:', e.message);
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select('-password -resetPasswordToken -resetPasswordExpire');

    // Update dynamic group memberships in background
    evaluateDynamicGroups(req.user.id).catch(console.error);

    // Recompute AI insights in background
    computeProfileInsights(req.user.id).catch(console.error);

    res.json({
      success: true,
      data: user,
      profileCompletionScore: score,
      pointsAwarded,
      message: nowComplete && pointsAwarded > 0
        ? `Profile complete! You earned ${pointsAwarded} PESA Coins.`
        : 'Profile updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Customer: Get hobby-related products ──────────────────────────
// GET /api/demographics/hobby-products?hobbies[]=cycling&hobbies[]=gaming&limit=3
router.get('/hobby-products', async (req, res) => {
  try {
    const hobbies = Array.isArray(req.query.hobbies) ? req.query.hobbies : [req.query.hobbies].filter(Boolean);
    const limit = parseInt(req.query.limit) || 3;
    const products = await getHobbyProducts(hobbies, limit);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Customer: Get personalised recommendations ────────────────────
// GET /api/demographics/recommendations?productId=xxx&limit=8
router.get('/recommendations', protect, async (req, res) => {
  try {
    const products = await getPersonalisedRecommendations(req.user.id, {
      productId: req.query.productId,
      categoryId: req.query.categoryId,
      limit: parseInt(req.query.limit) || 8
    });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin: Demographics dashboard stats ─────────────────────────
// GET /api/demographics/admin/stats
router.get('/admin/stats', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const [
      genderStats,
      segmentStats,
      churnStats,
      lifeStageStats,
      incomeStats,
      provinceStats,
      hobbyStats,
      ageGroupStats
    ] = await Promise.all([
      // Gender breakdown
      User.aggregate([
        { $match: { role: 'customer' } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Customer segment
      User.aggregate([
        { $match: { role: 'customer' } },
        { $group: { _id: '$customerSegment', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Churn risk
      User.aggregate([
        { $match: { role: 'customer' } },
        { $group: { _id: '$churnRisk', count: { $sum: 1 } } }
      ]),
      // Life stage
      User.aggregate([
        { $match: { role: 'customer' } },
        { $group: { _id: '$lifeStage', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Income range
      User.aggregate([
        { $match: { role: 'customer' } },
        { $group: { _id: '$incomeRange', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Province
      User.aggregate([
        { $match: { role: 'customer', province: { $exists: true, $ne: '' } } },
        { $group: { _id: '$province', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Top hobbies
      User.aggregate([
        { $match: { role: 'customer' } },
        { $unwind: '$hobbies' },
        { $group: { _id: '$hobbies', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      // Age group distribution
      User.aggregate([
        { $match: { role: 'customer', dateOfBirth: { $exists: true } } },
        {
          $project: {
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 568024668000] }, then: 'Under 18' },
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 946728000000] }, then: '18-29' },
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 1261440000000] }, then: '30-39' },
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 1576152000000] }, then: '40-49' },
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 1892736000000] }, then: '50-59' }
                ],
                default: '60+'
              }
            }
          }
        },
        { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const profileCompletedCount = await User.countDocuments({ role: 'customer', profileCompletionScore: 100 });
    const avgCompletionScore = await User.aggregate([
      { $match: { role: 'customer' } },
      { $group: { _id: null, avg: { $avg: '$profileCompletionScore' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        profileCompletedCount,
        profileCompletionRate: totalCustomers > 0 ? Math.round((profileCompletedCount / totalCustomers) * 100) : 0,
        avgProfileScore: avgCompletionScore[0]?.avg ? Math.round(avgCompletionScore[0].avg) : 0,
        genderStats,
        segmentStats,
        churnStats,
        lifeStageStats,
        incomeStats,
        provinceStats,
        hobbyStats,
        ageGroupStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin: Trigger AI insight recomputation for a customer ───────
// POST /api/demographics/admin/recompute/:userId
router.post('/admin/recompute/:userId', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const insights = await computeProfileInsights(req.params.userId);
    await evaluateDynamicGroups(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
