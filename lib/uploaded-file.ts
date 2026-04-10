import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import path from "path";
import {
  AVATAR_PATH_PREFIX,
  toAvatarBlobPathname,
} from "@/lib/avatar-upload-path";

function getAvatarDateFolder() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getAvatarFileExtension(fileName: string, mimeType: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext) return ext;
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return "";
}

function buildAvatarBlobPath(fileName: string, mimeType: string) {
  const dateFolder = getAvatarDateFolder();
  const fileExtension = getAvatarFileExtension(fileName, mimeType);
  const storedFileName = `${Date.now()}-${randomUUID()}${fileExtension}`;
  const storedPath = `${AVATAR_PATH_PREFIX}${dateFolder}/${storedFileName}`;

  return {
    storedPath,
    blobPathname: storedPath.replace(/^\/+/, ""),
  };
}

function assertBlobStorageConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("缺少 BLOB_READ_WRITE_TOKEN，无法处理头像上传");
  }
}

export async function saveAvatarUpload(file: File) {
  assertBlobStorageConfigured();

  const { storedPath, blobPathname } = buildAvatarBlobPath(file.name, file.type);
  await put(blobPathname, file, { access: "public" });

  return {
    path: storedPath,
  };
}

export async function deleteUploadedAvatar(filePath: string | null | undefined) {
  const blobPathname = toAvatarBlobPathname(filePath);

  if (!blobPathname) {
    return;
  }

  assertBlobStorageConfigured();
  await del(blobPathname);
}
