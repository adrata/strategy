"use client";

import React from 'react';
import { NewsProvider } from './context/NewsContext';
import { NewsLeftPanel } from './components/NewsLeftPanel';
import { NewsMiddlePanel } from './components/NewsMiddlePanel';
import { RightPanel } from '@/platform/ui/components/chat/RightPanel';

export function NewsView() {
  return (
    <NewsProvider>
      <div className="flex h-full">
        {/* Left Panel */}
        <NewsLeftPanel />
        
        {/* Middle Panel */}
        <div className="flex-1 flex flex-col">
          <NewsMiddlePanel />
        </div>
        
        {/* Right Panel */}
        <div className="w-96 bg-[var(--background)] border-l border-[var(--border)] flex-shrink-0">
          <RightPanel />
        </div>
      </div>
    </NewsProvider>
  );
}
