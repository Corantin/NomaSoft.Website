import 'server-only';
export class CrmAuthFailure extends Error {}
async function run(args: (string | number)[] | (string | number)[][], path: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token)
    throw new CrmAuthFailure('Upstash Redis REST credentials are missing');
  const response = await fetch(url.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new CrmAuthFailure('Upstash returned HTTP ' + response.status);
  return response.json();
}
function unpack(data: Awaited<ReturnType<typeof run>>) {
  if (data.error || !('result' in data))
    throw new CrmAuthFailure('Upstash command failed');
  return data.result;
}

export async function redisCommand(args: (string | number)[]) {
  return unpack(await run(args, ''));
}
export async function redisPipeline(commands: (string | number)[][]) {
  if (!commands.length) return [];
  const results = await run(commands, '/pipeline');
  return results.map(unpack);
}
export const projectTaskKey = (id: string) =>
  'nomasoft:crm:tasks:' + (process.env.VERCEL_ENV || process.env.NODE_ENV) + ':' + id;
