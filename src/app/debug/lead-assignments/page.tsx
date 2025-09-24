"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

/**
 * 🔍 DEBUG LEAD ASSIGNMENTS PAGE
 * 
 * This page helps investigate who the other leads are assigned to
 * in the TOP Engineering Plus workspace.
 */

export default function DebugLeadAssignmentsPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  const { user: authUser } = useUnifiedAuth();

  useEffect(() => {
    const runDebugging = async () => {
      setLoading(true);
      
      try {
        console.log('🔍 [DEBUG LEAD ASSIGNMENTS] Starting investigation...');
        
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
        
        // Call the API to get detailed data
        const response = await fetch(`/api/data/unified?type=dashboard&workspaceId=${workspaceId}`);
        const data = await response.json();
        
        console.log('📊 API Response:', data);
        setApiResponse(data);
        
        // Analyze the leads data
        const leadsData = data?.leads || [];
        const counts = data?.counts || {};
        
        console.log('🎯 Leads Data:', leadsData);
        console.log('📊 Counts:', counts);
        
        // Group leads by assigned user
        const leadsByUser = leadsData.reduce((acc: any, lead: any) => {
          const assignedUserId = lead.assignedUserId || 'unassigned';
          if (!acc[assignedUserId]) {
            acc[assignedUserId] = [];
          }
          acc[assignedUserId].push(lead);
          return acc;
        }, {});
        
        console.log('👥 Leads by User:', leadsByUser);
        
        // Get user information for each assignment
        const userAssignments = Object.keys(leadsByUser).map(userId => ({
          userId,
          count: leadsByUser[userId].length,
          leads: leadsByUser[userId]
        }));
        
        // Sort by count (descending)
        userAssignments.sort((a, b) => b.count - a.count);
        
        console.log('📋 User Assignments:', userAssignments);
        
        setDebugInfo({
          currentUser: {
            id: currentUser?.id,
            email: currentUser?.email,
            name: currentUser?.name,
            activeWorkspaceId: currentUser?.activeWorkspaceId
          },
          workspaceId,
          totalLeads: leadsData.length,
          apiCounts: counts,
          userAssignments,
          leadsByUser,
          explanation: `Found ${userAssignments.length} different user assignments. The 762 count is likely from leads assigned to the current user plus unassigned leads.`
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔍 Investigating Lead Assignments
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🔍 Investigating Lead Assignments
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
            Lead Assignment Analysis
          </h2>
          {debugInfo?.userAssignments ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Total Leads in API Response:</strong> {debugInfo.totalLeads?.toLocaleString()}
              </p>
              <p className="text-gray-700">
                <strong>API Counts:</strong> {JSON.stringify(debugInfo.apiCounts, null, 2)}
              </p>
              
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Leads by User Assignment:</h3>
                <div className="space-y-2">
                  {debugInfo.userAssignments.map((assignment: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {assignment.userId === 'unassigned' ? 'Unassigned Leads' : `User: ${assignment.userId}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.userId === 'unassigned' ? 'No assigned user' : `User ID: ${assignment.userId}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {assignment.count.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">leads</p>
                        </div>
                      </div>
                      
                      {assignment.userId !== 'unassigned' && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Sample leads assigned to this user:</p>
                          <div className="mt-1 space-y-1">
                            {assignment.leads.slice(0, 3).map((lead: any, leadIndex: number) => (
                              <div key={leadIndex} className="text-xs bg-gray-50 p-2 rounded">
                                <p><strong>Name:</strong> {lead.name || 'Unknown'}</p>
                                <p><strong>Email:</strong> {lead.email || 'Unknown'}</p>
                                <p><strong>Company:</strong> {lead.company || 'Unknown'}</p>
                              </div>
                            ))}
                            {assignment.leads.length > 3 && (
                              <p className="text-xs text-gray-500">
                                ... and {assignment.leads.length - 3} more leads
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600">No assignment data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Analysis & Explanation
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                🔍 What This Shows
              </h3>
              <p className="text-blue-700 mb-2">
                This analysis shows how leads are distributed among users in the workspace.
              </p>
              <p className="text-blue-700 mb-2">
                The 762 count you're seeing is likely the sum of:
              </p>
              <ul className="text-blue-700 list-disc list-inside ml-4">
                <li>Leads assigned to the current user</li>
                <li>Unassigned leads (assignedUserId = null)</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                ⚠️ Why This Happens
              </h3>
              <p className="text-yellow-700 mb-2">
                The API route filters leads based on user assignment to show only:
              </p>
              <ul className="text-yellow-700 list-disc list-inside ml-4">
                <li>Leads assigned to the current user</li>
                <li>Unassigned leads</li>
              </ul>
              <p className="text-yellow-700 mt-2">
                This means leads assigned to OTHER users are hidden from the current user.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ Solution
              </h3>
              <p className="text-green-700 mb-2">
                To see all 3,939 leads, the API route needs to be modified to remove
                the user assignment filtering.
              </p>
              <p className="text-green-700">
                This would show all leads in the workspace regardless of assignment.
              </p>
            </div>
          </div>
        </div>

        {debugInfo?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{debugInfo.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

