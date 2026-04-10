import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  AVATAR_UPLOAD_PREFIX,
  isBlobAvatarUploadUrl,
  isLocalAvatarUploadPath,
} from "@/lib/avatar-upload-path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

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

function getAvatarUploadPathParts(fileName: string, mimeType: string) {
  const dateFolder = getDateFolder();
  const fileExt = getExtension(fileName, mimeType);
  const storedFileName = `${Date.now()}-${randomUUID()}${fileExt}`;
  const relativePath = `${AVATAR_UPLOAD_PREFIX}${dateFolder}/${storedFileName}`;

  return {
    relativePath,
    pathname: relativePath.replace(/^\/+/, ""),
    storedFileName,
  };
}

function isBlobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isRunningOnVercel() {
  return process.env.VERCEL === "1";
}

function resolveAvatarUploadPath(filePath: string) {
  if (!isLocalAvatarUploadPath(filePath)) return null;

  const relativePath = filePath.replace(/^\/+/, "");
  const absolutePath = path.resolve(PUBLIC_DIR, relativePath);
  const relativeToPublic = path.relative(PUBLIC_DIR, absolutePath);

  if (
    relativeToPublic.startsWith("..") ||
    path.isAbsolute(relativeToPublic) ||
    !relativeToPublic.startsWith("upload/avatar/")
  ) {
    return null;
  }

  return absolutePath;
}

export async function saveAvatarUpload(file: File) {
  const { pathname, relativePath, storedFileName } = getAvatarUploadPathParts(file.name, file.type);

  if (isBlobStorageEnabled()) {
    const blob = await put(pathname, file, {
      access: "public",
    });

    return {
      path: blob.url,
      url: blob.url,
      fileName: storedFileName,
    };
  }

  if (isRunningOnVercel()) {
    throw new Error("Vercel 线上环境缺少 BLOB_READ_WRITE_TOKEN，无法保存上传图片");
  }

  const saveDir = path.join(process.cwd(), "public", path.dirname(pathname));
  const savePath = path.join(saveDir, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(saveDir, { recursive: true });
  await writeFile(savePath, buffer);

  return {
    path: relativePath,
    url: relativePath,
    fileName: storedFileName,
  };
}

async function deleteLocalAvatarUpload(filePath: string) {
  if (!filePath) return;

  const absolutePath = resolveAvatarUploadPath(filePath);
  if (!absolutePath) return;

  try {
    await unlink(absolutePath);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}

export async function deleteUploadedAvatar(filePath: string | null | undefined) {
  if (!filePath) return;

  if (isLocalAvatarUploadPath(filePath)) {
    await deleteLocalAvatarUpload(filePath);
    return;
  }

  if (isBlobAvatarUploadUrl(filePath)) {
    await del(filePath);
  }
}
