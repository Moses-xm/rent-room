export const PORTAL_CITY_KEY     = "portal-cur-city";
export const PORTAL_PROVINCE_KEY = "portal-cur-province";
export const PORTAL_CITY_CHANGED_EVENT = "portal-city-changed";
export const DEFAULT_PORTAL_CITY     = "杭州市";
export const DEFAULT_PORTAL_PROVINCE = "浙江省";

function normalize(val: string | null | undefined) {
  return val?.trim() ?? "";
}

export function getPortalCity() {
  if (typeof window === "undefined") return DEFAULT_PORTAL_CITY;
  return normalize(window.localStorage.getItem(PORTAL_CITY_KEY)) || DEFAULT_PORTAL_CITY;
}

export function getPortalProvince() {
  if (typeof window === "undefined") return DEFAULT_PORTAL_PROVINCE;
  return normalize(window.localStorage.getItem(PORTAL_PROVINCE_KEY)) || DEFAULT_PORTAL_PROVINCE;
}

export function setPortalCity(city: string, province?: string) {
  if (typeof window === "undefined") return;
  const nextCity = normalize(city) || DEFAULT_PORTAL_CITY;
  window.localStorage.setItem(PORTAL_CITY_KEY, nextCity);
  if (province !== undefined) {
    window.localStorage.setItem(PORTAL_PROVINCE_KEY, normalize(province) || DEFAULT_PORTAL_PROVINCE);
  }
  window.dispatchEvent(new Event(PORTAL_CITY_CHANGED_EVENT));
}
