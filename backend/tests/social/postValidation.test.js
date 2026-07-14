// Pure function test — no DB, no network. The actual CRUD routes (create/list/
// get/patch/cancel/publish-now) were verified live against the real Atlas dev
// database instead of here, consistent with how Phase 1/2 were verified —
// this repo has no live-DB-dependent tests in its Jest suite by design, since
// CI would have no credentials to run them.
const { validateCaptionLengths } = require('../../routes/autoposter');

describe('validateCaptionLengths', () => {
  it('passes when captions are within each platform limit', () => {
    const errors = validateCaptionLengths('short caption', [
      { platform: 'x' },
      { platform: 'instagram' },
      { platform: 'facebook' }
    ]);
    expect(errors).toEqual([]);
  });

  it('flags a caption over the platform limit', () => {
    const longCaption = 'a'.repeat(300);
    const errors = validateCaptionLengths(longCaption, [{ platform: 'x' }]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/x: caption is 300 characters, limit is 280/);
  });

  it('uses captionOverride instead of baseCaption when present', () => {
    const errors = validateCaptionLengths('short', [
      { platform: 'x', captionOverride: 'b'.repeat(300) }
    ]);
    expect(errors).toHaveLength(1);
  });

  it('skips the limit for X when threadMode is on', () => {
    const errors = validateCaptionLengths('a'.repeat(1000), [
      { platform: 'x', extra: { threadMode: true } }
    ]);
    expect(errors).toEqual([]);
  });

  it('checks every target independently, collecting all violations', () => {
    const errors = validateCaptionLengths('a'.repeat(2500), [
      { platform: 'x' },       // over (280)
      { platform: 'instagram' }, // over (2200)
      { platform: 'linkedin' }   // under (3000) — should not appear
    ]);
    expect(errors).toHaveLength(2);
    expect(errors.some(e => e.startsWith('x:'))).toBe(true);
    expect(errors.some(e => e.startsWith('instagram:'))).toBe(true);
    expect(errors.some(e => e.startsWith('linkedin:'))).toBe(false);
  });
});
