"use client";

import { useEffect, useState } from "react";
import { useBodyScrollLock } from "@/utils/use-body-scroll-lock";
import {
  PORTAL_SUBWAY_LINES,
  PORTAL_PRICE_RANGES,
  PORTAL_ROOM_BED_OPTIONS,
  DIRECTION_OPTIONS,
  RENT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
} from "@/utils/constants";
import {
  getDistrictsForCity,
  getPortalCity,
  PORTAL_CITY_CHANGED_EVENT,
} from "@/utils/portal-city";

export interface RoomFilter {
  district?: string;
  subwayLine?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  roomType?: string;
  direction?: string;
  rentType?: number;
  nearSubway?: boolean;
  hasElevator?: boolean;
}

interface RoomFilterBarProps {
  type: "area" | "subway";
  value: RoomFilter;
  onChange: (v: RoomFilter) => void;
  className?: string;
}

// ── Desktop helpers ────────────────────────────────────────────────────────────

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex py-2.5 border-b border-dashed border-border text-sm last:border-0">
      <span className="shrink-0 text-text-muted pt-0.5 mr-3">{label}：</span>
      <div className="flex flex-wrap gap-x-6 gap-y-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className={`cursor-pointer hover:text-(--color-accent) whitespace-nowrap ${
        active ? "text-(--color-accent) font-bold" : ""
      }`}
    >
      {label}
    </span>
  );
}

// ── Mobile helpers ─────────────────────────────────────────────────────────────

function SheetOptionBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-8 border rounded text-sm cursor-pointer transition-colors ${
        active
          ? "border-(--color-accent) text-(--color-accent) bg-primary-tint"
          : "border-border text-text-2"
      }`}
    >
      {label}
    </button>
  );
}

// ── Price range match ──────────────────────────────────────────────────────────

function getPriceLabel(f: RoomFilter): string {
  const r = PORTAL_PRICE_RANGES.find(
    (p) => p.min === f.minPrice && p.max === f.maxPrice
  );
  return r ? r.label : "全部";
}

function hasMoreActive(f: RoomFilter): boolean {
  return !!(f.bedrooms || f.roomType || f.direction || f.rentType || f.nearSubway || f.hasElevator);
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RoomFilterBar({
  type,
  value,
  onChange,
  className = "",
}: RoomFilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<RoomFilter>(value);
  const [districts, setDistricts] = useState<string[]>(() =>
    getDistrictsForCity(getPortalCity())
  );

  useBodyScrollLock(sheetOpen);

  useEffect(() => {
    const sync = () => setDistricts(getDistrictsForCity(getPortalCity()));
    window.addEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const districtOptions = ["全部", ...districts];
  const locationOptions = type === "area" ? districtOptions : PORTAL_SUBWAY_LINES;
  const locationLabel = type === "area" ? "位置" : "线路";
  const locationKey = type === "area" ? "district" : "subwayLine";
  const currentLocation =
    locationKey === "district" ? value.district : value.subwayLine;

  function setLocation(opt: string) {
    const v = opt === "全部" ? undefined : opt;
    onChange(
      type === "area"
        ? { ...value, district: v }
        : { ...value, subwayLine: v }
    );
  }

  function setPrice(min?: number, max?: number) {
    onChange({ ...value, minPrice: min, maxPrice: max });
  }

  function openSheet() {
    setTempFilter(value);
    setSheetOpen(true);
  }

  function applySheet() {
    onChange(tempFilter);
    setSheetOpen(false);
  }

  function resetSheet() {
    setTempFilter({});
  }

  function setTempLocation(opt: string) {
    const v = opt === "全部" ? undefined : opt;
    setTempFilter((prev) =>
      type === "area"
        ? { ...prev, district: v }
        : { ...prev, subwayLine: v }
    );
  }

  const tempLocation =
    type === "area" ? tempFilter.district : tempFilter.subwayLine;

  return (
    <>
      {/* ── Desktop Filter Bar ──────────────────────────────────────────────── */}
      <div className={`hidden lg:block border border-border mt-5 px-2.5 ${className}`}>
        {/* Row 1: 区域 / 线路 */}
        <FilterRow label={locationLabel}>
          {locationOptions.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={
                opt === "全部" ? !currentLocation : currentLocation === opt
              }
              onClick={() => setLocation(opt)}
            />
          ))}
        </FilterRow>

        {/* Row 2: 租金 */}
        <FilterRow label="租金">
          {PORTAL_PRICE_RANGES.map((r) => (
            <FilterChip
              key={r.label}
              label={r.label}
              active={value.minPrice === r.min && value.maxPrice === r.max}
              onClick={() => setPrice(r.min, r.max)}
            />
          ))}
        </FilterRow>

        {/* Row 3: 房型 */}
        <FilterRow label="房型">
          {["全部", ...PORTAL_ROOM_BED_OPTIONS].map((o) => (
            <FilterChip
              key={o}
              label={o}
              active={o === "全部" ? !value.bedrooms : value.bedrooms === o}
              onClick={() => onChange({ ...value, bedrooms: o === "全部" ? undefined : o })}
            />
          ))}
        </FilterRow>

        {/* Row 4: 类型 */}
        <FilterRow label="类型">
          {[{ value: 0, label: "全部" }, ...RENT_TYPE_OPTIONS].map((o) => (
            <FilterChip
              key={o.value}
              label={o.label}
              active={o.value === 0 ? !value.rentType : value.rentType === o.value}
              onClick={() => onChange({ ...value, rentType: o.value === 0 ? undefined : o.value })}
            />
          ))}
        </FilterRow>

        {/* Row 5: 更多筛选 */}
        <FilterRow label="更多筛选">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <select
              value={value.roomType ?? ""}
              onChange={(e) =>
                onChange({ ...value, roomType: e.target.value || undefined })
              }
              className="border border-border px-2 py-0.5 text-sm text-text-2 outline-none cursor-pointer"
            >
              <option value="">房屋类型</option>
              {ROOM_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <select
              value={value.direction ?? ""}
              onChange={(e) =>
                onChange({ ...value, direction: e.target.value || undefined })
              }
              className="border border-border px-2 py-0.5 text-sm text-text-2 outline-none cursor-pointer"
            >
              <option value="">朝向</option>
              {DIRECTION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1 cursor-pointer text-sm text-text-2">
              <input
                type="checkbox"
                checked={!!value.nearSubway}
                onChange={(e) =>
                  onChange({
                    ...value,
                    nearSubway: e.target.checked ? true : undefined,
                  })
                }
              />
              近地铁
            </label>

            <label className="flex items-center gap-1 cursor-pointer text-sm text-text-2">
              <input
                type="checkbox"
                checked={!!value.hasElevator}
                onChange={(e) =>
                  onChange({
                    ...value,
                    hasElevator: e.target.checked ? true : undefined,
                  })
                }
              />
              电梯房
            </label>
          </div>
        </FilterRow>
      </div>

      {/* ── Mobile Filter Chips ─────────────────────────────────────────────── */}
      <div
        className={`flex lg:hidden items-center gap-2 overflow-x-auto py-2 ${className}`}
      >
        <button
          onClick={openSheet}
          className={`shrink-0 flex items-center gap-1 px-3 h-8 border rounded-full text-sm cursor-pointer whitespace-nowrap transition-colors ${
            currentLocation
              ? "border-(--color-accent) text-(--color-accent)"
              : "border-border text-text-2"
          }`}
        >
          {locationLabel}：{currentLocation ?? "全部"}
          <span className="text-xs">▼</span>
        </button>

        <button
          onClick={openSheet}
          className={`shrink-0 flex items-center gap-1 px-3 h-8 border rounded-full text-sm cursor-pointer whitespace-nowrap transition-colors ${
            value.minPrice !== undefined || value.maxPrice !== undefined
              ? "border-(--color-accent) text-(--color-accent)"
              : "border-border text-text-2"
          }`}
        >
          租金：{getPriceLabel(value)}
          <span className="text-xs">▼</span>
        </button>

        <button
          onClick={openSheet}
          className={`shrink-0 flex items-center gap-1 px-3 h-8 border rounded-full text-sm cursor-pointer whitespace-nowrap transition-colors ${
            hasMoreActive(value)
              ? "border-(--color-accent) text-(--color-accent)"
              : "border-border text-text-2"
          }`}
        >
          更多 <span className="text-xs">▼</span>
        </button>
      </div>

      {/* ── Mobile Bottom Sheet ─────────────────────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSheetOpen(false)}
          />

          {/* 抽屉 */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-xl overflow-hidden flex flex-col max-h-[80vh] lg:hidden">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
              <span className="text-base font-medium">筛选条件</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-text-muted text-xl cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            {/* 内容（可滚动） */}
            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-5">
              {/* 区域 / 线路 */}
              <div>
                <div className="text-sm text-text-muted py-2">{locationLabel}</div>
                <div className="flex flex-wrap gap-2">
                  {locationOptions.map((opt) => (
                    <SheetOptionBtn
                      key={opt}
                      label={opt}
                      active={
                        opt === "全部" ? !tempLocation : tempLocation === opt
                      }
                      onClick={() => setTempLocation(opt)}
                    />
                  ))}
                </div>
              </div>

              {/* 租金 */}
              <div>
                <div className="text-sm text-text-muted py-2">租金</div>
                <div className="flex flex-wrap gap-2">
                  {PORTAL_PRICE_RANGES.map((r) => (
                    <SheetOptionBtn
                      key={r.label}
                      label={r.label}
                      active={
                        tempFilter.minPrice === r.min &&
                        tempFilter.maxPrice === r.max
                      }
                      onClick={() =>
                        setTempFilter((prev) => ({
                          ...prev,
                          minPrice: r.min,
                          maxPrice: r.max,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {/* 房型 */}
              <div>
                <div className="text-sm text-text-muted py-2">房型</div>
                <div className="flex flex-wrap gap-2">
                  {["全部", ...PORTAL_ROOM_BED_OPTIONS].map((o) => (
                    <SheetOptionBtn
                      key={o}
                      label={o}
                      active={
                        o === "全部" ? !tempFilter.bedrooms : tempFilter.bedrooms === o
                      }
                      onClick={() =>
                        setTempFilter((prev) => ({
                          ...prev,
                          bedrooms: o === "全部" ? undefined : o,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {/* 类型 */}
              <div>
                <div className="text-sm text-text-muted py-2">类型</div>
                <div className="flex flex-wrap gap-2">
                  {[{ value: 0, label: "全部" }, ...RENT_TYPE_OPTIONS].map((o) => (
                    <SheetOptionBtn
                      key={o.value}
                      label={o.label}
                      active={
                        o.value === 0
                          ? !tempFilter.rentType
                          : tempFilter.rentType === o.value
                      }
                      onClick={() =>
                        setTempFilter((prev) => ({
                          ...prev,
                          rentType: o.value === 0 ? undefined : o.value,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {/* 其他 */}
              <div>
                <div className="text-sm text-text-muted py-2">其他</div>
                <div className="flex gap-3">
                  <SheetOptionBtn
                    label="近地铁"
                    active={!!tempFilter.nearSubway}
                    onClick={() =>
                      setTempFilter((prev) => ({
                        ...prev,
                        nearSubway: prev.nearSubway ? undefined : true,
                      }))
                    }
                  />
                  <SheetOptionBtn
                    label="有电梯"
                    active={!!tempFilter.hasElevator}
                    onClick={() =>
                      setTempFilter((prev) => ({
                        ...prev,
                        hasElevator: prev.hasElevator ? undefined : true,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="shrink-0 flex gap-3 px-4 py-3 bg-white border-t border-border">
              <button
                onClick={resetSheet}
                className="flex-1 h-10 border border-border text-text-2 rounded cursor-pointer"
              >
                重置
              </button>
              <button
                onClick={applySheet}
                className="flex-1 h-10 bg-primary text-white rounded cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
