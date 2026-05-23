import { toast } from 'sonner';
import { clearPortalAuth, getPortalToken } from '@/utils/portal-auth';
import { API_BASE, PORTAL_LOGIN_PATH } from '@/utils/constants';

export interface PortalRequestOptions {
  method?: string;
  json?: unknown;
  formData?: FormData;
  silent?: boolean;
}

export async function portalRequest<T = unknown>(
  path: string,
  options: PortalRequestOptions = {},
): Promise<T> {
  const { method = 'GET', json, formData, silent = false } = options;
  const token = getPortalToken();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';

  let body: BodyInit | undefined;
  if (json !== undefined) body = JSON.stringify(json);
  else if (formData !== undefined) body = formData;

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body, credentials: 'include' });

  let data: unknown;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : `HTTP ${res.status} ${res.statusText}`;

    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname !== PORTAL_LOGIN_PATH) {
        clearPortalAuth();
        if (!silent) {
          toast.error('登录已过期，请重新登录');
          setTimeout(() => { window.location.href = PORTAL_LOGIN_PATH; }, 800);
        } else {
          window.location.href = PORTAL_LOGIN_PATH;
        }
      }
    }

    if (!silent) toast.error(message);

    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}
