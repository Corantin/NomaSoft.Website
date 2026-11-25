import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/crm/next-auth';
import {
  issuer,
  resource,
  scope,
  grant,
  callback,
  validAuthorization,
} from '@/lib/mcp/oauth';
export async function POST(req: Request) {
  if (req.headers.get('origin') !== issuer) return new Response(null, { status: 403 });
  const email = (await getServerSession(authOptions))?.user?.email;
  if (!email) return new Response(null, { status: 401 });
  const form = await req.formData(),
    q = new URLSearchParams(String(form.get('request')));
  if (!validAuthorization(q)) return new Response(null, { status: 400 });
  const url = new URL(callback);
  url.searchParams.set('iss', issuer);
  if (q.has('state')) url.searchParams.set('state', q.get('state')!);
  if (form.get('decision') === 'allow')
    url.searchParams.set(
      'code',
      await grant(
        'code',
        { email, resource, scope, challenge: q.get('code_challenge') },
        180,
      ),
    );
  else url.searchParams.set('error', 'access_denied');
  return Response.redirect(url, 303);
}
