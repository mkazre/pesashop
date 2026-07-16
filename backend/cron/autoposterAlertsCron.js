const cron = require('node-cron');
const { runAlertChecks } = require('../services/autoposterAlerts');
const { socialLogger } = require('../services/autoposterLogger');
const log = socialLogger('alerts-cron');
const { registerWorker } = require('../services/autoposterWorkerRegistry');

let isRunning = false;
registerWorker('alerts', () => isRunning);

// Every 15 minutes (Spec Section 17) — matches CHECK_WINDOW_MINUTES in
// autoposterAlerts.js, so each threshold's lookback window lines up exactly
// with how often it's actually re-checked.
function initAutoposterAlertsCron() {
  cron.schedule('*/15 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const { fired } = await runAlertChecks();
      if (fired.length > 0) log.warn({ fired }, 'Alert(s) fired');
    } catch (e) {
      log.error({ err: e.message }, 'Alerts cron error');
    } finally {
      isRunning = false;
    }
  });
  console.log('✅ Autoposter alerts cron initialized (every 15 min)');
}

module.exports = { initAutoposterAlertsCron };
