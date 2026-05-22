'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { BAIDU_MAP_AK } from '@/utils/constants';

const BaiduMapReadonly = dynamic(
  () =>
    import('react-bmapgl').then(({ Map, Marker, MapApiLoaderHOC }) => {
      const B = () => (window as Window & { BMapGL: typeof BMapGL }).BMapGL;
      const SafeMarker = Marker as unknown as React.ComponentType<{ position: BMapGL.Point }>;

      function ReadonlyMapInner({ lng, lat }: { lng: number; lat: number }) {
        const center = new (B()).Point(lng, lat);
        return (
          <Map center={center} zoom={15} style={{ width: '100%', height: '100%' }} enableScrollWheelZoom>
            <SafeMarker position={center} />
          </Map>
        );
      }

      return (MapApiLoaderHOC({ ak: BAIDU_MAP_AK })(
        ReadonlyMapInner as unknown as React.ComponentType
      ) as unknown) as React.ComponentType<{ lng: number; lat: number }>;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-surface">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    ),
  }
);

export default BaiduMapReadonly;
