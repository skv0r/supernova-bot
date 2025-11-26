type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions<TBody = unknown> extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  body?: TBody;
}

export async function httpRequest<TResponse = unknown, TBody = unknown>(
  url: string,
  options: HttpRequestOptions<TBody> = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

