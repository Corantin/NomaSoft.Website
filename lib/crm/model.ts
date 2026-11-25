import { z } from 'zod/v4';

export const stages = [
  'New lead',
  'Meeting to schedule',
  'Proposal',
  'Ongoing',
  'Maintenance',
  'On ice',
  'Closed',
] as const;
export const models = [
  'Undecided',
  'Fixed installments',
  'Hourly',
  'Prepaid hours',
  'Maintenance retainer',
  'Exchange',
] as const;
const short = z.string().trim().max(180);
const required = short.min(1);
const note = z.string().trim().max(4000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const link = z.union([
  z.literal(''),
  z
    .string()
    .url()
    .max(1000)
    .regex(/^https:\/\//i),
]);
const id = z.string().uuid();
export const projectLink = z.object({
  id,
  label: required,
  url: z
    .string()
    .trim()
    .max(8192)
    .url()
    .regex(/^https?:\/\//i),
});
export const saveLink = z.object({
  action: z.literal('saveLink'),
  engagementId: id,
  link: projectLink,
  version: z.string().max(100),
});
export const removeLink = z.object({
  action: z.literal('removeLink'),
  engagementId: id,
  linkId: id,
  version: z.string().max(100),
});
export const customer = z.object({
  id,
  name: required,
  contact: short,
  email: z.union([z.literal(''), z.string().email().max(254)]),
});
export const engagement = z.object({
  id,
  customerId: id,
  title: required,
  stage: z.enum(stages),
  owner: short,
  due: z.union([date, z.literal('')]),
  model: z.enum(models),
  scope: note,
  terms: note,
  github: link,
  vercel: link,
});
export const payment = z.object({
  id,
  engagementId: id,
  date,
  cents: z.number().int().positive().max(10000000000),
  reference: short,
});
export const edit = z.object({
  action: z.literal('save'),
  customer,
  engagement,
  version: z.string().max(100),
});
export const move = z.object({
  action: z.literal('move'),
  engagementId: id,
  stage: z.enum(stages),
  version: z.string().max(100),
});
export const receive = z.object({ action: z.literal('payment'), payment });
export const charge = z.object({
  id,
  engagementId: id,
  label: required,
  due: date,
  cents: z.number().int().positive().max(10000000000),
  issued: z.boolean(),
});
export const work = z.object({
  id,
  engagementId: id,
  date,
  member: required,
  minutes: z.number().int().positive().max(1440),
  description: short,
});
export const addCharge = z.object({ action: z.literal('charge'), charge });
export const addWork = z.object({ action: z.literal('work'), work });
export const issue = z.object({
  action: z.literal('issue'),
  chargeId: id,
  version: z.string().max(100),
});
export const command = z.discriminatedUnion('action', [
  edit,
  move,
  receive,
  addCharge,
  addWork,
  saveLink,
  removeLink,
  issue,
]);
export type Client = z.infer<typeof customer>;
export type ProjectLink = z.infer<typeof projectLink>;
export type Engagement = z.infer<typeof engagement> & { links?: ProjectLink[] };
export type Payment = z.infer<typeof payment>;
export type Board = {
  progress?: Record<string, { done: number; total: number; nextAction: string }>;
  customers: Client[];
  engagements: Engagement[];
  payments: Payment[];
  charges: z.infer<typeof charge>[];

  version: string;
};
