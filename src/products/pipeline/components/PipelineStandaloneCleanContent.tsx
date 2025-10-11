"use client";

import React, { useRef, useEffect, useState } from "react";
import { Kbd, formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
import { useRouter } from "next/navigation";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { AcquisitionOSLayout } from "@/platform/ui/components/ActionPlatformLayout";
import { AcquisitionOSLeftPanel } from "@/platform/ui/components/ActionPlatformLeftPanel";
import { AcquisitionOSMiddlePanel } from "@/platform/ui/components/ActionPlatformMiddlePanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";

import { useSpeedrunDataContext } from "@/platform/services/speedrun-data-context";

/**
 * Pipeline Speedrun Sprint - Exact Monaco Layout with Pipeline Branding
 * 
 * This component replicates Monaco's SpeedrunModeLayout exactly:
 * 1. Uses AcquisitionOSProvider with "Speedrun" app (same as Monaco)
 * 2. Shows contact list on left, contact details in middle, chat on right
 * 3. Auto-selects first contact on load
 * 4. Shows "Back to Pipeline" instead of "Back to Monaco"
 * 5. Uses Pipeline data context and routing
 */
export function PipelineStandaloneCleanContent() {
  const router = useRouter();
  const { prospects: dynamicRtpProspects } = useSpeedrunDataContext();
  
  // Monaco Signal popup state
  const [isSlideUpVisible, setIsSlideUpVisible] = useState(false);
  const [isAcceptDropdownOpen, setIsAcceptDropdownOpen] = useState(false);
  
  // Auto-select first contact when entering Speedrun mode (identical to Monaco)
  useEffect(() => {
    console.log("🚀 PipelineSpeedrunModeLayout: prospects available:", dynamicRtpProspects.length);
    const firstContact = dynamicRtpProspects[0];
    if (firstContact) {
      // Dispatch the same event Monaco uses
      document.dispatchEvent(new CustomEvent('startSpeedrunWithFirstContact', {
        detail: { contact: firstContact }
      }));
      console.log("🚀 PipelineSpeedrunModeLayout: Auto-selected first contact:", firstContact.name || firstContact.fullName);
    }
  }, [dynamicRtpProspects]);

  // Override any Monaco navigation to use Pipeline routes
  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href.includes('/monaco')) {
        event.preventDefault();
        const cleanUrl = link.href.replace('/monaco', '');
        router.push(cleanUrl);
        console.log("🚀 PipelineStandaloneCleanContent: Redirected Monaco route to clean URL:", cleanUrl);
      }
    };

    document.addEventListener('click', handleNavigation, true);
    return () => document.removeEventListener('click', handleNavigation, true);
  }, [router]);

  // Monaco Signal activation handler
  const handleMonacoSignalActivation = () => {
    // Hide the Monaco Signal
    setIsSlideUpVisible(false);
    // Close accept dropdown
    setIsAcceptDropdownOpen(false);
    
    console.log("🎯 Monaco Signal activated in Pipeline Speedrun");
  };

  // Keyboard shortcuts for Monaco Signal popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command+I (Mac) or Ctrl+I (Windows/Linux) - Monaco Signal popup
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'i') {
        event.preventDefault();
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
  
  // Use the EXACT same setup as Monaco's SpeedrunModeLayout
  return (
    <>
      <AcquisitionOSProvider initialApp="Speedrun" initialSection="inbox">
          <AcquisitionOSLayout
            leftPanel={<AcquisitionOSLeftPanel />}
            middlePanel={<AcquisitionOSMiddlePanel />}
            rightPanel={<RightPanel />}
            shouldShowLeftPanel={true}
            shouldShowThinLeftPanel={false}
          />
      </AcquisitionOSProvider>

      {/* Monaco Signal Popup - Pipeline Speedrun Version */}
      {isSlideUpVisible && (
        <div className="fixed bottom-6 right-4 z-[9999] animate-in slide-in-from-right duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-[520px] p-7">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Buying Intent Detected</h3>
                  <p className="text-gray-600 text-sm">Pipeline Speedrun Signal</p>
                </div>
              </div>
              <button
                onClick={() => setIsSlideUpVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                    SM
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sarah Mitchell</p>
                    <p className="text-sm text-gray-600">IT Director at Retail Solutions Inc</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  "Looking to upgrade our POS system next quarter with budget approved for $50K solution"
                </p>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="text-gray-900 font-medium">Recommendation:</span> Move to #1 on Speedrun (prime timing for outreach)
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMonacoSignalActivation}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-3"
                >
                  Accept
                  <Kbd variant="green" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd>
                </button>
                <button
                  onClick={() => setIsSlideUpVisible(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}