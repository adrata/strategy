"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { DebugCounts } from '@/platform/ui/components/DebugCounts';

/**
 * 🔍 DEBUG VERSION OF PIPELINE LEFT PANEL
 * 
 * This is a debugging version of the Pipeline Left Panel that includes
 * extensive logging and debugging information to help identify why
 * counts are showing incorrectly for TOP Engineering Plus.
 */

interface PipelineLeftPanelDebugProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function PipelineLeftPanelDebug({
  activeSection,
  onSectionChange
}: PipelineLeftPanelDebugProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [counts, setCounts] = useState<any>({});

  // Get workspace and user info
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;

  // Debug logging
  useEffect(() => {
    console.log('🔍 [DEBUG LEFT PANEL] Component mounted/updated:', {
      workspaceId,
      userId,
      authLoading,
      acquisitionDataExists: !!acquisitionData,
      acquisitionDataLoading: acquisitionData?.loading?.isLoading,
      hasAcquireData: !!acquisitionData?.acquireData,
      counts: acquisitionData?.acquireData?.counts
    });
  }, [workspaceId, userId, authLoading, acquisitionData]);

  // Test API call
  useEffect(() => {
    const testAPI = async () => {
      if (!workspaceId || !userId) {
        console.log('🔍 [DEBUG LEFT PANEL] Skipping API test - missing workspaceId or userId');
        return;
      }

      try {
        console.log('🔍 [DEBUG LEFT PANEL] Testing API call...', {
          workspaceId,
          userId,
          url: `/api/data/unified?type=dashboard&action=get&workspaceId=${workspaceId}&userId=${userId}`
        });

        const response = await fetch(
          `/api/data/unified?type=dashboard&action=get&workspaceId=${workspaceId}&userId=${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          setApiResponse(data);
          console.log('✅ [DEBUG LEFT PANEL] API response:', data);
          
          if (data.success && data.data?.counts) {
            setCounts(data.data.counts);
            console.log('✅ [DEBUG LEFT PANEL] Counts from API:', data.data.counts);
          }
        } else {
          console.error('❌ [DEBUG LEFT PANEL] API call failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ [DEBUG LEFT PANEL] API call error:', error);
      }
    };

    testAPI();
  }, [workspaceId, userId]);

  // Compile debug information
  useEffect(() => {
    const debugData = {
      timestamp: new Date().toISOString(),
      workspaceId,
      userId,
      authUser: {
        id: authUser?.id,
        activeWorkspaceId: authUser?.activeWorkspaceId,
        workspaces: authUser?.workspaces?.map(w => ({ id: w.id, name: w.name }))
      },
      acquisitionData: {
        exists: !!acquisitionData,
        loading: acquisitionData?.loading?.isLoading,
        hasAcquireData: !!acquisitionData?.acquireData,
        counts: acquisitionData?.acquireData?.counts || {},
        dataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : []
      },
      apiResponse: {
        success: apiResponse?.success,
        data: apiResponse?.data,
        counts: apiResponse?.data?.counts || {},
        meta: apiResponse?.meta
      },
      finalCounts: counts,
      issues: [],
      recommendations: []
    };

    // Identify issues
    if (!workspaceId) {
      debugData.issues.push('No workspace ID found');
      debugData.recommendations.push('Check if user is properly authenticated');
    }

    if (workspaceId !== '01K5D01YCQJ9TJ7CT4DZDE79T1') {
      debugData.issues.push(`Wrong workspace ID: ${workspaceId} (expected: 01K5D01YCQJ9TJ7CT4DZDE79T1)`);
      debugData.recommendations.push('Verify user is in the correct workspace');
    }

    if (!acquisitionData) {
      debugData.issues.push('No acquisition data found');
      debugData.recommendations.push('Check if AcquisitionOSProvider is properly configured');
    }

    if (acquisitionData && !acquisitionData.acquireData) {
      debugData.issues.push('Acquisition data exists but no acquireData');
      debugData.recommendations.push('Check if data is still loading or if there was an error');
    }

    if (acquisitionData?.acquireData && !acquisitionData.acquireData.counts) {
      debugData.issues.push('Acquire data exists but no counts');
      debugData.recommendations.push('Check if counts are being loaded from the API');
    }

    setDebugInfo(debugData);
  }, [workspaceId, userId, authUser, acquisitionData, apiResponse, counts]);

  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-gray-900">Debug Left Panel</h2>
        <p className="text-xs text-gray-600">TOP Engineering Plus Counts</p>
      </div>

      {/* Debug Information */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DebugCounts workspaceId={workspaceId} userId={userId} />
        
        {/* Current Counts Display */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Counts</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div>Leads: {counts.leads || 0}</div>
            <div>Prospects: {counts.prospects || 0}</div>
            <div>People: {counts.people || 0}</div>
            <div>Companies: {counts.companies || 0}</div>
            <div>Opportunities: {counts.opportunities || 0}</div>
            <div>Clients: {counts.clients || 0}</div>
            <div>Partners: {counts.partners || 0}</div>
          </div>
        </div>

        {/* Expected Counts */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-2">Expected Counts</h4>
          <div className="text-xs text-green-800 space-y-1">
            <div>Leads: 3,939</div>
            <div>Prospects: 587</div>
            <div>People: 3,172</div>
            <div>Companies: 476</div>
            <div>Opportunities: 0</div>
            <div>Clients: 0</div>
            <div>Partners: 0</div>
          </div>
        </div>

        {/* Data Source Comparison */}
        {acquisitionData?.acquireData?.counts && apiResponse?.data?.counts && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Data Source Comparison</h4>
            <div className="text-xs text-yellow-800 space-y-1">
              {Object.keys(acquisitionData.acquireData.counts).map(key => {
                const acquisitionValue = acquisitionData.acquireData.counts[key];
                const apiValue = apiResponse.data.counts[key];
                const match = acquisitionValue === apiValue;
                return (
                  <div key={key} className={match ? 'text-green-700' : 'text-red-700'}>
                    {key}: acquisition={acquisitionValue}, api={apiValue} {match ? '✅' : '❌'}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Raw Debug Data */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-700 font-medium">Raw Debug Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--border)]">
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button
            onClick={() => {
              // Clear cache by adding timestamp to API calls
              const timestamp = Date.now();
              console.log('🔍 [DEBUG LEFT PANEL] Clearing cache with timestamp:', timestamp);
            }}
            className="w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}
