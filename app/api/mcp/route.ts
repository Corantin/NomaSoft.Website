import { crmTools } from '@/lib/mcp/tools';
import { authorized, issuer } from '@/lib/mcp/oauth';
import { ZodError } from 'zod/v4';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && origin !== issuer) return new Response(null, { status: 403 });
  if (!(await authorized(req)))
    return new Response(null, {
      status: 401,
      headers: {
        'WWW-Authenticate':
          'Bearer resource_metadata="' +
          issuer +
          '/.well-known/oauth-protected-resource/api/mcp"',
      },
    });
  const body = await req.json().catch(() => null);
  const id = body?.id ?? null;
  const error = (code: number, message: string) =>
    Response.json({ jsonrpc: '2.0', id, error: { code, message } });
  const result = (result: unknown) =>
    Response.json(
      { jsonrpc: '2.0', id, result },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  if (body?.jsonrpc !== '2.0' || typeof body.method !== 'string')
    return error(-32600, 'Invalid request');
  if (body.id === undefined) return new Response(null, { status: 202 });
  switch (body.method) {
    case 'initialize':
      return result({
        protocolVersion: ['2025-03-26', '2025-06-18', '2025-11-25'].includes(
          body.params?.protocolVersion,
        )
          ? body.params.protocolVersion
          : '2025-11-25',
        capabilities: { tools: {} },
        serverInfo: { name: 'nomasoft-crm', version: '1.0.0' },
      });
    case 'ping':
      return result({});
    case 'tools/list':
      return result({ tools: crmTools.map((t) => t.definition) });
    case 'tools/call': {
      const tool = crmTools.find((t) => t.definition.name === body.params?.name);
      if (!tool) return error(-32602, 'Unknown CRM tool');
      try {
        const response = await tool.call(body.params.arguments ?? {});
        return result({
          content: [{ type: 'text', text: await response.text() }],
          isError: !response.ok,
        });
      } catch (e) {
        return result({
          isError: true,
          content: [
            {
              type: 'text',
              text: e instanceof ZodError ? e.message : 'CRM operation failed.',
            },
          ],
        });
      }
    }
    default:
      return error(-32601, 'Unknown method');
  }
}
