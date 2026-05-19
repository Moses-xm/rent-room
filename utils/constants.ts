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

// ── Appointment ───────────────────────────────────────────────────────────────
export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 1, label: '待看房' },
  { value: 2, label: '已完成' },
  { value: 3, label: '已取消' },
  { value: 4, label: '已过期' },
];

// ── Notification ──────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 1, label: '新预约' },
  { value: 2, label: '预约取消' },
  { value: 3, label: '预约完成' },
];

export const NOTIFICATION_READ_OPTIONS = [
  { value: 'true',  label: '已读' },
  { value: 'false', label: '未读' },
];

// ── Contract ──────────────────────────────────────────────────────────────────
export const CONTRACT_STATUS_OPTIONS = [
  { value: 1, label: '进行中' },
  { value: 2, label: '已完成' },
];

export const CHECKOUT_OPTIONS = [
  { value: 'true',  label: '已退房' },
  { value: 'false', label: '未退房' },
];

// ── Order ──────────────────────────────────────────────────────────────────────
export const ORDER_TYPE_OPTIONS = [
  { value: 1, label: '首期款' },
  { value: 2, label: '续期房租' },
  { value: 3, label: '押金退款' },
];

// ── Portal Navigation ─────────────────────────────────────────────────────────
export const PORTAL_NAV_MENU = [
  { href: "/portal",                         label: "首页",   exact: true },
  { href: "/portal/areaRoom",               label: "区域找房" },
  { href: "/portal/subwayRoom",             label: "地铁找房" },
  { href: "/portal/cmyRoom",                label: "小区找房" },
  { href: "/portal/mapRoom",                label: "地图找房" },
  { href: "/portal/sharedRoom/createRoom",  label: "我要出租" },
];

export const PORTAL_MINE_MENU = [
  { label: "我的资料", href: "/portal/account/info"        },
  { label: "我的收藏", href: "/portal/account/collection"  },
  { label: "我的预约", href: "/portal/account/appointment" },
  { label: "我的房源", href: "/portal/account/room"        },
  { label: "我的合同", href: "/portal/account/contract"    },
  { label: "我的订单", href: "/portal/account/orders"      },
];

export const PORTAL_FOOTER_LINKS = ["关于我们", "联系我们", "用户协议", "隐私政策"];

/** 搜索跳转目标路径（含 ?q= 参数由调用方拼接） */
export const PORTAL_SEARCH_PATH = "/portal/areaRoom";

/** 登录/注册页全屏背景图 */
export const PORTAL_AUTH_BG = "/prototype/assets/bg.jpg";

/** 个人中心横幅背景图 */
export const PORTAL_MINE_BANNER = "/prototype/assets/banner.png";

// ── Portal Filter Options ─────────────────────────────────────────────────────
export const PORTAL_SUBWAY_LINES = [
  "全部", "1号线", "2号线", "4号线", "5号线", "6号线", "7号线", "16号线",
];

export const PORTAL_PRICE_RANGES: Array<{ label: string; min?: number; max?: number }> = [
  { label: "全部" },
  { label: "1000以下",  max: 1000 },
  { label: "1000-1500", min: 1000, max: 1500 },
  { label: "1500-2000", min: 1500, max: 2000 },
  { label: "2000-3000", min: 2000, max: 3000 },
  { label: "3000-5000", min: 3000, max: 5000 },
  { label: "5000以上",  min: 5000 },
];

export const PORTAL_ROOM_BED_OPTIONS = ["一室", "两室", "三室", "四室及以上"];

// ── Wallet ────────────────────────────────────────────────────────────────────
export const WALLET_RECORD_TYPE_OPTIONS = [
  { value: 1, label: '充值' },
  { value: 2, label: '支付租房' },
  { value: 3, label: '收款（房东）' },
  { value: 4, label: '退押金' },
];

export const WALLET_DATE_RANGE_OPTIONS = [
  { value: 'week',    label: '近一周' },
  { value: 'month',   label: '近一个月' },
  { value: '4months', label: '近四个月' },
  { value: 'all',     label: '全部记录' },
];
