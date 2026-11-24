import { Layers3 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { hasSession } from '@/lib/crm/auth';
import { LoginForm } from './form';
import '../workspace.css';

export const metadata = {
  title: 'Sign in to NomaSoft CRM',
  robots: { index: false, follow: false },
};
export default async function Login() {
  if (await hasSession()) redirect('/crm');
  return (
    <main className="crm crm-login">
      <section aria-labelledby="login-heading">
        <div className="crm-login-brand">
          <Layers3 aria-hidden="true" size={22} />
          NomaSoft
        </div>
        <h1 id="login-heading">Sign in to your workspace</h1>
        <LoginForm />
      </section>
    </main>
  );
}
