import Workspace from './workspace';
import './workspace.css';
export const metadata = {
  title: 'Customer workspace',
  robots: { index: false, follow: false },
};
export default function CrmPage() {
  return <Workspace />;
}
