import * as handler from '@/lib/crm/handlers/board';
import { hasSession } from '@/lib/crm/auth';
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return handler.GET();
}
export async function POST(req: NextRequest) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return handler.POST(req);
}
