"use client";

import React from "react";
import Link from "next/link";

export default function GrandCentralDashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="bg-background rounded-xl shadow-lg p-8 w-full max-w-md border">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Grand Central</h1>
          <p className="text-muted text-sm mt-2">Integration Hub</p>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Grand Central Integration Hub
          </h2>
          <p className="text-muted mt-2">Coming soon in desktop edition</p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
