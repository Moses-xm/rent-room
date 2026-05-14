'use client';

import { useEffect, useRef, useState } from 'react';
import { Map as BMapGLMap, Marker as BMapGLMarker, MapApiLoaderHOC } from 'react-bmapgl';
import { MapPin } from 'lucide-react';

export interface MapPickResult {
  lng: number;
  lat: number;
  province: string;
  city: string;
  district: string;
  street: string;
  streetNumber: string;
}

interface Props {
  position?: { lng: number; lat: number };
  addressQuery?: string;
  centerCity?: string;
  onPick: (result: MapPickResult) => void;
  onPositionChange?: (lng: number, lat: number) => void;
  height?: string;
}

const AK = process.env.NEXT_PUBLIC_BAIDU_MAP_AK ?? 'YOUR_BAIDU_MAP_AK';

// BMapGL is injected as a global after MapApiLoaderHOC loads the script
const B = () => (window as Window & { BMapGL: typeof BMapGL }).BMapGL;

// Marker's map/rotation/icon are required by types but covered by defaultProps when rendered inside Map
const SafeMarker = BMapGLMarker as unknown as React.ComponentType<{ position: BMapGL.Point }>;

function BaiduMapPickerInner({
  position,
  addressQuery,
  centerCity,
  onPick,
  onPositionChange,
  height = '100%',
}: Props) {
  const mapRef = useRef<InstanceType<typeof BMapGLMap> | null>(null);

  // cityCenter is the geocoded result for the selected city (create mode).
  // It is set only inside async geocoder callbacks — never synchronously in an effect body —
  // so it does not trigger the react-hooks/set-state-in-effect lint rule.
  const [cityCenter, setCityCenter] = useState<{ lng: number; lat: number } | undefined>();

  const prevQueryRef = useRef('');
  const onPickRef = useRef(onPick);
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => { onPickRef.current = onPick; });
  useEffect(() => { onPositionChangeRef.current = onPositionChange; });

  // ── Derived view ──────────────────────────────────────────────────────────
  // All center/zoom logic is derived so that unrelated re-renders (e.g. typing
  // in a form field) never silently reset the map view.
  //   • position set  → street level zoom 15, centered on the picked point
  //   • only cityCenter → city overview zoom 11
  //   • neither         → default Beijing zoom 10
  const mapCenter = position ?? cityCenter ?? { lng: 116.404, lat: 39.915 };
  const mapZoom   = position ? 15 : cityCenter ? 11 : 10;

  // Marker appears only when there is a concrete position (form has lat/lng).
  // Clearing lng/lat in the form makes position undefined and removes the marker.
  const markerPoint = position
    ? new (B()).Point(position.lng, position.lat)
    : null;

  // ── Geocode city (create mode) ────────────────────────────────────────────
  // setState is called inside the async callback, NOT in the effect body itself.
  useEffect(() => {
    const city = centerCity?.trim();
    if (!city || position) return;
    new (B()).Geocoder().getPoint(city, (point) => {
      const p = point as BMapGL.Point | null;
      if (!p) return;
      setCityCenter({ lng: p.lng, lat: p.lat });
      // Backup imperative call in case react-bmapgl defers prop-driven updates
      mapRef.current?.map?.centerAndZoom(new (B()).Point(p.lng, p.lat), 11);
    }, '');
  }, [centerCity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync map view when position prop changes ──────────────────────────────
  // Only updates the external map instance; no setState here.
  // When position becomes undefined (form reset / lat+lng cleared), restore city view.
  useEffect(() => {
    const map = mapRef.current?.map;
    if (!map) return;
    if (position) {
      map.centerAndZoom(new (B()).Point(position.lng, position.lat), 15);
    } else if (cityCenter) {
      map.centerAndZoom(new (B()).Point(cityCenter.lng, cityCenter.lat), 11);
    }
  }, [position?.lng, position?.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Forward geocoding: address → coordinates ──────────────────────────────
  useEffect(() => {
    const query = addressQuery?.trim() ?? '';
    if (!query || query === prevQueryRef.current) return;
    prevQueryRef.current = query;
    new (B()).Geocoder().getPoint(query, (point) => {
      const p = point as BMapGL.Point | null;
      if (!p) return;
      mapRef.current?.map?.centerAndZoom(new (B()).Point(p.lng, p.lat), 15);
      // Only pan the map — do NOT call onPositionChange here.
      // Coordinates are filled exclusively when the user explicitly clicks the map.
    }, '');
  }, [addressQuery]);

  // ── Reverse geocoding on map click ────────────────────────────────────────
  const handleClick = (e: Event) => {
    const { latlng } = e as Event & { latlng: BMapGL.Point };
    if (!latlng) return;
    const { lng, lat } = latlng;
    new (B()).Geocoder().getLocation(new (B()).Point(lng, lat), (result) => {
      if (!result) return;
      const ac = result.addressComponents;
      mapRef.current?.map?.centerAndZoom(new (B()).Point(lng, lat), 15);
      onPickRef.current({
        lng, lat,
        province: ac.province,
        city: ac.city,
        district: ac.district,
        street: ac.street,
        streetNumber: ac.streetNumber,
      });
    });
  };

  const centerPoint = new (B()).Point(mapCenter.lng, mapCenter.lat);

  console.log('mapZoom',mapZoom);
  console.log('mapCenter',mapCenter);

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-border" style={{ height }}>
      <div className="absolute top-2 left-2 z-10 bg-card border border-border rounded-sm px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
        <MapPin size={12} className="text-primary" />
        <span className="text-tiny text-text-2">点击地图可自动解析地址</span>
      </div>

      <BMapGLMap
        ref={mapRef}
        center={centerPoint}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
        enableScrollWheelZoom
        onClick={handleClick}
      >
        {markerPoint && <SafeMarker position={markerPoint} />}
      </BMapGLMap>
    </div>
  );
}

export default (
  MapApiLoaderHOC({ ak: AK })(BaiduMapPickerInner as unknown as React.ComponentType) as unknown
) as React.ComponentType<Props>;
