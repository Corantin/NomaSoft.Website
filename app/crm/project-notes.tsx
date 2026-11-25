'use client';
import { useState, useEffect, useRef } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import { maxNoteBytes, maxNoteLength, type ProjectNote } from '@/lib/crm/note';

async function fetchNote(url: string, body?: FormData) {
  const send = () =>
    fetch(url, {
      method: body ? 'POST' : 'GET',
      body,
      cache: 'no-store',
      headers: { 'x-nomasoft-crm': '1' },
    });
  let res = await send();
  if (res.status === 401) {
    const renew = await fetch('/api/crm/renew', {
      method: 'POST',
      headers: { 'x-nomasoft-crm': '1' },
    });
    if (renew.status === 401) window.location.replace('/crm/login');
    if (!renew.ok) throw Error('Sign in again to access notes.');
    res = await send();
  }
  if (!res.ok)
    throw Error(
      res.status === 413
        ? 'Attachments can total up to 2 MB per note.'
        : 'Could not access the note. Try again.',
    );
  return res;
}
function linkedText(value: string) {
  return value.split(/(https?:\/\/[^\s<>"]+)/gi).map((part, i) => {
    if (i % 2 === 0) return part;
    const url = part.replace(/[.,;!?]+$/, '');
    try {
      new URL(url);
    } catch {
      return part;
    }
    return (
      <span key={i}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
        {part.slice(url.length)}
      </span>
    );
  });
}
export default function ProjectNotes({ id }: { id: string }) {
  const url = '/api/crm/notes/' + id;
  const [notes, setNotes] = useState<ProjectNote[]>([]),
    [editing, setEditing] = useState(false),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState(''),
    [loadError, setLoadError] = useState(false),
    [attempt, retry] = useState(0);
  const draftId = useRef('');
  useEffect(() => {
    let active = true;
    fetchNote(url)
      .then((r) => r.json())
      .then((rows: ProjectNote[]) => {
        if (active) {
          setNotes((current) => [
            ...current,
            ...rows.filter((r) => !current.some((n) => n.id === r.id)),
          ]);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [url, attempt]);
  async function download(note: ProjectNote, index: number) {
    try {
      const response = await fetchNote(url + '?note=' + note.id + '&file=' + index);
      const href = URL.createObjectURL(await response.blob());
      const a = document.createElement('a');
      a.href = href;
      a.download = note.files[index].name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 30000);
    } catch {
      setError('Could not download the attachment. Try again.');
    }
  }
  return (
    <section className="crm-notes" data-saving={saving}>
      <h3>Notes</h3>
      {loadError && (
        <p role="alert">
          Could not load notes. <button onClick={() => retry((n) => n + 1)}>Retry</button>
        </p>
      )}
      {notes.map((note) => (
        <article key={note.id}>
          <time dateTime={note.createdAt}>
            {new Date(note.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </time>
          {note.text && <p>{linkedText(note.text)}</p>}
          {note.files.map((f, i) => (
            <button key={i} className="crm-link" onClick={() => void download(note, i)}>
              <Paperclip size={14} />
              {f.name}
            </button>
          ))}
        </article>
      ))}
      {error && <p role="alert">{error}</p>}
      {editing ? (
        <form
          onChange={() => {
            draftId.current = crypto.randomUUID();
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving) return;
            const data = new FormData(e.currentTarget);
            const files = data
              .getAll('files')
              .filter((f): f is File => typeof f !== 'string' && !!f.name);
            if (!String(data.get('text')).trim() && !files.length) {
              setError('Write a note or attach a file.');
              return;
            }
            if (
              files.length > 10 ||
              files.reduce((sum, f) => sum + f.size, 0) > maxNoteBytes
            ) {
              setError('Choose up to 10 files totaling 2 MB or less.');
              return;
            }
            data.delete('files');
            files.forEach((f) => data.append('files', f));
            data.set('id', draftId.current);
            setSaving(true);
            setError('');
            try {
              const note: ProjectNote = await (await fetchNote(url, data)).json();
              setNotes((list) => [note, ...list.filter((n) => n.id !== note.id)]);
              setEditing(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not save note.');
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="crm-field">
            Note
            <textarea
              name="text"
              placeholder="Write a note or paste a link"
              maxLength={maxNoteLength}
              disabled={saving}
              autoFocus
            />
          </label>
          <label className="crm-field">
            Attachments (up to 2 MB total)
            <input name="files" type="file" multiple disabled={saving} />
          </label>
          <button className="crm-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save note'}
          </button>{' '}
          <button
            type="button"
            className="crm-secondary"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              setError('');
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          className="crm-secondary"
          onClick={() => {
            draftId.current = crypto.randomUUID();
            setError('');
            setEditing(true);
          }}
        >
          <Plus size={15} /> Add note
        </button>
      )}
    </section>
  );
}
