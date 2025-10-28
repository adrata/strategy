"use client";

import React, { useState, useEffect, useRef } from "react";
import { Kbd, formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
import { useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { MiddlePanel } from "@/products/pipeline/components/MiddlePanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { useZoom, ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { usePipeline } from "@/products/pipeline/context/PipelineContext";
import { useSpeedrunSignals } from "@/platform/hooks/useSpeedrunSignals";
import { AddModal } from "@/platform/ui/components/AddModal";
import { SpeedrunEngineModal } from "@/platform/ui/components/SpeedrunEngineModal";


interface PipelineDetailPageProps {
  section: string;
}

/**
 * PipelineSectionPage - FOR DETAIL VIEWS ONLY
 * 
 * This component is used for showing individual record details (e.g., /contacts/123)
 * For main section pages (e.g., /contacts), use PipelineView from @/ui/components/pipeline/PipelineView
 * 
 * DO NOT use this for workspace section pages - use PipelineView instead!
 */

// Component that clears selectedRecord when section changes
function ClearRecordOnSectionChange({ section }: { section: string }) {
  const { ui } = useRevenueOS();
  const previousSectionRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only clear when section actually changes, not on initial mount or record selection
    if (previousSectionRef.current !== null && previousSectionRef.current !== section) {
      console.log(`🔄 PipelineSectionPage: Section changed from ${previousSectionRef.current} to ${section}, clearing selectedRecord`);
      ui.setSelectedRecord(null);
      ui.setDetailViewType(null);
    }
    
    // Update the previous section reference
    previousSectionRef['current'] = section;
  }, [section, ui]);
  
  return null;
}

function PipelineDetailContent({ section }: PipelineDetailPageProps) {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const { zoom } = useZoom();
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  
  const handleSectionChange = (newSection: string) => {
    // Use workspace-aware navigation
    navigateToPipeline(newSection);
  };
  
  return (
    <div className="h-full w-full overflow-hidden invisible-scrollbar">
      <ClearRecordOnSectionChange section={section} />
      <PipelinePanelLayout section={section} />
    </div>
  );
}

// Separate component to access AcquisitionOS context
function PipelinePanelLayout({ section }: { section: string }) {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const { ui } = useRevenueOS();
  const { zoom } = useZoom();
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  
  // Get acquisition data for the pipeline
  const { data: acquisitionData } = useRevenueOS();
  
  // Monaco Signal popup state for Speedrun section
  const [isSlideUpVisible, setIsSlideUpVisible] = useState(false);
  const [isAcceptDropdownOpen, setIsAcceptDropdownOpen] = useState(false);
  
  // Modal states
  const [isSpeedrunEngineModalOpen, setIsSpeedrunEngineModalOpen] = useState(false);
  
  // Get Pipeline context for profile functionality
  const { 
    user, 
    company, 
    workspace,
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor
  } = usePipeline();

  // Note: Removed redirect logic to allow free navigation between tabs
  // Users can now access all sections regardless of data availability

  // OPTIMIZED: Only update section when it actually changes and avoid unnecessary data reloads
  useEffect(() => {
    if (ui.activeSection !== section) {
      console.log(`🔄 [OPTIMIZED] Updating section from ${ui.activeSection} to ${section} (no data reload)`);
      
      // ⚡ INSTANT UI UPDATE: Use setTimeout to make UI updates non-blocking
      setTimeout(() => {
        // For speedrun, set the section to 'inbox' which shows the prospect list
        const targetSection = section === 'speedrun' ? 'inbox' : section;
        ui.setActiveSection(targetSection);
        
        // Also set the app to 'Speedrun' for speedrun section to show prospects
        if (section === 'speedrun' && ui.activeSubApp !== 'Speedrun') {
          console.log(`🔄 [PipelineSectionPage] Setting activeSubApp to 'Speedrun' for section: ${section}`);
          ui.setActiveSubApp('Speedrun');
        } else if (section !== 'speedrun' && ui.activeSubApp !== 'pipeline') {
          console.log(`🔄 [PipelineSectionPage] Setting activeSubApp to 'pipeline' for section: ${section}, current path: ${window.location.pathname}`);
          ui.setActiveSubApp('pipeline');
        }
      }, 0); // Run in next tick to not block UI
    }
  }, [section, ui]);

  // Speedrun signals hook for automatic Monaco Signal popup (only for speedrun section)
  const { activeSignal, acceptSignal, dismissSignal } = useSpeedrunSignals(
    workspace?.id || '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
    user?.id || '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
    (signal) => {
      console.log('🎯 [Pipeline Speedrun] Signal accepted:', signal);
      setIsSlideUpVisible(false);
    }
  );

  // Automatically show popup when signal is received (for speedrun section only)
  useEffect(() => {
    if (section === 'speedrun' && activeSignal && !isSlideUpVisible) {
      console.log('🚨 [Pipeline Speedrun] Auto-showing Monaco Signal popup for:', activeSignal?.contact?.name || 'Unknown');
      setIsSlideUpVisible(true);
    }
  }, [section, activeSignal, isSlideUpVisible]);
  
  const handleSectionChange = (newSection: string) => {
    // Use workspace-aware navigation
    console.log(`🔄 PipelinePanelLayout: Navigating to workspace-aware ${newSection}`);
    navigateToPipeline(newSection);
  };

  // Monaco Signal activation handler
  const handleMonacoSignalActivation = () => {
    // Hide the Monaco Signal
    setIsSlideUpVisible(false);
    // Close accept dropdown
    setIsAcceptDropdownOpen(false);
    
    console.log("🎯 Monaco Signal activated in Pipeline:", section);
  };

  // Keyboard shortcuts for Monaco Signal popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('🎯 Key pressed:', event.key, 'Meta:', event.metaKey, 'Ctrl:', event.ctrlKey);
      
      // Command+I (Mac) or Ctrl+I (Windows/Linux) - Monaco Signal popup
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'i') {
        event.preventDefault();
        event.stopPropagation();
        console.log('🎯 Command+I pressed, toggling Monaco Signal. Current state:', isSlideUpVisible);
        setIsSlideUpVisible(prev => {
          console.log('🎯 Setting Monaco Signal visible to:', !prev);
          return !prev;
        });
      }
      
      // Command+Enter (Mac) or Ctrl+Enter (Windows/Linux) - Activate Monaco Signal
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'Enter') {
        const target = event.target as HTMLElement;
        const isInput = target['tagName'] === "INPUT" || target['tagName'] === "TEXTAREA" || target.isContentEditable;
        if (!isInput && isSlideUpVisible) {
          event.preventDefault();
          console.log('🎯 Command+Enter pressed, activating Monaco Signal');
          handleMonacoSignalActivation();
        }
      }
      
      // Escape to close Monaco Signal popup
      if (event['key'] === 'Escape' && isSlideUpVisible) {
        console.log('🎯 Escape pressed, closing Monaco Signal');
        setIsSlideUpVisible(false);
      }
    };

    // Listen for global signal popup events
    const handleGlobalSignal = (event: CustomEvent) => {
      console.log('🎯 Global signal event received:', event.detail);
      setIsSlideUpVisible(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('adrata-signal-popup', handleGlobalSignal as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('adrata-signal-popup', handleGlobalSignal as EventListener);
    };
  }, [isSlideUpVisible]);
  
  return (
    <>
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={
          <LeftPanel 
            activeSection={section}
            onSectionChange={handleSectionChange}
            isSpeedrunVisible={isSpeedrunVisible}
            setIsSpeedrunVisible={setIsSpeedrunVisible}
            isOpportunitiesVisible={isOpportunitiesVisible}
            setIsOpportunitiesVisible={setIsOpportunitiesVisible}
          />
        }
        middlePanel={<MiddlePanel activeSection={section} />}
        rightPanel={<RightPanel />}
        zoom={zoom}
        isLeftPanelVisible={ui.isLeftPanelVisible}
        isRightPanelVisible={ui.isRightPanelVisible}
        onToggleLeftPanel={ui.toggleLeftPanel}
        onToggleRightPanel={ui.toggleRightPanel}
      />
      
      {/* Profile Popup is now handled by LeftPanel */}

      {/* Speedrun Engine Modal */}
      <SpeedrunEngineModal
        isOpen={isSpeedrunEngineModalOpen}
        onClose={() => setIsSpeedrunEngineModalOpen(false)}
      />



      {/* Monaco Signal Popup - Only show for speedrun section */}
      {section === 'speedrun' && isSlideUpVisible && (
        <div className="fixed bottom-6 right-4 z-[9999] animate-in slide-in-from-right duration-300">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-[520px] p-7">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] text-lg">Buying Intent Detected</h3>
                  <p className="text-[var(--muted)] text-sm">Pipeline Speedrun Signal</p>
                </div>
              </div>
              <button
                onClick={() => setIsSlideUpVisible(false)}
                className="text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[var(--panel-background)] rounded-xl p-4">
                <div className="mb-2">
                  <p className="font-medium text-[var(--foreground)]">{activeSignal?.contact.name || 'Sarah Mitchell'}</p>
                  <p className="text-sm text-[var(--muted)]">{activeSignal?.contact.title || 'IT Director'} at {activeSignal?.contact.company || 'Retail Solutions Inc'}</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  "{activeSignal?.note.content || 'Looking to upgrade our POS system next quarter with budget approved for $50K solution'}"
                </p>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="text-[var(--foreground)] font-medium">Recommendation:</span> Move to #1 on Speedrun (prime timing for outreach)
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (activeSignal) {
                      await acceptSignal();
                    }
                    setIsSlideUpVisible(false);
                  }}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-3"
                >
                  Accept
                  <Kbd variant="green" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd>
                </button>
                <button
                  onClick={() => {
                    if (activeSignal) {
                      dismissSignal();
                    }
                    setIsSlideUpVisible(false);
                  }}
                  className="bg-[var(--hover)] hover:bg-[var(--loading-bg)] text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal for creating new records */}
      <AddModal />
    </>
  );
}

export function PipelineSectionPage({ section }: PipelineDetailPageProps) {
  return (
    <ZoomProvider>
      <PipelineDetailContent section={section} />
    </ZoomProvider>
  );
}