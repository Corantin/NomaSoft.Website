import { NextRequest, NextResponse } from 'next/server';
import { hasSession } from '@/lib/crm/auth';
import { hoursService } from '@/lib/crm/hours';
import { crmRecords } from '@/lib/crm/board-store';
import { work } from '@/lib/crm/model';
export const dynamic = 'force-dynamic';

async function hours(id: string | null, entry?: typeof work._type) {
  try {
    if (!(await crmRecords()).engagements.some((project) => project.id === id))
      return NextResponse.json({ error: 'Unknown project.' }, { status: 404 });
    const result = await hoursService(
      entry ? { action: 'work', work: entry } : { action: 'read' },
    );
    const rows = result.work ?? result.board?.work;
    if (!Array.isArray(rows)) throw Error();
    return NextResponse.json(
      rows.filter((row) => row.engagementId === id),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the hours sheet. Try again.' },
      { status: 502 },
    );
  }
}
export async function GET(req: NextRequest) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return hours(req.nextUrl.searchParams.get('project'));
}
export async function POST(req: NextRequest) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  if (
    req.headers.get('x-nomasoft-crm') !== '1' ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  )
    return new Response(null, { status: 403 });
  const parsed = work.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Check the time entry.' }, { status: 400 });
  return hours(parsed.data.engagementId, parsed.data);
}
