// No network calls and no DB connection in this file — buildAuthorizeUrl() is
// pure string construction, and encryptToken/decryptToken are pure crypto.
// exchangeCodeForToken()/refreshAccessToken() (real HTTP calls) are exercised
// live once real platform credentials exist — not here.

describe('autoposterTokenCrypto', () => {
  const ORIGINAL_ENV = process.env.SOCIAL_TOKEN_KEY;

  beforeAll(() => {
    process.env.SOCIAL_TOKEN_KEY = require('crypto').randomBytes(32).toString('hex');
  });
  afterAll(() => {
    process.env.SOCIAL_TOKEN_KEY = ORIGINAL_ENV;
  });

  it('round-trips a token', () => {
    const { encryptToken, decryptToken } = require('../../services/autoposterTokenCrypto');
    const plaintext = 'EAAB_some_fake_meta_page_token_1234567890';
    const packed = encryptToken(plaintext);
    expect(Buffer.isBuffer(packed)).toBe(true);
    expect(decryptToken(packed)).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const { encryptToken } = require('../../services/autoposterTokenCrypto');
    const a = encryptToken('same-plaintext');
    const b = encryptToken('same-plaintext');
    expect(a.equals(b)).toBe(false);
  });

  it('throws on a tampered buffer instead of returning garbage', () => {
    const { encryptToken, decryptToken } = require('../../services/autoposterTokenCrypto');
    const packed = encryptToken('a-real-token');
    packed[packed.length - 1] ^= 0xff; // flip a bit in the ciphertext
    expect(() => decryptToken(packed)).toThrow();
  });

  it('throws a clear error when SOCIAL_TOKEN_KEY is missing', () => {
    delete process.env.SOCIAL_TOKEN_KEY;
    const { encryptToken } = require('../../services/autoposterTokenCrypto');
    expect(() => encryptToken('x')).toThrow(/SOCIAL_TOKEN_KEY/);
    process.env.SOCIAL_TOKEN_KEY = require('crypto').randomBytes(32).toString('hex');
  });
});

describe('OAuth authorize URL builders', () => {
  beforeAll(() => {
    Object.assign(process.env, {
      META_APP_ID: 'fake-meta-app-id',
      META_APP_SECRET: 'fake-meta-secret',
      META_OAUTH_REDIRECT_URI: 'https://admin.example.com/api/autoposter/oauth/facebook/callback',
      X_CLIENT_ID: 'fake-x-client-id',
      X_CLIENT_SECRET: 'fake-x-secret',
      X_OAUTH_REDIRECT_URI: 'https://admin.example.com/api/autoposter/oauth/x/callback',
      LINKEDIN_CLIENT_ID: 'fake-linkedin-client-id',
      LINKEDIN_CLIENT_SECRET: 'fake-linkedin-secret',
      LINKEDIN_OAUTH_REDIRECT_URI: 'https://admin.example.com/api/autoposter/oauth/linkedin/callback',
      TIKTOK_CLIENT_KEY: 'fake-tiktok-client-key',
      TIKTOK_CLIENT_SECRET: 'fake-tiktok-secret',
      TIKTOK_OAUTH_REDIRECT_URI: 'https://admin.example.com/api/autoposter/oauth/tiktok/callback'
    });
  });

  it('Facebook: builds a graph.facebook.com dialog URL with client_id, redirect_uri, state, and scopes', () => {
    const facebookOAuth = require('../../services/autoposterOAuthFacebook');
    const url = new URL(facebookOAuth.buildAuthorizeUrl('state-123'));
    expect(url.hostname).toBe('www.facebook.com');
    expect(url.searchParams.get('client_id')).toBe('fake-meta-app-id');
    expect(url.searchParams.get('state')).toBe('state-123');
    expect(url.searchParams.get('scope')).toContain('pages_manage_posts');
  });

  it('Instagram: shares the Meta app but uses Instagram-specific scopes', () => {
    const instagramOAuth = require('../../services/autoposterOAuthInstagram');
    const url = new URL(instagramOAuth.buildAuthorizeUrl('state-456'));
    expect(url.searchParams.get('client_id')).toBe('fake-meta-app-id');
    expect(url.searchParams.get('scope')).toContain('instagram_content_publish');
  });

  it('X: builds a twitter.com authorize URL with PKCE code_challenge', () => {
    const xOAuth = require('../../services/autoposterOAuthX');
    const { codeVerifier, codeChallenge } = xOAuth.generatePkcePair();
    expect(codeVerifier).toEqual(expect.any(String));
    expect(codeChallenge).not.toBe(codeVerifier);

    const url = new URL(xOAuth.buildAuthorizeUrl('state-789', { codeChallenge }));
    expect(url.hostname).toBe('twitter.com');
    expect(url.searchParams.get('code_challenge')).toBe(codeChallenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('X: buildAuthorizeUrl throws without a codeChallenge (PKCE is mandatory here)', () => {
    const xOAuth = require('../../services/autoposterOAuthX');
    expect(() => xOAuth.buildAuthorizeUrl('state-000', {})).toThrow(/codeChallenge/);
  });

  it('LinkedIn: builds a linkedin.com authorization URL', () => {
    const linkedinOAuth = require('../../services/autoposterOAuthLinkedIn');
    const url = new URL(linkedinOAuth.buildAuthorizeUrl('state-abc'));
    expect(url.hostname).toBe('www.linkedin.com');
    expect(url.searchParams.get('client_id')).toBe('fake-linkedin-client-id');
    expect(url.searchParams.get('scope')).toContain('w_organization_social');
  });

  it('TikTok: builds a tiktok.com authorize URL using client_key (not client_id)', () => {
    const tiktokOAuth = require('../../services/autoposterOAuthTikTok');
    const url = new URL(tiktokOAuth.buildAuthorizeUrl('state-def'));
    expect(url.hostname).toBe('www.tiktok.com');
    expect(url.searchParams.get('client_key')).toBe('fake-tiktok-client-key');
    expect(url.searchParams.get('client_id')).toBeNull();
  });

  it('each adapter throws a clear error when its env vars are missing', () => {
    delete process.env.LINKEDIN_CLIENT_ID;
    const linkedinOAuth = require('../../services/autoposterOAuthLinkedIn');
    expect(() => linkedinOAuth.buildAuthorizeUrl('state')).toThrow(/LINKEDIN_CLIENT_ID/);
    process.env.LINKEDIN_CLIENT_ID = 'fake-linkedin-client-id';
  });
});

describe('AutoposterOAuthState', () => {
  it('requires state and platform', () => {
    const AutoposterOAuthState = require('../../models/AutoposterOAuthState');
    const doc = new AutoposterOAuthState({});
    const err = doc.validateSync();
    expect(err.errors.state).toBeDefined();
    expect(err.errors.platform).toBeDefined();
  });

  it('has a TTL index on createdAt so abandoned OAuth attempts expire (Spec: 10 minutes)', () => {
    const AutoposterOAuthState = require('../../models/AutoposterOAuthState');
    const ttlIndex = AutoposterOAuthState.schema.indexes().find(([keys]) => keys.createdAt === 1);
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1].expireAfterSeconds).toBe(600);
  });
});

describe('AutoposterAccount token field security', () => {
  it('never returns token fields by default (select: false)', () => {
    const AutoposterAccount = require('../../models/AutoposterAccount');
    expect(AutoposterAccount.schema.path('accessTokenEnc').selected).toBe(false);
    expect(AutoposterAccount.schema.path('refreshTokenEnc').selected).toBe(false);
  });
});
