const cron = require('node-cron');
const { runTrendIngestion } = require('../services/autoposterTrendIngestionRun');

// Hourly trend ingestion (Spec Section 10.3). No Redis-lock-based singleton
// guard is needed here (unlike Spec 27.2's "use a Redis lock to enforce") —
// per the Phase 0 architecture decision, every cron in this codebase runs
// in-process in a single Node server, so there's only ever one instance of
// this job to begin with; the double-execution risk the spec's lock guards
// against doesn't exist in this deployment shape.
let isRunning = false;

function initAutoposterTrendIngestionCron() {
  cron.schedule('0 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const result = await runTrendIngestion();
      console.log(`[autoposter-trends] ingestion run: ${result.termsProcessed} term(s) processed, ${result.created} created, ${result.updated} updated, ${result.blocked} blocked by blocklist`);
    } catch (e) {
      console.error('[autoposter-trends] ingestion cron error:', e.message);
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Autoposter trend ingestion cron initialized (hourly)');
}

module.exports = { initAutoposterTrendIngestionCron };
