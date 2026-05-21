import { NextRequest, NextResponse } from "next/server";
import { requireManageAuth } from "@/lib/manage-auth";
import { requirePortalAuth } from "@/lib/portal-auth";
import { deleteUploadedAvatar, saveAvatarUpload } from "@/lib/uploaded-file";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function requireAnyAuth(req: NextRequest) {
  const manage = await requireManageAuth(req);
  if (manage.ok) return { ok: true as const };
  const portal = await requirePortalAuth(req);
  if (portal.ok) return { ok: true as const };
  return manage; // 返回 manage 的 401 响应
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAnyAuth(req);
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "请选择要上传的头像图片" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "仅支持 JPG、PNG、WEBP 或 GIF 格式" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "头像图片大小不能超过 5MB" },
        { status: 400 },
      );
    }

    const uploadedFile = await saveAvatarUpload(file);

    return NextResponse.json({
      success: true,
      message: "头像上传成功",
      data: {
        path: uploadedFile.path,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "头像上传失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAnyAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const filePath = typeof body?.path === "string" ? body.path.trim() : "";

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: "缺少待删除的头像路径" },
        { status: 400 },
      );
    }

    await deleteUploadedAvatar(filePath);

    return NextResponse.json({
      success: true,
      message: "头像删除成功",
      data: {
        path: filePath,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "头像删除失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
