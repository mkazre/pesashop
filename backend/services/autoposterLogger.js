const pino = require('pino');

// Structured logging (Spec Section 17, 29.4) — every log line carries
// module='social' plus a submodule tag, matching the spec's literal example
// shape. Scoped to this module specifically (per the Phase 0 decision to use
// pino here against the rest of the codebase's plain console.* convention) —
// not a general logging migration.
const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) }
});

// NEVER log: tokens (raw or encrypted), full request/response bodies of
// platform APIs (Spec 29.4) — callers pass only the structured fields below,
// never a raw account/token object.
function socialLogger(submodule) {
  return baseLogger.child({ module: 'social', submodule });
}

module.exports = { socialLogger };
