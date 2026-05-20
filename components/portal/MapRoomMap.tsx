'use client';

import { useEffect, useRef } from 'react';
import { MapApiLoaderHOC } from 'react-bmapgl';
import { BAIDU_MAP_AK } from '@/utils/constants';

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

function MapRoomMapInner({
  city,
  zoom,
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
  const programmaticZoomRef = useRef(false);
  const onZoomChangeRef = useRef(onZoomChange);
  const onDistrictClickRef = useRef(onDistrictClick);
  const onCommunityClickRef = useRef(onCommunityClick);

  useEffect(() => { onZoomChangeRef.current = onZoomChange; });
  useEffect(() => { onDistrictClickRef.current = onDistrictClick; });
  useEffect(() => { onCommunityClickRef.current = onCommunityClick; });

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;
    const BMapGL = B();
    const map = new BMapGL.Map(containerRef.current);
    mapRef.current = map;
    map.enableScrollWheelZoom();
    map.addControl(new BMapGL.ZoomControl());

    // Center on city via geocoder
    new BMapGL.Geocoder().getPoint(
      city,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (point: any) => {
        if (point && mapRef.current) {
          mapRef.current.centerAndZoom(new BMapGL.Point(point.lng, point.lat), 12);
        }
      },
      '',
    );

    map.addEventListener('zoomend', () => {
      if (programmaticZoomRef.current) {
        programmaticZoomRef.current = false;
        return;
      }
      onZoomChangeRef.current(Math.round(map.getZoom()));
    });

    return () => {
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when city changes
  useEffect(() => {
    if (!mapRef.current) return;
    const BMapGL = B();
    new BMapGL.Geocoder().getPoint(
      city,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (point: any) => {
        if (point && mapRef.current) {
          programmaticZoomRef.current = true;
          mapRef.current.centerAndZoom(new BMapGL.Point(point.lng, point.lat), 12);
        }
      },
      '',
    );
  }, [city]);

  // Sync zoom from parent → map
  useEffect(() => {
    if (!mapRef.current) return;
    const currentZoom = Math.round(mapRef.current.getZoom());
    if (currentZoom !== zoom) {
      programmaticZoomRef.current = true;
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Redraw overlays when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    const BMapGL = B();
    const map = mapRef.current;

    // Clear previous overlays
    for (const o of overlaysRef.current) map.removeOverlay(o);
    overlaysRef.current = [];

    // ── District circles ──────────────────────────────────────────
    for (const d of districts) {
      if (!d.lat && !d.lng) continue;
      const point = new BMapGL.Point(d.lng, d.lat);
      const isSelected = selectedDistrict === d.name;
      const size = Math.min(Math.max(52, d.roomCount * 4 + 44), 90);
      const districtName = d.name;
      const roomCount = d.roomCount;

      // Build overlay using prototype chain (compatible with BMapGL Overlay system)
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
        div.addEventListener('click', () => onDistrictClickRef.current(districtName));
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
      const overlay = new (DistrictCircle as any)();
      map.addOverlay(overlay);
      overlaysRef.current.push(overlay);
    }

    // ── Community markers ─────────────────────────────────────────
    for (const c of communities) {
      if (!c.lat && !c.lng) continue;
      const point = new BMapGL.Point(c.lng, c.lat);
      const isSelected = selectedCmyId === c.id;
      const cmyName = c.name;
      const cmyId = c.id;

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
        div.addEventListener('click', () => onCommunityClickRef.current(cmyId));
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
      const overlay = new (CommunityMarker as any)();
      map.addOverlay(overlay);
      overlaysRef.current.push(overlay);
    }
  }, [districts, communities, selectedDistrict, selectedCmyId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export default (
  MapApiLoaderHOC({ ak: BAIDU_MAP_AK })(
    MapRoomMapInner as unknown as React.ComponentType,
  ) as unknown
) as React.ComponentType<Props>;
