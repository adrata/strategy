"use client";

import React, { useEffect } from "react";
import { DocsContent } from "./components/DocsContent";

export default function DocsPage() {
  // Set browser title
  useEffect(() => {
    document.title = 'Documentation • Adrata';
  }, []);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--foreground)] font-bold text-base">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--foreground)]">Documentation</h1>
                <p className="text-xs text-[var(--muted)]">Adrata Platform Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1 bg-[var(--background)] text-[var(--muted)] text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--panel-background)] transition-colors">
                Search
              </button>
              <button className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors">
                Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <DocsContent />
      </div>
    </div>
  );
}