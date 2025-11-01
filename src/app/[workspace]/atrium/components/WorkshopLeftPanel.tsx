"use client";

import React from "react";
import { useWorkshop } from "../layout";
import { useUnifiedAuth } from "@/platform/auth";
import { 
  DocumentTextIcon,
  ClockIcon,
  PlusIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

export function WorkshopLeftPanel() {
  const {
    activeTab,
    setActiveTab,
    setIsUploadModalOpen,
    setIsCreateModalOpen,
  } = useWorkshop();

  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Workshop...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <DocumentTextIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Workshop</h2>
            <p className="text-xs text-[var(--muted)]">Documents</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* My Documents */}
        <button
          onClick={() => setActiveTab('my-documents')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'my-documents'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-[var(--foreground)]'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span className="text-sm font-medium">My Documents</span>
        </button>

        {/* Recent */}
        <button
          onClick={() => setActiveTab('recent')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'recent'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-[var(--foreground)]'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Recent</span>
        </button>

        {/* Quick Actions */}
        <div className="pt-4 space-y-1">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">New Document</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--panel-background)] text-[var(--foreground)] transition-colors border border-[var(--border)]"
          >
            <CloudArrowUpIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
