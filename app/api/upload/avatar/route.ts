import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireManageAuth } from "@/lib/manage-auth";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getDateFolder() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getExtension(fileName: string, mimeType: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext) return ext;
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return "";
}

export async function POST(req: Request) {
  try {
    const auth = await requireManageAuth(req);
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

    const dateFolder = getDateFolder();
    const fileExt = getExtension(file.name, file.type);
    const fileName = `${Date.now()}-${randomUUID()}${fileExt}`;
    const relativePath = `/upload/avatar/${dateFolder}/${fileName}`;
    const saveDir = path.join(process.cwd(), "public", "upload", "avatar", dateFolder);
    const savePath = path.join(saveDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await mkdir(saveDir, { recursive: true });
    await writeFile(savePath, buffer);

    return NextResponse.json({
      success: true,
      message: "头像上传成功",
      data: {
        path: relativePath,
        url: relativePath,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "头像上传失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
