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

## 认证

- **管理平台**：每个需鉴权的 API Route 调用 `requireManageAuth(request)`（`lib/manage-auth.ts`），返回 `ok: false` 时直接 `return auth.response`
- **前端**：`utils/request.ts` 的 `request()` 自动注入 `Authorization: Bearer <token>` Header，收到 401 自动清除 token 并跳转 `/manage/login`
- **用户平台**：参照管理平台实现，新建 `lib/portal-auth.ts`

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

## 实现状态

**管理平台**：登录 ✅、个人资料 ✅、管理员管理 ✅、其余模块 ⬜

**用户平台**：全部待实现 ⬜

**数据库**：`admin` 表已建，其余待建 ⬜

> 完整设计文档见 [doc/design.md](doc/design.md)
