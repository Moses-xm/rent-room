export const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
export const UPLOAD_ROOT_PREFIX = "/upload/";
export const AVATAR_UPLOAD_PREFIX = `${UPLOAD_ROOT_PREFIX}avatar/`;

function trimUploadPath(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function getBlobBaseUrl() {
  return trimUploadPath(process.env.NEXT_PUBLIC_BLOB_BASE_URL).replace(/\/+$/, "");
}

export function isUploadedFilePath(filePath: string | null | undefined) {
  return typeof filePath === "string" && filePath.startsWith(UPLOAD_ROOT_PREFIX);
}

export function isBlobUploadUrl(filePath: string | null | undefined) {
  if (typeof filePath !== "string" || !filePath) return false;

  try {
    const url = new URL(filePath);
    return url.hostname.endsWith(BLOB_HOST_SUFFIX) && url.pathname.startsWith(UPLOAD_ROOT_PREFIX);
  } catch {
    return false;
  }
}

export function isManagedUploadPath(filePath: string | null | undefined) {
  return isUploadedFilePath(filePath) || isBlobUploadUrl(filePath);
}

export function normalizeUploadPathForStorage(filePath: string | null | undefined) {
  const normalizedPath = trimUploadPath(filePath);
  if (!normalizedPath) return "";

  if (isBlobUploadUrl(normalizedPath)) {
    return new URL(normalizedPath).pathname;
  }

  return normalizedPath;
}

export function resolveUploadedFileUrl(filePath: string | null | undefined) {
  const normalizedPath = trimUploadPath(filePath);
  if (!normalizedPath) return "";

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("data:")
  ) {
    return normalizedPath;
  }

  if (isUploadedFilePath(normalizedPath)) {
    const blobBaseUrl = getBlobBaseUrl();
    return blobBaseUrl ? `${blobBaseUrl}${normalizedPath}` : normalizedPath;
  }

  return normalizedPath;
}

export function toBlobPathname(filePath: string | null | undefined) {
  const normalizedPath = normalizeUploadPathForStorage(filePath);

  if (!isUploadedFilePath(normalizedPath)) {
    return "";
  }

  return normalizedPath.replace(/^\/+/, "");
}
