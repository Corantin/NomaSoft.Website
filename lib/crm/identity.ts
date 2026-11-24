import 'server-only';
import { createHmac, randomInt, randomUUID } from 'node:crypto';
import siteContent from '@/content/site.json';

export const MONTH = 30 * 24 * 60 * 60;
export const members = new Map([
  ['corantin.noll@gmail.com', 'Corantin'],
  ['kevinmansour@hotmail.com', 'Kevin'],
]);
export { CrmAuthFailure, activeGrant, revokeGrant } from './redis-auth';
import { CrmAuthFailure, reserveCode, consumeCode } from './redis-auth';
export function authSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new CrmAuthFailure('NEXTAUTH_SECRET is missing');
  return secret;
}
function codeDigest(email: string, code: string) {
  return createHmac('sha256', authSecret())
    .update('crm/login-code/v1:' + email + ':' + code)
    .digest('hex');
}
export async function sendCode(email: string) {
  if (!members.has(email)) return;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    process.env.CONTACT_TO_EMAIL ||
    siteContent.site.contact.email;
  if (!apiKey || !from) throw new CrmAuthFailure('Resend sender or API key is missing');
  const code = randomInt(100000000).toString().padStart(8, '0');
  if (!(await reserveCode(email, codeDigest(email, code)))) return;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your NomaSoft sign-in code',
      text:
        'Your sign-in code is ' +
        code +
        '. It expires in 10 minutes. If you did not request it, ignore this email.',
    }),
  });
  if (!response.ok) throw new CrmAuthFailure('Resend returned HTTP ' + response.status);
}
export async function verifyCode(email: string, code: string) {
  if (!members.has(email) || !/^\d{8}$/.test(code)) return null;
  const grant = randomUUID();
  return (await consumeCode(email, codeDigest(email, code), grant)) ? grant : null;
}
