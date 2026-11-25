import { NextRequest, NextResponse } from 'next/server';
import { hoursService } from '@/lib/crm/hours';
import { crmRecords } from '@/lib/crm/board-store';
import { work, editWork } from '@/lib/crm/model';

async function hours(
  id: string | null,
  entry?: typeof work._output,
  previous?: typeof editWork._output.previous,
) {
  try {
    if (!(await crmRecords()).engagements.some((project) => project.id === id))
      return NextResponse.json({ error: 'Unknown project.' }, { status: 404 });
    const result = await hoursService(
      entry
        ? { action: previous ? 'editWork' : 'work', work: entry, previous }
        : { action: 'read' },
    );
    if (result.error === 'conflict')
      return NextResponse.json(
        {
          error:
            'This time entry changed. Cancel and reopen it to edit the latest version.',
        },
        { status: 409 },
      );
    if (result.error === 'not_found')
      return NextResponse.json(
        { error: 'Time entry no longer exists.' },
        { status: 404 },
      );
    const rows = result.work;
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
  return hours(req.nextUrl.searchParams.get('project'));
}
export async function POST(req: NextRequest) {
  if (
    req.headers.get('x-nomasoft-crm') !== '1' ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  )
    return new Response(null, { status: 403 });
  const body = await req.json().catch(() => null);
  if (body?.action === 'editWork') {
    const parsed = editWork.safeParse(body);
    if (
      !parsed.success ||
      parsed.data.work.id !== parsed.data.previous.id ||
      parsed.data.work.engagementId !== parsed.data.previous.engagementId
    )
      return NextResponse.json({ error: 'Invalid time entry edit.' }, { status: 400 });
    return hours(parsed.data.work.engagementId, parsed.data.work, parsed.data.previous);
  }
  const parsed = work.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Check the time entry.' }, { status: 400 });
  return hours(parsed.data.engagementId, parsed.data);
}
