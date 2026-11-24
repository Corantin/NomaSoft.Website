import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasSession } from '@/lib/crm/auth';
import { redisCommand, projectTaskKey } from '@/lib/crm/redis';
import { projectTask } from '@/lib/crm/task';

export const dynamic = 'force-dynamic';
type Context = { params: { project: string } };
const saveScript = `
local previous=redis.call('HGET',KEYS[1],ARGV[1])
if previous == ARGV[3] then return 1 end
local revision=previous and cjson.decode(previous).revision or 0
if revision ~= tonumber(ARGV[2]) then return 0 end
redis.call('HSET',KEYS[1],ARGV[1],ARGV[3])
return 1`;
async function handle(req: Request, { params }: Context) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  if (!z.string().uuid().safeParse(params.project).success)
    return new Response(null, { status: 400 });
  const key = projectTaskKey(params.project);
  try {
    if (req.method === 'POST') {
      if (
        req.headers.get('x-nomasoft-crm') !== '1' ||
        req.headers.get('sec-fetch-site') === 'cross-site'
      )
        return new Response(null, { status: 403 });
      const result = projectTask.safeParse(await req.json().catch(() => null));
      if (!result.success)
        return NextResponse.json({ error: 'Check the task details.' }, { status: 400 });
      const task = result.data;
      const saved = await redisCommand([
        'EVAL',
        saveScript,
        1,
        key,
        task.id,
        task.revision,
        JSON.stringify({ ...task, revision: task.revision + 1 }),
      ]);
      if (saved !== 1)
        return NextResponse.json(
          { error: 'Someone updated this task. Reload the tasks before editing again.' },
          { status: 409 },
        );
    }
    const records: string[] = await redisCommand(['HVALS', key]);
    return NextResponse.json(
      records.map((row) => projectTask.parse(JSON.parse(row))),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Project tasks are temporarily unavailable.' },
      { status: 503 },
    );
  }
}
export { handle as GET, handle as POST };
