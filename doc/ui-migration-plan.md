# 管理平台 UI 迁移方案

> 目标：将管理平台风格从「紫色现代」切换为设计稿中的「极简暖金」风格。  
> 设计稿位于 `public/html/`，核心样式见 `public/html/manage-styles.css`。

---

## 设计差异速览

| 维度 | 当前 | 目标设计 |
|---|---|---|
| 主色 | 紫色 `#7c3aed` | 暖铜金 `#8B7355` |
| 字体（正文） | Inter / system-ui | DM Sans + PingFang SC |
| 字体（标题） | 无衬线 | Cormorant + Noto Serif SC（衬线） |
| 正文字号 | 14px | 13.5px |
| 背景底色 | `#f8fafc`（冷灰） | `#FAFAFA`（暖白） |
| 侧边栏宽度 | 224px 可折叠 | 232px 固定 |
| 顶栏高度 | 64px | 60px |
| 侧边栏位置 | fixed | sticky（随页面滚动） |
| 按钮风格 | Tailwind 工具类 | 语义类（`btn-primary`/`btn-ghost`） |
| 表格标题 | 普通加粗 | 全大写、细字重、浅灰 |
| 分页激活色 | 紫色 | 金色 |
| 状态标签 | badge | pill（带圆点前缀） |

---

## 阶段一：设计令牌 & 字体

### 1.1 引入 Google Fonts

在 `app/layout.tsx`（根布局）的 `<head>` 中添加 Google Fonts 链接：

```tsx
// 方式 A：next/font/google（推荐，避免运行时请求）
import { DM_Sans, Cormorant, Noto_Serif_SC } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-dm-sans' });
const cormorant = Cormorant({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-cormorant' });
const notoSerifSC = Noto_Serif_SC({ subsets: ['chinese-simplified'], weight: ['400','500','600','700'], variable: '--font-noto-serif-sc' });
```

在 `<body>` 上应用变量类：

```tsx
<body className={`${dmSans.variable} ${cormorant.variable} ${notoSerifSC.variable}`}>
```

### 1.2 重写 CSS 变量（`app/globals.css`）

用以下令牌完整替换 `:root` 块：

```css
:root {
  /* —— 主色 / 金色系 —— */
  --gold:          #8B7355;
  --gold-2:        #6F5A42;
  --gold-tint:     #F5F1EA;
  --gold-tint-2:   #FAF6EE;

  /* —— 文字灰阶 —— */
  --ink:           #1A1A1A;
  --ink-2:         #3F3F3F;
  --ink-3:         #8A8A8A;
  --ink-4:         #B5B5B5;
  --ink-5:         #D8D8D8;

  /* —— 背景 —— */
  --bg:            #FAFAFA;
  --bg-2:          #F4F4F4;
  --card:          #FFFFFF;

  /* —— 分割线 —— */
  --line:          #ECECEC;
  --line-2:        #F2F2F2;

  /* —— 状态色 —— */
  --ok:            #4F8A4F;
  --ok-bg:         #EEF6EE;
  --warn:          #B5803E;
  --warn-bg:       #FBF1E1;
  --danger:        #C24A3A;
  --danger-bg:     #FAEDEA;
  --info:          #5A7A95;
  --info-bg:       #EEF2F6;

  /* —— 圆角 —— */
  --radius-sm:     6px;
  --radius:        8px;
  --radius-lg:     12px;

  /* —— 阴影 —— */
  --shadow-sm:     0 1px 2px rgba(26, 24, 20, .04);
  --shadow:        0 4px 16px rgba(26, 24, 20, .06);
  --shadow-lg:     0 12px 40px rgba(26, 24, 20, .12);

  /* —— 字体栈 —— */
  --typeface-body:    var(--font-dm-sans, 'DM Sans'), system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --typeface-display: var(--font-cormorant, 'Cormorant'), var(--font-noto-serif-sc, 'Noto Serif SC'), 'Songti SC', Georgia, serif;
}
```

同步更新 `@theme inline` 块，将 Tailwind 的 `--color-manage` / `--color-primary` 指向新主色：

```css
@theme inline {
  --font-sans:         var(--typeface-body);
  --font-display:      var(--typeface-display);
  --color-gold:        var(--gold);
  --color-gold-2:      var(--gold-2);
  --color-gold-tint:   var(--gold-tint);
  --color-ink:         var(--ink);
  --color-ink-2:       var(--ink-2);
  --color-ink-3:       var(--ink-3);
  --color-ink-4:       var(--ink-4);
  --color-ink-5:       var(--ink-5);
  --color-manage:      var(--gold);
  --color-primary:     var(--gold);
  /* 其余 portal 色保留不变 */
  --color-portal:      #0ea5e9;
}
```

更新 `body` 基础样式：

```css
body {
  font-family: var(--typeface-body);
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv11', 'ss01';
}
```

更新滚动条：

```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--ink-5); }
```

---

## 阶段二：布局 Shell（Sidebar + Topbar）

### 2.1 `components/Sidebar.tsx` 重构

**结构变更：**
- 移除折叠功能（设计稿无此交互）
- 宽度固定 `232px`，改为 `sticky`（非 `fixed`）
- 品牌区：logo 改为 32px 金色方块（内含「雅」字），字体用 `var(--typeface-display)`
- 导航添加分组标题（section label）
- 激活态：金色文字 + 金色浅底 + 左侧 2px 金色竖线
- 底部 footer：头像（金色浅底） + 姓名 + 角色 + 退出按钮

**导航结构更新：**

```tsx
const NAV_GROUPS = [
  {
    group: '概览',
    items: [{ key: 'dashboard', label: '数据看板', icon: LayoutDashboard, path: '/manage' }],
  },
  {
    group: '业务管理',
    items: [
      { key: 'room',  label: '房源管理', icon: Building2,  path: '/manage/room' },
      { key: 'admin', label: '管理员管理', icon: Users,    path: '/manage/admin' },
    ],
  },
];
```

**关键 className 对照：**

| 元素 | 当前 | 目标 |
|---|---|---|
| 侧边栏容器 | `fixed bg-white border-r border-slate-200 w-56` | `sticky top-0 h-screen flex flex-col bg-white border-r border-[var(--line)]` + 宽度 232px |
| 品牌区 | logo 图片 | 32px 金色方块 + 衬线字体名称 |
| 导航项（默认） | `text-slate-600 hover:bg-slate-100` | `text-[var(--ink-2)] hover:bg-[var(--bg-2)]` |
| 导航项（激活） | `bg-primary-50 text-primary font-bold` | `text-[var(--gold)] bg-[var(--gold-tint)] font-semibold` + 左边竖线 |
| 底部 | 无 | sidebar-footer：头像 + 名字 + 角色 + 退出图标按钮 |

### 2.2 `components/Topbar.tsx` 重构

**结构变更：**
- 高度由 `h-16`（64px）改为 `h-[60px]`
- 左侧面包屑：`控制台 / 当前页面`（用 `var(--ink-3)` 和 `/` 分隔符）
- 右侧操作区顺序：通知铃 → 分割线 → 城市选择器 → 分割线 → 用户菜单
- 用户菜单改为 popover 风格（无圆形 pill 按钮，简洁行内样式）
- 用户 avatar：28px 圆形，金色浅底 + 首字母

**关键 className 对照：**

| 元素 | 当前 | 目标 |
|---|---|---|
| header | `h-16 bg-white border-b border-slate-200` | `h-[60px] bg-white border-b border-[var(--line)]` |
| 面包屑文字（父级） | `text-slate-500` | `text-[var(--ink-3)] text-[12.5px]` |
| 面包屑当前页 | `font-bold text-slate-900` | `text-[var(--ink)] font-medium` |
| 通知铃按钮 | svg 直接 | 34px 圆角方块，带红点 `dot` |
| 用户触发按钮 | pill 形 border 包裹 | 简洁行内 flex，hover 浅灰底 |
| 用户头像 | 紫色圆形 `bg-primary` | 金色浅底 `bg-[var(--gold-tint)]` 文字 `text-[var(--gold-2)]` |
| 下拉菜单 | `rounded-2xl border-slate-200 shadow` | 金色系 popover，`--radius-lg` 圆角，`--shadow-lg` 阴影 |

### 2.3 `components/ManageLayoutShell.tsx` 更新

将 `grid-template-columns` 改为 `232px 1fr`，移除折叠相关 state 和 props。

---

## 阶段三：全局 UI 组件

### 3.1 Button 规范

当前项目使用 shadcn/ui 的 `Button` + Tailwind，迁移后统一改为以下语义类（或对应的 shadcn variant）：

| Variant | 样式 |
|---|---|
| `primary` | `bg-[var(--gold)] text-white hover:bg-[var(--gold-2)]` |
| `ghost` | `bg-white border border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--bg-2)]` |
| `text` / `link` | `text-[var(--gold)] bg-transparent hover:text-[var(--gold-2)]` |
| `danger` | `bg-[var(--danger)] text-white hover:bg-[#944A3D]` |

尺寸：默认 `h-[34px] px-[14px] text-[13px]`，sm `h-[28px] text-[12px]`，lg `h-[40px] text-[13.5px]`。

图标按钮（`icon-btn`）：`w-[30px] h-[30px]` 圆角方块，`text-[var(--ink-3)] hover:bg-[var(--bg-2)]`；danger 变体 hover 时 `text-[var(--danger)] bg-[var(--danger-bg)]`。

### 3.2 Card 规范

```tsx
// Card 容器
<div className="bg-white border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
  {/* card-head */}
  <div className="px-[22px] py-[18px] flex items-center justify-between border-b border-[var(--line-2)]">
    <div>
      <div className="text-[14.5px] font-semibold tracking-tight">标题</div>
      <div className="text-[12px] text-[var(--ink-3)] mt-[3px]">副标题</div>
    </div>
    {/* 右侧操作 */}
  </div>
  {/* card-body */}
  <div className="px-[22px] py-[20px]">内容</div>
</div>
```

### 3.3 状态 Pill（取代现有 Badge）

设计稿使用带圆点的 pill 替代当前 badge：

```tsx
// pill 样式示例（通过 className 传入对应颜色变体）
const pillVariants = {
  ok:     'bg-[var(--ok-bg)]     text-[var(--ok)]',
  warn:   'bg-[var(--warn-bg)]   text-[var(--warn)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
  info:   'bg-[var(--info-bg)]   text-[var(--info)]',
  mute:   'bg-[var(--bg-2)]      text-[var(--ink-3)]',
  gold:   'bg-[var(--gold-tint)] text-[var(--gold-2)]',
};

// 圆点通过 ::before 或内联 span 实现
<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium ${pillVariants[variant]}`}>
  <span className="w-[5px] h-[5px] rounded-full bg-current opacity-70" />
  {children}
</span>
```

可以创建 `components/StatusPill.tsx` 组件，替换各页面现有的 `<Badge>` 用法。

### 3.4 `components/ConfirmDialog.tsx` 更新

对照设计稿 `.confirm` 样式：

- 弹窗宽 420px，padding `28px 28px 22px`
- 顶部图标：44px 圆形，danger 为 `bg-[var(--danger-bg)] text-[var(--danger)]`
- 标题：`font-family: var(--typeface-display)` 22px
- 描述：13px `text-[var(--ink-3)]` line-height 1.6
- 按钮区右对齐，取消（ghost）+ 确认（danger）

遮罩：`bg-[rgba(26,24,20,.38)] backdrop-blur-[3px]`，当前为 `bg-black/50`。

---

## 阶段四：表格 & 列表

### 4.1 表格头样式

当前：普通 `font-medium text-slate-500`  
目标：全大写、小号、稀疏字距

```tsx
// thead th
className="text-left text-[11.5px] font-medium text-[var(--ink-3)] uppercase tracking-[.04em] px-4 py-[10px] bg-[var(--bg-2)] border-t border-b border-[var(--line-2)] whitespace-nowrap"
```

### 4.2 表格行样式

```tsx
// tbody td
className="px-4 py-[14px] border-b border-[var(--line-2)] align-middle text-[var(--ink-2)] text-[13px]"

// hover
"hover:bg-[var(--bg)]"
```

### 4.3 Toolbar（表格上方筛选栏）

```tsx
// 容器
className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-[var(--line-2)] flex-wrap"
```

搜索框：有左侧图标，`w-[260px]`，focus 时 border-gold + 金色光晕。

### 4.4 分页

当前：shadcn Pagination 组件（紫色激活）  
目标：

```tsx
// 激活页按钮
className="min-w-[30px] h-[30px] rounded-[var(--radius-sm)] text-[12.5px] font-semibold bg-[var(--gold)] text-white"

// 普通页按钮
className="min-w-[30px] h-[30px] rounded-[var(--radius-sm)] text-[12.5px] text-[var(--ink-2)] hover:bg-[var(--bg-2)] border border-transparent"

// disabled
className="text-[var(--ink-5)] cursor-not-allowed"
```

---

## 阶段五：表单控件

### 5.1 Input / Select / Textarea

```css
/* 统一的 focus ring：金色边框 + 金色光晕 */
focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(139,115,85,.14)]

/* hover */
hover:border-[var(--ink-5)]

/* 基础 */
border border-[var(--line)] rounded-[var(--radius-sm)] bg-white text-[var(--ink)] h-[36px] px-3 text-[13px]
```

现有组件中的 `focus-visible:ring-primary` 全部替换为上述金色 focus 样式。

### 5.2 Radio / Checkbox 选择器（choice-group）

设计稿使用卡片式 radio/checkbox（非原生控件）：

```tsx
// 激活态
className="border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-tint-2)]"
// 默认态
className="border-[var(--line)] text-[var(--ink-2)] bg-white hover:border-[var(--ink-5)]"
```

### 5.3 表单分区标题

```tsx
// 带金色竖线的区块标题
<div className="font-display text-[16px] font-semibold text-[var(--ink)] mb-[14px] flex items-baseline gap-[10px]">
  <span className="inline-block w-[3px] h-[14px] bg-[var(--gold)] rounded-sm translate-y-0.5" />
  基本信息
</div>
```

---

## 阶段六：弹窗（Modal/Drawer）

### 6.1 Modal

| 属性 | 当前 | 目标 |
|---|---|---|
| 宽度 | shadcn DialogContent | 默认 520px，large 680px |
| 标题字体 | 无衬线 | `var(--typeface-display)` 22px weight 500 |
| 遮罩 | `bg-black/50` | `bg-[rgba(26,24,20,.38)] backdrop-blur-[3px]` |
| 入场动画 | shadcn 默认 | `translateY(8px) scale(.98)` → 正常，0.22s |
| 底部 | 右对齐按钮 | border-top + padding + ghost + primary |

### 6.2 Drawer（详情侧边抽屉）

设计稿在用户/房源详情使用 Drawer，从右侧滑入：

- 宽 480px，`position: fixed; right: 0; top: 0; bottom: 0`
- 入场：`translateX(20px)` → 0，0.25s
- 创建 `components/Drawer.tsx` 通用组件

---

## 阶段七：页面层面

### 7.1 页面头部（page-head）

每个页面顶部统一结构：

```tsx
<div className="flex items-end justify-between mb-6 gap-4">
  <div>
    <h1 className="font-display text-[32px] font-medium tracking-tight text-[var(--ink)] leading-[1.1] m-0">
      管理员管理
    </h1>
    <div className="text-[13px] text-[var(--ink-3)] mt-[6px]">
      副标题
    </div>
  </div>
  <div className="flex gap-2">
    {/* 操作按钮 */}
  </div>
</div>
```

### 7.2 Dashboard 统计卡

```tsx
// stat 卡片结构
<div className="bg-white border border-[var(--line)] rounded-[var(--radius)] p-[20px_22px]">
  <div className="flex justify-between items-center text-[12px] text-[var(--ink-3)] font-medium tracking-[.02em]">
    <span>总房源数</span>
    <span className="w-[30px] h-[30px] rounded-[var(--radius-sm)] bg-[var(--gold-tint)] text-[var(--gold)] grid place-items-center">
      <Icon />
    </span>
  </div>
  <div className="font-display text-[32px] font-medium text-[var(--ink)] tracking-tight mt-3 leading-none tabular-nums">
    18,482
  </div>
  <div className="mt-[10px] text-[11.5px] text-[var(--ink-3)] flex items-center gap-[6px]">
    <span className="font-semibold text-[var(--ok)] tabular-nums">↑ 8.2%</span>
    较上月
  </div>
</div>
```

---

## 执行顺序建议

```
阶段一（令牌 & 字体）
  → 阶段二（Shell 布局）
  → 阶段三（共享 UI 组件）
  → 阶段四（表格）
  → 阶段五（表单）
  → 阶段六（弹窗）
  → 阶段七（各页面）
```

每完成一个阶段后，在浏览器中验证对应页面的视觉效果，再进入下一阶段。

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `app/globals.css` | 重写 | CSS 变量、body 基础、滚动条 |
| `app/layout.tsx` | 修改 | 引入 next/font，挂载字体变量类 |
| `components/Sidebar.tsx` | 重构 | 新结构、固定宽度、移除折叠 |
| `components/Topbar.tsx` | 重构 | 面包屑、新用户 popover、新高度 |
| `components/ManageLayoutShell.tsx` | 修改 | 移除折叠 state，网格改为 232px+1fr |
| `components/ConfirmDialog.tsx` | 修改 | 遮罩色、标题字体、图标样式 |
| `components/StatusPill.tsx` | 新建 | 取代各处 Badge |
| `components/Drawer.tsx` | 新建 | 右侧详情抽屉通用组件 |
| `app/manage/admin/page.tsx` | 修改 | 页面头、表格、工具栏、分页 |
| `app/manage/admin/admin-form-modal.tsx` | 修改 | 弹窗标题字体、按钮样式、focus 环 |
| `app/manage/page.tsx` | 修改 | Dashboard 统计卡（待实现） |

---

## 注意事项

1. **Tailwind v4 兼容**：所有 CSS 变量引用使用 `bg-[var(--gold)]` 语法，已与 Tailwind v4 的任意值系统兼容。
2. **shadcn/ui**：优先修改 shadcn 组件的 `className` prop，不修改组件内部实现，保持可升级性。
3. **折叠功能**：设计稿无折叠侧边栏，移除前确认产品侧是否有保留需求。
4. **字体加载**：DM Sans 在中文环境会 fallback 到 PingFang SC，Cormorant 标题在中文字符会 fallback 到 Noto Serif SC，两者在设计稿中均已验证视觉一致。
5. **逐步迁移**：可以先只改 CSS 变量（阶段一），视觉立即发生变化，然后再逐步精修组件结构。
