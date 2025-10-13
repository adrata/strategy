"use client";

/**
 * 🚀 SPEEDRUN SPRINT VIEW
 * 
 * Sprint view that shows:
 * - Left panel: Card list of speedrun records
 * - Middle panel: Individual record details
 * - Right panel: AI chat
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { useUnifiedAuth } from '@/platform/auth';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { useZoom } from '@/platform/ui/components/ZoomProvider';
import { UniversalRecordTemplate } from './UniversalRecordTemplate';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { CompleteActionModal, ActionLogData } from '@/products/speedrun/components/CompleteActionModal';
import { AddActionModal } from '@/platform/ui/components/AddActionModal';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { useSprint } from './SprintContext';

export function SpeedrunSprintView() {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  const { ui } = useAcquisitionOS();
  const { selectedRecord, setSelectedRecord, currentSprintIndex, setCurrentSprintIndex, completedRecords, setCompletedRecords } = useSprint();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [snoozedRecords, setSnoozedRecords] = useState<string[]>([]);

  // Get workspace info
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;
  
  // 🚀 PERFORMANCE: Use fast section data loading system with aggressive caching
  const fastSectionData = useFastSectionData('speedrun', 1000); // Load up to 1000 records
  
  const rawData = fastSectionData.data || [];
  const loading = fastSectionData.loading || false;
  const error = fastSectionData.error || null;
  const refresh = fastSectionData.refresh || (() => {});

  // 🏆 USE DATABASE RANKING: Keep the same order as speedrun table (database globalRank)
  const allData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Use raw data directly to maintain database ranking order
    // This ensures sprint view shows the same people in the same order as the speedrun table
    console.log('🏆 [SPEEDRUN SPRINT] Using database ranking order (same as speedrun table):', {
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
  
  // 🚀 PERFORMANCE: Pre-load speedrun data on component mount
  useEffect(() => {
    if (workspaceId && userId && !loading && !allData.length) {
      console.log('🚀 [SPEEDRUN] Pre-loading speedrun data for faster initial load');
      refresh();
    }
  }, [workspaceId, userId, loading, allData.length, refresh]);

  // Fixed sprint configuration: 5 sprints total, 10 people per sprint, 50 total people
  const SPRINT_SIZE = 10; // Fixed at 10 people per sprint
  const TOTAL_SPRINTS = 5; // Fixed at 5 sprints total
  const TOTAL_PEOPLE = 50; // Fixed at 50 total people in speedrun
  

  
  // Load completed records from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompleted = JSON.parse(localStorage.getItem('speedrunCompletedRecords') || '[]');
      setCompletedRecords(storedCompleted);
    }
  }, []);

  // Clean up expired snoozes on mount and when allData changes
  useEffect(() => {
    if (typeof window !== 'undefined' && allData) {
      const snoozedRecords = JSON.parse(localStorage.getItem('snoozedRecords') || '[]');
      const now = new Date();
      
      // Filter out expired snoozes
      const activeSnoozed = snoozedRecords.filter((snooze: any) => {
        const snoozeUntil = new Date(snooze.snoozeUntil);
        return now < snoozeUntil;
      });
      
      // Update localStorage if there were expired snoozes
      if (activeSnoozed.length !== snoozedRecords.length) {
        localStorage.setItem('snoozedRecords', JSON.stringify(activeSnoozed));
      }
    }
  }, [allData]);
  
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
    
    // Debug: Log completed records found
    if (completedRecords.length > 0) {
      console.log('🔍 [FILTERED DATA] Completed records debug:', {
        completedRecordsIds: completedRecords,
        completedRecordsFound: completed.map(r => ({ id: r.id, name: r.name, rank: r.rank })),
        totalActiveRecords: active.length,
        totalCompletedRecords: completed.length
      });
    }
    
    // Return active records first, then completed records at the bottom
    return [...active, ...completed];
  }, [allData, completedRecords]);
  
  // Log fixed sprint configuration
  useEffect(() => {
    if (filteredData?.length) {
      console.log(`🏃‍♂️ Fixed Sprint Config: ${TOTAL_PEOPLE} total people → ${SPRINT_SIZE} per sprint, ${TOTAL_SPRINTS} sprints total`);
    }
  }, [filteredData?.length]);
  
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

  // Set Speedrun context for AI panel
  useEffect(() => {
    ui.setActiveSubApp('Speedrun');
  }, [ui]);

  // Listen for view changes and update browser title
  useEffect(() => {
    const handleViewChange = (event: CustomEvent) => {
      const { view } = event.detail;
      const viewLabels: Record<string, string> = {
        'sales_actions': 'Actions',
        'prospects': 'Targets',
        'time': 'Calendar',
        'insights': 'Insights'
      };
      const viewLabel = viewLabels[view] || view;
      document.title = `Sprint • ${viewLabel}`;
    };

    window.addEventListener('speedrun-view-change', handleViewChange as EventListener);
    return () => window.removeEventListener('speedrun-view-change', handleViewChange as EventListener);
  }, []);

  // Clear selected record when sprint changes
  useEffect(() => {
    setSelectedRecord(null);
  }, [currentSprintIndex]);

  // Auto-select first record if none selected (only when data changes, not when selectedRecord changes)
  useEffect(() => {
    if (data && data.length > 0 && !selectedRecord) {
      setSelectedRecord(data[0]);
    }
  }, [data]); // Remove selectedRecord from dependencies to prevent infinite loop

  // Generate slug for a record
  const generateRecordSlug = (record: any) => {
    const name = record.name || record.fullName || 'unknown';
    const cleanName = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `${cleanName}-${record.id}`;
  };

  // Navigate to individual record URL when record is selected
  const handleRecordSelect = (record: any) => {
    const slug = generateRecordSlug(record);
    const currentPath = window.location.pathname;
    const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
    
    if (workspaceMatch) {
      const workspaceSlug = workspaceMatch[1];
      router.push(`/${workspaceSlug}/speedrun/${slug}`);
    } else {
      router.push(`/speedrun/${slug}`);
    }
  };

  // Keyboard shortcuts for Command+Enter
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if any modal is already open - if so, don't interfere
      const hasOpenModal = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.fixed.inset-0') ||
                          document.querySelector('.z-50') ||
                          showCompleteModal ||
                          showAddActionModal;
      
      if (hasOpenModal) {
        return; // Let the modal handle its own keyboard shortcuts
      }
      
      // Command+Enter for completing as DONE
      if (
        (event.metaKey || event.ctrlKey) &&
        (event['key'] === "Enter" || event['keyCode'] === 13) &&
        selectedRecord
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log(`⌨️ Command+Enter pressed for ${selectedRecord.name || selectedRecord.fullName}`);
        
        // Show the complete action modal
        setShowCompleteModal(true);
        
        return false;
      }
      
      // Command+Shift+Enter for adding new action
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        (event['key'] === "Enter" || event['keyCode'] === 13)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log(`⌨️ Command+Shift+Enter pressed - opening Add Action modal`);
        
        // Show the add action modal
        setShowAddActionModal(true);
        
        return false;
      }
      
      // No action needed for other key combinations
      return;
    };

    // Add event listener with capture to ensure we get the event first
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [selectedRecord]);


  // Handle navigation between records
  const handleNavigateNext = () => {
    if (!data || !selectedRecord) return;
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    if (currentIndex < data.length - 1) {
      setSelectedRecord(data[currentIndex + 1]);
    }
  };

  const handleNavigatePrevious = () => {
    if (!data || !selectedRecord) return;
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    if (currentIndex > 0) {
      setSelectedRecord(data[currentIndex - 1]);
    }
  };

  // Handle snooze
  const handleSnooze = (recordId: string, duration: string) => {
    console.log(`🛌 Snoozed record ${recordId} for ${duration}`);
    
    // Refresh the data to reflect the snoozed record removal
    refresh();
    
    // Move to next record or back if this was the last one
    const currentIndex = data.findIndex(r => r['id'] === recordId);
    const nextRecord = data[currentIndex + 1];
    
    if (nextRecord) {
      setSelectedRecord(nextRecord);
    } else if (currentIndex > 0) {
      setSelectedRecord(data[currentIndex - 1]);
    } else {
      // No records left in current sprint, go back to speedrun list
      navigateToPipeline('speedrun');
    }
  };

  // Handle action log submission
  const handleActionLogSubmit = async (actionData: ActionLogData) => {
    if (!selectedRecord || !user) return;

    setIsSubmittingAction(true);
    
    try {
      // Save action log to backend using v1 API
      const response = await fetch('/api/v1/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: actionData.type,
          subject: `${actionData.type} - ${selectedRecord.fullName || selectedRecord.name || 'Unknown'}`,
          description: actionData.action, // Use action field for description
          outcome: actionData.nextAction,
          scheduledAt: actionData.nextActionDate,
          completedAt: new Date().toISOString(),
          status: 'COMPLETED',
          priority: 'NORMAL',
          personId: selectedRecord.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save action log');
      }

      const result = await response.json();
      console.log(`✅ Action log saved for ${selectedRecord.name || selectedRecord.fullName}:`, result);

      // Mark the current record as completed
      const newCompletedRecords = [...completedRecords, selectedRecord.id];
      setCompletedRecords(newCompletedRecords);
      
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('speedrunCompletedRecords', JSON.stringify(newCompletedRecords));
      }
      
      // Move to next record
      const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
      const nextRecord = data[currentIndex + 1];
      if (nextRecord) {
        setSelectedRecord(nextRecord);
      } else if (hasNextSprint) {
        // Current sprint done, move to next sprint
        setCurrentSprintIndex(currentSprintIndex + 1);
      } else {
        // All sprints done, go back to speedrun list
        navigateToPipeline('speedrun');
      }

      // Close modal
      setShowCompleteModal(false);
      
    } catch (error) {
      console.error('❌ Error saving action log:', error);
      alert(`Failed to save action log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle add action submission
  const handleAddAction = async (actionData: any) => {
    setIsSubmittingAction(true);
    try {
      console.log('🚀 [SPEEDRUN] Adding new action:', actionData);
      
      // Here you would typically make an API call to add the action
      // For now, we'll just log it and close the modal
      console.log('✅ [SPEEDRUN] Action added successfully');
      
      setShowAddActionModal(false);
    } catch (error) {
      console.error('❌ [SPEEDRUN] Failed to add action:', error);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle conditional rendering after all hooks are called
  // Enhanced loading state with better skeletons
  if (loading && (!data || data['length'] === 0)) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Middle Panel Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-[var(--loading-bg)] rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-4 w-48 bg-[var(--loading-bg)] rounded animate-pulse"></div>
        </div>
        
        {/* Middle Panel Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-48 bg-[var(--loading-bg)] rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-64 bg-[var(--loading-bg)] rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-10 w-32 bg-[var(--loading-bg)] rounded mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Error Loading Sprint
          </h3>
          <p className="text-[var(--muted)] mb-4">{error && typeof error === 'object' && 'message' in error ? (error as Error).message : String(error)}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data['length'] === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No Sprint Data
          </h3>
          <p className="text-[var(--muted)] mb-4">
            No speedrun records found. Add some prospects to your speedrun to get started.
          </p>
        </div>
      </div>
    );
  }


  // Sprint detail view for middle panel - using minimal UniversalRecordDetails
  const sprintDetailView = selectedRecord ? (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Loading overlay for action submission */}
      {isSubmittingAction && (
        <div className="absolute inset-0 bg-[var(--background)] bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-[var(--background)] rounded-lg shadow-lg px-6 py-4">
            <div className="w-5 h-5 border-2 border-[var(--border)] border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Saving action...</span>
          </div>
        </div>
      )}
      
      <UniversalRecordTemplate
        record={selectedRecord}
        recordType="speedrun"
        recordIndex={(() => {
          const index = data.findIndex(r => r['id'] === selectedRecord.id);
          const dbRank = selectedRecord?.rank || (index + 1);
          console.log('🔍 [SPRINT VIEW] RecordIndex calculation:', {
            selectedRecordId: selectedRecord.id,
            selectedRecordName: selectedRecord.name || selectedRecord.fullName,
            dataLength: data.length,
            foundIndex: index,
            dbRank: dbRank,
            usingDatabaseRank: !!selectedRecord?.rank,
            dataSample: data.slice(0, 3).map(r => ({ id: r.id, name: r.name || r.fullName, rank: r.rank })),
            // Debug navigation state
            canGoPrevious: index > 0,
            canGoNext: index < data.length - 1,
            hasNextSprint: hasNextSprint,
            currentSprintIndex: currentSprintIndex,
            totalSprints: totalSprints
          });
          return dbRank;
        })()}
        totalRecords={data.length}
        onBack={() => {
          // Go back to speedrun list
          navigateToPipeline('speedrun');
        }}
        onNavigatePrevious={() => {
          const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
          console.log('🔍 [SPRINT VIEW] Previous navigation:', {
            currentIndex,
            dataLength: data.length,
            canGoPrevious: currentIndex > 0,
            previousRecord: currentIndex > 0 ? data[currentIndex - 1] : null
          });
          if (currentIndex > 0) {
            const previousRecord = data[currentIndex - 1];
            handleRecordSelect(previousRecord);
          }
        }}
        onNavigateNext={() => {
          const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
          const nextRecord = data[currentIndex + 1];
          console.log('🔍 [SPRINT VIEW] Next navigation:', {
            currentIndex,
            dataLength: data.length,
            canGoNext: currentIndex < data.length - 1,
            nextRecord: nextRecord,
            hasNextSprint: hasNextSprint,
            currentSprintIndex: currentSprintIndex,
            totalSprints: totalSprints
          });
          if (nextRecord) {
            handleRecordSelect(nextRecord);
          } else if (hasNextSprint) {
            // Current sprint done, move to next sprint
            setCurrentSprintIndex(currentSprintIndex + 1);
          }
        }}
        onComplete={() => setShowCompleteModal(true)}
        onSnooze={handleSnooze}
      />
    </div>
  ) : (
    <div className="h-full flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-12 h-12 bg-[var(--hover)] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👆</span>
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Select a Prospect
        </h3>
        <p className="text-[var(--muted)]">
          Choose a prospect from the left panel to view their details.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {sprintDetailView}

      {/* Complete Action Modal */}
      <CompleteActionModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onSubmit={handleActionLogSubmit}
        personName={selectedRecord?.fullName || selectedRecord?.name || 'Unknown'}
        section="speedrun"
        isLoading={isSubmittingAction}
      />

      {/* Add Action Modal */}
      <AddActionModal
        isOpen={showAddActionModal}
        onClose={() => setShowAddActionModal(false)}
        onSubmit={handleAddAction}
        contextRecord={selectedRecord}
        isLoading={isSubmittingAction}
      />
    </>
  );
}
