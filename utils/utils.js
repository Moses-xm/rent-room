'use client';
import { RsaPublicKey } from '@/utils/constants';
export const handleLogin = (res) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('X-Token', res?.token);
    localStorage.setItem('firstName', res?.firstName);
    localStorage.setItem('lastName', res?.lastName);
  }
};

export const handleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('X-Token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
  }
};

export const handleRemember = (remember, email, password) => {
  if (typeof window !== 'undefined') {
    if (remember) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('isRemember', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.removeItem('isRemember');
    }
  }
};

export const pemToArrayBuffer = (pem) => {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
};

export async function encryptStringWithRsa(
  plainText,
  publicKeyPem = RsaPublicKey
) {
  const keyBuffer = pemToArrayBuffer(publicKeyPem);

  // 导入公钥
  const key = await crypto.subtle.importKey(
    'spki', // 公钥格式 SPKI
    keyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );

  // 加密
  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    encoded
  );

  // 转成 Base64 字符串
  const uint8Array = new Uint8Array(encrypted);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}
