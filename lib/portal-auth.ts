import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PORTAL_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7; // 7 天

type JwtPayload = {
  userId: number;
  username: string;
  exp: number;
  iat: number;
};

type AuthenticatedUser = {
  id: number;
  username: string;
  isActive: boolean;
};

function getJwtSecret() {
  return process.env.PORTAL_JWT_SECRET || 'rent-room-portal-secret-dev-only';
}

function toBase64Url(input: string | Uint8Array) {
  const buffer = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function sign(content: string) {
  return createHmac('sha256', getJwtSecret()).update(content).digest();
}

export function createPortalToken(user: { id: number; username: string }) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    iat: nowInSeconds,
    exp: nowInSeconds + PORTAL_TOKEN_EXPIRES_IN_SECONDS,
  };
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(sign(`${header}.${body}`));
  return `${header}.${body}.${signature}`;
}

export function verifyPortalToken(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSignature = sign(`${header}.${body}`);
  const actualSignature = fromBase64Url(signature);
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) return null;
  try {
    const payload = JSON.parse(fromBase64Url(body).toString('utf8')) as JwtPayload;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

export async function requirePortalAuth(request: Request): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse }
> {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: NextResponse.json({ success: false, message: '未登录或登录已失效' }, { status: 401 }) };
  }
  const payload = verifyPortalToken(token);
  if (!payload) {
    return { ok: false, response: NextResponse.json({ success: false, message: '登录凭证无效或已过期' }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, isActive: true },
  });
  if (!user || !user.isActive) {
    return { ok: false, response: NextResponse.json({ success: false, message: '账号不可用' }, { status: 401 }) };
  }
  return { ok: true, user };
}
