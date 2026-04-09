import {
  MANAGE_LOGIN_PATH,
  clearManageToken,
  getManageToken,
} from "@/utils/manage-auth";

const API_BASE = '/api';

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  /** if set to true the helper will not attach the default JSON headers
   * or send credentials.  Useful for public endpoints or file uploads. */
  skipDefaults?: boolean;
  /** object payload that will be JSON.stringified automatically */
  json?: unknown;
  /** HTTP method, defaults to 'GET' */
  method?: string;
};

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { skipDefaults, json, method = 'GET', headers = {}, ...rest } = options;

  const token = getManageToken();

  const init: RequestInit = {
    method,
    ...rest,
    headers: {
      ...(skipDefaults || !token ? {} : {
        'Authorization': `Bearer ${token}`,
      }),
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: skipDefaults ? undefined : 'include',
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }

  const res = await fetch(url, init);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // not JSON, swallow
    data = null;
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;

    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname !== MANAGE_LOGIN_PATH) {
        clearManageToken();
        window.location.href = MANAGE_LOGIN_PATH;
      }
    }

    throw err;
  }

  return data as T;
}

/** Like request(), but returns a Blob – use for CSV / file download endpoints. */
export async function requestBlob(
  path: string,
  options: RequestOptions = {}
): Promise<Blob> {
  const url = `${API_BASE}${path}`;
  const { skipDefaults, json, method = 'GET', headers = {}, ...rest } = options;

  const token = getManageToken();

  const init: RequestInit = {
    method,
    ...rest,
    headers: {
      ...(skipDefaults || !token ? {} : { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
    credentials: skipDefaults ? undefined : 'include',
  };

  if (json !== undefined) init.body = JSON.stringify(json);

  const res = await fetch(url, init);
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status} ${res.statusText}`);
    const err = new Error(msg || `HTTP ${res.status} ${res.statusText}`) as Error & {
      status?: number;
    };
    err.status = res.status;

    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname !== MANAGE_LOGIN_PATH) {
        clearManageToken();
        window.location.href = MANAGE_LOGIN_PATH;
      }
    }

    throw err;
  }
  return res.blob();
}
