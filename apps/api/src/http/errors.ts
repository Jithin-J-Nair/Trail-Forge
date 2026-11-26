export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
    diagnostics?: unknown;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly diagnostics?: unknown,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON(requestId?: string): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(requestId ? { requestId } : {}),
        ...(this.diagnostics ? { diagnostics: this.diagnostics } : {}),
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}
