"use client";

import React from "react";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
// Removed deleted PipelineDataStore - using unified data system
import { useUnifiedAuth } from "@/platform/auth-unified";

interface PipelineTableViewProps {
  activeSection: string;
}

export function PipelineTableView({ activeSection }: PipelineTableViewProps) {
  const { ui, data } = useAcquisitionOS();
  
  // Get workspace and user IDs from unified auth
  const { user } = useUnifiedAuth();
  const workspaceId = user?.workspaceId;
  const userId = user?.id;
  
  // CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
  // const pipelineData = usePipelineData(activeSection as any, workspaceId, userId);
  
  // Use single data source from useAcquisitionOS instead
  const { data: acquisitionData } = useAcquisitionOS();
  
  // CRITICAL FIX: Map acquisition data to pipeline format for compatibility
  const getSectionData = (section: string) => {
    // The useAcquisitionOSData hook returns acquireData, not data
    const acquireData = acquisitionData?.acquireData || {};
    console.log(`🔍 [PIPELINE TABLE VIEW] Getting data for section ${section}:`, {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      acquireDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : [],
      sectionData: acquireData[section] || []
    });
    
    switch (section) {
      case 'leads': return acquireData.leads || [];
      case 'prospects': return acquireData.prospects || [];
      case 'opportunities': return acquireData.opportunities || [];
      case 'companies': return acquireData.companies || [];
      case 'people': return acquireData.people || [];
      case 'customers': return acquireData.customers || [];
      case 'partners': return acquireData.partnerships || [];
      case 'speedrun': return acquireData.speedrunItems || [];
      default: return [];
    }
  };
  
  const pipelineData = {
    data: getSectionData(activeSection),
    loading: acquisitionData.isLoading,
    error: acquisitionData.error,
    isEmpty: getSectionData(activeSection).length === 0
  };
  
  const currentData = pipelineData.data || [];
  
  console.log(`🔍 [PIPELINE TABLE VIEW] Section: ${activeSection}, Data: ${currentData.length} records`);

  // Debug logging to understand data flow
  console.log(`🔍 PipelineTableView [${activeSection}]:`, {
    isLoading: pipelineData.loading,
    currentDataLength: currentData.length,
    pipelineDataKeys: [`pipeline-${activeSection}`],
    firstRecord: currentData[0]?.name || currentData[0]?.fullName || 'none',
    workspaceId,
    userId
  });

  const getTableHeaders = () => {
    switch (activeSection) {
      case 'leads':
        return ['Company', 'Name', 'Title', 'Email', 'Last Contact', 'Next Action'];
      case 'prospects':
        return ['Company', 'Name', 'Title', 'Email', 'Last Contact', 'Opportunity', 'Next Action'];
      case 'companies':
        return ['Rank', 'Company', 'Last Action', 'Next Action'];
      case 'people':
        return ['Rank', 'Title', 'Company', 'Last Action', 'Next Action'];
      default:
        return ['Name', 'Details'];
    }
  };

  const renderTableRow = (item: any, index: number) => {
    const handleRowClick = () => {
      ui.handleRecordClick?.(item, activeSection);
    };

    switch (activeSection) {
      case 'leads':
        return (
          <tr key={item.id || index} className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 truncate max-w-32">{item.company || 'Unknown Company'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                {item.name || item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Contact'}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 truncate max-w-32">{item.title || 'No Title'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 truncate max-w-40">{item.email || 'No Email'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="text-gray-600">2 days ago</span>
              <div className="text-xs text-gray-400">Email</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              Follow up via email
            </td>
          </tr>
        );
      
      case 'prospects':
        return (
          <tr key={item.id || index} className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 truncate max-w-32">{item.company || 'Unknown Company'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                {item.name || item.fullName || 'Unknown Contact'}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 truncate max-w-32">{item.title || 'No Title'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 truncate max-w-40">{item.email || 'No Email'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="text-gray-600">1 day ago</span>
              <div className="text-xs text-gray-400">Call</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {item.opportunities?.length > 0 ? 'Yes' : 'Not yet'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              Schedule product demo
            </td>
          </tr>
        );
      
      case 'companies':
        return (
          <tr key={item.id || index} className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{item.name || 'Unknown Company'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.industry || 'Unknown Industry'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.employeeCount || 'Unknown Size'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.revenue || 'Revenue undisclosed'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.location || 'Unknown Location'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.contacts_count || 0}</div>
            </td>
          </tr>
        );
      
      case 'people':
        return (
          <tr key={item.id || index} className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{item.name || item.fullName || 'Unknown Contact'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.title || item.jobTitle || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {item.company || item.account?.name || (item.email ? item.email.split('@')[1] : 'No Company')}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.email || item.workEmail || 'No Email'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{item.phone || item.mobilePhone || item.workPhone || 'No Phone'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
            </td>
          </tr>
        );
      
      default:
        return (
          <tr key={item.id || index} className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4">{item.name || 'Unknown'}</td>
            <td className="px-6 py-4">{JSON.stringify(item).substring(0, 100)}...</td>
          </tr>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col mx-6 mb-8">
      {currentData.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {getTableHeaders().map((header) => (
                    <th 
                      key={header}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map(renderTableRow)}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">📋</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No {activeSection} yet
            </h4>
            <p className="text-sm text-gray-600 max-w-sm">
              Start building your {activeSection} pipeline by adding new entries. Click the button above to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
