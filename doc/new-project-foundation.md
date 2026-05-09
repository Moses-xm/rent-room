# 新项目地基规范

> 从零搭建项目时，在第一行业务代码之前需要做对的事情。  
> 本文基于「雅阁租房」实际开发过程中踩过的坑与总结出的经验，适用于任何 Next.js / React 全栈项目。

---

## 目录

1. [前端：设计令牌系统](#1-前端设计令牌系统)
2. [前端：组件规范](#2-前端组件规范)
3. [前端：请求层封装](#3-前端请求层封装)
4. [前端：分页与列表处理](#4-前端分页与列表处理)
5. [前端：响应式布局策略](#5-前端响应式布局策略)
6. [后端：认证与 Token](#6-后端认证与-token)
7. [后端：数据库连接规范](#7-后端数据库连接规范)
8. [后端：API 响应格式规范](#8-后端-api-响应格式规范)
9. [后端：错误处理规范](#9-后端错误处理规范)
10. [项目结构约定](#10-项目结构约定)
11. [开发流程 Checklist](#11-开发流程-checklist)

---

## 1. 前端：设计令牌系统

### 核心原则

> **组件内部永远不出现硬编码的颜色值、字号、字重。**  
> 所有视觉值通过 CSS 变量（令牌）引用，主题切换只改变量，零改组件。

### 1.1 CSS 变量分层

设计令牌分为两层：

```
原子令牌（全局 :root）          语义令牌（各平台作用域覆盖）
─────────────────────           ─────────────────────────────
具体颜色值，一般不直接用          组件实际引用的语义变量
例：#8B7355                      例：--color-primary
```

在 `globals.css` 中定义 `:root` 默认值，在 `styles/themes/platform.css` 中用 `[data-platform="xxx"]` 作用域覆盖：

```css
/* globals.css —— 语义变量默认值 */
:root {
  /* 主色 */
  --color-primary:        #8B7355;
  --color-primary-dark:   #6F5A42;
  --color-primary-tint:   #F5F1EA;
  --color-primary-tint-2: #FAF6EE;

  /* 文字灰阶 */
  --color-text:          #1A1A1A;
  --color-text-2:        #3F3F3F;
  --color-text-muted:    #8A8A8A;
  --color-text-subtle:   #B5B5B5;
  --color-text-disabled: #D8D8D8;

  /* 背景层次（至少 3 层：card > surface > surface-2） */
  --color-surface:       #FAFAFA;
  --color-surface-2:     #F4F4F4;
  --color-card:          #FFFFFF;

  /* 边框 */
  --color-border:        #ECECEC;
  --color-border-subtle: #F2F2F2;

  /* 状态色 */
  --color-success:    #4F8A4F;  --color-success-bg:  #EEF6EE;
  --color-warning:    #B5803E;  --color-warning-bg:  #FBF1E1;
  --color-danger:     #C24A3A;  --color-danger-bg:   #FAEDEA;
  --color-info:       #5A7A95;  --color-info-bg:     #EEF2F6;
}

/* styles/themes/admin.css —— 独立平台主题（只改这里换色） */
[data-platform="admin"] {
  --color-primary:        #5B7FA6;
  --color-primary-dark:   #3D6080;
  --color-primary-tint:   #EBF1F8;
  --color-primary-tint-2: #F5F8FC;
}
```

### 1.2 排版令牌

字号、字重也统一用变量，不写死 `text-[14px]` 这类值：

```css
:root {
  /* 字号 */
  --fs-h1:      26px;
  --fs-h2:      22px;
  --fs-h3:      16px;
  --fs-body:    13px;
  --fs-body-sm: 12.5px;
  --fs-caption: 11.5px;
  --fs-tiny:    11px;

  /* 字重 */
  --fw-heading:  600;
  --fw-emphasis: 500;
}
```

注册为 Tailwind 工具类，组件中写 `text-body`、`font-heading` 而非 `text-[13px]`、`font-[600]`：

```css
/* globals.css */
@layer utilities {
  .text-h1      { font-size: var(--fs-h1); }
  .text-body    { font-size: var(--fs-body); }
  .font-heading  { font-weight: var(--fw-heading); }
  .font-emphasis { font-weight: var(--fw-emphasis); }
}
```

### 1.3 字体栈

```css
:root {
  --typeface-body:    'DM Sans', system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --typeface-display: 'Cormorant', 'Noto Serif SC', Georgia, serif;
}
```

- **body 字体**：无衬线，覆盖中英文
- **display 字体**：有衬线，用于页面大标题
- 字体通过 `next/font` 在 layout 层注入，CSS 变量引用，组件从不写 `font-family`

### 1.4 间距、圆角、阴影

```css
:root {
  --radius-sm: 6px;
  --radius:    8px;
  --radius-lg: 12px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
  --shadow:    0 4px 16px rgba(0,0,0,.07);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.13);
}
```

组件用 `rounded-sm`、`shadow` 等，背后映射到变量，平台主题可覆盖圆角风格。

### 1.5 令牌映射到 Tailwind（v4）

```css
@theme inline {
  --color-primary:     var(--color-primary);
  --color-text:        var(--color-text);
  --color-surface:     var(--color-surface);
  --color-card:        var(--color-card);
  --color-border:      var(--color-border);
  /* …其余同理… */
}
```

这样 `bg-primary`、`text-text-muted`、`border-border-subtle` 这些工具类都跟随主题变量自动切换。

---

## 2. 前端：组件规范

### 2.1 提前建立共享组件库

在写任何页面之前，把下面这些"必然会出现的组件"先建好：

| 组件 | 职责 |
|------|------|
| `StatusPill` | 状态徽章，接受 `variant` prop（success/warning/danger/muted）|
| `ConfirmDialog` | 危险操作的二次确认弹窗，统一 danger/loading 状态 |
| `AppLoading` | 表格骨架屏，接受 rows/columns |
| `LoadingDimmer` | 表格刷新时的半透明遮罩，包裹 table 容器 |
| `EmptyState` | 空列表占位，传 icon + 文字 |
| `Pagination` | 分页控件，接受 page/totalPages/onChange |
| `PageSizeSelect` | 每页条数选择器 |

**核心约定：组件内部一律用语义令牌，绝不写颜色/字号的具体值。**

### 2.2 共享样式片段

跨组件复用的样式字符串提取为常量，放在顶层模块而非内联重复：

```ts
// styles/classNames.ts
export const inputCls =
  'w-full h-[36px] px-3 border border-border rounded-sm bg-card text-text text-body outline-none ' +
  'transition-[border-color,box-shadow] hover:border-text-disabled placeholder:text-text-subtle ' +
  'focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]';

export const labelCls = 'block text-body-sm font-emphasis text-text-2 mb-1.5';
```

---

## 3. 前端：请求层封装

### 3.1 统一 `request()` 函数

项目只允许通过一个封装函数发请求，禁止在页面/组件中直接 `fetch()`。

```ts
// utils/request.ts

type RequestOptions = {
  method?: string;
  json?: unknown;
  silent?: boolean;   // 为 true 时抑制自动 toast（表单级错误自己处理）
  headers?: Record<string, string>;
};

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', json, silent = false, headers = {} } = options;

  const token = getToken();  // 从 localStorage 读取
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    const msg = data.message || '请求失败';
    if (!silent) toast.error(msg);      // sonner 自动弹 toast
    throw new Error(msg);               // 让调用方 catch 做后续处理
  }

  return data as T;
}
```

**关键设计点：**
- 4xx/5xx 一律在这里统一弹 toast，页面层**只处理业务逻辑和成功提示**
- `silent: true` 用于表单场景（需要在字段旁显示错误）或后台清理操作（不应干扰用户）
- Token 注入集中在一处，改认证方案只改这里

### 3.2 Toast 全局挂载

在根 layout 挂载一次，全项目复用：

```tsx
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

---

## 4. 前端：分页与列表处理

### 4.1 列表页标准数据结构

每个列表页维护以下状态：

```ts
const [list, setList]                   = useState<T[]>([]);
const [total, setTotal]                 = useState(0);
const [totalPages, setTotalPages]       = useState(1);
const [page, setPage]                   = useState(1);
const [pageSize, setPageSize]           = useState(10);
const [query, setQuery]                 = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');
const [loading, setLoading]             = useState(true);
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
const [refreshKey, setRefreshKey]       = useState(0);
// hasLoadedOnce：首次加载前显示骨架屏，之后切页用遮罩而非骨架屏
// refreshKey：CRUD 操作后自增，触发数据重拉而不改变其他状态
```

### 4.2 搜索防抖

```ts
useEffect(() => {
  const t = setTimeout(() => setDebouncedQuery(query), 300);
  return () => clearTimeout(t);
}, [query]);
```

搜索词变化时在 `onChange` 中同步重置页码，防止防抖期间页码错位：

```ts
onChange={(e) => { setQuery(e.target.value); setPage(1); }}
```

### 4.3 切换 pageSize

切换每页条数时同样重置到第 1 页：

```ts
const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };
```

### 4.4 单一数据拉取 effect

**所有触发条件（翻页、换页大小、搜索、CRUD 刷新）统一在一个 effect 中处理**，不拆多个 effect 以免逻辑重复。必须用 `cancelled` 标志防止竞态：

```ts
useEffect(() => {
  let cancelled = false;
  setLoading(true);

  fetchList({ page, limit: pageSize, search: debouncedQuery || undefined })
    .then((res) => {
      if (cancelled) return;
      if (res.success) {
        setList(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        // 筛选后总页数缩减时，自动跳回末页（会再次触发 effect 用新 page 拉数据）
        if (res.totalPages > 0 && page > res.totalPages) {
          setPage(res.totalPages);
        }
      }
    })
    .catch(console.error)
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    });

  return () => { cancelled = true; };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [page, pageSize, debouncedQuery, refreshKey]);
```

CRUD 操作后通过自增 `refreshKey` 触发刷新，不修改其他状态：

```ts
// 创建后跳回第 1 页再刷新
setPage(1);
setRefreshKey((k) => k + 1);

// 更新后原地刷新
setRefreshKey((k) => k + 1);
```

### 4.5 翻页边界处理

页码变更统一经过钳制函数，防止传入非法值：

```ts
const handlePageChange = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
```

删除操作后的页码回退：若删除的是当前页最后一条且不在第 1 页，回退到上一页；否则原地刷新：

```ts
if (list.length === 1 && page > 1) {
  setPage((p) => p - 1);  // page 变化会自动触发 effect
} else {
  setRefreshKey((k) => k + 1);
}
```

### 4.6 页码展示算法

总页数 ≤ 9 时全部显示，超过时用省略号；放在 `Pagination` 组件的 `useMemo` 里：

```ts
const pageButtons = useMemo(() => {
  const items: (number | '...')[] = [];
  if (totalPages <= 9) {
    for (let i = 1; i <= totalPages; i++) items.push(i);
  } else {
    items.push(1);
    if (page > 4) items.push('...');
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      items.push(i);
    }
    if (page < totalPages - 3) items.push('...');
    items.push(totalPages);
  }
  return items;
}, [totalPages, page]);
```

### 4.7 骨架屏 vs 遮罩

- **首次加载**（`!hasLoadedOnce`）：显示 `<AppLoading>`，让用户看到页面结构
- **切页/刷新**（`hasLoadedOnce && loading`）：显示 `<LoadingDimmer>`，防止闪烁

```tsx
{!hasLoadedOnce ? (
  <AppLoading rows={5} columns={5} />
) : (
  <div className="bg-card border border-border rounded shadow-sm">
    <LoadingDimmer loading={loading}>
      {/* 表格 */}
    </LoadingDimmer>
  </div>
)}
```

---

## 5. 前端：响应式布局策略

### 5.1 断点策略

| 断点 | Tailwind 前缀 | 设备 |
|------|--------------|------|
| < 640px  | （默认）| 手机竖屏 |
| ≥ 640px  | `sm:` | 手机横屏 / 小平板 |
| ≥ 768px  | `md:` | 平板 |
| ≥ 1024px | `lg:` | 桌面 |

### 5.2 侧边栏布局

- 移动端：侧边栏默认折叠，顶部 Hamburger 展开，以 `fixed` 抽屉形式覆盖
- 桌面端：侧边栏常驻，主内容区用 `ml-[sidebar-width]` 留空

```tsx
// 侧边栏宽度用 CSS 变量，便于全局修改
:root { --sidebar-w: 220px; }

// 主内容区
<main className="lg:ml-[var(--sidebar-w)] px-4 lg:px-8 py-6">
```

### 5.3 表格的移动适配：卡片化

移动端（`< md`）表格改为**卡片列表**，桌面端（`≥ md`）显示完整表格：

```tsx
{/* 移动端卡片列表 */}
<div className="md:hidden space-y-3">
  {list.map((item) => (
    <div key={item.id} className="bg-card border border-border rounded shadow-sm p-4 flex items-center gap-3">
      {/* 头像 / 图标 */}
      <div className="w-9.5 h-9.5 rounded-full shrink-0 ...">
        {initials(item.name)}
      </div>
      {/* 核心信息：名称 + 状态徽章 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-body font-emphasis text-text">{item.name}</p>
          <StatusPill variant="success">正常</StatusPill>
        </div>
        {/* 次要信息用 text-tiny 展示 */}
        <p className="text-tiny text-text-muted font-mono mt-0.5">创建 {fmtDateTime(item.createdAt)}</p>
      </div>
      {/* 操作按钮 */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button className="w-7.5 h-7.5 ..."><Pencil size={15} /></button>
        <button className="w-7.5 h-7.5 ..."><Trash2 size={15} /></button>
      </div>
    </div>
  ))}
  {/* 分页也在卡片列表下方展示 */}
  {total > 0 && (
    <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
      <Pagination ... />
    </div>
  )}
</div>

{/* 桌面端表格 */}
<div className="hidden md:block bg-card border border-border rounded shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-left whitespace-nowrap">...</table>
  </div>
  {total > 0 && <Pagination ... />}
</div>
```

**卡片设计原则：**
- 头像/图标 + 名称 + 状态徽章在同一行，次要信息（时间等）用 `text-tiny font-mono` 降级展示
- 操作按钮收拢在右侧，与桌面端保持相同触发逻辑
- 分页控件复用同一个 `<Pagination>` 组件，分别挂在移动端和桌面端区块下方

### 5.4 页面头部响应式

```tsx
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
  <div>{/* 标题 + 描述 */}</div>
  <div className="flex gap-2 shrink-0 w-full sm:w-auto">
    {/* 移动端按钮全宽（flex-1），桌面端自适应（sm:flex-none） */}
    <button className="flex-1 sm:flex-none h-8.5 px-3.5 ...">新建</button>
  </div>
</div>
```

### 5.5 筛选区响应式

搜索框移动端全宽，桌面端固定宽度：

```tsx
<div className="flex items-center gap-2.5 flex-wrap">
  <div className="relative w-full sm:w-60">
    <input ... />
  </div>
  {/* 其他筛选项同理，宽度用 w-full sm:w-auto */}
</div>
```

### 5.6 Checklist

- [ ] 每个列表页同时实现移动端卡片视图（`md:hidden`）和桌面端表格（`hidden md:block`）
- [ ] 页面头部标题区与操作按钮区使用 `flex-col sm:flex-row` 响应式排列
- [ ] 搜索框等筛选输入框使用 `w-full sm:w-60` 在移动端全宽展开
- [ ] 分页组件在移动端和桌面端各挂一次，共用相同状态
- [ ] 新页面开发完后在 375px 宽度下测试布局

---

## 6. 后端：认证与 Token

### 6.1 提前决定认证方案

项目启动前明确：

| 方案 | 适用场景 |
|------|---------|
| JWT（无状态） | API 服务、多平台共享 token |
| Session（有状态） | 传统 Web、需要服务端主动失效 |
| NextAuth / Auth.js | 需要 OAuth 社交登录 |

本项目选择自实现 HS256 JWT，适合多平台（manage/portal）各自独立认证的场景。

### 6.2 Token 颁发与验证集中管理

```ts
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: object, expiresIn = '7d') {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken<T>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as T;
}
```

### 6.3 鉴权中间件

每个需要认证的 API route 的第一行都调用 `requireAuth()`，不通过直接 return：

```ts
// lib/auth.ts
export async function requireAuth(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, message: '未登录' }, { status: 401 }),
    };
  }
  try {
    const payload = await verifyToken<{ id: number }>(token);
    return { ok: true as const, payload };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, message: 'Token 无效或已过期' }, { status: 401 }),
    };
  }
}

// 使用
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  // auth.payload.id 可用
}
```

### 6.4 前端 Token 管理

```ts
// utils/auth.ts
const TOKEN_KEY = 'manage_token';
export const getToken  = () => localStorage.getItem(TOKEN_KEY);
export const setToken  = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
```

---

## 7. 后端：数据库连接规范

### 7.1 Prisma 单例模式（防止开发环境重复实例化）

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 7.2 Schema 规范

所有表必须包含的字段：

```prisma
model Example {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")
  // 其他字段...
}
```

- 主键统一用自增整型 `id`
- 时间戳统一 `createdAt`/`updatedAt`
- 无软删除，执行硬删除
- 字段名 camelCase，数据库列名 snake_case（`@map`）

---

## 8. 后端：API 响应格式规范

### 8.1 统一响应结构

所有接口响应必须遵循：

```ts
// 成功 - 单条
{ success: true, data: T }

// 成功 - 列表（分页）
{
  success: true,
  data: T[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}

// 失败
{ success: false, message: string }
```

### 8.2 分页列表接口

Query params 规范：
- `page`：当前页，默认 `1`
- `limit`：每页条数，默认 `10`，可选值 `[5, 10, 20, 50]`
- `search`：搜索关键词（可选）
- 其他筛选字段按业务需要添加

```ts
// 标准分页实现
const page  = parseInt(searchParams.get('page')  || '1');
const limit = parseInt(searchParams.get('limit') || '10');
const skip  = (page - 1) * limit;

const [total, data] = await Promise.all([
  prisma.model.count({ where }),
  prisma.model.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' } })
]);

return NextResponse.json({
  success: true,
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit)
});
```

### 8.3 Route 文件结构

```
app/api/
└── [resource]/
    ├── route.ts        # GET（列表）/ POST（创建）
    └── [id]/
        └── route.ts    # GET（详情）/ PUT（更新）/ DELETE（删除）
```

HTTP 动词与操作的映射：

| 方法 | 路径 | 操作 |
|------|------|------|
| GET    | `/api/users`    | 列表（带分页） |
| POST   | `/api/users`    | 创建 |
| GET    | `/api/users/1`  | 详情 |
| PUT    | `/api/users/1`  | 全量更新 |
| PATCH  | `/api/users/1`  | 局部更新 |
| DELETE | `/api/users/1`  | 删除 |

---

## 9. 后端：错误处理规范

### 9.1 全局 catch 必须识别 Prisma 错误码

最常见的两个 Prisma 错误必须专项处理，否则会把包含堆栈的 500 暴露给前端：

```ts
import { Prisma } from '@prisma/client';

} catch (error: unknown) {
  // P2002 = 唯一约束冲突（如用户名重复）
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return NextResponse.json({ success: false, message: '该记录已存在' }, { status: 409 });
  }
  // P2025 = 记录不存在（更新/删除时找不到目标）
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ success: false, message: '记录不存在' }, { status: 404 });
  }
  const message = error instanceof Error ? error.message : '服务器内部错误';
  return NextResponse.json({ success: false, message }, { status: 500 });
}
```

### 9.2 HTTP 状态码规范

| 状态码 | 含义 | 触发场景 |
|--------|------|---------|
| 200 | 成功 | GET / PUT / PATCH 成功 |
| 201 | 创建成功 | POST 成功（可选，也可统一用 200）|
| 400 | 请求参数错误 | 必填项缺失、格式不对 |
| 401 | 未认证 | Token 不存在或过期 |
| 403 | 无权限 | Token 有效但权限不足 |
| 404 | 不存在 | 资源 ID 找不到 |
| 409 | 冲突 | 唯一约束冲突（用户名重复等）|
| 500 | 服务器错误 | 未预期的异常 |

---

## 10. 项目结构约定

```
project/
├── app/
│   ├── api/                  # 后端 API routes
│   │   └── [resource]/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── (platform-a)/         # 平台 A 的页面（route group）
│   └── (platform-b)/         # 平台 B 的页面（route group）
├── components/               # 共享 UI 组件（无业务逻辑）
├── lib/                      # 服务端工具（只在 API routes 中 import）
│   ├── prisma.ts
│   ├── auth.ts
│   └── [resource].ts         # 各资源的序列化/处理函数
├── utils/                    # 客户端工具（只在客户端组件中 import）
│   ├── request.ts
│   └── auth.ts
├── styles/
│   └── themes/
│       ├── platform-a.css    # 换主题只改这一个文件
│       └── platform-b.css
├── prisma/
│   └── schema.prisma
└── localData/                # 城市、地区等静态 JSON 数据
```

**关键约定：**
- `lib/` 下的文件不能在客户端组件中 import（含 `'use client'` 的文件）
- `utils/` 下的文件只放纯客户端工具
- 共享 UI 组件放 `components/`，不含业务逻辑，只接受 props

---

## 11. 开发流程 Checklist

新项目启动时，在写第一个业务页面之前，逐项确认：

### 基础配置
- [ ] `globals.css` 中定义完整的 `:root` 语义变量（颜色、字号、字重、阴影、圆角）
- [ ] `globals.css` 中注册 Tailwind 工具类映射（`@theme inline`）
- [ ] `globals.css` 中注册语义排版工具类（`text-h1`、`font-heading` 等）
- [ ] 如有多平台，每个平台建立 `styles/themes/*.css`，仅改变量不改组件
- [ ] 骨架屏 shimmer 动画定义在全局（`@keyframes skeleton-wave`）

### 认证
- [ ] `lib/auth.ts` 实现 `signToken` / `verifyToken` / `requireAuth`
- [ ] `utils/auth.ts` 实现 `getToken` / `setToken` / `clearToken`
- [ ] `utils/request.ts` 中自动注入 Token Header

### 数据库
- [ ] `lib/prisma.ts` 使用单例模式
- [ ] Schema 所有表包含 `id`、`createdAt`、`updatedAt`
- [ ] 环境变量 `DATABASE_URL` 已配置

### 请求层
- [ ] `utils/request.ts` 封装完成，统一处理 4xx/5xx
- [ ] `<Toaster>` 挂载在根 layout

### 共享组件
- [ ] `StatusPill`（状态徽章）
- [ ] `ConfirmDialog`（危险操作确认）
- [ ] `AppLoading`（骨架屏）
- [ ] `LoadingDimmer`（刷新遮罩）
- [ ] 分页控件 `Pagination` + `PageSizeSelect`

### API 规范
- [ ] 列表接口统一返回 `{ success, data, total, page, limit, totalPages }`
- [ ] 失败统一返回 `{ success: false, message }`
- [ ] catch 块识别 `P2002`（唯一冲突）和 `P2025`（记录不存在）

### 响应式
- [ ] 侧边栏宽度用 CSS 变量定义
- [ ] 所有表格包裹在 `overflow-x-auto` 中并设 `min-width`
- [ ] 新页面开发完后在 375px 宽度下测试布局

---

> 文档维护：每次引入新的全局规范，在对应章节更新此文档。  
> 项目特定的规范见同目录下的 `design.md`。
