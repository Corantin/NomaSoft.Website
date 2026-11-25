import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { redisCommand } from '@/lib/crm/redis';
import { members } from '@/lib/crm/identity';
export const issuer = 'https://www.nomasoft.dev',
  resource = issuer + '/api/mcp',
  scope = 'crm';
export const callback = 'https://chatgpt.com/connector_platform_oauth_redirect';
export const clientId = 'https://chatgpt.com/oauth/client.json';
export const digest = (s: string) => createHash('sha256').update(s).digest('base64url');
const key = (kind: string, value: string) =>
  'nomasoft:mcp:' +
  (process.env.VERCEL_ENV || process.env.NODE_ENV) +
  ':' +
  kind +
  ':' +
  digest(value);
export async function grant(kind: string, value: object, seconds: number) {
  const token = randomBytes(32).toString('base64url');
  await redisCommand(['SET', key(kind, token), JSON.stringify(value), 'EX', seconds]);
  return token;
}
export async function lookup(kind: string, token: string, consume = false) {
  if (!/^[\w-]{43}$/.test(token)) return null;
  const raw = await redisCommand([consume ? 'GETDEL' : 'GET', key(kind, token)]);
  return raw ? JSON.parse(raw) : null;
}
export async function authorized(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return false;
  const g = await lookup('access', header.slice(7));
  return !!g && members.has(g.email) && g.resource === resource && g.scope === scope;
}
export function validAuthorization(q: URLSearchParams) {
  return (
    q.get('client_id') === clientId &&
    q.get('redirect_uri') === callback &&
    q.get('response_type') === 'code' &&
    q.get('code_challenge_method') === 'S256' &&
    /^[\w-]{43}$/.test(q.get('code_challenge') || '') &&
    (!q.has('resource') || q.get('resource') === resource) &&
    (!q.has('scope') || q.get('scope') === scope)
  );
}
