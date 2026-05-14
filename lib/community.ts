type CommunityRecord = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  streetNumber: string | null;
  subwayLine: string | null;
  lng: number;
  lat: number;
  cover: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeCommunity(c: CommunityRecord) {
  return {
    id: c.id,
    name: c.name,
    province: c.province,
    city: c.city,
    district: c.district,
    street: c.street,
    streetNumber: c.streetNumber,
    subwayLine: c.subwayLine,
    lng: c.lng,
    lat: c.lat,
    cover: c.cover,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
