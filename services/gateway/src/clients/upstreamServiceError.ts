export class UpstreamServiceError extends Error {
  constructor(
    message: string,
    public readonly upstream: { url: string; status: number; statusText: string; body?: string },
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'UpstreamServiceError';
  }
}

