"use client";

/**
 * 🧪 TEST PIPELINE VIEW
 * 
 * Minimal test component to debug why PipelineView isn't executing
 */

import React from 'react';
// Removed deleted PipelineDataStore - using unified data system

interface TestPipelineViewProps {
  section: string;
}

export function TestPipelineView({ section }: TestPipelineViewProps) {
  console.log(`🧪🧪🧪 [TEST VIEW] Component executing for section: ${section}`);
  console.log(`🧪🧪🧪 [TEST VIEW] Timestamp: ${new Date().toISOString()}`);
  
  // Use hardcoded IDs like the working components
  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
  const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
  
  console.log(`🧪🧪🧪 [TEST VIEW] About to call usePipelineData...`);
  
  // DISABLED: usePipelineData causing wrong data
  // const pipelineData = usePipelineData(section, workspaceId, userId);
  
  // Mock data for testing
  const pipelineData = {
    data: [],
    loading: false,
    error: null
  };
  
  console.log(`🧪🧪🧪 [TEST VIEW] Hook completed. Data:`, pipelineData);
  console.log(`🧪🧪🧪 [TEST VIEW] Data length: ${pipelineData.data?.length || 0}`);
  console.log(`🧪🧪🧪 [TEST VIEW] Loading: ${pipelineData.loading}`);
  
  return (
    <div className="h-full bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🧪 Test View: {section}</h1>
        <p className="text-lg">Data Length: {pipelineData.data?.length || 0}</p>
        <p className="text-lg">Loading: {pipelineData.loading ? 'Yes' : 'No'}</p>
        <p className="text-lg">Error: {pipelineData.error || 'None'}</p>
        
        {pipelineData.data?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">First 3 Records:</h3>
            <div className="text-sm text-left max-w-md mx-auto">
              {pipelineData.data.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="p-2 border-b">
                  {item.name || item.fullName || 'No name'} - {item.company || 'No company'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
