const cron = require('node-cron');
const { composeOutstandingDecisions } = require('../services/autoposterApprovalQueue');

// Generates captions for newly-selected trend/product decisions and runs
// the caption-level safety check, every 15 minutes — frequent enough that a
// fresh sampling run doesn't sit uncomposed for long, without hammering the
// Anthropic API on a tighter schedule than the hourly trend/periodic
// sampling cadence actually needs.
let isRunning = false;

function initAutoposterComposerCron() {
  cron.schedule('*/15 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const result = await composeOutstandingDecisions();
      if (result.composed > 0) console.log(`[autoposter-composer] composed captions for ${result.composed} decision(s)`);
    } catch (e) {
      console.error('[autoposter-composer] composer cron error:', e.message);
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Autoposter composer cron initialized (every 15 min)');
}

module.exports = { initAutoposterComposerCron };
