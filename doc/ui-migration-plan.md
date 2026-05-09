# 管理平台 UI 迁移方案（v2）

> 目标：将管理平台风格切换为设计稿中的「极简暖金」风格，同时建立可扩展的主题架构——
> **换色只改一个文件，manage / portal 样式完全隔离，组件内零写死颜色。**
>
> 设计稿位于 `public/html/`，核心样式见 `public/html/manage-styles.css`。

---

## 一、核心架构

### 问题所在（v1 方案的缺陷）

v1 方案直接在组件里写 `var(--gold)`、`var(--gold-tint)`，把颜色语义（金色）和用途（主色、浅底）耦合在一起。一旦主题色改变，变量名失去意义，且必须逐个修改每个组件。同时所有变量放在 `:root`，manage 和 portal 会互相污染。

### 三层变量架构

```
Layer 1  原子令牌 (Atomic Tokens)        ← 放在 globals.css :root
         平台无关的结构性值：圆角、阴影、字体栈变量名占位

Layer 2  语义变量 (Semantic Variables)   ← 放在 globals.css :root（作为默认值）
         组件只认识这一层：--color-primary, --color-text, --color-surface …
         命名表达「用途」，不表达「颜色」

Layer 3  平台主题 (Platform Theme)       ← 放在各平台主题文件
         [data-platform="manage"] { --color-primary: #8B7355; … }
         [data-platform="portal"] { --color-primary: #0ea5e9; … }
         换主题色 = 只改这里
```

### 运作方式

```
app/manage/layout.tsx
  └─ <div data-platform="manage">   ← 挂载主题作用域
       └─ 所有 manage 页面组件

styles/themes/manage.css            ← 在此作用域内定义 --color-primary 等
  [data-platform="manage"] {
    --color-primary: #8B7355;
    …
  }
```

组件只写 `bg-[var(--color-primary)]`，浏览器沿 DOM 向上找到 `[data-platform="manage"]` 上的定义，自动解析为 `#8B7355`。明天改主题色只需编辑 `styles/themes/manage.css` 中的一行。

### 铁律：组件内禁止出现

```
✗  bg-[#8B7355]               — 写死颜色值
✗  bg-[var(--gold)]           — 语义与颜色名绑定
✗  bg-slate-100               — Tailwind 具体色名（未经语义化）
✗  text-violet-600            — 同上

✓  bg-[var(--color-primary)]  — 语义变量
✓  bg-primary                 — Tailwind 别名（映射到语义变量，见下）
✓  bg-[var(--color-surface-2)]
✓  text-[var(--color-text-muted)]
```

---

## 二、新增文件结构

在现有项目中新增如下文件（其余文件为修改）：

```
styles/
  themes/
    manage.css          ← manage 平台主题（主色、字体、圆角等）
    portal.css          ← portal 平台主题（占位，后续填充）
```

其余均为修改现有文件，无需新增目录层级。

---

## 三、阶段一：语义变量体系

### 3.1 `globals.css` — 原子令牌 + 语义变量默认值

完整替换现有 `:root` 和 `@theme inline` 块：

```css
/* ─── 原子令牌：平台无关 ──────────────────────────── */
:root {
  /* 圆角（所有平台通用，可在主题中覆盖） */
  --radius-sm:   6px;
  --radius:      8px;
  --radius-lg:   12px;

  /* 阴影形状（颜色由主题覆盖） */
  --shadow-sm:   0 1px 2px rgba(0,0,0,.05);
  --shadow:      0 4px 16px rgba(0,0,0,.07);
  --shadow-lg:   0 12px 40px rgba(0,0,0,.13);

  /* 字体栈（字体家族由主题注入，此处为兜底） */
  --typeface-body:    system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --typeface-display: Georgia, 'Songti SC', serif;

  /* ─── 语义变量默认值（防止无主题时组件报错） ─── */

  /* 主色 */
  --color-primary:        #8B7355;
  --color-primary-dark:   #6F5A42;
  --color-primary-tint:   #F5F1EA;
  --color-primary-tint-2: #FAF6EE;

  /* 文字 */
  --color-text:          #1A1A1A;   /* 主要文字 */
  --color-text-2:        #3F3F3F;   /* 次要文字 */
  --color-text-muted:    #8A8A8A;   /* 辅助/说明文字 */
  --color-text-subtle:   #B5B5B5;   /* 占位符 */
  --color-text-disabled: #D8D8D8;   /* 禁用/极淡 */

  /* 背景 */
  --color-surface:       #FAFAFA;   /* 页面底色 */
  --color-surface-2:     #F4F4F4;   /* 次级底色（hover bg） */
  --color-card:          #FFFFFF;   /* 卡片/面板 */

  /* 边框 */
  --color-border:        #ECECEC;   /* 主边框 */
  --color-border-subtle: #F2F2F2;   /* 细分割线 */

  /* 状态色（语义明确，平台间基本通用） */
  --color-success:       #4F8A4F;
  --color-success-bg:    #EEF6EE;
  --color-warning:       #B5803E;
  --color-warning-bg:    #FBF1E1;
  --color-danger:        #C24A3A;
  --color-danger-bg:     #FAEDEA;
  --color-info:          #5A7A95;
  --color-info-bg:       #EEF2F6;
}

/* ─── Tailwind v4：将语义变量暴露为 Tailwind 工具类 ── */
@theme inline {
  /* 字体 */
  --font-sans:              var(--typeface-body);
  --font-display:           var(--typeface-display);

  /* 主色别名（这样 bg-primary / text-primary 自动跟随平台主题） */
  --color-primary:          var(--color-primary);
  --color-primary-dark:     var(--color-primary-dark);
  --color-primary-tint:     var(--color-primary-tint);
  --color-primary-tint-2:   var(--color-primary-tint-2);

  /* 文字别名 */
  --color-text:             var(--color-text);
  --color-text-2:           var(--color-text-2);
  --color-text-muted:       var(--color-text-muted);
  --color-text-subtle:      var(--color-text-subtle);
  --color-text-disabled:    var(--color-text-disabled);

  /* 背景别名 */
  --color-surface:          var(--color-surface);
  --color-surface-2:        var(--color-surface-2);
  --color-card:             var(--color-card);

  /* 边框别名 */
  --color-border:           var(--color-border);
  --color-border-subtle:    var(--color-border-subtle);

  /* 状态别名 */
  --color-success:          var(--color-success);
  --color-success-bg:       var(--color-success-bg);
  --color-warning:          var(--color-warning);
  --color-warning-bg:       var(--color-warning-bg);
  --color-danger:           var(--color-danger);
  --color-danger-bg:        var(--color-danger-bg);
  --color-info:             var(--color-info);
  --color-info-bg:          var(--color-info-bg);
}

/* ─── Base：body 基础样式用语义变量 ─── */
body {
  font-family: var(--typeface-body);
  font-size: 14px;             /* 平台主题可覆盖 */
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-surface);
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-disabled); }
```

> **注意**：`@theme inline` 中将 Tailwind token 指向 CSS 变量（而非硬编码颜色值），因此 `bg-primary` 生成的是 `background-color: var(--color-primary)`，会随平台主题自动解析——这是 Tailwind v4 的核心优势。

---

### 3.2 `styles/themes/manage.css` — Manage 平台主题

```css
/* ═══════════════════════════════════════════════════
   Manage 平台主题：极简暖金
   修改此文件即可完整切换 manage 平台配色，组件无需改动
   ═══════════════════════════════════════════════════ */

[data-platform="manage"] {
  /* —— 主色：暖铜金（当前主题） —— */
  --color-primary:        #8B7355;
  --color-primary-dark:   #6F5A42;
  --color-primary-tint:   #F5F1EA;
  --color-primary-tint-2: #FAF6EE;

  /* —— 文字 —— */
  --color-text:           #1A1A1A;
  --color-text-2:         #3F3F3F;
  --color-text-muted:     #8A8A8A;
  --color-text-subtle:    #B5B5B5;
  --color-text-disabled:  #D8D8D8;

  /* —— 背景 —— */
  --color-surface:        #FAFAFA;
  --color-surface-2:      #F4F4F4;
  --color-card:           #FFFFFF;

  /* —— 边框 —— */
  --color-border:         #ECECEC;
  --color-border-subtle:  #F2F2F2;

  /* —— 阴影（带暖色调） —— */
  --shadow-sm:  0 1px 2px rgba(26, 24, 20, .04);
  --shadow:     0 4px 16px rgba(26, 24, 20, .06);
  --shadow-lg:  0 12px 40px rgba(26, 24, 20, .12);

  /* —— 字体栈 —— */
  --typeface-body:    var(--font-dm-sans, 'DM Sans'), system-ui,
                      'PingFang SC', 'Microsoft YaHei', sans-serif;
  --typeface-display: var(--font-cormorant, 'Cormorant'),
                      var(--font-noto-serif-sc, 'Noto Serif SC'),
                      'Songti SC', Georgia, serif;

  /* —— 版式 —— */
  font-size: 13.5px;
  line-height: 1.55;
  font-feature-settings: 'cv11', 'ss01';

  /* —— 圆角（manage 风格略紧凑） —— */
  --radius-sm: 6px;
  --radius:    8px;
  --radius-lg: 12px;
}
```

> **换色操作**：未来主题色改变时，只需修改此文件顶部的四行 `--color-primary*` 值，以及阴影的 rgba 色调，全平台即刻生效。

---

### 3.3 `styles/themes/portal.css` — Portal 平台主题（占位）

```css
/* ═══════════════════════════════════════════════════
   Portal 平台主题（待设计确定后填充）
   ═══════════════════════════════════════════════════ */

[data-platform="portal"] {
  /* 示例：蓝色系，开发时根据设计稿填充 */
  --color-primary:        #0ea5e9;
  --color-primary-dark:   #0284c7;
  --color-primary-tint:   #e0f2fe;
  --color-primary-tint-2: #f0f9ff;

  --typeface-body:    system-ui, 'PingFang SC', sans-serif;
  --typeface-display: Georgia, serif;

  font-size: 14px;
  line-height: 1.6;
}
```

---

## 四、阶段二：字体引入

### 4.1 根布局 `app/layout.tsx` 引入字体变量

```tsx
import { DM_Sans, Cormorant, Noto_Serif_SC } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});
const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});
const notoSerifSC = Noto_Serif_SC({
  subsets: ['chinese-simplified'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      {/* 仅注入字体变量，实际字体栈由平台主题决定 */}
      <body className={`${dmSans.variable} ${cormorant.variable} ${notoSerifSC.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

> 根布局只负责把字体 CSS 变量（`--font-dm-sans` 等）挂到 DOM 上，**不在此处设置 `font-family`**。字体栈的拼装在平台主题文件中完成，保证两个平台可以用不同字体。

---

## 五、阶段三：平台布局挂载主题

### 5.1 `app/manage/layout.tsx`

```tsx
import '@/styles/themes/manage.css';   // 引入主题文件

export default function ManageLayout({ children }) {
  return (
    <ManageLayoutShell>
      {children}
    </ManageLayoutShell>
  );
}
```

### 5.2 `components/ManageLayoutShell.tsx`

```tsx
export function ManageLayoutShell({ children }) {
  return (
    // data-platform 触发 manage.css 中的 CSS 变量作用域
    <div data-platform="manage" className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 px-8 py-7 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
```

同理，`app/portal/layout.tsx` 引入 `portal.css`，对应的 Shell 上加 `data-platform="portal"`。

---

## 六、阶段四：布局 Shell 重构

### 6.1 `components/Sidebar.tsx`

**结构变更：**
- 移除折叠功能（设计稿无此交互）
- 宽度固定 232px，`sticky top-0 h-screen`（跟随滚动，非 fixed）
- 品牌区：32px 方块 + 「雅」字，字体用 `var(--typeface-display)`
- 导航：按分组显示 section label
- 激活态：左侧 2px 竖线 + 主色文字 + 主色浅底
- 底部 footer：头像 + 姓名 + 角色 + 退出按钮

**关键 className（所有颜色均用语义变量）：**

```tsx
// 容器
<aside className="w-[232px] sticky top-0 h-screen flex flex-col
                  bg-[var(--color-card)] border-r border-[var(--color-border)]">

// 品牌 mark（32px 方块）
<div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white
                grid place-items-center font-[family-name:var(--typeface-display)]
                font-semibold text-[17px]">
  雅
</div>

// 分组 label
<div className="text-[10.5px] text-[var(--color-text-disabled)] tracking-[.16em]
                uppercase font-semibold px-[14px] pt-[14px] pb-2">
  {group}
</div>

// 导航项（默认）
<Link className="flex items-center gap-[11px] px-[14px] py-[9px] rounded-[var(--radius-sm)]
                 text-[var(--color-text-2)] text-[13.5px] font-medium
                 hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]
                 transition-colors relative">

// 导航项（激活）—— 加 before 竖线
<Link className="... text-[var(--color-primary)] bg-[var(--color-primary-tint)]
                 font-semibold before:absolute before:left-[-12px] before:top-2
                 before:bottom-2 before:w-0.5 before:bg-[var(--color-primary)]
                 before:rounded-r">

// 底部 footer 头像
<div className="w-[30px] h-[30px] rounded-full grid place-items-center
                bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)]
                text-[12px] font-semibold border border-[var(--color-border)]">
```

### 6.2 `components/Topbar.tsx`

**结构变更：**
- 高度 `h-[60px]`（从 64px 改）
- 左侧面包屑（父级灰 → `/` → 当前页深色）
- 右侧：通知铃 → 竖分割线 → 城市选择器 → 竖分割线 → 用户菜单
- 用户头像：主色浅底方案

**关键 className：**

```tsx
// header
<header className="h-[60px] bg-[var(--color-card)] border-b border-[var(--color-border)]
                   flex items-center px-7 sticky top-0 z-40">

// 面包屑
<nav className="flex items-center gap-2 text-[12.5px] text-[var(--color-text-muted)]">
  <span>控制台</span>
  <span className="text-[var(--color-text-disabled)]">/</span>
  <span className="text-[var(--color-text)] font-medium">当前页面</span>
</nav>

// 通知铃（34px 圆角方块）
<button className="w-[34px] h-[34px] rounded-[var(--radius-sm)] grid place-items-center
                   text-[var(--color-text-2)] relative
                   hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]">

// 竖分割线
<div className="w-px h-[22px] bg-[var(--color-border)] mx-[10px]" />

// 用户 avatar
<div className="w-[28px] h-[28px] rounded-full grid place-items-center
                bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)]
                text-[11.5px] font-semibold">

// 下拉菜单 popover
<div className="absolute right-0 top-full mt-2 w-[240px]
                bg-[var(--color-card)] border border-[var(--color-border)]
                rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">

// popover 危险项（退出登录）
<button className="... text-[var(--color-danger)]
                   hover:bg-[var(--color-danger-bg)]">
```

---

## 七、阶段五：共享 UI 组件

> 所有组件**只使用语义变量**，不引用任何具体颜色。

### 7.1 Button

| Variant | className 核心 |
|---|---|
| `primary` | `bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]` |
| `ghost` | `bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]` |
| `text` | `text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]` |
| `danger` | `bg-[var(--color-danger)] text-white hover:opacity-90` |

尺寸：default `h-[34px] px-[14px] text-[13px]`，sm `h-[28px] text-[12px]`，lg `h-[40px] text-[13.5px]`。

图标按钮：`w-[30px] h-[30px] rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]`；danger hover 时 `text-[var(--color-danger)] bg-[var(--color-danger-bg)]`。

### 7.2 Card

```tsx
<div className="bg-[var(--color-card)] border border-[var(--color-border)]
                rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
  {/* head */}
  <div className="px-[22px] py-[18px] flex items-center justify-between
                  border-b border-[var(--color-border-subtle)]">
    <div>
      <div className="text-[14.5px] font-semibold text-[var(--color-text)] tracking-tight">
        标题
      </div>
      <div className="text-[12px] text-[var(--color-text-muted)] mt-[3px]">副标题</div>
    </div>
  </div>
  {/* body */}
  <div className="px-[22px] py-5">内容</div>
</div>
```

### 7.3 `components/StatusPill.tsx`（新建，取代 Badge）

```tsx
const variants = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  danger:  'bg-[var(--color-danger-bg)]  text-[var(--color-danger)]',
  info:    'bg-[var(--color-info-bg)]    text-[var(--color-info)]',
  muted:   'bg-[var(--color-surface-2)]  text-[var(--color-text-muted)]',
  accent:  'bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)]',
} as const;

export function StatusPill({ variant, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium ${variants[variant]}`}>
      <span className="w-[5px] h-[5px] rounded-full bg-current opacity-70 shrink-0" />
      {children}
    </span>
  );
}
```

### 7.4 `components/ConfirmDialog.tsx` 更新

| 属性 | 目标值 |
|---|---|
| 遮罩 | `bg-black/40 backdrop-blur-[3px]` |
| 图标容器 | `w-11 h-11 rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger)]` |
| 标题字体 | `font-[family-name:var(--typeface-display)] text-[22px] font-medium` |
| 描述文字 | `text-[13px] text-[var(--color-text-muted)] leading-relaxed` |
| 取消按钮 | ghost variant |
| 确认按钮 | danger variant |

### 7.5 `components/Drawer.tsx`（新建）

```tsx
// 右侧抽屉通用组件，宽 480px，从右滑入
<div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[100]">
  <div className="fixed right-0 top-0 bottom-0 w-[480px] max-w-[96vw]
                  bg-[var(--color-card)] z-[101] flex flex-col
                  shadow-[-16px_0_40px_rgba(0,0,0,.12)]
                  animate-in slide-in-from-right-5 duration-250">
    {/* head / body / foot */}
  </div>
</div>
```

---

## 八、阶段六：表格 & 分页 & 表单

### 8.1 表格头

```tsx
// thead th
className="text-left text-[11.5px] font-medium text-[var(--color-text-muted)]
           uppercase tracking-[.04em] px-4 py-[10px]
           bg-[var(--color-surface-2)]
           border-t border-b border-[var(--color-border-subtle)] whitespace-nowrap"
```

### 8.2 表格行

```tsx
// tbody td
className="px-4 py-[14px] border-b border-[var(--color-border-subtle)]
           align-middle text-[var(--color-text-2)] text-[13px]"

// tr hover
className="hover:*:bg-[var(--color-surface)]"
// 或直接在 tr 上
className="hover:bg-[var(--color-surface)]"
```

### 8.3 表格 Toolbar

```tsx
className="flex items-center gap-[10px] px-[18px] py-[14px]
           border-b border-[var(--color-border-subtle)] flex-wrap"
```

### 8.4 分页

```tsx
// 激活页
className="min-w-[30px] h-[30px] rounded-[var(--radius-sm)] text-[12.5px]
           font-semibold bg-[var(--color-primary)] text-white"

// 普通页
className="min-w-[30px] h-[30px] rounded-[var(--radius-sm)] text-[12.5px]
           text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"

// 禁用
className="text-[var(--color-text-disabled)] cursor-not-allowed"
```

### 8.5 Input / Select / Textarea

```tsx
// 统一 base
className="w-full h-[36px] px-3 border border-[var(--color-border)]
           rounded-[var(--radius-sm)] bg-[var(--color-card)] text-[var(--color-text)]
           text-[13px] outline-none transition-[border-color,box-shadow]
           hover:border-[var(--color-text-disabled)]
           focus:border-[var(--color-primary)]
           focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
           placeholder:text-[var(--color-text-subtle)]"
```

> focus ring 的 `color-mix` 写法能自动跟随主题色，无需写死 `rgba(139,115,85,.14)`。

### 8.6 表单分区标题

```tsx
<div className="font-[family-name:var(--typeface-display)] text-[16px] font-semibold
                text-[var(--color-text)] mb-[14px] flex items-baseline gap-[10px]">
  <span className="inline-block w-[3px] h-[14px] rounded-sm
                   bg-[var(--color-primary)] translate-y-0.5 shrink-0" />
  基本信息
</div>
```

---

## 九、阶段七：弹窗（Modal）

| 属性 | 目标值 |
|---|---|
| 宽度 | 默认 520px，large 680px |
| 标题 | `font-[family-name:var(--typeface-display)] text-[22px] font-medium text-[var(--color-text)]` |
| 副标题 | `text-[12.5px] text-[var(--color-text-muted)] mt-1` |
| 遮罩 | `bg-black/40 backdrop-blur-[3px]` |
| 入场动画 | `animate-in fade-in zoom-in-95 duration-200` |
| 底部 | `border-t border-[var(--color-border-subtle)]` + 右对齐按钮 |

---

## 十、阶段八：页面层

### 10.1 页面头部统一结构

```tsx
<div className="flex items-end justify-between mb-6 gap-4">
  <div>
    <h1 className="font-[family-name:var(--typeface-display)] text-[32px] font-medium
                   tracking-tight text-[var(--color-text)] leading-[1.1] m-0">
      页面标题
    </h1>
    <div className="text-[13px] text-[var(--color-text-muted)] mt-[6px]">副标题</div>
  </div>
  <div className="flex gap-2">{/* 操作按钮 */}</div>
</div>
```

### 10.2 Dashboard 统计卡

```tsx
<div className="bg-[var(--color-card)] border border-[var(--color-border)]
                rounded-[var(--radius)] p-[20px_22px]">
  <div className="flex justify-between items-center
                  text-[12px] text-[var(--color-text-muted)] font-medium tracking-[.02em]">
    <span>总房源数</span>
    <span className="w-[30px] h-[30px] rounded-[var(--radius-sm)]
                     bg-[var(--color-primary-tint)] text-[var(--color-primary)]
                     grid place-items-center">
      <Icon size={16} />
    </span>
  </div>
  <div className="font-[family-name:var(--typeface-display)] text-[32px] font-medium
                  text-[var(--color-text)] tracking-tight mt-3 leading-none tabular-nums">
    18,482
  </div>
  <div className="mt-[10px] text-[11.5px] text-[var(--color-text-muted)]
                  flex items-center gap-[6px]">
    <span className="font-semibold text-[var(--color-success)] tabular-nums">↑ 8.2%</span>
    较上月
  </div>
</div>
```

---

## 十一、执行顺序

```
阶段一  语义变量体系
  ├─ 重写 globals.css（原子令牌 + 语义默认值 + @theme inline）
  └─ 新建 styles/themes/manage.css / portal.css

阶段二  字体引入
  └─ app/layout.tsx 挂载 next/font 变量

阶段三  平台布局挂载主题
  └─ ManageLayoutShell 加 data-platform="manage"，manage layout 引入主题 CSS

阶段四  布局 Shell
  ├─ Sidebar.tsx 重构（新结构，语义变量）
  └─ Topbar.tsx 重构（新结构，语义变量）

阶段五  共享 UI 组件
  ├─ 新建 StatusPill.tsx
  ├─ 新建 Drawer.tsx
  └─ 更新 ConfirmDialog.tsx

阶段六  表格 & 分页 & 表单
  └─ admin/page.tsx + 相关组件

阶段七  弹窗
  └─ admin-form-modal.tsx 等

阶段八  各页面
  └─ 页面头、统计卡等
```

**每阶段完成后打开浏览器验证，再进入下一阶段。**

---

## 十二、文件变更清单

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `app/globals.css` | 重写 | 语义变量体系 + body 基础 + 滚动条 |
| `app/layout.tsx` | 修改 | next/font 引入，挂载字体 CSS 变量 |
| `styles/themes/manage.css` | **新建** | Manage 平台主题（换色只改此文件） |
| `styles/themes/portal.css` | **新建** | Portal 平台主题（占位） |
| `app/manage/layout.tsx` | 修改 | 引入 manage.css |
| `components/ManageLayoutShell.tsx` | 修改 | 加 `data-platform="manage"`，移除折叠 state |
| `components/Sidebar.tsx` | 重构 | 新结构，语义变量，移除折叠 |
| `components/Topbar.tsx` | 重构 | 新结构，语义变量 |
| `components/ConfirmDialog.tsx` | 修改 | 语义变量，标题字体 |
| `components/StatusPill.tsx` | **新建** | 取代各处 Badge |
| `components/Drawer.tsx` | **新建** | 右侧详情抽屉 |
| `app/manage/admin/page.tsx` | 修改 | 表格、Toolbar、分页 |
| `app/manage/admin/admin-form-modal.tsx` | 修改 | 弹窗标题字体、表单 focus 环 |
| `app/manage/page.tsx` | 修改 | Dashboard 统计卡（待实现） |

---

## 十三、换色操作指南

**场景：manage 平台主题色从暖金改为任意颜色**

只需编辑 `styles/themes/manage.css`，修改这四行：

```css
[data-platform="manage"] {
  --color-primary:        #NEW_COLOR;
  --color-primary-dark:   #NEW_COLOR_DARK;   /* hover/active 加深版 */
  --color-primary-tint:   #NEW_COLOR_LIGHT;  /* 浅底背景（约 8% 不透明度） */
  --color-primary-tint-2: #NEW_COLOR_LIGHTER;/* 更浅底背景（约 4% 不透明度） */
```

组件、表格、按钮、分页、表单 focus ring 全部自动更新，**无需改动任何组件文件**。

---

## 十四、注意事项

1. **focus ring 使用 color-mix**：`color-mix(in srgb, var(--color-primary) 15%, transparent)` 比写死 `rgba` 值更健壮，主题色改变时光晕颜色自动跟随。

2. **shadcn/ui 组件**：shadcn 内部使用 `--primary`（`oklch` 格式），和本方案的 `--color-primary` 是两套变量。如果使用了 shadcn 的 `Button`/`Input` 等，需要在平台主题文件中同步更新 shadcn 的 `--primary` token：
   ```css
   [data-platform="manage"] {
     --primary: 45 25% 43%;   /* #8B7355 的 oklch 近似值 */
   }
   ```
   或者直接抛弃 shadcn 的主色变量，用自定义组件替代。

3. **折叠功能**：方案移除了侧边栏折叠，如产品侧有保留需求请提前确认。

4. **portal 平台**：portal 开发时，只需填充 `styles/themes/portal.css`，并在 portal layout 中引入，manage 完全不受影响。

5. **CSS 变量作用域**：`[data-platform="manage"]` 的作用域覆盖其所有子元素，包括通过 `portal/fixed` 定位的 Modal 和 Drawer（只要它们在 DOM 树上是 Shell 的子元素）。若 Modal 使用了 `portal`（如 Radix 的 `DialogPortal`），需确认 portal 节点被插入到 `data-platform` 包裹的范围内，或在主题文件中同时对 `:root` 设置兜底值。
