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

type SimpleCity      = { name: string };
type SimpleCityGroup = { name: string; children: SimpleCity[] };
type HotCity         = { name: string };
type AreaNode        = { label: string; value: string; children?: AreaNode[] };
type ProvinceCities  = { province: string; cities: string[] };

const SPECIAL_REGION_KEYS = new Set([
  "市辖区", "县", "省直辖县级行政区划", "自治区直辖县级行政区划",
]);
const MUNICIPALITIES = new Set(["北京市", "天津市", "上海市", "重庆市"]);

const AREA_SIMPLE = areaSimpleData as SimpleCityGroup[];
const HOT_CITIES  = hotCitiesData  as HotCity[];
const AREA_ALL    = areaAllData    as AreaNode[];

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

function buildProvinceCities(area: AreaNode[]): ProvinceCities[] {
  return area.map((provinceNode) => {
    const province = provinceNode.value;
    const cities = (provinceNode.children ?? []).flatMap((cityNode) => {
      const city = cityNode.value;
      if (SPECIAL_REGION_KEYS.has(city)) {
        if (MUNICIPALITIES.has(province)) return [province];
        const ch = cityNode.children ?? [];
        return ch.length > 0 ? ch.map((c) => c.value) : [];
      }
      return [city];
    });
    return { province, cities: dedupe(cities) };
  });
}

const PROVINCE_CITIES = buildProvinceCities(AREA_ALL);

export function CitySelector() {
  const [currentCity, setCurrentCity] = useState(DEFAULT_MANAGE_CITY);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [keyword, setKeyword]         = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredProvinceCities = useMemo(() => {
    const q = keyword.trim();
    if (!q) return PROVINCE_CITIES;
    return PROVINCE_CITIES.map((item) => ({
      province: item.province,
      cities: item.province.includes(q)
        ? item.cities
        : item.cities.filter((c) => c.includes(q)),
    })).filter((item) => item.province.includes(q) || item.cities.length > 0);
  }, [keyword]);

  useEffect(() => {
    const sync = () => setCurrentCity(getManageCity());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(MANAGE_CITY_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MANAGE_CITY_CHANGED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false); };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onEsc);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!popoverOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (e.target instanceof Node && !containerRef.current?.contains(e.target))
        setPopoverOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [popoverOpen]);

  const handleCityChange = (city: string) => {
    setManageCity(city);
    setCurrentCity(city);
    setPopoverOpen(false);
    setModalOpen(false);
    setKeyword("");
  };

  // ── 全城市 Modal ──────────────────────────────────────────
  const cityModal = modalOpen ? (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      style={{ background: "rgba(26,24,20,.45)", backdropFilter: "blur(3px)" }}
      onClick={() => setModalOpen(false)}
    >
      <div
        className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden
                   bg-card border border-border rounded-lg shadow-(--shadow-lg)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 shrink-0">
          <div>
            <h3 className="text-[17px] font-semibold text-text">更多城市</h3>
            <p className="mt-1 text-[12.5px] text-text-muted">选择城市后即时更新并保存到本地</p>
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setModalOpen(false)}
            className="w-8 h-8 grid place-items-center rounded-sm text-text-muted
                       hover:bg-surface-2 hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 搜索 + 热门 */}
        <div className="border-b border-border-subtle bg-surface px-6 py-4 space-y-3 shrink-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2
                               h-[15px] w-[15px] text-text-subtle" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入城市或省份快速搜索"
              className="w-full h-9 pl-9 pr-3 text-[13px] outline-none bg-card
                         border border-border rounded-sm text-text
                         placeholder:text-text-subtle transition-[border-color,box-shadow]
                         focus:border-primary
                         focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
            />
          </div>
          <div className="flex items-start gap-2">
            <span className="pt-1 text-[12.5px] font-medium text-text-muted whitespace-nowrap">热门城市</span>
            <div className="flex flex-wrap gap-2">
              {HOT_CITIES.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleCityChange(item.name)}
                  className={`px-3 py-1 rounded-sm text-[12.5px] font-medium border transition-colors
                    ${item.name === currentCity
                      ? "bg-primary-tint text-primary border-transparent font-semibold"
                      : "bg-card text-text-2 border-border hover:border-text-disabled hover:text-text"
                    }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 省市列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-1">
          {filteredProvinceCities.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-text-muted">没有找到匹配城市</p>
          ) : (
            filteredProvinceCities.map((group) => (
              <div
                key={group.province}
                className="grid gap-3 py-3 border-b border-border-subtle last:border-none"
                style={{ gridTemplateColumns: "130px 1fr" }}
              >
                <p className="pt-1 text-[13px] font-medium text-text-muted">{group.province}</p>
                <div className="flex flex-wrap gap-2">
                  {group.cities.map((city) => (
                    <button
                      key={`${group.province}-${city}`}
                      type="button"
                      onClick={() => handleCityChange(city)}
                      className={`px-2.5 py-1 rounded-sm text-[12.5px] font-medium transition-colors
                        ${city === currentCity
                          ? "bg-primary-tint text-primary"
                          : "bg-surface-2 text-text-2 hover:text-text hover:bg-surface"
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

  // ── 快速 Popover ──────────────────────────────────────────
  return (
    <>
      <div ref={containerRef} className="relative">
        {/* 触发按钮：.topbar-user 风格 */}
        <button
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1 rounded-sm text-[12.5px]
                     hover:bg-surface-2 transition-colors"
        >
          <MapPin className="w-[14px] h-[14px] text-primary shrink-0" />
          <span className="font-medium text-text max-w-24 truncate">{currentCity}</span>
          <ChevronDown
            className="w-[14px] h-[14px] text-text-muted opacity-55 transition-transform duration-200"
            style={{ transform: popoverOpen ? "rotate(180deg)" : "none" }}
          />
        </button>

        {/* 快速城市 Popover：560px 宽，分区 grid */}
        {popoverOpen && (
          <div
            className="absolute right-0 z-50 popover-animate bg-card border border-border rounded-lg"
            style={{
              top: "calc(100% + 8px)",
              width: 360,
              boxShadow: "0 16px 48px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.04)",
            }}
          >
            {/* 城市列表：可滚动，label 与城市区缩短间距 */}
            <div
              className="overflow-y-auto px-4 pt-3.5"
              style={{ maxHeight: 280 }}
            >
              {AREA_SIMPLE.map((group, i) => (
                <div
                  key={group.name}
                  className="py-2.5"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "68px 1fr",
                    gap: 8,
                    borderBottom: i < AREA_SIMPLE.length - 1
                      ? "1px solid var(--color-border-subtle)"
                      : "none",
                  }}
                >
                  <p className="pt-0.5 text-[11.5px] font-medium text-text-muted leading-tight">
                    {group.name}
                  </p>
                  {/* gap-1 使城市排列紧凑，自然约 4 个/行 */}
                  <div className="flex flex-wrap gap-1">
                    {group.children.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => handleCityChange(city.name)}
                        className={`px-2 py-0.5 rounded-sm text-[11.5px] font-medium
                          transition-colors
                          ${city.name === currentCity
                            ? "bg-primary-tint text-primary font-semibold"
                            : "bg-surface text-text-2 hover:bg-surface-2 hover:text-text"
                          }`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 更多城市链接 */}
            <div className="px-5 pt-2.5 pb-3 border-t border-border-subtle mt-1">
              <button
                type="button"
                onClick={() => { setPopoverOpen(false); setModalOpen(true); }}
                className="flex items-center gap-1 text-[12.5px] font-medium
                           text-primary hover:text-primary-dark transition-colors"
              >
                更多城市
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      {cityModal && typeof document !== "undefined"
        ? createPortal(cityModal, document.body)
        : null}
    </>
  );
}
