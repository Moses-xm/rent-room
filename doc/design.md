# 雅阁租房系统 · 设计文档

> 本文档面向参与开发的工程师，描述系统的整体架构、数据库设计、API 规范、前端开发规范及各模块实现细节。阅读本文档后，开发者应能独立完成任意未实现模块的开发，保持与已有代码风格完全一致。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [认证机制](#3-认证机制)
4. [文件上传](#4-文件上传)
5. [数据库设计](#5-数据库设计)
6. [API 设计规范](#6-api-设计规范)
7. [前端开发规范](#7-前端开发规范)
8. [管理平台模块](#8-管理平台模块)
9. [用户平台模块](#9-用户平台模块)
10. [响应式布局要求](#10-响应式布局要求)
11. [百度地图集成](#11-百度地图集成)
12. [数据迁移说明](#12-数据迁移说明)
13. [已实现 vs 待实现](#13-已实现-vs-待实现)

---

## 1. 项目概述

雅阁租房系统是一个全栈租房平台，包含两个独立子应用：

| 子应用 | 路由前缀 | 目标用户 |
|--------|----------|----------|
| 管理平台 (Manage) | `/manage/*` | 管理员，负责后台数据的增删改查 |
| 用户平台 (Portal) | `/portal/*` | 普通用户（租客）和房东 |

两个平台共享同一套数据库，但认证体系和 UI 风格独立。

---

## 2. 技术栈

| 层次 | 技术 | 备注 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 服务端 / 客户端混合渲染 |
| UI | shadcn/ui + Tailwind CSS v4 | 组件库 + 原子化样式 |
| 数据库 | Neon Postgres + Prisma ORM | 托管 PostgreSQL |
| 认证 | 自实现 JWT (Node.js `crypto`) | HS256 签名，无外部依赖 |
| 文件存储 | Vercel Blob | 图片上传存储 |
| 部署 | Vercel | 全托管，Serverless Functions |
| 地图 | 百度地图 JavaScript API | 地址解析 / 逆解析 / 地图交互 |
| 通知 | sonner (toast) | 操作反馈提示 |

---

## 3. 认证机制

### 管理平台

- 使用自实现的 **HS256 JWT**，签名密钥来自环境变量 `MANAGE_JWT_SECRET`。
- 登录后 token 存储在 `localStorage`（key 由 `utils/manage-auth.ts` 定义）。
- 每个需要鉴权的 API Route 调用 `requireManageAuth(request)`：

```ts
// lib/manage-auth.ts
export async function requireManageAuth(request: Request): Promise<
  | { ok: true; admin: AuthenticatedAdmin }
  | { ok: false; response: NextResponse }
>
```

返回 `ok: false` 时直接 `return auth.response`，无需额外处理。

- 前端 `utils/request.ts` 的 `request()` 函数在每次请求中自动附加 `Authorization: Bearer <token>` Header。
- 若收到 401，`request()` 会自动清除 token 并重定向到 `/manage/login`。

### 用户平台

用户平台需实现独立的认证（用户注册/登录），同样使用 JWT，但签名密钥、token 存储 key、鉴权中间件需要与管理平台分开，可参照管理平台的实现方式新建 `lib/portal-auth.ts`。

---

## 4. 文件上传

所有图片统一上传至 **Vercel Blob**，通过 `lib/uploaded-file.ts` 封装的 `saveAvatarUpload` / `deleteUploadedAvatar` 操作。

### 上传流程

1. 前端选择文件 → `POST /api/upload/avatar`（FormData）
2. API 验证类型（JPG/PNG/WEBP/GIF）和大小（≤ 5MB）
3. 调用 `saveAvatarUpload(file)` → 上传到 Vercel Blob → 返回 `{ path: string }`
4. 前端将 `path` 存入表单，提交时随其他字段一起发送

### 路径规范

- 上传返回的 path 为 Vercel Blob URL（`https://...blob.vercel-storage.com/...`）
- 入库前经过 `normalizeUploadPathForStorage()` 处理
- 展示时经过 `resolveUploadedFileUrl()` 还原为可访问 URL

### 更换/删除图片

- 表单中替换图片时，旧图片调用 `DELETE /api/upload/avatar` 删除（`lib/uploaded-file.ts` 中的 `deleteUploadedAvatar`）
- 关闭表单时同样清理未保存的临时上传图片

---

## 5. 数据库设计

数据库使用 **Neon Postgres**，ORM 为 **Prisma**。所有表定义写在 `prisma/schema.prisma`。

### 设计原则

- 所有表包含 `id`（自增主键）、`createdAt DateTime @default(now())`、`updatedAt DateTime @updatedAt`
- 不使用软删除（`deleted` 字段），删除即硬删除；有外键依赖时由数据库约束阻止删除
- 老数据迁移时，MySQL 的 `deleted=1` 记录视为不存在，直接跳过
- 字段名使用 **camelCase**（Prisma 约定）

### Schema 总览

以下为完整的 `prisma/schema.prisma` 设计（`admin` 表已实现，其余待补充）：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── 管理员 ────────────────────────────────────────────────────────────────────
model Admin {
  id        Int       @id @default(autoincrement())
  username  String    @unique @db.VarChar(50)
  password  String    @db.VarChar(255)
  avatar    String?   @db.VarChar(500)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("admin")
}

// ─── 用户 ──────────────────────────────────────────────────────────────────────
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  password  String   @db.VarChar(255)
  phone     String?  @db.VarChar(20)
  nickname  String?  @db.VarChar(50)
  realname  String?  @db.VarChar(50)
  gender    Int      @default(3)           // 1=男 2=女 3=不愿透露
  identity  Int      @default(1)           // 1=普通用户 2=房东
  avatar    String?  @db.VarChar(500)
  email     String?  @db.VarChar(100)
  province  String?  @db.VarChar(30)
  city      String?  @db.VarChar(30)
  district  String?  @db.VarChar(30)
  address   String?  @db.VarChar(200)
  wallet    Float    @default(0)
  payCode   String   @default("000000") @db.VarChar(10)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  rooms        Room[]        @relation("publisher")
  collections  Collection[]
  appointments Appointment[] @relation("appointmentUser")
  contracts    Contract[]    @relation("contractUser")
  paidOrders   Order[]       @relation("payer")
  receivedOrders Order[]     @relation("payee")

  @@map("user")
}

// ─── 小区 ──────────────────────────────────────────────────────────────────────
model Community {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(50)
  province     String   @db.VarChar(30)
  city         String   @db.VarChar(30)
  district     String   @db.VarChar(30)
  street       String?  @db.VarChar(30)
  streetNumber String?  @db.VarChar(20)
  subwayLine   String?  @db.VarChar(50)    // JSON 字符串，如 ["2号线","6号线"]
  lng          Float
  lat          Float
  cover        String   @db.VarChar(500)   // 封面图片 URL
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  rooms Room[]

  @@map("community")
}

// ─── 房屋设施 ──────────────────────────────────────────────────────────────────
model Facility {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(50)
  icon      String   @db.VarChar(100)  // iconfont class name
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("facility")
}

// ─── 房源 ──────────────────────────────────────────────────────────────────────
model Room {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(200)
  cmyId        Int                          // 小区 ID
  rentType     Int                          // 1=整租 2=合租
  minTenancy   Int                          // 最短租期（月）
  bedroom      Int                          // 几室
  parlour      Int                          // 几厅
  bathroom     Int                          // 几卫
  roomType     String   @db.VarChar(20)     // 普通住宅 / 公寓
  direction    String   @db.VarChar(10)     // 朝向
  price        Float                        // 元/月
  area         Int                          // 平方米
  pledge       Int                          // 押几个月
  pay          Int                          // 付几个月
  floor        Int                          // 第几层
  floors       Int                          // 共几层
  level        Int                          // 1=低 2=中 3=高
  lift         Int                          // 1=无电梯 2=有电梯
  description  String?  @db.Text
  cover        String   @db.VarChar(500)
  images       String   @db.Text           // JSON 字符串，多张图片 URL 数组
  facilityIds  String   @db.VarChar(500)   // JSON 字符串，设施 ID 数组
  publisherId  Int
  isPublished  Int      @default(1)        // 1=未发布 2=已发布
  publishTime  DateTime?
  roomCode     String   @unique @db.VarChar(20)
  isRented     Int      @default(1)        // 1=未租出 2=已租出
  views        Int      @default(0)
  times        Int      @default(0)        // 被租出次数
  income       Float    @default(0)        // 累计收益
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  community    Community    @relation(fields: [cmyId], references: [id])
  publisher    User         @relation("publisher", fields: [publisherId], references: [id])
  collections  Collection[]
  appointments Appointment[]
  contracts    Contract[]
  orders       Order[]

  @@map("room")
}

// ─── 轮播图 ────────────────────────────────────────────────────────────────────
model Carousel {
  id        Int      @id @default(autoincrement())
  image     String   @db.VarChar(500)
  path      String   @db.VarChar(500)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("carousel")
}

// ─── 收藏 ──────────────────────────────────────────────────────────────────────
model Collection {
  id        Int      @id @default(autoincrement())
  userId    Int
  roomId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
  room Room @relation(fields: [roomId], references: [id])

  @@unique([userId, roomId])
  @@map("collection")
}

// ─── 预约看房 ──────────────────────────────────────────────────────────────────
model Appointment {
  id              Int      @id @default(autoincrement())
  userId          Int
  roomId          Int
  landlordId      Int
  appointmentTime DateTime
  landlordDeleted Boolean  @default(false)
  userDeleted     Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user     User @relation("appointmentUser", fields: [userId], references: [id])
  room     Room @relation(fields: [roomId], references: [id])
  landlord User @relation("appointmentLandlord", fields: [landlordId], references: [id])

  @@map("appointment")
}

// ─── 合同 ──────────────────────────────────────────────────────────────────────
model Contract {
  id               Int      @id @default(autoincrement())
  userId           Int
  roomId           Int
  landlordId       Int
  tenancy          Int                        // 租期（月）
  onlineTime       DateTime                   // 开始时间
  offlineTime      DateTime                   // 结束时间
  pledge           Float                      // 已付押金
  fee              Float                      // 每次房租金额
  paidPeriod       String   @db.Text          // JSON 字符串，已付期限数组
  payingPeriod     String   @db.Text          // JSON 字符串，待付期限数组
  renewTimes       Int      @default(0)
  isCheckout       Boolean  @default(false)
  checkoutTime     DateTime?
  refund           Boolean?
  landlordDeleted  Boolean  @default(false)
  userDeleted      Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user     User @relation("contractUser", fields: [userId], references: [id])
  room     Room @relation(fields: [roomId], references: [id])
  landlord User @relation("contractLandlord", fields: [landlordId], references: [id])

  @@map("contract")
}

// ─── 订单 ──────────────────────────────────────────────────────────────────────
model Order {
  id          Int      @id @default(autoincrement())
  payerId     Int
  roomId      Int
  payeeId     Int
  fee         Float?
  pledge      Float?
  paidPeriod  String?  @db.VarChar(100)   // 单个期限字符串，如 "2021.05.08-2021.08.08"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  payer User @relation("payer", fields: [payerId], references: [id])
  payee User @relation("payee", fields: [payeeId], references: [id])
  room  Room @relation(fields: [roomId], references: [id])

  @@map("order")
}
```

> **注意**：`Appointment` 和 `Contract` 中 `landlord` 关系需要在 `User` 模型中添加对应的反向关系字段 `appointmentsAsLandlord` 和 `contractsAsLandlord`，以满足 Prisma 要求。

---

## 6. API 设计规范

### 路由规则

所有 API 路由均位于 `/app/api/` 下：

- 管理平台：`/api/manage/<resource>/`
- 用户平台：`/api/portal/<resource>/`
- 通用：`/api/upload/`

### 文件组织

每个资源对应两个文件，以管理员为例：

```
app/api/manage/admin/
├── route.ts        # GET（列表）、POST（创建）
└── [id]/route.ts   # PUT（更新）、DELETE（删除）
```

### 统一响应格式

所有接口必须返回以下结构之一：

```ts
// 成功（单条数据）
{ success: true, data: T }

// 成功（列表 + 分页）
{ success: true, data: T[], total: number, page: number, limit: number, totalPages: number }

// 失败
{ success: false, message: string }
```

HTTP 状态码规则：
- `200` 成功
- `400` 参数错误（缺少必填、格式错误）
- `401` 未认证
- `404` 资源不存在
- `500` 服务端错误

### 列表接口 Query 参数规范

```
GET /api/manage/<resource>?page=1&limit=10&search=keyword
```

- `page`：页码，从 1 开始，默认 1
- `limit`：每页条数，默认 10
- `search`：可选，模糊搜索关键词

后端实现模板（以管理员为参考）：

```ts
// GET /api/manage/<resource>/route.ts
export async function GET(req: NextRequest) {
  const auth = await requireManageAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * limit;

  const where = search ? { /* 模糊查询条件 */ } : {};

  const [total, items] = await Promise.all([
    prisma.<model>.count({ where }),
    prisma.<model>.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' } }),
  ]);

  return NextResponse.json({
    success: true,
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
```

### 鉴权

每个需要登录的 API Route 第一行调用 `requireManageAuth`：

```ts
const auth = await requireManageAuth(req);
if (!auth.ok) return auth.response;
```

### 序列化

Prisma 返回的 `DateTime` 对象序列化为 ISO 8601 字符串（JSON.stringify 自动处理）。如有特殊字段（如密码隐藏），在 `lib/<model>.ts` 中写序列化函数，避免在路由中内联处理：

```ts
// lib/admin.ts 示例
export function serializeAdmin(admin: Admin) {
  const { password: _pw, ...rest } = admin;
  return {
    ...rest,
    created: rest.createdAt?.toISOString() ?? null,
    modified: rest.updatedAt?.toISOString() ?? null,
  };
}
```

---

## 7. 前端开发规范

### 页面组件规则

- 所有管理平台列表页都是 `'use client'` 组件
- 布局层（`layout.tsx`）负责侧边栏、顶栏等骨架，页面组件专注业务逻辑
- 页面最大宽度容器：`<div className="max-w-6xl mx-auto space-y-6">`

### 数据请求

统一使用 `utils/request.ts` 的 `request<T>()` 函数：

```ts
// GET 列表
const res = await request<ListResponse>(`/manage/admin?page=1&limit=10`);

// POST 创建
await request('/manage/admin', { method: 'POST', json: data });

// PUT 更新
await request(`/manage/admin/${id}`, { method: 'PUT', json: data });

// DELETE 删除
await request(`/manage/admin/${id}`, { method: 'DELETE' });
```

### 状态管理结构

每个列表页标准状态：

```ts
const [list, setList] = useState<T[]>([]);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(true);
const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // 控制骨架屏 vs 真实内容
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [query, setQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');
```

搜索防抖（300ms）：

```ts
useEffect(() => {
  const t = setTimeout(() => setDebouncedQuery(query), 300);
  return () => clearTimeout(t);
}, [query]);
```

### 通用表格：DataTable

所有桌面端列表表格使用 `components/DataTable.tsx`，通过列定义驱动渲染，内部统一处理骨架屏、加载遮罩、空态、分页。

```tsx
import DataTable, { type Column } from '@/components/DataTable';

// 列定义（useMemo 包裹，render 内可直接引用 state setters）
const columns = useMemo<Column<MyItem>[]>(() => [
  {
    key: 'name',
    label: '名称',
    render: (item) => item.name,
  },
  {
    key: 'status',
    label: '状态',
    align: 'center',              // 'left' | 'center' | 'right'
    render: (item) => <StatusPill />,
  },
  {
    key: 'actions',
    label: '操作',
    align: 'right',
    tdClassName: 'font-mono',     // 额外 td 类名
    render: (item) => <ActionButtons />,
  },
], []);

// 使用
<DataTable
  columns={columns}
  data={list}
  rowKey={(r) => r.id}
  loading={loading}
  hasLoaded={hasLoadedOnce}
  skeletonRows={5}
  emptyIcon={<SomeIcon size={36} />}
  emptyText="暂无数据"
  pagination={{ page, pageSize, total, totalPages, onPageChange, onPageSizeChange }}
/>
```

**关键 Props：**

| Prop | 说明 |
|------|------|
| `hasLoaded` | `false` 时渲染骨架屏（替代整个表格区域） |
| `loading` | `true` 时在表格上叠加半透明加载遮罩 |
| `skeletonRows` | 骨架屏行数，默认 5 |
| `emptyIcon` / `emptyText` | 无数据时的空态图标和文字 |
| `pagination` | 传入则在表格底部渲染分页；`total === 0` 时自动隐藏 |

### 加载状态

**骨架屏组件：`components/AppLoading.tsx`**

所有骨架屏统一使用 `<AppLoading>`，通过 `variant` 控制渲染形式：

| variant | 说明 | 典型使用场景 |
|---------|------|-------------|
| `'auto'`（默认）| 桌面渲染表格骨架，移动端渲染卡片骨架（CSS 切换，SSR 安全）| 列表页整体骨架 |
| `'table'` | 始终渲染表格骨架 | `DataTable` 内部（桌面端 `hidden md:block` 容器内）|
| `'card'` | 始终渲染卡片骨架 | 移动端卡片区域、详情页、表单页 |

```tsx
import AppLoading from '@/components/AppLoading';

// 列表页移动端区域
<AppLoading variant="card" rows={4} actionCount={2} />

// 详情/表单页（inline skeleton，根据实际布局手写结构）
// 不使用 AppLoading，而是直接用 skeleton-shimmer 类组合
```

**Shimmer CSS 类：**
- `skeleton-shimmer`：通用灰色波光（文字、输入框、图标）
- `skeleton-shimmer-warm`：暖色波光（头像圆形）

**各页面骨架屏规则：**

- **列表页**：`DataTable` 内部自动处理桌面端骨架（`hasLoaded={hasLoadedOnce}`）；移动端 `md:hidden` 容器内用 `<AppLoading variant="card" />`
- **详情页 / 表单页**：`if (loading)` 提前返回，用 `skeleton-shimmer` 类搭建与真实页面**布局结构完全对应**的骨架（卡片轮廓、字段行、按钮区都要对齐），不能用简单灰块替代
- **翻页/搜索刷新**（列表页）：`loading === true` 时 `DataTable` 自动叠加 `<LoadingDimmer>` 半透明遮罩，无需额外处理

> **约定**：新开发的所有页面都必须包含骨架屏，不允许白屏等待。

### 表单 Modal

- 新建和编辑复用同一个 Modal 组件（如 `admin-form-modal.tsx`）
- 通过 `ModalState` 类型区分模式：`null | { mode: 'add' } | { mode: 'edit'; item: T }`
- 表单校验在提交时同步执行，错误信息展示在对应字段下方
- 提交成功后调用 `onSaved` 回调，刷新列表

### 删除确认

使用 `<ConfirmDialog>` 组件，包含：
- `title`：确认标题
- `description`：说明（包含资源名称）
- `danger`：危险操作样式
- `loading`：删除请求中的加载状态
- `onConfirm`：确认回调

### Toast 通知

使用 `sonner` 的 `toast`：
- `toast.success(message)` — 操作成功
- `toast.error(message)` — 操作失败

在页面根节点放置 `<Toaster position="top-right" richColors />`。

### 分页组件

分页使用内联实现（见 `app/manage/admin/page.tsx`），包括首页/上一页/下一页/末页按钮，中间展示页码数字，超过 9 页使用省略号。每页条数选项：`[5, 10, 20, 50]`。

### 排版令牌

字号和字重统一由 CSS 变量维护，在 `app/globals.css` 的 `:root` 中定义，通过 `@theme inline` 映射为 Tailwind 工具类。修改排版时**只改 CSS 变量值**，组件代码无需变动。

#### 字号变量 → Tailwind 工具类

| 变量 | 默认值 | Tailwind 类 | 用途 |
|------|--------|-------------|------|
| `--fs-h1` | 26px | `text-h1` | 页面主标题（`<h1>`） |
| `--fs-h2` | 22px | `text-h2` | 弹窗 / 次级页标题（`<h2>`）|
| `--fs-h3` | 16px | `text-h3` | 卡片节标题 |
| `--fs-h4` | 14.5px | `text-h4` | 图表 / 组件标题 |
| `--fs-stat` | 32px | `text-stat` | 数据看板大数字 |
| `--fs-body` | 13px | `text-body` | 正文 |
| `--fs-body-sm` | 12.5px | `text-body-sm` | 标签、次要正文 |
| `--fs-caption` | 11.5px | `text-caption` | 说明、提示文字 |
| `--fs-tiny` | 11px | `text-tiny` | 极小辅助文字 |

#### 字重变量 → Tailwind 工具类

| 变量 | 默认值 | Tailwind 类 | 用途 |
|------|--------|-------------|------|
| `--fw-heading` | 600 | `font-heading` | 标题字重（h1–h4、stat） |
| `--fw-emphasis` | 500 | `font-emphasis` | 强调字重（标签、正文内容名） |

> **规则**：按钮、UI 徽标、动态激活态的字重直接用 Tailwind 原生类（`font-medium`、`font-semibold`），不走语义变量，避免全局字重调整误伤 UI 交互元素。

### 样式规范

- 卡片容器：`bg-white border border-slate-200 rounded-2xl shadow-sm`
- 表格头：`bg-slate-100/80 border-b border-slate-200`
- 主色按钮：`bg-primary text-white rounded-xl`
- 危险操作图标按钮：`text-slate-400 hover:text-red-500 hover:bg-red-50`
- 编辑操作图标按钮：`text-slate-400 hover:text-primary hover:bg-primary-50`
- 输入框：`border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none`

---

## 8. 管理平台模块

管理平台路由全部在 `/manage/*`，侧边栏在 `components/Sidebar.tsx` 中维护导航项。

### 8.1 已实现模块

#### 管理员登录 (`/manage/login`)

- API：`POST /api/manage/login`
- 成功后返回 JWT token，存入 localStorage

#### 管理员账号管理 (`/manage/admin`)

- API：`GET/POST /api/manage/admin`，`PUT/DELETE /api/manage/admin/[id]`
- 功能：分页列表、模糊搜索、新建、编辑（含图片上传）、删除确认、启用/禁用状态切换

#### 个人资料 (`/manage/profile`)

- API：`GET/PUT /api/manage/profile`
- 当前登录管理员修改用户名、密码、头像

#### Dashboard (`/manage`)

- 当前为静态占位页（含营收统计卡片和图表骨架），后续接入真实数据

### 8.2 待实现模块

以下模块按优先级排列，均以管理员管理为开发标准（Schema + API + 页面 + Modal）。

#### 用户管理 (`/manage/user`)

- 页面功能：用户列表（分页、搜索用户名/手机号/昵称）、新建用户、编辑用户信息、删除用户
- API：`GET/POST /api/manage/user`，`PUT /api/manage/user/[id]`，`DELETE /api/manage/user/[id]`
- 特殊字段：`identity`（用户/房东），`gender`，`wallet`，`isActive`（等效于管理员的 isActive）
- 新建时 `username`/`password` 必填；编辑时密码留空则保持不变；用户名唯一冲突返回 409

#### 小区管理 (`/manage/community`)

- 页面功能：小区列表（分页、按城市/区搜索）、新建（含百度地图定位）、编辑、删除
- API：`GET/POST /api/manage/community`，`PUT/DELETE /api/manage/community/[id]`
- 新建时：点击地图自动填充 province/city/district/street/streetNumber/lng/lat
- 图片：小区封面，单张，使用统一上传方式

#### 房源管理 (`/manage/room`)

- 页面功能：房源列表（分页、按小区/状态/发布人搜索）、查看、新建、编辑、删除
- API：`GET/POST /api/manage/room`，`PUT/DELETE /api/manage/room/[id]`
- 特殊字段：`isPublished`（发布状态）、`isRented`（租出状态）、`facilityIds`（JSON 数组）、`images`（JSON 数组）
- 富文本描述字段 `description` 建议集成 Tiptap 或 Quill

#### 房屋设施管理 (`/manage/facility`)

- 页面功能：设施列表、新建、编辑、删除
- API：`GET/POST /api/manage/facility`，`PUT/DELETE /api/manage/facility/[id]`

#### 轮播图管理 (`/manage/carousel`)

- 页面功能：轮播图列表、新建（上传图片 + 跳转路径）、编辑、删除
- API：`GET/POST /api/manage/carousel`，`PUT/DELETE /api/manage/carousel/[id]`

#### 收藏管理 (`/manage/collection`)

- 页面功能：收藏记录列表（只读，支持按用户/房源搜索）、删除
- API：`GET /api/manage/collection`，`DELETE /api/manage/collection/[id]`

#### 预约看房管理 (`/manage/appointment`)

- 页面功能：预约记录列表（只读）、按状态筛选（待看房/已看房）
- API：`GET /api/manage/appointment`

#### 合同管理 (`/manage/contract`)

- 页面功能：合同列表（只读）、按状态筛选（在租/已退房）
- API：`GET /api/manage/contract`

#### 订单管理 (`/manage/order`)

- 页面功能：订单列表（只读）、按时间/用户/房源筛选
- API：`GET /api/manage/order`

#### Dashboard 数据统计

接入真实数据，展示：
- 总房源数、在租房源数、本月订单额、用户总数
- 月度营收折线图（接入 Recharts 或 ECharts）
- 收藏量 Top10 房源

---

## 9. 用户平台模块

用户平台路由全部在 `/portal/*`，与管理平台完全独立。

### 整体架构

```
/portal                     # 首页（轮播图 + 热门推荐 + 搜索）
/portal/login               # 用户登录
/portal/register            # 用户注册
/portal/room/[id]           # 房源详情
/portal/search              # 搜索结果页
/portal/community/[id]      # 小区详情
/portal/map                 # 地图找房
/portal/profile             # 个人中心（需登录）
  /portal/profile/info      # 个人资料
  /portal/profile/rooms     # 我发布的房源
  /portal/profile/collection # 我的收藏
  /portal/profile/appointment # 我的预约
  /portal/profile/contract  # 我的合同
  /portal/profile/order     # 我的订单
```

### 认证

- 公开页面（首页、房源列表、房源详情）无需登录
- 需要登录的操作：预约、租房、发布房源、查看个人数据
- 未登录时点击需要登录的操作，弹出提示并跳转登录页

### 首页

- 轮播图（数据来自 `carousel` 表）
- 搜索框（按小区名/地址模糊搜索）
- 热门房源（按 `views` 降序 Top 8）
- 热门小区（根据房源收藏量聚合）

### 房源搜索与筛选

筛选维度（均支持 URL Query 参数，支持分享）：
- `type`：整租/合租
- `district`：区
- `priceMin` / `priceMax`：价格区间
- `bedroom`：几室
- `level`：楼层（低/中/高）
- `direction`：朝向
- `sort`：综合/最新/价格升降/面积升降

### 房源详情

- 图片轮播
- 基本信息（户型、面积、价格、押付、朝向、楼层、电梯）
- 设施展示（按整租/合租区分显示方式）
- 地图定位（百度地图）
- 房东信息
- 操作按钮：收藏、预约看房、立即租房（需登录）

### 发布房源

房东流程（两步）：
1. 选择小区（搜索已有小区，或点击"创建小区"）
2. 填写房源信息（基础信息 + 设施 + 图片 + 描述）
3. 提交："保存并发布"（`isPublished=2`）或"存为草稿"（`isPublished=1`）

### 租房交易

1. 点击"立即租房" → 选择租期（月数，≥ 最短租期且为 pay 的整数倍）、选择开始日期
2. 系统计算结束日期、首次付款金额（押金 + 首期房租）
3. 输入支付密码确认 → 扣减钱包余额
4. 创建合同记录、创建订单记录、更新房源状态为已租出
5. 跳转合同详情页

### 个人中心

| 子模块 | 说明 |
|--------|------|
| 个人资料 | 修改昵称、头像、联系方式，实名认证（成为房东前置条件）|
| 我的收藏 | 已收藏房源列表，支持取消收藏 |
| 我的房源 | 已发布房源列表，支持编辑、发布/撤回、删除 |
| 我的预约 | 预约记录，待看房/已看房分类 |
| 我的合同 | 合同列表，展示续租、付款按钮，退房操作 |
| 我的订单 | 付款记录/收款记录分类展示 |

---

## 10. 响应式布局要求

断点参考（Tailwind 默认）：

| 断点 | 前缀 | 目标设备 |
|------|------|---------|
| < 640px  | 默认 | 手机竖屏 |
| ≥ 640px  | `sm:` | 手机横屏 / 小平板 |
| ≥ 768px  | `md:` | 平板 |
| ≥ 1024px | `lg:` | 桌面 |

### 管理平台

- **侧边栏**：移动端折叠为汉堡菜单抽屉，桌面端常驻
- **表格**：移动端（`< md`）切换为**卡片列表**展示，桌面端（`≥ md`）显示完整表格；两者共用相同的数据状态与分页组件
- **页面头部**：`flex-col sm:flex-row`，操作按钮移动端全宽（`flex-1`）、桌面端自适应（`sm:flex-none`）
- **筛选输入**：搜索框移动端全宽（`w-full sm:w-60`），多筛选项用 `flex-wrap` 换行
- **表单 Modal**：移动端全屏或底部弹层展示

### 用户平台

- 所有页面完全支持移动端，导航使用底部 Tab Bar
- 筛选条件在移动端以抽屉/底部弹层展示
- 图片使用 `object-fit: cover` 自适应容器

---

## 11. 百度地图集成

### 用途

- 小区添加/编辑：点击地图定位，自动填充省市区街道经纬度
- 房源详情：展示房源在地图上的位置
- 地图找房：在地图上显示房源分布点，点击查看简要信息

### 接入方式

在 `app/layout.tsx` 或对应页面的 `<head>` 中加载百度地图 JS API：

```html
<script
  type="text/javascript"
  src="https://api.map.baidu.com/api?v=3.0&ak=YOUR_AK&callback=BMapInit"
  async
/>
```

API Key 存放在环境变量 `NEXT_PUBLIC_BAIDU_MAP_AK`（客户端可访问）。

### 核心 API

| 功能 | API |
|------|-----|
| 地图渲染 | `BMap.Map` |
| 点击获取地址 | `map.addEventListener('click', e => e.point)` + `Geocoder.getLocation()` |
| 地址解析 | `BMap.Geocoder().getPoint(address, callback, city)` |
| 逆地址解析 | `BMap.Geocoder().getLocation(point, callback)` |
| 返回字段 | `addressComponents: { province, city, district, street, streetNumber }` |

---

## 12. 数据迁移说明

从 MySQL 老数据迁移到 Neon Postgres 的脚本位于（待创建）`scripts/migrate.ts`。

### 迁移规则

1. `deleted=1` 的记录直接跳过，不迁移
2. `created` 字段（13 位毫秒时间戳字符串）转换为 `DateTime`：`new Date(parseInt(row.created))`
3. `modified`/`updatedAt` 若原始数据不存在，使用 `created` 的值
4. 图片路径（如 `["/public/upload/avatar/..."]`）：老数据为 JSON 数组字符串，迁移时取第一个元素，或保留原始格式（新代码已兼容）
5. `facility_ids` 已为 JSON 数组格式，直接迁移
6. 外键引用必须按依赖顺序迁移：`User → Community → Room → Collection/Appointment/Contract/Order`

### 字段映射对照（以 Room 为例）

| MySQL 字段 | Prisma 字段 | 转换说明 |
|-----------|-------------|----------|
| `cmy_id` | `cmyId` | camelCase |
| `rent_type` | `rentType` | camelCase |
| `room_type` | `roomType` | camelCase |
| `facility_ids` | `facilityIds` | JSON 字符串保留 |
| `publisher_id` | `publisherId` | camelCase |
| `ispublished` | `isPublished` | camelCase |
| `publish_time` | `publishTime` | 时间戳→DateTime |
| `room_code` | `roomCode` | camelCase |
| `isrented` | `isRented` | camelCase |
| `desc` | `description` | 字段重命名 |
| `created` | `createdAt` | 时间戳→DateTime |

---

## 13. 已实现 vs 待实现

### 管理平台

| 模块 | 状态 | 路由 | 说明 |
|------|------|------|------|
| 登录 | ✅ 已实现 | `/manage/login` | |
| Dashboard | 🔶 占位 | `/manage` | 静态数据，待接入真实统计 |
| 个人资料 | ✅ 已实现 | `/manage/profile` | |
| 管理员管理 | ✅ 已实现 | `/manage/admin` | 作为标准参考模块 |
| 用户管理 | ✅ 已实现 | `/manage/user` | |
| 小区管理 | ✅ 已实现 | `/manage/community` | 含百度地图，独立页面 |
| 房源管理 | ⬜ 待实现 | `/manage/room` | 含富文本编辑 |
| 房屋设施管理 | ⬜ 待实现 | `/manage/facility` | |
| 轮播图管理 | ⬜ 待实现 | `/manage/carousel` | |
| 收藏管理 | ⬜ 待实现 | `/manage/collection` | 只读列表 |
| 预约管理 | ⬜ 待实现 | `/manage/appointment` | 只读列表 |
| 合同管理 | ⬜ 待实现 | `/manage/contract` | 只读列表 |
| 订单管理 | ⬜ 待实现 | `/manage/order` | 只读列表 |

### 用户平台

| 模块 | 状态 | 路由 |
|------|------|------|
| 首页 | ⬜ 待实现 | `/portal` |
| 用户注册/登录 | ⬜ 待实现 | `/portal/register`, `/portal/login` |
| 房源列表/搜索 | ⬜ 待实现 | `/portal/search` |
| 房源详情 | ⬜ 待实现 | `/portal/room/[id]` |
| 小区详情 | ⬜ 待实现 | `/portal/community/[id]` |
| 地图找房 | ⬜ 待实现 | `/portal/map` |
| 个人中心 | ⬜ 待实现 | `/portal/profile/*` |
| 发布房源 | ⬜ 待实现 | `/portal/publish` |
| 租房交易 | ⬜ 待实现 | `/portal/rent/[roomId]` |

### 数据库

| 表 | 状态 | 说明 |
|----|------|------|
| `admin` | ✅ 已建 | |
| `user` | ✅ 已建 | 含 isActive 字段 |
| `community` | ✅ 已建 | |
| `facility` | ⬜ 待建 | |
| `room` | ⬜ 待建 | |
| `carousel` | ⬜ 待建 | |
| `collection` | ⬜ 待建 | |
| `appointment` | ⬜ 待建 | |
| `contract` | ⬜ 待建 | |
| `order` | ⬜ 待建 | |

---

*文档版本：2026-04-24 | 项目：雅阁租房系统*
