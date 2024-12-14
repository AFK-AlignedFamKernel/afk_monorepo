// Custom Queue implementation
class UploadQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private concurrency: number;
  private lastRun: number = Date.now();
  private requestsInWindow = 0;
  private windowMs: number;
  private maxRequestsPerWindow: number;

  constructor(options: { concurrency: number; windowMs: number; maxRequestsPerWindow: number }) {
    this.concurrency = options.concurrency;
    this.windowMs = options.windowMs;
    this.maxRequestsPerWindow = options.maxRequestsPerWindow;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    // Check rate limit
    const now = Date.now();
    if (now - this.lastRun >= this.windowMs) {
      this.requestsInWindow = 0;
      this.lastRun = now;
    }

    if (this.requestsInWindow >= this.maxRequestsPerWindow) {
      const waitTime = this.windowMs - (now - this.lastRun);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.add(fn);
    }

    // Add to queue
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.requestsInWindow++;
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processNext();
        }
      });

      this.processNext();
    });
  }

  private processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();
    if (task) {
      task();
    }
  }
}

// Custom retry implementation
async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    minTimeout: number;
    maxTimeout: number;
    factor: number;
    onFailedAttempt?: (error: { attemptNumber: number; retriesLeft: number }) => Promise<void>;
  },
): Promise<T> {
  let attempt = 1;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      const retriesLeft = options.retries - attempt;

      if (retriesLeft <= 0) {
        throw error;
      }

      if (options.onFailedAttempt) {
        await options.onFailedAttempt({
          attemptNumber: attempt,
          retriesLeft,
        });
      }

      const timeout = Math.min(
        options.maxTimeout,
        options.minTimeout * Math.pow(options.factor, attempt - 1),
      );

      await new Promise((resolve) => setTimeout(resolve, timeout));
      attempt++;
    }
  }
}

// Create queue instance
export const uploadQueue = new UploadQueue({
  concurrency: 2,
  windowMs: 1000,
  maxRequestsPerWindow: 5,
});

// Retry configuration
export const retryOptions = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 5000,
  onFailedAttempt: async (error: { attemptNumber: number; retriesLeft: number }) => {
    console.log(`Upload attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
};

// Helper function to combine queue and retry
export async function queuedUpload<T>(fn: () => Promise<T>): Promise<T> {
  return uploadQueue.add(() => retry(fn, retryOptions));
}
