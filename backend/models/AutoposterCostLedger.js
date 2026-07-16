const mongoose = require('mongoose');

// Real, measured spend per calendar month (Spec Section 28, Phase 13 cost
// controls) — not an estimate. Each Claude/embedding call's actual reported
// token usage is converted to USD at that model's published per-token rate
// and added here. One document per month ("YYYY-MM"), so a new month starts
// a fresh, unambiguous running total.
const autoposterCostLedgerSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true }, // e.g. "2026-07"
  llmSpendUSD: { type: Number, default: 0 },
  embeddingSpendUSD: { type: Number, default: 0 },
  xPostsThisMonth: { type: Number, default: 0 }
}, { timestamps: true });

function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

autoposterCostLedgerSchema.statics.getCurrentMonth = async function () {
  const month = currentMonthKey();
  let ledger = await this.findOne({ month });
  if (!ledger) ledger = await this.create({ month });
  return ledger;
};

autoposterCostLedgerSchema.statics.currentMonthKey = currentMonthKey;

module.exports = mongoose.model('AutoposterCostLedger', autoposterCostLedgerSchema);
