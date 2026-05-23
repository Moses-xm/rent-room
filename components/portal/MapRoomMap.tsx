'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapApiLoaderHOC } from 'react-bmapgl';
import { BAIDU_MAP_AK, MAP_DISTRICT_ZOOM_THRESHOLD } from '@/utils/constants';

export interface DistrictItem {
  name: string;
  lat: number;
  lng: number;
  roomCount: number;
}

export interface CommunityItem {
  id: number;
  name: string;
  district: string;
  lat: number;
  lng: number;
  roomCount: number;
}

interface Props {
  city: string;
  zoom: number;
  centerKey?: number;
  districts: DistrictItem[];
  communities: CommunityItem[];
  selectedDistrict: string;
  selectedCmyId: number | null;
  onZoomChange: (zoom: number) => void;
  onDistrictClick: (name: string) => void;
  onCommunityClick: (id: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const B = () => (window as any).BMapGL;

// ── Overlay factories (module-level to avoid React Compiler `this` restriction) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDistrictCircle(BMapGL: any, point: any, size: number, isSelected: boolean, districtName: string, roomCount: number, onClick: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function DistrictCircle(this: any) {
    this._point = point;
    this._div = null;
    this._map = null;
  }
  DistrictCircle.prototype = Object.create(BMapGL.Overlay.prototype);
  DistrictCircle.prototype.constructor = DistrictCircle;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DistrictCircle.prototype.initialize = function (m: any) {
    this._map = m;
    const div = document.createElement('div');
    div.style.cssText = [
      'position:absolute',
      `width:${size}px`,
      `height:${size}px`,
      'border-radius:50%',
      `background:${isSelected ? 'rgba(74,129,1,0.92)' : 'rgba(98,171,0,0.85)'}`,
      'color:#fff',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'cursor:pointer',
      'text-align:center',
      'box-shadow:0 2px 10px rgba(0,0,0,0.28)',
      'transform:translate(-50%,-50%)',
      'user-select:none',
      'transition:background 0.15s',
    ].join(';');
    div.innerHTML = `<div style="font-size:13px;font-weight:bold;line-height:1.3;">${districtName}</div><div style="font-size:11px;opacity:0.9;">${roomCount}套</div>`;
    div.addEventListener('click', onClick);
    div.addEventListener('mouseenter', () => { div.style.background = 'rgba(74,129,1,0.92)'; });
    div.addEventListener('mouseleave', () => { div.style.background = isSelected ? 'rgba(74,129,1,0.92)' : 'rgba(98,171,0,0.85)'; });
    m.getPanes().markerPane.appendChild(div);
    this._div = div;
    return div;
  };
  DistrictCircle.prototype.draw = function () {
    if (!this._div || !this._map) return;
    const pixel = this._map.pointToOverlayPixel(this._point);
    this._div.style.left = pixel.x + 'px';
    this._div.style.top = pixel.y + 'px';
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (DistrictCircle as any)();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCommunityMarker(BMapGL: any, point: any, isSelected: boolean, cmyName: string, onClick: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CommunityMarker(this: any) {
    this._point = point;
    this._div = null;
    this._map = null;
  }
  CommunityMarker.prototype = Object.create(BMapGL.Overlay.prototype);
  CommunityMarker.prototype.constructor = CommunityMarker;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CommunityMarker.prototype.initialize = function (m: any) {
    this._map = m;
    const div = document.createElement('div');
    div.style.cssText = [
      'position:absolute',
      `background:${isSelected ? '#4a8101' : '#62ab00'}`,
      'color:#fff',
      'padding:4px 10px',
      'border-radius:4px',
      'font-size:12px',
      'font-weight:500',
      'cursor:pointer',
      'white-space:nowrap',
      'box-shadow:0 1px 6px rgba(0,0,0,0.25)',
      'transform:translate(-50%,-50%)',
      'user-select:none',
      'transition:background 0.15s',
    ].join(';');
    div.textContent = cmyName;
    div.addEventListener('click', onClick);
    div.addEventListener('mouseenter', () => { div.style.background = '#4a8101'; });
    div.addEventListener('mouseleave', () => { div.style.background = isSelected ? '#4a8101' : '#62ab00'; });
    m.getPanes().markerPane.appendChild(div);
    this._div = div;
    return div;
  };
  CommunityMarker.prototype.draw = function () {
    if (!this._div || !this._map) return;
    const pixel = this._map.pointToOverlayPixel(this._point);
    this._div.style.left = pixel.x + 'px';
    this._div.style.top = pixel.y + 'px';
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (CommunityMarker as any)();
}

function MapRoomMapInner({
  city,
  zoom,
  centerKey,
  districts,
  communities,
  selectedDistrict,
  selectedCmyId,
  onZoomChange,
  onDistrictClick,
  onCommunityClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const onZoomChangeRef = useRef(onZoomChange);
  const onDistrictClickRef = useRef(onDistrictClick);
  const onCommunityClickRef = useRef(onCommunityClick);
  const pendingProgrammaticZoomRef = useRef<number | null>(null);
  const [geocodedDistricts, setGeocodedDistricts] = useState<DistrictItem[]>([]);

  useEffect(() => { onZoomChangeRef.current = onZoomChange; });
  useEffect(() => { onDistrictClickRef.current = onDistrictClick; });
  useEffect(() => { onCommunityClickRef.current = onCommunityClick; });

  const markProgrammaticZoom = useCallback((targetZoom: number) => {
    pendingProgrammaticZoomRef.current = targetZoom;
    window.setTimeout(() => {
      if (pendingProgrammaticZoomRef.current === targetZoom) {
        pendingProgrammaticZoomRef.current = null;
      }
    }, 900);
  }, []);

  // ── 1. Init map (once) ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const BMapGL = B();
    const map = new BMapGL.Map(containerRef.current);
    mapRef.current = map;
    map.enableScrollWheelZoom();
    map.addControl(new BMapGL.ZoomControl());
    // User-initiated zoom → notify parent; parent state is the single source of truth
    map.addEventListener('zoomend', () => {
      const currentZoom = Math.round(map.getZoom());
      const pendingZoom = pendingProgrammaticZoomRef.current;

      if (pendingZoom !== null) {
        if (currentZoom === pendingZoom) {
          pendingProgrammaticZoomRef.current = null;
          onZoomChangeRef.current(currentZoom);
        }
        return;
      }

      onZoomChangeRef.current(currentZoom);
    });
    return () => { mapRef.current = null; };
  }, []);

  // ── 2. Recenter on city when city prop changes (or centerKey increments) ─────
  useEffect(() => {
    if (!mapRef.current || !city) return;
    const BMapGL = B();
    new BMapGL.Geocoder().getPoint(
      city,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (point: any) => {
        if (point && mapRef.current) {
          markProgrammaticZoom(12);
          mapRef.current.centerAndZoom(new BMapGL.Point(point.lng, point.lat), 12);
        }
      },
      '',
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, centerKey]);

  // ── 3. Geocode accurate district center points ────────────────────────────────
  useEffect(() => {
    const BMapGL = B();
    Promise.all(
      districts.map(
        (d) =>
          new Promise<DistrictItem>((resolve) => {
            new BMapGL.Geocoder().getPoint(
              `${city}${d.name}`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (point: any) => {
                resolve({ ...d, lat: point ? point.lat : d.lat, lng: point ? point.lng : d.lng });
              },
              city,
            );
          }),
      ),
    ).then(setGeocodedDistricts);
  }, [districts, city]);

  // ── 4. Sync zoom: parent state → map ─────────────────────────────────────────
  // Parent state is the single source of truth for zoom.
  // This effect is the only place we call map.setZoom().
  useEffect(() => {
    if (!mapRef.current) return;
    if (Math.round(mapRef.current.getZoom()) !== zoom) {
      markProgrammaticZoom(zoom);
      mapRef.current.setZoom(zoom);
    }
  }, [zoom, markProgrammaticZoom]);

  // ── 5. Center + zoom to selected district ────────────────────────────────────
  // Uses centerAndZoom to atomically set both center and zoom, avoiding a race
  // condition where panTo() cancels an in-progress setZoom() animation in BMapGL.
  // zoom is intentionally omitted from deps: we only want to re-run on district
  // change, not on every manual scroll. The closure captures the correct zoom
  // value because setZoom + setSelectedDistrict always batch in the same render.
  useEffect(() => {
    if (!mapRef.current || !selectedDistrict || geocodedDistricts.length === 0) return;
    const d = geocodedDistricts.find((gd) => gd.name === selectedDistrict);
    if (!d) return;
    const BMapGL = B();
    markProgrammaticZoom(zoom);
    mapRef.current.centerAndZoom(new BMapGL.Point(d.lng, d.lat), zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, geocodedDistricts]);

  // ── 6. Redraw overlays ────────────────────────────────────────────────────────
  // Zoom threshold decides district circles vs community markers.
  // Click handlers only call parent callbacks — no direct map manipulation here.
  useEffect(() => {
    if (!mapRef.current) return;
    const BMapGL = B();
    const map = mapRef.current;

    for (const o of overlaysRef.current) map.removeOverlay(o);
    overlaysRef.current = [];

    if (zoom < MAP_DISTRICT_ZOOM_THRESHOLD) {
      // ── District circles ────────────────────────────────────────────────────
      for (const d of geocodedDistricts) {
        if (!d.lat && !d.lng) continue;
        const point = new BMapGL.Point(d.lng, d.lat);
        const isSelected = selectedDistrict === d.name;
        const size = Math.min(Math.max(52, d.roomCount * 4 + 44), 90);
        const name = d.name;
        const overlay = createDistrictCircle(
          BMapGL, point, size, isSelected, name, d.roomCount,
          () => onDistrictClickRef.current(name),
        );
        map.addOverlay(overlay);
        overlaysRef.current.push(overlay);
      }
    } else {
      // ── Community markers ───────────────────────────────────────────────────
      for (const c of communities) {
        if (!c.lat && !c.lng) continue;
        const point = new BMapGL.Point(c.lng, c.lat);
        const isSelected = selectedCmyId === c.id;
        const id = c.id;
        const overlay = createCommunityMarker(
          BMapGL, point, isSelected, c.name,
          () => onCommunityClickRef.current(id),
        );
        map.addOverlay(overlay);
        overlaysRef.current.push(overlay);
      }
    }
  }, [geocodedDistricts, communities, zoom, selectedDistrict, selectedCmyId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export default (
  MapApiLoaderHOC({ ak: BAIDU_MAP_AK })(
    MapRoomMapInner as unknown as React.ComponentType,
  ) as unknown
) as React.ComponentType<Props>;
