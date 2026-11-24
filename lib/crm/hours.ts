import 'server-only';
export async function hoursService(payload: unknown) {
  const url = process.env.CRM_SHEETS_WEB_APP_URL;
  const secret = process.env.CRM_SHEETS_SECRET;
  if (!url || !secret) throw Error('Hours service unavailable');
  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, payload }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw Error('Hours service unavailable');
  return response.json();
}
