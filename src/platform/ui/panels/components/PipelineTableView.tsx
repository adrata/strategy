"use client";

import React from "react";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
// Removed deleted PipelineDataStore - using unified data system
import { useUnifiedAuth } from "@/platform/auth";
interface PipelineTableViewProps {
  activeSection: string;
}

export function PipelineTableView({ activeSection }: PipelineTableViewProps) {
  const { ui, data } = useRevenueOS();
  
  // Get workspace and user IDs from unified auth
  const { user } = useUnifiedAuth();
  const workspaceId = user?.workspaceId;
  const userId = user?.id;
  
  // 🎯 FIXED: Use leads data passed as prop to avoid duplicate API calls
  
  // CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
  // const pipelineData = usePipelineData(activeSection as any, workspaceId, userId);
  
  // Use single data source from useRevenueOS instead
  const { data: acquisitionData } = useRevenueOS();
  
  // CRITICAL FIX: Map acquisition data to pipeline format for compatibility
  const getSectionData = (section: string) => {
    // 🎯 FIXED: Use data from RevenueOSProvider context for all sections
    if (section === 'leads') {
      // Get leads data from the context (people with LEAD status)
      const peopleData = acquisitionData?.acquireData?.people || [];
      return peopleData.filter((person: any) => person.status === 'LEAD');
    }
    
    // The useData hook returns acquireData, not data
    const acquireData = acquisitionData?.acquireData || {};
    console.log(`🔍 [PIPELINE TABLE VIEW] Getting data for section ${section}:`, {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      acquireDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : [],
      sectionData: acquireData[section] || []
    });
    
    switch (section) {
      case 'prospects': return acquireData.prospects || [];
      case 'opportunities': return acquireData.opportunities || [];
      case 'companies': return acquireData.companies || [];
      case 'people': return acquireData.people || [];
      case 'clients': return acquireData.clients || [];
      case 'partners': return acquireData.partnerships || [];
      case 'speedrun': return acquireData.speedrunItems || [];
      default: return [];
    }
  };
  
  const pipelineData = {
    data: getSectionData(activeSection),
    loading: activeSection === 'leads' ? leadsData.loading : acquisitionData.isLoading,
    error: activeSection === 'leads' ? leadsData.error : acquisitionData.error,
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
        return ['Company', 'Name', 'Title', 'Email', 'Last Action', 'Next Action'];
      case 'prospects':
        return ['Company', 'Name', 'Title', 'Email', 'Last Contact', 'Opportunity', 'Next Action'];
      case 'companies':
        return ['Rank', 'Company', 'Last Action', 'Next Action'];
      case 'people':
        return ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action'];
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
          <tr key={item.id || index} className="hover:bg-panel-background cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4">
              <div className="text-sm text-foreground truncate max-w-32">
                {item.company?.name || '-'}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-foreground truncate max-w-32">
                {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-'}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-foreground truncate max-w-32">{item.title || item.jobTitle || '-'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-foreground truncate max-w-40">{item.email || item.workEmail || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="text-muted">
                {item.lastActionDate ? new Date(item.lastActionDate).toLocaleDateString() : '-'}
              </span>
              <div className="text-xs text-muted">{item.lastAction || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
              {item.nextAction || '-'}
            </td>
          </tr>
        );
      
      case 'prospects':
        return (
          <tr key={item.id || index} className="hover:bg-panel-background cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4">
              <div className="text-sm text-foreground truncate max-w-32">{item.company || '-'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-foreground truncate max-w-32">
                {item.name || item.fullName || '-'}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-foreground truncate max-w-32">{item.title || '-'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-foreground truncate max-w-40">{item.email || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="text-muted">1 day ago</span>
              <div className="text-xs text-muted">Call</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {item.opportunities?.length > 0 ? 'Yes' : 'Not yet'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
              Schedule product demo
            </td>
          </tr>
        );
      
      case 'companies':
        return (
          <tr key={item.id || index} className="hover:bg-panel-background cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-foreground">{item.name || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.industry || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.employeeCount || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.revenue || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.location || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.contacts_count || 0}</div>
            </td>
          </tr>
        );
      
      case 'people':
        return (
          <tr key={item.id || index} className="hover:bg-panel-background cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-foreground">{item.name || item.fullName || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.title || item.jobTitle || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">
                {item.company || item.account?.name || (item.email ? item.email.split('@')[1] : '-')}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.email || item.workEmail || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-foreground">{item.phone || item.mobilePhone || item.workPhone || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
            </td>
          </tr>
        );
      
      default:
        return (
          <tr key={item.id || index} className="hover:bg-panel-background cursor-pointer" onClick={handleRowClick}>
            <td className="px-6 py-4">{item.name || '-'}</td>
            <td className="px-6 py-4">{JSON.stringify(item).substring(0, 100)}...</td>
          </tr>
        );
    }
  };

  return (
    <div className="bg-background rounded-lg border border-border h-full flex flex-col">
      {currentData.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-panel-background sticky top-0 z-10">
              <tr>
                {getTableHeaders().map((header) => (
                  <th 
                    key={header}
                    className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-gray-200">
              {currentData.map(renderTableRow)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted p-6">
            <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-muted">📋</span>
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">
              No {activeSection} yet
            </h4>
            <p className="text-sm text-muted max-w-sm">
              Start building your {activeSection} pipeline by adding new entries.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
