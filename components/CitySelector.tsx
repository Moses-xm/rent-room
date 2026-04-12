"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import areaAllData from "@/localData/area.json";
import areaSimpleData from "@/localData/areaSimple.json";
import hotCitiesData from "@/localData/hotcities.json";
import {
  DEFAULT_MANAGE_CITY,
  MANAGE_CITY_CHANGED_EVENT,
  getManageCity,
  setManageCity,
} from "@/utils/manage-city";

type SimpleCity = {
  name: string;
};

type SimpleCityGroup = {
  name: string;
  children: SimpleCity[];
};

type HotCity = {
  name: string;
};

type AreaNode = {
  label: string;
  value: string;
  children?: AreaNode[];
};

type ProvinceCities = {
  province: string;
  cities: string[];
};

const SPECIAL_REGION_KEYS = new Set([
  "市辖区",
  "县",
  "省直辖县级行政区划",
  "自治区直辖县级行政区划",
]);

const MUNICIPALITIES = new Set(["北京市", "天津市", "上海市", "重庆市"]);

const AREA_SIMPLE = areaSimpleData as SimpleCityGroup[];
const HOT_CITIES = hotCitiesData as HotCity[];
const AREA_ALL = areaAllData as AreaNode[];

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

function buildProvinceCities(area: AreaNode[]): ProvinceCities[] {
  return area.map((provinceNode) => {
    const province = provinceNode.value;
    const rawCities = provinceNode.children ?? [];

    const cities = rawCities.flatMap((cityNode) => {
      const city = cityNode.value;

      if (SPECIAL_REGION_KEYS.has(city)) {
        if (MUNICIPALITIES.has(province)) {
          return [province];
        }

        const children = cityNode.children ?? [];
        if (children.length > 0) {
          return children.map((item) => item.value);
        }

        return [];
      }

      return [city];
    });

    return {
      province,
      cities: dedupe(cities),
    };
  });
}

const PROVINCE_CITIES = buildProvinceCities(AREA_ALL);

export function CitySelector() {
  const [currentCity, setCurrentCity] = useState(DEFAULT_MANAGE_CITY);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredProvinceCities = useMemo(() => {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      return PROVINCE_CITIES;
    }

    return PROVINCE_CITIES.map((item) => {
      if (item.province.includes(normalizedKeyword)) {
        return item;
      }

      return {
        province: item.province,
        cities: item.cities.filter((city) => city.includes(normalizedKeyword)),
      };
    }).filter((item) => item.province.includes(normalizedKeyword) || item.cities.length > 0);
  }, [keyword]);

  useEffect(() => {
    const syncCity = () => {
      setCurrentCity(getManageCity());
    };

    syncCity();
    window.addEventListener("storage", syncCity);
    window.addEventListener(MANAGE_CITY_CHANGED_EVENT, syncCity);

    return () => {
      window.removeEventListener("storage", syncCity);
      window.removeEventListener(MANAGE_CITY_CHANGED_EVENT, syncCity);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!popoverOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!containerRef.current?.contains(target)) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [popoverOpen]);

  const openMoreCities = () => {
    setPopoverOpen(false);
    setModalOpen(true);
  };

  const handleCityChange = (city: string) => {
    setManageCity(city);
    setCurrentCity(city);
    setPopoverOpen(false);
    setModalOpen(false);
    setKeyword("");
  };

  const cityModal = modalOpen ? (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onClick={() => setModalOpen(false)}
    >
      <div
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(2,6,23,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">更多城市</h3>
            <p className="mt-1 text-sm text-slate-500">选择城市后会即时更新并保存到本地</p>
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setModalOpen(false)}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="输入城市或省份快速搜索"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-start gap-2">
            <span className="pt-1 text-sm font-semibold text-slate-600">热门城市</span>
            <div className="flex flex-wrap gap-2">
              {HOT_CITIES.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleCityChange(item.name)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    item.name === currentCity
                      ? "bg-primary text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {filteredProvinceCities.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">没有找到匹配城市</p>
          ) : (
            filteredProvinceCities.map((group) => (
              <div key={group.province} className="grid grid-cols-[130px_1fr] gap-3 border-b border-slate-100 pb-4 last:border-none">
                <p className="pt-1 text-sm font-semibold text-slate-700">{group.province}</p>
                <div className="flex flex-wrap gap-2">
                  {group.cities.map((city) => (
                    <button
                      key={`${group.province}-${city}`}
                      type="button"
                      onClick={() => handleCityChange(city)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                        city === currentCity
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-label="当前城市"
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          onClick={() => setPopoverOpen((value) => !value)}
          className="group flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all duration-200 hover:border-primary/60 hover:text-slate-900"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="max-w-24 truncate font-medium">{currentCity}</span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              popoverOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`absolute right-0 top-full z-50 mt-3 w-105 origin-top-right transition-all duration-200 ${
            popoverOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-95 opacity-0"
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 pb-3 pt-7 shadow-[0_20px_48px_rgba(15,23,42,0.16)]">
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {AREA_SIMPLE.map((group) => (
                <div key={group.name} className="grid grid-cols-[84px_1fr] gap-2 border-b border-slate-100 pb-3 last:border-none last:pb-0">
                  <p className="pt-1 text-xs font-semibold text-slate-500">{group.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.children.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => handleCityChange(city.name)}
                        className={`rounded-lg px-2 py-1 text-xs transition ${
                          city.name === currentCity
                            ? "bg-primary/12 text-primary"
                            : "bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={openMoreCities}
                className="text-sm font-medium text-primary transition hover:text-primary-600"
              >
                更多城市 &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {cityModal && typeof document !== "undefined"
        ? createPortal(cityModal, document.body)
        : null}
    </>
  );
}
