'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  Columns3,
  ListChecks,
  GripVertical,
  Globe,
  Github,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import ProjectTasks from './project-tasks';
import ProjectLinks from './project-links';
import ProjectNotes from './project-notes';
import AgreementLedger from './agreement-ledger';
import {
  models,
  stages,
  type Board,
  type Client,
  type Engagement,
} from '@/lib/crm/model';

const stageDescriptions: Record<Engagement['stage'], string> = {
  'New lead':
    'A potential customer or project has been identified. The next step is an initial conversation.',
  'Meeting to schedule':
    'A conversation is needed to discuss the project. A meeting time still needs to be agreed.',
  Proposal: 'Scope and pricing are being prepared or reviewed with the customer.',
  Ongoing: 'The project is active and delivery work is underway.',
  Maintenance:
    'The main delivery is complete. Support, fixes, or routine updates continue.',
  'On ice': 'Work or discussions are paused and may resume later.',
  Closed:
    'The engagement has ended, either after delivery or because the opportunity did not proceed.',
};
const partners = ['Corantin', 'Kafan'];
const sharedTeam = partners.join(' & ');
const money = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(
    cents / 100,
  );
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="crm-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function formValues(form: HTMLFormElement) {
  return JSON.stringify(
    Array.from(form.elements).flatMap((field) => {
      if (field instanceof HTMLInputElement)
        return [
          field.type === 'checkbox' || field.type === 'radio'
            ? String(field.checked)
            : field.value,
        ];
      if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)
        return [field.value];
      return [];
    }),
  );
}
function Drawer({
  title,
  pending = false,
  onClose,
  children,
}: {
  title: string;
  pending?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const originals = useRef(new WeakMap<HTMLFormElement, string>());
  function hasPendingChanges() {
    const dialog = ref.current;
    return (
      pending ||
      !!dialog?.querySelector('[data-saving="true"]') ||
      Array.from(dialog?.querySelectorAll('form') ?? []).some(
        (form) =>
          originals.current.has(form) && originals.current.get(form) !== formValues(form),
      )
    );
  }
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="crm-drawer"
      aria-label={title}
      onFocusCapture={(e) => {
        const form = e.target.closest('form');
        if (form && !originals.current.has(form))
          originals.current.set(form, formValues(form));
      }}
      onChangeCapture={(e) => {
        const form = (e.target as HTMLElement).closest('form');
        if (form && !originals.current.has(form)) originals.current.set(form, 'changed');
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (
          e.target === ref.current &&
          e.clientX < ref.current.getBoundingClientRect().left &&
          !hasPendingChanges()
        )
          onClose();
      }}
    >
      <header>
        <span>{title}</span>
        <button aria-label="Close panel" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
type Draft = { client: Client; deal: Engagement; version: string };
function mergeFields<T extends Client | Engagement>(
  draft: T,
  before: T | undefined,
  latest: T | undefined,
) {
  if (!latest || !before) return draft;
  const merged = { ...latest };
  for (const key of Object.keys(draft) as (keyof T)[]) {
    if (draft[key] !== before[key]) merged[key] = draft[key];
  }
  return merged;
}
function refreshDraft(draft: Draft | null, before: Board, latest: Board): Draft | null {
  if (!draft) return null;
  const oldClient = before.customers.find((c) => c.id === draft.client.id);
  const newClient = latest.customers.find((c) => c.id === draft.client.id);
  const oldDeal = before.engagements.find((d) => d.id === draft.deal.id);
  const newDeal = latest.engagements.find((d) => d.id === draft.deal.id);
  if ((oldClient && !newClient) || (oldDeal && !newDeal)) return null;
  return {
    client: mergeFields(draft.client, oldClient, newClient),
    deal: mergeFields(draft.deal, oldDeal, newDeal),
    version: latest.version,
  };
}
function blank(stage: Engagement['stage'] = 'New lead'): Draft {
  const id = crypto.randomUUID();
  return {
    version: '',
    client: { id, name: '', contact: '', email: '' },
    deal: {
      id: crypto.randomUUID(),
      customerId: id,
      title: '',
      stage,
      owner: '',
      due: '',
      model: 'Undecided',
      scope: '',
      terms: '',
      github: '',
      vercel: '',
    },
  };
}
export default function Workspace() {
  const [board, setBoard] = useState<Board | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(''),
    [closed, setClosed] = useState(false);
  const [active, setActive] = useState(''),
    [draft, setDraft] = useState<Draft | null>(null),
    [pay, setPay] = useState('');
  const [stageTip, setStageTip] = useState<Engagement['stage'] | null>(null);
  const [dragged, setDragged] = useState('');
  const [target, setTarget] = useState('');
  const [move, setMove] = useState<Draft | null>(null);
  function beginMove(id: string) {
    const deal = deals.find((d) => d.id === id);
    const customer = clients.find((c) => c.id === deal?.customerId);
    if (!board || !deal || !customer || busy) return;
    setError('');
    setMove({
      client: customer,
      version: board.version,
      deal: { ...deal },
    });
  }
  const updateProgress = useCallback(
    (id: string, progress: { done: number; total: number; nextAction: string }) => {
      setBoard(
        (current) =>
          current && { ...current, progress: { ...current.progress, [id]: progress } },
      );
    },
    [],
  );
  const saving = useRef(false);
  const lastSnapshot = useRef<Board | null>(null);
  const request = useCallback(async (body?: unknown) => {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const send = (payload?: unknown) =>
        fetch('/api/crm', {
          method: payload ? 'POST' : 'GET',
          cache: 'no-store',
          headers: payload
            ? { 'Content-Type': 'application/json', 'x-nomasoft-crm': '1' }
            : undefined,
          body: payload ? JSON.stringify(payload) : undefined,
        });
      async function sendWithSession(payload?: unknown) {
        const response = await send(payload);
        if (response.status !== 401) return response;
        const renewed = await fetch('/api/crm/renew', {
          method: 'POST',
          headers: { 'x-nomasoft-crm': '1' },
        });
        if (renewed.status === 401) {
          window.location.replace('/crm/login');
          throw Error('Sign in to continue.');
        }
        if (!renewed.ok) throw Error('Could not renew your session. Try again.');
        return send(payload);
      }
      let res = await sendWithSession(body);
      const conflict = !!body && res.status === 409;
      if (conflict) res = await sendWithSession();
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Unable to open the board.');
      const board = lastSnapshot.current;
      lastSnapshot.current = data;
      setBoard(data);
      if (conflict && board) {
        setDraft((current) => refreshDraft(current, board, data));
        setMove((current) => refreshDraft(current, board, data));
        setError('Board refreshed. Review the latest details before saving.');
        return false;
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the board.');
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void request();
  }, [request]);
  const deals = board?.engagements || [],
    clients = board?.customers || [],
    payments = board?.payments || [];
  const selected = deals.find((d) => d.id === active),
    client = clients.find((c) => c.id === selected?.customerId);
  const visible = deals.filter((d) =>
    [
      d.title,
      clients.find((c) => c.id === d.customerId)?.name,
      board?.progress?.[d.id]?.nextAction,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const open = deals.filter((d) => d.stage !== 'Closed');
  function close() {
    if (busy) return;
    setActive('');
    setDraft(null);
    setPay('');
    setError('');
  }
  function add(stage?: Engagement['stage']) {
    if (!board) return;
    const d = blank(stage);
    setActive('');
    setDraft({ ...d, version: board.version });
    setError('');
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (
      await request({
        action: 'save',
        customer: draft.client,
        engagement: draft.deal,
        version: draft.version,
      })
    ) {
      setActive(draft.deal.id);
      setDraft(null);
    }
  }
  function updateDeal(key: keyof Engagement, value: string) {
    setDraft((d) => d && { ...d, deal: { ...d.deal, [key]: value } });
  }
  function updateClient(key: keyof Client, value: string) {
    setDraft((d) => d && { ...d, client: { ...d.client, [key]: value } });
  }
  const warning = error && (
    <p role="alert" className="crm-warning">
      {error}
    </p>
  );
  return (
    <main className="crm">
      <nav>
        <strong>
          <Layers3 size={23} /> NomaSoft
        </strong>
        <span className="crm-nav-rule" />
        Customer workspace
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void signOut({ callbackUrl: '/crm/login' });
          }}
        >
          <button>Sign out</button>
        </form>
      </nav>
      <div className="crm-main">
        <div className="crm-title">
          <div>
            <h1>Customer pipeline</h1>
            <p>
              {open.length} open engagement{open.length === 1 ? '' : 's'} <span>·</span>{' '}
              {clients.length} customer{clients.length === 1 ? '' : 's'}
            </p>
          </div>
          <button className="crm-primary" disabled={!board || busy} onClick={() => add()}>
            <Plus size={17} /> Add customer
          </button>
        </div>
        <div className="crm-tools">
          <strong>
            <Columns3 size={16} /> Board
          </strong>
          <label className="crm-search">
            <Search size={16} />
            <input
              aria-label="Search customers and engagements"
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
            />{' '}
            Closed
          </label>
          <button
            title="Refresh board"
            aria-label="Refresh board"
            disabled={busy}
            onClick={() => request()}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        {!draft && !selected && warning}
        {!board ? (
          <p className="crm-status">
            {busy ? 'Loading customer board…' : 'Board unavailable'}
          </p>
        ) : (
          <div className="crm-board">
            {stages
              .filter((s) => closed || s !== 'Closed')
              .map((stage, i) => {
                const cards = visible
                  .filter((d) => d.stage === stage)
                  .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
                return (
                  <section
                    key={stage}
                    data-stage={stage}
                    className={
                      'crm-lane tone-' + i + (target === stage ? ' crm-drop-target' : '')
                    }
                    onDragOver={(e) => {
                      if (dragged) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setTarget(stage);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const deal = deals.find((d) => d.id === dragged);
                      setDragged('');
                      setTarget('');
                      if (!deal || deal.stage === stage || busy) return;
                      void request({
                        action: 'move',
                        engagementId: deal.id,
                        stage,
                        version: board.version,
                      });
                    }}
                  >
                    <h2>
                      <i />
                      <span
                        className="crm-stage-help"
                        onMouseEnter={() => setStageTip(stage)}
                        onMouseLeave={() => setStageTip(null)}
                      >
                        <button
                          type="button"
                          className="crm-stage-label"
                          aria-describedby={
                            stageTip === stage
                              ? 'stage-tip-' + stages.indexOf(stage)
                              : undefined
                          }
                          onFocus={() => setStageTip(stage)}
                          onBlur={() => setStageTip(null)}
                          onClick={() => setStageTip(stage)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setStageTip(null);
                          }}
                        >
                          {stage}
                        </button>
                        {stageTip === stage && (
                          <span
                            role="tooltip"
                            id={'stage-tip-' + stages.indexOf(stage)}
                            className="crm-stage-tooltip"
                          >
                            {stageDescriptions[stage]}
                          </span>
                        )}
                      </span>
                      <small>{cards.length}</small>
                      <button
                        aria-label={'Add customer in ' + stage}
                        disabled={busy}
                        onClick={() => add(stage)}
                      >
                        <Plus size={16} />
                      </button>
                    </h2>
                    {cards.map((d) => {
                      const name =
                        clients.find((c) => c.id === d.customerId)?.name ||
                        'Unknown customer';
                      return (
                        <article
                          className="crm-card"
                          key={d.id}
                          draggable={!busy}
                          onDragStart={(e) => {
                            setDragged(d.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', d.id);
                          }}
                          onDragEnd={() => {
                            setDragged('');
                            setTarget('');
                          }}
                        >
                          <button
                            className="crm-open-card"
                            onClick={() => {
                              setActive(d.id);
                              setError('');
                            }}
                          >
                            <span className="crm-card-client">
                              <b>{initials(name)}</b>
                              {name}
                            </span>
                            <strong>{d.title}</strong>
                            {!!board.progress?.[d.id]?.total && (
                              <span
                                className="crm-task-progress"
                                aria-label={
                                  board.progress[d.id].done +
                                  ' of ' +
                                  board.progress[d.id].total +
                                  ' tasks complete'
                                }
                                title="Tasks completed"
                              >
                                <ListChecks size={14} aria-hidden="true" />
                                {board.progress[d.id].done}/{board.progress[d.id].total}
                              </span>
                            )}
                            {board?.progress?.[d.id]?.nextAction && (
                              <span className="crm-next">
                                <ArrowRight size={13} />
                                {board?.progress?.[d.id]?.nextAction}
                              </span>
                            )}
                            {(d.owner || d.due) && (
                              <span className="crm-card-foot">
                                {d.owner && <span>{d.owner}</span>}
                                {d.due && (
                                  <span>
                                    <CalendarDays size={12} />
                                    {d.due}
                                  </span>
                                )}
                              </span>
                            )}
                          </button>
                          <div className="crm-card-links">
                            {(['vercel', 'github'] as const)
                              .filter((key) => /^https:\/\//i.test(d[key]))
                              .map((key) => {
                                const Icon = key === 'github' ? Github : Globe;
                                const label =
                                  key === 'github' ? 'GitHub repository' : 'Website';
                                return (
                                  <a
                                    key={key}
                                    href={d[key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    draggable={false}
                                    aria-label={d.title + ' ' + label}
                                    title={label}
                                  >
                                    <Icon size={16} aria-hidden="true" />
                                  </a>
                                );
                              })}
                          </div>
                          <button
                            type="button"
                            className="crm-move-handle"
                            title="Move engagement"
                            aria-label={'Move ' + d.title}
                            onClick={() => beginMove(d.id)}
                          >
                            <GripVertical size={17} />
                          </button>
                        </article>
                      );
                    })}
                    {!cards.length && (
                      <button
                        disabled={busy}
                        className="crm-empty"
                        onClick={() => add(stage)}
                      >
                        <Plus size={14} /> Add engagement
                      </button>
                    )}
                  </section>
                );
              })}
          </div>
        )}
      </div>
      {move && (
        <Drawer
          title="Move engagement"
          pending={
            busy || deals.find((d) => d.id === move.deal.id)?.stage !== move.deal.stage
          }
          onClose={() => {
            if (!busy) {
              setMove(null);
              setError('');
            }
          }}
        >
          <form
            className="crm-content"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await request({
                  action: 'save',
                  customer: move.client,
                  engagement: move.deal,
                  version: move.version,
                })
              ) {
                setMove(null);
                if (move.deal.stage === 'Closed') setClosed(true);
              }
            }}
          >
            <h2>{move.deal.title}</h2>
            <Field label="Move to stage">
              <select
                value={move.deal.stage}
                onChange={(e) =>
                  setMove({
                    ...move,
                    deal: { ...move.deal, stage: e.target.value as Engagement['stage'] },
                  })
                }
              >
                {stages.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field
              label={move.deal.stage === 'On ice' ? 'Revisit date' : 'Follow-up date'}
            >
              <input
                type="date"
                value={move.deal.due}
                onChange={(e) =>
                  setMove({ ...move, deal: { ...move.deal, due: e.target.value } })
                }
              />
            </Field>
            {warning}
            <button
              className="crm-primary"
              disabled={
                busy ||
                deals.find((d) => d.id === move.deal.id)?.stage === move.deal.stage
              }
            >
              Confirm move
            </button>
          </form>
        </Drawer>
      )}
      {draft && (
        <Drawer
          title={
            deals.some((d) => d.id === draft.deal.id)
              ? 'Edit engagement'
              : 'Add customer or engagement'
          }
          onClose={close}
        >
          <form onSubmit={save} className="crm-content">
            <h2>
              {deals.some((d) => d.id === draft.deal.id)
                ? 'Edit customer details'
                : 'Customer details'}
            </h2>
            {!deals.some((d) => d.id === draft.deal.id) && clients.length > 0 && (
              <Field label="Customer record">
                <select
                  value={
                    clients.some((c) => c.id === draft.client.id) ? draft.client.id : ''
                  }
                  onChange={(e) => {
                    const c =
                      clients.find((item) => item.id === e.target.value) ||
                      blank().client;
                    setDraft({
                      ...draft,
                      client: c,
                      deal: { ...draft.deal, customerId: c.id },
                    });
                  }}
                >
                  <option value="">Create a new customer</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Customer name">
              <input
                required
                maxLength={180}
                value={draft.client.name}
                onChange={(e) => updateClient('name', e.target.value)}
              />
            </Field>
            <div className="crm-pair">
              <Field label="Contact name">
                <input
                  value={draft.client.contact}
                  onChange={(e) => updateClient('contact', e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={draft.client.email}
                  onChange={(e) => updateClient('email', e.target.value)}
                />
              </Field>
            </div>
            <h3>Engagement</h3>
            <Field label="Engagement title">
              <input
                required
                value={draft.deal.title}
                onChange={(e) => updateDeal('title', e.target.value)}
              />
            </Field>
            <div className="crm-pair">
              <Field label="Stage">
                <select
                  value={draft.deal.stage}
                  onChange={(e) => updateDeal('stage', e.target.value)}
                >
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project team">
                <select
                  value={draft.deal.owner}
                  onChange={(e) => updateDeal('owner', e.target.value)}
                >
                  <option value="">{sharedTeam}</option>
                  {Array.from(
                    new Set([...partners, ...deals.map((d) => d.owner).filter(Boolean)]),
                  ).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Follow-up date">
              <input
                type="date"
                value={draft.deal.due}
                onChange={(e) => updateDeal('due', e.target.value)}
              />
            </Field>
            <h3>Agreement</h3>
            <Field label="Billing model">
              <select
                value={draft.deal.model}
                onChange={(e) => updateDeal('model', e.target.value)}
              >
                {models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Scope">
              <textarea
                value={draft.deal.scope}
                onChange={(e) => updateDeal('scope', e.target.value)}
              />
            </Field>
            <Field label="Payment terms and installments">
              <textarea
                value={draft.deal.terms}
                onChange={(e) => updateDeal('terms', e.target.value)}
              />
            </Field>
            {(['github', 'vercel'] as const).map((k) => (
              <Field key={k} label={k === 'github' ? 'GitHub URL' : 'Vercel URL'}>
                <input
                  type="url"
                  placeholder="https://"
                  value={draft.deal[k]}
                  onChange={(e) => updateDeal(k, e.target.value)}
                />
              </Field>
            ))}
            {warning}
            <button className="crm-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Drawer>
      )}
      {!draft && selected && client && board && (
        <Drawer title="Engagement details" onClose={close}>
          <div className="crm-content">
            <div className="crm-identity">
              <b>{initials(client.name)}</b>
              <span>{client.name}</span>
            </div>
            <h2>{selected.title}</h2>
            <p>
              {selected.stage} · {selected.owner || sharedTeam}
            </p>
            <button
              className="crm-secondary"
              onClick={() =>
                setDraft({
                  client: { ...client },
                  deal: { ...selected },
                  version: board.version,
                })
              }
            >
              <Pencil size={15} /> Edit customer & engagement
            </button>
            <ProjectTasks
              key={selected.id}
              engagementId={selected.id}
              onProgress={updateProgress}
            />
            <ProjectLinks key={'links-' + selected.id} project={selected} version={board.version} busy={busy} request={request} />
            <ProjectNotes key={selected.id} id={selected.id} />
            <h3>Contact</h3>
            <p>
              {client.contact || 'No contact assigned'}{' '}
              {client.email && <a href={'mailto:' + client.email}>{client.email}</a>}
            </p>
            <h3>Agreement</h3>
            <strong>{selected.model}</strong>
            <p>{selected.scope || 'No scope recorded'}</p>
            {selected.terms && <p>{selected.terms}</p>}
            <h3>Payments</h3>
            <div className="crm-paid">
              <span>Received from {client.name}</span>
              <strong>
                {money(
                  payments
                    .filter((p) =>
                      deals.some(
                        (d) => d.customerId === client.id && d.id === p.engagementId,
                      ),
                    )
                    .reduce((a, p) => a + p.cents, 0),
                )}
              </strong>
            </div>
            {payments
              .filter((p) => p.engagementId === selected.id)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((p) => (
                <p key={p.id}>
                  {p.date} · {money(p.cents)} {p.reference}
                </p>
              ))}
            {pay ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  if (
                    await request({
                      action: 'payment',
                      payment: {
                        id: pay,
                        engagementId: selected.id,
                        date: f.get('date'),
                        cents: Math.round(Number(f.get('amount')) * 100),
                        reference: f.get('reference'),
                      },
                    })
                  )
                    setPay('');
                }}
              >
                <div className="crm-pair">
                  <Field label="Amount (CAD)">
                    <input required name="amount" type="number" min=".01" step=".01" />
                  </Field>
                  <Field label="Payment date">
                    <input required name="date" type="date" />
                  </Field>
                </div>
                <Field label="Payment reference">
                  <input name="reference" />
                </Field>
                <button className="crm-secondary" disabled={busy}>
                  Save payment
                </button>
              </form>
            ) : (
              <button
                className="crm-secondary"
                onClick={() => setPay(crypto.randomUUID())}
              >
                <ArrowDownLeft size={16} /> Record payment
              </button>
            )}
            <AgreementLedger
              key={selected.id}
              board={board}
              deal={selected}
              busy={busy}
              request={request}
            />
            {warning}
          </div>
        </Drawer>
      )}
    </main>
  );
}
