import { redirect } from "next/navigation";

export default function WorkspacePipelinePage() {
  // Redirect to Dashboard as the new default
  // This is a server-side redirect for better performance
  redirect('./dashboard');
}
