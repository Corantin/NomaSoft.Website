import { hasSession } from '@/lib/crm/auth';
import { redirect } from 'next/navigation';
import Workspace from './workspace';
import './workspace.css';
export const metadata = {
  title: 'Customer workspace',
  robots: { index: false, follow: false },
};
export default function CrmPage() {
  if (!hasSession()) redirect('/crm/login');
  return <Workspace />;
}
