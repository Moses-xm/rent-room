// =============================================================================
// 全局常量统一入口
//
// 所有大写命名的常量都必须在此文件中定义，禁止在页面或组件内就地声明。
// 组织结构：
//   1. 基础设施         — API路径、iconfont、分页
//   2. 百度地图         — AK密钥、缩放等级、行政区划
//   3. 管理平台认证     — Token存储、JWT、路由、事件
//   4. 管理平台城市     — localStorage存储、默认城市
//   5. 用户平台认证     — Token存储、路由、事件
//   6. 用户平台城市     — localStorage存储、默认城市
//   7. 用户平台导航     — 顶部菜单、个人中心菜单、页脚、静态资源路径
//   8. 用户平台找房筛选 — 价格区间、卧室数量
//   9. 业务枚举：用户   — 性别、身份
//  10. 业务枚举：房源   — 租赁类型、房屋类型、朝向、楼层、电梯、状态样式
//  11. 业务枚举：预约   — 状态选项、状态样式
//  12. 业务枚举：通知   — 类型选项、类型标签、已读状态、配色
//  13. 业务枚举：合同   — 状态选项、状态样式、退房选项
//  14. 业务枚举：订单   — 类型选项、类型样式
//  15. 业务枚举：钱包   — 流水类型、时间范围
//  16. 组件：富文本编辑器 (Quill)
//  17. 组件：首页轮播图
//  18. 组件：用户平台个人中心
//  19. 组件：通知铃铛
//  20. 管理平台仪表盘
// =============================================================================


// =============================================================================
// 1. 基础设施
// =============================================================================

// 所有前端发出的 API 请求都会拼接在这个前缀后面。
// 例如 request('/manage/rooms') 实际请求的是 /api/manage/rooms
export const API_BASE = '/api';

// iconfont 字体族名。
// 使用图标时写法固定为：<i className={`${FONT_FAMILY} ${item.icon}`} />
// 注意：不能直接写 className="iconfont"，字体名称可能与 iconfont 官方默认不同。
export const FONT_FAMILY = 'iconRentRoom';

// 列表分页的默认每页条数
export const DEFAULT_PAGE_SIZE = 10;

// 每页条数的可选值，显示在分页组件的下拉框中
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];


// =============================================================================
// 2. 百度地图
// =============================================================================

// 百度地图 JS API 的鉴权密钥（AK）。
// 优先读取环境变量 NEXT_PUBLIC_BAIDU_MAP_AK，未配置时使用内置备用值（仅用于开发）。
export const BAIDU_MAP_AK = process.env.NEXT_PUBLIC_BAIDU_MAP_AK ?? 'YOUR_BAIDU_MAP_AK';

// 地图缩放等级预设。数字越大地图越详细（街道级），数字越小范围越大（省级）。
// 这三个值用于初始化地图时根据用户所在层级自动设置合适的视野。
export const MAP_ZOOM_PROVINCE = 9;   // 省级视野，能看到整个省的轮廓
export const MAP_ZOOM_CITY     = 12;  // 市级视野，能看到城市整体布局
export const MAP_ZOOM_DISTRICT = 15;  // 区/街道级视野，能看到具体街道

// 地图找房页面的缩放切换阈值。
// 地图缩放等级 < 此值时，显示"区县圆圈"（汇总该区房源数量）；
// 地图缩放等级 ≥ 此值时，切换为"小区标签"（展示具体小区位置）。
export const MAP_DISTRICT_ZOOM_THRESHOLD = 13;

// 直辖市集合：这四个城市在 area.json 里的城市节点 value 是"市辖区"而不是城市名，
// 需要特殊处理，直接把省节点当作城市节点来用。
export const MUNICIPALITY_PROVINCES = new Set(['北京市', '天津市', '上海市', '重庆市']);


// =============================================================================
// 3. 管理平台 — 认证与路由
// =============================================================================

// ── localStorage 存储 key ─────────────────────────────────────────────────────

// 管理端登录后，JWT token 存在 localStorage 里用的 key 名称。
// 用法：localStorage.getItem(MANAGE_TOKEN_KEY)
export const MANAGE_TOKEN_KEY = "manage-token";

// 管理端当前登录用户的基础信息（用户名、头像等）存在 localStorage 里用的 key 名称。
export const MANAGE_PROFILE_KEY = "manage-profile";

// ── JWT 有效期 ────────────────────────────────────────────────────────────────

// 管理端 JWT 的过期时间，单位秒。7 天 = 60秒 × 60分 × 24小时 × 7天。
// 服务端签发 token 时用这个值设置 exp 字段。
export const MANAGE_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

// ── 路由路径 ──────────────────────────────────────────────────────────────────

// 管理端登录页路径。Token 过期或未登录时会跳转到这个地址。
export const MANAGE_LOGIN_PATH = "/manage/login";

// 管理端首页（Dashboard）路径。登录成功后默认跳转到这里。
export const MANAGE_HOME_PATH = "/manage";

// 管理端个人资料页路径。
export const MANAGE_PROFILE_PATH = "/manage/profile";

// ── 自定义事件名称 ────────────────────────────────────────────────────────────

// 登录或退出登录时，通过 window.dispatchEvent(new Event(MANAGE_AUTH_CHANGED_EVENT))
// 广播一个事件，让顶栏等需要实时感知登录状态的组件重新读取 token。
export const MANAGE_AUTH_CHANGED_EVENT = "manage-auth-changed";

// 修改头像或用户名后，广播此事件让顶栏立即更新显示。
export const MANAGE_PROFILE_CHANGED_EVENT = "manage-profile-changed";


// =============================================================================
// 4. 管理平台 — 城市选择
// =============================================================================

// ── localStorage 存储 key ─────────────────────────────────────────────────────

// 管理端"当前选中城市"存在 localStorage 里用的 key 名称。
// 各列表页（房源、小区等）依赖这个值做数据过滤。
export const MANAGE_CITY_KEY = "cur-city";

// 管理端"当前选中省份"存在 localStorage 里用的 key 名称。
// 城市选择器需要知道省份才能正确展示城市列表。
export const MANAGE_PROVINCE_KEY = "cur-province";

// ── 自定义事件名称 ────────────────────────────────────────────────────────────

// 切换城市后广播此事件，让所有依赖城市的列表页自动刷新数据。
export const MANAGE_CITY_CHANGED_EVENT = "manage-city-changed";

// ── 默认值 ────────────────────────────────────────────────────────────────────

// 首次进入管理平台时的默认城市和省份（尚未选择过城市时使用）。
export const DEFAULT_MANAGE_CITY     = "杭州市";
export const DEFAULT_MANAGE_PROVINCE = "浙江省";


// =============================================================================
// 5. 用户平台 — 认证与路由
// =============================================================================

// ── localStorage 存储 key ─────────────────────────────────────────────────────

// 用户端 JWT token 存在 localStorage 里用的 key 名称。
export const PORTAL_TOKEN_KEY = 'portal-token';

// 用户端当前登录用户信息存在 localStorage 里用的 key 名称。
export const PORTAL_PROFILE_KEY = 'portal-profile';

// ── 路由路径 ──────────────────────────────────────────────────────────────────

// 用户端登录页路径。Token 过期或需要登录时跳转到这里。
export const PORTAL_LOGIN_PATH = '/portal/login';

// 用户端首页路径。
export const PORTAL_HOME_PATH = '/portal';

// 用户端我的订单页路径。登录成功后部分场景（如支付完成）会跳转到这里。
export const PORTAL_ORDERS_PATH = '/portal/account/orders';

// ── 自定义事件名称 ────────────────────────────────────────────────────────────

// 登录/退出时广播此事件，让顶部导航栏等组件实时更新用户状态显示。
export const PORTAL_AUTH_CHANGED_EVENT = 'portal-auth-changed';


// =============================================================================
// 6. 用户平台 — 城市选择
// =============================================================================

// ── localStorage 存储 key ─────────────────────────────────────────────────────

// 用户端"当前选中城市"存在 localStorage 里用的 key 名称。
// 前缀 portal- 是为了和管理端的 cur-city 区分开，避免互相覆盖。
export const PORTAL_CITY_KEY     = "portal-cur-city";

// 用户端"当前选中省份"存在 localStorage 里用的 key 名称。
export const PORTAL_PROVINCE_KEY = "portal-cur-province";

// ── 自定义事件名称 ────────────────────────────────────────────────────────────

// 切换城市后广播此事件，让找房列表页、地图等自动刷新。
export const PORTAL_CITY_CHANGED_EVENT = "portal-city-changed";

// ── 默认值 ────────────────────────────────────────────────────────────────────

// 用户首次访问用户平台时使用的默认城市和省份。
export const DEFAULT_PORTAL_CITY     = "杭州市";
export const DEFAULT_PORTAL_PROVINCE = "浙江省";


// =============================================================================
// 7. 用户平台 — 导航菜单 & 静态资源路径
// =============================================================================

// 顶部绿色主导航菜单配置。
// exact: true 表示只有路径完全匹配 href 时才高亮（防止 /portal 匹配所有子路由）。
// landlordGate: true 表示点击时需要先检查是否是房东身份，否则引导去认证。
export const PORTAL_NAV_MENU = [
  { href: "/portal",              label: "首页",   exact: true },
  { href: "/portal/areaRoom",     label: "区域找房" },
  { href: "/portal/subwayRoom",   label: "地铁找房" },
  { href: "/portal/cmyRoom",      label: "小区找房" },
  { href: "/portal/mapRoom",      label: "地图找房" },
  { href: "/portal/account/room", label: "我要出租", landlordGate: true },
];

// 个人中心（我的）侧边栏 / 顶部标签页的菜单项。
// 顺序即为展示顺序，按用户常用程度排列。
export const PORTAL_MINE_MENU = [
  { label: "我的资料", href: "/portal/account/info"         },
  { label: "我的钱包", href: "/portal/account/wallet"       },
  { label: "我的收藏", href: "/portal/account/collection"   },
  { label: "我的预约", href: "/portal/account/appointment"  },
  { label: "我的房源", href: "/portal/account/room"         },
  { label: "我的小区", href: "/portal/account/community"    },
  { label: "我的合同", href: "/portal/account/contract"     },
  { label: "我的订单", href: "/portal/account/orders"       },
  { label: "我的通知", href: "/portal/account/notification" },
  { label: "房东认证", href: "/portal/account/landlord"     },
];

export const PORTAL_FOOTER_LINKS = [
  { label: "关于我们", href: "/portal/about"   },
  { label: "联系我们", href: "/portal/contact"  },
  { label: "用户协议", href: "/portal/terms"    },
  { label: "隐私政策", href: "/portal/privacy"  },
];

// 顶部搜索框"搜索"按钮的跳转目标路径。
// 调用方负责在路径后拼接 ?q=关键词 参数。
export const PORTAL_SEARCH_PATH = "/portal/areaRoom";

// 登录页和注册页的全屏背景图路径（相对于 /public 目录）。
export const PORTAL_AUTH_BG = "/images/bg.jpg";

// 个人中心顶部横幅背景图路径（相对于 /public 目录）。
export const PORTAL_MINE_BANNER = "/images/banner.png";


// =============================================================================
// 8. 用户平台 — 找房筛选条件
// =============================================================================

// 找房页"月租价格"筛选的区间配置。
// min / max 均为元，省略表示无下限/无上限（对应"全部"和"XX元以上/以下"）。
// 筛选时把选中项的 min/max 传给 API 的 priceMin / priceMax 参数。
export const PORTAL_PRICE_RANGES: Array<{ label: string; min?: number; max?: number }> = [
  { label: "全部" },
  { label: "1000元以下",   max: 1000 },
  { label: "1000-1500元",  min: 1000, max: 1500 },
  { label: "1500-2000元",  min: 1500, max: 2000 },
  { label: "2000-2500元",  min: 2000, max: 2500 },
  { label: "2500-3000元",  min: 2500, max: 3000 },
  { label: "3000-4000元",  min: 3000, max: 4000 },
  { label: "4000-5000元",  min: 4000, max: 5000 },
  { label: "5000-6000元",  min: 5000, max: 6000 },
  { label: "6000-8000元",  min: 6000, max: 8000 },
  { label: "8000-15000元", min: 8000, max: 15000 },
  { label: "15000元以上",  min: 15000 },
];

// 找房页"卧室数量"筛选选项（对应房源的 bedroom 字段）。
export const PORTAL_ROOM_BED_OPTIONS = ["一室", "二室", "三室", "四室", "五室及以上"];


// =============================================================================
// 9. 业务枚举 — 用户
// =============================================================================

// 用户性别的表单下拉选项。value 是字符串类型，供 FilterSelect 组件使用。
// 注意：数据库存的是数字（1/2/3），提交表单前需要用 Number() 转换。
export const GENDER_OPTIONS = [
  { value: '1', label: '男' },
  { value: '2', label: '女' },
  { value: '3', label: '不愿透露' },
];

// 用户性别数字值 → 显示文字的映射（用于列表展示、详情页等只读场景）。
// 和 GENDER_OPTIONS 的区别：key 是数字而非字符串，直接用数据库值查询。
export const GENDER_LABEL: Record<number, string> = {
  1: '男',
  2: '女',
  3: '保密',
};

// 用户身份的表单下拉选项。value 是字符串类型，供 FilterSelect 组件使用。
export const IDENTITY_OPTIONS = [
  { value: '1', label: '普通用户' },
  { value: '2', label: '房东' },
];

// 用户身份数字值 → 显示文字的映射（用于列表展示等只读场景）。
export const IDENTITY_LABEL: Record<number, string> = {
  1: '普通用户',
  2: '房东',
};


// =============================================================================
// 10. 业务枚举 — 房源
// =============================================================================

// 租赁方式选项（整租 / 合租）。value 对应数据库 rentType 字段。
// 供管理端表单和用户端筛选栏使用。
export const RENT_TYPE_OPTIONS = [
  { value: 1, label: '整租' },
  { value: 2, label: '合租' },
];

// 房屋类型选项（纯字符串数组，数据库直接存文字）。
export const ROOM_TYPE_OPTIONS = ['普通住宅', '公寓'];

// 房间朝向选项（数据库直接存文字）。
export const DIRECTION_OPTIONS = [
  '朝南', '朝北', '朝东', '朝西', '南北', '东西', '东南', '东北', '西南', '西北',
];

// 楼层高低选项。value 对应数据库 level 字段（1=低/2=中/3=高）。
export const LEVEL_OPTIONS = [
  { value: 1, label: '低楼层' },
  { value: 2, label: '中楼层' },
  { value: 3, label: '高楼层' },
];

// 电梯有无选项。value 对应数据库 lift 字段（1=无/2=有）。
export const LIFT_OPTIONS = [
  { value: 1, label: '无电梯' },
  { value: 2, label: '有电梯' },
];

// 房源发布状态（published 字段）数字值 → 标签文字 + Tailwind 样式类。
// 用于在个人中心"我的房源"列表中显示发布状态徽章。
export const ROOM_PUBLISHED_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: '未发布', cls: 'text-[#999] bg-[#f5f5f5]' },
  2: { label: '已发布', cls: 'text-green-600 bg-green-50' },
};

// 房源出租状态（rented 字段）数字值 → 标签文字 + Tailwind 样式类。
// 用于在个人中心"我的房源"列表中显示出租状态徽章。
export const ROOM_RENTED_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: '未租出', cls: 'text-blue-500 bg-blue-50' },
  2: { label: '已租出', cls: 'text-[#999] bg-[#f5f5f5]' },
};


// =============================================================================
// 11. 业务枚举 — 预约
// =============================================================================

// 预约状态选项。value 对应数据库 status 字段。
// 供管理端筛选栏（FilterSelect）使用，value 为数字。
export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 1, label: '待看房' },
  { value: 2, label: '已完成' },
  { value: 3, label: '已取消' },
  { value: 4, label: '已过期' },
];

// 预约状态数字值 → Tailwind 文字色 + 背景色组合。
// 用于在列表和详情页渲染彩色状态徽章。
export const APPOINTMENT_STATUS_STYLE: Record<number, string> = {
  1: 'text-blue-500 bg-blue-50',   // 待看房：蓝色（待处理）
  2: 'text-green-600 bg-green-50', // 已完成：绿色（成功）
  3: 'text-[#999] bg-[#f5f5f5]',  // 已取消：灰色（无效）
  4: 'text-orange-400 bg-orange-50', // 已过期：橙色（警示）
};


// =============================================================================
// 12. 业务枚举 — 通知
// =============================================================================

// 通知类型选项。供管理端筛选栏使用，value 为数字。
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

// 通知类型数字值 → 显示文字（用于列表和详情页的只读文字展示）。
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

// 通知已读状态选项。value 是字符串 'true'/'false'，对应 isRead 字段。
// 供管理端筛选栏使用（FilterSelect 的 value 必须是字符串）。
export const NOTIFICATION_READ_OPTIONS = [
  { value: 'true',  label: '已读' },
  { value: 'false', label: '未读' },
];

// 通知类型数字值 → Tailwind 背景色 + 文字色（浅色底）。
// 用于个人中心通知列表中的"类型徽章"（背景较浅，视觉层级低）。
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

// 通知铃铛下拉面板单次拉取的最大条数（超出不显示，需进入完整通知页查看）。
export const NOTIFICATION_BELL_LIMIT = 20;

// 通知类型数字值 → Tailwind 实心背景色。
// 用于通知铃铛下拉列表中左侧的小圆点（实心色，视觉层级更高，用于快速识别类型）。
// 与 NOTIFICATION_TYPE_COLOR 的区别：这里是实心色（bg-*-500），那里是浅色底（bg-*-100）。
export const NOTIFICATION_BELL_TYPE_COLOR: Record<number, string> = {
  1:  "bg-sky-500",
  2:  "bg-rose-500",
  3:  "bg-emerald-500",
  4:  "bg-violet-500",
  5:  "bg-emerald-500",
  6:  "bg-teal-500",
  7:  "bg-amber-500",
  8:  "bg-emerald-500",
  9:  "bg-red-500",
  10: "bg-orange-500",
  11: "bg-slate-500",
};


// =============================================================================
// 13. 业务枚举 — 合同
// =============================================================================

// 合同状态选项。value 对应数据库 status 字段（1=进行中 / 2=已完成）。
// 供管理端和用户端筛选栏使用。
export const CONTRACT_STATUS_OPTIONS = [
  { value: 1, label: '进行中' },
  { value: 2, label: '已完成' },
];

// 合同状态数字值 → 标签文字 + Tailwind 样式类。
// 用于合同列表和详情页显示状态徽章。
export const CONTRACT_STATUS_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: '进行中', cls: 'text-green-600 bg-green-50' },
  2: { label: '已完成', cls: 'text-[#999] bg-[#f5f5f5]' },
};

// 合同是否已退房的筛选选项。value 是字符串以兼容 FilterSelect 组件。
export const CHECKOUT_OPTIONS = [
  { value: 'true',  label: '已退房' },
  { value: 'false', label: '未退房' },
];


// =============================================================================
// 14. 业务枚举 — 订单
// =============================================================================

// 订单类型选项。value 对应数据库 type 字段（1=首期款 / 2=续期房租 / 3=押金退款）。
// 供管理端筛选栏使用。
export const ORDER_TYPE_OPTIONS = [
  { value: 1, label: '首期款' },
  { value: 2, label: '续期房租' },
  { value: 3, label: '押金退款' },
];

// 订单类型数字值 → Tailwind 文字色 + 背景色组合。
// 用于个人中心订单列表中的"类型徽章"。
export const ORDER_TYPE_STYLE: Record<number, string> = {
  1: 'text-blue-500 bg-blue-50',    // 首期款：蓝色
  2: 'text-green-600 bg-green-50',  // 续期房租：绿色
  3: 'text-orange-500 bg-orange-50', // 押金退款：橙色
};


// =============================================================================
// 15. 业务枚举 — 钱包
// =============================================================================

// 钱包流水类型选项。value 对应数据库 type 字段。
// 供管理端和用户端"我的钱包"页面的筛选栏使用。
export const WALLET_RECORD_TYPE_OPTIONS = [
  { value: 1, label: '充值' },
  { value: 2, label: '支付租房' },
  { value: 3, label: '收款（房东）' },
  { value: 4, label: '退押金' },
];

// 钱包流水的时间范围筛选选项。
// value 由 API 解析，'all' 表示不限时间范围。
export const WALLET_DATE_RANGE_OPTIONS = [
  { value: 'week',    label: '近一周' },
  { value: 'month',   label: '近一个月' },
  { value: '4months', label: '近四个月' },
  { value: 'all',     label: '全部记录' },
];


// =============================================================================
// 16. 组件 — 富文本编辑器（Quill）
// =============================================================================

// 编辑器工具栏支持的字号列表（CSS px 值 → 工具栏展示文字）。
// key 是 Quill 内部识别的 CSS 值，value 是给用户看的简短数字。
export const RICH_EDITOR_FONT_SIZE_LABELS: Record<string, string> = {
  '12px': '12', '13px': '13', '14px': '14', '15px': '15', '16px': '16',
  '18px': '18', '20px': '20', '24px': '24', '28px': '28', '32px': '32',
};

// 编辑器的默认字号。必须与 globals.css 中 .ql-container 的 font-size 保持一致，
// 否则不选择字号时渲染出来的字体大小会与工具栏显示不符。
export const RICH_EDITOR_DEFAULT_SIZE = '14px';

// 编辑器工具栏按钮配置，每个子数组是一组按钮，组之间有分隔线。
export const RICH_EDITOR_TOOLBAR = [
  [{ size: Object.keys(RICH_EDITOR_FONT_SIZE_LABELS) }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
];

// 传给 ReactQuill modules prop 的完整配置对象（包含 toolbar）。
export const RICH_EDITOR_MODULES = { toolbar: RICH_EDITOR_TOOLBAR };

// 编辑器支持的格式列表，未列出的格式会被 Quill 自动剥除。
export const RICH_EDITOR_FORMATS = [
  'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align',
  'list', 'blockquote', 'link',
];


// =============================================================================
// 17. 组件 — 首页轮播图（HeroCarousel）
// =============================================================================

// 首页 Hero 轮播图自动切换的时间间隔，单位毫秒。
// 6000ms = 6 秒切一张，防止切换太快让用户来不及看清内容。
export const HERO_CAROUSEL_AUTOPLAY_DELAY = 6000;


// =============================================================================
// 18. 组件 — 用户平台个人中心（MineShell）
// =============================================================================

// 个人中心各列表页骨架屏默认渲染的占位行数。
// 加载完成前先显示这么多行的灰色占位块，避免页面空白。
export const MINE_SKELETON_ROWS = 5;


// =============================================================================
// 19. 管理平台 — 仪表盘（Dashboard）
// =============================================================================

// 仪表盘租房类型环形图的扇区颜色（整租 / 合租各一个颜色）。
// 使用暖棕色系以契合管理平台的整体配色风格。
export const DASHBOARD_DONUT_COLORS = ['#8B7355', '#C4A878'];

// 仪表盘"收入趋势"图表的时间维度选项。
// as const 使 TypeScript 把 months 推断为字面量类型（3|6|12），便于类型安全地控制请求参数。
export const DASHBOARD_PERIODS = [
  { label: '近三月', months: 3 },
  { label: '近半年', months: 6 },
  { label: '本年',   months: 12 },
] as const;

// 仪表盘"最新订单"列表中订单类型数字值 → 显示文字 + 徽章变体名称。
// variant 值对应 StatusPill 组件的预设样式（'accent'=蓝/强调色，'success'=绿，'info'=青）。
export const DASHBOARD_ORDER_TYPE_MAP: Record<number, { label: string; variant: 'accent' | 'success' | 'info' }> = {
  1: { label: '首期款', variant: 'accent' },
  2: { label: '续期款', variant: 'success' },
  3: { label: '押金退', variant: 'info' },
};
