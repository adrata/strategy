/**
 * Table row component for pipeline records.
 * Handles individual row rendering and cell content formatting.
 */

import React from 'react';
import { getStatusColor, getPriorityColor, getStageColor } from '@/platform/utils/statusUtils';
import { getLastActionTime, getSmartNextAction, getHealthStatus, getLeadsNextAction, getSmartLastActionDescription, formatLastActionTime } from '@/platform/utils/actionUtils';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { formatDate } from '@/platform/utils/dateUtils';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { ProfileAvatar, ProfileAvatarGroup } from '@/platform/ui/components/ProfileAvatar';

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
  getColumnWidth,
}: TableRowProps) {
  const handleRowClick = () => {
    onRecordClick(record);
  };

  // Handle placeholder records
  if ((record as any).isPlaceholder) {
    return (
      <tr key={record.id || index} className="h-table-row">
        <td colSpan={headers.length} className="px-6 py-4 text-center">
          <span className="text-sm text-[var(--muted)]">
            {record.name} <span className="font-bold text-[var(--foreground)] cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onRecordClick(record)}>{(record as any).actionText}</span>
          </span>
        </td>
      </tr>
    );
  }

  const displayName = getCleanPersonName(record);

  const commonClasses = "px-6 py-3 whitespace-nowrap text-sm h-full";
  const nameClasses = `${commonClasses} font-medium text-[var(--foreground)]`;
  const textClasses = `${commonClasses} text-[var(--foreground)]`;
  const mutedClasses = `${commonClasses} text-[var(--muted)]`;

  // Render based on section
  if (section === 'leads' || section === 'prospects') {
    return (
           <tr 
             key={record.id || index} 
             className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
             onClick={handleRowClick}
           >
        {(() => {
          // Use workspace-specific column order for leads/prospects
          const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
          const logicalOrder = sectionConfig.columnOrder || ['rank', 'person', 'state', 'title', 'lastAction', 'nextAction'];
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
                // 🏆 HIERARCHICAL RANKING: Display company rank and person rank
                const companyRank = record['companyRank'] || record['company']?.rank || 0;
                const personRank = record['personRank'] || record['rank'] || (index + 1);
                const globalRank = record['globalPersonRank'] || record['rank'] || (index + 1);
                
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
                
                return (
                  <td key="rank" className={textClasses}>
                    <div className="text-left font-medium">
                      <div className="text-sm font-semibold">{displayRank}</div>
                      {companyRank > 0 && (
                        <div className="text-xs text-[var(--muted)]">
                          Company #{companyRank}
                        </div>
                      )}
                    </div>
                  </td>
                );
              case 'company':
                // Handle both string company names and company objects
                let companyName = '';
                
                // For companies section, the record itself IS the company, so use record.name
                if (section === 'companies' as any) {
                  companyName = record.name || record['companyName'] || '-';
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
                  <td key="name" className={nameClasses}>
                    <div className="truncate max-w-32">{displayName}</div>
                  </td>
                );
              case 'state':
                return (
                  <td key="state" className={textClasses}>
                    <div className="truncate max-w-32">{record['state'] || record['location'] || '-'}</div>
                  </td>
                );
              case 'title':
                return (
                  <td key="title" className={textClasses}>
                    <div className="truncate max-w-32">
                      {record['title'] || 
                       record['jobTitle'] || 
                       record?.['customFields']?.enrichedData?.overview?.title ||
                       record?.['customFields']?.rawData?.active_experience_title ||
                       '-'}
                    </div>
                  </td>
                );
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const nextAction = getLeadsNextAction(record, index);
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${nextAction.timingColor}`}>
                              {nextAction.timing}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                        const timing = getRealtimeActionTiming(lastActionDate);
                        const actionText = record['lastAction'] || record['lastActionDescription'] || 'No action';
                        
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${timing.color}`}>
                              {timing.text}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {actionText}
                            </span>
                          </>
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
                      <span className="text-sm text-[var(--foreground)] truncate max-w-24">
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
                      <span className="text-sm text-[var(--foreground)] truncate max-w-24">
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
    );
  }

  // Opportunities section rendering
  if (section === 'opportunities') {
    return (
      <tr 
        key={record.id || index} 
        className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
        onClick={handleRowClick}
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
                  <td key="name" className={nameClasses}>
                    <div className="truncate max-w-32">{record['name'] || record['opportunityName'] || '-'}</div>
                  </td>
                );
              case 'stage':
                return (
                  <td key="stage" className={textClasses}>
                    <div className="truncate max-w-32">
                      {record['stage'] || record['status'] || '-'}
                    </div>
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
                      {(() => {
                        const nextAction = getLeadsNextAction(record, index);
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${nextAction.timingColor}`}>
                              {nextAction.timing}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                        const timing = getRealtimeActionTiming(lastActionDate);
                        const actionText = record['lastAction'] || record['lastActionDescription'] || '-';
                        
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${timing.color}`}>
                              {timing.text}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {actionText}
                            </span>
                          </>
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
    );
  }

  // People section rendering
  if (section === 'people') {
    return (
      <tr 
        key={record.id || index} 
        className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
        onClick={handleRowClick}
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
                        <div className="text-xs text-[var(--muted)]">
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
                  <td key="name" className={nameClasses}>
                    <div className="truncate max-w-32">{displayName}</div>
                  </td>
                );
              case 'title':
                return (
                  <td key="title" className={textClasses}>
                    <div className="truncate max-w-32">
                      {record['title'] || 
                       record['jobTitle'] || 
                       record?.['customFields']?.enrichedData?.overview?.title ||
                       record?.['customFields']?.rawData?.active_experience_title ||
                       '-'}
                    </div>
                  </td>
                );
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const nextAction = getLeadsNextAction(record, index);
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${nextAction.timingColor}`}>
                              {nextAction.timing}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                        const timing = getRealtimeActionTiming(lastActionDate);
                        const actionText = record['lastAction'] || record['lastActionDescription'] || '-';
                        
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${timing.color}`}>
                              {timing.text}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {actionText}
                            </span>
                          </>
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
    );
  }

  // Companies section rendering
  if (section === 'companies') {
    return (
      <tr 
        key={record.id || index} 
        className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
        onClick={handleRowClick}
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
                    <div className="truncate max-w-32">
                      {record['status'] || record['stage'] || '-'}
                    </div>
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
              case 'nextAction':
                return (
                  <td key="nextAction" className={textClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const nextAction = getLeadsNextAction(record, index);
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${nextAction.timingColor}`}>
                              {nextAction.timing}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {nextAction.action}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                );
              case 'lastAction':
                return (
                  <td key="lastAction" className={mutedClasses}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
                        const timing = getRealtimeActionTiming(lastActionDate);
                        const actionText = record['lastAction'] || record['lastActionDescription'] || '-';
                        
                        return (
                          <>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${timing.color}`}>
                              {timing.text}
                            </span>
                            <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                              {actionText}
                            </span>
                          </>
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
    );
  }

  // Default rendering for other sections
    return (
         <tr
           className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
           onClick={handleRowClick}
         >
      {headers.map((header, index) => {
        return (
          <td
            key={`${record.id}-${header}`}
            className={textClasses}
            style={{ width: getColumnWidth(index) }}
          >
            <div className="text-sm text-[var(--foreground)] truncate">
              {String(record[header.toLowerCase()] || record[header] || header)}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
