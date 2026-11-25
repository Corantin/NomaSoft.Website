import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { projectLink, type Engagement, type ProjectLink } from '@/lib/crm/model';

export default function ProjectLinks({
  project,
  version,
  busy,
  request,
}: {
  project: Engagement;
  version: string;
  busy: boolean;
  request: (body: unknown) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<ProjectLink | null>(null);
  const [error, setError] = useState('');
  const links = [
    ...(['github', 'vercel'] as const)
      .filter((k) => /^https:\/\//i.test(project[k]))
      .map((k) => ({
        id: k,
        label: k === 'github' ? 'GitHub repository' : 'Vercel project',
        url: project[k],
        custom: false,
      })),
    ...(project.links ?? []).map((link) => ({ ...link, custom: true })),
  ];
  function edit(link: ProjectLink) {
    setDraft({ id: link.id, label: link.label, url: link.url });
    setError('');
  }
  return (
    <section aria-label="Project links">
      <h3>Project links</h3>
      {links.map((link) => (
        <div className="crm-project-link" key={link.id}>
          <a
            className="crm-link"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.url}
          >
            {link.label} <ExternalLink size={14} />
          </a>
          {link.custom && (
            <>
              <button
                type="button"
                disabled={busy || !!draft}
                aria-label={'Edit ' + link.label}
                onClick={() => edit(link)}
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                disabled={busy || !!draft}
                aria-label={'Remove ' + link.label}
                onClick={() =>
                  void request({
                    action: 'removeLink',
                    engagementId: project.id,
                    linkId: link.id,
                    version,
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ))}
      {draft ? (
        <form
          className="crm-form"
          data-saving={busy}
          onSubmit={async (e) => {
            e.preventDefault();
            const parsed = projectLink.safeParse(draft);
            if (!parsed.success) {
              setError('Enter a label and a valid http:// or https:// URL.');
              return;
            }
            if (
              await request({
                action: 'saveLink',
                engagementId: project.id,
                link: parsed.data,
                version,
              })
            )
              setDraft(null);
          }}
        >
          <label className="crm-field">
            <span>Label</span>
            <input
              required
              autoFocus
              maxLength={180}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </label>
          <label className="crm-field">
            <span>URL</span>
            <input
              type="url"
              required
              maxLength={8192}
              placeholder="https://"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div>
            <button className="crm-primary" disabled={busy}>
              Save link
            </button>{' '}
            <button
              className="crm-secondary"
              type="button"
              disabled={busy}
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="crm-secondary"
          type="button"
          disabled={busy}
          onClick={() => edit({ id: crypto.randomUUID(), label: '', url: '' })}
        >
          <Plus size={15} /> Add link
        </button>
      )}
    </section>
  );
}
