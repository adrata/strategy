"use client";

/**
 * 🧪 MINIMAL TEST PIPELINE VIEW
 * 
 * Absolutely minimal component to test if the issue is with PipelineView itself
 */

import React from 'react';

interface MinimalTestPipelineViewProps {
  section: string;
}

export function MinimalTestPipelineView({ section }: MinimalTestPipelineViewProps) {
  console.log(`🧪🧪🧪 [MINIMAL TEST] Component executing for section: ${section}`);
  console.log(`🧪🧪🧪 [MINIMAL TEST] Timestamp: ${new Date().toISOString()}`);
  
  return (
    <div className="h-full bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">MINIMAL TEST - {section.toUpperCase()}</h1>
      <p className="text-lg">This is a minimal test component.</p>
      <p className="text-sm text-muted">If you see this, the component is executing properly.</p>
    </div>
  );
}
