# Portal 前端还原实施手册

> 目标：将 `public/prototype/` 高保真静态原型，原原本本地移植为 Next.js App Router 实现，做到视觉、布局、交互风格与原型一致。

---

## 一、原型全面分析

### 1.1 色彩体系

| 用途 | 颜色值 | 说明 |
|---|---|---|
| 品牌/导航栏背景 | `#62ab00` | 绿色，top-menu、按钮、active 分页、边框 |
| 品牌色（Logo） | `#48a841` | 略深的绿，header brand 文字、auth 底边线 |
| 导航 hover/active 深绿 | `#4a8101` | top-menu 菜单项 hover 背景 |
| 搜索按钮橙色 | `#f60` (`#ff6600`) | 搜索按钮背景、链接 hover 色、filter 激活色 |
| 价格橙红色 | `#eb5f00` | 房价文字颜色 |
| 主文字 | `#333` | 标题、正文 |
| 次要文字 | `#666` / `#797979` | 描述、说明 |
| 更弱文字 | `#999` | filter label、表头 |
| 边框 | `#e6e6e6` | 卡片、分割线 |
| 浅背景 | `#f9f9f9` / `#f1f1f1` | hover 背景、个人中心页面底色 |
| 标签色（4种）| red `#fcf4f1/#e88a78`、green `#f2f6ed/#799374`、blue `#f0f4f8/#6682ae`、yellow `#fffaf0/#8b7500` | 房源/小区标签 |

### 1.2 页面清单（共 17 个路由）

| 路径 | 页面 | 布局类型 |
|---|---|---|
| `/portal` | 首页 | BaseLayout |
| `/portal/areaRoom` | 区域找房 | BaseLayout |
| `/portal/subwayRoom` | 地铁找房 | BaseLayout |
| `/portal/cmyRoom` | 小区找房 | BaseLayout |
| `/portal/cmyRoom/[id]` | 小区房源列表 | BaseLayout |
| `/portal/room/[id]` | 房源详情 | BaseLayout |
| `/portal/mapRoom` | 地图找房 | BaseLayout |
| `/portal/login` | 登录 | AuthLayout |
| `/portal/register` | 注册 | AuthLayout |
| `/portal/sharedRoom/createRoom` | 发布房源 | BaseLayout（需登录） |
| `/portal/sharedRoom/createCmy` | 创建小区 | BaseLayout（需登录） |
| `/portal/sharedRoom/success` | 提交成功 | BaseLayout |
| `/portal/account/info` | 我的资料 | MineLayout |
| `/portal/account/collection` | 我的收藏 | MineLayout |
| `/portal/account/appointment` | 我的预约 | MineLayout |
| `/portal/account/room` | 我的房源 | MineLayout |
| `/portal/account/contract` | 我的合同 | MineLayout |
| `/portal/account/orders` | 我的订单 | MineLayout（已存在） |

### 1.3 布局结构

**BaseLayout（通用）**
```
┌─────────────────────────────────────────────┐  高度
│  GlobalHeader：品牌 + 城市 + 搜索 + 用户链接  │  62px
├─────────────────────────────────────────────┤
│  TopMenu：绿色导航栏（6个菜单项）             │  40px
├─────────────────────────────────────────────┤
│  <main> 页面内容区 1180px 居中                │  弹性
├─────────────────────────────────────────────┤
│  Footer：链接行 + 版权行                      │  117px
└─────────────────────────────────────────────┘
```

**AuthLayout（登录/注册）**
```
全屏背景图 → auth-header（品牌 + 导航）+ 居中白色卡片（540px）
```

**MineLayout（个人中心）**
```
┌──────────────────────────────────────────────┐
│  MineHeader：绿色顶栏，品牌 + "个人中心" + 退出│  55px
├──────────────────────────────────────────────┤
│  MineBanner：用户横幅（头像 + 姓名欢迎词）     │  100px
├─────────────┬────────────────────────────────┤
│ MineSider   │ MineContainer（白色内容区）       │  弹性
│ 200px       │ 960px                            │
│ 菜单导航     │                                  │
└─────────────┴────────────────────────────────┘
```

### 1.4 可复用组件清单

| 组件 | 位置建议 | 说明 |
|---|---|---|
| `GlobalHeader` | `components/portal/GlobalHeader.tsx` | 品牌、城市选择、搜索框、用户链接 |
| `TopMenu` | `components/portal/TopMenu.tsx` | 绿色导航，高亮当前路径 |
| `PortalFooter` | `components/portal/PortalFooter.tsx` | 三行页脚 |
| `PortalShell` | `components/portal/PortalShell.tsx` | BaseLayout 包裹器 |
| `MineShell` | `components/portal/MineShell.tsx` | MineLayout 包裹器 |
| `HomeCard` | `components/portal/HomeCard.tsx` | 首页卡片（房源/小区） |
| `RoomRow` | `components/portal/RoomRow.tsx` | 列表页房源行 |
| `CommunityRow` | `components/portal/CommunityRow.tsx` | 小区列表行 |
| `RoomFilterBar` | `components/portal/RoomFilterBar.tsx` | 筛选栏（区域/地铁/租金/更多） |
| `RoomTags` | `components/portal/RoomTags.tsx` | 颜色标签组（red/green/blue/yellow） |
| `BrokerCard` | `components/portal/BrokerCard.tsx` | 房源详情右侧经纪人卡片 |
| `PortalPagination` | `components/portal/PortalPagination.tsx` | 绿色分页组件 |
| `AdSidebar` | `components/portal/AdSidebar.tsx` | 列表页右侧广告占位 |

---

## 二、实施路线图（分步骤）

---

### Step 1：更新主题色（`styles/themes/portal.css`）

**目标**：把占位的天蓝色换为原型的绿色 + 橙色体系。

修改 `styles/themes/portal.css`，将变量值替换为：

```css
[data-platform="portal"] {
  --color-primary:        #62ab00;
  --color-primary-dark:   #4a8101;
  --color-primary-brand:  #48a841;
  --color-primary-tint:   #f2f6ed;
  --color-primary-tint-2: #eaf2e0;

  --color-accent:         #ff6600;   /* 橙色：搜索按钮、hover、激活 */
  --color-accent-dark:    #eb5f00;   /* 价格文字橙红 */

  --color-text:           #333333;
  --color-text-2:         #666666;
  --color-text-muted:     #999999;
  --color-text-subtle:    #797979;

  --color-surface:        #f9f9f9;
  --color-surface-2:      #f1f1f1;
  --color-card:           #ffffff;

  --color-border:         #e6e6e6;
  --color-border-subtle:  #eeeeee;

  --typeface-body: Arial, 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', sans-serif;
}
```

---

### Step 2：更新 Portal Layout（`app/portal/layout.tsx`）

**目标**：挂载 `data-platform="portal"` 让主题变量生效，引入字体。

```tsx
// app/portal/layout.tsx
import "@/styles/themes/portal.css";

export default function PortalLayout({ children }) {
  return (
    <div data-platform="portal" className="min-h-screen">
      {children}
    </div>
  );
}
```

---

### Step 3：创建 `PortalShell`（BaseLayout）

**文件**：`components/portal/PortalShell.tsx`

包含：`GlobalHeader` + `TopMenu` + `<main>` + `PortalFooter`，所有 BaseLayout 页面用这个组件包裹。

关键样式点：
- `.page-shell`：`width: 1180px; margin: 0 auto;`
- `main.main-container`：`min-height: calc(100vh - 102px)`（102 = 62 + 40）

---

### Step 4：创建 `GlobalHeader`

**文件**：`components/portal/GlobalHeader.tsx`

结构（从原型 `baseLayout()` 提取）：
```
<header class="global-header"> （高度 62px）
  左侧：品牌文字（绿色 #48a841，25px）+ 城市选择（灰色，含 <span> 绿色城市名）
  右侧：搜索框（480px input + 120px 橙色"搜索"按钮）+ 用户链接区
</header>
```

**注意点**：
- 搜索框按钮背景 `#f60`，`letter-spacing: 4px`，border-radius 只有右侧
- 城市名 `<span>` 颜色 `#62ab00`
- 用户链接 hover 变橙色 + 下划线
- 用户状态：未登录显示"登录 | 注册 | 个人中心"，已登录显示用户名 + 个人中心 + 退出

---

### Step 5：创建 `TopMenu`

**文件**：`components/portal/TopMenu.tsx`

```
<nav class="top-menu"> （高度 40px，背景 #62ab00）
  首页 | 区域找房 | 地铁找房 | 小区找房 | 地图找房 | 我要出租
</nav>
```

**注意点**：
- 每个菜单项 `padding: 0 25px; line-height: 40px; color: #fff; font-size: 16px`
- active / hover 背景 `#4a8101`
- 用 Next.js `usePathname()` 判断高亮项

---

### Step 6：创建 `PortalFooter`

**文件**：`components/portal/PortalFooter.tsx`

```
<footer class="footer-full"> （高度 117px，背景 #f9f9f9，上边框 #e6e6e6）
  .footer（1180px 居中）：
    关于我们 | 联系我们 | 用户协议 | 隐私政策
    Copyright © 2026 雅阁租房系统 All Rights Reserved
</footer>
```

---

### Step 7：创建 `MineShell`（个人中心布局）

**文件**：`components/portal/MineShell.tsx`

结构：
1. `mine-header-full`：绿色顶栏 55px（品牌 | 个人中心 + 退出按钮）
2. `mine-sub-full`：banner 图 100px（头像 + 用户名 + 欢迎语）
3. `mine-content`（1180px 居中）：
   - `mine-sider`（200px）：菜单项列表，`border-left: 3px solid transparent`，active/hover 绿色
   - `mine-container`（960px）：白色内容区，上方有 `mine-title`（54px 带底边线）

**菜单项**：我的资料 / 我的收藏 / 我的预约 / 我的房源 / 我的合同 / 我的订单

---

### Step 8：创建共享 UI 组件

#### 8.1 `HomeCard`（首页卡片）
- 尺寸 280×288px，边框 `#e6e6e6`
- 图片区 250×187px，居中 margin
- 标题 `text-align: center; font-size: 15px`，hover 变橙+下划线
- 底部信息两端分布：左（户型/地区），右（价格/套数）红橙色

#### 8.2 `RoomRow`（列表房源行）
- flex 布局，min-height 175px，padding 20px，底部 `dashed #e6e6e6`
- 缩略图 180×135px，左对齐
- 信息区（528px）：标题 + 户型面积朝向楼层 + 小区地址 + Tags
- 右侧价格：`font-size: 20px; color: #eb5f00; font-weight: bold`
- hover 整行背景 `#f9f9f9`，标题变橙色

#### 8.3 `CommunityRow`（小区列表行）
- 同 RoomRow 但 min-height 140px，图 144×108px

#### 8.4 `RoomTags`
- 4色圆角标签（tag-red/green/blue/yellow），height 22px，border-radius 16px

#### 8.5 `RoomFilterBar`
- 筛选栏外框 `border: 1px solid #e6e6e6`
- 每行：label（58px, `#999`） + values（flex-wrap，间距 20px）
- active/hover 颜色 `#f60` + 下划线
- 最后一行（更多）：select-chip 下拉（93px 小型 select）+ 近地铁/有电梯复选框

#### 8.6 `BrokerCard`（经纪人卡片）
- 右侧 260px 卡片，高度 450px，边框 `#e6e6e6`
- 头像 130×141px，居中圆角 2px
- 姓名、电话/邮箱/服务区域（font-size: 13px, color: #666）
- 两个 `outline-btn`：`border: 1px solid #62ab00; color: #62ab00; hover: 绿色背景白字`

#### 8.7 `PortalPagination`
- 每项 32×32px，`border: 1px solid #d9d9d9`，active 绿色背景
- flex 右对齐，margin 20px 0

#### 8.8 `AdSidebar`（广告侧边栏）
- 232px 宽，`adv-box` 卡片 248px 高，`border: 1px solid #ccc; border-radius: 5px`

---

### Step 9：实现首页（`app/portal/page.tsx`）

重写当前占位页面，结构：
1. `PortalShell` 包裹
2. Hero 轮播图：`.hero-carousel`，高度 470px，全宽 → 接 `/api/portal/carousels` 接口
3. "最新上架"区块：section-title + 4张 `HomeCard`（最新房源）→ 接 `/api/portal/rooms?sort=latest&limit=4`
4. "小区精选"区块：4张 `HomeCard`（小区）→ 接 `/api/portal/communities?limit=4`
5. "热门推荐"区块：4张 `HomeCard`（房源）→ 接 `/api/portal/rooms?sort=hot&limit=4`

**section-title 样式**：height 40px，padding-left 20px，font-size 18px，flex 居中

---

### Step 10：实现区域/地铁找房（`app/portal/areaRoom/page.tsx` 等）

结构：
```
RoomFilterBar（type="area" 或 "subway"）
<div class="content-two-col"> （flex justify-between）
  <div class="room-part">（900px）
    {rooms.map(RoomRow)}
    PortalPagination
  </div>
  <AdSidebar />（232px）
</div>
```

**接口**：`GET /api/portal/rooms?district=XX&minPrice=XX&maxPrice=XX&page=1`

**筛选项**：
- 区域找房：区域（全部/上城/下城/滨江/拱墅/萧山/余杭/西湖/钱塘）
- 地铁找房：线路（1/2/4/5/6/7/16号线）
- 租金区间：全部/1000以下/1000-1500/1500-2000/2000-3000/3000-5000/5000以上
- 更多：房型/朝向/类型 select + 近地铁/有电梯 checkbox

---

### Step 11：实现小区找房（`app/portal/cmyRoom/page.tsx`）

结构与区域找房类似，列表用 `CommunityRow` 替换 `RoomRow`。

小区房源列表页（`app/portal/cmyRoom/[id]/page.tsx`）：
```
section-title（小区名称）
小区信息 filter-room（地址/交通/特点）
room-part（该小区所有 RoomRow）
```

---

### Step 12：实现房源详情（`app/portal/room/[id]/page.tsx`）

结构：
```
<h1 class="room-title">房源标题</h1>
<div class="title-basic-info">价格 | 户型 | 面积 | Tags | 收藏</div>
<div class="detail-content"> （flex justify-between）
  <div class="detail-left">（900px）
    <div class="detail-images">图片轮播</div>
    <div class="house-info-head">房屋信息</div>
    <div class="house-info-detail">价格/押金/户型/面积/朝向/楼层/小区/地址/描述</div>
    <div class="house-info-head">位置及周边</div>
    <BaiduMap />（高度 360px）
  </div>
  <aside class="detail-right">（260px）
    <BrokerCard />
  </aside>
</div>
```

**接口**：`GET /api/portal/rooms/[id]`

---

### Step 13：实现地图找房（`app/portal/mapRoom/page.tsx`）

```
<div class="map-page">（高度 calc(100vh - 102px)，百度地图背景）
  <aside class="map-side">（左上 360px 浮层）
    h3：地图找房
    {communities.map(map-list-item)}  // 小区名/地址/价格起
  </aside>
  <BaiduMap 全屏 />
  {mapMarkers}  // 绿色胶囊标注
</div>
```

---

### Step 14：更新登录/注册页（`app/portal/login/page.tsx`、`register/page.tsx`）

**AuthLayout 结构**：
```
<div class="auth-shell">（全屏背景图 bg.jpg / portal 自备背景）
  <header class="auth-header">（62px，底边 2px solid #48a841）
    品牌 logo + 右侧"登录 | 注册"导航
  </header>
  <div class="auth-card">（540px 居中，margin-top: 150px，白色卡片，box-shadow）
    auth-title（登录/注册）
    tabs（密码登录/手机号登录 或 普通注册/房东注册）
    表单字段 + primary-btn（绿色全宽按钮）
  </div>
</div>
```

**注意**：现有 `app/portal/login/page.tsx` 需完全重写 UI，但保留已有 JWT 逻辑。

---

### Step 15：实现出租页面（`app/portal/sharedRoom/`）

`createRoom` 和 `createCmy` 共享 `SharedRoomForm` 组件：
- `shared-tabs`：发布房源 / 创建小区（tab 切换）
- `shared-content`：2列 `form-grid` 表单
- `primary-btn` 提交

路由：
- `app/portal/sharedRoom/createRoom/page.tsx`
- `app/portal/sharedRoom/createCmy/page.tsx`
- `app/portal/sharedRoom/success/page.tsx`（成功页：绿色✓ + "提交成功"）

---

### Step 16：实现个人中心各页

所有页面用 `MineShell` 包裹，差异仅在内容区：

| 页面 | 内容区结构 |
|---|---|
| `account/info` | `info-list`（info-item 行：头像/用户名/手机/邮箱/性别/余额 + 修改按钮） |
| `account/collection` | table（收藏房源/收藏时间/租金/小区/操作） |
| `account/appointment` | table（预约房源/预约时间/联系人/状态/操作） |
| `account/room` | table（房源名称/发布时间/租金/状态/操作） |
| `account/contract` | table（合同房源/签约时间/租期/状态/操作） |
| `account/orders` | 已存在，接入 `MineShell` 并更新 UI 风格 |

**table 结构**：`grid-template-columns: 1.4fr 1fr 1fr 1fr 100px`，表头 `#fafafa`，行底边虚线

---

### Step 17：新增 Portal API 接口

需要在 `app/api/portal/` 下新增以下接口（管理端已有对应数据，复用 Prisma）：

| 接口 | 说明 |
|---|---|
| `GET /api/portal/rooms` | 房源列表，支持 district/subway/price/type/page 过滤 |
| `GET /api/portal/rooms/[id]` | 房源详情 + 关联小区、设施、经纪人 |
| `GET /api/portal/communities` | 小区列表 |
| `GET /api/portal/communities/[id]` | 小区详情 + 该小区房源 |
| `GET /api/portal/carousels` | 首页轮播图 |
| `GET /api/portal/account/info` | 当前用户资料（需 portal token） |
| `PUT /api/portal/account/info` | 更新用户资料 |
| `GET /api/portal/account/collections` | 我的收藏 |
| `GET /api/portal/account/appointments` | 我的预约 |
| `GET /api/portal/account/contracts` | 我的合同 |
| `POST /api/portal/appointments` | 提交预约看房 |
| `POST /api/portal/rooms` | 发布房源（需登录） |

---

### Step 18：面包屑注册（`components/Topbar.tsx`）

Portal 页面不使用管理端 `Topbar`，无需修改。  
若未来 portal 有独立面包屑需求，在 `MineShell` 的 `mine-title` 中显示当前页名即可。

---

### Step 19：整合现有 portal/account/orders 页面

现有 `app/portal/account/orders/page.tsx` 已有软删除逻辑，需要：
1. 将页面包裹进 `MineShell`（替换自有布局）
2. 更新表格 UI 为原型 `table-card` 风格
3. 操作列改为原型的"查看 | 删除"链接样式

---

## 三、关键注意事项

### 宽度约定
原型固定 1180px 容器，不考虑响应式。Portal 平台按同样策略处理，`min-width: 1180px`，在移动端不强制适配（或后续单独任务处理）。

### 搜索框行为
- 搜索跳转到 `/portal/areaRoom?q=关键词`
- 城市选择暂时静态展示"杭州"，后续接入 `CitySelector`

### 图片容错
所有 `<img>` 加 `onError` 展示灰色占位（对应原型的 `makePlaceholder()`），可封装为 `<RoomImage>` 组件统一处理。

### 收藏按钮
房源详情页"☆ 收藏"需登录才可操作；未登录点击跳转 `/portal/login?redirect=...`。

### 个人中心权限
`MineShell` 内部检查 portal token，未登录统一跳转 `/portal/login`。

---

## 四、开发顺序建议

```
Step 1-2   → 主题 + layout（30 min）
Step 3-7   → 5个布局/Shell 组件（1.5 h）
Step 8     → 8个 UI 组件（2 h）
Step 9     → 首页（1 h）
Step 14    → 登录/注册（1 h）
Step 10-11 → 找房列表页（1.5 h）
Step 12    → 房源详情（1.5 h）
Step 13    → 地图找房（1 h）
Step 15    → 出租页面（1 h）
Step 16+19 → 个人中心（2 h）
Step 17    → Portal API（2 h）
```

预计总工时：**~15 小时**，可按模块拆分为多次会话独立推进。
