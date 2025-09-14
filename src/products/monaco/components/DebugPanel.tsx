"use client";

import React, { useState } from 'react';
import { demoScenarioService } from '@/platform/services/DemoScenarioService';

interface DebugPanelProps {
  onForceRefresh?: () => void;
}

export function DebugPanel({ onForceRefresh }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClearCache = () => {
    demoScenarioService.clearScenarioCache();
    if (onForceRefresh) {
      onForceRefresh();
    }
    // Force page reload to clear all caches
    window.location.reload();
  };

  const handleForceRefresh = () => {
    demoScenarioService.forceRefreshScenario();
    if (onForceRefresh) {
      onForceRefresh();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Current Scenario:</strong> {demoScenarioService.getCurrentScenario()}
        </div>
        <div>
          <strong>Demo Mode:</strong> {demoScenarioService.isDemoMode() ? 'Yes' : 'No'}
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleForceRefresh}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
          <button
            onClick={handleClearCache}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}
