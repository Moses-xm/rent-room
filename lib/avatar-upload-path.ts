export const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
export const AVATAR_PATH_PREFIX = "/upload/avatar/";

function trimAvatarPath(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function getBlobBaseUrl() {
  return trimAvatarPath(process.env.NEXT_PUBLIC_BLOB_BASE_URL).replace(/\/+$/, "");
}

export function isStoredAvatarPath(filePath: string | null | undefined) {
  return typeof filePath === "string" && filePath.startsWith(AVATAR_PATH_PREFIX);
}

export function isAvatarBlobUrl(filePath: string | null | undefined) {
  if (typeof filePath !== "string" || !filePath) return false;

  try {
    const url = new URL(filePath);
    return url.hostname.endsWith(BLOB_HOST_SUFFIX) && url.pathname.startsWith(AVATAR_PATH_PREFIX);
  } catch {
    return false;
  }
}

export function isManagedAvatarPath(filePath: string | null | undefined) {
  return isStoredAvatarPath(filePath) || isAvatarBlobUrl(filePath);
}

export function normalizeAvatarPathForStorage(filePath: string | null | undefined) {
  const normalizedPath = trimAvatarPath(filePath);
  if (!normalizedPath) return "";

  if (isAvatarBlobUrl(normalizedPath)) {
    return new URL(normalizedPath).pathname;
  }

  return normalizedPath;
}

export function resolveAvatarUrl(filePath: string | null | undefined) {
  const normalizedPath = trimAvatarPath(filePath);
  if (!normalizedPath) return "";

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("data:")
  ) {
    return normalizedPath;
  }

  if (isStoredAvatarPath(normalizedPath)) {
    const blobBaseUrl = getBlobBaseUrl();
    return blobBaseUrl ? `${blobBaseUrl}${normalizedPath}` : normalizedPath;
  }

  return normalizedPath;
}

export function toAvatarBlobPathname(filePath: string | null | undefined) {
  const normalizedPath = normalizeAvatarPathForStorage(filePath);

  if (!isStoredAvatarPath(normalizedPath)) {
    return "";
  }

  return normalizedPath.replace(/^\/+/, "");
}
