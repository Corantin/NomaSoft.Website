'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { taskProgress, type ProjectTask, type TaskOrder } from '@/lib/crm/task';

export default function ProjectTasks({
  engagementId,
  onProgress,
}: {
  engagementId: string;
  onProgress: (id: string, progress: ReturnType<typeof taskProgress>) => void;
}) {
  const [draft, setDraft] = useState<ProjectTask | null>(null);
  const [items, setItems] = useState<ProjectTask[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const pending = useRef(false);
  const request = useCallback(
    async (task?: ProjectTask | TaskOrder) => {
      if (pending.current) return false;
      pending.current = true;
      setBusy(true);
      setError('');
      const send = () =>
        fetch('/api/crm/tasks/' + engagementId, {
          method: task ? 'POST' : 'GET',
          cache: 'no-store',
          headers: { 'x-nomasoft-crm': '1', 'Content-Type': 'application/json' },
          body: task ? JSON.stringify(task) : undefined,
        });
      try {
        let res = await send();
        if (res.status === 401) {
          const renewed = await fetch('/api/crm/renew', {
            method: 'POST',
            headers: { 'x-nomasoft-crm': '1' },
          });
          if (renewed.status === 401) {
            window.location.replace('/crm/login');
            return false;
          }
          if (!renewed.ok) throw Error('Could not renew your session.');
          res = await send();
        }
        const data = await res.json();
        if (!res.ok) throw Error(data.error || 'Unable to load project tasks.');
        setItems(data);
        onProgress(engagementId, taskProgress(data));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load project tasks.');
        return false;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [engagementId, onProgress],
  );
  useEffect(() => {
    void request();
  }, [request]);
  const tasks = items;
  function move(index: number, offset: number) {
    const reordered = [...tasks];
    [reordered[index], reordered[index + offset]] = [
      reordered[index + offset],
      reordered[index],
    ];
    void request({ order: reordered.map(({ id, revision }) => ({ id, revision })) });
  }
  function edit(task: ProjectTask) {
    setDraft({ ...task });
  }
  return (
    <section className="crm-tasks">
      <h3>
        Tasks{' '}
        {tasks.length > 0 && (
          <small>
            {tasks.filter((t) => t.done).length} of {tasks.length} complete
          </small>
        )}
      </h3>
      {error && (
        <p role="alert">
          {error}{' '}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDraft(null);
              void request();
            }}
          >
            Reload tasks
          </button>
        </p>
      )}
      <ul>
        {tasks.map((t, index) => (
          <li key={t.id}>
            <label>
              <input
                type="checkbox"
                checked={t.done}
                disabled={busy || !!draft}
                onChange={() => request({ ...t, done: !t.done })}
              />
              <span>
                <strong>{t.title}</strong>
                <small>
                  {[
                    index === 0 && !t.done ? 'Next action' : '',
                    t.assignee || 'Corantin & Kafan',
                    t.due,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </span>
            </label>
            <div className="crm-task-controls">
              <button
                type="button"
                aria-label={'Move ' + t.title + ' up'}
                disabled={busy || !!draft || tasks[index - 1]?.done !== t.done}
                onClick={() => move(index, -1)}
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                aria-label={'Move ' + t.title + ' down'}
                disabled={busy || !!draft || tasks[index + 1]?.done !== t.done}
                onClick={() => move(index, 1)}
              >
                <ChevronDown size={16} />
              </button>
              <button
                disabled={busy || !!draft}
                aria-label={'Edit task ' + t.title}
                onClick={() => edit(t)}
              >
                <Pencil size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {draft ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await request(draft)) setDraft(null);
          }}
        >
          <label className="crm-field">
            Task name
            <input
              autoFocus
              required
              maxLength={180}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <div className="crm-pair">
            <label className="crm-field">
              Assigned to
              <select
                value={draft.assignee}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    assignee: e.target.value as ProjectTask['assignee'],
                  })
                }
              >
                <option value="">Corantin &amp; Kafan</option>
                <option>Corantin</option>
                <option>Kafan</option>
              </select>
            </label>
            <label className="crm-field">
              Due date
              <input
                type="date"
                value={draft.due}
                onChange={(e) => setDraft({ ...draft, due: e.target.value })}
              />
            </label>
          </div>
          <button className="crm-primary" disabled={busy || !draft.title.trim()}>
            Save task
          </button>{' '}
          <button
            className="crm-secondary"
            type="button"
            disabled={busy}
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          className="crm-secondary"
          disabled={busy}
          onClick={() =>
            edit({
              id: crypto.randomUUID(),
              revision: 0,
              position: Date.now(),
              title: '',
              assignee: '',
              due: '',
              done: false,
            })
          }
        >
          <Plus size={15} /> Add task
        </button>
      )}
    </section>
  );
}
