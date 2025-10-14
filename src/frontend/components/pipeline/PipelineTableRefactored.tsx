/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/usePipelineData';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { getLeadsNextAction } from '@/platform/utils/actionUtils';
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
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime === 'Today') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime === 'Yesterday') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime.includes('days ago') && parseInt(lastActionTime) <= 3) {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime.includes('days ago') && parseInt(lastActionTime) <= 7) {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime.includes('weeks ago') || lastActionTime.includes('months ago')) {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    }
  }
  
  // Fallback: Calculate timing from date
  const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
  const timing = getRealtimeActionTiming(lastActionDate);
  return { ...timing, color: 'bg-[var(--hover)] text-gray-800' };
}

function getNextActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's nextActionTiming field directly
  const nextActionTiming = record['nextActionTiming'];
  
  if (nextActionTiming) {
    // All timing pills now use light gray color
    if (nextActionTiming === 'Overdue') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'Today') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'Tomorrow') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'This week') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'Next week') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'This month') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'Future') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'No date set') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    }
  }
  
  // Fallback: For next actions, we need to calculate timing based on when the next action should happen
  const nextActionDate = record['nextActionDate'] || record['nextContactDate'];
  if (!nextActionDate) {
    return { text: 'No date set', color: 'bg-[var(--hover)] text-gray-800' };
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  let result;
  if (diffDays < 0) {
    result = { text: 'Overdue', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays === 0) {
    result = { text: 'Today', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays === 1) {
    result = { text: 'Tomorrow', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 7) {
    result = { text: 'This week', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 14) {
    result = { text: 'Next week', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 30) {
    result = { text: 'This month', color: 'bg-[var(--hover)] text-gray-800' };
  } else {
    result = { text: 'Future', color: 'bg-[var(--hover)] text-gray-800' };
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
      'speedrun': ['Rank', 'Company', 'Person', 'Stage', 'Last Action', 'Next Action']
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
  console.log('🔍 [PipelineTableRefactored] Component rendered for section:', section, 'visibleColumns:', visibleColumns, 'data length:', data?.length, 'isLoading:', isLoading);
  console.log('🔍 [PipelineTableRefactored] Sample data:', data?.slice(0, 2));
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
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
    setCurrentPage,
    setSortField,
    setSortDirection,
  } = usePipelineData({ 
    data, 
    pageSize,
    disableSorting: section === 'companies' || section === 'people' || section === 'leads' || section === 'prospects', // Disable sorting for companies, people, leads, and prospects to preserve API ranking
    searchQuery, // Pass search query to hook
    totalCount // Pass totalCount for correct pagination
  });
  
  console.log('🔍 [PipelineTableRefactored] usePipelineData results:', {
    inputDataLength: data?.length,
    paginatedDataLength: paginatedData?.length,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    section,
    disableSorting: section === 'companies',
    sampleRanks: paginatedData?.slice(0, 5).map(r => ({ name: r.name, rank: (r as any)['rank'] }))
  });
  
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
      console.log('Record updated:', record);
    },
    onRecordDelete: (recordId) => {
      // Handle record deletion
      console.log('Record deleted:', recordId);
    },
    onActionAdd: (recordId, action) => {
      // Handle action addition
      console.log('Action added to record:', recordId, action);
    }
  });
  
  // Modal state
  const [editingRecord, setEditingRecord] = useState<PipelineRecord | null>(null);
  const [addingAction, setAddingAction] = useState<PipelineRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PipelineRecord | null>(null);
  
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
      <div className="bg-[var(--background)] border border-[var(--border)] flex flex-col relative rounded-md" style={{ height: `${tableHeight}px` }}>
        <div className="flex-1 overflow-auto min-h-0 middle-panel-scroll">
          <table className="w-full">
            <TableHeader
              headers={headers}
              sortField={sortField}
              sortDirection={sortDirection}
              onColumnSort={onColumnSort}
            />
            <tbody>
              <tr className="border-b border-[var(--border)] hover:bg-[var(--panel-background)]">
                <td colSpan={visibleColumns?.length || 6} className="px-6 py-16 text-center">
                  <div className="text-[var(--muted)]">
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
      <div className="bg-[var(--background)] border border-[var(--border)] flex flex-col relative rounded-md" style={{ height: `${tableHeight}px` }}>
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
            {paginatedData.map((record, index) => {
              console.log(`🔍 [PipelineTableRefactored] Rendering row ${index}:`, {
                recordId: record.id,
                recordName: record.name || record['fullName'],
                recordCompany: record['company'],
                recordRank: (record as any)['rank'],
                headersLength: headers.length,
                visibleColumnsLength: visibleColumns?.length,
                // Show first 10 keys
                recordKeys: Object.keys(record).slice(0, 10),
                // DEBUG: Check headers and action fields
                headers: headers,
                headersString: headers.join(', '),
                lastActionTime: record['lastActionTime'],
                nextActionTiming: record['nextActionTiming'],
                section: section
              });
              
              // Simple table row for debugging
              return (
                  <tr
                    key={record.id}
                    className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
                    onClick={() => onRecordClick(record)}
                  >
                  {headers.map((header, headerIndex) => {
                    let cellContent = '';
                    
                    // DEBUG: Log header processing
                    console.log(`🔍 [HEADER PROCESSING] Header ${headerIndex}: "${header}" (lowercase: "${header.toLowerCase()}")`);
                    
                    // Simple cell content mapping
                    switch (header.toLowerCase()) {
                      case 'rank':
                        // 🏆 HIERARCHICAL RANKING: Display company rank and person rank
                        const companyRank = record['companyRank'] || record['company']?.rank || 0;
                        const personRank = record['personRank'] || record['rank'] || 0;
                        const globalRank = record['globalPersonRank'] || record['rank'] || (currentPage - 1) * pageSize + index + 1;
                        
                        // Display hierarchical ranking based on section
                        let displayRank;
                        if (section === 'people' && companyRank > 0) {
                          // Show "Company Rank: Person Rank" format
                          displayRank = `${companyRank}:${personRank}`;
                        } else if (section === 'speedrun' && companyRank > 0) {
                          // Show "Company Rank: Person Rank" format for speedrun
                          displayRank = `${companyRank}:${personRank}`;
                        } else {
                          // Fallback to global rank
                          displayRank = globalRank;
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
                          // For other sections (leads, prospects, etc.), look for company field
                          const company = record['company'];
                          let companyName = '';
                          
                          if (typeof company === 'object' && company !== null) {
                            companyName = company.name || company.companyName || '';
                          } else {
                            companyName = company || record['companyName'] || '';
                          }
                          
                          // Show dash for "Unknown Company" or empty values
                          cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
                        }
                        break;
                      case 'person':
                      case 'name':
                        cellContent = record['fullName'] || `${record['firstName'] || ''} ${record['lastName'] || ''}`.trim() || record.name || '-';
                        break;
                      case 'state':
                        cellContent = record['state'] || record['status'] || record['location'] || '-';
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
                      case 'last action':
                        // Format last action with timing badge and description
                        const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                        const lastTiming = getRealtimeActionTiming(lastActionDate);
                        const lastActionText = record['lastActionDescription'] || record['lastAction'] || record['lastContactType'] || '-';
                        cellContent = `${lastTiming.text} | ${lastActionText}`;
                        break;
                      case 'next action':
                        // Format next action with timing badge and description
                        const nextAction = getLeadsNextAction(record, index);
                        cellContent = `${nextAction.timing} | ${nextAction.action}`;
                        break;
                      case 'stage':
                        cellContent = record['stage'] || record['status'] || '-';
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
                        // Check if this is a lead/person status (LEAD, PROSPECT, OPPORTUNITY, etc.)
                        const personStatus = record['status'];
                        if (personStatus && typeof personStatus === 'string' && 
                            ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CUSTOMER', 'CLIENT', 'Lead', 'Prospect', 'Opportunity', 'Customer', 'Client'].includes(personStatus)) {
                          // Display lead pipeline status
                          cellContent = personStatus;
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
                      default:
                        cellContent = record[header.toLowerCase()] || record[header] || '-';
                    }
                    
                    return (
                      <td key={headerIndex} className="px-6 py-3 text-sm text-[var(--foreground)]">
                        {(() => {
                          // Handle both camelCase and spaced versions of headers
                          const headerLower = header.toLowerCase();
                          const isLastAction = headerLower === 'last action' || headerLower === 'lastaction';
                          const isNextAction = headerLower === 'next action' || headerLower === 'nextaction';
                          const isStatus = headerLower === 'status';
                          const shouldShowPill = isLastAction || isNextAction || isStatus;
                          
                          console.log(`🔍 [PILL CHECK] Header: "${header}", lowercase: "${headerLower}", isLastAction: ${isLastAction}, isNextAction: ${isNextAction}, isStatus: ${isStatus}, shouldShowPill: ${shouldShowPill}`);
                          console.log(`🔍 [PILL CHECK] cellContent: "${cellContent}", record status: "${record['status']}", lastActionTime: "${record['lastActionTime']}", nextActionTiming: "${record['nextActionTiming']}"`);
                          
                          if (shouldShowPill) {
                            let pillData: { text: string; color: string; icon?: string };
                            
                            if (isLastAction) {
                              pillData = getLastActionTiming(record);
                            } else if (isNextAction) {
                              pillData = getNextActionTiming(record);
                            } else if (isStatus) {
                              // Status pill styling - reverted to previous implementation
                              const personStatus = record['status'];
                              let statusColor = 'bg-[var(--hover)] text-gray-800';
                              let statusIcon = '●';
                              
                              if (personStatus && typeof personStatus === 'string' && 
                                  ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CUSTOMER', 'CLIENT', 'PERSON', 'COMPANY', 'Lead', 'Prospect', 'Opportunity', 'Customer', 'Client', 'Person', 'Company'].includes(personStatus)) {
                                // Apply theme colors for lead pipeline status
                                const statusLower = personStatus.toLowerCase();
                                if (statusLower === 'lead' || statusLower === 'new') {
                                  statusColor = 'bg-orange-50 text-orange-700 border border-orange-200'; // Orange theme (leads)
                                } else if (statusLower === 'prospect' || statusLower === 'contacted' || statusLower === 'qualified') {
                                  statusColor = 'bg-blue-50 text-blue-700 border border-blue-200'; // Blue theme (prospects)
                                } else if (statusLower === 'opportunity') {
                                  statusColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200'; // Indigo theme (opportunities)
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
                                    statusColor = 'bg-[var(--hover)] text-gray-800';
                                    statusIcon = '●';
                                  }
                                } else {
                                  statusColor = 'bg-[var(--hover)] text-gray-800';
                                  statusIcon = '●';
                                }
                              }
                              
                              pillData = { text: cellContent, color: statusColor, icon: statusIcon };
                            } else {
                              // Fallback - should never happen but satisfies TypeScript
                              pillData = { text: cellContent, color: 'bg-[var(--hover)] text-gray-800', icon: '●' };
                            }
                            
                            console.log(`🔍 [PILL RENDERING] Pill data for ${header}:`, pillData);
                            
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
                                    <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                                      {cellContent}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          }
                          
                          // Default rendering for non-pill columns
                          return (
                            <div className="text-sm text-[var(--foreground)] truncate">
                              {cellContent}
                            </div>
                          );
                        })()}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
      />
      
      {/* Modals */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          section={section}
          onClose={closeEditModal}
          onSave={handleEditRecord}
        />
      )}
      
      {addingAction && (
        <CompleteActionModal
          isOpen={!!addingAction}
          onClose={closeAddActionModal}
          onSubmit={handleAddActionSubmit}
          personName={addingAction.name || addingAction['fullName'] || ''}
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
