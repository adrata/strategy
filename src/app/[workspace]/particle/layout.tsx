"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { ParticleLeftPanel } from "./components/ParticleLeftPanel";
import { ParticleExperiment, ParticleVariant, ParticleTestRun } from "./types/experiment";

const queryClient = new QueryClient();

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface ParticleContextType {
  // Selected items
  selectedExperiment: ParticleExperiment | null;
  setSelectedExperiment: (experiment: ParticleExperiment | null) => void;
  selectedVariant: ParticleVariant | null;
  setSelectedVariant: (variant: ParticleVariant | null) => void;
  selectedTestRun: ParticleTestRun | null;
  setSelectedTestRun: (testRun: ParticleTestRun | null) => void;
  
  // Active tabs
  activeTab: 'experiments' | 'results' | 'analytics' | 'templates';
  setActiveTab: (tab: 'experiments' | 'results' | 'analytics' | 'templates') => void;
  
  // Filters
  experimentType: string | null;
  setExperimentType: (type: string | null) => void;
  experimentStatus: string | null;
  setExperimentStatus: (status: string | null) => void;
  dateRange: { start: Date | null; end: Date | null };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // UI state
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isRunModalOpen: boolean;
  setIsRunModalOpen: (open: boolean) => void;
  isResultsModalOpen: boolean;
  setIsResultsModalOpen: (open: boolean) => void;
}

const ParticleContext = createContext<ParticleContextType | undefined>(undefined);

export const useParticle = () => {
  const context = useContext(ParticleContext);
  if (!context) {
    throw new Error('useParticle must be used within ParticleProvider');
  }
  return context;
};

interface ParticleLayoutProps {
  children: React.ReactNode;
}

export default function ParticleLayout({ children }: ParticleLayoutProps) {
  const [selectedExperiment, setSelectedExperiment] = useState<ParticleExperiment | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ParticleVariant | null>(null);
  const [selectedTestRun, setSelectedTestRun] = useState<ParticleTestRun | null>(null);
  const [activeTab, setActiveTab] = useState<'experiments' | 'results' | 'analytics' | 'templates'>('experiments');
  const [experimentType, setExperimentType] = useState<string | null>(null);
  const [experimentStatus, setExperimentStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ParticleContext.Provider value={{ 
        selectedExperiment, 
        setSelectedExperiment,
        selectedVariant,
        setSelectedVariant,
        selectedTestRun,
        setSelectedTestRun,
        activeTab, 
        setActiveTab,
        experimentType,
        setExperimentType,
        experimentStatus,
        setExperimentStatus,
        dateRange,
        setDateRange,
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isRunModalOpen,
        setIsRunModalOpen,
        isResultsModalOpen,
        setIsResultsModalOpen,
      }}>
        <AcquisitionOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <ParticleLayoutContent>
                {children}
              </ParticleLayoutContent>
            </ProfilePopupProvider>
          </ZoomProvider>
        </AcquisitionOSProvider>
      </ParticleContext.Provider>
    </QueryClientProvider>
  );
}

// Custom Right Panel for Particle
function ParticleRightPanel() {
  const { selectedExperiment, selectedVariant, selectedTestRun } = useParticle();

  if (selectedTestRun) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Test Run Details</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{selectedTestRun.id}</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                selectedTestRun.status === 'completed' ? 'bg-green-100 text-green-800' :
                selectedTestRun.status === 'running' ? 'bg-blue-100 text-blue-800' :
                selectedTestRun.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedTestRun.status}
              </span>
            </div>
            {selectedTestRun.startTime && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Duration</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {selectedTestRun.duration ? `${selectedTestRun.duration}ms` : 'Calculating...'}
                </p>
              </div>
            )}
            {selectedTestRun.sampleSize > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Sample Size</label>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedTestRun.sampleSize}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedVariant) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Variant Details</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{selectedVariant.name}</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Type</label>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                selectedVariant.isControl ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {selectedVariant.isControl ? 'Control' : 'Treatment'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Traffic Weight</label>
              <p className="text-sm text-[var(--muted-foreground)]">{(selectedVariant.weight * 100).toFixed(1)}%</p>
            </div>
            {selectedVariant.description && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedVariant.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedExperiment) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Experiment Details</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{selectedExperiment.name}</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                selectedExperiment.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedExperiment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                selectedExperiment.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedExperiment.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Type</label>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedExperiment.experimentType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Confidence Level</label>
              <p className="text-sm text-[var(--muted-foreground)]">{(selectedExperiment.confidenceLevel * 100).toFixed(0)}%</p>
            </div>
            {selectedExperiment.hypothesis && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Hypothesis</label>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedExperiment.hypothesis}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <RightPanel />;
}

// Layout content component that can use context hooks
function ParticleLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<ParticleLeftPanel />}
      middlePanel={children}
      rightPanel={<ParticleRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
