"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

/**
 * 🔍 DEBUG COUNTS COMPONENT
 * 
 * A debugging component to help identify why counts are showing incorrectly
 * in the TOP Engineering Plus workspace left panel.
 */

interface DebugCountsProps {
  workspaceId?: string;
  userId?: string;
}

export function DebugCounts({ workspaceId, userId }: DebugCountsProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();

  useEffect(() => {
    const runDebugging = async () => {
      setLoading(true);
      
      try {
        // Get current workspace and user info
        const currentWorkspaceId = workspaceId || authUser?.activeWorkspaceId;
        const currentUserId = userId || authUser?.id;
        
        console.log('🔍 [DEBUG COUNTS] Starting debugging...', {
          currentWorkspaceId,
          currentUserId,
          authUser: authUser?.id,
          acquisitionDataExists: !!acquisitionData
        });

        // Test direct v1 API calls
        let apiData = null;
        try {
          const [companiesResponse, peopleResponse, actionsResponse] = await Promise.all([
            fetch(`/api/v1/companies?counts=true`),
            fetch(`/api/v1/people?counts=true`),
            fetch(`/api/v1/actions?counts=true`)
          ]);
          
          const [companiesData, peopleData, actionsData] = await Promise.all([
            companiesResponse.json(),
            peopleResponse.json(),
            actionsResponse.json()
          ]);
          
          apiData = {
            success: true,
            data: {
              companies: companiesData.success ? companiesData.data : {},
              people: peopleData.success ? peopleData.data : {},
              actions: actionsData.success ? actionsData.data : {}
            }
          };
          
          setApiResponse(apiData);
          console.log('✅ [DEBUG COUNTS] V1 API response:', apiData);
        } catch (error) {
          console.error('❌ [DEBUG COUNTS] V1 API call error:', error);
        }

        // Compile debugging information
        const debugData = {
          timestamp: new Date().toISOString(),
          workspaceId: currentWorkspaceId,
          userId: currentUserId,
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
            success: apiData?.success,
            data: apiData?.data,
            counts: apiData?.data?.counts || {},
            meta: apiData?.meta
          },
          issues: [],
          recommendations: []
        };

        // Identify issues
        if (!currentWorkspaceId) {
          debugData.issues.push('No workspace ID found');
          debugData.recommendations.push('Check if user is properly authenticated');
        }

        if (currentWorkspaceId !== '01K5D01YCQJ9TJ7CT4DZDE79T1') {
          debugData.issues.push(`Wrong workspace ID: ${currentWorkspaceId} (expected: 01K5D01YCQJ9TJ7CT4DZDE79T1)`);
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

        // Compare counts if available
        const acquisitionCounts = acquisitionData?.acquireData?.counts || {};
        const apiCounts = apiData?.data?.counts || {};
        
        if (Object.keys(acquisitionCounts).length > 0 && Object.keys(apiCounts).length > 0) {
          const countMismatches = [];
          Object.keys(acquisitionCounts).forEach(key => {
            if (acquisitionCounts[key] !== apiCounts[key]) {
              countMismatches.push(`${key}: acquisition=${acquisitionCounts[key]}, api=${apiCounts[key]}`);
            }
          });
          
          if (countMismatches.length > 0) {
            debugData.issues.push(`Count mismatches: ${countMismatches.join(', ')}`);
            debugData.recommendations.push('Check if cache is stale or if there are multiple data sources');
          }
        }

        setDebugInfo(debugData);
        console.log('🔍 [DEBUG COUNTS] Debug data compiled:', debugData);
        
      } catch (error) {
        console.error('❌ [DEBUG COUNTS] Debugging failed:', error);
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    runDebugging();
  }, [workspaceId, userId, authUser, acquisitionData]);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-800">Debugging counts...</span>
        </div>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-sm text-red-800">Failed to load debug information</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
        <h3 className="text-sm font-medium text-gray-900">Debug Counts - TOP Engineering Plus</h3>
      </div>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Workspace Info</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Workspace ID: {debugInfo.workspaceId || 'Not found'}</div>
            <div>User ID: {debugInfo.userId || 'Not found'}</div>
            <div>Timestamp: {debugInfo.timestamp}</div>
          </div>
        </div>

        {/* Auth User Info */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Auth User</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>ID: {debugInfo.authUser.id || 'Not found'}</div>
            <div>Active Workspace: {debugInfo.authUser.activeWorkspaceId || 'Not found'}</div>
            <div>Workspaces: {debugInfo.authUser.workspaces?.length || 0}</div>
          </div>
        </div>

        {/* Acquisition Data */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Acquisition Data</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Exists: {debugInfo.acquisitionData.exists ? 'Yes' : 'No'}</div>
            <div>Loading: {debugInfo.acquisitionData.loading ? 'Yes' : 'No'}</div>
            <div>Has Acquire Data: {debugInfo.acquisitionData.hasAcquireData ? 'Yes' : 'No'}</div>
            <div>Counts: {Object.keys(debugInfo.acquisitionData.counts).length} keys</div>
            <div>Data Keys: {debugInfo.acquisitionData.dataKeys.join(', ')}</div>
          </div>
        </div>

        {/* API Response */}
        {apiResponse && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">API Response</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Success: {debugInfo.apiResponse.success ? 'Yes' : 'No'}</div>
              <div>Cache Hit: {debugInfo.apiResponse.meta?.cacheHit ? 'Yes' : 'No'}</div>
              <div>Response Time: {debugInfo.apiResponse.meta?.responseTime}ms</div>
              <div>Counts: {Object.keys(debugInfo.apiResponse.counts).length} keys</div>
            </div>
          </div>
        )}

        {/* Issues */}
        {debugInfo.issues.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-red-700 mb-2">Issues Found</h4>
            <div className="text-xs text-red-600 space-y-1">
              {debugInfo.issues.map((issue, index) => (
                <div key={index}>• {issue}</div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {debugInfo.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-blue-700 mb-2">Recommendations</h4>
            <div className="text-xs text-blue-600 space-y-1">
              {debugInfo.recommendations.map((rec, index) => (
                <div key={index}>• {rec}</div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Data */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-700 font-medium">Raw Debug Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

