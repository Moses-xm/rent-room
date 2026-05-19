"use client";

import { useEffect, useState } from "react";
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

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex py-2.5 border-b border-dashed border-border text-sm last:border-0">
      <span className="shrink-0 text-text-muted pt-0.5 mr-2">{label}：</span>
      <div className="flex flex-wrap gap-x-5 gap-y-2">{children}</div>
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

export function RoomFilterBar({
  type,
  value,
  onChange,
  className = "",
}: RoomFilterBarProps) {
  const [districts, setDistricts] = useState<string[]>(() =>
    getDistrictsForCity(getPortalCity())
  );

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
      <FilterRow label="更多">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
        </div>
      </FilterRow>
    </div>
  );
}
