"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FindBuyerGroupRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new URL
    router.replace("/find-your-buyer-group");
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-muted">Redirecting...</p>
      </div>
    </div>
  );
} 