import {
  MANAGE_TOKEN_KEY,
  MANAGE_PROFILE_KEY,
  MANAGE_LOGIN_PATH,
  MANAGE_HOME_PATH,
  MANAGE_PROFILE_PATH,
  MANAGE_TOKEN_EXPIRES_IN_SECONDS,
  MANAGE_AUTH_CHANGED_EVENT,
  MANAGE_PROFILE_CHANGED_EVENT,
} from '@/utils/constants';

export {
  MANAGE_TOKEN_KEY,
  MANAGE_PROFILE_KEY,
  MANAGE_LOGIN_PATH,
  MANAGE_HOME_PATH,
  MANAGE_PROFILE_PATH,
  MANAGE_TOKEN_EXPIRES_IN_SECONDS,
  MANAGE_AUTH_CHANGED_EVENT,
  MANAGE_PROFILE_CHANGED_EVENT,
};

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
