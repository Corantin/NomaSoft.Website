import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { command, type Board } from './model';
import { redisCommand } from './redis';

type Records = Pick<
  Board,
  'customers' | 'engagements' | 'charges' | 'payments' | 'version'
>;
type Change = Exclude<z.infer<typeof command>, { action: 'work' }>;
const key = 'nomasoft:crm:board:' + (process.env.VERCEL_ENV || process.env.NODE_ENV);
export class BoardConflict extends Error {}
export class InvalidRecord extends Error {}

async function snapshot(): Promise<string> {
  const existing = await redisCommand(['GET', key]);
  if (existing !== null) return existing;
  // Production has been migrated. A missing board must be recovered from backup.
  if (process.env.VERCEL_ENV === 'production')
    throw Error('Missing production CRM board');
  const raw = JSON.stringify({
    customers: [],
    engagements: [],
    charges: [],
    payments: [],
    version: randomUUID(),
  });
  if (await redisCommand(['SET', key, raw, 'NX'])) return raw;
  const winner = await redisCommand(['GET', key]);
  if (winner === null) throw Error('CRM initialization failed');
  return winner;
}
function put<T extends { id: string }>(list: T[], row: T) {
  const index = list.findIndex((item) => item.id === row.id);
  if (index < 0) list.push(row);
  else list[index] = row;
}
function change(records: Records, cmd: Change) {
  if ('version' in cmd && cmd.version !== records.version) throw new BoardConflict();
  const project = (id: string) => {
    const found = records.engagements.find((row) => row.id === id);
    if (!found) throw new InvalidRecord();
    return found;
  };
  switch (cmd.action) {
    case 'save':
      if (cmd.customer.id !== cmd.engagement.customerId) throw new InvalidRecord();
      put(records.customers, cmd.customer);
      put(records.engagements, cmd.engagement);
      break;
    case 'move':
      project(cmd.engagementId).stage = cmd.stage;
      break;
    case 'issue': {
      const charge = records.charges.find((row) => row.id === cmd.chargeId);
      if (!charge) throw new InvalidRecord();
      charge.issued = true;
      break;
    }
    case 'charge':
      project(cmd.charge.engagementId);
      if (records.charges.some((row) => row.id === cmd.charge.id)) return false;
      records.charges.push(cmd.charge);
      break;
    case 'payment':
      project(cmd.payment.engagementId);
      if (records.payments.some((row) => row.id === cmd.payment.id)) return false;
      records.payments.push(cmd.payment);
      break;
  }
  records.version = randomUUID();
  return true;
}
const compareAndSet =
  "if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end redis.call('SET',KEYS[1],ARGV[2]) return 1";
export async function crmRecords(cmd?: Change): Promise<Records> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const raw = await snapshot();
    const records: Records = JSON.parse(raw);
    if (!cmd || !change(records, cmd)) return records;
    if (await redisCommand(['EVAL', compareAndSet, 1, key, raw, JSON.stringify(records)]))
      return records;
  }
  throw new BoardConflict();
}
