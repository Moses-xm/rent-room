type CommunitySnap = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  streetNumber: string | null;
  lng: number;
  lat: number;
};

type PublisherSnap = {
  id: number;
  username: string;
  nickname: string | null;
  realname: string | null;
  avatar: string | null;
  phone: string | null;
};

type RoomRecord = {
  id: number;
  name: string;
  cmyId: number;
  rentType: number;
  minTenancy: number;
  bedroom: number;
  parlour: number;
  bathroom: number;
  roomType: string;
  direction: string;
  price: number;
  area: number;
  pledge: number;
  pay: number;
  floor: number;
  floors: number;
  level: number;
  lift: number;
  description: string | null;
  cover: string;
  images: string;
  facilityIds: string;
  publisherId: number;
  isPublished: number;
  publishTime: Date | null;
  roomCode: string;
  isRented: number;
  views: number;
  times: number;
  income: number;
  createdAt: Date;
  updatedAt: Date;
  community?: CommunitySnap | null;
  publisher?: PublisherSnap | null;
};

export function serializeRoom(r: RoomRecord) {
  return {
    id: r.id,
    name: r.name,
    cmyId: r.cmyId,
    rentType: r.rentType,
    minTenancy: r.minTenancy,
    bedroom: r.bedroom,
    parlour: r.parlour,
    bathroom: r.bathroom,
    roomType: r.roomType,
    direction: r.direction,
    price: r.price,
    area: r.area,
    pledge: r.pledge,
    pay: r.pay,
    floor: r.floor,
    floors: r.floors,
    level: r.level,
    lift: r.lift,
    description: r.description,
    cover: r.cover,
    images: r.images,
    facilityIds: r.facilityIds,
    publisherId: r.publisherId,
    isPublished: r.isPublished,
    publishTime: r.publishTime ? r.publishTime.toISOString() : null,
    roomCode: r.roomCode,
    isRented: r.isRented,
    views: r.views,
    times: r.times,
    income: r.income,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    community: r.community
      ? {
          id: r.community.id,
          name: r.community.name,
          province: r.community.province,
          city: r.community.city,
          district: r.community.district,
          street: r.community.street,
          streetNumber: r.community.streetNumber,
          lng: r.community.lng,
          lat: r.community.lat,
        }
      : null,
    publisher: r.publisher
      ? {
          id: r.publisher.id,
          username: r.publisher.username,
          nickname: r.publisher.nickname,
          realname: r.publisher.realname,
          avatar: r.publisher.avatar,
          phone: r.publisher.phone,
        }
      : null,
  };
}
