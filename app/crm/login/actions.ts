'use server';
import { redirect } from 'next/navigation';
import { endSession, startSession } from '@/lib/crm/auth';

export async function signIn(form: FormData) {
  const user = form.get('username');
  const password = form.get('password');
  if (
    typeof user !== 'string' ||
    typeof password !== 'string' ||
    !startSession(user.trim().toLowerCase(), password)
  )
    redirect('/crm/login?error=1');
  redirect('/crm');
}
export async function signOut() {
  endSession();
  redirect('/crm/login');
}
