/**
 * Table row component for pipeline records.
 * Handles individual row rendering and cell content formatting.
 */

import React from 'react';
import { ActionMenu } from '@/platform/ui/components/ActionMenu';
import { getStatusColor, getPriorityColor, getStageColor } from '@/platform/utils/statusUtils';
import { getLastActionTime, getSmartNextAction, getHealthStatus } from '@/platform/utils/actionUtils';
import { formatDate } from '@/platform/utils/dateUtils';

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
  onRecordClick: (record: PipelineRecord) => void;
  onEdit: (record: PipelineRecord) => void;
  onAddAction: (record: PipelineRecord) => void;
  onMarkComplete: (record: PipelineRecord) => void;
  onDelete: (record: PipelineRecord) => void;
  onCall: (record: PipelineRecord) => void;
  onEmail: (record: PipelineRecord) => void;
  getColumnWidth: (index: number) => string;
}

// -------- Helper Functions --------
function formatCellContent(header: string, record: PipelineRecord): React.ReactNode {
  const value = record[header.toLowerCase()] || record[header] || '';
  
  switch (header) {
    case 'Status':
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
          {record.status || 'Unknown'}
        </span>
      );
      
    case 'Priority':
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(record.priority)}`}>
          {record.priority || 'Medium'}
        </span>
      );
      
    case 'Stage':
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(record.stage)}`}>
          {record.stage || 'Unknown'}
        </span>
      );
      
    case 'Last Action':
      const lastActionTime = getLastActionTime(record);
      return (
        <div className="text-sm text-gray-900">
          {lastActionTime}
        </div>
      );
      
    case 'Next Action':
      const nextAction = getSmartNextAction(record);
      return (
        <div className="flex flex-col space-y-1">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${nextAction.timingColor}`}>
            {nextAction.timing}
          </span>
          <span className="text-sm text-gray-900">
            {nextAction.action}
          </span>
        </div>
      );
      
    case 'Health':
      const healthStatus = getHealthStatus(record);
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${healthStatus.color}`}>
          {healthStatus.text}
        </span>
      );
      
    case 'Created':
      return record.createdAt ? formatDate(record.createdAt) : 'Unknown';
      
    case 'Updated':
      return record.updatedAt ? formatDate(record.updatedAt) : 'Unknown';
      
    default:
      return (
        <div className="text-sm text-gray-900 truncate">
          {String(value)}
        </div>
      );
  }
}

// -------- Main Component --------
export function TableRow({
  record,
  headers,
  onRecordClick,
  onEdit,
  onAddAction,
  onMarkComplete,
  onDelete,
  onCall,
  onEmail,
  getColumnWidth,
}: TableRowProps) {
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on action menu
    if ((e.target as HTMLElement).closest('.action-menu')) {
      return;
    }
    onRecordClick(record);
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer border-b border-gray-200"
      onClick={handleRowClick}
    >
      {headers.map((header, index) => {
        const isActionColumn = header === 'Actions';
        
        return (
          <td
            key={`${record.id}-${header}`}
            className="px-4 py-3 text-sm"
            style={{ width: getColumnWidth(index) }}
          >
            {isActionColumn ? (
              <div className="action-menu">
                <ActionMenu
                  onEdit={() => onEdit(record)}
                  onAddAction={() => onAddAction(record)}
                  onMarkComplete={() => onMarkComplete(record)}
                  onDelete={() => onDelete(record)}
                  onCall={() => onCall(record)}
                  onEmail={() => onEmail(record)}
                />
              </div>
            ) : (
              formatCellContent(header, record)
            )}
          </td>
        );
      })}
    </tr>
  );
}
