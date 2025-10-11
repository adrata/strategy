"use client";

import React from 'react';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { getAppComponent, getAppConfig, hasApp } from '@/platform/config/app-registry';
import { ModuleErrorBoundary } from '@/platform/ui/components/ModuleErrorBoundary';

/**
 * ActionPlatformMiddlePanel - Refactored
 * 
 * Refactored version that uses the app registry instead of large switch statements.
 * This makes the component more maintainable and easier to extend.
 */
export function ActionPlatformMiddlePanelRefactored() {
  const { ui } = useAcquisitionOS();
  const { activeSubApp } = ui;

  // Route to appropriate specialized component using the registry
  const renderContent = () => {
    // Check if the app exists in the registry
    if (!hasApp(activeSubApp)) {
      console.warn(`Unknown application: ${activeSubApp}`);
      
      // Render fallback UI for unknown apps
      return React.createElement(
        'div',
        { className: "p-8" },
        React.createElement(
          'div',
          { className: "text-center py-12" },
          React.createElement(
            'div',
            { className: "text-6xl mb-4" },
            '🚀'
          ),
          React.createElement(
            'h3',
            { className: "text-lg font-medium text-[var(--foreground)] mb-2" },
            'AcquisitionOS'
          ),
          React.createElement(
            'p',
            { className: "text-[var(--muted)]" },
            `Unknown application: ${activeSubApp}`
          )
        )
      );
    }

    // Get the component from the registry
    const AppComponent = getAppComponent(activeSubApp);
    const appConfig = getAppConfig(activeSubApp);

    if (!AppComponent) {
      console.error(`No component found for app: ${activeSubApp}`);
      return null;
    }

    console.log(`🎯 ActionPlatformMiddlePanel: Routing to ${appConfig?.name} (${activeSubApp})`);

    // Render the app component with error boundary
    return React.createElement(
      ModuleErrorBoundary,
      { moduleName: appConfig?.name || activeSubApp },
      React.createElement(AppComponent)
    );
  };

  return React.createElement(
    'div',
    { className: "h-full" },
    renderContent()
  );
}

// Legacy alias for backwards compatibility
export const AcquisitionOSMiddlePanelRefactored = ActionPlatformMiddlePanelRefactored;
