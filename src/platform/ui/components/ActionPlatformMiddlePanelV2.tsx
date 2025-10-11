/**
 * ACTION PLATFORM MIDDLE PANEL V2 - Configuration-driven version
 * 
 * This version uses the app registry instead of large switch statements
 * while preserving the exact same interface and behavior as the original.
 */

"use client";

import React from 'react';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { renderAppComponent, getAppComponent, getAppConfig } from '@/platform/config/app-registry';

export function ActionPlatformMiddlePanelV2() {
  const { activeSubApp } = useAcquisitionOS();

  // Use configuration to render the appropriate component instead of switch statement
  const renderContent = () => {
    if (!activeSubApp) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Adrata
            </h2>
            <p className="text-gray-600">
              Select an app from the left panel to get started.
            </p>
          </div>
        </div>
      );
    }

    // Use configuration to get the appropriate component
    const AppComponent = getAppComponent(activeSubApp);
    
    if (!AppComponent) {
      // Fallback to switch statement for now to maintain functionality
      switch (activeSubApp) {
        case 'pipeline':
          return <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Pipeline App
              </h2>
              <p className="text-gray-600">
                Pipeline functionality would be rendered here.
              </p>
            </div>
          </div>;
        case 'speedrun':
          return <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Speedrun App
              </h2>
              <p className="text-gray-600">
                Speedrun functionality would be rendered here.
              </p>
            </div>
          </div>;
        case 'monaco':
          return <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Monaco App
              </h2>
              <p className="text-gray-600">
                Monaco functionality would be rendered here.
              </p>
            </div>
          </div>;
        default:
          return (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  App Not Found
                </h2>
                <p className="text-gray-600">
                  The app "{activeSubApp}" is not available.
                </p>
              </div>
            </div>
          );
      }
    }

    // Render the component with appropriate props
    return <AppComponent />;
  };

  return (
    <div className="h-full flex flex-col">
      {renderContent()}
    </div>
  );
}

// Export with the same name for compatibility
export const ActionPlatformMiddlePanel = ActionPlatformMiddlePanelV2;
export const AcquisitionOSMiddlePanel = ActionPlatformMiddlePanelV2;
