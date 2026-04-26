# 雅阁租房系统

全栈租房平台，含两个独立子应用：`/manage/*`（管理平台）和 `/portal/*`（用户平台）。

## 技术栈

- **框架**：Next.js 15 App Router（混合渲染）
- **UI**：shadcn/ui + Tailwind CSS v4
- **数据库**：Neon Postgres + Prisma ORM
- **认证**：自实现 HS256 JWT（环境变量 `MANAGE_JWT_SECRET`）
- **文件存储**：Vercel Blob（via `lib/uploaded-file.ts`）
- **地图**：百度地图 JS API（环境变量 `NEXT_PUBLIC_BAIDU_MAP_AK`）

## 开发命令

```bash
npm run dev    # 启动开发服务器
npm run build  # 构建
npm run lint   # ESLint
npx prisma db push   # 同步 Schema 到数据库
```

## 数据库规范

- 所有表含 `id`（自增主键）、`createdAt`、`updatedAt`
- 无软删除，删除即硬删除
- 字段名使用 camelCase

## API 规范

参照 `app/api/manage/admin/` 作为标准实现模板：
- `route.ts`：GET（列表）/ POST（创建）
- `[id]/route.ts`：PUT（更新）/ DELETE（删除）
- 成功返回：`{ success: true, data: ... }`（列表额外含 `total, page, limit, totalPages`）
- 失败返回：`{ success: false, message: '...' }`（附对应 HTTP 状态码）

## 文件上传

1. `POST /api/upload/avatar`（FormData）→ 返回 `{ path: string }`
2. 入库前用 `normalizeUploadPathForStorage()`，展示时用 `resolveUploadedFileUrl()`
3. 替换/关闭表单时调用 `DELETE /api/upload/avatar` 清理旧图

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
│   └── request.ts                    # fetch 封装，自动注入 token
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

**管理平台**：登录 ✅、个人资料 ✅、管理员管理 ✅、其余模块 ⬜

**用户平台**：全部待实现 ⬜

**数据库**：`admin` 表已建，其余待建 ⬜

> 完整设计文档见 [doc/design.md](doc/design.md)

## 需要注意的事情

1.和我对话的时候说中文，并且以My lord开头
3.在我和你对话的时候，如果让你对项目做了某些改动，在代码改动完毕之后记得更新一下design文档的相对应的内容，确保design文档一直和实际的代码的内容是保持同步和一致的。如果修改了design文档，就告诉我修改了哪些部分，如果不需要修改，就告诉我不需要修改。
4.在我和你对话的时候，如果让你对项目的目录结构做了某些改动，在改动完毕之后记得更新一下本文档的项目结构。