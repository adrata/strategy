"use client";

import React, { useEffect } from "react";
import { DocsContent } from "./components/DocsContent";

export default function DocsPage() {
  // Set browser title
  useEffect(() => {
    document.title = 'Documentation • Adrata';
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background border border-border rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-base">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Documentation</h1>
                <p className="text-xs text-muted">Adrata Platform Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1 bg-background text-muted text-sm font-medium rounded-lg border border-border hover:bg-panel-background transition-colors">
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