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
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">T</span>
          </div>
          <div>
            <h2 className="font-semibold text-[var(--foreground)] text-sm">Tower</h2>
            <p className="text-xs text-[var(--muted-foreground)]">System Monitoring</p>
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
