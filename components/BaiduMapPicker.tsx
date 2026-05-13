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
  onPick,
  onPositionChange,
  height = '100%',
}: Props) {
  // Using InstanceType to get the map component instance, which has .map: BMapGL.Map
  const mapRef = useRef<InstanceType<typeof BMapGLMap> | null>(null);

  // localPos tracks user-initiated positions (click / geocoding).
  // Position prop is used as fallback so the effect only pans, never calls setState.
  const [localPos, setLocalPos] = useState<{ lng: number; lat: number } | undefined>();
  const displayPos = localPos ?? position;

  const prevQueryRef = useRef('');
  const onPickRef = useRef(onPick);
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => { onPickRef.current = onPick; });
  useEffect(() => { onPositionChangeRef.current = onPositionChange; });

  const defaultPos = position ?? { lng: 116.404, lat: 39.915 };

  /* Pan map when position prop changes (edit-mode load, manual coordinate entry) */
  useEffect(() => {
    if (!position || !mapRef.current?.map) return;
    mapRef.current.map.centerAndZoom(new (B()).Point(position.lng, position.lat), 15);
  }, [position?.lng, position?.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Forward geocoding: address → coordinates */
  useEffect(() => {
    const query = addressQuery?.trim() ?? '';
    if (!query || query === prevQueryRef.current || !mapRef.current?.map) return;
    prevQueryRef.current = query;

    new (B()).Geocoder().getPoint(query, (point) => {
      // getPoint may return null at runtime despite non-null type declaration
      const safePoint = point as BMapGL.Point | null;
      if (!safePoint || !mapRef.current?.map) return;
      mapRef.current.map.centerAndZoom(new (B()).Point(safePoint.lng, safePoint.lat), 15);
      setLocalPos({ lng: safePoint.lng, lat: safePoint.lat });
      onPositionChangeRef.current?.(safePoint.lng, safePoint.lat);
    }, '');
  }, [addressQuery]);

  /* Reverse geocoding on map click */
  const handleClick = (e: Event) => {
    const { latlng } = e as Event & { latlng: BMapGL.Point };
    if (!latlng) return;
    const { lng, lat } = latlng;
    new (B()).Geocoder().getLocation(new (B()).Point(lng, lat), (result) => {
      if (!result) return;
      const ac = result.addressComponents;
      setLocalPos({ lng, lat });
      mapRef.current?.map.centerAndZoom(new (B()).Point(lng, lat), 15);
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

  const centerPoint = new (B()).Point(defaultPos.lng, defaultPos.lat);
  const markerPoint = displayPos ? new (B()).Point(displayPos.lng, displayPos.lat) : null;

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-border" style={{ height }}>
      <div className="absolute top-2 left-2 z-10 bg-card border border-border rounded-sm px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
        <MapPin size={12} className="text-primary" />
        <span className="text-tiny text-text-2">点击地图可自动解析地址</span>
      </div>

      <BMapGLMap
        ref={mapRef}
        center={centerPoint}
        zoom={13}
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
