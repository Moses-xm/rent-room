"use client";

import { useEffect, useState } from "react";
import {
  PORTAL_PRICE_RANGES,
  PORTAL_ROOM_BED_OPTIONS,
  DIRECTION_OPTIONS,
  RENT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
} from "@/utils/constants";
import FilterSelect from "@/components/FilterSelect";
import {
  getDistrictsForCity,
  getSubwayLinesForCity,
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
  locationOnly?: boolean;
  hideLocation?: boolean;
  className?: string;
}

function FilterRow({
  label,
  children,
  centerLabel = false,
}: {
  label: string;
  children: React.ReactNode;
  centerLabel?: boolean;
}) {
  return (
    <div className="flex items-baseline py-2.5 border-b border-dashed border-border text-sm last:border-0">
      <span className={`shrink-0 text-text-muted mr-2 ${centerLabel ? "self-center" : ""}`}>{label}：</span>
      <div className="flex flex-wrap gap-x-5 gap-y-2 flex-1">{children}</div>
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

function hasActiveFilter(v: RoomFilter): boolean {
  return !!(
    v.district || v.subwayLine ||
    v.minPrice !== undefined || v.maxPrice !== undefined ||
    v.bedrooms || v.roomType || v.direction ||
    v.rentType !== undefined ||
    v.nearSubway || v.hasElevator
  );
}

export function RoomFilterBar({
  type,
  value,
  onChange,
  locationOnly = false,
  hideLocation = false,
  className = "",
}: RoomFilterBarProps) {
  const [districts, setDistricts] = useState<string[]>(() =>
    getDistrictsForCity(getPortalCity())
  );
  const [subwayLines, setSubwayLines] = useState<string[]>(() =>
    getSubwayLinesForCity(getPortalCity())
  );

  useEffect(() => {
    const sync = () => {
      const city = getPortalCity();
      setDistricts(getDistrictsForCity(city));
      setSubwayLines(getSubwayLinesForCity(city));
    };
    window.addEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const districtOptions = ["全部", ...districts];
  const locationOptions = type === "area" ? districtOptions : ["全部", ...subwayLines];
  const locationLabel = type === "area" ? "位置" : "线路";
  const locationKey = type === "area" ? "district" : "subwayLine";
  const currentLocation = locationKey === "district" ? value.district : value.subwayLine;

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

  return (
    <div className={`border border-border mt-5 px-2.5 ${className}`}>
      {/* 区域 / 线路 */}
      {!hideLocation && (
        <FilterRow label={locationLabel}>
          {locationOptions.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={opt === "全部" ? !currentLocation : currentLocation === opt}
              onClick={() => setLocation(opt)}
            />
          ))}
        </FilterRow>
      )}

      {!locationOnly && (
        <>
          {/* 租金 */}
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

          {/* 房型 */}
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

          {/* 类型 */}
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

          {/* 更多筛选 */}
          <FilterRow label="更多" centerLabel>
            <div className="flex flex-col gap-y-4 w-full sm:flex-row sm:items-center sm:gap-x-5 sm:gap-y-0">
              <div className="flex gap-2">
                <FilterSelect
                  value={value.roomType ?? ""}
                  onChange={(v) => onChange({ ...value, roomType: v || undefined })}
                  options={ROOM_TYPE_OPTIONS.map((o) => ({ value: o, label: o }))}
                  placeholder="房屋类型"
                  className="flex-1 min-w-0 sm:flex-none sm:min-w-28"
                />
                <FilterSelect
                  value={value.direction ?? ""}
                  onChange={(v) => onChange({ ...value, direction: v || undefined })}
                  options={DIRECTION_OPTIONS.map((o) => ({ value: o, label: o }))}
                  placeholder="朝向"
                  className="flex-1 min-w-0 sm:flex-none sm:min-w-24"
                />
              </div>
              <div className="flex items-center gap-3 sm:flex-1">
                <label className="flex items-center gap-1 cursor-pointer text-sm text-text-2">
                  <input
                    type="checkbox"
                    checked={!!value.nearSubway}
                    onChange={(e) =>
                      onChange({ ...value, nearSubway: e.target.checked ? true : undefined })
                    }
                  />
                  近地铁
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-sm text-text-2">
                  <input
                    type="checkbox"
                    checked={!!value.hasElevator}
                    onChange={(e) =>
                      onChange({ ...value, hasElevator: e.target.checked ? true : undefined })
                    }
                  />
                  电梯房
                </label>
                {hasActiveFilter(value) && (
                  <button
                    onClick={() => onChange({})}
                    className="cursor-pointer ml-auto text-xs text-text-muted hover:text-(--color-accent) border border-border px-2.5 py-0.5 rounded whitespace-nowrap"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>
          </FilterRow>
        </>
      )}
    </div>
  );
}
