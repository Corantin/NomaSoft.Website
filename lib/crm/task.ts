import { z } from 'zod';
export const projectTask = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  assignee: z.enum(['', 'Corantin', 'Kafan']),
  due: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  done: z.boolean(),
  revision: z.number().int().nonnegative(),
});
export type ProjectTask = z.infer<typeof projectTask>;
