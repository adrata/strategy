"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  isActive: boolean;
}

interface OlympusContextType {
  selectedStep: WorkflowStep | null;
  setSelectedStep: (step: WorkflowStep | null) => void;
}

const OlympusContext = createContext<OlympusContextType | undefined>(undefined);

export const useOlympus = () => {
  const context = useContext(OlympusContext);
  if (!context) {
    throw new Error('useOlympus must be used within an OlympusProvider');
  }
  return context;
};

interface OlympusLayoutProps {
  children: React.ReactNode;
}

/**
 * Olympus Layout
 * 
 * Provides a layout with middle and right panels only (no left panel).
 * Uses the same middle and right panel components from the pipeline product.
 */
export default function OlympusLayout({ children }: OlympusLayoutProps) {
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const params = useParams();
  const workspaceId = params.workspace as string;

  // Load selected step from Redis on mount
  useEffect(() => {
    const loadSelectedStep = async () => {
      try {
        const response = await fetch(`/api/olympus/selected-step?workspaceId=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.selectedStep) {
            setSelectedStep(data.selectedStep);
          }
        }
      } catch (error) {
        console.error('Failed to load selected step:', error);
      }
    };

    if (workspaceId) {
      loadSelectedStep();
    }
  }, [workspaceId]);

  // Save selected step to Redis when it changes
  useEffect(() => {
    const saveSelectedStep = async () => {
      try {
        await fetch('/api/olympus/selected-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, selectedStep })
        });
      } catch (error) {
        console.error('Failed to save selected step:', error);
      }
    };

    if (workspaceId) {
      saveSelectedStep();
    }
  }, [selectedStep, workspaceId]);

  return (
    <OlympusContext.Provider value={{ selectedStep, setSelectedStep }}>
      <AcquisitionOSProvider>
        <ZoomProvider>
          <ProfilePopupProvider>
            <OlympusLayoutContent>
              {children}
            </OlympusLayoutContent>
          </ProfilePopupProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    </OlympusContext.Provider>
  );
}

// Custom Right Panel that switches between chat and data view
function OlympusRightPanel() {
  const { selectedStep, setSelectedStep } = useOlympus();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'Medium',
    notes: ''
  });

  // Update form data when selectedStep changes
  useEffect(() => {
    if (selectedStep) {
      setFormData({
        title: selectedStep.title,
        description: selectedStep.description,
        status: 'Not Started',
        priority: 'Medium',
        notes: ''
      });
    }
  }, [selectedStep]);

  // Real-time save function
  const saveData = useCallback(async (data: any) => {
    try {
      // Here you would save to your backend
      console.log('Saving data:', data);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: any) => saveData(data), 500),
    [saveData]
  );

  // Save on form data change
  useEffect(() => {
    if (selectedStep) {
      debouncedSave({ ...selectedStep, ...formData });
    }
  }, [formData, selectedStep, debouncedSave]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'Enter') {
        e.preventDefault();
        // Complete action
        console.log('Complete action triggered');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (selectedStep) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{selectedStep.title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{selectedStep.description}</p>
          </div>
          <button
            onClick={() => setSelectedStep(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Data Form */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  return <RightPanel />;
}

// Separate component that can use the context hooks
function OlympusLayoutContent({ children }: { children: React.ReactNode }) {
  // Now we can use the context hooks since we're inside the providers
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={null} // No left panel for Olympus
      middlePanel={children}
      rightPanel={<OlympusRightPanel />}
      zoom={100}
      isLeftPanelVisible={false} // Always hide left panel
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
