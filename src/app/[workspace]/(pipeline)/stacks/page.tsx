import { redirect } from 'next/navigation';

export default function WorkspaceStacksPage() {
  // Redirect to sell/pipeline by default
  redirect('./sell/pipeline');
}


