export const PORTAL_TOKEN_KEY = 'portal-token';
export const PORTAL_PROFILE_KEY = 'portal-profile';
export const PORTAL_LOGIN_PATH = '/portal/login';
export const PORTAL_HOME_PATH = '/portal';
export const PORTAL_ORDERS_PATH = '/portal/account/orders';
export const PORTAL_AUTH_CHANGED_EVENT = 'portal-auth-changed';

export type PortalProfile = {
  username: string;
  nickname?: string;
  avatar?: string;
  identity?: number;
};

function normalizeStorageValue(value: string | null | undefined) {
  return value?.trim() ?? '';
}

export function getPortalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function setPortalToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PORTAL_TOKEN_KEY, token);
  window.dispatchEvent(new Event(PORTAL_AUTH_CHANGED_EVENT));
}

export function getPortalProfile(): PortalProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PORTAL_PROFILE_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<PortalProfile>;
    const username = normalizeStorageValue(p?.username);
    if (!username) return null;
    return { username, nickname: p.nickname || undefined, avatar: p.avatar || undefined, identity: p.identity };
  } catch {
    return null;
  }
}

export function setPortalProfile(profile: PortalProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PORTAL_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(PORTAL_AUTH_CHANGED_EVENT));
}

export function clearPortalAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PORTAL_TOKEN_KEY);
  window.localStorage.removeItem(PORTAL_PROFILE_KEY);
  window.dispatchEvent(new Event(PORTAL_AUTH_CHANGED_EVENT));
}
