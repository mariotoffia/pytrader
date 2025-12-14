import { createRequestId, debugLog, isDebugEnabled } from './debug';

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly details: {
      url: string;
      method: string;
      status?: number;
      statusText?: string;
      requestId: string;
      responseText?: string;
    }
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function safeReadText(response: Response): Promise<string | undefined> {
  const anyResp = response as any;
  if (typeof anyResp.text !== 'function') return undefined;
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

function headersToRecord(headersInit: HeadersInit | undefined): Record<string, string> {
  if (!headersInit) return {};
  if (headersInit instanceof Headers) {
    const out: Record<string, string> = {};
    headersInit.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headersInit)) {
    return Object.fromEntries(headersInit);
  }
  return { ...headersInit };
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  options?: { scope?: string; requestName?: string; requestId?: string }
): Promise<{ data: T; requestId: string }> {
  const requestId = options?.requestId ?? createRequestId(options?.requestName ?? 'req');
  const method = (init.method ?? 'GET').toUpperCase();

  const headers: Record<string, string> = headersToRecord(init.headers);
  headers['X-Request-Id'] = requestId;

  const scope = options?.scope ?? 'http';
  if (isDebugEnabled(scope)) {
    debugLog(scope, `${method} ${url}`, { requestId });
    if (init.body) debugLog(scope, 'request body', init.body);
  }

  const response = await fetch(url, { ...init, headers });
  const anyResponse = response as any;
  if (!anyResponse || typeof anyResponse.ok !== 'boolean') {
    throw new HttpError('Fetch did not return a valid Response object', {
      url,
      method,
      requestId,
    });
  }

  if (!response.ok) {
    const responseText = await safeReadText(response);
    if (isDebugEnabled(scope)) {
      debugLog(scope, `${method} ${url} -> ${response.status} ${response.statusText}`, {
        requestId,
        responseText,
      });
    }
    throw new HttpError(`Failed request: ${response.status} ${response.statusText}`, {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      requestId,
      responseText,
    });
  }

  const data = (await response.json()) as T;
  if (isDebugEnabled(scope)) {
    debugLog(scope, `${method} ${url} -> ${response.status}`, { requestId });
  }
  return { data, requestId };
}
