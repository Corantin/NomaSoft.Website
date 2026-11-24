import { ArrowRight, Layers3 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { hasSession } from '@/lib/crm/auth';
import { signIn } from './actions';
import '../workspace.css';

export const metadata = {
  title: 'Sign in to NomaSoft CRM',
  robots: { index: false, follow: false },
};
export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  if (hasSession()) redirect('/crm');
  return (
    <main className="crm crm-login">
      <section aria-labelledby="login-heading">
        <div className="crm-login-brand">
          <Layers3 aria-hidden="true" size={22} />
          NomaSoft
        </div>
        <h1 id="login-heading">Sign in to your workspace</h1>
        <form action={signIn}>
          <label className="crm-field">
            <span>Username</span>
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </label>
          <label className="crm-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          {searchParams.error === '1' && (
            <p role="alert" className="crm-warning">
              The username or password is incorrect.
            </p>
          )}
          <button className="crm-primary">
            Sign in <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}
