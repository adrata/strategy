"use client";

import React, { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";

interface OlympusLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function OlympusLeftPanel({ activeSection, onSectionChange }: OlympusLeftPanelProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Olympus workflow data
  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        // Simulate fetching workflow data
        setWorkflowData({
          totalSteps: 12,
          completedSteps: 8,
          activeSteps: 2,
          pendingSteps: 2,
          workflows: 3,
          templates: 5
        });
      } catch (error) {
        console.error('Failed to fetch Olympus workflow data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowData();
  }, []);

  // Olympus-specific sections
  const sections = [
    {
      id: "workflows",
      name: "Workflows",
      description: "Active processes",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : workflowData?.workflows || "0",
      visible: true
    },
    {
      id: "steps",
      name: "Steps",
      description: "Process components",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : workflowData?.totalSteps || "0",
      visible: true
    },
    {
      id: "active",
      name: "Active",
      description: "Currently running",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : workflowData?.activeSteps || "0",
      visible: true
    },
    {
      id: "completed",
      name: "Completed",
      description: "Finished processes",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : workflowData?.completedSteps || "0",
      visible: true
    },
    {
      id: "templates",
      name: "Templates",
      description: "Reusable workflows",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : workflowData?.templates || "0",
      visible: true
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Performance insights",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : "Live",
      visible: true
    }
  ];

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500">Loading Olympus...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">O</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Olympus</h2>
              <p className="text-xs text-[var(--muted)]">CFO/CRO Pipeline</p>
            </div>
          </div>
        </div>

        {/* Workflow Performance Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Workflows</span>
              <span className="text-xs font-semibold text-black">
                {loading ? (
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : workflowData?.workflows || "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Completed</span>
              <span className="text-xs font-semibold text-black">
                {loading ? (
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : workflowData?.completedSteps || "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Active</span>
              <span className="text-xs font-semibold text-black">
                {loading ? (
                  <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : workflowData?.activeSteps || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-1 p-2">
        {sections.filter(section => section.visible).map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeSection === section.id
                ? 'bg-gray-100 text-gray-900'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{section.name}</span>
              <span className="text-sm text-[var(--muted)]">
                {typeof section.count === 'number' ? section.count.toLocaleString() : section.count}
              </span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {section.description}
            </div>
          </button>
        ))}
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-gray-400">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
