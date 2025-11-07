/**
 * Table row component for pipeline records.
 * Handles individual row rendering and cell content formatting.
 */

import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getStatusColor, getPriorityColor, getStageColor, getStateColor } from '@/platform/utils/statusUtils';
import { getLastActionTime, getSmartNextAction, getHealthStatus, getLeadsNextAction, getSmartLastActionDescription, formatLastActionTime } from '@/platform/utils/actionUtils';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { formatDate } from '@/platform/utils/dateUtils';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { ProfileAvatar, ProfileAvatarGroup } from '@/platform/ui/components/ProfileAvatar';
import { ContextMenu } from './ContextMenu';
import { TableCell } from './TableCell';

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
  [key: string]: any;
}

interface TableRowProps {
  record: PipelineRecord;
  headers: string[];
  section: string;
  index: number;
  workspaceId: string;
  workspaceName: string;
  visibleColumns?: string[];
  currentUserId?: string;
  onRecordClick: (record: PipelineRecord) => void;
  onUpdateRecord?: (recordId: string, field: string, value: string) => Promise<boolean>;
  onDeleteRecord?: (record: PipelineRecord) => void;
  getColumnWidth: (index: number) => string;
}

// -------- Helper Functions --------
function getCleanPersonName(record: PipelineRecord): string {
  // First try firstName + lastName
  if (record['firstName'] && record['lastName']) {
    return `${record['firstName']} ${record['lastName']}`;
  }
  
  // Then try fullName
  if (record['fullName'] && !record['fullName'].includes('Added') && !record['fullName'].includes('Call')) {
    return record['fullName'];
  }
  
  // Try displayName
  if (record['displayName'] && !record['displayName'].includes('Added') && !record['displayName'].includes('Call')) {
    return record['displayName'];
  }
  
  // If record.name contains action log format, extract the person name
  if (record.name && record.name.includes('Added') && record.name.includes('-')) {
    const match = record.name.match(/Added\s+([^-]+)\s+-/);
    if (match) return match[1].trim();
  }
  
  // If record.name contains call instruction format, extract the person name
  if (record.name && record.name.includes('Call') && record.name.includes('at')) {
    const match = record.name.match(/Call\s+([^a]+)\sat/);
    if (match) return match[1].trim();
  }
  
  // Enhanced cleaning for speedrun data - handle various action description formats
  if (record.name && (record.name.includes('Added') || record.name.includes('Call') || record.name.includes('ago'))) {
    // Try to extract name from "Xm ago Added Name - description" format
    const addedMatch = record.name.match(/(\d+[mhd]?\s+ago\s+)?Added\s+([^-]+)\s+-/);
    if (addedMatch) return addedMatch[2].trim();
    
    // Try to extract name from "Call Name at Company" format
    const callMatch = record.name.match(/Call\s+([^a]+)\sat/);
    if (callMatch) return callMatch[1].trim();
    
    // Try to extract name from "Now Call Name at Company" format
    const nowCallMatch = record.name.match(/Now\s+Call\s+([^a]+)\sat/);
    if (nowCallMatch) return nowCallMatch[1].trim();
    
    // Try to extract name from "Today Call Name at Company" format
    const todayCallMatch = record.name.match(/Today\s+Call\s+([^a]+)\sat/);
    if (todayCallMatch) return todayCallMatch[1].trim();
  }
  
  // Use record.name if it doesn't contain action text
  if (record.name && !record.name.includes('Added') && !record.name.includes('Call') && !record.name.includes('-')) {
    return record.name;
  }
  
  return '-';
}

// -------- Main Component --------
export function TableRow({
  record,
  headers,
  section,
  index,
  workspaceId,
  workspaceName,
  visibleColumns,
  currentUserId,
  onRecordClick,
  onUpdateRecord,
  onDeleteRecord,
  getColumnWidth,
}: TableRowProps) {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  // Check if this record is completed (for speedrun section)
  const isCompleted = React.useMemo(() => {
    if (section !== 'speedrun') return false;
    
    // Check if last action was today (same logic as PipelineTableRefactored)
    if (record['lastActionDate']) {
      const lastActionDate = new Date(record['lastActionDate']);
      const today = new Date();
      return lastActionDate.toDateString() === today.toDateString();
    }
    
    // Fallback: check localStorage for done contacts
    if (typeof window !== 'undefined') {
      try {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(`speedrun-done-contacts-${today}`);
        const doneContacts = stored ? JSON.parse(stored) : [];
        return doneContacts.some((contact: any) => contact.id === record.id);
      } catch (error) {
        console.warn('Failed to check completed status:', error);
        return false;
      }
    }
    return false;
  }, [section, record.id, record['lastActionDate']]);

  const handleRowClick = () => {
    // For company leads, navigate to company detail page instead of person detail page
    if (record['isCompanyLead']) {
      // Navigate to company detail page
      window.location.href = `/workspace/companies/${record.id}`;
    } else {
      onRecordClick(record);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Context menu triggered for record:', record.id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDelete = (recordToDelete: PipelineRecord) => {
    onDeleteRecord?.(recordToDelete);
  };

  // Handle placeholder records
  if ((record as any).isPlaceholder) {
    return (
      <tr key={record.id || index} className="h-table-row">
        <td colSpan={headers.length} className="px-6 py-4 text-center">
          <span className="text-sm text-muted">
            {record.name} <span className="font-bold text-foreground cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onRecordClick(record)}>{(record as any).actionText}</span>
          </span>
        </td>
      </tr>
    );
  }

  const displayName = getCleanPersonName(record);

  const commonClasses = "px-6 py-3 whitespace-nowrap text-sm h-full";
  const nameClasses = `${commonClasses} font-medium text-foreground`;
  const textClasses = `${commonClasses} text-foreground`;
  const mutedClasses = `${commonClasses} text-muted`;

  // Render based on section
  if (section === 'leads' || section === 'prospects') {
    return (
      <>
        <tr 
          key={record.id || index} 
          className={`cursor-pointer transition-colors h-table-row border-b relative ${
            isCompleted 
              ? 'bg-green-50/50 border-green-200/50 hover:bg-green-50/70 dark:bg-green-950/20 dark:border-green-900/30 dark:hover:bg-green-950/30' 
              : 'hover:bg-panel-background border-border'
          }`}
          onClick={handleRowClick}
          onContextMenu={handleContextMenu}
           >
        {(() => {
          // Use workspace-specific column order for leads/prospects
          const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
          // Default fallback - exclude rank for leads
          const defaultOrder = section === 'leads' 
            ? ['name', 'company', 'state', 'title', 'email', 'lastAction', 'nextAction']
            : ['rank', 'person', 'state', 'title', 'lastAction', 'nextAction'];
          const logicalOrder = sectionConfig.columnOrder || defaultOrder;
          const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
          
          console.log(`🔍 [TableRow] Column configuration for ${section}:`, {
            workspaceId,
            workspaceName,
            sectionConfig,
            logicalOrder,
            visibleColumns,
            orderedVisibleColumns,
            recordId: record.id
          });
          
          return orderedVisibleColumns.map((column, columnIndex) => {
            if (isColumnHidden(workspaceId, section, column, workspaceName)) return null;
            
            switch (column) {
              case 'rank':
                // 🎯 PER-USER RANKING: Display simple sequential rank for speedrun
                let displayRank;
                let rankValue;
                
                if (section === 'speedrun') {
                  // Check if item is completed (show checkmark instead of rank)
                  if (isCompleted) {
                    // Show checkmark for completed items
                    displayRank = '✓';
                    rankValue = record['globalRank'] || record['rank'] || (index + 1);
                  } else {
                    // For speedrun, use globalRank for editing and display (1-50 per user)
                    rankValue = record['globalRank'] || record['rank'] || (index + 1);
                    
                    // Show actual globalRank (1-50 per user)
                    displayRank = record['globalRank'] || record['rank'] || (index + 1);
                    
                    // Add defensive check to prevent showing record IDs
                    if (typeof displayRank !== 'number' || displayRank > 1000) {
                      console.warn(`⚠️ [SPEEDRUN RANK] Suspicious rank value detected:`, {
                        displayRank,
                        recordId: record.id,
                        globalRank: record['globalRank'],
                        rank: record['rank'],
                        index
                      });
                      displayRank = index + 1; // Force sequential ranking
                    }
                  }
                } else {
                  // For other sections, keep hierarchical ranking if available
                  const companyRank = record['companyRank'] || record['company']?.rank || 0;
                  const personRank = record['personRank'] || record['rank'] || (index + 1);
                  const globalRank = record['globalPersonRank'] || record['rank'] || (index + 1);
                  
                  rankValue = globalRank;
                  
                  if (companyRank > 0) {
                    // Show "Company Rank: Person Rank" format
                    displayRank = `${companyRank}:${personRank}`;
                  } else {
                    // Fallback to global rank
                    displayRank = globalRank;
                  }
                }
                
                return (
                  <TableCell
                    key="rank"
                    value={rankValue?.toString() || displayRank?.toString() || ''}
                    field="globalRank"
                    recordId={record.id}
                    recordType={section}
                    onUpdate={onUpdateRecord}
                    className={textClasses}
                  />
                );
              case 'company':
                // Handle both string company names and company objects
                let companyName = '';
                
                // For companies section, the record itself IS the company, so use record.name
                if (section === 'companies' as any) {
                  companyName = record.name || record['companyName'] || '-';
                } else {
                  // For company leads (isCompanyLead flag), show the company name
                  if (record['isCompanyLead']) {
                    // For company leads, company is now a string, not an object
                    companyName = typeof record['company'] === 'string' 
                      ? record['company'] 
                      : record['company']?.name || record['companyName'] || '-';
                  } else {
                    // For other sections (leads, prospects, etc.), look for company field
                    // First try to get company from various fields
                    if (typeof record['company'] === 'string' && record['company'] && record['company'].trim()) {
                      companyName = record['company'];
                    } else if (record['company']?.name) {
                      companyName = record['company'].name;
                    } else if (record['companyName']) {
                      companyName = record['companyName'];
                    } else {
                      // If no company data is available, show a dash
                      companyName = '-';
                    }
                    
                    // Make sure we're not showing the person's name as company name
                    const personName = record.name || record['fullName'] || `${record['firstName'] || ''} ${record['lastName'] || ''}`.trim();
                    if (companyName === personName) {
                      companyName = '-';
                    }
                  }
                }
                
                const truncatedName = companyName.length > 10 ? companyName.substring(0, 10) + '...' : companyName;
                
                const handleCompanyClick = (e: React.MouseEvent) => {
                  e.stopPropagation(); // Prevent row click
                  if (companyName && companyName !== '-') {
                    // Navigate to company record
                    window.location.href = `/workspace/companies?search=${encodeURIComponent(companyName)}`;
                  }
                };
                
                return (
                  <td key="company" className={textClasses}>
                    <div className="truncate max-w-20" title={companyName}>
                      {companyName && companyName !== '-' ? (
                        <button
                          onClick={handleCompanyClick}
                          className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline cursor-pointer transition-colors"
                        >
                          {truncatedName}
                        </button>
                      ) : (
                        <span className="text-muted">{truncatedName}</span>
                      )}
                    </div>
                  </td>
                );
              case 'person':
              case 'name':
                // For company leads, show company name (now in fullName/name field)
                // For person leads, show displayName
                const nameValue = record['isCompanyLead'] 
                  ? (record.name || record.fullName || '-')
                  : displayName;
                return (
                  <TableCell
                    key="name"
                    value={nameValue}
                    field="name"
                    recordId={record.id}
                    recordType={section}
                    className={nameClasses}
                    onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
                  />
                );
              case 'state':
                return (
                  <TableCell
                    key="state"
                    value={record.hqState || record.state || record.company?.hqState || record.company?.state || '-'}
                    field="state"
                    recordId={record.id}
                    recordType={section}
                    className={textClasses}
                    onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
                  />
                );
              case 'title':
                return (
                  <TableCell
                    key="title"
                    value={record['title'] || 
                           record['jobTitle'] || 
                           record?.['customFields']?.enrichedData?.overview?.title ||
                           record?.['customFields']?.rawData?.active_experience_title ||
                           '-'}
                    field="title"
                    recordId={record.id}
                    recordType={section}
                    className={textClasses}
                    onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
                  />
                );
              case 'actions':
                return (
                  <td key="actions" className={textClasses}>
                    <div className="text-right">
                      {record._count?.actions || 0}
                    </div>
                  </td>
                );
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="text-sm text-green-600 font-normal truncate max-w-32">
                          Action completed
                        </span>
                      ) : (
                        (() => {
                          const nextAction = getLeadsNextAction(record, index);
                          return (
                            <span className="text-sm text-muted font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Use API-provided lastActionTime if available (from speedrun/section APIs)
                        const lastActionTime = record['lastActionTime'];
                        const actionText = record['lastAction'] || record['lastActionDescription'] || 'No action';
                        
                        let timing;
                        if (lastActionTime) {
                          // API already calculated timing with meaningful action filtering
                          timing = { 
                            text: lastActionTime, 
                            color: 'bg-hover text-gray-800' 
                          };
                        } else {
                          // Fallback: calculate from date (legacy support)
                          const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                          timing = getRealtimeActionTiming(lastActionDate);
                        }
                        
                        // If timing is "Never" or no actionText, check if record was just created
                        let displayText = '-';
                        // Check for empty or placeholder action values
                        const isEmptyAction = !actionText || 
                          actionText === 'No action' || 
                          actionText === '-' || 
                          actionText === 'Company record created' || 
                          actionText === 'Record created' ||
                          (typeof actionText === 'string' && actionText.trim() === '');
                        
                        if (timing.text === 'Never' || isEmptyAction) {
                          // Check if record has a createdAt date (meaning it exists but has no actions)
                          const recordCreatedAt = record['createdAt'] || record['created_at'];
                          if (recordCreatedAt) {
                            displayText = 'Record just created';
                          }
                        } else {
                          displayText = actionText;
                        }
                        
                        return (
                          <span className="text-sm text-muted font-normal truncate max-w-32">
                            {displayText}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                );
              case 'owner':
              case 'mainSeller':
                return (
                  <td key="mainSeller" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const mainSellerData = record['mainSellerData'] || record['ownerData'];
                        console.log('🔍 [TableRow] MainSeller data:', {
                          hasMainSellerData: !!mainSellerData,
                          mainSellerData,
                          mainSellerText: record['mainSeller'] || record['owner']
                        });
                        
                        return mainSellerData ? (
                          <div>
                            <ProfileAvatar
                              name={mainSellerData?.name}
                              firstName={mainSellerData?.firstName}
                              lastName={mainSellerData?.lastName}
                              email={mainSellerData?.email}
                              profilePictureUrl={mainSellerData?.profilePictureUrl || undefined}
                              size="sm"
                              showAsMe={true}
                              currentUserId={currentUserId}
                              userId={mainSellerData?.id}
                            />
                            {/* Debug indicator */}
                            <span className="text-xs text-red-500 ml-1">AV</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">NO DATA</span>
                        );
                      })()}
                      <span className="text-sm text-foreground truncate max-w-24">
                        {record['mainSeller'] || record['owner'] || '-'}
                      </span>
                    </div>
                  </td>
                );
              case 'coSellers':
                return (
                  <td key="coSellers" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const coSellersData = record['coSellersData'];
                        console.log('🔍 [TableRow] CoSellers data:', {
                          hasCoSellersData: !!coSellersData,
                          coSellersDataLength: coSellersData?.length || 0,
                          coSellersData,
                          coSellersText: record['coSellers']
                        });
                        
                        return coSellersData && coSellersData.length > 0 ? (
                          <div>
                            <ProfileAvatarGroup
                              users={coSellersData.map((coSeller: any) => ({
                                name: coSeller.user?.name,
                                firstName: coSeller.user?.firstName,
                                lastName: coSeller.user?.lastName,
                                email: coSeller.user?.email,
                                profilePictureUrl: coSeller.user?.profilePictureUrl || undefined,
                                userId: coSeller.user?.id,
                              }))}
                              maxVisible={2}
                              size="sm"
                              showAsMe={true}
                              currentUserId={currentUserId}
                            />
                            {/* Debug indicator */}
                            <span className="text-xs text-red-500 ml-1">AVG</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">NO COS</span>
                        );
                      })()}
                      <span className="text-sm text-foreground truncate max-w-24">
                        {record['coSellers'] && record['coSellers'] !== '-' ? record['coSellers'] : '-'}
                      </span>
                    </div>
                  </td>
                );
              default:
                return null;
            }
          });
        })()}
        </tr>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            record={record}
            section={section}
            onClose={handleCloseContextMenu}
            onDelete={handleDelete}
          />
        )}
      </>
    );
  }

  // Opportunities section rendering
  if (section === 'opportunities') {
    return (
      <>
        <tr 
          key={record.id || index} 
          className="cursor-pointer transition-colors hover:bg-panel-background h-table-row border-b border-border"
          onClick={handleRowClick}
          onContextMenu={handleContextMenu}
        >
        {(() => {
          // Use workspace-specific column order for opportunities
          const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
          const logicalOrder = sectionConfig.columnOrder || ['rank', 'company', 'stage', 'value', 'lastAction', 'nextAction'];
          const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
          
          return orderedVisibleColumns.map((column, columnIndex) => {
            if (isColumnHidden(workspaceId, section, column, workspaceName)) return null;
            
            switch (column) {
              case 'rank':
                const rank = record['rank'] || record['winningScore']?.rank || (index + 1);
                return (
                  <td key="rank" className={textClasses}>
                    <div className="text-left font-medium">
                      <div className="text-sm font-semibold">{rank}</div>
                    </div>
                  </td>
                );
              case 'company':
              case 'account':
                let companyName = '';
                if (typeof record['company'] === 'string' && record['company'] && record['company'].trim()) {
                  companyName = record['company'];
                } else if (record['company']?.name) {
                  companyName = record['company'].name;
                } else if (record['account']?.name) {
                  companyName = record['account'].name;
                } else if (record['companyName']) {
                  companyName = record['companyName'];
                } else {
                  companyName = '-';
                }
                
                const truncatedName = companyName.length > 10 ? companyName.substring(0, 10) + '...' : companyName;
                return (
                  <td key="company" className={textClasses}>
                    <div className="truncate max-w-20" title={companyName}>
                      {truncatedName}
                    </div>
                  </td>
                );
              case 'name':
                return (
                  <TableCell
                    key="name"
                    value={record['name'] || record['opportunityName'] || '-'}
                    field="name"
                    recordId={record.id}
                    recordType={section}
                    className={nameClasses}
                    onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
                  />
                );
              case 'state':
                return (
                  <td key="state" className={textClasses}>
                    <span className={`rounded-full px-4 py-1 text-xs font-medium whitespace-nowrap ${getStateColor(record['state'] || record['hqState'])}`}>
                      {record['state'] || record['hqState'] || '-'}
                    </span>
                  </td>
                );
              case 'stage':
                return (
                  <td key="stage" className={textClasses}>
                    <span className={`rounded-full px-4 py-1 text-xs font-medium whitespace-nowrap ${getStageColor(record['stage'] || record['status'])}`}>
                      {record['stage'] || record['status'] || '-'}
                    </span>
                  </td>
                );
              case 'value':
              case 'amount':
              case 'revenue':
                const value = record['value'] || record['amount'] || record['revenue'] || record['dealValue'];
                return (
                  <td key="value" className={textClasses}>
                    <div className="truncate max-w-32">
                      {value ? `$${value.toLocaleString()}` : '-'}
                    </div>
                  </td>
                );
              case 'probability':
                const probability = record['probability'] || record['closeProbability'];
                return (
                  <td key="probability" className={textClasses}>
                    <div className="truncate max-w-32">
                      {probability ? `${probability}%` : '-'}
                    </div>
                  </td>
                );
              case 'closeDate':
              case 'close date':
                const closeDate = record['closeDate'] || record['expectedCloseDate'];
                return (
                  <td key="closeDate" className={textClasses}>
                    <div className="truncate max-w-32">
                      {closeDate ? formatDate(closeDate) : '-'}
                    </div>
                  </td>
                );
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="text-sm text-green-600 font-normal truncate max-w-32">
                          Action completed
                        </span>
                      ) : (
                        (() => {
                          const nextAction = getLeadsNextAction(record, index);
                          return (
                            <span className="text-sm text-muted font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Use API-provided lastActionTime if available (from speedrun/section APIs)
                        const lastActionTime = record['lastActionTime'];
                        const actionText = record['lastAction'] || record['lastActionDescription'] || 'No action';
                        
                        let timing;
                        if (lastActionTime) {
                          // API already calculated timing with meaningful action filtering
                          timing = { 
                            text: lastActionTime, 
                            color: 'bg-hover text-gray-800' 
                          };
                        } else {
                          // Fallback: calculate from date (legacy support)
                          const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                          timing = getRealtimeActionTiming(lastActionDate);
                        }
                        
                        // If timing is "Never" or no actionText, check if record was just created
                        let displayText = '-';
                        // Check for empty or placeholder action values
                        const isEmptyAction = !actionText || 
                          actionText === 'No action' || 
                          actionText === '-' || 
                          actionText === 'Company record created' || 
                          actionText === 'Record created' ||
                          (typeof actionText === 'string' && actionText.trim() === '');
                        
                        if (timing.text === 'Never' || isEmptyAction) {
                          // Check if record has a createdAt date (meaning it exists but has no actions)
                          const recordCreatedAt = record['createdAt'] || record['created_at'];
                          if (recordCreatedAt) {
                            displayText = 'Record just created';
                          }
                        } else {
                          displayText = actionText;
                        }
                        
                        return (
                          <span className="text-sm text-muted font-normal truncate max-w-32">
                            {displayText}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                );
              default:
                return null;
            }
          });
        })()}
        </tr>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            record={record}
            section={section}
            onClose={handleCloseContextMenu}
            onDelete={handleDelete}
          />
        )}
      </>
    );
  }

  // People section rendering
  if (section === 'people') {
    return (
      <>
        <tr 
          key={record.id || index} 
          className="cursor-pointer transition-colors hover:bg-panel-background h-table-row border-b border-border"
          onClick={handleRowClick}
          onContextMenu={handleContextMenu}
        >
        {(() => {
          // Use workspace-specific column order for people
          const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
          const logicalOrder = sectionConfig.columnOrder || ['rank', 'name', 'company', 'title', 'lastAction', 'nextAction'];
          const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
          
          return orderedVisibleColumns.map((column, columnIndex) => {
            if (isColumnHidden(workspaceId, section, column, workspaceName)) return null;
            
            switch (column) {
              case 'rank':
                const companyRank = record['companyRank'] || record['company']?.rank || 0;
                const personRank = record['personRank'] || record['rank'] || (index + 1);
                const globalRank = record['globalPersonRank'] || record['rank'] || (index + 1);
                
                let displayRank;
                if (companyRank > 0) {
                  displayRank = `${companyRank}:${personRank}`;
                } else {
                  displayRank = globalRank;
                }
                
                return (
                  <td key="rank" className={textClasses}>
                    <div className="text-left font-medium">
                      <div className="text-sm font-semibold">{displayRank}</div>
                      {companyRank > 0 && (
                        <div className="text-xs text-muted">
                          Company #{companyRank}
                        </div>
                      )}
                    </div>
                  </td>
                );
              case 'company':
                let companyName = '';
                if (typeof record['company'] === 'string' && record['company'] && record['company'].trim()) {
                  companyName = record['company'];
                } else if (record['company']?.name) {
                  companyName = record['company'].name;
                } else if (record['companyName']) {
                  companyName = record['companyName'];
                } else {
                  companyName = '-';
                }
                
                const truncatedName = companyName.length > 10 ? companyName.substring(0, 10) + '...' : companyName;
                return (
                  <td key="company" className={textClasses}>
                    <div className="truncate max-w-20" title={companyName}>
                      {truncatedName}
                    </div>
                  </td>
                );
              case 'person':
              case 'name':
                return (
                  <TableCell
                    key="name"
                    value={displayName}
                    field="name"
                    recordId={record.id}
                    recordType={section}
                    className={nameClasses}
                    onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
                  />
                );
              case 'title':
                return (
                  <TableCell
                    key="title"
                    value={record['title'] || 
                           record['jobTitle'] || 
                           record?.['customFields']?.enrichedData?.overview?.title ||
                           record?.['customFields']?.rawData?.active_experience_title ||
                           '-'}
                    field="title"
                    recordId={record.id}
                    recordType={section}
                    className={textClasses}
                    onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
                  />
                );
              case 'actions':
                return (
                  <td key="actions" className={textClasses}>
                    <div className="text-right">
                      {record._count?.actions || 0}
                    </div>
                  </td>
                );
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="text-sm text-green-600 font-normal truncate max-w-32">
                          Action completed
                        </span>
                      ) : (
                        (() => {
                          const nextAction = getLeadsNextAction(record, index);
                          return (
                            <span className="text-sm text-muted font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Use API-provided lastActionTime if available (from speedrun/section APIs)
                        const lastActionTime = record['lastActionTime'];
                        const actionText = record['lastAction'] || record['lastActionDescription'] || 'No action';
                        
                        let timing;
                        if (lastActionTime) {
                          // API already calculated timing with meaningful action filtering
                          timing = { 
                            text: lastActionTime, 
                            color: 'bg-hover text-gray-800' 
                          };
                        } else {
                          // Fallback: calculate from date (legacy support)
                          const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                          timing = getRealtimeActionTiming(lastActionDate);
                        }
                        
                        // If timing is "Never" or no actionText, check if record was just created
                        let displayText = '-';
                        // Check for empty or placeholder action values
                        const isEmptyAction = !actionText || 
                          actionText === 'No action' || 
                          actionText === '-' || 
                          actionText === 'Company record created' || 
                          actionText === 'Record created' ||
                          (typeof actionText === 'string' && actionText.trim() === '');
                        
                        if (timing.text === 'Never' || isEmptyAction) {
                          // Check if record has a createdAt date (meaning it exists but has no actions)
                          const recordCreatedAt = record['createdAt'] || record['created_at'];
                          if (recordCreatedAt) {
                            displayText = 'Record just created';
                          }
                        } else {
                          displayText = actionText;
                        }
                        
                        return (
                          <span className="text-sm text-muted font-normal truncate max-w-32">
                            {displayText}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                );
              default:
                return null;
            }
          });
        })()}
        </tr>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            record={record}
            section={section}
            onClose={handleCloseContextMenu}
            onDelete={handleDelete}
          />
        )}
      </>
    );
  }

  // Companies section rendering
  if (section === 'companies') {
    return (
      <>
        <tr 
          key={record.id || index} 
          className="cursor-pointer transition-colors hover:bg-panel-background h-table-row border-b border-border"
          onClick={handleRowClick}
          onContextMenu={handleContextMenu}
        >
        {(() => {
          // Use workspace-specific column order for companies
          const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
          const logicalOrder = sectionConfig.columnOrder || ['rank', 'company', 'industry', 'status', 'lastAction', 'nextAction'];
          const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
          
          return orderedVisibleColumns.map((column, columnIndex) => {
            if (isColumnHidden(workspaceId, section, column, workspaceName)) return null;
            
            switch (column) {
              case 'rank':
                const rank = record['rank'] || record['companyRank'] || (index + 1);
                return (
                  <td key="rank" className={textClasses}>
                    <div className="text-left font-medium">
                      <div className="text-sm font-semibold">{rank}</div>
                    </div>
                  </td>
                );
              case 'company':
                const companyName = record.name || record['companyName'] || '-';
                const truncatedName = companyName.length > 10 ? companyName.substring(0, 10) + '...' : companyName;
                return (
                  <td key="company" className={textClasses}>
                    <div className="truncate max-w-20" title={companyName}>
                      {truncatedName}
                    </div>
                  </td>
                );
              case 'industry':
                return (
                  <td key="industry" className={textClasses}>
                    <div className="truncate max-w-32">
                      {record['industry'] || record['company']?.industry || '-'}
                    </div>
                  </td>
                );
              case 'status':
                return (
                  <td key="status" className={textClasses}>
                    <span className={`rounded-full px-4 py-1 text-xs font-medium whitespace-nowrap ${getStatusColor(record['status'] || record['stage'])}`}>
                      {record['status'] || record['stage'] || '-'}
                    </span>
                  </td>
                );
              case 'arr':
                const arr = record['arr'] || record['annualRecurringRevenue'];
                return (
                  <td key="arr" className={textClasses}>
                    <div className="truncate max-w-32">
                      {arr ? `$${arr.toLocaleString()}` : '-'}
                    </div>
                  </td>
                );
              case 'healthScore':
              case 'health score':
                const healthScore = record['healthScore'] || record['health'];
                return (
                  <td key="healthScore" className={textClasses}>
                    <div className="truncate max-w-32">
                      {healthScore ? `${healthScore}%` : '-'}
                    </div>
                  </td>
                );
              case 'actions':
                return (
                  <td key="actions" className={textClasses}>
                    <div className="text-right">
                      {record._count?.actions || 0}
                    </div>
                  </td>
                );
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="text-sm text-green-600 font-normal truncate max-w-32">
                          Action completed
                        </span>
                      ) : (
                        (() => {
                          const nextAction = getLeadsNextAction(record, index);
                          return (
                            <span className="text-sm text-muted font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Use API-provided lastActionTime if available (from speedrun/section APIs)
                        const lastActionTime = record['lastActionTime'];
                        const actionText = record['lastAction'] || record['lastActionDescription'] || 'No action';
                        
                        let timing;
                        if (lastActionTime) {
                          // API already calculated timing with meaningful action filtering
                          timing = { 
                            text: lastActionTime, 
                            color: 'bg-hover text-gray-800' 
                          };
                        } else {
                          // Fallback: calculate from date (legacy support)
                          const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                          timing = getRealtimeActionTiming(lastActionDate);
                        }
                        
                        // If timing is "Never" or no actionText, check if record was just created
                        let displayText = '-';
                        // Check for empty or placeholder action values
                        const isEmptyAction = !actionText || 
                          actionText === 'No action' || 
                          actionText === '-' || 
                          actionText === 'Company record created' || 
                          actionText === 'Record created' ||
                          (typeof actionText === 'string' && actionText.trim() === '');
                        
                        if (timing.text === 'Never' || isEmptyAction) {
                          // Check if record has a createdAt date (meaning it exists but has no actions)
                          const recordCreatedAt = record['createdAt'] || record['created_at'];
                          if (recordCreatedAt) {
                            displayText = 'Record just created';
                          }
                        } else {
                          displayText = actionText;
                        }
                        
                        return (
                          <span className="text-sm text-muted font-normal truncate max-w-32">
                            {displayText}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                );
              default:
                return null;
            }
          });
        })()}
        </tr>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            record={record}
            section={section}
            onClose={handleCloseContextMenu}
            onDelete={handleDelete}
          />
        )}
      </>
    );
  }

  // Default rendering for other sections (including speedrun if not handled above)
    return (
      <>
        <tr
          className={`cursor-pointer transition-colors h-table-row border-b relative ${
            section === 'speedrun' && isCompleted 
              ? 'bg-green-50/50 border-green-200/50 hover:bg-green-50/70 dark:bg-green-950/20 dark:border-green-900/30 dark:hover:bg-green-950/30' 
              : 'hover:bg-panel-background border-border'
          }`}
          onClick={handleRowClick}
          onContextMenu={handleContextMenu}
        >
      {headers.map((header, index) => {
        // Handle rank column specially for speedrun to show checkmark
        if (section === 'speedrun' && header.toLowerCase() === 'rank') {
          const isCompleted = (() => {
            if (record['lastActionDate']) {
              const lastActionDate = new Date(record['lastActionDate']);
              const today = new Date();
              return lastActionDate.toDateString() === today.toDateString();
            }
            return false;
          })();
          
          const displayValue = isCompleted ? '✓' : String(record['globalRank'] || record['rank'] || record['winningScore']?.rank || '-');
          
          return (
            <TableCell
              key={`${record.id}-${header}`}
              value={displayValue}
              field="globalRank"
              recordId={record.id}
              recordType={section}
              className={textClasses}
              onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
            />
          );
        }
        
        const value = String(record[header.toLowerCase()] || record[header] || '-');
        return (
          <TableCell
            key={`${record.id}-${header}`}
            value={value}
            field={header.toLowerCase()}
            recordId={record.id}
            recordType={section}
            className={textClasses}
            onUpdate={onUpdateRecord || (() => Promise.resolve(false))}
          />
        );
      })}
        </tr>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            record={record}
            section={section}
            onClose={handleCloseContextMenu}
            onDelete={handleDelete}
          />
        )}
      </>
    );
}
