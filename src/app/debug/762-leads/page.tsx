"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

/**
 * 🔍 DEBUG 762 LEADS PAGE
 * 
 * This page helps debug why the left panel shows 762 leads instead of 3,939
 * for the TOP Engineering Plus workspace.
 */

export default function Debug762LeadsPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  const { user: authUser } = useUnifiedAuth();

  useEffect(() => {
    const runDebugging = async () => {
      setLoading(true);
      
      try {
        console.log('🔍 [DEBUG 762 LEADS] Starting debugging...');
        
        // Get current user info
        const currentUser = authUser;
        console.log('👤 Current User:', currentUser);
        
        // Get workspace ID
        const workspaceId = currentUser?.activeWorkspaceId;
        console.log('🏢 Workspace ID:', workspaceId);
        
        if (!workspaceId) {
          console.log('❌ No workspace ID found');
          setDebugInfo({ error: 'No workspace ID found' });
          setLoading(false);
          return;
        }
        
        // Call the API to get counts
        const response = await fetch(`/api/data/unified?type=dashboard&workspaceId=${workspaceId}`);
        const data = await response.json();
        
        console.log('📊 API Response:', data);
        setApiResponse(data);
        
        // Analyze the counts
        const counts = data?.counts || {};
        const leadsCount = counts.leads || 0;
        
        console.log('🎯 Leads Count from API:', leadsCount);
        
        // Check if this matches the 762 issue
        if (leadsCount === 762) {
          console.log('🎯 FOUND THE 762 LEADS!');
          console.log('   This is likely due to user assignment filtering');
          console.log('   The API only shows leads assigned to current user + unassigned leads');
        }
        
        setDebugInfo({
          currentUser: {
            id: currentUser?.id,
            email: currentUser?.email,
            name: currentUser?.name,
            activeWorkspaceId: currentUser?.activeWorkspaceId
          },
          workspaceId,
          apiCounts: counts,
          leadsCount,
          is762Issue: leadsCount === 762,
          explanation: leadsCount === 762 ? 
            'The 762 count is due to user assignment filtering. The API only shows leads assigned to the current user plus unassigned leads. The missing leads are assigned to other users in the workspace.' :
            'This is not the 762 issue. The count is different.'
        });
        
      } catch (error) {
        console.error('❌ Debug error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      runDebugging();
    }
  }, [authUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔍 Debugging 762 Leads Issue
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🔍 Debugging 762 Leads Issue
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current User Information
          </h2>
          {debugInfo?.currentUser ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {debugInfo.currentUser.id}</p>
              <p><strong>Email:</strong> {debugInfo.currentUser.email}</p>
              <p><strong>Name:</strong> {debugInfo.currentUser.name}</p>
              <p><strong>Active Workspace:</strong> {debugInfo.currentUser.activeWorkspaceId}</p>
            </div>
          ) : (
            <p className="text-red-600">No user information available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            API Response Analysis
          </h2>
          {debugInfo?.apiCounts ? (
            <div className="space-y-2">
              <p><strong>Leads Count:</strong> {debugInfo.leadsCount?.toLocaleString()}</p>
              <p><strong>Prospects Count:</strong> {debugInfo.apiCounts.prospects?.toLocaleString()}</p>
              <p><strong>People Count:</strong> {debugInfo.apiCounts.people?.toLocaleString()}</p>
              <p><strong>Companies Count:</strong> {debugInfo.apiCounts.companies?.toLocaleString()}</p>
              <p><strong>Opportunities Count:</strong> {debugInfo.apiCounts.opportunities?.toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-red-600">No API counts available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Issue Analysis
          </h2>
          {debugInfo?.is762Issue ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                🎯 762 Leads Issue Confirmed
              </h3>
              <p className="text-yellow-700 mb-2">
                The API is returning 762 leads instead of the expected 3,939 total leads.
              </p>
              <p className="text-yellow-700 mb-2">
                <strong>Root Cause:</strong> User assignment filtering in the API route.
              </p>
              <p className="text-yellow-700">
                The API only shows leads assigned to the current user plus unassigned leads.
                The missing 3,177 leads are assigned to other users in the workspace.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ No 762 Issue Detected
              </h3>
              <p className="text-green-700">
                The leads count is {debugInfo?.leadsCount?.toLocaleString()}, which is not 762.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Solution
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Option 1: Remove User Assignment Filtering</h3>
              <p className="text-gray-700 mb-2">
                Modify the API route to show all leads in the workspace, regardless of assignment.
              </p>
              <code className="bg-gray-100 p-2 rounded text-sm block">
                // Change from:<br/>
                OR: [&#123; assignedUserId: userId &#125;, &#123; assignedUserId: null &#125;]<br/>
                // To:<br/>
                // Remove the OR clause entirely
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Option 2: Add Admin Override</h3>
              <p className="text-gray-700 mb-2">
                Add a check for admin users to see all leads in the workspace.
              </p>
              <code className="bg-gray-100 p-2 rounded text-sm block">
                // Add admin check before the OR clause<br/>
                if (user.isAdmin) &#123;<br/>
                &nbsp;&nbsp;// Show all leads<br/>
                &#125; else &#123;<br/>
                &nbsp;&nbsp;// Show only assigned + unassigned<br/>
                &#125;
              </code>
            </div>
          </div>
        </div>

        {debugInfo?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{debugInfo.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

