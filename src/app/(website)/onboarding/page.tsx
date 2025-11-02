"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Adrata
          </h1>
          <p className="text-muted mb-8">
            Your complete enterprise operating system
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
