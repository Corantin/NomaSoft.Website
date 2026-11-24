import 'server-only';
export class CrmAuthFailure extends Error {}
export async function redisCommand(args: (string | number)[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token)
    throw new CrmAuthFailure('Upstash Redis REST credentials are missing');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new CrmAuthFailure('Upstash returned HTTP ' + response.status);
  const data = await response.json();
  if (data.error || !('result' in data))
    throw new CrmAuthFailure('Upstash command failed');
  return data.result;
}
