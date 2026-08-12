const crypto = require('crypto');
const Referral = require('../models/Referral');
const User = require('../models/User');
const Product = require('../models/Product');
const LoyaltyPoint = require('../models/LoyaltyPoint');
const ReferralSettings = require('../models/ReferralSettings');
const ReferralReward = require('../models/ReferralReward');
const { LOYALTY_TYPES } = require('../config/constants');

function generateReferralCode(firstName = '') {
  const safe = (firstName || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'PESA';
  return `${safe}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  let code, exists = true, attempts = 0;
  while (exists && attempts < 10) {
    code = generateReferralCode(user.firstName);
    exists = await User.exists({ referralCode: code });
    attempts++;
  }
  user.referralCode = code;
  await user.save({ validateBeforeSave: false });
  return code;
}

async function getLoyaltySettings() {
  try {
    const LoyaltySettingModel = require('../models/LoyaltyPoint').LoyaltySetting
      || require('mongoose').model('LoyaltySetting');
    const settings = await LoyaltySettingModel.findOne().lean();
    return settings || {};
  } catch (e) {
    return {};
  }
}

/**
 * Resolves the monetary amount an order is worth for percentage-type MLM
 * purchase rewards, per the admin's chosen `purchaseRewardBase`. Mirrors
 * loyaltyService.calculateOrderPoints's per-line-item price lookup for the
 * 'backend'/'regular'/'sale' bases so referral rewards and regular PESA
 * Coins agree on what a product is "worth".
 */
async function resolveOrderAmount(order, base) {
  if (base === 'subtotal') return order.subtotal || 0;
  if (base === 'total') return order.total || 0;

  // backend | regular | sale — sum per-line-item price * quantity
  let amount = 0;
  for (const item of order.items || []) {
    const product = await Product.findById(item.product).select('regularPrice backendPrice salePrice').lean();
    if (!product) { amount += (item.total || 0); continue; } // fall back to stored line total if product was deleted
    let itemPrice = product.regularPrice;
    if (base === 'backend') itemPrice = product.backendPrice || product.regularPrice;
    else if (base === 'sale') itemPrice = product.salePrice || product.regularPrice;
    amount += (itemPrice || 0) * (item.quantity || 1);
  }
  return amount;
}

/**
 * Walks a beneficiary chain, honoring `excludeFraudFlagged` (skip ancestors
 * whose accounts are banned) and `compressInactiveUplines` (skip past a
 * banned/inactive ancestor to keep that level's reward alive for the next
 * valid one, rather than losing it) — see ReferralSettings.js.
 * Returns an array of { userId, level } for every level that should receive
 * a reward, level numbered 1..N by depth from the source user.
 */
async function resolveRewardChain(uplineChain, settings) {
  if (!Array.isArray(uplineChain) || uplineChain.length === 0) return [];

  const candidates = await User.find({ _id: { $in: uplineChain } })
    .select('_id isActive loyaltyPointsBanned')
    .lean();
  const byId = new Map(candidates.map(u => [String(u._id), u]));

  const resolved = [];
  let level = 1;
  for (const ancestorId of uplineChain) {
    if (level > settings.maxLevels) break;
    const ancestor = byId.get(String(ancestorId));
    const isInvalid = !ancestor || ancestor.isActive === false || ancestor.loyaltyPointsBanned;

    if (isInvalid) {
      if (settings.compressInactiveUplines) continue; // skip this ancestor, level number doesn't advance
      level++; // forfeit this level entirely
      continue;
    }

    resolved.push({ userId: ancestorId, level });
    level++;
  }
  return resolved;
}

function activeLevelConfig(settings, level) {
  return (settings.levels || []).find(l => l.level === level && l.active);
}

/**
 * Awards every valid upline ancestor their configured signupPoints when a
 * new user (already attributed via handleSignup, with uplineChain set)
 * joins. Fire-and-forget from the caller — never throws.
 */
async function awardUplineForSignup(newUser) {
  try {
    const settings = await ReferralSettings.getSettings();
    if (!settings.enabled) return;
    if (!newUser.uplineChain || newUser.uplineChain.length === 0) return;

    const chain = await resolveRewardChain(newUser.uplineChain, settings);
    for (const { userId, level } of chain) {
      const levelConfig = activeLevelConfig(settings, level);
      if (!levelConfig || levelConfig.signupPoints <= 0) continue;

      try {
        const tx = await LoyaltyPoint.addPoints(
          userId,
          levelConfig.signupPoints,
          LOYALTY_TYPES.MLM_REFERRAL_SIGNUP,
          `Level ${level} referral signup bonus`
        );
        await ReferralReward.create({
          beneficiary: userId,
          sourceUser: newUser._id,
          level,
          eventType: 'signup',
          pointsAwarded: levelConfig.signupPoints,
          rewardBase: { type: 'fixed', rate: levelConfig.signupPoints },
          loyaltyPointTransaction: tx._id,
          status: 'paid',
        });
      } catch (e) {
        console.error(`MLM signup reward error (level ${level}, beneficiary ${userId}):`, e.message);
      }
    }
  } catch (e) {
    console.error('awardUplineForSignup error:', e.message);
  }
}

/**
 * Awards every valid upline ancestor a purchase reward for EVERY completed
 * order from a downline member (recurring, not just their first purchase).
 * Idempotent per (order, beneficiary, level) via ReferralReward's unique
 * index — safe to call more than once for the same order.
 */
async function awardUplineForPurchase(order) {
  try {
    if (!order || !order.customer) return;
    const settings = await ReferralSettings.getSettings();
    if (!settings.enabled) return;

    const purchaser = await User.findById(order.customer).select('uplineChain').lean();
    if (!purchaser || !purchaser.uplineChain || purchaser.uplineChain.length === 0) return;

    const chain = await resolveRewardChain(purchaser.uplineChain, settings);
    if (chain.length === 0) return;

    // Funnel-status continuity: the first purchase from a referred user
    // still flips their Referral record signed_up -> qualified for admin
    // funnel reporting, even though it no longer gates repeat-purchase
    // rewards (those come from the upline chain above, on every order).
    Referral.findOneAndUpdate(
      { referee: order.customer, status: 'signed_up' },
      { status: 'qualified', qualifyingOrder: order._id, qualifiedAt: new Date() }
    ).catch(e => console.error('Referral funnel status update error:', e.message));

    const amountCache = new Map(); // priceBase -> resolved amount, computed at most once per order

    for (const { userId, level } of chain) {
      const levelConfig = activeLevelConfig(settings, level);
      if (!levelConfig) continue;

      let points = 0;
      let rewardBase;
      if (levelConfig.purchaseRewardType === 'fixed') {
        points = levelConfig.purchaseRewardValue;
        rewardBase = { type: 'fixed', rate: levelConfig.purchaseRewardValue };
      } else {
        if (!amountCache.has(settings.purchaseRewardBase)) {
          amountCache.set(settings.purchaseRewardBase, await resolveOrderAmount(order, settings.purchaseRewardBase));
        }
        const baseAmount = amountCache.get(settings.purchaseRewardBase);
        points = Math.round((baseAmount * levelConfig.purchaseRewardValue) / 100);
        rewardBase = {
          type: 'percentage',
          priceBase: settings.purchaseRewardBase,
          baseAmount,
          rate: levelConfig.purchaseRewardValue,
        };
      }
      if (points <= 0) continue;

      try {
        const tx = await LoyaltyPoint.addPoints(
          userId,
          points,
          LOYALTY_TYPES.MLM_REFERRAL_PURCHASE,
          `Level ${level} referral purchase reward — order ${order.orderNumber || order._id}`,
          order._id
        );
        await ReferralReward.create({
          beneficiary: userId,
          sourceUser: order.customer,
          level,
          eventType: 'purchase',
          order: order._id,
          pointsAwarded: points,
          rewardBase,
          loyaltyPointTransaction: tx._id,
          status: 'paid',
        });
      } catch (e) {
        if (e.code === 11000) continue; // already awarded for this order/beneficiary/level — idempotency guard held
        console.error(`MLM purchase reward error (level ${level}, beneficiary ${userId}):`, e.message);
      }
    }
  } catch (e) {
    console.error('awardUplineForPurchase error:', e.message);
  }
}

async function handleSignup(newUser, referralCode, meta = {}) {
  if (!referralCode) return null;
  const referrer = await User.findOne({ referralCode });
  if (!referrer) return null;
  if (String(referrer._id) === String(newUser._id)) return null;

  const fraudFlags = [];
  if (newUser.email && referrer.email && newUser.email.toLowerCase() === referrer.email.toLowerCase()) {
    fraudFlags.push('same_email');
  }
  if (meta.ip && referrer.lastLoginIp && meta.ip === referrer.lastLoginIp) {
    fraudFlags.push('same_ip');
  }

  const referral = await Referral.findOneAndUpdate(
    { referrer: referrer._id, refereeEmail: newUser.email },
    {
      referrer: referrer._id,
      referee: newUser._id,
      refereeEmail: newUser.email,
      refereePhone: newUser.phone,
      referralCode,
      status: fraudFlags.length > 0 ? 'fraud' : 'signed_up',
      signedUpAt: new Date(),
      signupIp: meta.ip,
      signupUserAgent: meta.userAgent,
      signupDeviceFingerprint: meta.deviceFingerprint,
      fraudFlags
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  newUser.referredBy = referrer._id;
  newUser.uplineChain = [referrer._id, ...(referrer.uplineChain || [])].slice(0, ReferralSettings.MAX_LEVELS_CEILING);
  await newUser.save({ validateBeforeSave: false });

  if (referral.status === 'signed_up') {
    // Immediate-referee welcome bonus (distinct from the upline MLM rewards
    // below — this is the new user's own thank-you-for-joining bonus).
    const loyaltySettings = await getLoyaltySettings();
    const points = loyaltySettings.referralRegistrationBonus || 0;
    if (points > 0 && !referral.refereeBonusAwardedAt) {
      try {
        await LoyaltyPoint.addPoints(newUser._id, points, LOYALTY_TYPES.SIGNUP_BONUS || 'signup_bonus', 'Welcome bonus from referral');
        referral.refereeBonusPoints = points;
        referral.refereeBonusAwardedAt = new Date();
        await referral.save();
      } catch (e) { console.error('Referral signup bonus error:', e.message); }
    }

    // Multi-level upline rewards — every valid ancestor up to the
    // configured depth gets their level's signup bonus.
    awardUplineForSignup(newUser).catch(e => console.error('awardUplineForSignup error:', e.message));
  }

  return referral;
}

module.exports = {
  generateReferralCode,
  ensureReferralCode,
  handleSignup,
  awardUplineForSignup,
  awardUplineForPurchase,
  resolveOrderAmount,
};
