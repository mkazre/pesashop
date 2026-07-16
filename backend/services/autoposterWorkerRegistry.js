// Zero-downtime deploy support (Spec Section 27.5): "Drain workers before
// stopping: signal SIGTERM, wait for active jobs to complete (up to 2
// minutes), then exit." In our single-process, node-cron-based architecture
// (the Phase 0 decision replacing Spec 27.1's separate publisher/trend/
// composer/insights-worker processes) there's no separate process to signal
// — but a mid-tick cron job (e.g. the publisher halfway through publishing a
// batch) can still be interrupted by an ungraceful exit. Each cron registers
// its own "is a tick currently running" check here; server.js's SIGTERM
// handler polls all of them before closing.
const registry = new Map();

function registerWorker(name, isRunningFn) {
  registry.set(name, isRunningFn);
}

function getActiveWorkers() {
  return [...registry.entries()].filter(([, isRunningFn]) => isRunningFn()).map(([name]) => name);
}

async function waitForWorkersToFinish(maxMs = 120000, pollIntervalMs = 500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxMs) {
    const active = getActiveWorkers();
    if (active.length === 0) return { drained: true, waitedMs: Date.now() - startedAt };
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return { drained: false, stillActive: getActiveWorkers(), waitedMs: Date.now() - startedAt };
}

module.exports = { registerWorker, getActiveWorkers, waitForWorkersToFinish };
