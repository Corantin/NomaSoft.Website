import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const cookieName = 'nomasoft_crm';
const sessionSeconds = 12 * 60 * 60;

function passwordFor(user: string) {
  if (user === 'corantin') return process.env.CRM_CORANTIN_PASSWORD;
  if (user === 'kafan') return process.env.CRM_KAFAN_PASSWORD;
}

function equal(a: string, b: string) {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

function signature(payload: string, password: string) {
  return createHmac('sha256', password)
    .update('nomasoft/crm/session/v1:' + payload)
    .digest('base64url');
}

export function startSession(user: string, password: string) {
  const expected = passwordFor(user);
  if (!expected || !equal(expected, password)) return false;
  const expires = Math.floor(Date.now() / 1000) + sessionSeconds;
  const payload = [user, expires, randomBytes(16).toString('hex')].join('.');
  cookies().set(cookieName, payload + '.' + signature(payload, expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionSeconds,
  });
  return true;
}

export function hasSession() {
  const token = cookies().get(cookieName)?.value;
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [user, expires, nonce, mac] = parts;
  const password = passwordFor(user);
  return Boolean(
    password &&
      /^\d+$/.test(expires) &&
      Number(expires) > Date.now() / 1000 &&
      equal(mac, signature([user, expires, nonce].join('.'), password)),
  );
}

export function endSession() {
  cookies().delete(cookieName);
}
