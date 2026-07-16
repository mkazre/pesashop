const cron = require('node-cron');
const { composeOutstandingDecisions } = require('../services/autoposterApprovalQueue');
const { socialLogger } = require('../services/autoposterLogger');
const log = socialLogger('composer');

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
      if (result.composed > 0) log.info(result, 'Composed captions for decision(s)');
    } catch (e) {
      log.error({ err: e.message }, 'Composer cron error');
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Autoposter composer cron initialized (every 15 min)');
}

module.exports = { initAutoposterComposerCron };
