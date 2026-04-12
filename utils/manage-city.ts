export const MANAGE_CITY_KEY = "cur-city";
export const MANAGE_CITY_CHANGED_EVENT = "manage-city-changed";
export const DEFAULT_MANAGE_CITY = "杭州市";

function normalizeCity(city: string | null | undefined) {
  return city?.trim() ?? "";
}

export function getManageCity() {
  if (typeof window === "undefined") {
    return DEFAULT_MANAGE_CITY;
  }

  const city = normalizeCity(window.localStorage.getItem(MANAGE_CITY_KEY));
  return city || DEFAULT_MANAGE_CITY;
}

export function setManageCity(city: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedCity = normalizeCity(city);
  const nextCity = normalizedCity || DEFAULT_MANAGE_CITY;

  window.localStorage.setItem(MANAGE_CITY_KEY, nextCity);
  window.dispatchEvent(new Event(MANAGE_CITY_CHANGED_EVENT));
}
