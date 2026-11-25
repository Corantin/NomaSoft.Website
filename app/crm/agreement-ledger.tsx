'use client';
import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react';
import type { Board, Engagement, work as workSchema } from '@/lib/crm/model';

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
  const [editing, setEditing] = useState<typeof workSchema._output | null>(null);
  const fixed = deal.model === 'Fixed installments';
  const charges = board.charges.filter((c) => c.engagementId === deal.id);
  const paid = board.payments
    .filter((p) => p.engagementId === deal.id)
    .reduce((s, p) => s + p.cents, 0);
  const balance = charges.filter((c) => c.issued).reduce((s, c) => s + c.cents, 0) - paid;
  const [work, setWork] = useState<(typeof workSchema._output)[]>([]);
  const [hoursBusy, setHoursBusy] = useState(true);
  const [hoursError, setHoursError] = useState('');
  const loadHours = useCallback(
    async (entry?: unknown) => {
      setHoursBusy(true);
      setHoursError('');
      try {
        const send = () =>
          fetch('/api/crm/hours?project=' + deal.id, {
            method: entry ? 'POST' : 'GET',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', 'x-nomasoft-crm': '1' },
            body: entry ? JSON.stringify(entry) : undefined,
          });
        const sendRead = () =>
          fetch('/api/crm/hours?project=' + deal.id, { cache: 'no-store' });
        let response = await send();
        if (response.status === 401) {
          const renewed = await fetch('/api/crm/renew', {
            method: 'POST',
            headers: { 'x-nomasoft-crm': '1' },
          });
          if (renewed.status === 401) window.location.replace('/crm/login');
          if (!renewed.ok) throw Error();
          response = await send();
        }
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          if (response.status === 409 || response.status === 404) {
            const latest = await sendRead();
            if (latest.ok) setWork(await latest.json());
          }
          throw Error(result?.error || 'Could not reach the hours sheet.');
        }
        setWork(await response.json());
        return true;
      } catch (error) {
        setHoursError(
          error instanceof Error ? error.message : 'Could not reach the hours sheet.',
        );
        return false;
      } finally {
        setHoursBusy(false);
      }
    },
    [deal.id],
  );
  useEffect(() => {
    void loadHours();
  }, [loadHours]);
  const editDialog = useRef<HTMLDialogElement>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!editing) return;
    const dialog = editDialog.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      editTrigger.current?.focus();
    };
  }, [editing]);
  function closeTimeForm() {
    setForm('');
    setEditing(null);
  }
  function start(action: 'charge' | 'work') {
    setEditing(null);
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
    const row = { id, engagementId: deal.id, ...record };
    if (
      form === 'work'
        ? await loadHours(
            editing ? { action: 'editWork', work: row, previous: editing } : row,
          )
        : await request({ action: form, [form]: row })
    )
      closeTimeForm();
  }
  const timeForm = (
    <form key={id} onSubmit={save} data-saving={hoursBusy}>
      {editing && <h2 id="crm-edit-time-title">Edit time entry</h2>}
      <label className="crm-field">
        Team member
        <input required name="member" defaultValue={editing?.member ?? deal.owner} />
      </label>
      <div className="crm-pair">
        <label className="crm-field">
          Date worked
          <input defaultValue={editing?.date} required type="date" name="date" />
        </label>
        <label className="crm-field">
          Minutes
          <input
            defaultValue={editing?.minutes}
            required
            type="number"
            min="1"
            max="1440"
            step="1"
            name="minutes"
          />
        </label>
      </div>
      <label className="crm-field">
        Description
        <input name="description" maxLength={180} defaultValue={editing?.description} />
      </label>
      {editing && hoursError && <p role="alert">{hoursError}</p>}
      <div className="crm-time-actions">
        <button className="crm-primary" disabled={busy || hoursBusy}>
          {editing ? 'Save changes' : 'Save time'}
        </button>
        <button
          type="button"
          className="crm-secondary"
          disabled={hoursBusy}
          onClick={closeTimeForm}
        >
          Cancel
        </button>
      </div>
    </form>
  );
  return (
    <>
      {(fixed || charges.length > 0) && (
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
              ) : !fixed ? (
                <span>Unissued</span>
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
          {fixed && form !== 'charge' && (
            <button className="crm-secondary" onClick={() => start('charge')}>
              Add installment
            </button>
          )}
          {fixed && form === 'charge' && (
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
        </>
      )}
      <h3>
        Time tracked{' '}
        {hoursBusy
          ? '…'
          : !hoursError &&
            '· ' +
              Number((work.reduce((s, w) => s + w.minutes, 0) / 60).toFixed(2)) +
              ' h'}
      </h3>
      {hoursError && !editing && (
        <p role="alert">
          {hoursError} <button onClick={() => void loadHours()}>Retry</button>
        </p>
      )}
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
          <button
            type="button"
            className="crm-secondary"
            disabled={hoursBusy || form === 'work'}
            aria-label={'Edit time entry for ' + w.member + ' on ' + w.date}
            onClick={(event) => {
              editTrigger.current = event.currentTarget;
              setId(w.id);
              setEditing(w);
              setForm('work');
              setHoursError('');
            }}
          >
            Edit
          </button>
        </div>
      ))}
      {form !== 'work' ? (
        <button
          className="crm-secondary"
          disabled={hoursBusy}
          onClick={() => start('work')}
        >
          Log time
        </button>
      ) : editing ? (
        <dialog
          ref={editDialog}
          className="crm-time-dialog"
          aria-labelledby="crm-edit-time-title"
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!hoursBusy) closeTimeForm();
          }}
        >
          {timeForm}
        </dialog>
      ) : (
        timeForm
      )}
    </>
  );
}
