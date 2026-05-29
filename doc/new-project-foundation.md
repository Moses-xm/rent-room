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
6. [前端：筛选状态与数据获取模式](#6-前端筛选状态与数据获取模式)
7. [后端：认证、多平台架构与环境变量](#7-后端认证多平台架构与环境变量)
8. [后端：数据库连接规范](#8-后端数据库连接规范)
9. [后端：序列化与数据一致性](#9-后端序列化与数据一致性)
10. [后端：API 响应格式规范](#10-后端-api-响应格式规范)
11. [后端：事务与并发安全](#11-后端事务与并发安全)
12. [后端：错误处理规范](#12-后端错误处理规范)
13. [后端：文件上传规范](#13-后端文件上传规范)
14. [后端：异步任务与懒处理模式](#14-后端异步任务与懒处理模式)
15. [项目结构约定](#15-项目结构约定)
16. [开发流程 Checklist](#16-开发流程-checklist)

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
| `Modal` | 所有弹窗的基础容器，负责遮罩、滚动锁定、居中布局 |
| `StatusPill` | 状态徽章，接受 `variant` prop（success/warning/danger/muted）|
| `ConfirmDialog` | 危险操作的二次确认弹窗，统一 danger/loading 状态 |
| `AppLoading` | 表格骨架屏，接受 rows/columns |
| `LoadingDimmer` | 表格刷新时的半透明遮罩，包裹 table 容器 |
| `EmptyState` | 空列表占位，传 icon + 文字 |
| `Pagination` | 分页控件，接受 page/totalPages/onChange |
| `PageSizeSelect` | 每页条数选择器 |

**核心约定：组件内部一律用语义令牌，绝不写颜色/字号的具体值。**

### 2.2 弹窗规范

#### 核心原则

> **所有弹窗必须通过 `<Modal>` 组件包裹，禁止直接写 `fixed inset-0` 遮罩层。**  
> 滚动锁定、遮罩样式、动画等公共行为统一在 `Modal` 内维护，各弹窗只负责自己的面板内容。

#### Modal 组件职责

`components/Modal.tsx` 负责以下三件事，各弹窗不需要重复处理：

| 职责 | 实现 |
|------|------|
| 背景滚动锁定 | `useBodyScrollLock(open)`，含 iOS Safari 兼容（`position: fixed`）|
| 遮罩层渲染 | `fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px]` |
| 内容居中 | `flex items-center justify-center p-4` |

#### 使用方式

```tsx
import { Modal } from '@/components/Modal';

// 表单类弹窗（open 由外部 state 控制）
export default function MyFormModal({ state, onClose }: Props) {
  if (!state) return null;   // 类型收窄，业务逻辑提前返回

  return (
    <Modal open={!!state}>
      <div className="relative w-full max-w-130 bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">
        {/* 面板内容 */}
      </div>
    </Modal>
  );
}

// 确认类弹窗（open 是 boolean）
export default function MyDialog({ open, onClose }: Props) {
  return (
    <Modal open={open}>
      <div className="relative w-full max-w-sm bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">
        {/* 面板内容 */}
      </div>
    </Modal>
  );
}
```

#### 滚动锁定机制

`utils/use-body-scroll-lock.ts` 使用引用计数，支持多个弹窗叠加时正确解锁：

- 开启：保存 `scrollY`，将 `body` 设为 `position: fixed; top: -scrollY`（阻止 iOS 穿透滚动）
- 关闭：还原所有样式并 `window.scrollTo(0, savedScrollY)`
- 多弹窗：`lockCount` 计数，最后一个关闭时才真正解锁

#### 面板动画约定

- 遮罩淡入：由 `Modal` 负责（`animate-in fade-in duration-200`）
- 面板弹出：各弹窗面板自带 `animate-in zoom-in-95 duration-200`
- 禁止在面板外层再加 `fade-in`，避免双重动画

#### Checklist

- [ ] 新弹窗必须用 `<Modal open={...}>` 包裹，不手写遮罩层
- [ ] 面板 div 加 `animate-in zoom-in-95 duration-200`
- [ ] 表单类弹窗在 `open` 变化时重置表单状态（`useEffect([state])`）
- [ ] 关闭时清理已上传但未保存的临时文件

### 2.3 共享样式片段

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

## 6. 前端：筛选状态与数据获取模式

### 6.1 URL Query 作为筛选状态的单一来源（可选 · 开工前确认）

> ⚠️ **可选能力，不是默认规范。** 并非所有项目都需要把筛选 / 搜索条件挂到 URL 上——后台工具、纯交互弹层、强会话态的页面通常用不上。**新项目启动时主动询问开发者：是否需要列表 / 搜索页支持 URL 可分享 / 刷新保留 / 前进后退？** 需要才按本节落地，不需要就用普通组件 state，保持代码更轻。

#### 适用场景

- 用户找房 / 商品搜索 / 招聘列表等**面向终端用户的检索类页面**——分享链接、SEO、刷新保留是真实诉求
- 服务端需要根据筛选直出首屏（RSC / SSR）

#### 不适用场景

- 后台管理表格：内部使用，刷新重置反而符合直觉
- 弹窗 / 抽屉内的临时筛选：关掉就该清空
- 强会话流程（多步表单、向导）：状态属于流程而非页面

#### 落地方式（确定要做时）

URL 即状态的单一来源，带来三个收益：

- **可分享**：把链接发给别人，对方看到完全相同的筛选结果
- **可前进 / 后退**：浏览器历史天然记录每次筛选，刷新不丢状态
- **SSR / RSC 友好**：服务端可直接读 `searchParams` 渲染首屏

```tsx
'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const sp = useSearchParams();
const router = useRouter();
const pathname = usePathname();

// 读
const district = sp.get('district') ?? '';
const page = Number(sp.get('page') ?? 1);

// 写(合并已有参数，重置页码，replace 不污染历史栈)
function setFilter(patch: Record<string, string | undefined>) {
  const next = new URLSearchParams(sp.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v) next.set(k, v); else next.delete(k);
  }
  next.delete('page');                       // 任意筛选变化都回到第 1 页
  router.replace(`${pathname}?${next.toString()}`);
}
```

**配套约定**（仅在采用本方案时生效）：组件内部不再单独维护与 URL 重复的筛选 state；筛选变化一律改 URL，再由 effect 监听 URL 拉数据。**项目内一旦选定，就要全站统一**——同一项目里有的页面用 URL、有的页面用 state，会让分享行为变得不可预期。

### 6.2 Server Component 直连数据 vs Client + API

App Router 下两种取数路径各有适用场景，开工前就明确每个页面归属哪一类：

| 维度 | RSC 直连数据库 | `'use client'` + `request()` |
|------|---------------|------------------------------|
| 交互需求 | 纯展示，无客户端交互 | 需要筛选 / 分页 / 表单 / 实时态 |
| 鉴权 | 公开页 / 服务端可拿到身份 | 依赖客户端 token |
| 性能 | 省一次 API 往返，首屏直出 | 多一跳，但可懒加载 |
| SEO | 内容直接进 HTML，利于收录 | 内容在客户端渲染 |
| 典型页面 | 首页、落地页、纯详情展示 | 后台列表、个人中心、搜索页 |

**判定原则**：先问「这个页面需要客户端交互或客户端身份吗？」——不需要就用 RSC 直查（少一层 API，少一处类型重复定义）；需要就走 `'use client'` + 统一请求封装。同一功能不要两条路都走。

### 6.3 新建 / 编辑复用同一表单组件

新建和编辑是同一份表单的两种模式，用**一个组件 + 一个 mode 字段**承载，避免维护两份高度重复的表单：

```ts
type FormState =
  | null                       // 关闭
  | { mode: 'add' }            // 新建
  | { mode: 'edit'; item: T }; // 编辑（携带回显数据）
```

- `mode === 'edit'` 时用 `item` 回显字段；`add` 时用默认值
- 提交时按 mode 决定走 POST 还是 PUT
- `open` 变化时在 `useEffect` 中重置表单 state，避免上次输入残留

---

## 7. 后端：认证、多平台架构与环境变量

### 7.1 提前决定认证方案

项目启动前明确：

| 方案 | 适用场景 |
|------|---------|
| JWT（无状态） | API 服务、多平台共享 token |
| Session（有状态） | 传统 Web、需要服务端主动失效 |
| NextAuth / Auth.js | 需要 OAuth 社交登录 |

本项目选择自实现 HS256 JWT，适合多平台（manage/portal）各自独立认证的场景。

### 7.2 Token 颁发与验证集中管理

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

### 7.3 鉴权中间件

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

### 7.4 前端 Token 管理

```ts
// utils/auth.ts
const TOKEN_KEY = 'manage_token';
export const getToken  = () => localStorage.getItem(TOKEN_KEY);
export const setToken  = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
```

### 7.5 多平台共享数据库、认证隔离

当一个项目包含多个面向不同人群的子应用（如「后台管理端」+「面向用户的前台」），推荐架构：

> **共享一套数据库，但每个端的认证彼此完全独立。**

| 维度 | 做法 |
|------|------|
| 页面隔离 | 用路由前缀 / route group 分开（`/admin/*` 与 `/app/*`），各自独立 layout |
| 认证密钥 | 每个端独立 JWT Secret（`ADMIN_JWT_SECRET` / `APP_JWT_SECRET`），互不通用 |
| Token 存储 | 各端用不同的 `localStorage` key，互不覆盖 |
| 鉴权中间件 | 各端一个 `requireXxxAuth()`，校验各自的密钥与身份类型 |
| 请求封装 | 各端一个 `request()` / `appRequest()`，注入各自的 token、各自的 401 重定向目标 |

**收益**：权限边界清晰——一个端签发的 token 在另一个端天然无效；某端密钥泄漏不波及另一端；两端 UI / 主题可独立演进。

### 7.6 环境变量集中与 `.env.example`

开工第一步建立 `.env.example`，列出**所有**必需变量（值留空或填占位），真实值放在 git 忽略的 `.env.local`：

```bash
# .env.example —— 提交到仓库，作为「需要哪些变量」的清单
DATABASE_URL=
ADMIN_JWT_SECRET=
APP_JWT_SECRET=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_MAP_AK=
```

约定：
- **敏感密钥绝不加 `NEXT_PUBLIC_` 前缀**——该前缀会把变量打进客户端 bundle，任何人可见。只有确实需要在浏览器使用的公开 key（如地图 JS API key）才加。
- 新增任何环境变量时，同步补进 `.env.example` 并在 README / 部署平台登记，避免「本地能跑、线上缺变量」。
- 服务端读取必填变量时用 `process.env.X!` 或启动期校验，缺失即早失败，而非运行到一半才报错。

---

## 8. 后端：数据库连接规范

### 8.1 Prisma 单例模式（防止开发环境重复实例化）

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 8.2 Schema 规范

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

### 8.3 删除策略：硬删除为主，共享记录用「每方独立标志」

| 场景 | 策略 |
|------|------|
| 普通记录（仅一个归属方） | **硬删除**；有外键依赖时靠数据库约束阻止误删 |
| 双方共享、各自需独立隐藏的记录（订单、消息、约定等） | 不用全局 `deleted`，而是给每一方一个布尔标志（如 `payerDeleted` / `payeeDeleted`），一方隐藏不影响另一方查看 |

> **关键认知**：「软删除」常被默认当成全局开关，但对双边记录，全局软删除会让一方的删除强加给另一方。用每方独立标志才符合「各自管理自己视图」的真实语义。只有当两方都删除时，该记录才对所有人不可见。

### 8.4 状态 / 类型用整型枚举 + 集中文档化

- 状态、类型这类有限取值的字段统一用 `Int`（如 `status` = 1/2/3），含义写在 schema 字段注释里
- 前端把同一套枚举集中到 `utils/constants.ts`，禁止页面里散落 `status === 2` 这类裸魔法数字
- 一处定义、两端引用，避免「后端是 3、前端写成 2」的隐性 bug

---

## 9. 后端：序列化与数据一致性

### 9.1 每个模型一个序列化函数

每个模型在 `lib/<model>.ts` 下对应一个 `serialize<Model>()`，**路由里不内联拼装响应对象**。好处：响应字段集中可控、敏感字段一处剔除、多个路由复用同一形状。

```ts
// lib/user.ts
export function serializeUser(u: User) {
  const { password: _pw, payCode: _pc, ...rest } = u;   // 敏感字段一律剔除
  return {
    ...rest,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
export type SerializedUser = ReturnType<typeof serializeUser>;
```

### 9.2 所有 `Date` 字段显式 `.toISOString()`

> **序列化函数里每个 `Date` 字段都必须显式 `.toISOString()`，让函数的 TS 返回类型与前端实际收到的 JSON 完全一致。**

原因：`NextResponse.json()` 在运行时会把 `Date` 自动转成字符串，但 **TypeScript 仍以为它是 `Date`**。于是后端类型「说谎」——前端按 `Date` 去 `.getTime()` 就在运行时炸。显式 `.toISOString()` 让类型从 `Date` 变成 `string`，类型即真相。

- 序列化函数的返回类型直接 `export` 给前端复用（`ReturnType<typeof serializeX>`），前后端共享同一份 DTO 定义，杜绝手写两遍字段表的漂移。

### 9.3 敏感字段在序列化层统一剔除

密码、支付密码、token 等敏感字段只在序列化层 `omit` 一次，所有走该函数的响应都不会泄漏。不要依赖「记得在每个路由里删」——那迟早会漏。

---

## 10. 后端：API 响应格式规范

### 10.1 统一响应结构

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

### 10.2 分页列表接口

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

### 10.3 Route 文件结构

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

## 11. 后端：事务与并发安全

### 11.1 多步状态变更必须原子化

> **任何「多步骤、必须全成功或全失败」的写操作，都必须包在数据库事务里。**

典型场景：转账（扣 A 加 B）、下单（扣库存 + 建订单 + 写流水）、连带创建多条记录。任一步失败，已写入的步骤必须回滚，否则数据进入不一致的中间态（钱扣了单没建、库存减了订单丢了）。

```ts
await prisma.$transaction(async (tx) => {
  await tx.account.update({ where: { id: from }, data: { balance: { decrement: amount } } });
  await tx.account.update({ where: { id: to },   data: { balance: { increment: amount } } });
  await tx.ledger.create({ data: { from, to, amount } });
  await tx.notification.create({ data: { userId: to, type: PAID } });
});
```

### 11.2 并发防护：在事务内复检前置条件

「先查后写」（check-then-act）在并发下有 TOCTOU 竞态：两个请求同时读到「库存=1 / 未被占用」，各自都通过校验、各自都写入，资源被重复占用。

> **前置条件的校验必须发生在事务内部、紧贴写操作，而不是在事务外先查一遍。**

```ts
await prisma.$transaction(async (tx) => {
  const room = await tx.room.findUnique({ where: { id } });
  if (room.isRented) throw new Error('已被占用');   // 事务内复检
  await tx.room.update({ where: { id }, data: { isRented: true } });
  // ...建合同 / 扣款 / 写流水
});
```

更强的保证可借助唯一约束（`@@unique`）或带条件的 `updateMany`（受影响行数为 0 即说明被人抢先），让数据库来兜底并发。

### 11.3 金额 / 状态以数据库为唯一真相

前端传来的金额、价格只用于展示，**服务端绝不信任**：在事务内用数据库里的当前值重新计算应扣 / 应加金额。否则客户端可篡改请求体「打折下单」。

---

## 12. 后端：错误处理规范

### 12.1 全局 catch 必须识别 Prisma 错误码

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

### 12.2 HTTP 状态码规范

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

## 13. 后端：文件上传规范

### 13.1 两步式上传

把「上传文件」和「保存业务记录」解耦为两步，而非随表单一次性 multipart 提交：

1. 用户选文件 → 立即 `POST /api/upload`（FormData）→ 上传到对象存储（Vercel Blob / S3）→ 返回 `{ path }`
2. 表单提交时，`path` 作为普通字符串字段随其他业务数据一起入库

好处：上传进度 / 预览独立于表单提交；业务接口只处理 JSON，不掺杂文件流。

### 13.2 入库 normalize、展示 resolve

> **数据库里存的是「规范化路径」，不是完整可访问 URL。**

- 入库前 `normalizeForStorage(path)`：去掉域名 / 存储前缀，只留可移植的相对路径
- 展示时 `resolveUrl(path)`：拼回当前环境的可访问 URL

这样**更换存储后端或域名时，库里的数据无需迁移**——只改 resolve 逻辑即可。

### 13.3 清理孤儿文件

临时上传但最终没保存的文件会变成存储垃圾，必须主动清理：

- 表单中**替换**图片时，删除被替换掉的旧临时文件
- **关闭 / 取消**表单时，删除本次已上传但未提交的文件
- 删除操作走 `request()` 时传 `silent: true`，后台清理不打扰用户

### 13.4 服务端校验，不信任前端

文件类型（MIME / 后缀白名单）和大小上限必须在**服务端**校验。前端的 `accept` 属性和大小检查只是体验优化，可被绕过。

---

## 14. 后端：异步任务与懒处理模式

### 14.1 Serverless 下优先「懒处理」而非定时任务

Serverless / 边缘部署通常没有常驻进程跑 cron。对「到期 / 过期 / 自动流转」这类**基于时间的状态变更**，优先采用**懒处理（lazy processing）**：

> **不靠定时任务主动扫描，而是在相关数据被查询时，先把过期记录批量更新到正确状态，再返回查询结果。**

```ts
// 查询预约列表前，先把所有该过期的记录批量置为过期
await prisma.appointment.updateMany({
  where: { status: PENDING, appointmentTime: { lt: new Date() } },
  data:  { status: EXPIRED },
});
// 然后正常查询，客户端拿到的永远是最新状态
const list = await prisma.appointment.findMany({ where, ... });
```

| | 懒处理 | 定时任务 (cron) |
|---|---|---|
| 基础设施 | 无需，纯查询时触发 | 需要调度器 / 常驻 worker |
| 数据新鲜度 | 被查询的记录永远最新 | 取决于扫描周期 |
| 盲区 | 从不被查询的记录不会更新（通常可接受——没人看） | 全量覆盖 |

### 14.2 何时仍然需要真正的定时任务

懒处理覆盖不了「需要主动推送、与是否被查询无关」的场景，例如：

- 到期前 N 天发送提醒 / 通知（没人查也得发）
- 对账、报表、批量清理等周期性后台作业

这类用 cron / 队列（如 Vercel Cron、外部调度 + 鉴权的 API endpoint）。**判定原则**：状态只要「在被看到时正确」就够 → 懒处理；需要「无人触发也主动发生」→ 定时任务。

---

## 15. 项目结构约定

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

## 16. 开发流程 Checklist

新项目启动时，在写第一个业务页面之前，逐项确认：

### 环境与架构
- [ ] 建立 `.env.example`，列出全部必需环境变量（DB、各端 JWT secret、第三方 key、blob token）
- [ ] 确认无敏感密钥误加 `NEXT_PUBLIC_` 前缀
- [ ] 若多平台：确定路由前缀隔离、各端独立 JWT secret 与 token 存储 key
- [ ] 明确每个页面的取数路径：RSC 直连数据库 还是 `'use client'` + 统一请求封装

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

### 数据库与枚举
- [ ] 删除策略已定：普通记录硬删除，双边共享记录用「每方独立标志」
- [ ] 状态 / 类型用整型枚举，含义集中在 schema 注释与 `utils/constants.ts`

### 序列化与一致性
- [ ] 每个模型有 `serialize<Model>()`，路由不内联拼装响应
- [ ] 所有 `Date` 字段显式 `.toISOString()`，序列化返回类型与前端 JSON 一致
- [ ] 敏感字段（密码等）在序列化层统一剔除

### 事务与并发
- [ ] 多步状态变更包在 `prisma.$transaction` 中，全成功或全失败
- [ ] 占用 / 扣减类操作在事务内复检前置条件，防 TOCTOU 竞态
- [ ] 金额 / 价格以数据库值为准，不信任前端传参

### 文件上传
- [ ] 两步式上传：先传对象存储拿 path，再随表单入库
- [ ] 入库 normalize、展示 resolve，库内不存死 URL
- [ ] 替换 / 关闭表单时清理孤儿临时文件
- [ ] 文件类型与大小在服务端校验

### 异步任务
- [ ] 到期 / 过期类状态采用懒处理（查询前批量更新），无需 cron
- [ ] 需主动推送 / 周期作业的场景才引入定时任务

### 前端数据流
- [ ] **先确认是否需要**：列表 / 搜索页筛选条件是否要同步到 URL Query（可分享、可前进后退）？— 需要则全站统一落地，不需要就用普通 state
- [ ] 新建 / 编辑复用同一表单组件，用 mode 字段区分

---

> 文档维护：每次引入新的全局规范，在对应章节更新此文档。  
> 项目特定的规范见同目录下的 `design.md`。
