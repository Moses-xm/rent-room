import { unlink } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const AVATAR_UPLOAD_PREFIX = "/upload/avatar/";

export function isLocalAvatarUploadPath(filePath: string | null | undefined) {
  return typeof filePath === "string" && filePath.startsWith(AVATAR_UPLOAD_PREFIX);
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

export async function deleteLocalAvatarUpload(filePath: string | null | undefined) {
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
