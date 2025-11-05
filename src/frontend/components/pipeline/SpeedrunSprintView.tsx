"use client";

/**
 * 🚀 SPEEDRUN SPRINT VIEW
 * 
 * Sprint view that shows:
 * - Left panel: Card list of speedrun records
 * - Middle panel: Individual record details
 * - Right panel: AI chat
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { useUnifiedAuth } from '@/platform/auth';
import { authFetch } from '@/platform/api-fetch';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { useZoom } from '@/platform/ui/components/ZoomProvider';
import { UniversalRecordTemplate } from './UniversalRecordTemplate';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { useSprint } from './SprintContext';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { SprintCompletionModal } from './SprintCompletionModal';

export function SpeedrunSprintView() {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const { selectedRecord, setSelectedRecord, currentSprintIndex, setCurrentSprintIndex, completedRecords, setCompletedRecords } = useSprint();
  
  // Pipeline context for user data
  const { 
    user: pipelineUser, 
    company, 
    workspace
  } = usePipeline();
  
  // ProfilePopupContext for profile popup functionality
  const { 
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor,
    profilePopupRef
  } = useProfilePopup();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [snoozedRecords, setSnoozedRecords] = useState<string[]>([]);
  const [showSprintCompletionModal, setShowSprintCompletionModal] = useState(false);
  const sprintCompletionModalShownFor = React.useRef<number | null>(null);

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
    // Ensure rawData is an array
    if (!Array.isArray(rawData) || rawData.length === 0) return [];
    
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

  // Track optimistic updates to preserve linkedinNavigatorUrl during refreshes
  const optimisticUpdatesRef = React.useRef<Map<string, any>>(new Map());
  const [optimisticUpdateVersion, setOptimisticUpdateVersion] = React.useState(0);

  // Apply optimistic updates to rawData
  const enrichedData = React.useMemo(() => {
    // Ensure allData is an array
    if (!Array.isArray(allData) || allData.length === 0) return [];
    
    return allData.map((record: any) => {
      const optimisticUpdate = optimisticUpdatesRef.current.get(record.id);
      if (optimisticUpdate) {
        // Merge optimistic update, preserving linkedinNavigatorUrl even if null
        const merged = { ...record, ...optimisticUpdate };
        // Explicitly preserve linkedinNavigatorUrl if it exists in optimistic update
        if (optimisticUpdate.linkedinNavigatorUrl !== undefined) {
          merged.linkedinNavigatorUrl = optimisticUpdate.linkedinNavigatorUrl;
        }
        return merged;
      }
      return record;
    });
  }, [allData, optimisticUpdateVersion]); // Include optimisticUpdateVersion to trigger recompute
  
  // 🚀 PERFORMANCE: Pre-load speedrun data on component mount
  useEffect(() => {
    if (workspaceId && userId && !loading && !allData.length) {
      console.log('🚀 [SPEEDRUN] Pre-loading speedrun data for faster initial load');
      refresh();
    }
  }, [workspaceId, userId, loading, allData.length, refresh]);

  // Dynamic sprint configuration based on actual data
  const SPRINT_SIZE = 10; // Fixed at 10 people per sprint
  const TOTAL_PEOPLE = allData.length; // Use actual data length
  const TOTAL_SPRINTS = Math.ceil(TOTAL_PEOPLE / SPRINT_SIZE); // Calculate based on actual data
  

  
  // Load completed records from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCompleted = JSON.parse(localStorage.getItem('speedrunCompletedRecords') || '[]');
        // Ensure it's an array
        if (Array.isArray(storedCompleted)) {
          setCompletedRecords(storedCompleted);
        } else {
          setCompletedRecords([]);
        }
      } catch (error) {
        console.error('Error loading completed records from localStorage:', error);
        setCompletedRecords([]);
      }
    }
  }, []);

  // Listen for speedrun action completion events to update completed records
  useEffect(() => {
    const handleSpeedrunActionLogged = (event: CustomEvent) => {
      const { currentRecord } = event.detail || {};
      
      console.log('🎯 [SPEEDRUN SPRINT VIEW] speedrunActionLogged event received:', {
        eventType: event.type,
        eventDetail: event.detail,
        currentRecordId: currentRecord?.id,
        currentRecordName: currentRecord?.name || currentRecord?.fullName,
        hasCurrentRecord: !!currentRecord,
        currentCompletedRecords: completedRecords,
        currentRecordInCompleted: currentRecord?.id ? (Array.isArray(completedRecords) && completedRecords.includes(currentRecord.id)) : false
      });
      
      if (!currentRecord?.id) {
        console.warn('⚠️ [SPEEDRUN SPRINT VIEW] Event received but currentRecord.id is missing:', event.detail);
        return;
      }

      console.log('🎯 [SPEEDRUN SPRINT VIEW] Action logged for:', currentRecord.name || currentRecord.fullName);

      // Add to completed records if not already there
      setCompletedRecords((prev: string[]) => {
        // Ensure prev is an array
        const safePrev = Array.isArray(prev) ? prev : [];
        
        console.log('🔄 [SPEEDRUN SPRINT VIEW] Updating completedRecords state:', {
          previousCompletedRecords: safePrev,
          recordIdToAdd: currentRecord.id,
          recordName: currentRecord.name || currentRecord.fullName,
          alreadyCompleted: safePrev.includes(currentRecord.id)
        });
        
        if (safePrev.includes(currentRecord.id)) {
          console.log('✅ [SPEEDRUN SPRINT VIEW] Record already in completed list');
          return safePrev;
        }
        
        const updated = [...safePrev, currentRecord.id];
        
        // Save to localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('speedrunCompletedRecords', JSON.stringify(updated));
          console.log('💾 [SPEEDRUN SPRINT VIEW] Saved completed records to localStorage:', updated);
        }
        
        console.log('✅ [SPEEDRUN SPRINT VIEW] Added record to completed list:', {
          recordId: currentRecord.id,
          recordName: currentRecord.name || currentRecord.fullName,
          totalCompleted: updated.length,
          updatedList: updated
        });
        
        return updated;
      });

      // Refresh data to ensure UI updates, but preserve completedRecords
      console.log('🔄 [SPEEDRUN SPRINT VIEW] Calling refresh() to update data');
      refresh();
    };

    console.log('👂 [SPEEDRUN SPRINT VIEW] Attaching speedrunActionLogged event listener');
    document.addEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    
    return () => {
      console.log('🧹 [SPEEDRUN SPRINT VIEW] Removing speedrunActionLogged event listener');
      document.removeEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    };
  }, [refresh, setCompletedRecords, completedRecords]);

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
    // Use enrichedData instead of allData to include optimistic updates
    const dataSource = enrichedData.length > 0 ? enrichedData : (allData || []);
    
    // Ensure dataSource is an array
    if (!Array.isArray(dataSource) || typeof window === 'undefined') return [];
    
    let snoozedRecords: any[] = [];
    try {
      snoozedRecords = JSON.parse(localStorage.getItem('snoozedRecords') || '[]');
      if (!Array.isArray(snoozedRecords)) snoozedRecords = [];
    } catch (error) {
      console.error('Error parsing snoozedRecords from localStorage:', error);
      snoozedRecords = [];
    }
    
    const now = new Date();
    
    // Ensure completedRecords is an array
    const safeCompletedRecords = Array.isArray(completedRecords) ? completedRecords : [];
    
    // First filter out snoozed records
    const activeRecords = dataSource.filter((record: any) => {
      const snoozedRecord = snoozedRecords.find((snooze: any) => snooze['recordId'] === record.id);
      
      if (snoozedRecord) {
        const snoozeUntil = new Date(snoozedRecord.snoozeUntil);
        // Only exclude if still snoozed
        return now >= snoozeUntil;
      }
      
      return true;
    });

    // Separate completed and active records
    const active = activeRecords.filter((record: any) => !safeCompletedRecords.includes(record.id));
    const completed = activeRecords.filter((record: any) => safeCompletedRecords.includes(record.id));
    
    // Debug: Log completed records found
    if (safeCompletedRecords.length > 0) {
      console.log('🔍 [FILTERED DATA] Completed records debug:', {
        completedRecordsIds: safeCompletedRecords,
        completedRecordsFound: completed.map((r: any) => ({ id: r.id, name: r.name, rank: r.rank })),
        totalActiveRecords: active.length,
        totalCompletedRecords: completed.length
      });
    }
    
    // Return active records first, then completed records at the bottom
    return [...active, ...completed];
  }, [enrichedData, allData, completedRecords]);
  
  // Log fixed sprint configuration
  useEffect(() => {
    if (filteredData?.length) {
      console.log(`🏃‍♂️ Fixed Sprint Config: ${TOTAL_PEOPLE} total people → ${SPRINT_SIZE} per sprint, ${TOTAL_SPRINTS} sprints total`);
    }
  }, [filteredData?.length]);
  
  // 🏃‍♂️ SPRINT LOGIC: Show 10 total items per sprint with completed ones at bottom
  const data = React.useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return [];
    
    // Ensure completedRecords is an array
    const safeCompletedRecords = Array.isArray(completedRecords) ? completedRecords : [];
    
    // Calculate sprint boundaries based on strategic rank (1-indexed rank system)
    // Sprint 1 (index 0): ranks 1-10, Sprint 2 (index 1): ranks 11-20, etc.
    const sprintStartRank = currentSprintIndex * SPRINT_SIZE + 1;
    const sprintEndRank = (currentSprintIndex + 1) * SPRINT_SIZE;
    
    // Separate active and completed records
    const activeRecords = filteredData.filter((record: any) => !safeCompletedRecords.includes(record.id));
    
    // Filter completed records to only include those in the current sprint based on rank
    const allCompletedRecords = filteredData.filter((record: any) => safeCompletedRecords.includes(record.id));
    const sortedCompletedRecords = allCompletedRecords.sort((a: any, b: any) => {
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
    const sortedActiveRecords = activeRecords.sort((a: any, b: any) => {
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
      activeRecords: finalActiveInSprint.map((r: any) => ({ 
        name: r.name, 
        rank: r.rank,
        displayRank: r.rank
      })),
      completedRecords: completedInSprint.map((r: any) => ({ 
        name: r.name, 
        rank: r.rank 
      }))
    });
    
    return sprintData;
  }, [filteredData, currentSprintIndex, completedRecords]);
  
  const totalSprints = TOTAL_SPRINTS; // Fixed at 3 sprints
  const hasNextSprint = currentSprintIndex < totalSprints - 1;
  const currentSprintNumber = currentSprintIndex + 1;

  // Calculate which records belong to the current sprint based on rank
  // Use allData (not filteredData) to ensure we check ALL records that should be in the sprint
  // regardless of snooze status - we want to know when all 10 are truly completed
  const currentSprintRecords = React.useMemo(() => {
    // Ensure allData is an array
    if (!Array.isArray(allData) || allData.length === 0) return [];
    
    const sprintStartIndex = currentSprintIndex * SPRINT_SIZE;
    const sprintEndIndex = (currentSprintIndex + 1) * SPRINT_SIZE;
    
    // Get all records that should be in this sprint based on their rank
    // Use allData to include all records, not just filtered ones
    const sortedRecords = [...allData].sort((a: any, b: any) => {
      const rankA = a.globalRank || a.rank || 999999;
      const rankB = b.globalRank || b.rank || 999999;
      return rankA - rankB;
    });
    
    const sprintRecords = sortedRecords.slice(sprintStartIndex, sprintEndIndex);
    
    console.log(`🏃‍♂️ [SPRINT ${currentSprintIndex + 1}] Records in sprint:`, {
      sprintIndex: currentSprintIndex,
      sprintStartIndex,
      sprintEndIndex,
      totalRecords: sprintRecords.length,
      expectedCount: SPRINT_SIZE,
      recordIds: sprintRecords.map((r: any) => r.id),
      recordNames: sprintRecords.map((r: any) => r.name || r.fullName)
    });
    
    return sprintRecords;
  }, [allData, currentSprintIndex]);

  // Check if all records in the current sprint are completed
  const isSprintComplete = React.useMemo(() => {
    if (!Array.isArray(currentSprintRecords) || currentSprintRecords.length === 0) return false;
    if (!Array.isArray(completedRecords)) return false;
    
    const allCompleted = currentSprintRecords.every((record: any) => completedRecords.includes(record.id));
    
    // Calculate actual completed count for this sprint
    const completedCount = currentSprintRecords.filter((record: any) => completedRecords.includes(record.id)).length;
    
    // Log sprint completion status for debugging
    console.log(`🏃‍♂️ [SPRINT ${currentSprintNumber}] Completion check:`, {
      totalInSprint: currentSprintRecords.length,
      completedCount,
      allCompleted,
      sprintSize: SPRINT_SIZE
    });
    
    return allCompleted;
  }, [currentSprintRecords, completedRecords, currentSprintNumber]);

  // Calculate actual completed count for current sprint (for modal display)
  const currentSprintCompletedCount = React.useMemo(() => {
    if (!Array.isArray(currentSprintRecords) || !Array.isArray(completedRecords)) return 0;
    return currentSprintRecords.filter((record: any) => completedRecords.includes(record.id)).length;
  }, [currentSprintRecords, completedRecords]);

  // Watch for sprint completion and show modal
  useEffect(() => {
    if (isSprintComplete && hasNextSprint && !showSprintCompletionModal && sprintCompletionModalShownFor.current !== currentSprintIndex) {
      console.log(`🎉 Sprint ${currentSprintNumber} complete! Showing completion modal`);
      sprintCompletionModalShownFor.current = currentSprintIndex;
      setShowSprintCompletionModal(true);
    }
  }, [isSprintComplete, hasNextSprint, currentSprintNumber, showSprintCompletionModal, currentSprintIndex]);

  // Reset the modal shown flag when sprint changes
  useEffect(() => {
    if (sprintCompletionModalShownFor.current !== currentSprintIndex) {
      sprintCompletionModalShownFor.current = null;
    }
  }, [currentSprintIndex]);

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

  // Auto-select first record when data loads and no record is selected
  useEffect(() => {
    // Only auto-select if:
    // 1. Data is available
    // 2. No record is currently selected
    // 3. We're not in a loading state
    if (data && data.length > 0 && !selectedRecord && !loading) {
      // Ensure completedRecords is an array
      const safeCompletedRecords = Array.isArray(completedRecords) ? completedRecords : [];
      
      // Prefer first non-completed record, otherwise first record overall
      const firstNonCompleted = data.find((record: any) => !safeCompletedRecords.includes(record.id));
      const recordToSelect = firstNonCompleted || data[0];
      
      if (recordToSelect) {
        console.log('🚀 [SPEEDRUN SPRINT] Auto-selecting first record:', {
          recordId: recordToSelect.id,
          recordName: recordToSelect.name || recordToSelect.fullName,
          isNonCompleted: !safeCompletedRecords.includes(recordToSelect.id),
          totalRecords: data.length,
          completedCount: safeCompletedRecords.length
        });
        setSelectedRecord(recordToSelect);
      }
    }
  }, [data, selectedRecord, loading, completedRecords, setSelectedRecord]);

  // Sync selectedRecord with data array when data changes, preserving linkedinNavigatorUrl and notes
  useEffect(() => {
    if (!selectedRecord || !data || data.length === 0) return;
    
    const matchingRecord = data.find((r: any) => r.id === selectedRecord.id);
    if (matchingRecord && matchingRecord !== selectedRecord) {
      // Merge preserving linkedinNavigatorUrl and notes from selectedRecord if new record doesn't have them
      // Helper function to check if notes have content (handles both string and object formats)
      const hasNotesContent = (notes: any): boolean => {
        if (!notes) return false;
        if (typeof notes === 'string') {
          return notes.trim().length > 0;
        }
        if (typeof notes === 'object' && notes !== null) {
          const content = notes.content || notes.text || '';
          return content.trim().length > 0;
        }
        return false;
      };
      
      const matchingHasNotes = hasNotesContent(matchingRecord.notes);
      const selectedHasNotes = hasNotesContent(selectedRecord.notes);
      
      const mergedRecord = {
        ...matchingRecord,
        // Preserve linkedinNavigatorUrl from selectedRecord if it exists and new record doesn't have it
        linkedinNavigatorUrl: matchingRecord.linkedinNavigatorUrl ?? selectedRecord.linkedinNavigatorUrl ?? null,
        // CRITICAL: Preserve notes from selectedRecord if new record's notes are empty/null/undefined
        // This prevents notes from disappearing when data array refreshes after a save
        // Preserve the original format (string or object) from selectedRecord if matchingRecord doesn't have notes
        notes: matchingHasNotes ? matchingRecord.notes : (selectedHasNotes ? selectedRecord.notes : null)
      };
      
      // Only update if something actually changed (avoid infinite loops)
      if (JSON.stringify(mergedRecord) !== JSON.stringify(selectedRecord)) {
        console.log('🔄 [SPEEDRUN SPRINT] Syncing selectedRecord with data array:', {
          recordId: selectedRecord.id,
          preservedLinkedinNavigatorUrl: mergedRecord.linkedinNavigatorUrl,
          dataArrayLinkedinNavigatorUrl: matchingRecord.linkedinNavigatorUrl,
          selectedRecordLinkedinNavigatorUrl: selectedRecord.linkedinNavigatorUrl,
          preservedNotes: mergedRecord.notes,
          dataArrayNotes: matchingRecord.notes,
          selectedRecordNotes: selectedRecord.notes,
          matchingHasNotes,
          selectedHasNotes,
          usingSelectedNotes: !matchingHasNotes && selectedHasNotes
        });
        setSelectedRecord(mergedRecord);
      }
    }
  }, [data, selectedRecord?.id]); // Only depend on data and selectedRecord.id, not the whole selectedRecord object

  // Generate slug for a record
  const generateRecordSlug = (record: any) => {
    const name = record.name || record.fullName || 'unknown';
    const cleanName = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `${cleanName}-${record.id}`;
  };

  // Select record in sprint view (no URL navigation - stay on sprint page)
  const handleRecordSelect = (record: any) => {
    console.log(`🏃‍♂️ [SPRINT] Selecting record: ${record.name || record.fullName} (ID: ${record.id})`);
    setSelectedRecord(record);
  };

  // Handle navigation between records
  const handleNavigateNext = useCallback(() => {
    if (!data || !selectedRecord) return;
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    if (currentIndex < data.length - 1) {
      setSelectedRecord(data[currentIndex + 1]);
    }
  }, [data, selectedRecord, setSelectedRecord]);

  const handleNavigatePrevious = useCallback(() => {
    if (!data || !selectedRecord) return;
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    if (currentIndex > 0) {
      setSelectedRecord(data[currentIndex - 1]);
    }
  }, [data, selectedRecord, setSelectedRecord]);

  // Keyboard shortcuts for Command+Enter and Tab navigation
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
      
      // Tab key for navigating between records
      if (event.key === "Tab" && selectedRecord && data && data.length > 0) {
        // Check if we're in an input field - if so, don't interfere with normal tab behavior
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox'
        );
        
        if (!isInputField) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          if (event.shiftKey) {
            // Shift+Tab: Navigate to previous record
            console.log(`⌨️ Shift+Tab pressed - navigating to previous record`);
            handleNavigatePrevious();
          } else {
            // Tab: Navigate to next record
            console.log(`⌨️ Tab pressed - navigating to next record`);
            handleNavigateNext();
          }
          
          return false;
        }
      }
      
      // Escape key to go back to speedrun list
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log(`⌨️ Escape pressed - going back to speedrun list`);
        navigateToPipeline('speedrun');
        return false;
      }
      
      // Command+Left Arrow (or Ctrl+Left Arrow) to go back to speedrun list
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log(`⌨️ Command+Left Arrow pressed - going back to speedrun list`);
        navigateToPipeline('speedrun');
        return false;
      }
      
      // No action needed for other key combinations
      return;
    };

    // Add event listener with capture to ensure we get the event first
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [selectedRecord, data, handleNavigateNext, handleNavigatePrevious]);

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
      // authFetch returns parsed JSON directly and throws errors for failed requests
      const result = await authFetch('/api/v1/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: actionData.type,
          subject: `${actionData.type} - ${selectedRecord.fullName || selectedRecord.name || 'Unknown'}`,
          description: actionData.action, // Use action field for description
          outcome: (actionData as any).nextAction || '',
          scheduledAt: (actionData as any).nextActionDate || null,
          completedAt: new Date().toISOString(),
          status: 'COMPLETED',
          priority: 'NORMAL',
          personId: selectedRecord.id,
          // Conditionally include companyId only if it exists and is valid (not empty string or undefined)
          ...(actionData.companyId && typeof actionData.companyId === 'string' && actionData.companyId.trim() !== '' && { companyId: actionData.companyId }),
        }),
      });

      console.log(`✅ Action log saved for ${selectedRecord.name || selectedRecord.fullName}:`, result);

      // Mark the current record as completed
      // Ensure completedRecords is an array before spreading
      const safeCompletedRecords = Array.isArray(completedRecords) ? completedRecords : [];
      const newCompletedRecords = [...safeCompletedRecords, selectedRecord.id];
      setCompletedRecords(newCompletedRecords);
      
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('speedrunCompletedRecords', JSON.stringify(newCompletedRecords));
      }
      
      // Close action completion modal first
      setShowCompleteModal(false);

      // Check if sprint is now complete with the updated completed records
      const updatedSprintRecords = (() => {
        if (!Array.isArray(filteredData) || filteredData.length === 0) return [];
        const sprintStartIndex = currentSprintIndex * SPRINT_SIZE;
        const sprintEndIndex = (currentSprintIndex + 1) * SPRINT_SIZE;
        const sortedRecords = [...filteredData].sort((a: any, b: any) => {
          const rankA = a.globalRank || a.rank || 999999;
          const rankB = b.globalRank || b.rank || 999999;
          return rankA - rankB;
        });
        return sortedRecords.slice(sprintStartIndex, sprintEndIndex);
      })();
      
      const allSprintRecordsCompleted = updatedSprintRecords.length > 0 && 
        updatedSprintRecords.every((record: any) => newCompletedRecords.includes(record.id));

      // If sprint is complete, the useEffect will show the modal - don't navigate yet
      if (allSprintRecordsCompleted && hasNextSprint) {
        // Don't navigate - the modal will handle it
        return;
      }

      // Move to next record normally
      const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
      const nextRecord = data[currentIndex + 1];
      if (nextRecord) {
        setSelectedRecord(nextRecord);
      } else {
        // No more records in current sprint
        // If sprint is complete, the modal will handle advancement
        // If all sprints are done, go back to speedrun list
        if (!hasNextSprint) {
          navigateToPipeline('speedrun');
        }
        // Otherwise, stay on current sprint - modal will handle next sprint when it appears
      }
      
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
      <div className="h-full flex flex-col bg-background">
        {/* Middle Panel Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-32 bg-loading-bg rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-loading-bg rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-loading-bg rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-4 w-48 bg-loading-bg rounded animate-pulse"></div>
        </div>
        
        {/* Middle Panel Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-loading-bg rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-48 bg-loading-bg rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-64 bg-loading-bg rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-10 w-32 bg-loading-bg rounded mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error Loading Sprint
          </h3>
          <p className="text-muted mb-4">{error && typeof error === 'object' && 'message' in error ? (error as Error).message : String(error)}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
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
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Sprint Data
          </h3>
          <p className="text-muted mb-4">
            No speedrun records found. Add some prospects to your speedrun to get started.
          </p>
        </div>
      </div>
    );
  }


  // Sprint detail view for middle panel - using minimal UniversalRecordDetails
  const sprintDetailView = selectedRecord ? (
    <div className="h-full flex flex-col bg-background">
      {/* Loading overlay for action submission */}
      {isSubmittingAction && (
        <div className="absolute inset-0 bg-background bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-background rounded-lg shadow-lg px-6 py-4">
            <div className="w-5 h-5 border-2 border-border border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Saving action...</span>
          </div>
        </div>
      )}
      
      <UniversalRecordTemplate
        record={selectedRecord}
        recordType="speedrun"
        recordIndex={(() => {
          const index = data.findIndex(r => r['id'] === selectedRecord.id);
          // Use globalRank first (same logic as left panel), then fall back to rank, then index
          const dbRank = selectedRecord?.globalRank || selectedRecord?.rank || (index + 1);
          console.log('🔍 [SPRINT VIEW] RecordIndex calculation:', {
            selectedRecordId: selectedRecord.id,
            selectedRecordName: selectedRecord.name || selectedRecord.fullName,
            dataLength: data.length,
            foundIndex: index,
            dbRank: dbRank,
            globalRank: selectedRecord?.globalRank,
            rank: selectedRecord?.rank,
            usingDatabaseRank: !!(selectedRecord?.globalRank || selectedRecord?.rank),
            dataSample: data.slice(0, 3).map(r => ({ id: r.id, name: r.name || r.fullName, globalRank: r.globalRank, rank: r.rank })),
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
            console.log(`🏃‍♂️ [SPRINT] Navigating to previous record: ${previousRecord.name || previousRecord.fullName} (ID: ${previousRecord.id})`);
            setSelectedRecord(previousRecord);
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
            console.log(`🏃‍♂️ [SPRINT] Navigating to next record: ${nextRecord.name || nextRecord.fullName} (ID: ${nextRecord.id})`);
            setSelectedRecord(nextRecord);
          } else {
            // No more records in current sprint
            // Don't auto-advance - the completion modal will handle sprint progression
            // when all records in the sprint are completed
            console.log(`🏃‍♂️ [SPRINT] No more records in current sprint. Modal will handle advancement when sprint completes.`);
          }
        }}
        onComplete={() => setShowCompleteModal(true)}
        onSnooze={handleSnooze}
        onRecordUpdate={async (updatedRecord) => {
          console.log('🔄 [SPEEDRUN SPRINT] Updating selectedRecord:', updatedRecord);
          
          // CRITICAL: Merge updatedRecord with existing selectedRecord to preserve all fields
          // The updatedRecord might only contain the field that was updated, so we need to preserve other fields
          setSelectedRecord((prevRecord: any) => {
            if (!prevRecord) return updatedRecord;
            
            // Merge: preserve all existing fields, update with new values from updatedRecord
            const mergedRecord = {
              ...prevRecord, // Start with all existing fields
              ...updatedRecord // Apply updates (this will include the updated field)
            };
            
            console.log('🔄 [SPEEDRUN SPRINT] Merged record update:', {
              prevRecordFields: Object.keys(prevRecord),
              updatedRecordFields: Object.keys(updatedRecord),
              mergedRecordFields: Object.keys(mergedRecord),
              preservedFields: Object.keys(prevRecord).filter(k => updatedRecord[k] === undefined),
              notesUpdated: updatedRecord.notes !== undefined,
              prevNotes: prevRecord.notes,
              updatedNotes: updatedRecord.notes,
              mergedNotes: mergedRecord.notes
            });
            
            return mergedRecord;
          });
          
          // Store optimistic update for this record
          if (updatedRecord?.id) {
            optimisticUpdatesRef.current.set(updatedRecord.id, updatedRecord);
            setOptimisticUpdateVersion(prev => prev + 1); // Trigger enrichedData recompute
            console.log('💾 [SPEEDRUN SPRINT] Stored optimistic update:', {
              recordId: updatedRecord.id,
              linkedinNavigatorUrl: updatedRecord.linkedinNavigatorUrl
            });
            
            // Clear optimistic update after 10 seconds (enough time for refresh to complete)
            setTimeout(() => {
              optimisticUpdatesRef.current.delete(updatedRecord.id);
              setOptimisticUpdateVersion(prev => prev + 1); // Trigger enrichedData recompute
              console.log('🗑️ [SPEEDRUN SPRINT] Cleared optimistic update for:', updatedRecord.id);
            }, 10000);
          }
          
          // Schedule a delayed refresh to ensure eventual consistency (after 2 seconds)
          // This allows the UI to update immediately while ensuring data consistency
          setTimeout(() => {
            console.log('🔄 [SPEEDRUN SPRINT] Performing delayed refresh for consistency');
            refresh();
          }, 2000);
        }}
      />
    </div>
  ) : (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👆</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Select a Prospect
        </h3>
        <p className="text-muted mb-3">
          Choose a prospect from the left panel to view their details.
        </p>
        <div className="text-sm text-muted bg-panel-background rounded-lg px-3 py-2 border border-border">
          <div className="font-medium mb-1">💡 Keyboard Shortcuts:</div>
          <div className="space-y-1 text-xs">
            <div>• <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">Tab</kbd> / <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">Shift+Tab</kbd> - Navigate between records</div>
            <div>• <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">Esc</kbd> / <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">⌘←</kbd> - Back to speedrun list</div>
          </div>
        </div>
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
      <CompleteActionModal
        isOpen={showAddActionModal}
        onClose={() => setShowAddActionModal(false)}
        onSubmit={handleAddAction}
        personName={selectedRecord?.name || selectedRecord?.fullName}
        companyName={typeof selectedRecord?.company === 'object' ? selectedRecord?.company?.name : selectedRecord?.company}
        isLoading={isSubmittingAction}
        section="speedrun"
      />

      {/* Sprint Completion Modal */}
      <SprintCompletionModal
        isOpen={showSprintCompletionModal}
        onContinue={() => {
          setShowSprintCompletionModal(false);
          // Advance to next sprint
          if (hasNextSprint) {
            console.log(`🏃‍♂️ [SPRINT] Advancing from Sprint ${currentSprintNumber} to Sprint ${currentSprintNumber + 1}`);
            setCurrentSprintIndex(currentSprintIndex + 1);
            // Reset the modal shown flag for the new sprint
            sprintCompletionModalShownFor.current = null;
          } else {
            // No more sprints, go back to speedrun list
            navigateToPipeline('speedrun');
          }
        }}
        currentSprintNumber={currentSprintNumber}
        nextSprintNumber={currentSprintNumber + 1}
        completedCount={currentSprintCompletedCount}
      />

      {/* Profile Popup - SpeedrunSprintView Implementation */}
      {(() => {
        const shouldRender = isProfileOpen && profileAnchor;
        console.log('🔍 SpeedrunSprintView Profile popup render check:', { 
          isProfileOpen, 
          profileAnchor: !!profileAnchor,
          profileAnchorElement: profileAnchor,
          user: !!pipelineUser,
          company,
          workspace,
          shouldRender
        });
        if (shouldRender) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ SpeedrunSprintView ProfileBox SHOULD render - all conditions met');
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ SpeedrunSprintView ProfileBox will NOT render:', {
              missingProfileOpen: !isProfileOpen,
              missingProfileAnchor: !profileAnchor
            });
          }
        }
        return shouldRender;
      })() && profileAnchor && (
        <div
          ref={profilePopupRef}
          style={{
            position: "fixed",
            left: profileAnchor.getBoundingClientRect().left,
            bottom: window.innerHeight - profileAnchor.getBoundingClientRect().top + 5,
            zIndex: 9999,
          }}
        >
          <ProfileBox
            user={pipelineUser}
            company={typeof company === 'string' ? company : ((company as any)?.name || '')}
            workspace={typeof workspace === 'string' ? workspace : ((workspace as any)?.name || '')}
            isProfileOpen={isProfileOpen}
            setIsProfileOpen={setIsProfileOpen}
            userId={user?.id || ''}
            userEmail={user?.email}
            isSellersVisible={true}
            setIsSellersVisible={() => {}}
            isRtpVisible={true}
            setIsRtpVisible={() => {}}
            isProspectsVisible={true}
            setIsProspectsVisible={() => {}}
            isLeadsVisible={true}
            setIsLeadsVisible={() => {}}
            isOpportunitiesVisible={true}
            setIsOpportunitiesVisible={() => {}}
            isCustomersVisible={false}
            setIsCustomersVisible={() => {}}
            isPartnersVisible={true}
            setIsPartnersVisible={() => {}}
          />
        </div>
      )}
    </>
  );
}

