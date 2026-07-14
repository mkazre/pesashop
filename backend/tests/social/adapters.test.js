// Contract tests (Spec 26.1): nock intercepts the HTTP layer so these run
// against a mocked network, not a real database or real platform — verifying
// each adapter's request shape and its error-classification logic against
// realistic response bodies, without needing real credentials or accounts.
const nock = require('nock');
const mongoose = require('mongoose');
const { encryptToken } = require('../../services/autoposterTokenCrypto');

const facebookOAuth = require('../../services/autoposterOAuthFacebook');
const instagramOAuth = require('../../services/autoposterOAuthInstagram');
const xOAuth = require('../../services/autoposterOAuthX');
const linkedinOAuth = require('../../services/autoposterOAuthLinkedIn');
const tiktokOAuth = require('../../services/autoposterOAuthTikTok');

beforeAll(() => {
  process.env.SOCIAL_TOKEN_KEY = require('crypto').randomBytes(32).toString('hex');
});

afterEach(() => {
  nock.cleanAll();
});

function fakeAccount(externalId = 'acct-123') {
  return {
    _id: new mongoose.Types.ObjectId(),
    externalId,
    accessTokenEnc: encryptToken('fake-access-token'),
    displayName: 'Test Account'
  };
}

describe('Facebook adapter', () => {
  it('publish() posts to /feed with message+link when there is no media', async () => {
    nock('https://graph.facebook.com').post('/v19.0/page-1/feed').query(true).reply(200, { id: 'page-1_999' });

    const result = await facebookOAuth.publish({ hashtags: [] }, fakeAccount('page-1'), { baseCaption: 'Hello world', linkUrl: 'https://pesashop.com' });
    expect(result.externalPostId).toBe('page-1_999');
    expect(result.externalUrl).toContain('page-1_999');
  });

  it('publish() posts to /photos when an image is present', async () => {
    nock('https://graph.facebook.com').post('/v19.0/page-2/photos').query(true).reply(200, { id: 'photo-1', post_id: 'page-2_photo-1' });

    const result = await facebookOAuth.publish(
      { hashtags: [] },
      fakeAccount('page-2'),
      { baseCaption: 'New product', mediaRefs: [{ type: 'image', url: 'https://cdn.example.com/x.jpg' }] }
    );
    expect(result.externalPostId).toBe('page-2_photo-1');
  });

  it('classifies OAuthException (code 190) as permanent', () => {
    const error = { response: { data: { error: { code: 190, message: 'Invalid OAuth access token' } } } };
    expect(facebookOAuth.classifyGraphError(error)).toMatchObject({ transient: false });
  });

  it('classifies known rate-limit codes as transient', () => {
    const error = { response: { data: { error: { code: 17, message: 'User request limit reached' } } } };
    expect(facebookOAuth.classifyGraphError(error)).toMatchObject({ transient: true });
  });

  it('publish() rejects with the correct transient flag on a real-shaped error response', async () => {
    nock('https://graph.facebook.com').post('/v19.0/page-3/feed').query(true).reply(400, { error: { code: 190, message: 'Invalid OAuth access token' } });
    await expect(facebookOAuth.publish({ hashtags: [] }, fakeAccount('page-3'), { baseCaption: 'x' }))
      .rejects.toMatchObject({ transient: false });
  });
});

describe('Instagram adapter', () => {
  it('publish() creates a container then publishes it for a single image', async () => {
    nock('https://graph.facebook.com')
      .post('/v19.0/ig-1/media').query(true).reply(200, { id: 'container-1' })
      .post('/v19.0/ig-1/media_publish').query(true).reply(200, { id: 'media-1' });

    const result = await instagramOAuth.publish(
      { hashtags: [] },
      fakeAccount('ig-1'),
      { baseCaption: 'New arrival', mediaRefs: [{ type: 'image', url: 'https://cdn.example.com/x.jpg' }] }
    );
    expect(result.externalPostId).toBe('media-1');
  });

  it('publish() rejects when there is no image or video', async () => {
    await expect(instagramOAuth.publish({ hashtags: [] }, fakeAccount('ig-2'), { baseCaption: 'text only' }))
      .rejects.toMatchObject({ transient: false });
  });
});

describe('X adapter', () => {
  it('publish() posts a single tweet with the resolved caption', async () => {
    nock('https://api.twitter.com').post('/2/tweets', (body) => body.text.includes('Hello world')).reply(201, { data: { id: 'tweet-1' } });

    const result = await xOAuth.publish({ hashtags: [] }, fakeAccount('x-1'), { baseCaption: 'Hello world' });
    expect(result.externalPostId).toBe('tweet-1');
  });

  it('splitIntoTweets keeps every chunk within the 280-char limit', () => {
    const longCaption = Array(150).fill('word').join(' '); // 749 chars, well over 280
    const tweets = xOAuth.splitIntoTweets(longCaption);
    expect(tweets.length).toBeGreaterThan(1);
    tweets.forEach((t) => expect(t.length).toBeLessThanOrEqual(280));
  });

  it('classifies HTTP 429 as transient and 401 as permanent', () => {
    expect(xOAuth.classifyXError({ response: { status: 429, data: {} } })).toMatchObject({ transient: true });
    expect(xOAuth.classifyXError({ response: { status: 401, data: {} } })).toMatchObject({ transient: false });
  });
});

describe('LinkedIn adapter', () => {
  it('publish() posts as the connected personal profile and reads the post ID from the response header', async () => {
    nock('https://api.linkedin.com')
      .post('/rest/posts', (body) => body.author === 'urn:li:person:li-1')
      .reply(201, {}, { 'x-restli-id': 'urn:li:share:12345' });

    const result = await linkedinOAuth.publish({ hashtags: [] }, fakeAccount('li-1'), { baseCaption: 'Hello LinkedIn' });
    expect(result.externalPostId).toBe('urn:li:share:12345');
  });

  it('publish() refuses company-page posting until organization URN resolution exists', async () => {
    await expect(linkedinOAuth.publish({ hashtags: [], extra: { authorType: 'company' } }, fakeAccount('li-2'), { baseCaption: 'x' }))
      .rejects.toMatchObject({ transient: false });
  });

  it('classifies HTTP 500 as transient', () => {
    expect(linkedinOAuth.classifyLinkedInError({ response: { status: 500, data: {} } })).toMatchObject({ transient: true });
  });
});

describe('TikTok adapter', () => {
  it('publish() calls the inbox-upload endpoint by default (postMode not "direct")', async () => {
    nock('https://open.tiktokapis.com').post('/v2/post/publish/inbox/video/init/').reply(200, { data: { publish_id: 'pub-1' } });

    const result = await tiktokOAuth.publish(
      { hashtags: [] },
      fakeAccount('tt-1'),
      { baseCaption: 'x', mediaRefs: [{ type: 'video', url: 'https://cdn.example.com/v.mp4' }] }
    );
    expect(result.externalPostId).toBe('pub-1');
  });

  it('publish() calls the direct-post endpoint when postMode is "direct"', async () => {
    nock('https://open.tiktokapis.com')
      .post('/v2/post/publish/video/init/', (body) => body.post_info.privacy_level === 'PUBLIC_TO_EVERYONE')
      .reply(200, { data: { publish_id: 'pub-2' } });

    const result = await tiktokOAuth.publish(
      { hashtags: [], extra: { postMode: 'direct', privacy: 'public' } },
      fakeAccount('tt-2'),
      { baseCaption: 'x', mediaRefs: [{ type: 'video', url: 'https://cdn.example.com/v.mp4' }] }
    );
    expect(result.externalPostId).toBe('pub-2');
  });

  it('publish() rejects when there is no video', async () => {
    await expect(tiktokOAuth.publish({ hashtags: [] }, fakeAccount('tt-3'), { baseCaption: 'no media' }))
      .rejects.toMatchObject({ transient: false });
  });
});
