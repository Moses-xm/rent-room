import areaAllData from "@/localData/area.json";

type AreaNode = { label: string; value: string; children?: AreaNode[] };

const SPECIAL_REGION_KEYS = new Set([
  "市辖区", "县", "省直辖县级行政区划", "自治区直辖县级行政区划",
]);

/** 从 area.json 提取指定城市下所有区县名称 */
export function getDistrictsForCity(city: string): string[] {
  const data = areaAllData as AreaNode[];
  for (const province of data) {
    // 直辖市：省节点本身即城市
    if (province.value === city) {
      return (province.children ?? []).flatMap((node) =>
        SPECIAL_REGION_KEYS.has(node.value)
          ? (node.children ?? []).map((d) => d.value)
          : [node.value]
      );
    }
    // 普通省：在城市子节点中查找
    for (const cityNode of province.children ?? []) {
      if (SPECIAL_REGION_KEYS.has(cityNode.value)) continue;
      if (cityNode.value === city) {
        return (cityNode.children ?? []).map((d) => d.value);
      }
    }
  }
  return [];
}

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
