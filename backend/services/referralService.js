const crypto = require('crypto');
const Referral = require('../models/Referral');
const User = require('../models/User');
const LoyaltyPoint = require('../models/LoyaltyPoint');
const LoyaltySetting = require('../models/LoyaltyPoint').LoyaltySetting || null;
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

async function getSettings() {
  try {
    const LoyaltySettingModel = require('../models/LoyaltyPoint').LoyaltySetting
      || require('mongoose').model('LoyaltySetting');
    const settings = await LoyaltySettingModel.findOne().lean();
    return settings || {};
  } catch (e) {
    return {};
  }
}

function computeTier(qualifiedCount) {
  if (qualifiedCount >= 21) return { multiplier: 2.0, label: 'Pesa Insider' };
  if (qualifiedCount >= 6) return { multiplier: 1.5, label: 'Top Inviter' };
  return { multiplier: 1.0, label: 'Inviter' };
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
  await newUser.save({ validateBeforeSave: false });

  if (referral.status === 'signed_up') {
    const settings = await getSettings();
    const points = settings.referralRegistrationBonus || 0;
    if (points > 0 && !referral.refereeBonusAwardedAt) {
      try {
        await LoyaltyPoint.addPoints(newUser._id, points, LOYALTY_TYPES.SIGNUP_BONUS || 'signup_bonus', 'Welcome bonus from referral');
        referral.refereeBonusPoints = points;
        referral.refereeBonusAwardedAt = new Date();
        await referral.save();
      } catch (e) { console.error('Referral signup bonus error:', e.message); }
    }
  }

  return referral;
}

async function handleQualifyingOrder(order) {
  try {
    if (!order || !order.customer) return;
    const referral = await Referral.findOne({ referee: order.customer, status: 'signed_up' });
    if (!referral) return;

    const settings = await getSettings();
    const basePoints = settings.referralPurchaseBonus || 0;
    if (basePoints <= 0) return;

    const qualifiedCount = await Referral.countDocuments({ referrer: referral.referrer, status: { $in: ['qualified', 'rewarded'] } });
    const tier = computeTier(qualifiedCount);
    const points = Math.round(basePoints * tier.multiplier);

    referral.status = 'qualified';
    referral.qualifyingOrder = order._id;
    referral.qualifiedAt = new Date();
    referral.referrerBonusPoints = points;
    referral.referrerBonusAwardedAt = new Date();
    await referral.save();

    try {
      await LoyaltyPoint.addPoints(
        referral.referrer,
        points,
        LOYALTY_TYPES.REFERRAL_PURCHASE || 'referral_purchase',
        `Referral reward (${tier.label}) — order ${order.orderNumber || order._id}`
      );
      referral.status = 'rewarded';
      await referral.save();
    } catch (e) { console.error('Referral payout error:', e.message); }
  } catch (e) {
    console.error('handleQualifyingOrder error:', e.message);
  }
}

module.exports = {
  generateReferralCode,
  ensureReferralCode,
  handleSignup,
  handleQualifyingOrder,
  computeTier
};
