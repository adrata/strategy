"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";

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
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { OlympusLeftPanel } from "./components/OlympusLeftPanel";

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
  addWorkflowSteps: (steps: WorkflowStep[]) => void;
  activeSection: string;
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
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);
      // Extract section from URL: /{workspace}/olympus/{section}
      const sectionIndex = segments.indexOf('olympus') + 1;
      return segments[sectionIndex] || 'buyer-group';
    }
    return 'buyer-group';
  });
  const params = useParams();
  const workspaceId = params.workspace as string;
  const { user: authUser } = useUnifiedAuth();
  const router = useRouter();

  // Access control - only admins can access Olympus
  const ADMIN_EMAILS = ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'];
  const isAdminUser = ADMIN_EMAILS.includes(authUser?.email || '');
  
  useEffect(() => {
    if (authUser?.email && !isAdminUser) {
      console.log('🚫 Olympus: Access denied for', authUser.email, '- redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [authUser?.email, router, isAdminUser]);

  // Don't render if not authorized
  if (authUser?.email && !isAdminUser) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Access Restricted</h2>
          <p className="text-[var(--muted)]">This feature is currently in development.</p>
        </div>
      </div>
    );
  }

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

  const addWorkflowSteps = (steps: WorkflowStep[]) => {
    // This will be implemented to communicate with the page component
    console.log('Adding workflow steps:', steps);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Use router.push to properly navigate and update the middle panel
    router.push(`/${workspaceId}/olympus/${section}`);
    console.log(`Olympus section changed to: ${section}`);
  };

  // Handle URL-based section updates and redirects
  useEffect(() => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const olympusIndex = segments.indexOf('olympus');
    
    // If URL is just /{workspace}/olympus, redirect to buyer-group
    if (olympusIndex === segments.length - 1) {
      router.replace(`/${workspaceId}/olympus/buyer-group`);
    } else if (olympusIndex >= 0 && segments[olympusIndex + 1]) {
      // Update state to match URL
      const urlSection = segments[olympusIndex + 1];
      if (urlSection !== activeSection) {
        setActiveSection(urlSection);
      }
    }
  }, [workspaceId, router]); // Remove activeSection from dependencies

  return (
    <OlympusContext.Provider value={{ selectedStep, setSelectedStep, addWorkflowSteps, activeSection }}>
      <RevenueOSProvider>
        <ZoomProvider>
          <ProfilePopupProvider>
            <OlympusLayoutContent 
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
            >
              {children}
            </OlympusLayoutContent>
          </ProfilePopupProvider>
        </ZoomProvider>
      </RevenueOSProvider>
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
            className="p-1.5 hover:bg-[var(--hover)] rounded-lg transition-colors"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
function OlympusLayoutContent({ 
  children, 
  activeSection, 
  onSectionChange 
}: { 
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  // Now we can use the context hooks since we're inside the providers
  const { ui } = useRevenueOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={
        <OlympusLeftPanel 
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      }
      middlePanel={children}
      rightPanel={<OlympusRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
