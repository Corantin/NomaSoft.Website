import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasSession } from '@/lib/crm/auth';
import { redisCommand, projectTaskKey } from '@/lib/crm/redis';
import { orderedTasks, projectTask, taskOrder } from '@/lib/crm/task';

export const dynamic = 'force-dynamic';
type Context = { params: { project: string } };
const saveScript = `
local previous=redis.call('HGET',KEYS[1],ARGV[1])
if previous == ARGV[3] then return 1 end
local revision=previous and cjson.decode(previous).revision or 0
if revision ~= tonumber(ARGV[2]) then return 0 end
redis.call('HSET',KEYS[1],ARGV[1],ARGV[3])
return 1`;
const reorderScript = `
local order=cjson.decode(ARGV[1])
if redis.call('HLEN',KEYS[1]) ~= #order then return 0 end
local tasks={}
local seen={}
for i,item in ipairs(order) do
  local raw=redis.call('HGET',KEYS[1],item.id)
  if not raw or seen[item.id] then return 0 end
  seen[item.id]=true
  tasks[i]=cjson.decode(raw)
  if tasks[i].revision ~= item.revision then return 0 end
end
for i,task in ipairs(tasks) do
  if task.position ~= i then
    task.position=i
    task.revision=task.revision+1
    redis.call('HSET',KEYS[1],task.id,cjson.encode(task))
  end
end
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
      const body = await req.json().catch(() => null);
      const order = taskOrder.safeParse(body);
      let saved;
      if (order.success) {
        saved = await redisCommand([
          'EVAL',
          reorderScript,
          1,
          key,
          JSON.stringify(order.data.order),
        ]);
      } else {
        const result = projectTask.safeParse(body);
        if (!result.success)
          return NextResponse.json({ error: 'Check the task details.' }, { status: 400 });
        const task = result.data;
        saved = await redisCommand([
          'EVAL',
          saveScript,
          1,
          key,
          task.id,
          task.revision,
          JSON.stringify({
            ...task,
            position: task.position ?? (task.revision ? 0 : Date.now()),
            revision: task.revision + 1,
          }),
        ]);
      }
      if (saved !== 1)
        return NextResponse.json(
          { error: 'Someone updated this task. Reload the tasks before editing again.' },
          { status: 409 },
        );
    }
    const records: string[] = await redisCommand(['HVALS', key]);
    return NextResponse.json(
      orderedTasks(records.map((row) => projectTask.parse(JSON.parse(row)))),
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
