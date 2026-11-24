'use server';
import { CrmAuthFailure, sendCode } from '@/lib/crm/identity';
export async function requestCode(email: string) {
  if (typeof email !== 'string' || email.length > 254) return { ok: false };
  try {
    await sendCode(email.trim().toLowerCase());
    return { ok: true };
  } catch (error) {
    console.error(
      '[crm] OTP request failed:',
      error instanceof CrmAuthFailure ? error.message : 'Upstream request failed',
    );
    return { ok: false };
  }
}
