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
import { useUnifiedAuth } from '@/platform/auth-unified';
// Removed deleted PipelineDataStore - using unified data system
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { useZoom } from '@/platform/ui/components/ZoomProvider';
import { UniversalRecordTemplate } from './UniversalRecordTemplate';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { CompleteActionModal, ActionLogData } from '@/products/speedrun/components/CompleteActionModal';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';

export function SpeedrunSprintView() {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  const { zoom } = useZoom();
  const { ui } = useAcquisitionOS();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [currentSprintIndex, setCurrentSprintIndex] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [snoozedRecords, setSnoozedRecords] = useState<string[]>([]);

  // Get workspace info
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;
  
  // CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
  // const {
  //   data: allData, 
  //   loading, 
  //   error, 
  //   refresh 
  // } = usePipelineData('speedrun', workspaceId, userId);
  
  // 🚀 PERFORMANCE: Use fast section data loading system with aggressive caching
  const fastSectionData = useFastSectionData('speedrun', 30, workspaceId, userId);
  
  const allData = fastSectionData.data || [];
  const loading = fastSectionData.loading || false;
  const error = fastSectionData.error || null;
  const refresh = fastSectionData.refreshData || (() => {});
  
  // 🚀 PERFORMANCE: Pre-load speedrun data on component mount
  useEffect(() => {
    if (workspaceId && userId && !loading && !allData.length) {
      console.log('🚀 [SPEEDRUN] Pre-loading speedrun data for faster initial load');
      refresh();
    }
  }, [workspaceId, userId, loading, allData.length, refresh]);

  // 🚀 PERFORMANCE: Show loading state while data is being fetched
  if (loading && !allData.length) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Speedrun Data</h3>
          <p className="text-gray-600">Preparing your speedrun targets...</p>
        </div>
      </div>
    );
  }

  // 🚀 PERFORMANCE: Show error state if data loading fails
  if (error && !allData.length) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Speedrun Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Dynamic sprint size based on available data
  const calculateOptimalSprintSize = (totalRecords: number): number => {
    if (totalRecords <= 15) return Math.max(3, Math.ceil(totalRecords / 3)); // 3-5 for small datasets
    if (totalRecords <= 30) return Math.ceil(totalRecords / 3); // 10 for medium datasets
    return 10; // 10 for large datasets (default)
  };
  

  
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
  
  // Filter out snoozed records (without modifying localStorage in render)
  const filteredData = useMemo(() => {
    if (!allData || typeof window === 'undefined') return allData || [];
    
    const snoozedRecords = JSON.parse(localStorage.getItem('snoozedRecords') || '[]');
    const now = new Date();
    
    return allData.filter(record => {
      const snoozedRecord = snoozedRecords.find((snooze: any) => snooze['recordId'] === record.id);
      
      if (snoozedRecord) {
        const snoozeUntil = new Date(snoozedRecord.snoozeUntil);
        // Only exclude if still snoozed
        return now >= snoozeUntil;
      }
      
      return true;
    });
  }, [allData]);
  
  const SPRINT_SIZE = calculateOptimalSprintSize(filteredData?.length || 0);
  
  // Log adaptive sprint sizing for workspace optimization
  useEffect(() => {
    if (filteredData?.length) {
      console.log(`🏃‍♂️ Adaptive Sprint: ${filteredData.length} records → ${SPRINT_SIZE} per sprint for optimal workflow`);
    }
  }, [filteredData?.length, SPRINT_SIZE]);
  
  const data = filteredData ? filteredData.slice(currentSprintIndex * SPRINT_SIZE, (currentSprintIndex + 1) * SPRINT_SIZE) : [];
  const totalSprints = Math.ceil((filteredData?.length || 0) / SPRINT_SIZE);
  const hasNextSprint = currentSprintIndex < totalSprints - 1;
  const currentSprintNumber = currentSprintIndex + 1;

  // Set Speedrun context for AI panel
  useEffect(() => {
    ui.setActiveSubApp('Speedrun');
  }, [ui]);

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

  // Keyboard shortcut for Command+Enter to complete current record
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    };

    // Add event listener with capture to ensure we get the event first
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [selectedRecord]);

  // Handle record selection
  const handleRecordSelect = (record: any) => {
    setSelectedRecord(record);
  };

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
      // Save action log to backend using existing API
      const { authFetch } = await import('@/platform/auth-fetch');
      const response = await authFetch('/api/speedrun/action-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: selectedRecord.id,
          personName: selectedRecord.fullName || selectedRecord.name || 'Unknown',
          actionType: actionData.type,
          notes: actionData.notes,
          nextAction: actionData.nextAction,
          nextActionDate: actionData.nextActionDate,
          workspaceId,
          userId,
          actionPerformedBy: actionData.actionPerformedBy || userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save action log');
      }

      console.log(`✅ Action log saved for ${selectedRecord.name || selectedRecord.fullName}`);

      // Get next record in current sprint
      const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
      const nextRecord = data[currentIndex + 1];
      
      if (nextRecord) {
        // Move to next record in sprint
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
      alert('Failed to save action log. Please try again.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Enhanced loading state with better skeletons
  if (loading && (!data || data['length'] === 0)) {
    return (
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={
          <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] h-full bg-white border-r border-gray-100">
            {/* Left Panel Skeleton */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Sprint Cards Skeleton */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer Skeleton */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        }
        middlePanel={
          <div className="h-full flex flex-col bg-white">
            {/* Middle Panel Header Skeleton */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Middle Panel Content Skeleton */}
            <div className="flex-1 p-6">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        }
        rightPanel={<AIRightPanel />}
        zoom={zoom}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={isRightPanelVisible}
        onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
        onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Sprint
          </h3>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
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
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Sprint Data
          </h3>
          <p className="text-gray-600 mb-4">
            No speedrun records found. Add some prospects to your speedrun to get started.
          </p>
          <button
            onClick={() => navigateToPipeline('speedrun')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Speedrun
          </button>
        </div>
      </div>
    );
  }

  // Sprint card list for left panel
  const sprintCardList = (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] h-full flex flex-col bg-white border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Sprint {currentSprintNumber}</h2>
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{data.length}/10</span>
          </div>
          {totalSprints > 1 && (
            <div className="text-xs text-gray-500">
              {currentSprintNumber} of {totalSprints} sprints
            </div>
          )}
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {/* Loading indicator for data refresh */}
        {loading && data.length > 0 && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>Updating sprint data...</span>
            </div>
          </div>
        )}
        
        {data.map((record: any, index: number) => {
          const isSelected = selectedRecord?.id === record.id;
          const displayName = record.fullName || 
                             (record['firstName'] && record.lastName ? `${record.firstName} ${record.lastName}` : '') ||
                             record.name || 
                             'Unknown';
          
          return (
            <div
              key={record.id || index}
              onClick={() => handleRecordSelect(record)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                isSelected 
                  ? 'bg-gray-100 text-gray-900 border-gray-200 shadow-sm' 
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-xl ${
                      isSelected 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                      {displayName}
                    </h3>
                  </div>
                  <p className={`text-xs truncate mb-1 ${isSelected ? 'text-gray-600' : 'text-gray-600'}`}>
                    {record.title || record.jobTitle || 'No Title'}
                  </p>
                  <p className={`text-xs truncate ${isSelected ? 'text-gray-500' : 'text-gray-500'}`}>
                    {record.company || 'Unknown Company'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={() => navigateToPipeline('speedrun')}
          className="w-full px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back to Speedrun
        </button>
      </div>
    </div>
  );

  // Sprint detail view for middle panel - using minimal UniversalRecordDetails
  const sprintDetailView = selectedRecord ? (
    <div className="h-full flex flex-col bg-white">
      {/* Loading overlay for action submission */}
      {isSubmittingAction && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg px-6 py-4">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Saving action...</span>
          </div>
        </div>
      )}
      
      <UniversalRecordTemplate
        record={selectedRecord}
        recordType="speedrun"
        recordIndex={(() => {
          const index = data.findIndex(r => r['id'] === selectedRecord.id);
          const recordIndex = index >= 0 ? index + 1 : 1;
          console.log('🔍 [SPRINT VIEW] RecordIndex calculation:', {
            selectedRecordId: selectedRecord.id,
            selectedRecordName: selectedRecord.name || selectedRecord.fullName,
            dataLength: data.length,
            foundIndex: index,
            calculatedRecordIndex: recordIndex,
            dataSample: data.slice(0, 3).map(r => ({ id: r.id, name: r.name || r.fullName }))
          });
          return recordIndex;
        })()}
        totalRecords={data.length}
        onBack={() => {
          // Go back to speedrun list
          navigateToPipeline('speedrun');
        }}
        onNavigatePrevious={() => {
          const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
          if (currentIndex > 0) {
            setSelectedRecord(data[currentIndex - 1]);
          }
        }}
        onNavigateNext={() => {
          const currentIndex = data.findIndex(r => r['id'] === selectedRecord.id);
          const nextRecord = data[currentIndex + 1];
          if (nextRecord) {
            setSelectedRecord(nextRecord);
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
    <div className="h-full flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👆</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select a Prospect
        </h3>
        <p className="text-gray-600">
          Choose a prospect from the left panel to view their details.
        </p>
      </div>
    </div>
  );

  return (
    <SpeedrunDataProvider>
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={sprintCardList}
        middlePanel={sprintDetailView}
        rightPanel={<AIRightPanel />}
        zoom={zoom}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={isRightPanelVisible}
        onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
        onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
      />

      {/* Complete Action Modal */}
      <CompleteActionModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onSubmit={handleActionLogSubmit}
        personName={selectedRecord?.fullName || selectedRecord?.name || 'Unknown'}
        isLoading={isSubmittingAction}
      />
    </SpeedrunDataProvider>
  );
}
