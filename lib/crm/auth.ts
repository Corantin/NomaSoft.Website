import 'server-only';
import { cookies } from 'next/headers';
import { decode, encode } from 'next-auth/jwt';
import { authSecret, members } from './identity';
import { refreshCookie } from './next-auth';

const accessCookie =
  process.env.NODE_ENV === 'production' ? '__Host-nomasoft.access' : 'nomasoft.access';
const accessSeconds = 15 * 60;
export function canRenew() {
  return Boolean(cookies().get(refreshCookie)?.value);
}
export async function hasSession() {
  const token = cookies().get(accessCookie)?.value;
  if (!token || !canRenew()) return false;
  try {
    const claims = await decode({ token, secret: authSecret(), salt: 'crm-access-v1' });
    return typeof claims?.email === 'string' && members.has(claims.email);
  } catch {
    return false;
  }
}
export async function issueAccess(email: string) {
  const token = await encode({
    token: { email },
    secret: authSecret(),
    salt: 'crm-access-v1',
    maxAge: accessSeconds,
  });
  cookies().set(accessCookie, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: accessSeconds,
  });
}
export function clearAuthCookies() {
  cookies().delete(accessCookie);
  cookies().delete(refreshCookie);
}
