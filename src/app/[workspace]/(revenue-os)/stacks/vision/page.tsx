"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function VisionPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params?.workspace as string;

  useEffect(() => {
    // Redirect to epics page
    if (workspaceSlug) {
      router.replace(`/${workspaceSlug}/stacks/epics`);
    }
  }, [router, workspaceSlug]);

  // Show a loading state while redirecting
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
        <p className="text-muted">Redirecting to Epics...</p>
      </div>
    </div>
  );
}

