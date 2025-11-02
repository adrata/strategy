import { redirect } from 'next/navigation';

export default function WorkspaceStacksPage() {
  // Redirect to workstreams by default
  redirect('./workstreams');
}


