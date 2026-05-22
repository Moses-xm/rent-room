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
export const DEFAULT_PAGE_SIZE = 10;
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
  { value: 1,  label: '新预约' },
  { value: 2,  label: '预约取消' },
  { value: 3,  label: '预约完成' },
  { value: 4,  label: '签约/续租' },
  { value: 5,  label: '付款成功' },
  { value: 6,  label: '收款成功' },
  { value: 7,  label: '即将到期' },
  { value: 8,  label: '合法退房' },
  { value: 9,  label: '逾期强退' },
  { value: 10, label: '提前退房' },
  { value: 11, label: '退房通知' },
];

export const NOTIFICATION_TYPE_LABEL: Record<number, string> = {
  1:  '新预约',
  2:  '预约取消',
  3:  '预约完成',
  4:  '签约/续租',
  5:  '付款成功',
  6:  '收款成功',
  7:  '即将到期',
  8:  '合法退房',
  9:  '逾期强退',
  10: '提前退房',
  11: '退房通知',
};

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
  { href: "/portal",            label: "首页",   exact: true },
  { href: "/portal/areaRoom",   label: "区域找房" },
  { href: "/portal/subwayRoom", label: "地铁找房" },
  { href: "/portal/cmyRoom",    label: "小区找房" },
  { href: "/portal/mapRoom",    label: "地图找房" },
  // landlordGate: true — TopMenu / MobileNav 拦截，做身份判断后再跳转
  { href: "/portal/account/room", label: "我要出租", landlordGate: true },
];

export const PORTAL_MINE_MENU = [
  { label: "我的资料", href: "/portal/account/info"         },
  { label: "我的收藏", href: "/portal/account/collection"   },
  { label: "我的预约", href: "/portal/account/appointment"  },
  { label: "我的房源", href: "/portal/account/room"         },
  { label: "我的小区", href: "/portal/account/community"    },
  { label: "我的合同", href: "/portal/account/contract"     },
  { label: "我的订单", href: "/portal/account/orders"       },
  { label: "我的通知", href: "/portal/account/notification" },
  { label: "房东认证", href: "/portal/account/landlord"     },
];

export const PORTAL_FOOTER_LINKS = ["关于我们", "联系我们", "用户协议", "隐私政策"];

/** 搜索跳转目标路径（含 ?q= 参数由调用方拼接） */
export const PORTAL_SEARCH_PATH = "/portal/areaRoom";

/** 登录/注册页全屏背景图 */
export const PORTAL_AUTH_BG = "/prototype/assets/bg.jpg";

/** 个人中心横幅背景图 */
export const PORTAL_MINE_BANNER = "/prototype/assets/banner.png";

// ── Portal Filter Options ─────────────────────────────────────────────────────
export const PORTAL_PRICE_RANGES: Array<{ label: string; min?: number; max?: number }> = [
  { label: "全部" },
  { label: "1000元以下",    max: 1000 },
  { label: "1000-1500元",   min: 1000, max: 1500 },
  { label: "1500-2000元",   min: 1500, max: 2000 },
  { label: "2000-2500元",   min: 2000, max: 2500 },
  { label: "2500-3000元",   min: 2500, max: 3000 },
  { label: "3000-4000元",   min: 3000, max: 4000 },
  { label: "4000-5000元",   min: 4000, max: 5000 },
  { label: "5000-6000元",   min: 5000, max: 6000 },
  { label: "6000-8000元",   min: 6000, max: 8000 },
  { label: "8000-15000元",  min: 8000, max: 15000 },
  { label: "15000元以上",   min: 15000 },
];

export const PORTAL_ROOM_BED_OPTIONS = ["一室", "二室", "三室", "四室", "五室及以上"];

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

// ── Portal 个人中心 ────────────────────────────────────────────────────────────

export const GENDER_LABEL: Record<number, string> = { 1: '男', 2: '女', 3: '保密' };

export const IDENTITY_LABEL: Record<number, string> = { 1: '普通用户', 2: '房东' };

export const MINE_SKELETON_ROWS = 5;

/** 预约状态 → 文字色 + 背景色（Tailwind） */
export const APPOINTMENT_STATUS_STYLE: Record<number, string> = {
  1: 'text-blue-500 bg-blue-50',
  2: 'text-green-600 bg-green-50',
  3: 'text-[#999] bg-[#f5f5f5]',
  4: 'text-orange-400 bg-orange-50',
};

/** 房源发布状态 → label + 样式 */
export const ROOM_PUBLISHED_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: '未发布', cls: 'text-[#999] bg-[#f5f5f5]' },
  2: { label: '已发布', cls: 'text-green-600 bg-green-50' },
};

/** 房源出租状态 → label + 样式 */
export const ROOM_RENTED_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: '未租出', cls: 'text-blue-500 bg-blue-50' },
  2: { label: '已租出', cls: 'text-[#999] bg-[#f5f5f5]' },
};

/** 合同状态 → label + 样式 */
export const CONTRACT_STATUS_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: '进行中', cls: 'text-green-600 bg-green-50' },
  2: { label: '已完成', cls: 'text-[#999] bg-[#f5f5f5]' },
};

/** 订单类型 → 文字色 + 背景色（Tailwind） */
export const ORDER_TYPE_STYLE: Record<number, string> = {
  1: 'text-blue-500 bg-blue-50',
  2: 'text-green-600 bg-green-50',
  3: 'text-orange-500 bg-orange-50',
};

/** 通知类型 → 文字色 + 背景色（Tailwind） */
export const NOTIFICATION_TYPE_COLOR: Record<number, string> = {
  1:  'bg-blue-100 text-blue-600',
  2:  'bg-red-100 text-red-500',
  3:  'bg-green-100 text-green-600',
  4:  'bg-purple-100 text-purple-600',
  5:  'bg-emerald-100 text-emerald-600',
  6:  'bg-teal-100 text-teal-600',
  7:  'bg-orange-100 text-orange-500',
  8:  'bg-green-100 text-green-700',
  9:  'bg-red-100 text-red-600',
  10: 'bg-yellow-100 text-yellow-600',
  11: 'bg-gray-100 text-gray-600',
};
