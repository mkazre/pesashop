const cron = require('node-cron');
const { runInsightsCollection } = require('../services/autoposterInsightsWorker');
const { socialLogger } = require('../services/autoposterLogger');
const log = socialLogger('insights');

let isRunning = false;

function initAutoposterInsightsCron() {
  cron.schedule('*/30 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const { targetsChecked, snapshotsFetched } = await runInsightsCollection();
      if (snapshotsFetched > 0) log.info({ targetsChecked, snapshotsFetched }, 'Insights collection complete');
    } catch (e) {
      log.error({ err: e.message }, 'Insights cron error');
    } finally {
      isRunning = false;
    }
  });
  console.log('✅ Autoposter insights collection cron initialized (every 30 min)');
}

module.exports = { initAutoposterInsightsCron };
