import { NextRequest, NextResponse } from "next/server";
import { requireManageAuth } from "@/lib/manage-auth";
import { requirePortalAuth } from "@/lib/portal-auth";
import { deleteUploadedPicture, savePictureUpload } from "@/lib/uploaded-file";

async function requireAnyAuth(req: NextRequest) {
  const manage = await requireManageAuth(req);
  if (manage.ok) return { ok: true as const };
  const portal = await requirePortalAuth(req);
  if (portal.ok) return { ok: true as const };
  return manage;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAnyAuth(req);
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "请选择要上传的图片" },
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
        { success: false, message: "图片大小不能超过 5MB" },
        { status: 400 },
      );
    }

    const uploaded = await savePictureUpload(file);

    return NextResponse.json({
      success: true,
      message: "图片上传成功",
      data: { path: uploaded.path },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "图片上传失败";
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
        { success: false, message: "缺少待删除的图片路径" },
        { status: 400 },
      );
    }

    await deleteUploadedPicture(filePath);

    return NextResponse.json({ success: true, message: "图片删除成功", data: { path: filePath } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "图片删除失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
