import * as handler from '@/lib/crm/handlers/tasks';
import { hasSession } from '@/lib/crm/auth';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, ctx: { params: { project: string } }) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return handler.GET(req, ctx);
}
export async function POST(req: Request, ctx: { params: { project: string } }) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return handler.POST(req, ctx);
}
