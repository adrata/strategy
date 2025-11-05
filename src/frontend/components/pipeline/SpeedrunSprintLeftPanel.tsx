"use client";

/**
 * 🚀 SPEEDRUN SPRINT LEFT PANEL
 * 
 * Left panel component for the sprint view that shows:
 * - Sprint header with progress
 * - List of sprint records (people) with selection
 * - Navigation between sprints
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { useUnifiedAuth } from '@/platform/auth';

// Helper to safely get company name from string or object
function getCompanyName(company: any): string {
  if (!company) return 'Unknown Company';
  if (typeof company === 'string') return company;
  if (typeof company === 'object') return company.name || 'Unknown Company';
  return 'Unknown Company';
}

interface SpeedrunSprintLeftPanelProps {
  selectedRecord: any;
  onRecordSelect: (record: any) => void;
  currentSprintIndex: number;
  onSprintChange: (index: number) => void;
  completedRecords: string[];
  loading?: boolean;
}

export function SpeedrunSprintLeftPanel({
  selectedRecord,
  onRecordSelect,
  currentSprintIndex,
  onSprintChange,
  completedRecords,
  loading = false
}: SpeedrunSprintLeftPanelProps) {
  const { user } = useUnifiedAuth();
  
  // Get workspace info
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;
  
  // 🚀 PERFORMANCE: Use fast section data loading system with aggressive caching
  const fastSectionData = useFastSectionData('speedrun', 1000); // Load up to 1000 records
  
  const rawData = fastSectionData.data || [];
  const dataLoading = fastSectionData.loading || false;
  const error = fastSectionData.error || null;

  // Fallback: Load completed records from localStorage on mount if prop is empty
  const [localCompletedRecords, setLocalCompletedRecords] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompleted = JSON.parse(localStorage.getItem('speedrunCompletedRecords') || '[]');
      if (storedCompleted.length > 0) {
        console.log('📦 [SPEEDRUN SPRINT LEFT PANEL] Loaded completed records from localStorage:', storedCompleted);
        setLocalCompletedRecords(storedCompleted);
      }
    }
  }, []);
  
  // Use completedRecords prop if available, otherwise fall back to localStorage
  const effectiveCompletedRecords = completedRecords.length > 0 ? completedRecords : localCompletedRecords;
  
  console.log('🔍 [SPEEDRUN SPRINT LEFT PANEL] Completed records state:', {
    propCompletedRecords: completedRecords,
    localCompletedRecords: localCompletedRecords,
    effectiveCompletedRecords: effectiveCompletedRecords,
    propLength: completedRecords.length,
    localLength: localCompletedRecords.length,
    effectiveLength: effectiveCompletedRecords.length
  });

  // 🏆 USE DATABASE RANKING: Keep the same order as speedrun table (database globalRank)
  const allData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Use raw data directly to maintain database ranking order
    // This ensures sprint view shows the same people in the same order as the speedrun table
    console.log('🏆 [SPEEDRUN SPRINT LEFT PANEL] Using database ranking order (same as speedrun table):', {
      originalCount: rawData.length,
      sampleData: rawData.slice(0, 5).map(p => ({
        name: p.name || p.fullName,
        company: p.company?.name || p.company,
        rank: p.rank,
        globalRank: p.globalRank
      }))
    });
    
    return rawData;
  }, [rawData]);

  // Fixed sprint configuration: 5 sprints total, 10 people per sprint, 50 total people
  const SPRINT_SIZE = 10; // Fixed at 10 people per sprint
  const TOTAL_SPRINTS = 5; // Fixed at 5 sprints total
  const TOTAL_PEOPLE = 50; // Fixed at 50 total people in speedrun

  // Filter out snoozed records and organize completed records (without modifying localStorage in render)
  const filteredData = useMemo(() => {
    if (!allData || typeof window === 'undefined') return allData || [];
    
    const snoozedRecords = JSON.parse(localStorage.getItem('snoozedRecords') || '[]');
    const now = new Date();
    
    // First filter out snoozed records
    const activeRecords = allData.filter(record => {
      const snoozedRecord = snoozedRecords.find((snooze: any) => snooze['recordId'] === record.id);
      
      if (snoozedRecord) {
        const snoozeUntil = new Date(snoozedRecord.snoozeUntil);
        // Only exclude if still snoozed
        return now >= snoozeUntil;
      }
      
      return true;
    });

    // Separate completed and active records using effectiveCompletedRecords
    const active = activeRecords.filter(record => !effectiveCompletedRecords.includes(record.id));
    const completed = activeRecords.filter(record => effectiveCompletedRecords.includes(record.id));
    
    // Return active records first, then completed records at the bottom
    return [...active, ...completed];
  }, [allData, effectiveCompletedRecords]);
  
  // 🏃‍♂️ SPRINT LOGIC: Show 10 total items per sprint with completed ones at bottom
  const data = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    // Calculate sprint boundaries based on strategic rank (1-indexed rank system)
    // Sprint 1 (index 0): ranks 1-10, Sprint 2 (index 1): ranks 11-20, etc.
    const sprintStartRank = currentSprintIndex * SPRINT_SIZE + 1;
    const sprintEndRank = (currentSprintIndex + 1) * SPRINT_SIZE;
    
    // Separate active and completed records using effectiveCompletedRecords
    const activeRecords = filteredData.filter(record => !effectiveCompletedRecords.includes(record.id));
    
    // Filter completed records to only include those in the current sprint based on rank
    const allCompletedRecords = filteredData.filter(record => effectiveCompletedRecords.includes(record.id));
    const sortedCompletedRecords = allCompletedRecords.sort((a, b) => {
      const rankA = a.globalRank || a.rank || 999999;
      const rankB = b.globalRank || b.rank || 999999;
      return rankA - rankB;
    });
    
    // Only include completed records whose rank falls within current sprint boundaries
    const completedRecordsInSprint = sortedCompletedRecords.filter((record: any) => {
      const rank = record.globalRank || record.rank || 999999;
      return rank >= sprintStartRank && rank <= sprintEndRank;
    });
    
    // Calculate array-based sprint boundaries for slicing active records
    const sprintStartIndex = currentSprintIndex * SPRINT_SIZE;
    const sprintEndIndex = (currentSprintIndex + 1) * SPRINT_SIZE;
    
    // Get active records for this sprint based on their strategic rank
    // Sort active records by their globalRank to ensure proper order
    const sortedActiveRecords = activeRecords.sort((a, b) => {
      const rankA = a.globalRank || a.rank || 999999;
      const rankB = b.globalRank || b.rank || 999999;
      return rankA - rankB;
    });
    
    const activeInSprint = sortedActiveRecords.slice(sprintStartIndex, sprintEndIndex);
    
    // Always show completed records at the bottom, but limit total to SPRINT_SIZE
    const maxActiveSlots = SPRINT_SIZE - completedRecordsInSprint.length;
    const finalActiveInSprint = activeInSprint.slice(0, Math.max(0, maxActiveSlots));
    const completedInSprint = completedRecordsInSprint;
    
    // Combine active first, then completed
    const sprintData = [...finalActiveInSprint, ...completedInSprint];
    
    console.log(`🏃‍♂️ [SPRINT ${currentSprintIndex + 1}] Sprint data:`, {
      sprintIndex: currentSprintIndex,
      activeInSprint: finalActiveInSprint.length,
      completedInSprint: completedInSprint.length,
      totalInSprint: sprintData.length,
      maxActiveSlots,
      activeRecords: finalActiveInSprint.map(r => ({ 
        name: r.name, 
        rank: r.rank,
        displayRank: r.rank
      })),
      completedRecords: completedInSprint.map(r => ({ 
        name: r.name, 
        rank: r.rank 
      }))
    });
    
    return sprintData;
  }, [filteredData, currentSprintIndex, effectiveCompletedRecords]);
  
  const totalSprints = Math.ceil(data.length / SPRINT_SIZE); // Calculate based on actual data
  const hasNextSprint = currentSprintIndex < totalSprints - 1;
  const currentSprintNumber = currentSprintIndex + 1;

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] h-full flex flex-col bg-background border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-background">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Sprint {currentSprintNumber}</h2>
            </div>
            <span className="text-xs font-medium text-muted bg-hover px-2 py-1 rounded-full">{effectiveCompletedRecords.length}/{SPRINT_SIZE}</span>
          </div>
          <div className="text-xs text-muted">
            {currentSprintNumber} of {totalSprints} sprints • {data.length} total people in speedrun
          </div>
          <div className="text-xs text-blue-600 font-medium">
            Batch {Math.floor(effectiveCompletedRecords.length / 50) + 1} • {effectiveCompletedRecords.length} completed today
          </div>
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {/* Loading indicator for data refresh */}
        {(loading || dataLoading) && data.length > 0 && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <div className="w-3 h-3 border-2 border-border border-t-blue-500 rounded-full animate-spin"></div>
              <span>Updating sprint data...</span>
            </div>
          </div>
        )}
        
        {data.map((record: any, index: number) => {
          const isSelected = selectedRecord?.id === record.id;
          const isCompleted = effectiveCompletedRecords.includes(record.id);
          const displayName = record.fullName || 
                             (record['firstName'] && record.lastName ? `${record.firstName} ${record.lastName}` : '') ||
                             record.name || 
                             'Unknown';
          
          // Calculate the correct display number based on strategic rank
          // Use globalRank first, then rank, then calculate sequential position
          const actualRank = record.globalRank || record.rank;
          const displayNumber = isCompleted ? '✓' : (actualRank || (sprintStartIndex + index + 1));
          
          return (
            <div
              key={record.id || index}
              onClick={() => onRecordSelect(record)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border relative ${
                isCompleted
                  ? 'bg-green-100 text-foreground border-green-300 hover:bg-green-100'
                  : isSelected 
                    ? 'bg-hover text-foreground border-border shadow-sm' 
                    : 'bg-background hover:bg-panel-background border-gray-100 hover:border-border hover:shadow-sm'
              }`}
            >
              {/* Completion indicator - removed overlay for cleaner look, green background is enough */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-2xl ${
                      isCompleted
                        ? 'bg-green-100 text-green-800'
                        : isSelected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-hover text-muted'
                    }`}>
                      {displayNumber}
                    </span>
                    <h3 className={`text-sm font-semibold truncate ${
                      isCompleted 
                        ? 'text-green-900' 
                        : isSelected ? 'text-foreground' : 'text-foreground'
                    }`}>
                      {displayName}
                    </h3>
                  </div>
                  <p className={`text-xs truncate mb-1 ${
                    isCompleted 
                      ? 'text-green-800' 
                      : isSelected ? 'text-muted' : 'text-muted'
                  }`}>
                    {record.title || record.jobTitle || 'No Title'}
                  </p>
                  <p className={`text-xs truncate ${
                    isCompleted 
                      ? 'text-green-700' 
                      : isSelected ? 'text-muted' : 'text-muted'
                  }`}>
                    {getCompanyName(record.company)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
