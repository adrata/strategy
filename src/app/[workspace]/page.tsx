import { redirect } from "next/navigation";

// Required for static export
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default function WorkspacePipelinePage() {
  // Redirect to Dashboard as the new default
  // This is a server-side redirect for better performance
  redirect('./dashboard');
}
