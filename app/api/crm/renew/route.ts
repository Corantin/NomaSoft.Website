import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/crm/next-auth';
import { clearAuthCookies, issueAccess } from '@/lib/crm/auth';
export const dynamic = 'force-dynamic';
async function renew() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    clearAuthCookies();
    return false;
  }
  await issueAccess(session.user.email);
  return true;
}

export async function GET() {
  redirect((await renew()) ? '/crm' : '/crm/login');
}
export async function POST(request: Request) {
  if (request.headers.get('x-nomasoft-crm') !== '1')
    return new Response(null, { status: 403 });
  return new Response(null, {
    status: (await renew()) ? 204 : 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}
