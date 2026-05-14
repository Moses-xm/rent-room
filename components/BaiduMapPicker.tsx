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
  centerCity?: string;
  addressQuery?: string;
  position?: { lng: number; lat: number };
  zoom?: number;
  onPick: (result: MapPickResult) => void;
  height?: string;
}

const AK = process.env.NEXT_PUBLIC_BAIDU_MAP_AK ?? 'YOUR_BAIDU_MAP_AK';

const B = () => (window as Window & { BMapGL: typeof BMapGL }).BMapGL;
const SafeMarker = BMapGLMarker as unknown as React.ComponentType<{ position: BMapGL.Point }>;

function BaiduMapPickerInner({
  centerCity,
  addressQuery,
  position,
  zoom = 12,
  onPick,
  height = '100%',
}: Props) {
  const mapRef = useRef<InstanceType<typeof BMapGLMap> | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [center, setCenter] = useState<any>(centerCity ?? '北京市');

  // Always reflects the latest zoom prop so geocoder callbacks use the correct value
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; });

  const onPickRef = useRef(onPick);
  useEffect(() => { onPickRef.current = onPick; });

  // Re-center when address fields change; zoom comes from parent via zoomRef
  useEffect(() => {
    const query = addressQuery?.trim() ?? '';
    if (!query) return;
    new (B()).Geocoder().getPoint(query, (point) => {
      const p = point as BMapGL.Point | null;
      if (!p) return;
      const pt = new (B()).Point(p.lng, p.lat);
      setCenter(pt);
      // centerAndZoom is imperative-path backup; the zoom prop change (parent setState)
      // is the primary path that triggers BMapGLMap to reapply the zoom value.
      mapRef.current?.map?.centerAndZoom(pt, zoomRef.current);
    }, '');
  }, [addressQuery]);

  // Map click: reverse-geocode → fill address + coordinates, no zoom/center change
  const handleClick = (e: Event) => {
    const { latlng } = e as Event & { latlng: BMapGL.Point };
    if (!latlng) return;
    const { lng, lat } = latlng;
    new (B()).Geocoder().getLocation(new (B()).Point(lng, lat), (result) => {
      if (!result) return;
      const ac = result.addressComponents;
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

  const markerPoint = position ? new (B()).Point(position.lng, position.lat) : null;

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-border" style={{ height }}>
      <div className="absolute top-2 left-2 z-10 bg-card border border-border rounded-sm px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
        <MapPin size={12} className="text-primary" />
        <span className="text-tiny text-text-2">点击地图可自动解析地址</span>
      </div>

      <BMapGLMap
        ref={mapRef}
        center={center}
        zoom={zoom}   // prop-driven: changes when parent updates mapZoom state
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
