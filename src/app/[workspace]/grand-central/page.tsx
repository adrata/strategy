"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { Loader2 } from "lucide-react";

export default function GrandCentralLanding() {
  const router = useRouter();
  const { user, isLoading } = useUnifiedAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Automatically redirect authenticated users to dashboard
        router.replace("./dashboard");
      } else {
        // Redirect unauthenticated users to sign in
        router.replace("/sign-in?returnTo=./dashboard");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Grand Central
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connecting you to your integration hub...
        </p>
      </div>
    </div>
  );
}
