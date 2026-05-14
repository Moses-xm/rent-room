// ── Iconfont ──────────────────────────────────────────────────────────────────
export const FONT_FAMILY = 'iconRentRoom';

// ── Baidu Map ─────────────────────────────────────────────────────────────────
export const BAIDU_MAP_AK = process.env.NEXT_PUBLIC_BAIDU_MAP_AK ?? 'YOUR_BAIDU_MAP_AK';

export const MAP_ZOOM_PROVINCE = 9;   // shows the full province
export const MAP_ZOOM_CITY     = 12;  // shows the city area
export const MAP_ZOOM_DISTRICT = 15;  // shows district / street level

// ── Municipalities (provinces whose area.json city value is "市辖区") ──────────
export const MUNICIPALITY_PROVINCES = new Set(['北京市', '天津市', '上海市', '重庆市']);

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ── Room ──────────────────────────────────────────────────────────────────────
export const RENT_TYPE_OPTIONS = [
  { value: 1, label: '整租' },
  { value: 2, label: '合租' },
];

export const ROOM_TYPE_OPTIONS = ['普通住宅', '公寓'];

export const DIRECTION_OPTIONS = [
  '朝南', '朝北', '朝东', '朝西', '南北', '东西', '东南', '东北', '西南', '西北',
];

export const LEVEL_OPTIONS = [
  { value: 1, label: '低楼层' },
  { value: 2, label: '中楼层' },
  { value: 3, label: '高楼层' },
];

export const LIFT_OPTIONS = [
  { value: 1, label: '无电梯' },
  { value: 2, label: '有电梯' },
];
