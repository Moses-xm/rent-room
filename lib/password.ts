import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

const PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

// 存储格式：scrypt$<salt hex>$<hash hex>
export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scrypt(password, salt, KEY_BYTES);
  return `${PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

// 加密存储之前留下的明文密码（含 2021 年迁移过来的老数据）
export function isLegacyPassword(stored: string) {
  return !stored.startsWith(`${PREFIX}$`);
}

// 兼容明文老密码：登录成功后由调用方用 hashPassword 重新存一次
export async function verifyPassword(password: string, stored: string) {
  if (isLegacyPassword(stored)) {
    const input = Buffer.from(password);
    const expected = Buffer.from(stored);
    return input.length === expected.length && timingSafeEqual(input, expected);
  }

  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}
