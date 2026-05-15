# 雅阁租房系统

全栈租房平台。`/manage/*` 管理平台，`/portal/*` 用户平台，共享数据库，认证独立。完整设计见 [doc/design.md](doc/design.md)。

## 技术栈
Next.js 15 App Router · shadcn/ui + Tailwind CSS v4 · Neon Postgres + Prisma · 自实现 HS256 JWT（`MANAGE_JWT_SECRET`）· Vercel Blob（`lib/uploaded-file.ts`）· 百度地图 JS API（`NEXT_PUBLIC_BAIDU_MAP_AK`）

## 开发命令
`npm run dev` · `npm run build` · `npm run lint` · `npx prisma db push`

## 数据库规范
所有表含 `id`（自增主键）、`createdAt`（`@default(now())`）、`updatedAt`（`@updatedAt`），均为非空。无软删除，硬删除。字段名 camelCase。

## API 规范
模板参照 `app/api/manage/admin/`：`route.ts` → GET(列表)/POST(创建)，`[id]/route.ts` → PUT(更新)/DELETE(删除)。
成功：`{ success: true, data }` 列表额外含 `total, page, limit, totalPages`。失败：`{ success: false, message }`（含对应 HTTP 状态码）。
每个模块在 `lib/` 下对应一个序列化文件（如 `lib/facility.ts`），所有 `Date` 字段必须显式调用 `.toISOString()`，确保 TypeScript 返回类型与前端实际收到的 JSON 一致。

## 前端规范
- 请求统一用 `utils/request.ts` 的 `request<T>()`；不满足需求时扩展参数，不另起炉灶
- 新增普通 CRUD 模块时参照管理员管理模块，保持表格/表单/筛选/分页/弹窗风格一致
- **错误处理**：`request()` 自动处理 4xx/5xx 异常并显示 toast 错误提示，页面层只需处理业务逻辑和成功提示；特殊场景（表单级错误展示、后台清理操作）传 `silent: true` 参数抑制 toast
- **骨架屏（必须）**：所有页面首次加载不允许白屏。列表页桌面端由 `DataTable` 自动处理，移动端用 `<AppLoading variant="card" />`；详情/表单页在 `if (loading)` 提前返回，用 `skeleton-shimmer` / `skeleton-shimmer-warm` 类搭建与真实布局结构对应的骨架
- **移动端分页（必须）**：列表页移动端卡片区必须在卡片列表下方渲染 `<Pagination />` 组件（条件：`hasLoadedOnce && total > 0`），禁止只渲染卡片而省略分页；桌面端分页由 `DataTable` 内部处理，移动端须手动补上
- **Toaster 禁止重复渲染**：`ManageLayoutShell` 已全局挂载 `<Toaster />`，各页面只需 `import { toast } from 'sonner'` 调用即可，**不得**在页面内再渲染 `<Toaster />`，否则会在内容区占位，导致顶部间距异常
- **全大写常量统一存放**：所有大写命名的常量（如魔法数字、枚举值、配置项）一律定义在 `utils/constants.ts`，禁止在页面或组件内就地声明
- **日期格式化**：统一使用 `utils/format.ts` 的 `fmtDate`（年月日）和 `fmtDateTime`（年月日时分），禁止在页面内就地定义同类函数
- **iconfont 图标**：字体族名不是 `iconfont`，必须用 `utils/constants.ts` 的 `FONT_FAMILY` 常量作为类名；图标类名直接使用 `facility.icon` 字段值（已含 `icon-` 前缀），写法为 `<i className={`${FONT_FAMILY} ${item.icon}`} />`，禁止拼接 `icon-${item.icon}`
- **下拉选择（必须）**：所有下拉选择一律使用 `components/FilterSelect.tsx` 的 `<FilterSelect />`，禁止使用原生 `<select>`。支持的 props：`value`、`onChange`、`options`（`{ value: string; label: string }[]`）、`placeholder`、`disabled`（级联禁用）、`clearable`（`false` 用于无空选项的必选字段，如性别、租房类型）、`error`（表单校验错误时传入，显示红色边框）、`className`（控制宽度，列表筛选传 `min-w-*`，表单内传 `w-full`）。例外：`<Pagination />` 内部的每页条数 select 和 `<CitySelector />` 不适用

## 文件上传
1. `POST /api/upload/avatar`（FormData）→ `{ path: string }`
2. 入库前 `normalizeUploadPathForStorage()`，展示时 `resolveUploadedFileUrl()`
3. 替换或关闭表单时调 `DELETE /api/upload/avatar` 清理临时文件

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
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                       # 共享 UI 组件
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
│   ├── collection.ts                 # collection 序列化
│   ├── community.ts                  # community 序列化
│   ├── facility.ts                   # facility 序列化
│   ├── user.ts                       # user 序列化
│   ├── manage-auth.ts                # JWT 签发 / 验证 / 鉴权
│   ├── prisma.ts                     # Prisma 客户端单例
│   ├── upload-path.ts                # 上传路径工具
│   └── uploaded-file.ts              # Vercel Blob 操作封装
├── utils/                            # 客户端工具
│   ├── constants.ts                  # 全大写常量统一入口
│   ├── format.ts                     # 日期格式化工具（fmtDate / fmtDateTime）
│   ├── manage-auth.ts                # token 本地存取
│   ├── manage-city.ts                # 城市数据工具
│   ├── request.ts                    # fetch 封装，自动注入 token
│   └── use-body-scroll-lock.ts       # 弹窗背景滚动锁定 hook
├── styles/
│   └── themes/
│       ├── manage.css                # Manage 平台主题（换色只改此文件）
│       └── portal.css                # Portal 平台主题（占位）
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
管理平台：登录 ✅、个人资料 ✅、管理员管理 ✅、用户管理 ✅、小区管理 ✅、轮播图管理 ✅、房屋设施管理 ✅、房源管理 ✅、收藏管理 ✅、其余模块 ⬜。用户平台：全部 ⬜。数据库：`admin` 表 ✅、`user` 表 ✅、`community` 表 ✅、`carousel` 表 ✅、`facility` 表 ✅、`room` 表 ✅、`collection` 表 ✅、`appointment` 表 ⬜（schema 已定义）、`notification` 表 ⬜（schema 已定义）、`contract` 表 ⬜、`order` 表 ⬜。

## 顶栏面包屑（必须）
每新增一个管理平台模块，**必须**同步在 `components/Topbar.tsx` 的 `resolveCrumbs` 函数中注册面包屑：
- 纯列表页（无子路由）：在 `flat` 对象里加一条 `"/manage/<module>": "模块名称"`
- 含子路由（详情/新建/编辑）：在 `flat` 之前用正则分支返回多级面包屑，参照 `room`/`community` 的写法

## 协作约定
- 回复用中文，以 **My lord** 开头
- 代码改动完成后同步更新 [doc/design.md](doc/design.md)，并告知修改了哪些部分；无需修改也须说明
- 目录结构变化时同步更新本文档「项目结构」章节
