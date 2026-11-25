import * as handler from '@/lib/crm/handlers/hours';
import { hasSession } from '@/lib/crm/auth';
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return handler.GET(req);
}
export async function POST(req: NextRequest) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return handler.POST(req);
}
