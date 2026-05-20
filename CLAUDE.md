# 雅阁租房系统

全栈租房平台。`/manage/*` 管理平台，`/portal/*` 用户平台，共享数据库，认证独立。完整设计见 [doc/design.md](doc/design.md)。

## 技术栈
Next.js 15 App Router · shadcn/ui + Tailwind CSS v4 · Neon Postgres + Prisma · 自实现 HS256 JWT（`MANAGE_JWT_SECRET` 管理端 / `PORTAL_JWT_SECRET` 用户端）· Vercel Blob（`lib/uploaded-file.ts`）· 百度地图 JS API（`NEXT_PUBLIC_BAIDU_MAP_AK`）

## 开发命令
`npm run dev` · `npm run build` · `npm run lint` · `npx prisma db push`

## 数据库规范
所有表含 `id`（自增主键）、`createdAt`（`@default(now())`）、`updatedAt`（`@updatedAt`），均为非空。无软删除，硬删除。字段名 camelCase。

## API 规范
模板参照 `app/api/manage/admin/`：`route.ts` → GET(列表)/POST(创建)，`[id]/route.ts` → PUT(更新)/DELETE(删除)。
成功：`{ success: true, data }` 列表额外含 `total, page, limit, totalPages`。失败：`{ success: false, message }`（含对应 HTTP 状态码）。
每个模块在 `lib/` 下对应一个序列化文件（如 `lib/facility.ts`），所有 `Date` 字段必须显式调用 `.toISOString()`，确保 TypeScript 返回类型与前端实际收到的 JSON 一致。

## 文件上传
1. `POST /api/upload/avatar`（FormData）→ `{ path: string }`
2. 入库前 `normalizeUploadPathForStorage()`，展示时 `resolveUploadedFileUrl()`
3. 替换或关闭表单时调 `DELETE /api/upload/avatar` 清理临时文件

---

## 前端规范（公共）

以下规范适用于管理平台和用户平台，开发任意平台都必须遵守。

- **请求封装**：管理端统一用 `utils/request.ts` 的 `request<T>()`，用户端统一用 `utils/portal-request.ts` 的 `portalRequest<T>()`；不满足需求时扩展参数，不另起炉灶
- **错误处理**：`request()` / `portalRequest()` 自动处理 4xx/5xx 异常并显示 toast 错误提示，页面层只需处理业务逻辑和成功提示；特殊场景（表单级错误展示、后台清理操作）传 `silent: true` 参数抑制 toast
- **Toaster 禁止重复渲染**：两个平台均在 layout 层全局挂载 `<Toaster />`（Manage：`ManageLayoutShell`；Portal：`app/portal/layout.tsx` 的 `PortalToaster`），各页面只需 `import { toast } from 'sonner'` 调用，**不得**在页面内再渲染 `<Toaster />`，否则会在内容区占位导致顶部间距异常
- **全大写常量统一存放**：所有大写命名的常量（如魔法数字、枚举值、配置项）一律定义在 `utils/constants.ts`，禁止在页面或组件内就地声明
- **日期格式化**：统一使用 `utils/format.ts` 的 `fmtDate`（年月日）和 `fmtDateTime`（年月日时分），禁止在页面内就地定义同类函数
- **iconfont 图标**：字体族名不是 `iconfont`，必须用 `utils/constants.ts` 的 `FONT_FAMILY` 常量作为类名；图标类名直接使用 `facility.icon` 字段值（已含 `icon-` 前缀），写法为 `<i className={`${FONT_FAMILY} ${item.icon}`} />`，禁止拼接 `icon-${item.icon}`
- **按钮鼠标样式（必须）**：所有可点击的 `<button>` 必须加 `cursor-pointer`；若按钮有禁用态，同时加 `disabled:cursor-not-allowed`。浏览器默认不为 `<button>` 显示手形光标，必须显式声明，禁止遗漏
- **下拉选择（必须）**：两个平台均一律使用 `components/FilterSelect.tsx` 的 `<FilterSelect />`，禁止使用原生 `<select>`。支持的 props：`value`、`onChange`、`options`（`{ value: string; label: string }[]`）、`placeholder`、`disabled`（级联禁用）、`clearable`（`false` 用于无空选项的必选字段）、`error`（表单校验错误时传入，显示红色边框）、`className`（控制宽度，筛选栏传 `min-w-*`，表单内传 `w-full`）。例外：`<Pagination />` 内部的每页条数 select 和 `<CitySelector />` 不适用

---

## 管理平台规范（Manage）

以下规范仅适用于 `/manage/*`，开发用户平台时无需关注。

- 新增普通 CRUD 模块时参照管理员管理模块，保持表格/表单/筛选/分页/弹窗风格一致
- **骨架屏（必须）**：所有页面首次加载不允许白屏。列表页桌面端由 `DataTable` 自动处理，移动端用 `<AppLoading variant="card" />`；详情/表单页在 `if (loading)` 提前返回，用 `skeleton-shimmer` / `skeleton-shimmer-warm` 类搭建与真实布局结构对应的骨架
- **移动端分页（必须）**：列表页移动端卡片区必须在卡片列表下方渲染 `<Pagination />` 组件（条件：`hasLoadedOnce && total > 0`），禁止只渲染卡片而省略分页；桌面端分页由 `DataTable` 内部处理，移动端须手动补上
- **下拉选择**：规范见「前端规范（公共）」，此处不再重复
- **顶栏面包屑（必须）**：每新增一个管理平台模块，必须同步在 `components/Topbar.tsx` 的 `resolveCrumbs` 函数中注册面包屑：纯列表页在 `flat` 对象里加一条 `"/manage/<module>": "模块名称"`；含子路由（详情/新建/编辑）在 `flat` 之前用正则分支返回多级面包屑，参照 `room`/`community` 的写法

---

## 用户平台规范（Portal）

以下规范仅适用于 `/portal/*`，开发管理平台时无需关注。

- **样式（必须）**：所有组件一律用 **Tailwind CSS v4** 编写样式，禁止大量使用内联 `style={{}}`（仅允许动态计算值或极少数 Tailwind 无对应工具类的特殊场景）。颜色统一引用 `styles/themes/portal.css` 中定义的 CSS 变量，通过 Tailwind 任意值语法使用，如 `bg-[var(--color-primary)]`、`text-[var(--color-accent)]`
- **响应式（必须）**：portal 平台必须完整支持移动端，禁止仅实现桌面端。布局策略采用**移动优先**：默认全宽单列流式布局，`lg:`（≥1024px）断点切换为桌面定宽居中版本。具体规则：① 导航栏在移动端折叠为汉堡菜单抽屉或底部 Tab Bar；② 内容容器移动端 `w-full px-4`，桌面端 `max-w-[1180px] mx-auto`；③ 列表卡片网格移动端单列（`grid-cols-1`），平板两列（`sm:grid-cols-2`），桌面四列（`lg:grid-cols-4`）；④ 个人中心侧边菜单在移动端改为顶部横向标签页；⑤ 找房筛选栏在移动端以底部抽屉展示
- **Shell 组件（必须）**：所有 portal 页面必须通过对应 Shell 组件包裹：普通公开页面用 `PortalShell`，登录/注册页用 `AuthShell`，个人中心页用 `MineShell`（内置 auth 守卫，未登录自动重定向至登录页）
- **骨架屏**：首次加载不允许白屏，用 `skeleton-shimmer` / `skeleton-shimmer-warm` 类搭建与真实布局结构一致的骨架占位

---

## 项目结构

```
rent-room/
├── app/
│   ├── api/
│   │   ├── manage/
│   │   │   ├── admin/
│   │   │   │   ├── route.ts          # GET(列表) / POST(创建)
│   │   │   │   └── [id]/route.ts     # PUT(更新) / DELETE(删除)
│   │   │   ├── user/
│   │   │   │   ├── route.ts          # GET(列表) / POST(创建)
│   │   │   │   └── [id]/route.ts     # GET(详情) / PUT(更新) / DELETE(删除)
│   │   │   ├── login/route.ts
│   │   │   └── profile/route.ts
│   │   ├── portal/
│   │   │   ├── login/route.ts        # POST 用户登录（返回 JWT）
│   │   │   ├── carousels/route.ts    # GET 已发布轮播图列表
│   │   │   ├── rooms/route.ts        # GET 房源列表（sort=latest|hot，支持筛选）
│   │   │   ├── communities/route.ts  # GET 小区列表（支持 district 筛选）
│   │   │   ├── mapRoom/route.ts      # GET 地图找房（districts+communities with lat/lng+roomCount）
│   │   │   └── orders/
│   │   │       ├── route.ts          # GET 当前用户订单列表（过滤软删除）
│   │   │       └── [id]/route.ts     # DELETE 软删除（设 payerDeleted/payeeDeleted）
│   │   └── upload/
│   │       └── avatar/route.ts       # 图片上传 / 删除
│   ├── manage/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   └── admin-form-modal.tsx
│   │   ├── user/
│   │   │   ├── page.tsx
│   │   │   ├── user-form-modal.tsx
│   │   │   └── [id]/page.tsx             # 用户详情页
│   │   ├── community/
│   │   │   ├── page.tsx                  # 小区列表
│   │   │   ├── community-form.tsx        # 新建/编辑共享表单（含地图）
│   │   │   ├── new/page.tsx              # 新建小区页
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # 小区详情页
│   │   │       └── edit/page.tsx         # 编辑小区页
│   │   ├── carousel/
│   │   │   ├── page.tsx              # 轮播图卡片列表
│   │   │   └── carousel-form-modal.tsx
│   │   ├── facility/
│   │   │   ├── page.tsx              # 房屋设施列表
│   │   │   └── facility-form-modal.tsx
│   │   ├── collection/
│   │   │   ├── page.tsx              # 收藏记录列表
│   │   │   └── collection-form-modal.tsx
│   │   ├── appointment/
│   │   │   ├── page.tsx              # 预约记录列表
│   │   │   └── appointment-form-modal.tsx
│   │   ├── notification/
│   │   │   ├── page.tsx              # 通知记录列表
│   │   │   └── notification-form-modal.tsx
│   │   ├── contract/
│   │   │   ├── page.tsx              # 合同列表页
│   │   │   ├── contract-form.tsx     # 新建/编辑共享表单（含合同预览、期限计算）
│   │   │   ├── pay-modal.tsx         # 交房租弹窗
│   │   │   ├── renew-modal.tsx       # 续租弹窗
│   │   │   ├── checkout-modal.tsx    # 退房弹窗（合法/非法）
│   │   │   ├── new/page.tsx          # 新建合同页
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 合同详情页
│   │   │       └── edit/page.tsx     # 编辑合同页
│   │   ├── room/
│   │   │   ├── page.tsx              # 房源列表页
│   │   │   ├── room-form.tsx         # 新建/编辑共享表单（含 MD 编辑器、多图上传）
│   │   │   ├── new/page.tsx          # 新建房源页
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 房源详情页（含地图、MD 渲染）
│   │   │       └── edit/page.tsx     # 编辑房源页
│   │   ├── login/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Dashboard
│   ├── portal/
│   │   ├── login/page.tsx            # 用户登录页
│   │   ├── areaRoom/page.tsx         # 区域找房（筛选+列表+分页）
│   │   ├── subwayRoom/page.tsx       # 地铁找房（筛选+列表+分页）
│   │   ├── mapRoom/page.tsx          # 地图找房（百度地图+房源列表+预览）
│   │   ├── account/
│   │   │   └── orders/page.tsx       # 个人中心 - 我的订单（软删除）
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── portal/                       # Portal 平台专属组件
│   │   ├── PortalToaster.tsx         # Toaster 客户端封装（layout 层挂载）
│   │   ├── PortalFooter.tsx          # 页脚
│   │   ├── GlobalHeader.tsx          # 顶部导航（品牌+城市+搜索+用户状态）
│   │   ├── TopMenu.tsx               # 绿色主导航菜单
│   │   ├── PortalShell.tsx           # BaseLayout（Header+TopMenu+main+Footer）
│   │   ├── AuthShell.tsx             # 登录/注册布局（背景图+居中卡片）
│   │   ├── MineShell.tsx             # 个人中心布局（顶栏+横幅+侧边菜单+内容区）
│   │   ├── EmptyState.tsx            # 空状态插图组件（信封插图+文案，支持 text prop）
│   │   ├── MapRoomMap.tsx            # 地图找房地图组件（BMapGL 自定义 Overlay：区县圆/小区标签）
│   │   ├── MapRoomPage.tsx           # 地图找房整页（自定义全屏布局+房源列表+预览面板）
│   ├── RoomImage.tsx             # 图片容错占位封装（onError → 斜线占位 div）
│   │   ├── RoomTags.tsx              # 颜色标签组（red/green/blue/yellow 四色）
│   │   ├── HomeCard.tsx              # 首页房源/小区卡片（4 列 grid）
│   │   ├── HeroCarousel.tsx          # 首页 Hero 自动轮播（client，含圆点导航）
│   │   ├── RoomRow.tsx               # 列表页房源行（横排桌面 / 堆叠移动端）
│   │   ├── RoomListPage.tsx          # 区域/地铁找房共享页面组件（含骨架屏、fetch 逻辑）
│   │   ├── CommunityRow.tsx          # 小区列表行（同 RoomRow，无右侧价格列）
│   │   ├── BrokerCard.tsx            # 房源详情经纪人卡片（头像+信息+两按钮）
│   │   ├── AdSidebar.tsx             # 找房页右侧广告占位（桌面端 w-58，移动端隐藏）
│   │   └── RoomFilterBar.tsx         # 筛选栏（桌面三行展开 / 移动端 chip+底部抽屉）
│   ├── AppLoading.tsx
│   ├── BaiduMapPicker.tsx            # 百度地图选点组件（双向联动）
│   ├── CitySelector.tsx
│   ├── ConfirmDialog.tsx
│   ├── DataTable.tsx                 # 通用泛型表格（列定义+数据+分页+空态+骨架屏）
│   ├── FilterSelect.tsx              # 自定义下拉筛选（fixed 定位，防移动端溢出）
│   ├── LoadingDimmer.tsx
│   ├── ManageLayoutShell.tsx
│   ├── Modal.tsx                     # 所有弹窗的基础容器（遮罩+滚动锁定）
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── lib/                              # 服务端工具
│   ├── admin.ts                      # admin 序列化
│   ├── carousel.ts                   # carousel 序列化
│   ├── appointment.ts                # appointment 序列化
│   ├── collection.ts                 # collection 序列化
│   ├── community.ts                  # community 序列化
│   ├── facility.ts                   # facility 序列化
│   ├── notification.ts               # notification 序列化
│   ├── contract.ts                   # contract 序列化（含 generatePeriods/addMonths 工具函数）
│   ├── user.ts                       # user 序列化
│   ├── manage-auth.ts                # 管理端 JWT 签发 / 验证 / 鉴权
│   ├── portal-auth.ts                # 用户端 JWT 签发 / 验证 / 鉴权
│   ├── prisma.ts                     # Prisma 客户端单例
│   ├── upload-path.ts                # 上传路径工具
│   └── uploaded-file.ts              # Vercel Blob 操作封装
├── utils/                            # 客户端工具
│   ├── constants.ts                  # 全大写常量统一入口
│   ├── format.ts                     # 日期格式化工具（fmtDate / fmtDateTime）
│   ├── manage-auth.ts                # 管理端 token 本地存取
│   ├── portal-auth.ts                # 用户端 token 本地存取
│   ├── manage-city.ts                # 城市数据工具
│   ├── request.ts                    # 管理端 fetch 封装，自动注入 token
│   ├── portal-request.ts             # 用户端 fetch 封装，自动注入 portal token
│   ├── portal-room.ts                # Portal 房源列表共享类型与 helper（RoomItem、buildRoomTags 等）
│   └── use-body-scroll-lock.ts       # 弹窗背景滚动锁定 hook
├── styles/
│   └── themes/
│       ├── manage.css                # Manage 平台主题（换色只改此文件）
│       └── portal.css                # Portal 平台主题（绿色系+橙色 accent+shell utility 类）
├── prisma/
│   └── schema.prisma
├── localData/                        # 城市等静态数据
│   ├── area.json
│   ├── areaSimple.json
│   └── hotcities.json
└── public/
    ├── font/                         # iconfont 字体
    └── images/                       # 静态图片资源
```

## 实现状态
管理平台：登录 ✅、个人资料 ✅、管理员管理 ✅、用户管理 ✅、小区管理 ✅、轮播图管理 ✅、房屋设施管理 ✅、房源管理 ✅、收藏管理 ✅、预约管理 ✅、通知管理 ✅、合同管理 ✅、其余模块 ⬜。用户平台：登录 ✅、首页 ✅、区域找房 ✅、地铁找房 ✅、小区找房 ✅、小区房源列表 ✅、房源详情 ✅、地图找房 ✅、我的订单 ✅、其余模块 ⬜。数据库：`admin` 表 ✅、`user` 表 ✅、`community` 表 ✅、`carousel` 表 ✅、`facility` 表 ✅、`room` 表 ✅、`collection` 表 ✅、`appointment` 表 ✅、`notification` 表 ✅、`contract` 表 ✅、`order` 表 ✅、`wallet_record` 表 ✅。Portal API：轮播图 ✅、房源列表（含 district/subwayLine/price/rentType/cmyId 筛选）✅、房源详情（含设施、发布者、浏览计数）✅、小区列表（含 city/district 筛选）✅、小区详情+房源 ✅、地图找房（districts+communities）✅、其余 ⬜。

## 协作约定
- 回复用中文，以 **My lord** 开头
- 代码改动完成后同步更新 [doc/design.md](doc/design.md)，并告知修改了哪些部分；无需修改也须说明
- 目录结构变化时同步更新本文档「项目结构」章节
