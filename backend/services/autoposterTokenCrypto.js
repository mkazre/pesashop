const crypto = require('crypto');

// AES-256-GCM token encryption (Spec Section 5.3). SOCIAL_TOKEN_KEY must be a
// 32-byte hex string — generate with: openssl rand -hex 32
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const hex = process.env.SOCIAL_TOKEN_KEY;
  if (!hex) throw new Error('SOCIAL_TOKEN_KEY is not set — generate one with `openssl rand -hex 32`');
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw new Error('SOCIAL_TOKEN_KEY must decode to exactly 32 bytes (64 hex characters)');
  return key;
}

// Encrypts a plaintext token. Returns a single Buffer packing [iv | authTag | ciphertext]
// so it can be stored directly in AutoposterAccount.accessTokenEnc / refreshTokenEnc.
function encryptToken(plaintext) {
  if (typeof plaintext !== 'string' || !plaintext) throw new Error('encryptToken requires a non-empty string');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

// Reverses encryptToken. Throws if the auth tag doesn't verify (tampered or
// wrong key) rather than silently returning garbage.
function decryptToken(packed) {
  if (!Buffer.isBuffer(packed) || packed.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('decryptToken requires a Buffer produced by encryptToken');
  }
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { encryptToken, decryptToken };
