import { z } from 'zod';
import { crmRecords } from '@/lib/crm/board-store';
import { redisCommand } from '@/lib/crm/redis';
import { maxNoteBytes, maxNoteLength, type ProjectNote } from '@/lib/crm/note';

const uuid = z.string().uuid();
const save = `
local existing = redis.call('HGET',KEYS[1],ARGV[1])
if existing then return existing end
for i=3,#ARGV do redis.call('HSET',KEYS[2],tostring(i-3),ARGV[i]) end
redis.call('HSET',KEYS[1],ARGV[1],ARGV[2])
return ARGV[2]`;

function noteKey(project: string) {
  return (
    'nomasoft:crm:notes:' +
    (process.env.VERCEL_ENV || process.env.NODE_ENV) +
    ':{' +
    project +
    '}'
  );
}
export async function persistNote(project: string, note: ProjectNote, bytes: string[]) {
  const key = noteKey(project);
  const saved = await redisCommand([
    'EVAL',
    save,
    2,
    key,
    key + ':' + note.id,
    note.id,
    JSON.stringify(note),
    ...bytes,
  ]);
  return JSON.parse(saved) as ProjectNote;
}
async function handle(req: Request, { params }: { params: { project: string } }) {
  if (!uuid.safeParse(params.project).success) return new Response(null, { status: 400 });
  const key = noteKey(params.project);
  const unavailable = () =>
    new Response('Notes are temporarily unavailable.', { status: 503 });
  try {
    if (req.method === 'POST') {
      if (
        req.headers.get('x-nomasoft-crm') !== '1' ||
        req.headers.get('sec-fetch-site') === 'cross-site'
      )
        return new Response(null, { status: 403 });
      if (Number(req.headers.get('content-length')) > maxNoteBytes + 131072)
        return new Response('Attachments can total up to 2 MB per note.', {
          status: 413,
        });
      const data = await req.formData().catch(() => null);
      if (!data) return new Response('Invalid note.', { status: 400 });
      const id = data.get('id'),
        body = data.get('text'),
        parts = data.getAll('files');
      if (
        typeof id !== 'string' ||
        !uuid.safeParse(id).success ||
        typeof body !== 'string' ||
        body.length > maxNoteLength ||
        (!body.trim() && !parts.length) ||
        parts.length > 10
      )
        return new Response('Check the note and attachments.', { status: 400 });
      const files = parts.filter((f): f is File => typeof f !== 'string');
      if (
        files.length !== parts.length ||
        files.some((f) => !f.name || f.name.length > 255)
      )
        return new Response('Invalid attachment.', { status: 400 });
      if (files.reduce((sum, f) => sum + f.size, 0) > maxNoteBytes)
        return new Response('Attachments can total up to 2 MB per note.', {
          status: 413,
        });
      if (!(await crmRecords()).engagements.some((d) => d.id === params.project))
        return new Response('Unknown project.', { status: 404 });
      const note: ProjectNote = {
        id,
        text: body.trim(),
        createdAt: new Date().toISOString(),
        files: files.map(({ name, size }) => ({ name, size })),
      };
      const bytes = await Promise.all(
        files.map(async (f) => Buffer.from(await f.arrayBuffer()).toString('base64')),
      );
      return Response.json(await persistNote(params.project, note, bytes));
    }
    const query = new URL(req.url).searchParams;
    if (query.has('note') || query.has('file')) {
      const id = query.get('note'),
        index = query.get('file') ?? '';
      if (!uuid.safeParse(id).success || !/^\d$/.test(index))
        return new Response(null, { status: 400 });
      const raw = await redisCommand(['HGET', key, id!]);
      const file = raw && (JSON.parse(raw) as ProjectNote).files[Number(index)];
      if (!file) return new Response(null, { status: 404 });
      const bytes = await redisCommand(['HGET', key + ':' + id, index]);
      if (bytes === null) return unavailable();
      return new Response(Buffer.from(bytes, 'base64'), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition':
            "attachment; filename*=UTF-8''" +
            encodeURIComponent(file.name).replace(
              /['()*]/g,
              (c) => '%' + c.charCodeAt(0).toString(16),
            ),
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const rows: string[] = await redisCommand(['HVALS', key]);
    return Response.json(
      rows
        .map((row) => JSON.parse(row) as ProjectNote)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return unavailable();
  }
}
export { handle as GET, handle as POST };
