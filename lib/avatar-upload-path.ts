export const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
export const AVATAR_UPLOAD_PREFIX = "/upload/avatar/";

export function isLocalAvatarUploadPath(filePath: string | null | undefined) {
  return typeof filePath === "string" && filePath.startsWith(AVATAR_UPLOAD_PREFIX);
}

export function isBlobAvatarUploadUrl(filePath: string | null | undefined) {
  if (typeof filePath !== "string" || !filePath) return false;

  try {
    const url = new URL(filePath);
    return url.hostname.endsWith(BLOB_HOST_SUFFIX) && url.pathname.startsWith(AVATAR_UPLOAD_PREFIX);
  } catch {
    return false;
  }
}

export function isManagedAvatarUploadPath(filePath: string | null | undefined) {
  return isLocalAvatarUploadPath(filePath) || isBlobAvatarUploadUrl(filePath);
}
