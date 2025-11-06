import { redirect } from 'next/navigation';

export default function WorkspaceStacksPage() {
  // Redirect to epics by default
  redirect('./epics');
}


