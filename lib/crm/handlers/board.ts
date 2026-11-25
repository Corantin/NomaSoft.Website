import { NextRequest, NextResponse } from 'next/server';
import { command } from '@/lib/crm/model';
import { redisPipeline, projectTaskKey } from '@/lib/crm/redis';
import { taskProgress } from '@/lib/crm/task';
import {
  crmRecords,
  BoardConflict,
  InvalidBillingModel,
  InvalidRecord,
} from '@/lib/crm/board-store';
import { z } from 'zod/v4';

async function boardResponse(cmd?: Exclude<z.infer<typeof command>, { action: 'work' }>) {
  try {
    const board = { ...(await crmRecords(cmd)), progress: {} };
    try {
      const ids: string[] = board.engagements.map((e: { id: string }) => e.id);
      const lists = await redisPipeline(ids.map((id) => ['HVALS', projectTaskKey(id)]));
      board.progress = Object.fromEntries(
        ids.map((id, i) => [
          id,
          taskProgress(lists[i].map((row: string) => JSON.parse(row))),
        ]),
      );
    } catch {
      console.warn('[crm] Task counts unavailable');
    }
    return NextResponse.json(board, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof BoardConflict)
      return NextResponse.json({ error: 'The board changed.' }, { status: 409 });
    if (error instanceof InvalidBillingModel)
      return NextResponse.json(
        { error: 'This billing model does not support this operation.' },
        { status: 400 },
      );
    if (error instanceof InvalidRecord)
      return NextResponse.json(
        { error: 'Unknown project or billing record.' },
        { status: 400 },
      );
    return NextResponse.json(
      {
        error: 'The CRM board could not be reached.',
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return boardResponse();
}
export async function POST(req: NextRequest) {
  // Cross-origin browser scripts cannot send this header without a successful CORS preflight.
  if (
    req.headers.get('x-nomasoft-crm') !== '1' ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return NextResponse.json(
      { error: 'Open the CRM on this website to save changes.' },
      { status: 403 },
    );
  }
  const data = command.safeParse(await req.json().catch(() => null));
  if (!data.success)
    return NextResponse.json(
      { error: 'Check the fields and enter valid dates, amounts, and HTTPS links.' },
      { status: 400 },
    );
  if (data.data.action === 'work')
    return NextResponse.json({ error: 'Reload the CRM to log hours.' }, { status: 409 });
  return boardResponse(data.data);
}
