export interface RetryOptions {
  retries: number;
  baseMs: number;
  maxMs: number;
  jitter?: boolean;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const should = opts.shouldRetry ? opts.shouldRetry(err, attempt) : attempt < opts.retries;
      if (!should || attempt >= opts.retries) break;
      const exp = Math.min(opts.maxMs, opts.baseMs * 2 ** attempt);
      const delayMs = opts.jitter === false ? exp : Math.round(exp * (0.5 + Math.random() * 0.5));
      opts.onRetry?.(err, attempt + 1, delayMs);
      await sleep(delayMs);
    }
  }
  throw lastErr;
}
