import { RENT_TYPE_OPTIONS, LIFT_OPTIONS } from "@/utils/constants";

export interface RoomItem {
  id: number;
  name: string;
  cover: string;
  coverUrl?: string;
  price: number;
  rentType: number;
  bedroom: number;
  parlour: number;
  area: number;
  floor: number;
  floors: number;
  direction: string;
  lift: number;
  community?: { name: string; district: string; street?: string | null; streetNumber?: string | null; subwayLine?: string | null };
  publisher?: { nickname: string | null; realname: string | null; username: string } | null;
}

export interface RoomsResponse {
  success: boolean;
  data: RoomItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildRoomTags(room: RoomItem) {
  const tags: { color: "red" | "green" | "blue" | "yellow"; label: string }[] = [];
  const typeOpt = RENT_TYPE_OPTIONS.find((o) => o.value === room.rentType);
  if (typeOpt) tags.push({ color: "red", label: typeOpt.label });
  if (room.direction) tags.push({ color: "green", label: room.direction });
  const liftOpt = LIFT_OPTIONS.find((o) => o.value === room.lift);
  if (liftOpt) tags.push({ color: "blue", label: liftOpt.label });
  if (room.community?.subwayLine) {
    const raw = room.community.subwayLine;
    let lines = raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) lines = parsed.join(" / ");
    } catch {}
    tags.push({ color: "green", label: "近地铁" });
    tags.push({ color: "yellow", label: lines });
  }
  return tags;
}

export function buildSubTitle(room: RoomItem) {
  const parts: string[] = [];
  if (room.bedroom) parts.push(`${room.bedroom}室${room.parlour}厅`);
  if (room.area) parts.push(`${room.area}平方米`);
  if (room.floors) parts.push(`共${room.floors}层`);
  return parts.join("|");
}

export function buildAddress(room: RoomItem) {
  const c = room.community;
  if (!c) return "";
  return [c.name, c.district, c.street, c.streetNumber].filter(Boolean).join(" ");
}

export function getBroker(room: RoomItem) {
  const p = room.publisher;
  if (!p) return undefined;
  return p.nickname || p.realname || p.username;
}
