import { getAccessToken } from './auth.js';
import { AmazonAppstoreError } from './errors.js';
import type { Config } from './config.js';

const BASE_URL = 'https://developer.amazon.com/api/appstore/v1';

export class AmazonAppstoreClient {
  constructor(private config: Config) {}

  async request<T>(path: string, options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
    etag?: string;
    rawBody?: Buffer;
    contentType?: string;
  }): Promise<{ data: T; etag?: string }> {
    const token = await getAccessToken(this.config);
    const method = options?.method ?? 'GET';

    let url = `${BASE_URL}${path}`;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) searchParams.set(key, value);
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    if (options?.etag && (method === 'PUT' || method === 'DELETE')) {
      headers['If-Match'] = options.etag;
    }

    let body: string | BodyInit | undefined;
    if (options?.rawBody) {
      body = new Uint8Array(options.rawBody) as unknown as BodyInit;
      headers['Content-Type'] = options.contentType ?? 'application/octet-stream';
    } else if (options?.body) {
      body = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { method, headers, body });

    if (!response.ok) {
      interface ErrorResponse { message?: string; errorCode?: string; errors?: Array<{ message: string }> }
      let errorInfo: ErrorResponse | null = null;
      try {
        errorInfo = await response.json() as ErrorResponse;
      } catch { /* response wasn't JSON */ }

      const message = errorInfo?.message
        ?? errorInfo?.errors?.[0]?.message
        ?? await response.text().catch(() => 'No response body');

      throw new AmazonAppstoreError(
        response.status,
        errorInfo?.errorCode ?? `HTTP_${response.status}`,
        message
      );
    }

    const etag = response.headers.get('ETag') ?? undefined;

    if (response.status === 204) return { data: {} as T, etag };
    const data = await response.json() as T;
    return { data, etag };
  }
}
