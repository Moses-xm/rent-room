import {
  MANAGE_LOGIN_PATH,
  clearManageToken,
  getManageToken,
} from "@/utils/manage-auth";

const API_BASE = '/api';

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  /** if set to true the helper will not attach auth headers or credentials. */
  skipDefaults?: boolean;
  /** object payload that will be JSON.stringified automatically */
  json?: unknown;
  /** multipart payload for uploads; do not combine with json */
  formData?: FormData;
  /** HTTP method, defaults to 'GET' */
  method?: string;
};

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { skipDefaults, json, formData, method = 'GET', headers = {}, ...rest } = options;

  if (json !== undefined && formData !== undefined) {
    throw new Error('request() cannot send both json and formData in the same call');
  }

  const token = getManageToken();

  const init: RequestInit = {
    method,
    ...rest,
    headers: {
      ...(skipDefaults || !token ? {} : {
        'Authorization': `Bearer ${token}`,
      }),
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    credentials: skipDefaults ? undefined : 'include',
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  } else if (formData !== undefined) {
    init.body = formData;
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
