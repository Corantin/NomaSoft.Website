import {
  resource,
  scope,
  lookup,
  grant,
  clientId,
  callback,
  digest,
} from '@/lib/mcp/oauth';
import { members } from '@/lib/crm/identity';
export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  const fail = () =>
    Response.json(
      { error: 'invalid_grant' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  if (
    !f ||
    f.get('client_id') !== clientId ||
    (f.has('resource') && f.get('resource') !== resource)
  )
    return fail();
  const type = f.get('grant_type');
  let email: string, until: number;
  if (type === 'authorization_code') {
    const g = await lookup('code', String(f.get('code')), true),
      verifier = String(f.get('code_verifier'));
    if (
      !g ||
      f.get('redirect_uri') !== callback ||
      !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
      digest(verifier) !== g.challenge
    )
      return fail();
    email = g.email;
    until = Date.now() + 30 * 86400000;
  } else if (type === 'refresh_token') {
    const g = await lookup('refresh', String(f.get('refresh_token')), true);
    if (!g || g.until <= Date.now()) return fail();
    email = g.email;
    until = g.until;
  } else return fail();
  if (!members.has(email)) return fail();
  const remaining = Math.max(1, Math.floor((until - Date.now()) / 1000)),
    ttl = Math.min(900, remaining);
  return Response.json(
    {
      token_type: 'Bearer',
      scope,
      expires_in: ttl,
      access_token: await grant('access', { email, resource, scope }, ttl),
      refresh_token: await grant('refresh', { email, until }, remaining),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
