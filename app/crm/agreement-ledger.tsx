'use client';
import { useState, type FormEvent } from 'react';
import type { Board, Engagement } from '@/lib/crm/model';

const cad = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(
    value / 100,
  );
export default function AgreementLedger({
  board,
  deal,
  busy,
  request,
}: {
  board: Board;
  deal: Engagement;
  busy: boolean;
  request: (body: unknown) => Promise<boolean>;
}) {
  const [form, setForm] = useState<'' | 'charge' | 'work'>(''),
    [id, setId] = useState('');
  const charges = board.charges.filter((c) => c.engagementId === deal.id);
  const paid = board.payments
    .filter((p) => p.engagementId === deal.id)
    .reduce((s, p) => s + p.cents, 0);
  const balance = charges.filter((c) => c.issued).reduce((s, c) => s + c.cents, 0) - paid;
  const work = board.work.filter((w) => w.engagementId === deal.id);
  function start(action: 'charge' | 'work') {
    setId(crypto.randomUUID());
    setForm(action);
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const record =
      form === 'charge'
        ? {
            label: fields.get('label'),
            cents: Math.round(Number(fields.get('amount')) * 100),
            due: fields.get('date'),
            issued: false,
          }
        : {
            member: fields.get('member'),
            date: fields.get('date'),
            minutes: Number(fields.get('minutes')),
            description: fields.get('description'),
          };
    if (await request({ action: form, [form]: { id, engagementId: deal.id, ...record } }))
      setForm('');
  }
  return (
    <>
      <h3>Installments</h3>
      <p>
        {balance >= 0 ? 'Outstanding' : 'Customer credit'} on this engagement ·{' '}
        <strong>{cad(Math.abs(balance))}</strong>
      </p>
      {charges.map((c) => (
        <div className="crm-ledger-row" key={c.id}>
          <span>
            <strong>{c.label}</strong>
            <small>
              {c.due} · {cad(c.cents)}
            </small>
          </span>
          {c.issued ? (
            <span>Issued</span>
          ) : (
            <button
              disabled={busy}
              onClick={() =>
                request({ action: 'issue', chargeId: c.id, version: board.version })
              }
            >
              Mark issued
            </button>
          )}
        </div>
      ))}
      {form !== 'charge' && (
        <button className="crm-secondary" onClick={() => start('charge')}>
          Add installment
        </button>
      )}
      {form === 'charge' && (
        <form onSubmit={save}>
          <label className="crm-field">
            Milestone or service
            <input required name="label" maxLength={180} />
          </label>
          <div className="crm-pair">
            <label className="crm-field">
              Amount (CAD)
              <input required type="number" min=".01" step=".01" name="amount" />
            </label>
            <label className="crm-field">
              Due date
              <input required type="date" name="date" />
            </label>
          </div>
          <button className="crm-secondary" disabled={busy}>
            Save installment
          </button>
        </form>
      )}
      <h3>
        Time tracked · {Number((work.reduce((s, w) => s + w.minutes, 0) / 60).toFixed(2))}{' '}
        h
      </h3>
      {work.map((w) => (
        <div key={w.id} className="crm-ledger-row">
          <span>
            <strong>
              {w.member} · {w.minutes} min
            </strong>
            <small>
              {w.date} {w.description}
            </small>
          </span>
        </div>
      ))}
      {form !== 'work' ? (
        <button className="crm-secondary" onClick={() => start('work')}>
          Log time
        </button>
      ) : (
        <form onSubmit={save}>
          <label className="crm-field">
            Team member
            <input required name="member" defaultValue={deal.owner} />
          </label>
          <div className="crm-pair">
            <label className="crm-field">
              Date worked
              <input required type="date" name="date" />
            </label>
            <label className="crm-field">
              Minutes
              <input required type="number" min="1" max="1440" step="1" name="minutes" />
            </label>
          </div>
          <label className="crm-field">
            Description
            <input name="description" />
          </label>
          <button className="crm-secondary" disabled={busy}>
            Save time
          </button>
        </form>
      )}
    </>
  );
}
