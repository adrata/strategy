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

  // 🏆 APPLY STRATEGIC RANKING: Apply the same ranking logic as PipelineView
  const allData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    try {
      // Import and apply the UniversalRankingEngine
      const { UniversalRankingEngine } = require('@/products/speedrun/UniversalRankingEngine');
      
      // Transform data to SpeedrunPerson format for ranking
      const transformedData = rawData.map((item: any) => ({
        id: item.id || `speedrun-${Math.random()}`,
        name: item.name || item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
        email: item.email || '',
        company: item.company?.name || item.company || item.companyName || '-',
        title: item.title || item.jobTitle || '-',
        phone: item.phone || item.phoneNumber || '',
        location: item.location || item.city || '',
        industry: item.industry || 'Technology',
        status: item.status || 'active',
        priority: item.priority || 'medium',
        lastContact: item.lastContact || item.updatedAt,
        notes: item.notes || '',
        tags: item.tags || [],
        source: item.source || 'speedrun',
        enrichmentScore: item.enrichmentScore || 0,
        buyerGroupRole: item.buyerGroupRole || 'unknown',
        currentStage: item.currentStage || 'initial',
        nextAction: item.nextAction || '',
        nextActionDate: item.nextActionDate || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        assignedUser: item.assignedUser || null,
        workspaceId: item.workspaceId || '',
        relationship: item.relationship || 'prospect',
        bio: item.bio || '',
        interests: item.interests || [],
        recentActivity: item.recentActivity || '',
        commission: item.commission || '50K',
        linkedin: item.linkedin || item.linkedinUrl || '',
        photo: item.photo || null,
        ...item // Include any additional fields
      }));
      
      // Apply strategic ranking
      const rankedData = UniversalRankingEngine.rankProspectsForWinning(
        transformedData,
        'workspace'
      );
      
      console.log('🏆 [SPEEDRUN SPRINT LEFT PANEL RANKING] Applied strategic ranking:', {
        originalCount: rawData.length,
        rankedCount: rankedData.length,
        sampleRanks: rankedData.slice(0, 5).map(p => ({
          name: p.name,
          company: p.company,
          rank: p.winningScore?.rank,
          totalScore: p.winningScore?.totalScore
        }))
      });
      
      return rankedData;
    } catch (error) {
      console.error('❌ [SPEEDRUN SPRINT LEFT PANEL RANKING] Failed to apply strategic ranking:', error);
      return rawData; // Fallback to original data
    }
  }, [rawData]);

  // Fixed sprint configuration: 3 sprints total, 10 people per sprint, 30 total people
  const SPRINT_SIZE = 10; // Fixed at 10 people per sprint
  const TOTAL_SPRINTS = 3; // Fixed at 3 sprints total
  const TOTAL_PEOPLE = 30; // Fixed at 30 total people in speedrun

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

    // Separate completed and active records
    const active = activeRecords.filter(record => !completedRecords.includes(record.id));
    const completed = activeRecords.filter(record => completedRecords.includes(record.id));
    
    // Return active records first, then completed records at the bottom
    return [...active, ...completed];
  }, [allData, completedRecords]);
  
  // 🏃‍♂️ SPRINT LOGIC: Show 10 total items per sprint with completed ones at bottom
  const data = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    // Separate active and completed records
    const activeRecords = filteredData.filter(record => !completedRecords.includes(record.id));
    const completedRecordsInSprint = filteredData.filter(record => completedRecords.includes(record.id));
    
    // Calculate sprint boundaries based on strategic rank, not array position
    const sprintStartIndex = currentSprintIndex * SPRINT_SIZE;
    const sprintEndIndex = (currentSprintIndex + 1) * SPRINT_SIZE;
    
    // Get active records for this sprint based on their strategic rank
    // Sort active records by their rank to ensure proper order
    const sortedActiveRecords = activeRecords.sort((a, b) => {
      const rankA = a.rank || 999999;
      const rankB = b.rank || 999999;
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
  }, [filteredData, currentSprintIndex, completedRecords]);
  
  const totalSprints = TOTAL_SPRINTS; // Fixed at 3 sprints
  const hasNextSprint = currentSprintIndex < totalSprints - 1;
  const currentSprintNumber = currentSprintIndex + 1;

  return (
    <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] h-full flex flex-col bg-[var(--background)] border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-[var(--background)]">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Sprint {currentSprintNumber}</h2>
            </div>
            <span className="text-xs font-medium text-[var(--muted)] bg-[var(--hover)] px-2 py-1 rounded-full">{completedRecords.length}/{SPRINT_SIZE}</span>
          </div>
          <div className="text-xs text-[var(--muted)]">
            {currentSprintNumber} of {totalSprints} sprints • {TOTAL_PEOPLE} total people in speedrun
          </div>
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {/* Loading indicator for data refresh */}
        {(loading || dataLoading) && data.length > 0 && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <div className="w-3 h-3 border-2 border-[var(--border)] border-t-blue-500 rounded-full animate-spin"></div>
              <span>Updating sprint data...</span>
            </div>
          </div>
        )}
        
        {data.map((record: any, index: number) => {
          const isSelected = selectedRecord?.id === record.id;
          const isCompleted = completedRecords.includes(record.id);
          const displayName = record.fullName || 
                             (record['firstName'] && record.lastName ? `${record.firstName} ${record.lastName}` : '') ||
                             record.name || 
                             'Unknown';
          
          // Calculate the correct display number based on strategic rank
          const actualRank = record.rank || 999999;
          const displayNumber = isCompleted ? '✓' : actualRank;
          
          return (
            <div
              key={record.id || index}
              onClick={() => onRecordSelect(record)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                isCompleted
                  ? 'bg-[var(--panel-background)] text-[var(--muted)] border-[var(--border)] opacity-60'
                  : isSelected 
                    ? 'bg-[var(--hover)] text-[var(--foreground)] border-[var(--border)] shadow-sm' 
                    : 'bg-[var(--background)] hover:bg-[var(--panel-background)] border-gray-100 hover:border-[var(--border)] hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-2xl ${
                      isCompleted
                        ? 'bg-green-100 text-green-800'
                        : isSelected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-[var(--hover)] text-[var(--muted)]'
                    }`}>
                      {displayNumber}
                    </span>
                    <h3 className={`text-sm font-semibold truncate ${
                      isCompleted 
                        ? 'text-[var(--muted)]' 
                        : isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'
                    }`}>
                      {displayName}
                    </h3>
                    {isCompleted && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        SUCCESS
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mb-1 ${
                    isCompleted 
                      ? 'text-[var(--muted)]' 
                      : isSelected ? 'text-[var(--muted)]' : 'text-[var(--muted)]'
                  }`}>
                    {record.title || record.jobTitle || 'No Title'}
                  </p>
                  <p className={`text-xs truncate ${
                    isCompleted 
                      ? 'text-[var(--muted)]' 
                      : isSelected ? 'text-[var(--muted)]' : 'text-[var(--muted)]'
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
