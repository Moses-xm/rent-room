# 雅阁租房系统

全栈租房平台。`/manage/*` 管理平台，`/portal/*` 用户平台，共享数据库，认证独立。完整设计见 [doc/design.md](doc/design.md)。

## 技术栈
Next.js 15 App Router · shadcn/ui + Tailwind CSS v4 · Neon Postgres + Prisma · 自实现 HS256 JWT（`MANAGE_JWT_SECRET`）· Vercel Blob（`lib/uploaded-file.ts`）· 百度地图 JS API（`NEXT_PUBLIC_BAIDU_MAP_AK`）

## 开发命令
`npm run dev` · `npm run build` · `npm run lint` · `npx prisma db push`

## 数据库规范
所有表含 `id`（自增主键）、`createdAt`、`updatedAt`。无软删除，硬删除。字段名 camelCase。

## API 规范
模板参照 `app/api/manage/admin/`：`route.ts` → GET(列表)/POST(创建)，`[id]/route.ts` → PUT(更新)/DELETE(删除)。
成功：`{ success: true, data }` 列表额外含 `total, page, limit, totalPages`。失败：`{ success: false, message }`（含对应 HTTP 状态码）。

## 前端规范
- 请求统一用 `utils/request.ts` 的 `request<T>()`；不满足需求时扩展参数，不另起炉灶
- 新增普通 CRUD 模块时参照管理员管理模块，保持表格/表单/筛选/分页/弹窗风格一致
- **错误处理**：`request()` 自动处理 4xx/5xx 异常并显示 toast 错误提示，页面层只需处理业务逻辑和成功提示；特殊场景（表单级错误展示、后台清理操作）传 `silent: true` 参数抑制 toast

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
│   │   │   ├── login/route.ts
│   │   │   └── profile/route.ts
│   │   └── upload/
│   │       └── avatar/route.ts       # 图片上传 / 删除
│   ├── manage/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   └── admin-form-modal.tsx
│   │   ├── login/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── room/page.tsx
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
│   ├── CitySelector.tsx
│   ├── ConfirmDialog.tsx
│   ├── LoadingDimmer.tsx
│   ├── ManageLayoutShell.tsx
│   ├── Modal.tsx                     # 所有弹窗的基础容器（遮罩+滚动锁定）
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── lib/                              # 服务端工具
│   ├── admin.ts                      # admin 序列化
│   ├── manage-auth.ts                # JWT 签发 / 验证 / 鉴权
│   ├── prisma.ts                     # Prisma 客户端单例
│   ├── upload-path.ts                # 上传路径工具
│   └── uploaded-file.ts              # Vercel Blob 操作封装
├── utils/                            # 客户端工具
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
管理平台：登录 ✅、个人资料 ✅、管理员管理 ✅、其余模块 ⬜。用户平台：全部 ⬜。数据库：`admin` 表 ✅，其余 ⬜。

## 协作约定
- 回复用中文，以 **My lord** 开头
- 代码改动完成后同步更新 [doc/design.md](doc/design.md)，并告知修改了哪些部分；无需修改也须说明
- 目录结构变化时同步更新本文档「项目结构」章节
