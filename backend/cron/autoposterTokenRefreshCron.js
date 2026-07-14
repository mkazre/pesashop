const cron = require('node-cron');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { encryptToken, decryptToken } = require('../services/autoposterTokenCrypto');
const { AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');

const ADAPTERS = {
  facebook: require('../services/autoposterOAuthFacebook'),
  instagram: require('../services/autoposterOAuthInstagram'),
  x: require('../services/autoposterOAuthX'),
  linkedin: require('../services/autoposterOAuthLinkedIn'),
  tiktok: require('../services/autoposterOAuthTikTok')
};

// Daily cron: scans for accounts whose token expires within 72 hours and
// refreshes them (Spec Section 5.2). Platforms with no refresh mechanism
// (LinkedIn — see autoposterOAuthLinkedIn.js) are marked needs_reauth directly,
// same as a failed refresh attempt.
async function refreshExpiringAccounts() {
  const soon = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const accounts = await AutoposterAccount.find({
    status: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE,
    tokenExpiresAt: { $lte: soon }
  }).select('+accessTokenEnc +refreshTokenEnc');

  let refreshed = 0, failed = 0;
  for (const account of accounts) {
    const adapter = ADAPTERS[account.platform];
    try {
      if (!adapter || typeof adapter.refreshAccessToken !== 'function') {
        throw new Error(`${account.platform} has no programmatic refresh — needs manual reconnect`);
      }
      const currentSecret = account.refreshTokenEnc
        ? decryptToken(account.refreshTokenEnc)
        : decryptToken(account.accessTokenEnc);
      const result = await adapter.refreshAccessToken(currentSecret);

      account.accessTokenEnc = encryptToken(result.accessToken);
      if (result.refreshToken) account.refreshTokenEnc = encryptToken(result.refreshToken);
      if (result.expiresInSeconds) account.tokenExpiresAt = new Date(Date.now() + result.expiresInSeconds * 1000);
      await account.save();
      refreshed++;
    } catch (e) {
      account.status = AUTOPOSTER_ACCOUNT_STATUS.NEEDS_REAUTH;
      await account.save();
      await AutoposterAuditLog.create({
        action: 'token_refresh_failed',
        entityType: 'AutoposterAccount',
        entityId: String(account._id),
        payload: { platform: account.platform, error: e.message }
      });
      failed++;
    }
  }
  return { refreshed, failed, checked: accounts.length };
}

function initAutoposterTokenRefreshCron() {
  // Once daily at 03:00 server time — well clear of peak posting windows.
  cron.schedule('0 3 * * *', async () => {
    try {
      const result = await refreshExpiringAccounts();
      if (result.checked > 0) {
        console.log(`[autoposter] token refresh: ${result.refreshed} refreshed, ${result.failed} need reauth, ${result.checked} checked`);
      }
    } catch (e) {
      console.error('[autoposter] token refresh cron error:', e.message);
    }
  });

  console.log('✅ Autoposter token refresh cron initialized (daily 03:00)');
}

module.exports = { initAutoposterTokenRefreshCron, refreshExpiringAccounts };
