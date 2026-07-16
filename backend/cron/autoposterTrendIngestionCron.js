const cron = require('node-cron');
const { runTrendIngestion } = require('../services/autoposterTrendIngestionRun');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { socialLogger } = require('../services/autoposterLogger');
const log = socialLogger('trend-ingestion');

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
    const startedAt = Date.now();
    try {
      const result = await runTrendIngestion();
      log.info({ ...result, duration_ms: Date.now() - startedAt }, 'Trend ingestion run complete');
      // Alert-worthy (Spec 17): "trend ingestion failures from primary source".
      if (result.primarySourceFailed) {
        await AutoposterAuditLog.create({ action: 'trend_ingestion_primary_source_failed', entityType: 'AutoposterTrend', entityId: 'ingestion-run', payload: {} });
      }
    } catch (e) {
      log.error({ err: e.message, duration_ms: Date.now() - startedAt }, 'Trend ingestion cron error');
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Autoposter trend ingestion cron initialized (hourly)');
}

module.exports = { initAutoposterTrendIngestionCron };
