import { toast } from 'sonner';
import { clearManageToken, getManageToken } from "@/utils/manage-auth";
import { API_BASE, MANAGE_LOGIN_PATH } from '@/utils/constants';

export interface ApiError extends Error {
  status: number;
  data: unknown;
}

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  /** if set to true the helper will not attach auth headers or credentials. */
  skipDefaults?: boolean;
  /** object payload that will be JSON.stringified automatically */
  json?: unknown;
  /** multipart payload for uploads; do not combine with json */
  formData?: FormData;
  /** HTTP method, defaults to 'GET' */
  method?: string;
  /** Suppress request-level toast notifications for error responses. */
  silent?: boolean;
};

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { skipDefaults, json, formData, method = 'GET', headers = {}, silent = false, ...rest } = options;

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
    
    // Handle 401: clear token and redirect to login
    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname !== MANAGE_LOGIN_PATH) {
        clearManageToken();
        if (!silent) {
          toast.error('登录已过期，请重新登录');
          setTimeout(() => {
            window.location.href = MANAGE_LOGIN_PATH;
          }, 800);
        } else {
          window.location.href = MANAGE_LOGIN_PATH;
        }
      }
    }
    
    // Show error toast unless silent mode
    if (!silent) {
      toast.error(message);
    }
    
    const err = new Error(message) as ApiError;
    err.status = res.status;
    err.data = data;

    throw err;
  }

  return data as T;
}
