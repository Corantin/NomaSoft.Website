'use server';
import { sendCode } from '@/lib/crm/identity';
export async function requestCode(email: string) {
  if (typeof email !== 'string' || email.length > 254) return { ok: false };
  try {
    await sendCode(email.trim().toLowerCase());
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
