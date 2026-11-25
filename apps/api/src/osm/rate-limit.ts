/** Simple serial limiter: at most one call per `minIntervalMs`. */
export function createRateLimiter(minIntervalMs: number) {
  let last = 0;
  let chain: Promise<void> = Promise.resolve();

  return async function schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = chain.then(async () => {
      const wait = Math.max(0, minIntervalMs - (Date.now() - last));
      if (wait > 0) {
        await new Promise((r) => setTimeout(r, wait));
      }
      last = Date.now();
      return fn();
    });
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
