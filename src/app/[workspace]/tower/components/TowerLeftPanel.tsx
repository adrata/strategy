"use client";

import React, { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";

interface TowerLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function TowerLeftPanel({ activeSection, onSectionChange }: TowerLeftPanelProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Tower metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/tower/metrics');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMetrics(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Tower metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Tower-specific sections
  const sections = [
    {
      id: "overview",
      name: "Overview",
      description: "System health & status",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : "Live",
      visible: true
    },
    {
      id: "performance",
      name: "Performance",
      description: "Speed & efficiency",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : metrics?.performance?.score || "0",
      visible: true
    },
    {
      id: "reliability",
      name: "Reliability",
      description: "Uptime & stability",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : metrics?.reliability?.uptime || "99.9%",
      visible: true
    },
    {
      id: "security",
      name: "Security",
      description: "Threats & compliance",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : metrics?.security?.threats || "0",
      visible: true
    },
    {
      id: "alerts",
      name: "Alerts",
      description: "Active notifications",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : metrics?.alerts?.active || "0",
      visible: true
    },
    {
      id: "logs",
      name: "Logs",
      description: "System activity",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : metrics?.logs?.today || "0",
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
          <div className="text-sm text-gray-500">Loading Tower...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">T</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Tower</h2>
              <p className="text-xs text-[var(--muted)]">System Monitoring</p>
            </div>
          </div>
        </div>

        {/* System Performance Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Uptime</span>
              <span className="text-xs font-semibold text-black">
                {loading ? (
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : metrics?.reliability?.uptime || "99.9%"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Performance</span>
              <span className="text-xs font-semibold text-black">
                {loading ? (
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : metrics?.performance?.score || "95"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Alerts</span>
              <span className="text-xs font-semibold text-black">
                {loading ? (
                  <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : metrics?.security?.threats || "0"}
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
