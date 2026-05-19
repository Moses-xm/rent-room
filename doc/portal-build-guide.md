# Portal 前端实施手册

> 目标：以 `public/prototype/` 高保真静态原型为视觉设计稿，使用 **Tailwind CSS v4 + Next.js App Router** 实现，视觉风格还原原型，同时完整支持移动端响应式布局。

---

## 一、原型分析

### 1.1 色彩体系与 CSS 变量映射

所有颜色已在 `styles/themes/portal.css` 中定义为 CSS 变量，**组件内禁止使用原始 hex 值**，统一通过以下方式引用：

| 用途 | CSS 变量 | Tailwind 写法 |
|---|---|---|
| 主色（导航栏/按钮/激活态） | `--color-primary` (`#62ab00`) | `bg-primary` / `text-primary` |
| 主色深（hover 深绿） | `--color-primary-dark` (`#4a8101`) | `bg-primary-dark` |
| 品牌绿（Logo/auth 边线） | `--color-primary-brand` (`#48a841`) | `text-(--color-primary-brand)` / `border-(--color-primary-brand)` |
| 浅绿背景（active/tag） | `--color-primary-tint` (`#f2f6ed`) | `bg-primary-tint` |
| 搜索按钮/hover/激活橙 | `--color-accent` (`#ff6600`) | `bg-(--color-accent)` / `text-(--color-accent)` |
| 价格文字橙红 | `--color-accent-dark` (`#eb5f00`) | `text-(--color-accent-dark)` |
| 主文字 | `--color-text` (`#333`) | `text-text` |
| 次要文字 | `--color-text-2` (`#666`) | `text-text-2` |
| 弱文字 | `--color-text-muted` (`#999`) | `text-text-muted` |
| 边框 | `--color-border` (`#e6e6e6`) | `border-border` |
| 浅背景 | `--color-surface` (`#f9f9f9`) | `bg-surface` |
| 次级浅背景 | `--color-surface-2` (`#f1f1f1`) | `bg-surface-2` |

> **注**：`--color-primary`、`--color-primary-dark`、`--color-primary-tint` 等已在 `app/globals.css` 的 `@theme inline` 中注册，因此可直接用 `text-primary` / `bg-primary` 等 Tailwind 原生类。`--color-accent`、`--color-accent-dark`、`--color-primary-brand` 仅在 `portal.css` 中定义，需用 `bg-(--color-accent)` 的 CSS 变量简写语法。

### 1.2 标签色（4 种固定色）

组件内可直接用 Tailwind 任意值，或封装为 `RoomTags` 组件：

| 类型 | 文字色 | 背景色 |
|---|---|---|
| tag-red | `text-[#e88a78]` | `bg-[#fcf4f1]` |
| tag-green | `text-[#799374]` | `bg-[#f2f6ed]` |
| tag-blue | `text-[#6682ae]` | `bg-[#f0f4f8]` |
| tag-yellow | `text-[#8b7500]` | `bg-[#fffaf0]` |

### 1.3 页面清单（共 17 个路由）

| 路径 | 页面 | Shell 组件 |
|---|---|---|
| `/portal` | 首页 | `PortalShell` |
| `/portal/areaRoom` | 区域找房 | `PortalShell` |
| `/portal/subwayRoom` | 地铁找房 | `PortalShell` |
| `/portal/cmyRoom` | 小区找房 | `PortalShell` |
| `/portal/cmyRoom/[id]` | 小区房源列表 | `PortalShell` |
| `/portal/room/[id]` | 房源详情 | `PortalShell` |
| `/portal/mapRoom` | 地图找房 | `PortalShell` |
| `/portal/login` | 登录 | `AuthShell` |
| `/portal/register` | 注册 | `AuthShell` |
| `/portal/sharedRoom/createRoom` | 发布房源 | `PortalShell`（需登录） |
| `/portal/sharedRoom/createCmy` | 创建小区 | `PortalShell`（需登录） |
| `/portal/sharedRoom/success` | 提交成功 | `PortalShell` |
| `/portal/account/info` | 我的资料 | `MineShell` |
| `/portal/account/collection` | 我的收藏 | `MineShell` |
| `/portal/account/appointment` | 我的预约 | `MineShell` |
| `/portal/account/room` | 我的房源 | `MineShell` |
| `/portal/account/contract` | 我的合同 | `MineShell` |
| `/portal/account/orders` | 我的订单 | `MineShell`（已存在） |

### 1.4 布局结构与响应式策略

**PortalShell（公开页面）**

```
桌面端（lg:）                        移动端
┌───────────────────────────────┐    ┌──────────────────────┐
│ GlobalHeader  max-w-295 mx-auto│    │ 品牌 Logo  [≡ 汉堡]  │  h-14
├───────────────────────────────┤    ├──────────────────────┤
│ TopMenu（绿色导航栏，6 个菜单）  │    │  隐藏（收入汉堡抽屉）  │
├───────────────────────────────┤    ├──────────────────────┤
│ <main> flex-1                  │    │ <main> flex-1        │
├───────────────────────────────┤    ├──────────────────────┤
│ PortalFooter  max-w-295 mx-auto│    │ PortalFooter         │
└───────────────────────────────┘    └──────────────────────┘
```

移动端汉堡抽屉（`MobileNav`）从左侧滑入，包含：城市、搜索框、6 个菜单项、用户状态区。

**AuthShell（登录/注册）**

```
桌面端                          移动端
全屏背景图                       全屏背景图
h-15.5 导航（品牌 + 登录/注册）   h-15.5 导航
w-135 mx-auto mt-37.5 白色卡片   mx-4 mt-16 白色卡片（全宽）
```

**MineShell（个人中心）**

```
桌面端                           移动端
全宽绿色顶栏（h-13.75）            全宽绿色顶栏
全宽用户横幅（h-25）                全宽用户横幅
max-w-295 mx-auto                 max-w-295 mx-auto px-4
  w-50 侧边菜单 | flex-1 内容区      水平滚动 Tab + flex-1 内容区（全宽）
```

### 1.5 已实现的 Shell 组件

| 组件 | 文件 | 说明 |
|---|---|---|
| `PortalToaster` | `components/portal/PortalToaster.tsx` | 全局 Toast，挂载于 layout |
| `GlobalHeader` | `components/portal/GlobalHeader.tsx` | 顶部导航，桌面/移动双布局 |
| `TopMenu` | `components/portal/TopMenu.tsx` | 绿色导航栏，移动端 `hidden` |
| `MobileNav` | `components/portal/MobileNav.tsx` | 移动端汉堡抽屉内容 |
| `PortalFooter` | `components/portal/PortalFooter.tsx` | 页脚 |
| `PortalShell` | `components/portal/PortalShell.tsx` | 公开页面 BaseLayout |
| `AuthShell` | `components/portal/AuthShell.tsx` | 登录/注册布局 |
| `MineShell` | `components/portal/MineShell.tsx` | 个人中心布局，内置 auth 守卫 |

### 1.6 待实现的共享 UI 组件

| 组件 | 文件 | 说明 |
|---|---|---|
| `HomeCard` | `components/portal/HomeCard.tsx` | 首页房源/小区卡片 |
| `RoomRow` | `components/portal/RoomRow.tsx` | 列表页房源行 |
| `CommunityRow` | `components/portal/CommunityRow.tsx` | 小区列表行 |
| `RoomFilterBar` | `components/portal/RoomFilterBar.tsx` | 筛选栏 |
| `RoomTags` | `components/portal/RoomTags.tsx` | 颜色标签组 |
| `BrokerCard` | `components/portal/BrokerCard.tsx` | 房源详情经纪人卡片 |
| `RoomImage` | `components/portal/RoomImage.tsx` | 图片容错占位封装 |

---

## 二、编码规范（必须遵守）

### 2.1 样式

- 所有样式用 **Tailwind CSS v4**，禁止大量内联 `style={{}}`
- 布局尺寸优先使用 Tailwind 规范写法：`max-w-295`（1180px）、`h-15.5`（62px）、`h-13.75`（55px）、`h-25`（100px）、`w-50`（200px）等
- 颜色通过 CSS 变量：已注册主题色用 `bg-primary`，未注册的用 `bg-(--color-accent)`
- hover/active 交互效果写在 `portal.css` 的 utility 类（`p-link`、`p-menu-link`、`p-mine-item`），组件内用 `className="p-link"` 调用

### 2.2 响应式

- **移动优先**：默认写移动端样式，`lg:` 前缀叠加桌面端
- 内容容器：`max-w-295 mx-auto px-4 lg:px-0`
- 导航栏在移动端完全隐藏（`hidden lg:block`），由汉堡抽屉替代
- 列表卡片网格：`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5`
- 找房列表双栏（内容区 + 广告侧边）：移动端单列，桌面端 `lg:flex`

### 2.3 常量

所有固定数据一律在 `utils/constants.ts` 维护：

```ts
PORTAL_NAV_MENU      // 顶部导航 6 个菜单项（TopMenu + MobileNav 共用）
PORTAL_MINE_MENU     // 个人中心菜单项
PORTAL_FOOTER_LINKS  // 页脚链接
PORTAL_SEARCH_PATH   // 搜索跳转路径
PORTAL_AUTH_BG       // 登录/注册页背景图路径
PORTAL_MINE_BANNER   // 个人中心横幅背景图路径
```

### 2.4 图片容错

所有 `<img>` 封装为 `<RoomImage>` 组件，`onError` 时替换为灰色占位 div：

```tsx
// components/portal/RoomImage.tsx
<img
  src={src}
  alt={alt}
  className={className}
  onError={(e) => {
    const el = e.currentTarget;
    const ph = document.createElement("div");
    ph.className = `${el.className} bg-[repeating-linear-gradient(-45deg,#f4f4f4,#f4f4f4_10px,#ededed_10px,#ededed_20px)] flex items-center justify-center text-xs text-[#9aa0a6]`;
    ph.textContent = "图片占位";
    el.replaceWith(ph);
  }}
/>
```

---

## 三、实施路线图

### ✅ Step 1：主题色（已完成）

`styles/themes/portal.css` 已更新，完整变量：

```css
[data-platform="portal"] {
  --color-primary:        #62ab00;
  --color-primary-dark:   #4a8101;
  --color-primary-brand:  #48a841;
  --color-primary-tint:   #f2f6ed;
  --color-primary-tint-2: #eaf2e0;
  --color-accent:         #ff6600;
  --color-accent-dark:    #eb5f00;
  --color-text:           #333333;
  --color-text-2:         #666666;
  --color-text-muted:     #999999;
  --color-surface:        #f9f9f9;
  --color-surface-2:      #f1f1f1;
  --color-border:         #e6e6e6;
  --color-border-subtle:  #eeeeee;
  --typeface-body:    system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --typeface-display: Georgia, 'Songti SC', serif;
}
```

同时追加 shell 专用 utility 类：`.p-link`（hover 橙色+下划线）、`.p-menu-link`（导航项）、`.p-mine-item`（侧边菜单项）。

---

### ✅ Step 2：Portal Layout（已完成）

`app/portal/layout.tsx` 已挂载主题 + 全局 Toast：

```tsx
import "@/styles/themes/portal.css";
import { PortalToaster } from "@/components/portal/PortalToaster";

export default function PortalLayout({ children }) {
  return (
    <div data-platform="portal">
      <PortalToaster />
      {children}
    </div>
  );
}
```

---

### ✅ Steps 3–7：Shell 组件（已完成）

7 个 Shell 组件已实现，均使用 Tailwind + 响应式，详见 `components/portal/`。

**架构要点**：
- `PortalShell`（client）管理移动端抽屉 `mobileOpen` 状态，路由切换自动关闭
- `GlobalHeader` 接收 `onMenuToggle` prop，桌面端 `hidden lg:flex` 完整三栏，移动端 `flex lg:hidden` 品牌+汉堡
- `TopMenu` 全宽绿色导航，`hidden lg:block`，内层 `max-w-295 mx-auto flex`
- `MineShell` 内置 auth 守卫，未登录跳转 `/portal/login?redirect=...`；移动端侧边菜单降级为水平滚动 Tab
- `AuthShell` 无状态，背景图路径来自 `PORTAL_AUTH_BG` 常量

---

### Step 8：共享 UI 组件

#### 8.1 `HomeCard`（首页卡片）

**用途**：首页三个区块（最新上架/小区精选/热门推荐）的卡片，房源和小区共用同一组件。

```tsx
// 桌面端：4列 grid，卡片固定宽度
// 移动端：1列，宽度自适应

<div className="border border-border bg-white cursor-pointer group">
  {/* 图片区 */}
  <div className="mx-auto w-full lg:w-62.5 aspect-250/187 overflow-hidden">
    <RoomImage className="w-full h-full object-cover" />
  </div>
  {/* 标题 */}
  <h3 className="text-[15px] text-center h-8.5 leading-8.5 px-2 truncate
                 group-hover:text-(--color-accent) group-hover:underline">
    {name}
  </h3>
  {/* 底部信息 */}
  <div className="flex justify-between px-5 text-sm text-text-2 pb-3">
    <span>{leftText}</span>
    <span className="text-(--color-accent-dark) font-bold">{rightText}</span>
  </div>
</div>
```

父容器（首页各区块）：`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:flex lg:justify-around`

---

#### 8.2 `RoomRow`（列表房源行）

**用途**：区域/地铁/小区找房列表中的房源行。

```
桌面端：横排（图 180×135 + 信息区 + 右侧价格）
移动端：上下堆叠（图全宽 + 信息区）
```

关键 Tailwind：
- 外容器：`flex flex-col lg:flex-row lg:justify-between min-h-35 lg:min-h-43.75 p-4 lg:p-5 border-b border-dashed border-border cursor-pointer hover:bg-surface`
- 缩略图：`w-full lg:w-45 h-40 lg:h-33.75 object-cover shrink-0`
- 信息区：`flex-1 lg:pl-5 overflow-hidden text-text-2`
- 标题：`font-bold text-text text-base truncate group-hover:text-(--color-accent) group-hover:underline`
- 价格：`text-(--color-accent-dark) font-bold text-xl shrink-0 flex items-center lg:justify-end`

---

#### 8.3 `CommunityRow`（小区列表行）

同 `RoomRow`，图片改为 `w-full lg:w-36 h-32 lg:h-27`，无右侧价格列。

---

#### 8.4 `RoomTags`（标签组）

```tsx
const TAG_STYLES = {
  red:    "text-[#e88a78] bg-[#fcf4f1]",
  green:  "text-[#799374] bg-[#f2f6ed]",
  blue:   "text-[#6682ae] bg-[#f0f4f8]",
  yellow: "text-[#8b7500] bg-[#fffaf0]",
};

// 用法
<span className={`${TAG_STYLES.red} h-5.5 px-2.5 text-xs leading-5.5 rounded-2xl`}>
  整租
</span>
```

---

#### 8.5 `RoomFilterBar`（筛选栏）

**桌面端**：展开的筛选条（border 包裹，每行一个筛选维度）  
**移动端**：顶部横向滚动 Chip 快选，点击"更多"展开 bottom sheet

桌面端结构：
```
border border-border mt-5 px-2.5
  每行：flex py-1 border-b border-dashed border-border text-sm
    label（w-14 text-text-muted）
    values（flex flex-wrap gap-x-5）
      <span className="cursor-pointer hover:text-(--color-accent) hover:underline active:text-(--color-accent)">
```

筛选维度（区域找房）：
- 区域：全部 / 上城 / 下城 / 滨江 / 拱墅 / 萧山 / 余杭 / 西湖 / 钱塘
- 租金：全部 / 1000以下 / 1000-1500 / 1500-2000 / 2000-3000 / 3000-5000 / 5000以上
- 更多：房型 / 朝向 / 类型（select）+ 近地铁 / 有电梯（checkbox）

筛选维度（地铁找房）：区域改为线路（1/2/4/5/6/7/16号线）。

---

#### 8.6 `BrokerCard`（经纪人卡片）

**桌面端**：右侧 `w-[260px]` 固定宽，`min-h-[450px]`  
**移动端**：独立区块，全宽展示，置于图片下方

```
border border-border p-5
  头像：w-32.5 h-35.25 mx-auto rounded-sm object-cover
  姓名：text-center text-[15px] py-4
  信息行：text-xs text-text-2 leading-[26px] truncate
  两个按钮（outline 样式）：
    border border-primary text-primary hover:bg-primary hover:text-white
    w-full h-10 text-[15px] text-center cursor-pointer transition-colors
```

---

#### 8.7 `RoomImage`（图片容错）

见 2.4 节。封装为独立组件，全站统一使用。

---

### Step 9：首页（`app/portal/page.tsx`）

重写当前占位页面：

```
PortalShell
  <div className="max-w-295 mx-auto px-4 lg:px-0">

    {/* Hero 轮播图 */}
    <div className="w-full h-60 lg:h-117.5 mt-5 overflow-hidden bg-surface">
      <img className="w-full h-full object-cover" />
    </div>

    {/* 区块 × 3：最新上架 / 小区精选 / 热门推荐 */}
    <section className="mt-7 mb-2">
      <div className="flex items-center h-10 pl-5 text-lg">最新上架</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {rooms.map(r => <HomeCard key={r.id} />)}
      </div>
    </section>
  </div>
```

**接口**：
- `GET /api/portal/carousels` → 轮播图
- `GET /api/portal/rooms?sort=latest&limit=4`
- `GET /api/portal/communities?limit=4`
- `GET /api/portal/rooms?sort=hot&limit=4`

---

### Step 10：区域/地铁找房

**路由**：`app/portal/areaRoom/page.tsx`、`app/portal/subwayRoom/page.tsx`

```
PortalShell
  <div className="max-w-295 mx-auto px-4 lg:px-0">
    <RoomFilterBar type="area" | "subway" />

    <div className="flex flex-col lg:flex-row lg:justify-between mt-5">
      {/* 左：列表 */}
      <div className="flex-1 lg:w-225">
        {rooms.map(r => <RoomRow key={r.id} />)}
        <Pagination />
      </div>

      {/* 右：广告（移动端隐藏） */}
      <aside className="hidden lg:block lg:w-58">
        <AdSidebar />
      </aside>
    </div>
  </div>
```

**接口**：`GET /api/portal/rooms?district=&subwayLine=&minPrice=&maxPrice=&type=&page=1`

---

### Step 11：小区找房

**路由**：`app/portal/cmyRoom/page.tsx`、`app/portal/cmyRoom/[id]/page.tsx`

列表页与 Step 10 相同结构，`RoomRow` 替换为 `CommunityRow`。

小区房源列表页：
```
section-title（小区名）
小区基础信息（地址/交通标签）
<div className="flex flex-col"> {rooms.map(r => <RoomRow />)} </div>
```

---

### Step 12：房源详情（`app/portal/room/[id]/page.tsx`）

```
PortalShell
  <div className="max-w-295 mx-auto px-4 lg:px-0">
    {/* 标题 */}
    <h1 className="text-[24px] leading-12.75 tracking-wide">{name}</h1>

    {/* 基础信息标签行 */}
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 h-auto lg:h-7 mt-1.5">
      <span className="text-(--color-accent)">¥{price}/月</span>
      <RoomTags />
    </div>

    {/* 主内容：移动端单列，桌面端双列 */}
    <div className="flex flex-col lg:flex-row lg:justify-between mt-4">
      <div className="flex-1 lg:w-225">
        图片轮播（h-75 lg:h-112.5）
        房屋信息（grid grid-cols-1 lg:grid-cols-2）
        百度地图（h-60 lg:h-90）
      </div>
      <aside className="mt-5 lg:mt-0 lg:w-65 lg:ml-4">
        <BrokerCard />
      </aside>
    </div>
  </div>
```

**接口**：`GET /api/portal/rooms/[id]`（含关联小区、设施、发布者）

---

### Step 13：地图找房（`app/portal/mapRoom/page.tsx`）

此页面需要全屏地图，主内容不套容器约束：

```
PortalShell（main 为 flex-1 全宽）
  <div className="relative h-[calc(100vh-102px)] lg:h-[calc(100vh-102px)]">
    {/* 左侧浮层列表（移动端底部抽屉或上方折叠） */}
    <aside className="absolute top-5 left-5 w-70 lg:w-90 bg-white shadow-md">
      <h3 className="px-4 py-3.5 border-b border-border text-base">地图找房</h3>
      {communities.map(c => <MapListItem />)}
    </aside>

    {/* 百度地图全屏 */}
    <BaiduMap className="absolute inset-0" />

    {/* 绿色胶囊标注 */}
    {markers.map(m => <MapMarker />)}
  </div>
```

---

### Step 14：登录/注册页

**路由**：`app/portal/login/page.tsx`（已存在，需重写 UI）、`app/portal/register/page.tsx`（新建）

```
AuthShell（内部结构由 AuthShell 提供，页面只写卡片内容）
  <div className="w-100 mx-auto">
    <div className="text-[28px] font-semibold text-center mb-5">账户登录</div>

    {/* Tab：密码登录 / 手机号登录 */}
    <div className="flex justify-center border-b border-[#f0f0f0] mb-5">
      <span className="px-4 py-2.5 text-base cursor-pointer
                       text-primary border-b-2 border-primary">密码登录</span>
      <span className="px-4 py-2.5 text-base cursor-pointer text-text-2">手机号登录</span>
    </div>

    {/* 表单 */}
    <div className="space-y-4">
      <input className="w-full h-9.5 px-2.5 border border-[#d9d9d9] rounded-sm outline-none" />
      <input type="password" className="w-full h-9.5 px-2.5 border border-[#d9d9d9] rounded-sm outline-none" />
      <button className="w-full h-10 text-white bg-primary border border-primary rounded-sm cursor-pointer
                         hover:opacity-90 transition-opacity">
        登录
      </button>
    </div>
  </div>
```

**注意**：现有 `app/portal/login/page.tsx` 保留 JWT + `portalRequest` 逻辑，只重写 UI 层。

---

### Step 15：出租页面（`app/portal/sharedRoom/`）

**路由**：
- `app/portal/sharedRoom/createRoom/page.tsx`
- `app/portal/sharedRoom/createCmy/page.tsx`
- `app/portal/sharedRoom/success/page.tsx`

```
PortalShell
  <div className="max-w-295 mx-auto px-4 lg:px-0 mt-5">
    {/* Tab */}
    <div className="flex border-b border-border">
      <a className="px-5 py-2 border-b-2 border-primary text-sm">发布房源</a>
      <a className="px-5 py-2 border-b border-transparent text-sm">创建小区</a>
    </div>

    {/* 表单（2 列 grid，移动端 1 列） */}
    <div className="mt-5 p-6 lg:px-20 border border-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-6">
        <div>...</div>  {/* 各表单项 */}
        <div className="lg:col-span-2">图片上传</div>
        <div className="lg:col-span-2">描述</div>
        <div className="lg:col-span-2">
          <button className="w-full h-10 text-white bg-primary rounded-sm cursor-pointer">提交</button>
        </div>
      </div>
    </div>
  </div>
```

---

### Step 16：个人中心各页

所有页面用 `MineShell` 包裹，`title` prop 传入当前页名称：

```tsx
<MineShell title="我的收藏">
  {/* 内容区 */}
</MineShell>
```

| 页面 | 内容区结构 |
|---|---|
| `account/info` | 信息列表（头像/用户名/手机/邮箱/性别/余额）每行 `flex h-16 border-b` |
| `account/collection` | 数据表格（收藏房源/收藏时间/租金/小区/操作） |
| `account/appointment` | 数据表格（预约房源/预约时间/联系人/状态/操作） |
| `account/room` | 数据表格（房源名称/发布时间/租金/状态/操作） |
| `account/contract` | 数据表格（合同房源/签约时间/租期/状态/操作） |
| `account/orders` | 已存在，接入 `MineShell` 并对齐表格样式 |

**表格布局**：
```tsx
{/* 桌面端：grid 表格 */}
<div className="hidden lg:grid grid-cols-[1.4fr_1fr_1fr_1fr_100px] ...">表头</div>
<div className="hidden lg:grid grid-cols-[1.4fr_1fr_1fr_1fr_100px] ...">行数据</div>

{/* 移动端：卡片列表 */}
<div className="lg:hidden space-y-3 p-4">
  {items.map(item => <div className="border rounded p-3">...</div>)}
</div>
```

---

### Step 17：Portal API 接口

在 `app/api/portal/` 下新增（管理端已有对应 Prisma 数据，直接复用）：

| 接口 | 说明 |
|---|---|
| `GET /api/portal/carousels` | 首页轮播图列表 |
| `GET /api/portal/rooms` | 房源列表，支持 district/subwayLine/minPrice/maxPrice/type/page |
| `GET /api/portal/rooms/[id]` | 房源详情（含小区、设施、发布者） |
| `GET /api/portal/communities` | 小区列表，支持 district/page |
| `GET /api/portal/communities/[id]` | 小区详情 + 该小区房源 |
| `GET /api/portal/account/info` | 当前用户资料（需 portal token） |
| `PUT /api/portal/account/info` | 更新资料 |
| `GET /api/portal/account/collections` | 我的收藏 |
| `GET /api/portal/account/appointments` | 我的预约 |
| `GET /api/portal/account/contracts` | 我的合同 |
| `POST /api/portal/appointments` | 提交预约看房 |
| `POST /api/portal/rooms` | 发布房源（需 portal token） |

所有需要鉴权的接口调用 `lib/portal-auth.ts` 的 `requirePortalAuth(request)`，参照已有 orders API 的写法。

---

## 四、注意事项

### 搜索跳转
搜索框回车/点击 → `router.push(\`${PORTAL_SEARCH_PATH}?q=\${encodeURIComponent(q)}\`)`，`PORTAL_SEARCH_PATH` 已在 `utils/constants.ts` 定义。

### 城市选择
当前静态展示"杭州"。后续可接入 `CitySelector` 组件，需在 `GlobalHeader` 和 `MobileNav` 同步更新。

### 收藏按钮
房源详情页"☆ 收藏"需登录才可操作，未登录跳转 `/portal/login?redirect=/portal/room/[id]`。

### 个人中心骨架屏
`MineShell` 在 auth 检查期间返回 `null`（不白屏）。页面内的数据加载用 `skeleton-shimmer` 类搭建占位骨架。

---

## 五、开发进度

```
✅ Step 1    主题 CSS 变量
✅ Step 2    Portal Layout + PortalToaster
✅ Steps 3-7 Shell 组件（PortalShell / GlobalHeader / TopMenu /
             MobileNav / PortalFooter / AuthShell / MineShell）
✅ Step 8    共享 UI 组件（HomeCard / RoomRow / RoomFilterBar 等）
⬜ Step 9    首页
⬜ Step 14   登录/注册
✅ Step 10   区域找房 / 地铁找房（areaRoom / subwayRoom）
⬜ Step 11   小区找房
⬜ Step 12   房源详情
⬜ Step 13   地图找房
⬜ Step 15   出租页面
⬜ Step 16   个人中心各页
⬜ Step 17   Portal API 接口（已实现：carousels ✅ rooms ✅ communities ✅）
```
