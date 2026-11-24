import { NextRequest, NextResponse } from 'next/server';
import { hasSession } from '@/lib/crm/auth';
import { command } from '@/lib/crm/model';
export const dynamic = 'force-dynamic';

async function callSheet(payload: unknown) {
  const url = process.env.CRM_SHEETS_WEB_APP_URL;
  const secret = process.env.CRM_SHEETS_SECRET;
  if (!url || !secret)
    return NextResponse.json(
      { error: 'Connect the CRM workbook to load this workspace.' },
      { status: 503 },
    );
  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, payload }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
    if (result.conflict)
      return NextResponse.json(
        {
          error:
            'The workbook changed. Close this panel and refresh before editing again.',
        },
        { status: 409 },
      );
    if (!result.board) throw new Error();
    return NextResponse.json(result.board, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'The workbook could not be reached. Refresh to check the latest saved data.',
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  return callSheet({ action: 'read' });
}
export async function POST(req: NextRequest) {
  if (!(await hasSession())) return new Response(null, { status: 401 });
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
  return callSheet(data.data);
}
