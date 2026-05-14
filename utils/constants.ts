// ── Baidu Map ─────────────────────────────────────────────────────────────────
export const BAIDU_MAP_AK = process.env.NEXT_PUBLIC_BAIDU_MAP_AK ?? 'YOUR_BAIDU_MAP_AK';

export const MAP_ZOOM_PROVINCE = 9;   // shows the full province
export const MAP_ZOOM_CITY     = 12;  // shows the city area
export const MAP_ZOOM_DISTRICT = 15;  // shows district / street level

// ── Municipalities (provinces whose area.json city value is "市辖区") ──────────
export const MUNICIPALITY_PROVINCES = new Set(['北京市', '天津市', '上海市', '重庆市']);

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
