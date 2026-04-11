const API_BASE = '/api';

let _getToken: (() => string | null) | null = null;

export function registerTokenProvider(fn: () => string | null) {
  _getToken = fn;
}

export function getAuthHeaders(): HeadersInit {
  const token = _getToken?.();
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body?.error ?? `HTTP ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...(options.headers ?? {}) },
      });
      return await handleResponse<T>(res);
    } catch (err) {
      const isLast = attempt === retries - 1;
      const status = (err as { status?: number }).status;

      if (status === 401 || status === 403 || isLast) throw err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw new Error('Request failed after retries');
}

export const apiGet = <T>(path: string) =>
  fetchWithRetry<T>(`${API_BASE}${path}`);

export const apiPost = <T>(path: string, body: unknown) =>
  fetchWithRetry<T>(`${API_BASE}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
