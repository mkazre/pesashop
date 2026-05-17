const cron = require('node-cron');
const visualSearchService = require('../services/visualSearchService');

const BATCH_SIZE = parseInt(process.env.VISUAL_SEARCH_BATCH_SIZE) || 50;
let isRunning = false;

function initVisualSearchCron() {
  // Run every minute. Each tick embeds up to BATCH_SIZE products without embeddings.
  // 50/min × 60 = 3000/hour → ~5 hours for a 15k catalogue. Stops automatically
  // once every active product has an embedding.
  cron.schedule('* * * * *', async () => {
    if (isRunning) return; // never overlap
    isRunning = true;
    try {
      const result = await visualSearchService.backfillEmbeddings({ limit: BATCH_SIZE });
      if (result.updated > 0 || result.failed > 0) {
        console.log(`[visual-search] embedded ${result.updated} products, ${result.failed} failed`);
      }
    } catch (e) {
      console.error('[visual-search] cron error:', e.message);
    } finally {
      isRunning = false;
    }
  });

  console.log(`✅ Visual search auto-embed cron initialized (batch ${BATCH_SIZE}/min)`);
}

module.exports = { initVisualSearchCron };
