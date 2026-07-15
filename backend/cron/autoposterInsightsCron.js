const cron = require('node-cron');
const { runInsightsCollection } = require('../services/autoposterInsightsWorker');

let isRunning = false;

function initAutoposterInsightsCron() {
  cron.schedule('*/30 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const { targetsChecked, snapshotsFetched } = await runInsightsCollection();
      if (snapshotsFetched > 0) console.log(`[autoposter] insights: fetched ${snapshotsFetched} snapshot(s) across ${targetsChecked} published target(s)`);
    } catch (e) {
      console.error('[autoposter] insights cron error:', e.message);
    } finally {
      isRunning = false;
    }
  });
  console.log('✅ Autoposter insights collection cron initialized (every 30 min)');
}

module.exports = { initAutoposterInsightsCron };
