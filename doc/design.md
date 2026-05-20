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
  rooms                  Room[]         @relation("publisher")
  collections            Collection[]
  appointmentsAsUser     Appointment[]  @relation("appointmentUser")     // 作为租客的预约
  appointmentsAsLandlord Appointment[]  @relation("appointmentLandlord") // 作为房东收到的预约
  contractsAsUser        Contract[]     @relation("contractUser")        // 作为租客的合同
  contractsAsLandlord    Contract[]     @relation("contractLandlord")    // 作为房东收到的合同
  paidOrders             Order[]        @relation("payer")
  receivedOrders         Order[]        @relation("payee")
  notifications          Notification[]
  walletRecords          WalletRecord[]

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
  published Boolean  @default(false)
  sortOrder Int      @default(0)
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
  userId          Int                          // 预约者（租客）
  roomId          Int
  landlordId      Int                          // 房东（来自 room.publisherId）
  appointmentTime DateTime                     // 预约看房时间
  status          Int      @default(1)         // 1=待看房 2=已完成 3=已取消 4=已过期
  cancelledBy     Int?                         // 取消操作者 userId（status=3 时记录）
  completedBy     Int?                         // 完成标记者 userId（status=2 时记录，任一方触发）
  remark          String?  @db.VarChar(500)    // 预约备注（可选，用户填写）
  userDeleted     Boolean  @default(false)     // 租客侧隐藏该记录（对房东无影响）
  landlordDeleted Boolean  @default(false)     // 房东侧隐藏该记录（对租客无影响）
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user     User @relation("appointmentUser",     fields: [userId],     references: [id])
  room     Room @relation(fields: [roomId], references: [id])
  landlord User @relation("appointmentLandlord", fields: [landlordId], references: [id])

  @@map("appointment")
}

// ─── 通知 ──────────────────────────────────────────────────────────────────────
model Notification {
  id          Int      @id @default(autoincrement())
  userId      Int                              // 通知接收者
  type        Int                              // 见"通知类型枚举"章节
  title       String   @db.VarChar(200)
  content     String   @db.VarChar(500)
  relatedType String?  @db.VarChar(50)         // 关联业务类型，如 "appointment"、"contract"、"order"
  relatedId   Int?                             // 关联记录 ID
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@map("notification")
}

// ─── 合同 ──────────────────────────────────────────────────────────────────────
model Contract {
  id               Int      @id @default(autoincrement())
  userId           Int                        // 租客
  roomId           Int
  landlordId       Int                        // 房东
  tenancy          Int                        // 租期（月）
  onlineTime       DateTime                   // 开始时间
  offlineTime      DateTime                   // 结束时间
  pledge           Float                      // 已付押金金额
  fee              Float                      // 每期应付房租金额（= 月租 × pay 期数，例如押一付三则 fee = price × 3）
  paidPeriod       String   @db.Text          // JSON，已付期限数组 [{start,end}, ...]
  payingPeriod     String   @db.Text          // JSON，待付期限数组 [{start,end}, ...]
  renewTimes       Int      @default(0)       // 续租次数
  status           Int      @default(1)       // 1=进行中 2=已完成
  isCheckout       Boolean  @default(false)   // 是否已退房（合法或非法）
  checkoutTime     DateTime?                  // 退房时间
  refund           Boolean?                   // true=合法退房(退押金) false=非法退房(不退押金) null=未退房
  landlordDeleted  Boolean  @default(false)   // 房东侧隐藏该记录
  userDeleted      Boolean  @default(false)   // 租客侧隐藏该记录（仅 status=2 后允许）
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user     User    @relation("contractUser",     fields: [userId],     references: [id])
  room     Room    @relation(fields: [roomId],   references: [id])
  landlord User    @relation("contractLandlord", fields: [landlordId], references: [id])
  orders   Order[]

  @@map("contract")
}

// ─── 订单 ──────────────────────────────────────────────────────────────────────
model Order {
  id          Int      @id @default(autoincrement())
  contractId  Int                              // 关联合同
  payerId     Int                              // 付款人（租客；押金退款时角色反转为房东）
  roomId      Int
  payeeId     Int                              // 收款人（房东；押金退款时为租客）
  type        Int      @default(1)             // 1=首期款(押金+首期房租) 2=续期房租 3=押金退款
  fee         Float?                           // 本次房租金额（退款订单为 null）
  pledge      Float?                           // 本次押金金额（首期及退款订单有值）
  paidPeriod  String?  @db.VarChar(200)        // 本次覆盖的房租时间段，如 "2025-05-01~2025-08-01"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contract      Contract       @relation(fields: [contractId], references: [id])
  payer         User           @relation("payer", fields: [payerId],  references: [id])
  payee         User           @relation("payee", fields: [payeeId],  references: [id])
  room          Room           @relation(fields: [roomId], references: [id])
  walletRecords WalletRecord[]

  @@map("order")
}

// ─── 钱包消费记录 ──────────────────────────────────────────────────────────────
model WalletRecord {
  id        Int      @id @default(autoincrement())
  userId    Int                                // 记录归属用户
  amount    Float                              // 金额（正数=收入，负数=支出）
  type      Int                                // 1=充值 2=支付租房 3=收款(房东) 4=退押金
  remark    String?  @db.VarChar(200)          // 备注说明
  orderId   Int?                               // 关联订单（充值类型无关联）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User   @relation(fields: [userId],  references: [id])
  order Order? @relation(fields: [orderId], references: [id])

  @@map("wallet_record")
}
```

> **关系说明**：`Contract` 通过 `"contractUser"` / `"contractLandlord"` 两个命名关系绑定到 `User`，对应 `User` 侧的 `contractsAsUser` / `contractsAsLandlord`。`Order` 通过 `contractId` 与 `Contract` 关联，每次付款产生一条订单。`WalletRecord` 通过 `orderId` 与 `Order` 可选关联（充值无关联）。

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

#### Dashboard (`/manage`) ✅

- API：`GET /api/manage/dashboard` — 单接口返回全部看板数据，需要管理员鉴权
- 页面已接入真实数据，为 `'use client'` 组件，含加载骨架屏
- **KPI 卡片（4 个）**：总房源数、在租房源、本月营收、注册用户；每卡含同环比 delta（↑/↓ + 百分比）
- **营收趋势折线图**：过去 12 个月订单金额（含首期押金，排除押金退款 type=3），支持近三月/近半年/本年 Tab 切换（客户端切片，无额外请求）；y 轴自动计算合适刻度，峰值自动标注 tooltip
- **房源类型分布环形图**：整租/合租真实占比；含本月新签环比、空置率、进行中合同数、待处理预约数
- **收藏量 Top 5 房源**：按 `collection` 表记录数降序，含进度条（相对最大值）；点击「查看全部」跳转 `/manage/collection`
- **最新 5 条订单**：全部订单类型，含付款人、房源名、金额、类型标签（首期款/续期款/押金退）；点击「查看全部」跳转 `/manage/order`
- **空数据处理**：图表和列表均有空态提示；请求失败时展示错误态和重试按钮

### 8.2 待实现模块

以下模块按优先级排列，均以管理员管理为开发标准（Schema + API + 页面 + Modal）。

#### 用户管理 (`/manage/user`)

- 页面功能：用户列表（分页、搜索用户名/手机号/昵称）、新建用户、编辑用户信息、删除用户
- API：`GET/POST /api/manage/user`，`PUT /api/manage/user/[id]`，`DELETE /api/manage/user/[id]`
- 特殊字段：`identity`（用户/房东），`gender`，`wallet`，`isActive`（等效于管理员的 isActive）
- 新建时 `username`/`password` 必填；编辑时密码留空则保持不变；用户名唯一冲突返回 409

**用户详情页** (`/manage/user/[id]`)

- 展示用户完整信息：基本资料、联系方式、账户（钱包余额+支付密码）、时间记录
- **钱包充值**：顶部操作栏和账户卡余额旁均提供充值入口，弹出 `RechargeModal`
  - 提供 100 / 500 / 1000 / 2000 / 5000 快捷金额按钮，支持手动输入
  - 可填备注（选填，最长 100 字）
  - 提交后调用 `POST /api/manage/user/[id]/recharge`，Prisma 事务：创建 `walletRecord`（type=1）并原子累加 `user.wallet`
  - 成功后即时刷新页面余额显示并重新加载流水列表
- **钱包流水**：位于详情页底部全宽区域，展示该用户所有 `walletRecord`
  - 时间范围筛选（pill 切换，默认「近一个月」）：近一周 / 近一个月 / 近四个月 / 全部记录
  - 分页展示（`page`/`limit`），支持每页条数切换
  - 每条记录含类型徽标（充值=绿/支付租房=红/收款=黄/退押金=蓝）、备注、操作时间、金额（正数绿色 + 前缀，负数红色）
  - 流水只读，不提供修改或删除入口
- 新增 API：
  - `GET /api/manage/user/[id]/wallet-records?page=&limit=&dateRange=week|month|4months|all` — 分页查询流水，按 `createdAt` 降序
  - `POST /api/manage/user/[id]/recharge` — 充值，请求体 `{ amount: number, remark?: string }`，返回 `{ walletRecord, newBalance }`
- 序列化：`lib/wallet-record.ts`（`serializeWalletRecord`，所有 Date 字段转 `.toISOString()`）

#### 小区管理 (`/manage/community`)

- 页面功能：小区列表（分页、按城市/区搜索）、新建（含百度地图定位）、编辑、删除
- API：`GET/POST /api/manage/community`，`PUT/DELETE /api/manage/community/[id]`
- 新建时：点击地图自动填充 province/city/district/street/streetNumber/lng/lat
- 图片：小区封面，单张，使用统一上传方式

#### 房源管理 (`/manage/room`) ✅

- 页面功能：房源列表（分页、搜索、多维筛选）、新建（独立页面）、编辑（独立页面）、查看详情、删除、列表内快捷发布/取消发布
- API：`GET/POST /api/manage/room`，`GET/PUT/DELETE /api/manage/room/[id]`
- 列表筛选支持：名称/编号关键词、发布人（下拉）、省市区级联下拉（筛选小区所在地）、租房类型、房屋类型、房屋朝向、发布状态、出租状态；有任意筛选项激活时出现"清空筛选"按钮
- 省市区级联逻辑：直辖市（北京/上海/天津/重庆）选省后直接跳至区县，API 自动将 city 设为省份名；普通省份按省→市→区三级展示，数据来自 `localData/area.json`
- 列表列：封面、房源名称（w-[180px] 截断+编号）、小区（w-[140px] 截断+城市区显示）、类型（租房类型+房屋类型）、朝向、发布人（仅用户名）、价格、状态、发布时间、操作（sticky right 固定列）
- 操作列固定在表格右侧（`sticky right-0`），其他列横向滚动；移动端操作图标内嵌于卡片底部右侧（与内容并排），不占独立行
- 发布快捷操作：桌面端用"上架"/"下架"文字按钮，移动端用 `Globe`/`GlobeOff` 图标，均在操作列（移动端在卡片底部右侧按钮组中）
- 特殊字段：`isPublished`（发布状态）、`isRented`（租出状态）、`facilityIds`（JSON 数组）、`images`（JSON 数组，多图上传至 `/upload/pictures/`）
- 描述字段 `description` 使用 `@uiw/react-md-editor` Markdown 编辑器，详情页使用 `@uiw/react-markdown-preview` 渲染
- 小区选择支持省市区三级联动筛选，选中后自动预览小区地址信息
- 详情页展示小区百度地图定位，发布人可点击跳转用户详情

#### 房屋设施管理 (`/manage/facility`) ✅

- 页面功能：设施列表（分页、按名称搜索）、新建、编辑、删除
- API：`GET/POST /api/manage/facility`，`PUT/DELETE /api/manage/facility/[id]`
- 字段：`name`（设施名称）、`icon`（iconfont 类名，表单内含实时预览）

#### 轮播图管理 (`/manage/carousel`)

- 页面功能：轮播图卡片列表、新建（上传图片 + 跳转路径 + 发布状态 + 展示顺序）、编辑、删除
- 快捷操作：卡片上一键发布/取消发布；图片左上角显示 ID 和自定义顺序，右上角显示发布状态
- 排序切换：支持「按创建时间降序」和「按自定义顺序升序」两种排列方式
- API：`GET/POST /api/manage/carousel`，`PUT/PATCH/DELETE /api/manage/carousel/[id]`（PATCH 用于快捷发布切换）
- Portal 仅展示 `published = true` 的轮播图，按 `sortOrder` 升序排列

#### 收藏管理 (`/manage/collection`) ✅

- 页面功能：收藏记录列表（支持按用户名/昵称/房源名/编号搜索）、新增、编辑、删除
- API：`GET/POST /api/manage/collection`，`PUT/DELETE /api/manage/collection/[id]`
- 新增/编辑弹窗：用户和房源均支持搜索过滤的可滚动列表选择；同一用户+房源组合唯一约束（409 冲突提示）
- 序列化：`lib/collection.ts`，列表响应含关联的 `user`（id/username/nickname）和 `room`（id/name/roomCode）字段

#### 预约看房管理 (`/manage/appointment`)

- 页面功能：预约记录列表（只读，管理员不可增删改），支持按状态筛选和关键词搜索
- 列表列：房源名称（+编号）、租客（用户名）、房东（用户名）、预约时间、状态、创建时间
- 状态枚举：`1=待看房` `2=已完成` `3=已取消` `4=已过期`
- 筛选支持：按状态下拉（全部/待看房/已完成/已取消/已过期）、关键词搜索（租客用户名/房源名/房源编号）
- API：`GET /api/manage/appointment`（支持 `page`、`limit`、`search`、`status` 参数）
- 序列化：`lib/appointment.ts`，列表响应含关联的 `user`（租客 id/username/nickname）、`landlord`（房东 id/username/nickname）、`room`（id/name/roomCode）

#### 通知管理 (`/manage/notification`)

- 页面功能：查看系统生成的通知记录，支持编辑已读状态和删除；**不可新建**（通知由预约等业务动作自动写入）
- 列表列：接收用户（头像+用户名+昵称，可跳转用户详情）、类型、标题+内容（截断展示）、关联记录（relatedType + relatedId）、已读状态、创建时间、操作
- 类型枚举：见"通知类型枚举"章节
- 操作列：
  - **快捷已读切换**：`BookOpenCheck`（未读→已读）/ `BookOpen`（已读→未读）图标按钮，单击即时生效，无需打开弹窗
  - **编辑弹窗**：铅笔图标打开，弹窗内展示通知完整信息（类型、标题、正文、接收用户、关联记录，均只读），仅 `isRead` 字段可通过下拉修改
  - **删除**：二次确认后硬删除
- 筛选支持：关键词搜索（标题/内容/接收用户名/昵称）、类型下拉（全部/各通知类型）、已读状态下拉（全部/已读/未读）；任一筛选激活时显示"重置"按钮
- API：
  - `GET /api/manage/notification`（支持 `page`、`limit`、`search`、`type`、`isRead`、`userId` 参数）
  - `PUT /api/manage/notification/[id]`（请求体：`{ isRead: boolean }`，仅允许更新 `isRead` 字段）
  - `DELETE /api/manage/notification/[id]`
- 序列化：`lib/notification.ts`，列表响应含关联的 `user`（id/username/nickname/avatar）

#### 合同管理 (`/manage/contract`) ✅

- 页面功能：合同列表 + 新建（独立页面）+ 详情（独立页面）+ 编辑（与新建共用表单组件）
- **合同列表**：分页、多维筛选（关键词/状态/是否退房）；操作列含编辑、交房租、续租、退房、查看详情、删除
- **新建合同**（`/manage/contract/new`）：
  - 搜索选择租客（展示余额）
  - 搜索选择房源（仅已发布且未租出）→ 自动预览房源信息和房东信息
  - 填写租期（≥ minTenancy、必须是 pay 的整数倍，提供快捷按钮）
  - 填写开始日期 → 自动计算结束日期（置灰不可编辑）
  - 右侧实时预览合同全文（当事人、日期、费用明细、期限明细）
  - 创建前弹出付款确认框：输入租客 6 位支付密码 → 原子事务（扣租客余额、加房东余额、建合同/订单/钱包记录/通知）
- **合同详情**（`/manage/contract/[id]`）：展示当事人、房源、租期、费用、已付/待付期限、退房信息；操作面板含修改开始时间/交房租/续租/退房/删除
- **编辑合同**（`/manage/contract/[id]/edit`，表单回显）：进行中合同仅允许修改 onlineTime（结束时间和期限自动重算）；已完成合同只读
- **交房租弹窗**：显示下一期时段和金额，输入支付密码确认；若最后一期且已到期则触发合法退房流程
- **续租弹窗**：显示当前合同截止时间，选择续租月数（必须是 pay 的整数倍），实时预览新截止时间，输入支付密码；成功后通知房东
- **退房弹窗**：后端自动判断类型（`payingPeriod` 为空 → 合法退房；否则 → 非法退房），前端展示判断结果及押金处理说明后二次确认；若合法但合同尚未到期（租客提前付清所有租金），额外显示橙色提示；更新合同状态、钱包、通知、房源 isRented
- **删除合同**：仅允许 `isCheckout=true` 的合同删除；二次确认后硬删除（管理员直接完全删除，无需区分租客/房东侧）
- API：
  - `GET /api/manage/contract` — 列表（`page`、`limit`、`search`、`status`、`isCheckout`）
  - `POST /api/manage/contract` — 创建合同（含事务付款）
  - `GET /api/manage/contract/[id]` — 详情
  - `PUT /api/manage/contract/[id]` — 编辑（仅 onlineTime）
  - `DELETE /api/manage/contract/[id]` — 删除（需 isCheckout=true）
  - `POST /api/manage/contract/[id]/pay` — 交房租
  - `POST /api/manage/contract/[id]/renew` — 续租
  - `POST /api/manage/contract/[id]/checkout` — 退房（无需传参，合法/非法由后端根据 `payingPeriod` 自动判断）
  - `GET /api/manage/contract/options/users` — 用户选项（含余额）
  - `GET /api/manage/contract/options/rooms` — 可用房源选项（已发布+未租出）
- 序列化：`lib/contract.ts`，含 `serializeContract`、`generatePeriods`、`addMonths` 工具函数

#### 订单管理 (`/manage/order`)

- 页面功能：订单记录列表（只读），支持多维筛选
- 列表列：订单 ID、关联合同 ID、房源（名称+编号）、付款人（用户名）、收款人（用户名）、订单类型、月租金额、押金金额、时间段、创建时间
- 订单类型枚举：`1=首期款` `2=续期房租` `3=押金退款`
- 筛选支持：关键词搜索（付款人用户名/房源名/编号）、类型下拉（全部/首期款/续期房租/押金退款）；任一筛选激活时显示"重置"按钮
- API：`GET /api/manage/order`（支持 `page`、`limit`、`search`、`type` 参数）
- 序列化：`lib/order.ts`，列表响应含关联的 `payer`（付款人 id/username/nickname）、`payee`（收款人 id/username/nickname）、`room`（id/name/roomCode）

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
/portal                          # 首页（轮播图 + 热门推荐 + 搜索）
/portal/areaRoom                 # 区域找房（筛选+列表+分页）✅
/portal/subwayRoom               # 地铁找房（筛选+列表+分页）✅
/portal/cmyRoom                  # 小区找房列表 ✅
/portal/cmyRoom/[id]             # 小区房源列表 ✅
/portal/login                    # 用户登录
/portal/register                 # 用户注册
/portal/room/[id]                # 房源详情
/portal/mapRoom                  # 地图找房
/portal/sharedRoom/createRoom    # 发布房源（需登录）
/portal/sharedRoom/createCmy     # 创建小区（需登录）
/portal/sharedRoom/success       # 提交成功
/portal/account/info             # 我的资料
/portal/account/collection       # 我的收藏
/portal/account/appointment      # 我的预约
/portal/account/room             # 我的房源
/portal/account/contract         # 我的合同
/portal/account/orders           # 我的订单 ✅
```

### 认证

- 公开页面（首页、房源列表、房源详情）无需登录
- 需要登录的操作：预约、租房、发布房源、查看个人数据
- 未登录时点击需要登录的操作，弹出提示并跳转登录页

### 首页（`app/portal/page.tsx`）✅

页面为 Next.js Server Component，直接调用 Prisma 查询，无需经过 API 路由：

- **Hero 轮播图**：`HeroCarousel`（client 组件），每 4 秒自动切换，支持圆点导航，展示 `published=true` 的轮播图，按 `sortOrder` 升序
- **最新上架**：`HomeCard` × 4，按 `createdAt` 降序，仅展示 `isPublished=2` 的房源
- **小区精选**：`HomeCard` × 4，按 `createdAt` 降序，右侧显示已发布房源数量
- **热门推荐**：`HomeCard` × 4，按 `views` 降序

Portal API（`app/api/portal/`）：

| 接口 | 说明 | 已实现 |
|------|------|------|
| `GET /api/portal/carousels` | 已发布轮播图，按 sortOrder 升序 | ✅ |
| `GET /api/portal/rooms` | 房源列表，支持 sort=latest\|hot、district、minPrice、maxPrice、rentType、page | ✅ |
| `GET /api/portal/communities` | 小区列表，支持 city、district、page，返回含 roomCount | ✅ |
| `GET /api/portal/communities/[id]` | 小区详情 + 该小区已发布房源（支持分页） | ✅ |

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

### 预约看房

#### 发起预约（用户在房源详情页操作）

1. 点击"预约看房" → 弹出预约表单（需登录）
2. 填写预约时间（日期+时间段）和备注（可选）
3. 提交 → `POST /api/portal/appointment`
   - 自动从 token 获取 `userId`，从 `room.publisherId` 取 `landlordId`
   - 创建 `appointment`（`status=1`）
   - 同步为房东创建通知（`type=1`，"有人预约看房"）
4. 成功后提示"预约成功，等待房东确认"

#### 过期自动处理（懒过期）

不依赖定时任务，而是**在 API 查询时**批量更新：查询前先执行  
`UPDATE appointment SET status=4 WHERE status=1 AND appointmentTime < NOW()`  
确保客户端看到的数据始终是最新状态。

#### Portal API — 预约看房

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| `POST` | `/api/portal/appointment` | 创建预约 | 登录用户 |
| `GET` | `/api/portal/appointment?role=tenant\|landlord&status=&page=&limit=` | 查询预约列表（按角色） | 登录用户 |
| `PATCH` | `/api/portal/appointment/[id]/cancel` | 取消预约 | 租客或房东 |
| `PATCH` | `/api/portal/appointment/[id]/complete` | 标记完成 | 租客或房东 |
| `DELETE` | `/api/portal/appointment/[id]` | 隐藏记录（软删除，仅对自己） | 租客或房东 |

- `role=tenant`：查当前用户作为租客的预约（过滤 `userDeleted=false`）
- `role=landlord`：查当前用户作为房东收到的预约（过滤 `landlordDeleted=false`）
- 取消/完成操作：校验操作者必须是该预约的 `userId` 或 `landlordId`；完成后同步向对方创建通知（`type=3`）；取消后同步向对方创建通知（`type=2`）
- **互相完成**：任一方调用 `/complete` 均写入 `status=2`，`completedBy=当前userId`，对方会收到通知

### 租房交易

#### 下单流程

1. 点击"立即租房" → 弹出租房确认弹窗（需登录）
2. 选择租期（月数，须 ≥ `room.minTenancy` 且为 `room.pay` 的整数倍）和开始日期
3. 系统自动计算：
   - 结束日期（`offlineTime = onlineTime + tenancy 月`）
   - 首次付款金额：`押金 = price × pledge`，`首期房租 = price × pay`，合计 `= 押金 + 首期房租`
   - 生成 `payingPeriod`：按 `pay` 个月为一个周期，切分出所有待付时间段
   - 将首期时间段放入 `paidPeriod`，其余放入 `payingPeriod`
4. 展示账单明细，要求输入 6 位支付密码（`payCode`）
5. 校验：余额充足 + 支付密码正确
6. 提交 → `POST /api/portal/contract`
7. 后端原子操作（事务）：
   - 验证房源 `isRented=1`（未租出，防并发重复租）
   - 扣减租客 `wallet`（首次付款金额）
   - 增加房东 `wallet`（首次付款金额）
   - 创建 `Contract`（`status=1`）
   - 更新房源 `isRented=2`，`times+1`，`income += 首次付款金额`
   - 创建 `Order`（`type=1`，含 `pledge` 和 `fee`）
   - 创建租客 `WalletRecord`（`type=2`，`amount=-首次付款金额`）
   - 创建房东 `WalletRecord`（`type=3`，`amount=+首次付款金额`）
   - 为房东创建通知（`type=4`，"有新租客签约入住"）
   - 为租客创建通知（`type=5`，"付款成功"）
   - 为房东创建通知（`type=6`，"收款成功"）
8. 成功后跳转合同详情页

#### Portal API — 合同

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| `POST` | `/api/portal/contract` | 创建合同（含首次支付） | 登录用户 |
| `GET` | `/api/portal/contract?role=tenant\|landlord&status=&page=&limit=` | 查询合同列表 | 登录用户 |
| `GET` | `/api/portal/contract/[id]` | 合同详情 | 合同当事人 |
| `POST` | `/api/portal/contract/[id]/pay` | 支付下一期房租 | 租客 |
| `POST` | `/api/portal/contract/[id]/renew` | 续租 | 租客 |
| `POST` | `/api/portal/contract/[id]/checkout` | 提前退房（非法退房） | 租客 |
| `DELETE` | `/api/portal/contract/[id]` | 删除合同（仅 status=2 后可删，各删各自一侧） | 合同当事人 |

**支付下一期（`POST /pay`）**：
- 取 `payingPeriod[0]` 作为本期时间段
- 校验余额充足 + 支付密码正确（需在请求体传入支付密码）
- 事务：扣减租客 wallet、增加房东 wallet、将 `payingPeriod[0]` 移入 `paidPeriod`、创建 `Order`（`type=2`）、创建双方 `WalletRecord`、创建双方通知（`type=5/6`）
- 若支付后 `payingPeriod` 变空，且当前时间已到 `offlineTime` 附近（≤ 7 天内），自动触发合法退房流程

**续租（`POST /renew`）**：
- 请求体包含续租月数（须为 `pay` 的整数倍）和支付密码
- 扩展 `offlineTime`，重新计算并追加 `payingPeriod`
- `renewTimes + 1`
- 创建通知告知房东（`type=4`，"租客已续租"）

**退房（`POST /checkout`）**：
- **合法/非法由后端根据 `payingPeriod` 自动判断，不接受客户端传参**
- `payingPeriod` 为空 → **合法退房**（`refund=true`，押金退还）
  - 事务：`isCheckout=true`、`checkoutTime=now()`、`refund=true`、`status=2`
  - 退押金：从房东 wallet 扣除 `pledge`，加入租客 wallet；创建 `Order`（`type=3`）及双方 `WalletRecord`
  - 更新房源 `isRented=1`
  - 通知租客（`type=8`）、通知房东（`type=11`）；若合同尚未到期（提前付清退房），通知 content 注明"提前结清"
- `payingPeriod` 不为空 → **非法退房**（`refund=false`，押金不退）
  - 事务：`isCheckout=true`、`checkoutTime=now()`、`refund=false`、`status=2`
  - 更新房源 `isRented=1`
  - 通知租客（`type=10`，"提前退房操作已确认，押金不予退还"）
  - 通知房东（`type=11`，"租客已提前退房，仍有未结清租金，押金无需退还"）

**合法退房（系统懒检测，无独立 API）**：
- 触发时机：API 查询合同时，检测 `payingPeriod` 为空 且 `offlineTime <= now()` 且 `isCheckout=false`
- 事务：`isCheckout=true`、`checkoutTime=now()`、`refund=true`、`status=2`
- 退押金：从房东 wallet 扣除 `pledge`，加入租客 wallet
- 创建 `Order`（`type=3`，`pledge=合同押金`）
- 创建双方 `WalletRecord`（租客收入 `type=4`，房东支出 `type=2`）
- 为租客创建通知（`type=8`，"租约已到期，押金已退回至您的钱包"）
- 为房东创建通知（`type=11`，"租客租约到期已退房，押金已从您的钱包扣除"）
- 更新房源 `isRented=1`

**逾期强制退房（懒检测）**：
- 触发时机：API 查询合同时，检测 `payingPeriod[0]` 的开始时间已超过 15 天且未付款
- 事务：`isCheckout=true`、`checkoutTime=now()`、`refund=false`、`status=2`
- 更新房源 `isRented=1`
- 为租客创建通知（`type=9`，"逾期未缴房租，已强制退房，押金不予退还"）
- 为房东创建通知（`type=11`，"租客逾期未缴房租，已被强制退房"）

**删除合同**：
- 租客只能在 `status=2`（已完成）后将 `userDeleted=true`
- 房东任意时候可将 `landlordDeleted=true`
- 双方删除相互独立，不影响对方查看

#### Portal API — 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/portal/notification?page=&limit=` | 获取通知列表（分页） |
| `GET` | `/api/portal/notification/unread-count` | 获取未读数量（用于顶栏 badge） |
| `PATCH` | `/api/portal/notification/[id]` | 标记单条已读（`{ isRead: true }`） |
| `PATCH` | `/api/portal/notification` | 全部标记已读（批量） |
| `DELETE` | `/api/portal/notification/[id]` | 删除单条通知 |
| `DELETE` | `/api/portal/notification` | 清空所有通知（当前用户） |

#### Portal API — 订单

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| `GET` | `/api/portal/order?role=payer\|payee&type=&page=&limit=` | 查询订单列表 | 登录用户 |
| `GET` | `/api/portal/order/[id]` | 订单详情 | 订单当事人 |

- `role=payer`：查当前用户作为付款方的订单（租客视角：租房支出）
- `role=payee`：查当前用户作为收款方的订单（房东视角：收款记录）
- 响应含关联的 `room`（name/roomCode）、`payer`（username/nickname）、`payee`（username/nickname）、`contract`（id/onlineTime/offlineTime）

#### Portal API — 钱包

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| `GET` | `/api/portal/wallet` | 查询当前用户钱包余额 | 登录用户 |
| `POST` | `/api/portal/wallet/recharge` | 充值 | 登录用户 |
| `GET` | `/api/portal/wallet/records?page=&limit=&type=` | 钱包消费记录（分页） | 登录用户 |
| `PUT` | `/api/portal/wallet/paycode` | 修改支付密码 | 登录用户 |

**充值规则**：
- 请求体：`{ amount: number, payCode: string }`
- 充值金额 > 0，无上限（虚拟充值，不接入真实支付）
- 验证支付密码后：更新 `user.wallet`，创建 `WalletRecord`（`type=1`，`amount=+充值金额`）

**修改支付密码**：
- 请求体：`{ oldPayCode: string, newPayCode: string }`（6 位数字）
- 验证旧密码后更新 `user.payCode`

#### 通知类型枚举

| type | 触发时机 | 接收方 | 标题示例 |
|------|----------|--------|----------|
| `1` | 用户提交预约 | 房东 | "有用户预约看房" |
| `2` | 一方取消预约 | 对方 | "预约已被取消" |
| `3` | 一方标记预约完成 | 对方 | "看房已标记完成" |
| `4` | 合同创建成功 / 租客续租 | 房东 | "有新租客签约入住" / "租客已续租" |
| `5` | 租客完成付款（首期/续期） | 租客 | "付款成功" |
| `6` | 租客付款，房东收款 | 房东 | "收款成功" |
| `7` | 下一期房租到期前 7 天（定时/懒触发） | 租客 | "房租即将到期，请准备缴费" |
| `8` | 合法退房（已付清所有租金），押金退回；到期退房或提前付清退房均用此类型 | 租客 | "退房成功，押金已退回至您的钱包" |
| `9` | 逾期 15 天未缴房租，强制退房 | 租客 | "逾期未缴房租，已强制退房，押金不予退还" |
| `10` | 仍有未结清租金的提前退房（非法退房） | 租客 | "提前退房操作已确认，押金不予退还" |
| `11` | 任意退房事件（合法/提前/逾期） | 房东 | "租客已退房"（content 注明具体类型及押金处理结果） |

### 发布房源

房东流程（两步）：
1. 选择小区（搜索已有小区，或点击"创建小区"）
2. 填写房源信息（基础信息 + 设施 + 图片 + 描述）
3. 提交："保存并发布"（`isPublished=2`）或"存为草稿"（`isPublished=1`）

### 个人中心

| 子模块 | 路由 | 说明 |
|--------|------|------|
| 个人资料 | `/profile/info` | 修改昵称、头像、联系方式，实名认证（成为房东前置条件）|
| 我的收藏 | `/profile/collection` | 已收藏房源列表，支持取消收藏 |
| 我的房源 | `/profile/rooms` | 已发布房源列表，支持编辑、发布/撤回、删除（仅房东可见）|
| 我的预约 | `/profile/appointment` | 两个 Tab：**我预约的**（作为租客）/ **收到的预约**（作为房东）；状态分组显示（待看房/已完成/已取消/已过期）；操作：取消、标记完成、隐藏 |
| 我的消息 | `/profile/notification` | 通知中心：列表展示所有通知，支持单条已读、全部已读、单条删除、清空全部；顶栏显示未读 badge |
| 我的合同 | `/profile/contract` | 合同列表，两个 Tab：**我租的**（租客视角）/ **收到的合同**（房东视角）；合同详情内支持续租、支付下一期、提前退房；status=2 后可删除 |
| 我的订单 | `/profile/order` | 两个 Tab：**付款记录**（payer 视角）/ **收款记录**（payee 视角）；每条展示类型、金额、时间段、房源信息 |
| 我的钱包 | `/profile/wallet` | 当前余额大字展示、充值按钮（输入金额+支付密码）、修改支付密码入口、消费记录列表（支持按类型筛选）；金额正数绿色+号、负数红色-号 |

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

Portal 平台视觉风格还原自高保真原型（`public/prototype/`），但必须在原型桌面设计的基础上叠加完整的移动端响应式能力。

**布局策略（移动优先）**

| 区域 | 移动端（默认） | 桌面端（`lg:`，≥1024px） |
|---|---|---|
| 内容容器 | `w-full px-4` | `max-w-[1180px] mx-auto` |
| 主导航 TopMenu | 汉堡菜单抽屉（右滑弹出） | 水平菜单栏（高度 40px） |
| 列表卡片网格 | 单列 `grid-cols-1` | 四列 `lg:grid-cols-4` |
| 个人中心侧边菜单 | 顶部横向标签页 | 左侧固定菜单（200px） |
| 找房筛选栏 | 底部抽屉 / 折叠 Panel | 展开的筛选条（inline） |
| 房源详情双栏 | 上下堆叠 | 左 900px + 右 260px |

**样式规范**
- 所有组件使用 **Tailwind CSS v4** 编写，不使用内联 `style={{}}`（极少数动态值除外）
- Portal 主题色通过 CSS 变量使用：`bg-[var(--color-primary)]`、`text-[var(--color-accent)]` 等
- 图片统一使用 `object-cover`，容器比例固定
- 筛选条件在移动端以抽屉/底部弹层展示

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
| Dashboard | ✅ 已实现 | `/manage` | 真实数据，含 KPI/折线图/环形图/Top5/最新订单 |
| 个人资料 | ✅ 已实现 | `/manage/profile` | |
| 管理员管理 | ✅ 已实现 | `/manage/admin` | 作为标准参考模块 |
| 用户管理 | ✅ 已实现 | `/manage/user` | |
| 小区管理 | ✅ 已实现 | `/manage/community` | 含百度地图，独立页面 |
| 房源管理 | ✅ 已实现 | `/manage/room` | 含 Markdown 编辑、多图上传、省市区筛选小区 |
| 房屋设施管理 | ✅ 已实现 | `/manage/facility` | |
| 轮播图管理 | ✅ 已实现 | `/manage/carousel` | 卡片展示，含图片上传 |
| 收藏管理 | ✅ 已实现 | `/manage/collection` | |
| 预约管理 | ✅ 已实现 | `/manage/appointment` | 含新增/编辑/删除/快捷取消完成，懒过期 |
| 通知管理 | ✅ 已实现 | `/manage/notification` | 只读查看+编辑已读状态+删除，无新增 |
| 合同管理 | ✅ 已实现 | `/manage/contract` | 含新建/详情/编辑独立页面，交房租/续租/退房/删除操作 |
| 订单管理 | ✅ 已实现 | `/manage/order` | 只读列表+详情，含类型筛选，支持删除 |

### 用户平台

| 模块 | 状态 | 路由 |
|------|------|------|
| 首页 | ⬜ 待实现 | `/portal` |
| 用户注册/登录 | ✅ 已实现 | `/portal/register`, `/portal/login` |
| 房源列表/搜索 | ⬜ 待实现 | `/portal/search` |
| 房源详情 | ✅ 已实现 | `/portal/room/[id]` |
| 小区详情 | ⬜ 待实现 | `/portal/community/[id]` |
| 地图找房 | ⬜ 待实现 | `/portal/map` |
| 个人中心 - 基础 | ⬜ 待实现 | `/portal/profile/info`, `/portal/profile/collection`, `/portal/profile/rooms` |
| 个人中心 - 预约 | ⬜ 待实现 | `/portal/profile/appointment` | 含"我预约的"和"收到的预约"双 Tab |
| 个人中心 - 消息 | ⬜ 待实现 | `/portal/profile/notification` | 通知中心，含未读 badge |
| 个人中心 - 合同 | ⬜ 待实现 | `/portal/profile/contract` | 含续租/付款/退房操作 |
| 个人中心 - 订单 | ⬜ 待实现 | `/portal/profile/order` | 付款/收款双 Tab |
| 个人中心 - 钱包 | ⬜ 待实现 | `/portal/profile/wallet` | 余额、充值、消费记录 |
| 发布房源 | ⬜ 待实现 | `/portal/publish` |
| 租房交易 | ⬜ 待实现 | 在房源详情页弹窗发起 |

### 数据库

| 表 | 状态 | 说明 |
|----|------|------|
| `admin` | ✅ 已建 | |
| `user` | ✅ 已建 | 含 wallet/payCode 字段 |
| `community` | ✅ 已建 | |
| `facility` | ✅ 已建 | |
| `room` | ✅ 已建 | |
| `carousel` | ✅ 已建 | |
| `collection` | ✅ 已建 | |
| `appointment` | ✅ 已建 | 含 status/cancelledBy/completedBy/remark 字段 |
| `notification` | ✅ 已建 | 通知中心，type 扩展至 9 种 |
| `contract` | ✅ 已建 | 含 status/isCheckout/refund/renewTimes/renewMonths 字段 |
| `order` | ✅ 已建 | 含 contractId/type 字段 |
| `wallet_record` | ✅ 已建 | 钱包消费记录，含 type/amount/orderId 字段 |

---

*文档版本：2026-05-16 | 项目：雅阁租房系统*
