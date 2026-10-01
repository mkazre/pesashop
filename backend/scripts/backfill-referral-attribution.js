/**
 * One-off backfill for a referral whose attribution was lost at signup
 * (referredBy/uplineChain never persisted, so no MLM rewards flowed).
 *
 * For the referee it:
 *   1. sets referredBy + uplineChain to the referrer (atomic $set)
 *   2. upserts the Referral funnel record
 *   3. awards the upline signup ReferralReward(s), skipped if any exist
 *   4. runs awardUplineForPurchase on every already-paid order (idempotent
 *      via ReferralReward's unique (order, beneficiary, level) index)
 * then prints the referrer's dashboard stats as GET /referrals/me computes them.
 *
 * Dry run by default; pass --apply to write.
 *
 *   node scripts/backfill-referral-attribution.js \
 *     [--referee=mkhaliphi.mnguni@tigerbrands.com] [--code=MKHAAEF143] \
 *     [--referrer-email=mkhaliphimnguni83@gmail.com] [--apply]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Referral = require('../models/Referral');
const ReferralReward = require('../models/ReferralReward');
const ReferralSettings = require('../models/ReferralSettings');
const referralService = require('../services/referralService');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const REFEREE_EMAIL = (args.referee || 'mkhaliphi.mnguni@tigerbrands.com').toLowerCase();
const REFERRER_CODE = (args.code || 'MKHAAEF143').toUpperCase();
const REFERRER_EMAIL = (args['referrer-email'] || 'mkhaliphimnguni83@gmail.com').toLowerCase();
const APPLY = !!args.apply;

async function referrerStats(referrerId) {
  const [networkSize, ledger, purchasers, referrals] = await Promise.all([
    User.countDocuments({ uplineChain: referrerId }),
    ReferralReward.aggregate([
      { $match: { beneficiary: referrerId } },
      { $group: { _id: { level: '$level', eventType: '$eventType' }, count: { $sum: 1 }, points: { $sum: '$pointsAwarded' } } },
      { $sort: { '_id.level': 1 } },
    ]),
    ReferralReward.distinct('sourceUser', { beneficiary: referrerId, eventType: 'purchase' }),
    Referral.find({ referrer: referrerId }).select('status').lean(),
  ]);
  return {
    networkSize,
    signedUp: referrals.filter(r => ['signed_up', 'qualified', 'rewarded'].includes(r.status)).length,
    madeAPurchase: purchasers.length,
    lifetimeCoins: ledger.reduce((s, r) => s + r.points, 0),
    levelsActive: new Set(ledger.map(r => r._id.level)).size,
    ledger: ledger.map(r => `L${r._id.level} ${r._id.eventType}: ${r.count} row(s), ${r.points} coins`),
  };
}

async function run() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (pass --apply to write)'}`);

  const referee = await User.findOne({ email: REFEREE_EMAIL });
  if (!referee) throw new Error(`Referee not found: ${REFEREE_EMAIL}`);
  const referrer = await User.findOne({ referralCode: REFERRER_CODE });
  if (!referrer) throw new Error(`Referrer not found for code ${REFERRER_CODE}`);
  if (referrer.email.toLowerCase() !== REFERRER_EMAIL) {
    throw new Error(`Code ${REFERRER_CODE} belongs to ${referrer.email}, expected ${REFERRER_EMAIL} — aborting`);
  }
  if (String(referrer._id) === String(referee._id)) throw new Error('Referee and referrer are the same user');

  const settings = await ReferralSettings.getSettings();
  console.log(`Referral engine enabled: ${settings.enabled}; active levels: ${(settings.levels || []).filter(l => l.active).map(l => l.level).join(', ') || 'none'}`);
  if (!settings.enabled) console.warn('WARNING: referral engine is disabled — no rewards will be awarded until it is enabled.');

  console.log(`Referee:  ${referee.email} (${referee._id}) referredBy=${referee.referredBy || '-'} uplineChain=[${(referee.uplineChain || []).join(', ')}]`);
  console.log(`Referrer: ${referrer.email} (${referrer._id}) code=${referrer.referralCode}`);

  if (referee.referredBy && String(referee.referredBy) !== String(referrer._id)) {
    throw new Error(`Referee is already attributed to a different referrer (${referee.referredBy}) — aborting`);
  }

  console.log('\nReferrer dashboard BEFORE:', await referrerStats(referrer._id));

  // 1. Attribution
  const chain = [referrer._id, ...(referrer.uplineChain || [])].slice(0, ReferralSettings.MAX_LEVELS_CEILING);
  console.log(`\n[1] Set referredBy=${referrer._id}, uplineChain=[${chain.join(', ')}]`);
  if (APPLY) {
    await User.updateOne({ _id: referee._id }, { $set: { referredBy: referrer._id, uplineChain: chain } });
  }
  referee.referredBy = referrer._id;
  referee.uplineChain = chain;

  // 2. Referral funnel record (never downgrade qualified/rewarded)
  const existingReferral = await Referral.findOne({ referrer: referrer._id, refereeEmail: referee.email });
  const keepStatus = existingReferral && ['qualified', 'rewarded'].includes(existingReferral.status);
  console.log(`[2] Referral record: ${existingReferral ? `exists (status ${existingReferral.status})` : 'missing'} -> ${keepStatus ? 'keep status' : 'signed_up'}`);
  if (APPLY) {
    await Referral.findOneAndUpdate(
      { referrer: referrer._id, refereeEmail: referee.email },
      {
        $set: {
          referee: referee._id,
          refereePhone: referee.phone,
          referralCode: REFERRER_CODE,
          ...(keepStatus ? {} : { status: 'signed_up' }),
          signedUpAt: existingReferral?.signedUpAt || referee.createdAt,
        },
        $addToSet: { fraudFlags: 'backfilled' },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  // 3. Signup rewards — awardUplineForSignup has no unique index, so guard here
  const existingSignupRewards = await ReferralReward.countDocuments({ sourceUser: referee._id, eventType: 'signup' });
  console.log(`[3] Signup rewards: ${existingSignupRewards} existing -> ${existingSignupRewards ? 'skip' : 'award'}`);
  if (APPLY && !existingSignupRewards) {
    await referralService.awardUplineForSignup(referee);
  }

  // 4. Purchase rewards for already-paid orders
  const paidOrders = await Order.find({
    customer: referee._id,
    $or: [{ paymentStatus: 'completed' }, { status: 'completed' }],
  });
  console.log(`[4] Paid orders: ${paidOrders.map(o => o.orderNumber).join(', ') || 'none'}`);
  if (APPLY) {
    for (const order of paidOrders) {
      await referralService.awardUplineForPurchase(order);
    }
  }

  console.log('\nReferrer dashboard AFTER:', await referrerStats(referrer._id));
}

if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await run();
    } catch (e) {
      console.error('Backfill failed:', e.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}

module.exports = { run };
