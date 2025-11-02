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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background border border-border rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-base">ℹ️</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Action Guide</h1>
                <p className="text-xs text-muted">How to use Adrata effectively</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/${workspace}/pipeline`)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-hover rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Workspace
              </button>
              <button className="px-4 py-1 bg-background text-muted text-sm font-medium rounded-lg border border-border hover:bg-panel-background transition-colors">
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
