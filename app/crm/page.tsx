import { canRenew, hasSession } from '@/lib/crm/auth';
import { redirect } from 'next/navigation';
import Workspace from './workspace';
import './workspace.css';
export const metadata = {
  title: 'Customer workspace',
  robots: { index: false, follow: false },
};
export default async function CrmPage() {
  if (!(await hasSession())) redirect(canRenew() ? '/api/crm/renew' : '/crm/login');
  return <Workspace />;
}
