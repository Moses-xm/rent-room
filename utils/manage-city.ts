import {
  MANAGE_CITY_KEY,
  MANAGE_PROVINCE_KEY,
  MANAGE_CITY_CHANGED_EVENT,
  DEFAULT_MANAGE_CITY,
  DEFAULT_MANAGE_PROVINCE,
} from '@/utils/constants';

export {
  MANAGE_CITY_KEY,
  MANAGE_PROVINCE_KEY,
  MANAGE_CITY_CHANGED_EVENT,
  DEFAULT_MANAGE_CITY,
  DEFAULT_MANAGE_PROVINCE,
};

function normalize(val: string | null | undefined) {
  return val?.trim() ?? "";
}

export function getManageCity() {
  if (typeof window === "undefined") return DEFAULT_MANAGE_CITY;
  return normalize(window.localStorage.getItem(MANAGE_CITY_KEY)) || DEFAULT_MANAGE_CITY;
}

export function getManageProvince() {
  if (typeof window === "undefined") return DEFAULT_MANAGE_PROVINCE;
  return normalize(window.localStorage.getItem(MANAGE_PROVINCE_KEY)) || DEFAULT_MANAGE_PROVINCE;
}

export function setManageCity(city: string, province?: string) {
  if (typeof window === "undefined") return;
  const nextCity = normalize(city) || DEFAULT_MANAGE_CITY;
  window.localStorage.setItem(MANAGE_CITY_KEY, nextCity);
  if (province !== undefined) {
    window.localStorage.setItem(MANAGE_PROVINCE_KEY, normalize(province) || DEFAULT_MANAGE_PROVINCE);
  }
  window.dispatchEvent(new Event(MANAGE_CITY_CHANGED_EVENT));
}
