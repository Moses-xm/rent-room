export const MANAGE_TOKEN_KEY = "manage-token";
export const MANAGE_PROFILE_KEY = "manage-profile";
export const MANAGE_LOGIN_PATH = "/manage/login";
export const MANAGE_HOME_PATH = "/manage";
export const MANAGE_PROFILE_PATH = "/manage/profile";
export const MANAGE_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7; // 7 天
export const MANAGE_AUTH_CHANGED_EVENT = "manage-auth-changed";
export const MANAGE_PROFILE_CHANGED_EVENT = "manage-profile-changed";

export type ManageProfile = {
  username: string;
  avatar?: string;
};

function normalizeStorageValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

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

export function getManageProfile(): ManageProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawProfile = window.localStorage.getItem(MANAGE_PROFILE_KEY);
  if (!rawProfile) {
    return null;
  }

  try {
    const parsedProfile = JSON.parse(rawProfile) as Partial<ManageProfile>;
    const username = normalizeStorageValue(parsedProfile?.username);
    const avatar = normalizeStorageValue(parsedProfile?.avatar);

    if (!username) {
      return null;
    }

    return avatar ? { username, avatar } : { username };
  } catch {
    return null;
  }
}

export function setManageProfile(profile: ManageProfile) {
  if (typeof window === "undefined") {
    return;
  }

  const username = normalizeStorageValue(profile.username);
  const avatar = normalizeStorageValue(profile.avatar);

  if (!username) {
    clearManageProfile();
    return;
  }

  const nextProfile: ManageProfile = avatar ? { username, avatar } : { username };

  window.localStorage.setItem(MANAGE_PROFILE_KEY, JSON.stringify(nextProfile));
  window.dispatchEvent(new Event(MANAGE_PROFILE_CHANGED_EVENT));
}

export function clearManageProfile() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MANAGE_PROFILE_KEY);
  window.dispatchEvent(new Event(MANAGE_PROFILE_CHANGED_EVENT));
}

export function clearManageToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MANAGE_TOKEN_KEY);
  clearManageProfile();
  window.dispatchEvent(new Event(MANAGE_AUTH_CHANGED_EVENT));
}
