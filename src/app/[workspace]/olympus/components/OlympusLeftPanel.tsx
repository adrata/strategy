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
      <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500">Loading Olympus...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">O</span>
          </div>
          <div>
            <h2 className="font-semibold text-[var(--foreground)] text-sm">Olympus</h2>
            <p className="text-xs text-[var(--muted-foreground)]">CFO/CRO Pipeline</p>
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

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--muted-foreground)] text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
