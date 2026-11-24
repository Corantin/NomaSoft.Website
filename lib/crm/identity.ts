import 'server-only';
import { createHmac, randomInt, randomUUID } from 'node:crypto';
import siteContent from '@/content/site.json';

export const MONTH = 30 * 24 * 60 * 60;
export const members = new Map([
  ['corantin.noll@gmail.com', 'Corantin'],
  ['kevinmansour@hotmail.com', 'Kevin'],
]);
export function authSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is missing');
  return secret;
}
async function ledger(action: string, email: string, extra: Record<string, string> = {}) {
  const url = process.env.CRM_SHEETS_WEB_APP_URL,
    secret = process.env.CRM_SHEETS_SECRET;
  if (!url || !secret) throw new Error('CRM authentication store is unconfigured');
  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ secret, payload: { action, email, ...extra } }),
  });
  if (!response.ok) throw new Error('CRM authentication store unavailable');
  const result = await response.json();
  if (typeof result.ok !== 'boolean')
    throw new Error('CRM authentication store needs the current script deployment');
  return result.ok as boolean;
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
  if (!apiKey || !from) throw new Error('Resend is unconfigured');
  const code = randomInt(100000000).toString().padStart(8, '0');
  if (!(await ledger('otp.issue', email, { digest: codeDigest(email, code) }))) return;
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
  if (!response.ok) throw new Error('Resend could not send the sign-in code');
}
export async function verifyCode(email: string, code: string) {
  if (!members.has(email) || !/^\d{8}$/.test(code)) return null;
  const grant = randomUUID();
  return (await ledger('otp.verify', email, { digest: codeDigest(email, code), grant }))
    ? grant
    : null;
}
export const activeGrant = (email: string, grant: string) =>
  ledger('otp.active', email, { grant });
export const revokeGrant = (email: string, grant: string) =>
  ledger('otp.revoke', email, { grant });
