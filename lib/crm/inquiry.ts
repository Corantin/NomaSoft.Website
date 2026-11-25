import { randomUUID } from 'node:crypto';
import { crmRecords, BoardConflict } from './board-store';
import { persistNote } from './handlers/notes';

type Inquiry = {
  email: string;
  name: string;
  company?: string;
  message: string;
  serviceLabel: string;
  attachment?: { filename: string; data: Buffer };
};
export async function recordInquiry(inquiry: Inquiry, id: string) {
  const email = inquiry.email.trim().toLowerCase();
  const contact = inquiry.name.trim();
  const name = inquiry.company?.trim() || contact || email.slice(0, 180);
  const title = (name + ' — ' + inquiry.serviceLabel).slice(0, 180);
  for (let attempt = 0; attempt < 5; attempt++) {
    const board = await crmRecords();
    const customers = board.customers.filter(
      (c) => c.email.trim().toLowerCase() === email,
    );
    const customerIds = new Set(customers.map((c) => c.id));
    const projects = board.engagements.filter((d) => customerIds.has(d.customerId));
    const active = projects.filter((d) => d.stage !== 'Closed');
    const exact = projects.filter((d) => d.title.toLowerCase() === title.toLowerCase());
    const existing =
      (exact.length === 1 ? exact[0] : undefined) ??
      (active.length === 1 ? active[0] : projects.length === 1 ? projects[0] : undefined);
    const customer = customers.find((c) => c.id === existing?.customerId) ??
      customers[0] ?? { id: randomUUID(), email, name, contact };
    const project = existing ?? {
      id: randomUUID(),
      customerId: customer.id,
      title,
      stage: 'New lead' as const,
      model: 'Undecided' as const,
      scope: '',
      terms: '',
      owner: '',
      due: '',
      github: '',
      vercel: '',
    };
    if (!existing) {
      try {
        await crmRecords({
          action: 'save',
          version: board.version,
          customer,
          engagement: project,
        });
      } catch (e) {
        if (e instanceof BoardConflict) continue;
        throw e;
      }
    }
    const file = inquiry.attachment;
    await persistNote(
      project.id,
      {
        id,
        createdAt: new Date().toISOString(),
        text: [
          'Website inquiry · ' + inquiry.serviceLabel,
          inquiry.name + ' <' + email + '>',
          inquiry.message,
        ].join('\n\n'),
        files: file ? [{ name: file.filename, size: file.data.length }] : [],
      },
      file ? [file.data.toString('base64')] : [],
    );
    return;
  }
  throw new BoardConflict();
}
