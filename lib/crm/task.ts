import { z } from 'zod/v4';
export const projectTask = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  assignee: z.enum(['', 'Corantin', 'Kafan']),
  due: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  done: z.boolean(),
  position: z.number().int().optional(),
  revision: z.number().int().nonnegative(),
});
export type ProjectTask = z.infer<typeof projectTask>;

export const taskOrder = z.object({
  order: z.array(projectTask.pick({ id: true, revision: true })).min(1),
});
export type TaskOrder = z.infer<typeof taskOrder>;
export function orderedTasks(tasks: ProjectTask[]) {
  return [...tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (a.position ?? 0) - (b.position ?? 0) ||
      (a.due || '9999').localeCompare(b.due || '9999') ||
      a.id.localeCompare(b.id),
  );
}
export function taskProgress(tasks: ProjectTask[]) {
  return {
    done: tasks.filter((t) => t.done).length,
    total: tasks.length,
    nextAction: orderedTasks(tasks).find((t) => !t.done)?.title ?? '',
  };
}
