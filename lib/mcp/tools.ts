import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import * as board from '@/lib/crm/handlers/board';
import * as tasks from '@/lib/crm/handlers/tasks';
import * as hours from '@/lib/crm/handlers/hours';
import * as notes from '@/lib/crm/handlers/notes';
import { edit, move, receive, addCharge, issue, work } from '@/lib/crm/model';
import { projectTask, taskOrder } from '@/lib/crm/task';
import { maxNoteLength, maxNoteBytes } from '@/lib/crm/note';
const project = z.object({ project: z.string().uuid() });
const ctx = (project: string) => ({ params: { project } });
function request(path: string, body?: unknown) {
  return new NextRequest('https://www.nomasoft.dev/api/crm' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'x-nomasoft-crm': '1',
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
}
function tool<S extends z.ZodObject>(
  name: string,
  description: string,
  schema: S,
  readOnlyHint: boolean,
  run: (args: z.output<S>) => Promise<Response>,
) {
  return {
    definition: {
      name,
      description,
      inputSchema: z.toJSONSchema(schema, { io: 'input', target: 'draft-7' }),
      annotations: { readOnlyHint, openWorldHint: false },
    },
    call: (args: unknown) => run(schema.parse(args)),
  };
}
export const crmTools = [
  tool(
    'crm_board',
    'Read all projects and customers, stages, next actions, task counts, installments, payments and the current board version. Filter the result for board search or closed projects.',
    z.object({}),
    true,
    () => board.GET(),
  ),
  tool(
    'crm_save_project',
    'Create or edit a customer and project. Use UUIDs for new records and the latest board version. Preserve other fields when editing.',
    edit.omit({ action: true }),
    false,
    (a) => board.POST(request('', { ...a, action: 'save' })),
  ),
  tool(
    'crm_move_project',
    'Move a card to a pipeline stage using the latest board version.',
    move.omit({ action: true }),
    false,
    (a) => board.POST(request('', { ...a, action: 'move' })),
  ),
  tool(
    'crm_add_installment',
    'Add an installment in CAD cents. Reuse its UUID on retry.',
    addCharge.omit({ action: true }),
    false,
    (a) => board.POST(request('', { ...a, action: 'charge' })),
  ),
  tool(
    'crm_issue_installment',
    'Mark an installment issued.',
    issue.omit({ action: true }),
    false,
    (a) => board.POST(request('', { ...a, action: 'issue' })),
  ),
  tool(
    'crm_record_payment',
    'Record a payment received in CAD cents. Reuse its UUID on retry.',
    receive.omit({ action: true }),
    false,
    (a) => board.POST(request('', { ...a, action: 'payment' })),
  ),
  tool(
    'crm_list_tasks',
    'Read ordered tasks and revisions for a project.',
    project,
    true,
    (a) => tasks.GET(request('/tasks'), ctx(a.project)),
  ),
  tool(
    'crm_save_task',
    'Create, edit, complete or reopen a task. Start a new UUID at revision zero.',
    project.extend({ task: projectTask }),
    false,
    (a) => tasks.POST(request('/tasks', a.task), ctx(a.project)),
  ),
  tool(
    'crm_reorder_tasks',
    'Set task priority using the full ordered list of IDs and revisions.',
    project.extend(taskOrder.shape),
    false,
    (a) => tasks.POST(request('/tasks', { order: a.order }), ctx(a.project)),
  ),
  tool(
    'crm_list_hours',
    'Read project time entries from the hours sheet.',
    project,
    true,
    (a) => hours.GET(request('/hours?project=' + a.project)),
  ),
  tool(
    'crm_log_hours',
    'Log time in minutes in the hours sheet. Reuse the entry UUID on retry.',
    work,
    false,
    (a) => hours.POST(request('/hours', a)),
  ),
  tool(
    'crm_list_notes',
    'Read project notes, contact messages, links and attachment metadata.',
    project,
    true,
    (a) => notes.GET(request('/notes'), ctx(a.project)),
  ),
  tool(
    'crm_add_note',
    'Add a project note with links and optional base64 files (2 MiB total). Reuse the UUID on retry.',
    project.extend({
      id: z.string().uuid(),
      text: z.string().max(maxNoteLength),
      files: z
        .array(
          z.object({
            name: z.string().min(1).max(255),
            base64: z.base64().max(4 * Math.ceil(maxNoteBytes / 3)),
          }),
        )
        .max(10)
        .optional(),
    }),
    false,
    (a) => {
      const form = new FormData();
      form.set('id', a.id);
      form.set('text', a.text);
      for (const f of a.files ?? [])
        form.append(
          'files',
          new Blob([new Uint8Array(Buffer.from(f.base64, 'base64'))]),
          f.name,
        );
      return notes.POST(request('/notes', form), ctx(a.project));
    },
  ),
  tool(
    'crm_get_attachment',
    'Download a note attachment by zero-based index as base64.',
    project.extend({ note: z.string().uuid(), file: z.number().int().min(0).max(9) }),
    true,
    async (a) => {
      const res = await notes.GET(
        request('/notes?note=' + a.note + '&file=' + a.file),
        ctx(a.project),
      );
      if (!res.ok) return res;
      return Response.json({
        base64: Buffer.from(await res.arrayBuffer()).toString('base64'),
      });
    },
  ),
];
