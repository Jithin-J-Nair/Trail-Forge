export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  openMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private openedAt = 0;
  private lastError?: string;

  constructor(
    readonly name: string,
    private readonly opts: CircuitBreakerOptions = {
      failureThreshold: 3,
      successThreshold: 2,
      openMs: 30_000,
    },
  ) {}

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.opts.openMs) {
      this.state = 'half_open';
      this.successes = 0;
    }
    return this.state;
  }

  canExecute(): boolean {
    return this.getState() !== 'open';
  }

  onSuccess(): void {
    if (this.state === 'half_open') {
      this.successes += 1;
      if (this.successes >= this.opts.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
        delete this.lastError;
      }
      return;
    }
    this.failures = 0;
    delete this.lastError;
  }

  onFailure(err: unknown): void {
    this.failures += 1;
    this.lastError = err instanceof Error ? err.message : String(err);
    if (this.state === 'half_open' || this.failures >= this.opts.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      this.successes = 0;
    }
  }

  snapshot() {
    return {
      state: this.getState(),
      failures: this.failures,
      lastError: this.lastError,
    };
  }
}
