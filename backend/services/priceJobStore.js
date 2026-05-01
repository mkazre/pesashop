const crypto = require('crypto');

const ONE_HOUR_MS = 60 * 60 * 1000;

class PriceJobStore {
  constructor() {
    this.jobs = new Map();
    this._cleanupTimer = setInterval(() => this._cleanup(), 10 * 60 * 1000);
    if (typeof this._cleanupTimer.unref === 'function') this._cleanupTimer.unref();
  }

  create(meta = {}) {
    const id = crypto.randomUUID();
    const job = {
      id,
      kind: meta.kind || 'unknown',
      status: 'queued',
      total: 0,
      processed: 0,
      updated: 0,
      message: '',
      error: null,
      startedAt: null,
      finishedAt: null,
      ...meta,
    };
    this.jobs.set(id, job);
    return job;
  }

  update(id, patch) {
    const job = this.jobs.get(id);
    if (!job) return null;
    Object.assign(job, patch);
    return job;
  }

  get(id) {
    return this.jobs.get(id) || null;
  }

  /**
   * Run `task(reportProgress)` in the background, tracking its progress on `job`.
   * Catches errors so an unhandled rejection can never crash the process.
   */
  run(job, task) {
    job.status = 'running';
    job.startedAt = new Date();
    setImmediate(async () => {
      try {
        const result = await task((progress) => {
          this.update(job.id, {
            processed: progress.processed ?? job.processed,
            total: progress.total ?? job.total,
            updated: progress.updated ?? job.updated,
          });
        });
        this.update(job.id, {
          status: 'completed',
          finishedAt: new Date(),
          message: typeof result === 'string' ? result : `Updated ${job.updated} of ${job.total}`,
        });
      } catch (err) {
        console.error(`[priceJobStore] Job ${job.id} (${job.kind}) failed:`, err);
        this.update(job.id, {
          status: 'failed',
          finishedAt: new Date(),
          error: err?.message || 'Unknown error',
        });
      }
    });
  }

  _cleanup() {
    const cutoff = Date.now() - ONE_HOUR_MS;
    for (const [id, job] of this.jobs) {
      if (job.finishedAt && new Date(job.finishedAt).getTime() < cutoff) {
        this.jobs.delete(id);
      }
    }
  }
}

module.exports = new PriceJobStore();
