/**
 * Table row component for pipeline records.
 * Handles individual row rendering and cell content formatting.
 */

import React from 'react';
import { ActionMenu } from '@/platform/ui/components/ActionMenu';
import { getStatusColor, getPriorityColor, getStageColor } from '@/platform/utils/statusUtils';
import { getLastActionTime, getSmartNextAction, getHealthStatus, getLeadsNextAction, getSmartLastActionDescription, formatLastActionTime } from '@/platform/utils/actionUtils';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { formatDate } from '@/platform/utils/dateUtils';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';

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
  onRecordClick: (record: PipelineRecord) => void;
  onEdit: (record: PipelineRecord) => void;
  onAddAction: (record: PipelineRecord) => void;
  onMarkComplete: (record: PipelineRecord) => void;
  onDelete: (record: PipelineRecord) => void;
  onCall: (record: PipelineRecord) => void;
  onEmail: (record: PipelineRecord) => void;
  onSchedule?: (record: PipelineRecord) => void;
  onQuickAction?: (record: PipelineRecord) => void;
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
  
  return 'Unknown';
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
  onRecordClick,
  onEdit,
  onAddAction,
  onMarkComplete,
  onDelete,
  onCall,
  onEmail,
  onSchedule,
  onQuickAction,
  getColumnWidth,
}: TableRowProps) {
  const handleRowClick = () => {
    onRecordClick(record);
  };

  // Handle placeholder records
  if ((record as any).isPlaceholder) {
    return (
      <tr key={record.id || index} className="h-16">
        <td colSpan={headers.length} className="px-6 py-4 text-center">
          <span className="text-sm text-gray-600">
            {record.name} <span className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onRecordClick(record)}>{(record as any).actionText}</span>
          </span>
        </td>
      </tr>
    );
  }

  const displayName = getCleanPersonName(record);

  const commonClasses = "px-6 py-3 whitespace-nowrap text-sm h-full";
  const nameClasses = `${commonClasses} font-medium text-gray-900`;
  const textClasses = `${commonClasses} text-gray-900`;
  const mutedClasses = `${commonClasses} text-gray-500`;

  // Render based on section
  if (section === 'leads' || section === 'prospects') {
    return (
         <tr 
           key={record.id || index} 
           className="cursor-pointer transition-colors hover:bg-gray-50 h-16 border-b border-gray-200"
           onClick={handleRowClick}
         >
        {(() => {
          // Use workspace-specific column order for leads/prospects
          const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
          const logicalOrder = sectionConfig.columnOrder || ['rank', 'person', 'state', 'title', 'lastAction', 'nextAction', 'actions'];
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
                        <div className="text-xs text-gray-500">
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
                    <div className="truncate max-w-32">{record['state'] || record['location'] || 'State'}</div>
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
                            <span className="text-sm text-gray-600 font-normal truncate max-w-32">
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
                            <span className="text-sm text-gray-600 font-normal truncate max-w-32">
                              {actionText}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                );
              case 'actions':
                return (
                  <td key="actions" className="px-2 py-4 whitespace-nowrap w-10 text-center">
                    <div className="flex justify-center">
                      <ActionMenu
                        record={record}
                        recordType={section === 'leads' ? 'lead' : section === 'prospects' ? 'prospect' : section as any}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onView={(record) => onRecordClick(record)}
                        onCall={onCall}
                        onSchedule={onSchedule}
                        onQuickAction={onQuickAction}
                        onAddAction={onAddAction}
                        className="z-10"
                      />
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
         className="cursor-pointer transition-colors hover:bg-gray-50 h-16 border-b border-gray-200"
         onClick={handleRowClick}
       >
      {headers.map((header, index) => {
        const isActionColumn = header === 'Actions';
        
        return (
          <td
            key={`${record.id}-${header}`}
            className={isActionColumn ? "px-2 py-4 whitespace-nowrap w-10 text-center" : textClasses}
            style={{ width: getColumnWidth(index) }}
          >
            {isActionColumn ? (
              <div className="flex justify-center">
                <ActionMenu
                  record={record}
                  recordType={section === 'leads' ? 'lead' : section === 'prospects' ? 'prospect' : section as any}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={(record) => onRecordClick(record)}
                  onCall={onCall}
                  onSchedule={onSchedule}
                  onQuickAction={onQuickAction}
                  onAddAction={onAddAction}
                  className="z-10"
                />
              </div>
            ) : (
              <div className="text-sm text-gray-900 truncate">
                {String(record[header.toLowerCase()] || record[header] || header)}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}
