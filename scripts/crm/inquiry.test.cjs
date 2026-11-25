// Exercise the production inquiry handler against an isolated board and note store.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const source = readFileSync(__dirname + '/../../lib/crm/inquiry.ts', 'utf8');
function fixture() {
  const board = { customers: [], engagements: [], version: 0 };
  const notes = new Map();
  class BoardConflict extends Error {}
  async function crmRecords(change) {
    if (change) {
      if (change.version !== board.version) throw new BoardConflict();
      if (!board.customers.some((c) => c.id === change.customer.id))
        board.customers.push(change.customer);
      board.engagements.push(change.engagement);
      board.version++;
    }
    return structuredClone(board);
  }
  const deps = {
    './board-store': { crmRecords, BoardConflict },
    './handlers/notes': {
      persistNote: async (project, note, bytes) =>
        notes.set(project + note.id, { project, note, bytes }),
    },
  };
  const exports = {};
  new Function(
    'require',
    'exports',
    ts.transpile(source, {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    }),
  )((name) => deps[name] ?? require(name), exports);
  const submit = (id, email = 'User@example.com') =>
    exports.recordInquiry(
      {
        name: 'User',
        email,
        company: 'Example',
        serviceLabel: 'Development',
        message: 'Website contact message',
        attachment: { filename: 'brief.txt', data: Buffer.from('brief') },
      },
      id,
    );
  return { board, notes, submit };
}
test('concurrent first inquiries create one lead and returning senders append to its thread', async () => {
  const { board, notes, submit } = fixture();
  await Promise.all([submit('a'), submit('b', ' user@EXAMPLE.com ')]);
  assert.equal(board.customers.length, 1);
  assert.equal(board.engagements.length, 1);
  const project = board.engagements[0];
  assert.equal(project.stage, 'New lead');
  project.stage = 'Ongoing';
  await submit('a');
  assert.equal(notes.size, 2);
  assert.equal(project.stage, 'Ongoing');
  for (const { project: id, note, bytes } of notes.values()) {
    assert.equal(id, project.id);
    assert.match(note.text, /Website contact message/);
    assert.equal(note.files[0].name, 'brief.txt');
    assert.equal(Buffer.from(bytes[0], 'base64').toString(), 'brief');
  }
});
test('several unrelated active projects for one address get a triage lead, reused on follow-up', async () => {
  const { board, notes, submit } = fixture();
  await submit('a');
  const first = board.engagements[0];
  first.title = 'Products';
  board.engagements.push({ ...first, id: 'second', title: 'Website' });
  await submit('b');
  await submit('c');
  assert.equal(board.customers.length, 1);
  assert.equal(board.engagements.length, 3);
  assert.equal([...notes.values()][2].project, board.engagements[2].id);
});
