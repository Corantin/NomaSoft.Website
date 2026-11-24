import 'server-only';
import { createHash } from 'node:crypto';

import { redisCommand as command } from './redis';
export { CrmAuthFailure } from './redis';

// Both scripts execute atomically so concurrent requests cannot bypass limits or reuse a code.
const issue = `
local t = tonumber(ARGV[1])
redis.call('ZREMRANGEBYSCORE',KEYS[1],'-inf',t-3600000)
if redis.call('ZCARD',KEYS[1]) >= 5 or redis.call('ZCOUNT',KEYS[1], '(' .. (t-60000), '+inf') > 0 then return 0 end
redis.call('ZADD',KEYS[1],t,ARGV[2])
redis.call('EXPIRE',KEYS[1],3600)
redis.call('HSET',KEYS[2],'digest',ARGV[2],'attempts',0)
redis.call('EXPIRE',KEYS[2],600)
return 1`;
const verify = `
local expected = redis.call('HGET',KEYS[1],'digest')
if not expected then return 0 end
if expected ~= ARGV[1] then
  if redis.call('HINCRBY',KEYS[1],'attempts',1) >= 5 then redis.call('DEL',KEYS[1]) end
  return 0
end
redis.call('DEL',KEYS[1])
redis.call('ZADD',KEYS[2],ARGV[3],ARGV[2])
redis.call('ZREMRANGEBYRANK',KEYS[2],0,-21)
redis.call('EXPIRE',KEYS[2],2592000)
return 1`;

function prefix(email: string) {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  const user = createHash('sha256').update(email).digest('hex');
  return 'nomasoft:crm:auth:' + env + ':{' + user + '}:';
}
export async function reserveCode(email: string, digest: string) {
  const key = prefix(email);
  return (
    (await command([
      'EVAL',
      issue,
      2,
      key + 'sends',
      key + 'code',
      Date.now(),
      digest,
    ])) === 1
  );
}
export async function consumeCode(email: string, digest: string, grant: string) {
  const key = prefix(email);
  return (
    (await command([
      'EVAL',
      verify,
      2,
      key + 'code',
      key + 'sessions',
      digest,
      grant,
      Date.now() + 2592000000,
    ])) === 1
  );
}
export async function activeGrant(email: string, grant: string) {
  return (
    Number(await command(['ZSCORE', prefix(email) + 'sessions', grant])) > Date.now()
  );
}
export async function revokeGrant(email: string, grant: string) {
  await command(['ZREM', prefix(email) + 'sessions', grant]);
}
