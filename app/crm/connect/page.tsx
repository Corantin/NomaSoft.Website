import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/crm/next-auth';
import { validAuthorization } from '@/lib/mcp/oauth';
import { LoginForm } from '../login/form';
import '../workspace.css';
export const dynamic = 'force-dynamic';
export default async function Connect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams))
    if (typeof v === 'string') q.set(k, v);
  if (!validAuthorization(q)) return <main>Invalid CRM connection request.</main>;
  const session = await getServerSession(authOptions);
  return (
    <main className="crm crm-login">
      <section>
        <h1>Connect ChatGPT to NomaSoft CRM</h1>
        {session?.user?.email ? (
          <form method="post" action="/api/crm/oauth/approve">
            <p>
              Allow ChatGPT to read and update CRM records as {session.user.email},
              including payments, time entries and attachments?
            </p>
            <input type="hidden" name="request" value={q.toString()} />
            <button className="crm-primary" name="decision" value="allow">
              Allow access
            </button>{' '}
            <button name="decision" value="deny">
              Cancel
            </button>
          </form>
        ) : (
          <LoginForm connect />
        )}
      </section>
    </main>
  );
}
