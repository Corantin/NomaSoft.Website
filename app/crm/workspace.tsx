'use client';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  Columns3,
  ExternalLink,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { signOut } from './login/actions';
import AgreementLedger from './agreement-ledger';
import {
  models,
  stages,
  type Board,
  type Client,
  type Engagement,
} from '@/lib/crm/model';

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
function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
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
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (
          e.target === ref.current &&
          e.clientX < ref.current.getBoundingClientRect().left
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
      nextAction: '',
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
    [owner, setOwner] = useState(''),
    [closed, setClosed] = useState(false);
  const [active, setActive] = useState(''),
    [draft, setDraft] = useState<Draft | null>(null),
    [pay, setPay] = useState('');
  const [dragged, setDragged] = useState('');
  const saving = useRef(false);
  async function request(body?: unknown) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/crm', {
        method: body ? 'POST' : 'GET',
        cache: 'no-store',
        headers: body
          ? { 'Content-Type': 'application/json', 'x-nomasoft-crm': '1' }
          : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401) {
        window.location.replace('/crm/login');
        return false;
      }
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Unable to open the workbook.');
      setBoard(data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the workbook.');
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    void request();
  }, []);
  const deals = board?.engagements || [],
    clients = board?.customers || [],
    payments = board?.payments || [];
  const selected = deals.find((d) => d.id === active),
    client = clients.find((c) => c.id === selected?.customerId);
  const visible = deals.filter(
    (d) =>
      (!owner || d.owner === owner) &&
      [d.title, clients.find((c) => c.id === d.customerId)?.name, d.nextAction]
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
        <form action={signOut}>
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
          <label className="crm-owner">
            <Users size={16} />
            <select
              aria-label="Filter by owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">All owners</option>
              {Array.from(new Set(deals.map((d) => d.owner).filter(Boolean)))
                .sort()
                .map((o) => (
                  <option key={o}>{o}</option>
                ))}
            </select>
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
            title="Refresh workbook"
            aria-label="Refresh workbook"
            disabled={busy}
            onClick={() => request()}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        {!draft && !selected && warning}
        {!board ? (
          <p className="crm-status">
            {busy ? 'Loading customer workbook…' : 'Workbook unavailable'}
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
                    className={'crm-lane tone-' + i}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragged && deals.find((d) => d.id === dragged)?.stage !== stage)
                        void request({
                          action: 'move',
                          engagementId: dragged,
                          stage,
                          version: board.version,
                        });
                      setDragged('');
                    }}
                  >
                    <h2>
                      <i />
                      {stage}
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
                        <button
                          className="crm-card"
                          key={d.id}
                          draggable={!busy}
                          onDragStart={(e) => {
                            setDragged(d.id);
                            e.dataTransfer.setData('text/plain', d.id);
                          }}
                          onDragEnd={() => setDragged('')}
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
                          {d.nextAction && (
                            <span className="crm-next">
                              <ArrowRight size={13} />
                              {d.nextAction}
                            </span>
                          )}
                          <span className="crm-card-foot">
                            <span>{d.owner || 'Unassigned'}</span>
                            {d.due && (
                              <span>
                                <CalendarDays size={12} />
                                {d.due}
                              </span>
                            )}
                          </span>
                        </button>
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
              <Field label="Owner">
                <input
                  list="crm-owners"
                  value={draft.deal.owner}
                  onChange={(e) => updateDeal('owner', e.target.value)}
                />
                <datalist id="crm-owners">
                  <option>Corantin</option>
                  <option>Kafan</option>
                </datalist>
              </Field>
            </div>
            <Field label="Next action">
              <input
                value={draft.deal.nextAction}
                onChange={(e) => updateDeal('nextAction', e.target.value)}
              />
            </Field>
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
              {selected.stage} · {selected.owner || 'Unassigned'}
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
            <h3>Next action</h3>
            <p>
              {selected.nextAction || 'No next action set'}{' '}
              {selected.due && ' · ' + selected.due}
            </p>
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
            {(selected.github || selected.vercel) && (
              <>
                <h3>Project links</h3>
                {(['github', 'vercel'] as const)
                  .filter((k) => /^https:\/\//i.test(selected[k]))
                  .map((k) => (
                    <a
                      className="crm-link"
                      key={k}
                      href={selected[k]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {k === 'github' ? 'GitHub repository' : 'Vercel project'}{' '}
                      <ExternalLink size={14} />
                    </a>
                  ))}
              </>
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
