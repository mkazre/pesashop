const mongoose = require('mongoose');
const { AUTOPOSTER_PLATFORMS, AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');

// One row per connected platform account (Spec Section 4.1). A single PesaShop
// install may connect multiple accounts on the same platform (e.g. main FB Page
// + secondary brand Page).
const autoposterAccountSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: Object.values(AUTOPOSTER_PLATFORMS),
    required: true,
    index: true
  },
  displayName: { type: String, required: true }, // e.g. "PesaShop Main", "PesaShop ZW"
  externalId: { type: String, required: true },  // page_id / user_id / channel_id

  // Encrypted at rest with AES-256-GCM (Spec Section 5.3). Stored as Buffers so
  // ciphertext + IV + auth tag can be packed together by the token.crypto helper.
  accessTokenEnc: { type: Buffer, select: false },
  refreshTokenEnc: { type: Buffer, select: false },
  tokenExpiresAt: Date,

  scopes: [String],
  status: {
    type: String,
    enum: Object.values(AUTOPOSTER_ACCOUNT_STATUS),
    default: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE,
    index: true
  },
  metadata: mongoose.Schema.Types.Mixed // platform-specific extras
}, { timestamps: true });

autoposterAccountSchema.index({ platform: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('AutoposterAccount', autoposterAccountSchema);
