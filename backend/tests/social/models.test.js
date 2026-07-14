// Schema-only tests: no DB connection anywhere in this file. mongoose.validateSync()
// runs schema validation in-memory, so these are safe to run against any machine,
// including one with no MongoDB reachable at all (this container has none).

const mongoose = require('mongoose');
const AutoposterAccount = require('../../models/AutoposterAccount');
const AutoposterPost = require('../../models/AutoposterPost');
const AutoposterPostTarget = require('../../models/AutoposterPostTarget');
const AutoposterInsight = require('../../models/AutoposterInsight');
const AutoposterAuditLog = require('../../models/AutoposterAuditLog');
const AutoposterTrend = require('../../models/AutoposterTrend');
const AutoposterTrendCandidate = require('../../models/AutoposterTrendCandidate');
const AutoposterCulturalEvent = require('../../models/AutoposterCulturalEvent');
const AutoposterDecision = require('../../models/AutoposterDecision');
const AutoposterBlocklistTerm = require('../../models/AutoposterBlocklistTerm');
const AutoposterVariantPerformance = require('../../models/AutoposterVariantPerformance');
const AutoposterDesign = require('../../models/AutoposterDesign');
const AutoposterPostProfile = require('../../models/AutoposterPostProfile');

const oid = () => new mongoose.Types.ObjectId();

describe('AutoposterAccount', () => {
  it('accepts a valid document', () => {
    const doc = new AutoposterAccount({ platform: 'facebook', displayName: 'PesaShop Main', externalId: 'ext-1' });
    expect(doc.validateSync()).toBeUndefined();
  });
  it('rejects an unknown platform', () => {
    const doc = new AutoposterAccount({ platform: 'myspace', displayName: 'x', externalId: 'ext-1' });
    expect(doc.validateSync().errors.platform).toBeDefined();
  });
  it('requires externalId', () => {
    const doc = new AutoposterAccount({ platform: 'facebook', displayName: 'x' });
    expect(doc.validateSync().errors.externalId).toBeDefined();
  });
});

describe('AutoposterPost', () => {
  it('accepts a valid document and defaults status to draft', () => {
    const doc = new AutoposterPost({ source: 'manual' });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.status).toBe('draft');
  });
  it('rejects an unknown source', () => {
    const doc = new AutoposterPost({ source: 'newsletter' });
    expect(doc.validateSync().errors.source).toBeDefined();
  });
});

describe('AutoposterPostTarget', () => {
  it('defaults targetRegion to local_zw', () => {
    const doc = new AutoposterPostTarget({ post: oid(), account: oid(), platform: 'tiktok' });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.targetRegion).toBe('local_zw');
  });
  it('requires post, account, platform', () => {
    const doc = new AutoposterPostTarget({});
    const err = doc.validateSync();
    expect(err.errors.post).toBeDefined();
    expect(err.errors.account).toBeDefined();
    expect(err.errors.platform).toBeDefined();
  });
});

describe('AutoposterInsight', () => {
  it('requires postTarget', () => {
    const doc = new AutoposterInsight({ impressions: 100 });
    expect(doc.validateSync().errors.postTarget).toBeDefined();
  });
});

describe('AutoposterAuditLog', () => {
  it('requires action', () => {
    const doc = new AutoposterAuditLog({});
    expect(doc.validateSync().errors.action).toBeDefined();
  });
});

describe('AutoposterTrend', () => {
  it('accepts a valid trend and defaults sensitivityFlag to safe', () => {
    const doc = new AutoposterTrend({ term: 'back to school', slug: 'back-to-school' });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.sensitivityFlag).toBe('safe');
    expect(doc.active).toBe(true);
  });
});

describe('AutoposterTrendCandidate', () => {
  it('requires trend and product', () => {
    const doc = new AutoposterTrendCandidate({ similarity: 0.7 });
    const err = doc.validateSync();
    expect(err.errors.trend).toBeDefined();
    expect(err.errors.product).toBeDefined();
  });
});

describe('AutoposterCulturalEvent', () => {
  it('accepts a valid event with a categoryHints array', () => {
    const doc = new AutoposterCulturalEvent({
      name: 'Black Friday',
      recurrence: { type: 'annual_last_weekday', month: 11, weekday: 'friday' },
      boost: 2.0,
      categoryHints: []
    });
    expect(doc.validateSync()).toBeUndefined();
  });
  it('rejects boost outside 1.0-2.0', () => {
    const doc = new AutoposterCulturalEvent({ name: 'x', recurrence: {}, boost: 5 });
    expect(doc.validateSync().errors.boost).toBeDefined();
  });
});

describe('AutoposterDecision', () => {
  it('requires runId, trend, product, platform', () => {
    const doc = new AutoposterDecision({});
    const err = doc.validateSync();
    expect(err.errors.runId).toBeDefined();
    expect(err.errors.trend).toBeDefined();
    expect(err.errors.product).toBeDefined();
    expect(err.errors.platform).toBeDefined();
  });
  it('defaults approvalStatus to pending', () => {
    const doc = new AutoposterDecision({ runId: 'run-1', trend: oid(), product: oid(), platform: 'x' });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.approvalStatus).toBe('pending');
  });
});

describe('AutoposterBlocklistTerm', () => {
  it('defaults type to exact', () => {
    const doc = new AutoposterBlocklistTerm({ term: 'sanctions' });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.type).toBe('exact');
  });
});

describe('AutoposterVariantPerformance', () => {
  it('requires platform, category, variantStyle', () => {
    const doc = new AutoposterVariantPerformance({});
    const err = doc.validateSync();
    expect(err.errors.platform).toBeDefined();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.variantStyle).toBeDefined();
  });
});

describe('AutoposterDesign', () => {
  it('requires title', () => {
    const doc = new AutoposterDesign({});
    expect(doc.validateSync().errors.title).toBeDefined();
  });
  it('accepts a valid design with layers', () => {
    const doc = new AutoposterDesign({ title: 'New Arrival template', layers: [{ type: 'text', text: 'Now in stock' }] });
    expect(doc.validateSync()).toBeUndefined();
  });
});

describe('AutoposterPostProfile', () => {
  it('applies config defaults when config is omitted', () => {
    const doc = new AutoposterPostProfile({ name: 'Default' });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.config.images).toBe('featured_only');
    expect(doc.config.price).toBe('show');
    expect(doc.config.brandWatermark).toBe('on');
  });
  it('rejects an invalid enum value inside config', () => {
    const doc = new AutoposterPostProfile({ name: 'Broken', config: { images: 'holograms' } });
    expect(doc.validateSync().errors['config.images']).toBeDefined();
  });
});
