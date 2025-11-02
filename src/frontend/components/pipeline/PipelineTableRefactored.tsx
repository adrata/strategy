/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/usePipelineData';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { getRealtimeActionTiming, getStageColor, getStateColor } from '@/platform/utils/statusUtils';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { Pagination } from './table/Pagination';
import { TableSkeleton } from './table/TableSkeleton';
import { TableDataSkeleton } from './table/TableDataSkeleton';
import { EditRecordModal } from './EditRecordModal';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { RecordDetailModal } from './RecordDetailModal';

// -------- Types --------
interface PipelineRecord {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  stage?: string;
  lastActionTime?: string;
  lastContactTime?: string;
  lastActionDescription?: string;
  nextAction?: string;
  rank?: number;
  [key: string]: any;
}

interface PipelineTableProps {
  section: string;
  data: PipelineRecord[];
  onRecordClick: (record: PipelineRecord) => void;
  onReorderRecords?: (fromIndex: number, toIndex: number) => void;
  onColumnSort?: (columnName: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  visibleColumns?: string[];
  pageSize?: number;
  isLoading?: boolean;
  searchQuery?: string;
  totalCount?: number; // Add totalCount prop for correct pagination
}

// -------- Constants --------
const DEFAULT_PAGE_SIZE = 100; // Show more data by default

// -------- Timing Functions --------
function getLastActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's lastActionTime field directly
  const lastActionTime = record['lastActionTime'];
  
  if (lastActionTime) {
    // All timing pills now use light gray color
    if (lastActionTime === 'Never') {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    } else if (lastActionTime === 'Today') {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    } else if (lastActionTime === 'Yesterday') {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    } else if (lastActionTime.includes('days ago') && parseInt(lastActionTime) <= 3) {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    } else if (lastActionTime.includes('days ago') && parseInt(lastActionTime) <= 7) {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    } else if (lastActionTime.includes('weeks ago') || lastActionTime.includes('months ago')) {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    } else {
      return { text: lastActionTime, color: 'bg-hover text-gray-800' };
    }
  }
  
  // Fallback: Calculate timing from date
  const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
  const timing = getRealtimeActionTiming(lastActionDate);
  return { ...timing, color: 'bg-hover text-gray-800' };
}

function getNextActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's nextActionTiming field directly
  const nextActionTiming = record['nextActionTiming'];
  
  if (nextActionTiming) {
    // All timing pills now use light gray color
    if (nextActionTiming === 'Now') {
      return { text: nextActionTiming, color: 'bg-blue-100 text-blue-800' }; // Highlight "Now" differently
    } else if (nextActionTiming === 'Overdue') {
      return { text: nextActionTiming, color: 'bg-red-100 text-red-800' };
    } else if (nextActionTiming === 'Due soon') {
      return { text: nextActionTiming, color: 'bg-orange-100 text-orange-800' };
    } else if (nextActionTiming === 'Today') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else if (nextActionTiming === 'Tomorrow') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else if (nextActionTiming === 'This week') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else if (nextActionTiming === 'Next week') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else if (nextActionTiming === 'This month') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else if (nextActionTiming === 'Future') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else if (nextActionTiming === 'No date set') {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    } else {
      return { text: nextActionTiming, color: 'bg-hover text-gray-800' };
    }
  }
  
  // Fallback: For next actions, we need to calculate timing based on when the next action should happen
  const nextActionDate = record['nextActionDate'] || record['nextContactDate'];
  if (!nextActionDate) {
    return { text: 'No date set', color: 'bg-hover text-gray-800' };
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  let result;
  if (diffDays < 0) {
    result = { text: 'Overdue', color: 'bg-hover text-gray-800' };
  } else if (diffDays === 0) {
    result = { text: 'Today', color: 'bg-hover text-gray-800' };
  } else if (diffDays === 1) {
    result = { text: 'Tomorrow', color: 'bg-hover text-gray-800' };
  } else if (diffDays <= 7) {
    result = { text: 'This week', color: 'bg-hover text-gray-800' };
  } else if (diffDays <= 14) {
    result = { text: 'Next week', color: 'bg-hover text-gray-800' };
  } else if (diffDays <= 30) {
    result = { text: 'This month', color: 'bg-hover text-gray-800' };
  } else {
    result = { text: 'Future', color: 'bg-hover text-gray-800' };
  }
  
  return result;
}

// -------- Helper Functions --------
function getTableHeaders(visibleColumns?: string[], section?: string): string[] {
  if (!visibleColumns || visibleColumns.length === 0) {
    // Default headers based on section
    const defaultHeaders: Record<string, string[]> = {
      'leads': ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action'],
      'prospects': ['Name', 'Company', 'Title', 'Last Action', 'Next Action'],
      'opportunities': ['Rank', 'Company', 'Stage', 'Value', 'Last Action', 'Next Action'],
      'companies': ['Company', 'Last Action', 'Next Action'],
      'people': ['Name', 'Company', 'Title', 'Last Action', 'Next Action'],
      'clients': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'partners': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'sellers': ['Rank', 'Person', 'Company', 'Title', 'Last Action', 'Next Action'],
      'speedrun': ['Rank', 'Name', 'Company', 'State', 'Stage', 'Actions', 'LAST ACTION', 'NEXT ACTION']
    };
    
    return defaultHeaders[section || 'companies'] || defaultHeaders['companies'];
  }
  
  return visibleColumns;
}

// -------- Main Component --------
export function PipelineTable({
  section,
  data,
  onRecordClick,
  onReorderRecords,
  onColumnSort,
  sortField,
  sortDirection,
  visibleColumns,
  pageSize = DEFAULT_PAGE_SIZE,
  isLoading = false,
  searchQuery,
  totalCount,
}: PipelineTableProps) {
  
  // 🎯 REAL-TIME UPDATES: State for current time to update Last Action times
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update current time every minute for real-time Last Action updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Process data to sort by rank highest to lowest and move completed items to bottom for speedrun
  const processedData = useMemo(() => {
    if (section === 'speedrun') {
      // Separate completed and active items first
      const completedItems: any[] = [];
      const activeItems: any[] = [];
      
      data.forEach(record => {
        // Check if item is completed (last action today)
        const isCompleted = record['lastActionDate'] && (() => {
          const lastActionDate = new Date(record['lastActionDate']);
          const today = new Date();
          return lastActionDate.toDateString() === today.toDateString();
        })();
        
        if (isCompleted) {
          completedItems.push(record);
        } else {
          activeItems.push(record);
        }
      });
      
      // Sort active items by rank descending (highest to lowest)
      activeItems.sort((a, b) => {
        const rankA = parseInt(a['globalRank'] || a['rank'] || '0', 10);
        const rankB = parseInt(b['globalRank'] || b['rank'] || '0', 10);
        return rankB - rankA; // Descending order (50, 49, 48...)
      });
      
      // Sort completed items by rank descending too
      completedItems.sort((a, b) => {
        const rankA = parseInt(a['globalRank'] || a['rank'] || '0', 10);
        const rankB = parseInt(b['globalRank'] || b['rank'] || '0', 10);
        return rankB - rankA; // Descending order
      });
      
      // Return active items first (highest to lowest), then completed items at bottom
      return [...activeItems, ...completedItems];
    }
    return data;
  }, [data, section]);
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Get table headers and filter out STATUS for speedrun
  const headers = useMemo(() => {
    const baseHeaders = getTableHeaders(visibleColumns, section);
    if (section === 'speedrun') {
      return baseHeaders.filter(h => h.toLowerCase() !== 'status');
    }
    return baseHeaders;
  }, [visibleColumns, section]);
  
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 180 : 500;
  
  // Dynamic height calculation - always use full viewport height for consistency
  let tableHeight;
  if (data.length === 0) {
    // Empty state - use moderate height
    tableHeight = 200;
  } else {
    // ALL tables use viewport height for consistency (matches Speedrun)
    tableHeight = maxViewportHeight;
  }
  
  // Use custom hooks for data and actions
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    apiTotalCount,
    searchQuery: hookSearchQuery,
    setCurrentPage,
    setSortField,
    setSortDirection,
  } = usePipelineData({ 
    data: processedData, 
    pageSize,
        disableSorting: section === 'people' || section === 'leads' || section === 'prospects', // Disable sorting for people, leads, and prospects to preserve API ranking
    searchQuery, // Pass search query to hook
    totalCount, // Pass totalCount for correct pagination
    externalSortField: sortField, // Pass external sort field
    externalSortDirection: sortDirection // Pass external sort direction
  });
  
  console.log(`🔧 [PipelineTableRefactored] Section: ${section}, disableSorting: ${section === 'people' || section === 'leads' || section === 'prospects'}`);
  
  
  // Action handling
  const {
    handleEdit,
    handleAddAction,
    handleDelete,
    handleEditSubmit,
    handleActionSubmit
  } = usePipelineActions({
    onRecordUpdate: (record) => {
      // Handle record update
    },
    onRecordDelete: (recordId) => {
      // Handle record deletion
    },
    onActionAdd: (recordId, action) => {
      // Handle action addition
    }
  });
  
  // Modal state
  const [editingRecord, setEditingRecord] = useState<PipelineRecord | null>(null);
  const [addingAction, setAddingAction] = useState<PipelineRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PipelineRecord | null>(null);
  
  // Real-time timestamp refresh state
  const [timestampRefresh, setTimestampRefresh] = useState(0);
  
  // Auto-refresh timestamps every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);
  
  // Handle record click
  const handleRecordClick = (record: PipelineRecord) => {
    onRecordClick(record);
  };
  
  // Handle edit - using the one from usePipelineActions hook
  
  // Handle add action
  const handleAddActionClick = (record: PipelineRecord) => {
    setAddingAction(record);
  };

  // Wrapper for CompleteActionModal onSubmit
  const handleAddActionSubmit = async (actionData: ActionLogData) => {
    if (addingAction) {
      // Convert ActionLogData to the format expected by usePipelineActions
      const recordWithAction = {
        ...addingAction,
        actionType: actionData.type,
        notes: actionData.action,
        person: actionData.person,
        company: actionData.company
      };
      await handleAddAction(recordWithAction);
      setAddingAction(null);
    }
  };
  
  // Handle view details
  const handleViewDetails = (record: PipelineRecord) => {
    setViewingRecord(record);
  };
  
  // Close modals
  const closeEditModal = () => setEditingRecord(null);
  const closeAddActionModal = () => setAddingAction(null);
  const closeDetailModal = () => setViewingRecord(null);
  
  // Loading state - only show skeleton for table data, keep header and filters visible
  if (isLoading) {
    return <TableDataSkeleton rowCount={8} visibleColumns={visibleColumns} />;
  }
  
  // Empty state - show table with "No data. Add a lead." in first row
  if (!data || data.length === 0) {
    return (
      <div className="bg-background border border-border flex flex-col relative rounded-md" style={{ height: `${tableHeight}px` }}>
        <div className="flex-1 overflow-auto min-h-0 middle-panel-scroll">
          <table className="w-full">
            <TableHeader
              headers={headers}
              sortField={sortField}
              sortDirection={sortDirection}
              onColumnSort={onColumnSort}
            />
            <tbody>
              <tr className="border-b border-border hover:bg-panel-background">
                <td colSpan={visibleColumns?.length || 6} className="px-6 py-16 text-center">
                  <div className="text-muted">
                    <div className="text-lg font-medium mb-2">No leads yet</div>
                    <div className="text-sm">
                      Get started by adding your first lead to the pipeline.
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  return (
      <div className="bg-background border border-border flex flex-col relative rounded-md" style={{ height: `${tableHeight}px` }}>
      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 middle-panel-scroll">
        <table className="w-full">
          <TableHeader
            headers={headers}
            sortField={sortField}
            sortDirection={sortDirection}
            onColumnSort={onColumnSort}
          />
          
          {/* Table body */}
          <tbody>
            {useMemo(() => paginatedData.map((record, index) => {
              // Check if this record is completed (for speedrun section) - based on last action today
              const isCompleted = section === 'speedrun' && (() => {
                if (record['lastActionDate']) {
                  const lastActionDate = new Date(record['lastActionDate']);
                  const today = new Date();
                  // Check if last action was today (same day)
                  return lastActionDate.toDateString() === today.toDateString();
                }
                return false;
              })();
              
              return (
                  <tr
                    key={record.id}
                    className={`cursor-pointer transition-colors hover:bg-panel-background h-table-row border-b border-border relative ${
                      isCompleted ? 'bg-green-50 border-green-200' : ''
                    }`}
                    onClick={() => onRecordClick(record)}
                  >
                  {headers.map((header, headerIndex) => {
                    let cellContent = '';
                    
                    // Simple cell content mapping
                    switch (header.toLowerCase()) {
                      case 'rank':
                        // Use rank from API - production behavior
                        let displayRank;
                        if (section === 'speedrun') {
                          // Check if item is completed (last action today)
                          const isCompleted = record['lastActionDate'] && (() => {
                            const lastActionDate = new Date(record['lastActionDate']);
                            const today = new Date();
                            return lastActionDate.toDateString() === today.toDateString();
                          })();
                          
                          if (isCompleted) {
                            // Show checkmark for completed items
                            displayRank = '✓';
                          } else {
                            // For speedrun, show actual globalRank (1-50 per user)
                            displayRank = record['globalRank'] || record['rank'] || (index + 1);
                          }
                        } else {
                          // For other sections, keep hierarchical ranking if available
                          const companyRank = record['companyRank'] || record['company']?.rank || 0;
                          const personRank = record['personRank'] || record['rank'] || 0;
                          const globalRank = record['globalPersonRank'] || record['rank'] || (currentPage - 1) * pageSize + index + 1;
                          
                          if (companyRank > 0) {
                            // Show "Company Rank: Person Rank" format
                            displayRank = `${companyRank}:${personRank}`;
                          } else {
                            // Fallback to global rank
                            displayRank = globalRank;
                          }
                        }
                        
                        cellContent = String(displayRank);
                        break;
                      case 'company':
                        // Handle both string and object company data
                        // For companies section, the record itself IS the company, so use record.name
                        if (section === 'companies') {
                          const companyName = record.name || (record as any)['companyName'] || '';
                          cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
                        } else {
                          // For company leads (isCompanyLead flag), show the company name
                          if (record['isCompanyLead']) {
                            // For company leads, company is now a string, not an object
                            const companyName = typeof record['company'] === 'string' 
                              ? record['company'] 
                              : record['company']?.name || record['companyName'] || '';
                            cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
                          } else {
                            // For other sections (leads, prospects, etc.), look for company field
                            const company = record['company'];
                            let companyName = '';
                            
                            // Debug logging for company data
                            console.log(`🔍 [COMPANY DEBUG] Section: ${section}, Record ID: ${record.id}`, {
                              company: company,
                              companyType: typeof company,
                              companyName: company?.name,
                              companyNameField: record['companyName'],
                              fullRecord: {
                                id: record.id,
                                name: record.name || record.fullName,
                                company: record.company,
                                companyName: record.companyName
                              }
                            });
                            
                            if (typeof company === 'object' && company !== null) {
                              companyName = company.name || company.companyName || company.tradingName || company.legalName || '';
                            } else {
                              companyName = company || record['companyName'] || record['companyName'] || '';
                            }
                            
                            // Additional fallback: try to extract from email domain if no company found
                            if (!companyName || companyName.trim() === '') {
                              const email = record['email'] || record['workEmail'] || '';
                              if (email && email.includes('@')) {
                                const domain = email.split('@')[1];
                                if (domain && !domain.includes('gmail.com') && !domain.includes('yahoo.com') && !domain.includes('hotmail.com')) {
                                  companyName = domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                }
                              }
                            }
                            
                            // Show dash for "Unknown Company" or empty values
                            cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
                            
                            console.log(`🏢 [COMPANY RESULT] Final company name: "${cellContent}"`);
                          }
                        }
                        break;
                      case 'person':
                      case 'name':
                        // For company leads, show company name (now in fullName/name field)
                        // For person leads, show person name
                        if (record['isCompanyLead']) {
                          cellContent = record.name || record.fullName || '-';
                        } else {
                          cellContent = record['fullName'] || `${record['firstName'] || ''} ${record['lastName'] || ''}`.trim() || record.name || '-';
                        }
                        break;
                      case 'state':
                        const state = record['hqState'] || record['state'] || record['location'] || '-';
                        if (state !== '-' && section === 'speedrun') {
                          // Speedrun: Show state with purple pills
                          cellContent = <span className="rounded-full px-4 py-1 text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">{state}</span>;
                        } else {
                          // Other sections: Plain text
                          cellContent = state;
                        }
                        break;
                      case 'title':
                        const title = record['title'] || 
                                     record['jobTitle'] || 
                                     record['position'] || 
                                     record?.customFields?.enrichedData?.overview?.title ||
                                     record?.customFields?.rawData?.active_experience_title;
                        
                        // Show dash for "Unknown Title" or empty values
                        cellContent = (title && title !== 'Unknown Title' && title.trim() !== '') ? title : '-';
                        break;
                      case 'lastaction':
                        // Use pre-formatted lastActionTime from speedrun API if available, or calculate real-time
                        let lastActionTime = record['lastActionTime'] || 'Never';
                        const lastActionText = record['lastAction'] || record['lastActionDescription'] || record['lastContactType'];
                        
                        // If we have a last action date, calculate real-time relative time
                        if (record['lastActionDate'] && lastActionTime !== 'Never') {
                          const lastActionDate = new Date(record['lastActionDate']);
                          const diffMs = currentTime - lastActionDate.getTime();
                          const diffMinutes = Math.floor(diffMs / (1000 * 60));
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          
                          if (diffMinutes < 1) lastActionTime = 'Just now';
                          else if (diffMinutes < 60) lastActionTime = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
                          else if (diffHours < 24) lastActionTime = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                          else if (diffDays < 7) lastActionTime = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
                          else if (diffDays < 30) {
                            const weeks = Math.floor(diffDays / 7);
                            lastActionTime = `${weeks} week${weeks === 1 ? '' : 's'} ago`;
                          } else {
                            const months = Math.floor(diffDays / 30);
                            lastActionTime = `${months} month${months === 1 ? '' : 's'} ago`;
                          }
                        }
                        
                        // If timing is "Never", check if record was just created
                        // Check for empty or placeholder action values
                        const isEmptyAction = !lastActionText || 
                          lastActionText === 'No action' || 
                          lastActionText === '-' || 
                          lastActionText === 'Company record created' || 
                          lastActionText === 'Record created' ||
                          (typeof lastActionText === 'string' && lastActionText.trim() === '');
                        
                        // Debug logging for companies
                        if (section === 'speedrun' && record['recordType'] === 'company') {
                          console.log('🔍 [SPEEDRUN COMPANY] Last Action Debug:', {
                            name: record['name'],
                            lastActionTime,
                            lastActionText,
                            isEmptyAction,
                            createdAt: record['createdAt'],
                            created_at: record['created_at'],
                            recordKeys: Object.keys(record)
                          });
                        }
                        
                        if (lastActionTime === 'Never' || isEmptyAction) {
                          // Check if record has a createdAt date (meaning it exists but has no actions)
                          const recordCreatedAt = record['createdAt'] || record['created_at'];
                          if (recordCreatedAt) {
                            cellContent = 'Record created';
                          } else {
                            // If no createdAt, but timing is Never, still show Record created for records that exist
                            // (records in the table must exist, so if they have no actions, they were created)
                            cellContent = 'Record created';
                          }
                        } else {
                          cellContent = lastActionText;
                        }
                        break;
                      case 'nextaction':
                        // Use pre-formatted nextActionTiming from speedrun API if available
                        const nextActionTime = record['nextActionTiming'] || 'No date set';
                        const nextActionText = record['nextAction'] || record['next_action'];
                        
                        // If timing is "No date set", show dash instead of action text
                        if (nextActionTime === 'No date set' || !nextActionText) {
                          cellContent = '-';
                        } else {
                          cellContent = nextActionText;
                        }
                        break;
                      case 'stage':
                        const stageValue = record['stage'] || record['status'] || '-';
                        if (stageValue !== '-' && section === 'speedrun') {
                          // Speedrun: Show stage with colored pills
                          const stageColors: Record<string, string> = {
                            'LEAD': 'bg-orange-100 text-orange-800 border-orange-200',
                            'PROSPECT': 'bg-blue-100 text-blue-800 border-blue-200',
                            'OPPORTUNITY': 'bg-indigo-100 text-indigo-800 border-indigo-200',
                            'CUSTOMER': 'bg-green-100 text-green-800 border-green-200',
                            'CLIENT': 'bg-green-100 text-green-800 border-green-200',
                            'SUPERFAN': 'bg-purple-100 text-purple-800 border-purple-200'
                          };
                          const colorClass = stageColors[stageValue.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
                          cellContent = <span className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium ${colorClass} border`}>{stageValue}</span>;
                        } else {
                          // Other sections: Plain text
                          cellContent = stageValue;
                        }
                        break;
                      case 'value':
                        cellContent = record['value'] || record['amount'] || record['revenue'] || '-';
                        break;
                      case 'details':
                        // For sellers, show title and department
                        const sellerTitle = record['title'] || record['jobTitle'] || '';
                        const sellerDepartment = record['department'] || '';
                        if (sellerTitle && sellerDepartment) {
                          cellContent = `${sellerTitle} • ${sellerDepartment}`;
                        } else if (sellerTitle) {
                          cellContent = sellerTitle;
                        } else if (sellerDepartment) {
                          cellContent = sellerDepartment;
                        } else {
                          cellContent = 'Sales Team';
                        }
                        break;
                      case 'status':
                        // STATUS column removed for speedrun - skip rendering
                        if (section === 'speedrun') {
                          cellContent = null; // Don't render anything for speedrun
                        } else {
                          // For sellers, show online/offline status with indicator
                          const metadata = record['metadata'] || {};
                          const isOnline = record['isOnline'] || record['status'] === 'online' || metadata['isOnline'] || metadata['status'] === 'online' || record['lastSeen'] || metadata['lastSeen'];
                          const lastSeen = record['lastSeen'] || record['lastActivity'] || metadata['lastSeen'] || metadata['lastActivity'];
                          
                          if (isOnline) {
                            cellContent = 'Online';
                          } else if (lastSeen) {
                            const lastSeenDate = new Date(lastSeen);
                            const now = new Date();
                            const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
                            
                            if (diffHours < 1) {
                              cellContent = 'Online';
                            } else if (diffHours < 24) {
                              cellContent = `Offline (${diffHours}h ago)`;
                            } else {
                              const diffDays = Math.floor(diffHours / 24);
                              cellContent = `Offline (${diffDays}d ago)`;
                            }
                          } else {
                            cellContent = 'Offline';
                          }
                        }
                        break;
                      case 'actions':
                        cellContent = String(record._count?.actions || 0);
                        break;
                      default:
                        cellContent = record[header.toLowerCase()] || record[header] || '-';
                    }
                    
                    return (
                      <td key={headerIndex} className="px-6 py-3 text-sm text-foreground">
                        {(() => {
                          // Skip rendering if cellContent is null (for removed STATUS column in speedrun)
                          if (cellContent === null) {
                            return null;
                          }
                          
                          // Handle both camelCase and spaced versions of headers
                          const headerLower = header.toLowerCase();
                          const isLastAction = headerLower === 'last action' || headerLower === 'lastaction';
                          const isNextAction = headerLower === 'next action' || headerLower === 'nextaction';
                          const isStatus = headerLower === 'status';
                          const shouldShowPill = isLastAction || isNextAction || isStatus;
                          
                          if (shouldShowPill) {
                            let pillData: { text: string; color: string; icon?: string };
                            
                            if (isLastAction) {
                              // Use pre-formatted timing from API
                              const timingText = record['lastActionTime'] || 'Never';
                              pillData = { text: timingText, color: 'bg-hover text-gray-800' };
                            } else if (isNextAction) {
                              // Use pre-formatted timing from API
                              const timingText = record['nextActionTiming'] || 'No date set';
                              pillData = { text: timingText, color: 'bg-hover text-gray-800' };
                            } else if (isStatus) {
                              // Status pill styling - reverted to previous implementation
                              const personStatus = record['status'];
                              let statusColor = 'bg-hover text-gray-800';
                              let statusIcon = '●';
                              
                              if (personStatus && typeof personStatus === 'string' && 
                                  ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CUSTOMER', 'CLIENT', 'PERSON', 'COMPANY', 'Lead', 'Prospect', 'Opportunity', 'Customer', 'Client', 'Person', 'Company'].includes(personStatus)) {
                                // Apply theme colors for lead pipeline status
                                const statusLower = personStatus.toLowerCase();
                                if (statusLower === 'lead' || statusLower === 'new') {
                                  statusColor = 'bg-orange-100 text-orange-800 border border-orange-200'; // Orange theme (leads)
                                } else                                 if (statusLower === 'prospect' || statusLower === 'contacted' || statusLower === 'qualified') {
                                  statusColor = 'bg-blue-100 text-blue-800 border border-blue-200'; // Blue theme (prospects)
                                } else if (statusLower === 'opportunity') {
                                  statusColor = 'bg-indigo-100 text-indigo-800 border border-indigo-200'; // Indigo theme (opportunities)
                                } else if (statusLower === 'customer' || statusLower === 'client') {
                                  statusColor = 'bg-green-50 text-green-700 border border-green-200'; // Green theme (customers)
                                } else if (statusLower === 'person' || statusLower === 'people') {
                                  statusColor = 'bg-violet-50 text-violet-700 border border-violet-200'; // Violet theme (people)
                                } else if (statusLower === 'company' || statusLower === 'companies') {
                                  statusColor = 'bg-slate-50 text-slate-700 border border-slate-200'; // Slate theme (companies)
                                }
                                statusIcon = '●';
                              } else {
                                // For sellers, show online/offline status with indicator
                                const metadata = record['metadata'] || {};
                                const isOnline = record['isOnline'] || record['status'] === 'online' || metadata['isOnline'] || metadata['status'] === 'online' || record['lastSeen'] || metadata['lastSeen'];
                                const lastSeen = record['lastSeen'] || record['lastActivity'] || metadata['lastSeen'] || metadata['lastActivity'];
                                
                                if (isOnline) {
                                  statusColor = 'bg-green-100 text-green-800';
                                  statusIcon = '●';
                                } else if (lastSeen) {
                                  const lastSeenDate = new Date(lastSeen);
                                  const now = new Date();
                                  const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
                                  
                                  if (diffHours < 1) {
                                    statusColor = 'bg-green-100 text-green-800';
                                    statusIcon = '●';
                                  } else if (diffHours < 24) {
                                    statusColor = 'bg-yellow-100 text-yellow-800';
                                    statusIcon = '●';
                                  } else {
                                    statusColor = 'bg-hover text-gray-800';
                                    statusIcon = '●';
                                  }
                                } else {
                                  statusColor = 'bg-hover text-gray-800';
                                  statusIcon = '●';
                                }
                              }
                              
                              pillData = { text: cellContent, color: statusColor, icon: statusIcon };
                            } else {
                              // Fallback - should never happen but satisfies TypeScript
                              pillData = { text: cellContent, color: 'bg-hover text-gray-800', icon: '●' };
                            }
                            
                            return (
                              <div className="flex items-center gap-2">
                                {isStatus ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${pillData.color}`}>
                                    <span className="text-xs">{pillData.icon}</span>
                                    {pillData.text}
                                  </span>
                                ) : (
                                  <>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${pillData.color}`}>
                                      {pillData.text}
                                    </span>
                                    <span className="text-sm text-muted font-normal truncate max-w-32">
                                      {cellContent}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          }
                          
                          // Default rendering for non-pill columns
                          return (
                            <div className="text-sm text-foreground truncate">
                              {cellContent}
                            </div>
                          );
                        })()}
                      </td>
                    );
                  })}
                </tr>
              );
            }), [paginatedData, headers, timestampRefresh, currentTime, section])}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        apiTotalCount={apiTotalCount}
        hasActiveFilters={!!(searchQuery || hookSearchQuery)}
      />
      
      {/* Modals */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          section={section}
          onClose={closeEditModal}
          onSave={handleEdit}
        />
      )}
      
      {addingAction && (
        <CompleteActionModal
          isOpen={!!addingAction}
          onClose={closeAddActionModal}
          onSubmit={handleAddActionSubmit}
          personName={addingAction.name || addingAction.fullName || addingAction.firstName + ' ' + addingAction.lastName || ''}
          companyName={addingAction['company']?.name || addingAction['company'] || ''}
          section={section}
        />
      )}
      
      {viewingRecord && (
        <RecordDetailModal
          record={viewingRecord}
          section={section}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}
