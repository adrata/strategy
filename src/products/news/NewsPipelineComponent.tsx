"use client";

import React from 'react';
import { NewsProvider } from './context/NewsContext';
import { NewsLeftPanel } from './components/NewsLeftPanel';
import { NewsMiddlePanel } from './components/NewsMiddlePanel';

/**
 * News Pipeline Component
 * 
 * This component integrates News with the Pipeline layout.
 * It provides the News-specific left panel and middle panel
 * while keeping the Pipeline's right panel (chat).
 */
export function NewsPipelineComponent() {
  return (
    <NewsProvider>
      <div className="flex h-full">
        {/* News Left Panel */}
        <NewsLeftPanel />
        
        {/* News Middle Panel */}
        <div className="flex-1 flex flex-col">
          <NewsMiddlePanel />
        </div>
      </div>
    </NewsProvider>
  );
}
