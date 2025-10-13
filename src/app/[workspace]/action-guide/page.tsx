"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ActionGuideContent } from "./components/ActionGuideContent";

export default function ActionGuidePage() {
  const router = useRouter();
  const params = useParams();
  const workspace = params.workspace as string;

  // Set browser title
  useEffect(() => {
    document.title = 'Action Guide • Adrata';
  }, []);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--foreground)] font-bold text-base">ℹ️</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--foreground)]">Action Guide</h1>
                <p className="text-xs text-[var(--muted)]">How to use Adrata effectively</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/${workspace}/pipeline`)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Workspace
              </button>
              <button className="px-4 py-1 bg-[var(--background)] text-[var(--muted)] text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--panel-background)] transition-colors">
                Search
              </button>
              <button className="px-4 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors">
                Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ActionGuideContent />
      </div>
    </div>
  );
}
