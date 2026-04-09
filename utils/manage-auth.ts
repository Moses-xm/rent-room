export const MANAGE_TOKEN_KEY = "manage-token";
export const MANAGE_LOGIN_PATH = "/manage/login";
export const MANAGE_HOME_PATH = "/manage";
export const MANAGE_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24;
export const MANAGE_AUTH_CHANGED_EVENT = "manage-auth-changed";

export function getManageToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(MANAGE_TOKEN_KEY);
}

export function setManageToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MANAGE_TOKEN_KEY, token);
  window.dispatchEvent(new Event(MANAGE_AUTH_CHANGED_EVENT));
}

export function clearManageToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MANAGE_TOKEN_KEY);
  window.dispatchEvent(new Event(MANAGE_AUTH_CHANGED_EVENT));
}
