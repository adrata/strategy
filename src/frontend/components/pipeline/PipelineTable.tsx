"use client";

/**
 * 🚀 SIMPLIFIED PIPELINE TABLE
 * 
 * Clean table component that handles all pipeline sections
 * with proper TypeScript safety and performance optimization.
 */

import React, { useState } from 'react';
// Removed deleted PipelineDataStore - using unified data system
import { ActionMenu } from '@/platform/ui/components/ActionMenu';
import { EditRecordModal } from './EditRecordModal';
import { AddActionModal, ActionLogData } from './AddActionModal';
import { RecordDetailModal } from './RecordDetailModal';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';


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

interface PipelineTableProps {
  section: string;
  data: PipelineRecord[];
  onRecordClick: (record: PipelineRecord) => void;
  onReorderRecords?: (fromIndex: number, toIndex: number) => void;
  onColumnSort?: (columnName: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  visibleColumns?: string[];
  pageSize?: number; // Add pagination support
}

// Federal Holiday Detection and Dynamic Goal Calculations
const FEDERAL_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-10-13', // Columbus Day
  '2025-11-11', // Veterans Day
  '2025-11-27', // Thanksgiving Day
  '2025-12-25', // Christmas Day
];

// Check if a date is a federal holiday
function isFederalHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return FEDERAL_HOLIDAYS_2025.includes(dateString);
}

// Check if a date is a weekend or federal holiday
function isNonWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  return isWeekend || isFederalHoliday(date);
}

// Get next working day (skip weekends and holidays)
function getNextWorkingDay(startDate: Date): Date {
  let nextDay = new Date(startDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (isNonWorkingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

// Calculate working days in a week (Monday to Friday, excluding holidays)
function getWorkingDaysInWeek(startDate: Date): number {
  let workingDays = 0;
  const weekStart = new Date(startDate);
  
  // Find Monday of the current week
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  
  // Check each day from Monday to Friday
  for (let i = 0; i < 5; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);
    
    if (!isNonWorkingDay(checkDate)) {
      workingDays++;
    }
  }
  
  return workingDays;
}

// Calculate dynamic goals based on working days
function getDynamicGoals(): { daily: number; weekly: number; weeklyWorkingDays: number } {
  const today = new Date();
  const workingDaysThisWeek = getWorkingDaysInWeek(today);
  
  // Base goal is 50 per day, 250 per week (5 days)
  const baseDailyGoal = 50;
  const baseWeeklyGoal = 250;
  
  // Adjust weekly goal based on working days
  const adjustedWeeklyGoal = Math.round((baseWeeklyGoal / 5) * workingDaysThisWeek);
  
  return {
    daily: baseDailyGoal,
    weekly: adjustedWeeklyGoal,
    weeklyWorkingDays: workingDaysThisWeek
  };
}

// Get proper timing considering federal holidays
function getWorkingDayTiming(baseTiming: string, isWeekend: boolean): string {
  if (isWeekend) {
    return 'Tuesday'; // Next working day after weekend
  }
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (isFederalHoliday(tomorrow)) {
    return 'Tuesday'; // Skip holiday
  }
  
  return baseTiming;
}

export function PipelineTable({ section, data, onRecordClick, onReorderRecords, onColumnSort, sortField, sortDirection, visibleColumns, pageSize = 50 }: PipelineTableProps) {
  console.log('🔍 [PipelineTable] Component rendered for section:', section, 'visibleColumns:', visibleColumns);
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addActionModalOpen, setAddActionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PipelineRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);
  


  // Modal handlers
  const handleEdit = (record: PipelineRecord) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  const handleAddAction = (record: PipelineRecord) => {
    setSelectedRecord(record);
    setAddActionModalOpen(true);
  };

  const handleMarkComplete = (record: PipelineRecord) => {
    // Mark record as complete - could update status or move to completed section
    console.log('Mark as complete:', record);
    // TODO: Implement mark complete functionality
  };

  const handleDelete = (record: PipelineRecord) => {
    if (confirm(`Are you sure you want to delete ${record['fullName'] || record.name}?`)) {
      console.log('Delete:', record);
      // TODO: Implement delete functionality
    }
  };

  const handleCall = (record: PipelineRecord) => {
    const phone = (record as any).phone || (record as any).workPhone || (record as any).mobilePhone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      console.log('No phone number available for:', record['fullName'] || record.name);
    }
  };

  const handleSchedule = (record: PipelineRecord) => {
    console.log('Schedule follow-up for:', record);
    // TODO: Implement scheduling functionality
  };

  const handleConvert = (record: PipelineRecord) => {
    console.log('Convert to opportunity:', record);
    // TODO: Implement conversion functionality
  };

  const handleQuickAction = (record: PipelineRecord, action: string) => {
    console.log('Quick action:', action, 'for:', record);
    // TODO: Implement quick action functionality
  };


  const handleSaveEdit = async (updatedRecord: any) => {
    setIsSubmitting(true);
    try {
      console.log('🔄 [PIPELINE-TABLE] Saving record:', updatedRecord);
      
      if (!selectedRecord) {
        throw new Error('No record selected for editing');
      }
      
      // Determine record type from section
      const recordType = section === 'speedrun' ? 'prospects' : section;
      
      // Prepare update data with proper field mapping
      const updatePayload: Record<string, any> = {};
      
      // Map common fields with TypeScript safety
      if (updatedRecord.name) {
        const nameParts = updatedRecord.name.trim().split(' ');
        updatePayload['firstName'] = nameParts[0] || '';
        updatePayload['lastName'] = nameParts.slice(1).join(' ') || '';
        updatePayload['fullName'] = updatedRecord.name.trim();
      }
      if (updatedRecord.firstName) updatePayload['firstName'] = updatedRecord.firstName;
      if (updatedRecord.lastName) updatePayload['lastName'] = updatedRecord.lastName;
      if (updatedRecord.fullName) updatePayload['fullName'] = updatedRecord.fullName;
      if (updatedRecord.email) updatePayload['email'] = updatedRecord.email;
      if (updatedRecord.phone) updatePayload['phone'] = updatedRecord.phone;
      if (updatedRecord.title) updatePayload['jobTitle'] = updatedRecord.title;
      if (updatedRecord.jobTitle) updatePayload['jobTitle'] = updatedRecord.jobTitle;
      if (updatedRecord.company) updatePayload['company'] = updatedRecord.company;
      if (updatedRecord.status) updatePayload['status'] = updatedRecord.status;
      if (updatedRecord.priority) updatePayload['priority'] = updatedRecord.priority;
      if (updatedRecord.notes) updatePayload['notes'] = updatedRecord.notes;
      if (updatedRecord.industry) updatePayload['industry'] = updatedRecord.industry;
      if (updatedRecord.linkedin) updatePayload['linkedin'] = updatedRecord.linkedin;
      
      // Make API call to update the record
      const apiEndpoint = `/api/data/${recordType}/${selectedRecord.id}`;
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update record');
      }
      
      const result = await response.json();
      console.log('✅ [PIPELINE-TABLE] Record updated successfully:', result);
      
      setEditModalOpen(false);
      setSelectedRecord(null);
      
      // TODO: Refresh the data to show updated record
      // This might require calling a parent refresh function
      
    } catch (error) {
      console.error('❌ [PIPELINE-TABLE] Error saving record:', error);
      alert(`Failed to save record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAction = async (actionData: ActionLogData) => {
    if (!selectedRecord) return;
    
    setIsSubmitting(true);
    try {
      // Save action log using the existing API
      const response = await fetch('/api/speedrun/action-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: selectedRecord.id,
          personName: selectedRecord['fullName'] || selectedRecord.name || 'Unknown',
          actionType: actionData.actionType,
          notes: actionData.notes,
          nextAction: actionData.nextAction,
          nextActionDate: actionData.nextActionDate,
          workspaceId: 'default', // TODO: Get from context
          userId: 'default', // TODO: Get from context
          actionPerformedBy: actionData.actionPerformedBy || 'default',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save action log');
      }

      console.log('Action logged successfully');
      setAddActionModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error saving action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get column widths to ensure alignment between header and body
  const getColumnWidth = (index: number): string => {
    const headers = getTableHeaders();
    
    // Define precise column widths based on content and section
    switch (section) {
      case 'leads':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '140px'; // Company
          case 2: return '140px'; // Person (Name)
          case 3: return '100px'; // State
          case 4: return '140px'; // Title
          case 5: return '220px'; // Last Action
          case 6: return '200px'; // Next Action
          case 7: return '32px';  // Actions
          default: return 'auto';
        }
      case 'prospects':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '140px'; // Company
          case 2: return '140px'; // Person (Name)
          case 3: return '100px'; // State
          case 4: return '140px'; // Title
          case 5: return '220px'; // Last Action
          case 6: return '200px'; // Next Action
          case 7: return '32px';  // Actions
          default: return 'auto';
        }
      case 'speedrun':
        switch (index) {
          case 0: return '40px';  // Rank (narrower)
          case 1: return '140px'; // Company
          case 2: return '120px'; // Person
          case 3: return '140px'; // Title
          case 4: return '120px'; // Role
          case 5: return '100px'; // Stage
          case 6: return '200px'; // Last Action (wider for pill + text)
          case 7: return '160px'; // Next Action
          case 8: return '32px';  // Actions
          default: return 'auto';
        }
      case 'opportunities':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '180px'; // Name
          case 2: return '160px'; // Account
          case 3: return '120px'; // Amount
          case 4: return '120px'; // Stage
          case 5: return '80px';  // Probability
          case 6: return '100px'; // Close Date
          case 7: return '120px'; // Last Action
          case 8: return '140px'; // Next Action
          case 9: return '32px';  // Actions
          default: return 'auto';
        }
      case 'companies':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '200px'; // Account
          case 2: return '160px'; // Location (new column)
          case 3: return '120px'; // Contacts
          case 4: return '220px'; // Last Action (increased for status pill + text)
          case 5: return '120px'; // Next Action
          case 6: return '32px';  // Actions
          default: return 'auto';
        }
      case 'people':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '160px'; // Company
          case 2: return '140px'; // Person
          case 3: return '140px'; // Title
          case 4: return '120px'; // Role
          case 5: return '220px'; // Last Action
          case 6: return '200px'; // Next Action
          case 7: return '32px';  // Actions
          default: return 'auto';
        }
      case 'people':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '160px'; // Account (Company)
          case 2: return '140px'; // Contact (Name)
          case 3: return '140px'; // Title
          case 4: return '220px'; // Last Action (increased for status pill + text)
          case 5: return '120px'; // Next Action
          case 6: return '32px';  // Actions
          default: return 'auto';
        }
      case 'clients':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '200px'; // Company
          case 2: return '120px'; // Industry
          case 3: return '100px'; // Status
          case 4: return '120px'; // ARR
          case 5: return '100px'; // Health Score
          case 6: return '120px'; // Last Action
          case 7: return '140px'; // Next Action
          case 8: return '32px';  // Actions
          default: return 'auto';
        }
      case 'partners':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '200px'; // Partner
          case 2: return '120px'; // Type
          case 3: return '120px'; // Relationship
          case 4: return '100px'; // Strength
          case 5: return '120px'; // Last Action
          case 6: return '140px'; // Next Action
          case 7: return '32px';  // Actions
          default: return 'auto';
        }
      case 'sellers':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '200px'; // Company
          case 2: return '160px'; // Name
          case 3: return '140px'; // Title
          case 4: return '220px'; // Last Action
          case 5: return '32px';  // Actions
          default: return 'auto';
        }
      case 'people':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '160px'; // Company
          case 2: return '140px'; // Title
          case 3: return '120px'; // Role
          case 4: return '220px'; // Last Action
          case 5: return '160px'; // Next Action
          case 6: return '32px';  // Actions
          default: return 'auto';
        }
      case 'companies':
        switch (index) {
          case 0: return '60px';  // Rank
          case 1: return '200px'; // Company
          case 2: return '220px'; // Last Action
          case 3: return '160px'; // Next Action
          case 4: return '32px';  // Actions
          default: return 'auto';
        }
      default:
        // For other sections, use equal distribution
        return `${100 / headers.length}%`;
    }
  };
  
  // Get table headers based on section - optimized for each record type with workspace-specific configuration
  const getTableHeaders = (): string[] => {
    console.log('🔍 [PipelineTable] Getting headers for section:', section, 'visibleColumns:', visibleColumns, 'workspace:', workspaceName);
    
    // Get workspace-specific column configuration
    const sectionConfig = getSectionColumns(workspaceId, section, workspaceName);
    
    // Define all possible columns for each section (fallback)
    const allColumns: Record<string, string[]> = {
      'leads': ['Rank', 'Company', 'Person', 'Title', 'Role', 'Last Action', 'Next Action', 'Actions'],
      'prospects': ['Rank', 'Company', 'Person', 'Title', 'Role', 'Last Action', 'Next Action', 'Actions'],
      'opportunities': ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action', 'Next Action', 'Actions'],
      'accounts': ['Rank', 'Company', 'Location', 'Last Action', 'Next Action', 'Actions'],
      'companies': ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'],
      'people': ['Rank', 'Company', 'Title', 'Role', 'Last Action', 'Next Action'],
      'contacts': ['Rank', 'Name', 'Title', 'Company', 'Email', 'Phone', 'Last Action', 'Next Action', 'Actions'],
      'clients': ['Rank', 'Company', 'Industry', 'Status', 'ARR', 'Health Score', 'Last Action', 'Next Action', 'Actions'],
      'partners': ['Rank', 'Partner', 'Type', 'Relationship', 'Strength', 'Last Action', 'Next Action', 'Actions'],
        'sellers': ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Actions'],
      'speedrun': ['Rank', 'Company', 'Person', 'Title', 'Role', 'Stage', 'Last Action', 'Next Action', 'Actions']
    };

    // Use workspace-specific columns if available, otherwise fallback to default
    const defaultColumns = sectionConfig.columns || allColumns[section] || ['Rank', 'Name', 'Details', 'Status', 'Last Action', 'Next Action', 'Actions'];
    
    // If visibleColumns is provided, filter the columns
    if (visibleColumns && visibleColumns.length > 0) {
      // Map column values to header labels
      const columnMap: Record<string, string> = {
        'rank': 'Rank',
        'company': 'Company',
        'state': 'State',
        'location': 'State',
        'name': 'Person',
        'person': 'Person',
        'title': 'Title',
        'role': 'Role',
        'buyerGroupRole': 'Role',
        'lastAction': 'Last Action',
        'nextAction': 'Next Action',
        'status': 'Stage',
        'priority': 'Priority',
        'email': 'Email',
        'phone': 'Phone',
        'industry': 'Industry',
        'size': 'Size',
        'revenue': 'Revenue',
        'contacts': 'Contacts',
        'account': 'Account',
        'amount': 'Amount',
        'stage': 'Stage',
        'probability': 'Probability',
        'closeDate': 'Close Date',
        'arr': 'ARR',
        'healthScore': 'Health Score',
        'partner': 'Partner',
        'type': 'Type',
        'relationship': 'Relationship',
        'strength': 'Strength',
        'actions': 'Actions'
      };
      
      // Use workspace-specific column order if available, otherwise use default logical order
      const defaultLogicalOrder: Record<string, string[]> = {
        'leads': ['rank', 'company', 'person', 'title', 'role', 'lastAction', 'nextAction', 'actions'],
        'prospects': ['rank', 'company', 'person', 'title', 'role', 'lastAction', 'nextAction', 'actions'],
        'opportunities': ['rank', 'name', 'account', 'amount', 'stage', 'probability', 'closeDate', 'lastAction', 'actions'],
        'accounts': ['rank', 'company', 'location', 'lastAction', 'nextAction', 'actions'],
        'companies': ['rank', 'company', 'lastAction', 'nextAction', 'actions'],
        'people': ['rank', 'company', 'person', 'title', 'role', 'lastAction', 'nextAction', 'actions'],
        'contacts': ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions'],
        'clients': ['rank', 'company', 'industry', 'status', 'arr', 'healthScore', 'lastAction', 'actions'],
        'partners': ['rank', 'partner', 'type', 'relationship', 'strength', 'lastAction', 'actions'],
        'sellers': ['rank', 'company', 'name', 'title', 'lastAction', 'actions'],
        'speedrun': ['rank', 'person', 'stage', 'lastAction', 'nextAction', 'actions']
      };
      
      const sectionOrder = sectionConfig.columnOrder || defaultLogicalOrder[section] || ['rank', 'name', 'details', 'status', 'lastAction', 'nextAction', 'actions'];
      
      // Filter visible columns and maintain logical order
      const orderedVisibleColumns = sectionOrder.filter(col => visibleColumns.includes(col));
      
      return orderedVisibleColumns
        .map(col => columnMap[col])
        .filter(Boolean) as string[];
    }
    
    return defaultColumns;
  };


  // Render table row based on section
  const renderTableRow = (record: PipelineRecord, index: number) => {
    const recordId = record.id || `${index}`;
    
    // Handle placeholder records
    if ((record as any).isPlaceholder) {
      return (
        <tr key={record.id || index} className="h-16">
          <td colSpan={getTableHeaders().length} className="px-6 py-4 text-center">
            <span className="text-sm text-gray-600">
              {record.name} <span className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onRecordClick(record)}>{(record as any).actionText}</span>
            </span>
          </td>
        </tr>
      );
    }
    
    const handleRowClick = () => {
      // For all sections including speedrun, call the onRecordClick prop to handle navigation
      onRecordClick(record);
    };
    
    // Get display name - prioritize actual person names over role titles
    // CRITICAL FIX: Extract person name from action log format if needed
    const getCleanPersonName = () => {
      // First try firstName + lastName
      if (record['firstName'] && record['lastName']) {
        return `${record['firstName']} ${record['lastName']}`;
      }
      
      // Then try fullName
      if (record['fullName'] && !record['fullName'].includes('Added') && !record['fullName'].includes('Call')) {
        return record['fullName'];
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
    };
    
    const displayName = getCleanPersonName();

    const commonClasses = "px-6 py-3 whitespace-nowrap text-sm h-full";
    const nameClasses = `${commonClasses} font-medium text-gray-900`;
    const textClasses = `${commonClasses} text-gray-900`;
    const mutedClasses = `${commonClasses} text-gray-500`;

    switch (section) {
      case 'leads':
        return (
          <tr 
            key={record.id || index} 
            className="cursor-pointer transition-colors hover:bg-gray-50 h-16"
            onClick={handleRowClick}
          >
            {(() => {
              // Use workspace-specific column order for leads
              const sectionConfig = getSectionColumns(workspaceId, 'leads', workspaceName);
              const logicalOrder = sectionConfig.columnOrder || ['rank', 'person', 'state', 'title', 'lastAction', 'nextAction', 'actions'];
              const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
              
              return orderedVisibleColumns.map(column => {
                if (isColumnHidden(workspaceId, 'leads', column, workspaceName)) return null; // Hide column if configured
                
                switch (column) {
                                     case 'rank':
                     return (
                       <td key="rank" className={textClasses}>
                         <div className="text-left font-medium">{index + 1}</div>
            </td>
                     );
                  case 'company':
                    return (
                      <td key="company" className={textClasses}>
                        <div className="truncate max-w-32">{record['company']?.name || record['companyName'] || record['company'] || '-'}</div>
                      </td>
                    );
                  case 'person':
                    return (
                      <td key="person" className={nameClasses}>
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
                        <div className="truncate max-w-32">{record['title'] || record['jobTitle'] || '-'}</div>
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
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
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
                            const health = getHealthStatus(record);
                            const leadName = record.name || record['fullName'] || 'this lead';
                            
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                  {health.text}
              </span>
                                <span className="text-sm text-gray-600 font-normal">
                                  {health['status'] === 'never' 
                                    ? `${leadName} not yet contacted` 
                                    : (() => {
                                        const actionDescription = getSmartLastActionDescription(record, health.status);
                                        const timing = formatLastActionTime(record);
                                        // Only append timing if it's not "Never" and we have a real timing
                                        return timing && timing !== 'Never' 
                                          ? `${actionDescription} ${timing}`
                                          : actionDescription;
                                      })()
                                  }
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
                             recordType="lead"
                             onEdit={handleEdit}
                             onDelete={handleDelete}
                             onView={(record) => onRecordClick(record)}
                             onCall={handleCall}
                             onSchedule={handleSchedule}
                             onQuickAction={handleQuickAction}
                             onAddAction={handleAddAction}
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

      case 'prospects':
        return (
          <tr 
            key={record.id || index} 
            className="cursor-pointer transition-colors hover:bg-gray-50 h-16"
            onClick={handleRowClick}
          >
            {(() => {
              // Use workspace-specific column order for prospects
              const sectionConfig = getSectionColumns(workspaceId, 'prospects', workspaceName);
              const logicalOrder = sectionConfig.columnOrder || ['rank', 'person', 'state', 'title', 'lastAction', 'nextAction', 'actions'];
              const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
              
              return orderedVisibleColumns.map(column => {
                if (isColumnHidden(workspaceId, 'prospects', column, workspaceName)) return null; // Hide column if configured
                
                switch (column) {
                  case 'rank':
                    return (
                      <td key="rank" className={textClasses}>
                        <div className="text-left font-medium">{index + 1}</div>
                      </td>
                    );
                  case 'company':
                    return (
                      <td key="company" className={textClasses}>
                        <div className="truncate max-w-32">{record['company']?.name || record['companyName'] || record['company'] || '-'}</div>
                      </td>
                    );
                  case 'person':
                    return (
                      <td key="person" className={nameClasses}>
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
                        <div className="truncate max-w-32">{record['title'] || record['jobTitle'] || '-'}</div>
                      </td>
                    );
                  case 'role':
                    return (
                      <td key="role" className={textClasses}>
                        <div className="truncate max-w-32">{record['buyerGroupRole'] || '-'}</div>
                      </td>
                    );
                  case 'lastAction':
                    return (
                      <td key="lastAction" className={mutedClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const health = getHealthStatus(record);
                            const prospectName = record.name || record['fullName'] || 'this prospect';
                            
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                  {health.text}
                                </span>
                                <span className="text-sm text-gray-600 font-normal">
                                  {health['status'] === 'never' 
                                    ? `${prospectName} not yet contacted` 
                                    : (() => {
                                        const actionDescription = getSmartLastActionDescription(record, health.status);
                                        const timing = formatLastActionTime(record);
                                        // Only append timing if it's not "Never" and we have a real timing
                                        return timing && timing !== 'Never' 
                                          ? `${actionDescription} ${timing}`
                                          : actionDescription;
                                      })()
                                  }
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  case 'nextAction':
                    return (
                      <td key="nextAction" className={mutedClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const nextAction = getProspectsNextAction(record, index);
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
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
                  case 'actions':
                    return (
                      <td key="actions" className="px-2 py-4 whitespace-nowrap w-10 text-center">
                        <div className="flex justify-center">
                          <ActionMenu
                            record={record}
                            recordType="prospect"
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={(record) => onRecordClick(record)}
                            onCall={handleCall}
                            onSchedule={handleSchedule}
                            onConvert={handleConvert}
                            onQuickAction={handleQuickAction}
                            onAddAction={handleAddAction}
                            onMarkComplete={handleMarkComplete}
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

      case 'opportunities':
        const oppRecord = record as any; // Type assertion for opportunity-specific fields
        return (
          <tr key={record.id || index} className="cursor-pointer transition-colors hover:bg-gray-50 h-16 h-full" onClick={handleRowClick}>
            <td className={textClasses}>
              <div className="text-center font-medium">{index + 1}</div>
            </td>
            <td className={nameClasses}>
              <div className="truncate max-w-32">{oppRecord.name || 'Unnamed Opportunity'}</div>
            </td>
            <td className={textClasses}>
              <div className="truncate max-w-32">{oppRecord.account?.name || oppRecord.company || '-'}</div>
            </td>
            <td className={textClasses}>
              {oppRecord.amount ? `$${parseFloat(oppRecord.amount).toLocaleString()}` : '-'}
            </td>
            <td className={commonClasses}>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(oppRecord.stage)}`}>
                {oppRecord.stage || 'Discovery'}
              </span>
            </td>
            <td className={textClasses}>
              <div className="text-center">{oppRecord.probability ? `${oppRecord.probability}%` : '-'}</div>
            </td>
            <td className={mutedClasses}>
              {oppRecord.expectedCloseDate || oppRecord.closeDate ? formatDate(oppRecord.expectedCloseDate || oppRecord.closeDate) : '-'}
            </td>
            <td className={mutedClasses}>
              {getLastActionTime(oppRecord)}
            </td>
            <td className={textClasses}>
              <div className="truncate">{getNextAction(oppRecord)}</div>
            </td>
            <td className="px-2 py-4 whitespace-nowrap w-10 text-center">
              <div className="flex justify-center">
                <ActionMenu
                  record={record}
                  recordType="opportunity"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={(record) => onRecordClick(record)}
                  onAnalyze={(record) => console.log('Analyze:', record)}
                  onQuickAction={handleQuickAction}
                  onAddAction={handleAddAction}
                  className="z-10"
                />
              </div>
            </td>
          </tr>
        );

      case 'companies':
      case 'companies':
        const accountRecord = record as any;
        return (
          <tr 
            key={record.id || index} 
            className="cursor-pointer transition-colors hover:bg-gray-50 h-16"
            onClick={handleRowClick}
          >
            {(() => {
              // Use workspace-specific column order for companies
              const sectionConfig = getSectionColumns(workspaceId, 'companies', workspaceName);
              const logicalOrder = sectionConfig.columnOrder || ['rank', 'company', 'lastAction', 'nextAction', 'actions'];
              const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
              
              return orderedVisibleColumns.map(column => {
                switch (column) {
                  case 'rank':
                    return (
                      <td key="rank" className={textClasses}>
                        <div className="text-left font-medium">{index + 1}</div>
                      </td>
                    );
                  case 'company':
                    return (
                      <td key="company" className={nameClasses}>
                        <div className="truncate max-w-40">{accountRecord.name || '-'}</div>
                      </td>
                    );
                  case 'state':
                    return (
                      <td key="state" className={textClasses}>
                        <div className="truncate max-w-32">
                          {(() => {
                            const state = accountRecord.state;
                            const city = accountRecord.city;
                            
                            if (state) {
                              return state;
                            } else if (city) {
                              return city;
                            }
                            return '-';
                          })()}
                        </div>
                      </td>
                    );
                  case 'location':
                    return (
                      <td key="location" className={textClasses}>
                        <div className="truncate max-w-32">
                          {(() => {
                            const city = accountRecord.city;
                            const state = accountRecord.state;
                            const country = accountRecord.country;
                            
                            if (city && state) {
                              return `${city}, ${state}`;
                            } else if (city) {
                              return city;
                            } else if (state) {
                              return state;
                            } else if (country) {
                              return country;
                            } else if (accountRecord.address) {
                              return accountRecord.address;
                            }
                            return '-';
                          })()}
                        </div>
                      </td>
                    );
                  case 'people':
                    return (
                      <td key="people" className={textClasses}>
                        <div className="text-center">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {accountRecord.people_count || 0} people
                          </span>
                        </div>
                      </td>
                    );
                  case 'lastAction':
                    return (
                      <td key="lastAction" className={mutedClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            // PRIORITY: Use enhanced API data if available
                            if (accountRecord.lastAction) {
                              const health = getHealthStatus(accountRecord);
                              return (
                                <>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                    {health.text}
                                  </span>
                                  <span className="text-sm text-gray-600 font-normal">
                                    {accountRecord.lastAction}
                                  </span>
                                </>
                              );
                            }
                            
                            // FALLBACK: Use intelligent description logic
                            const health = getHealthStatus(accountRecord);
                            const companyName = accountRecord.name || 'this company';
                            
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                  {health.text}
                                </span>
                                <span className="text-sm text-gray-600 font-normal">
                                  {accountRecord.lastAction || getSmartLastActionDescription(accountRecord, health.status)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  case 'nextAction':
                    return (
                      <td key="nextAction" className={textClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            // PRIORITY: Use enhanced API data if available
                            if (accountRecord.nextAction || accountRecord.actionPlan) {
                              const nextAction = getAccountNextAction(accountRecord);
                              return (
                                <>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
                                    {nextAction.timing}
                                  </span>
                                  <span className="text-sm text-gray-600 font-normal truncate">
                                    {accountRecord.nextAction || accountRecord.actionPlan || 'No action planned'}
                                  </span>
                                </>
                              );
                            }
                            
                            // FALLBACK: Use legacy logic
                            const nextAction = getAccountNextAction(accountRecord);
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
                                  {nextAction.timing}
                                </span>
                                <span className="text-sm text-gray-600 font-normal truncate">
                                  {nextAction.action}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  case 'actions':
                    return (
                      <td key="actions" className="px-2 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <ActionMenu
                            record={record}
                            recordType="company"
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={(record) => onRecordClick(record)}
                            onAddAction={handleAddAction}
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

      case 'people':
        return (
          <tr 
            key={record.id || index} 
            className="cursor-pointer transition-colors hover:bg-gray-50 h-16"
            onClick={handleRowClick}
          >
            {(() => {
              // Use workspace-specific column order for people
              const sectionConfig = getSectionColumns(workspaceId, 'people', workspaceName);
              const logicalOrder = sectionConfig.columnOrder || ['rank', 'company', 'title', 'role', 'lastAction', 'nextAction', 'actions'];
              const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
              
              return orderedVisibleColumns.map(column => {
                switch (column) {
                  case 'rank':
                    return (
                      <td key="rank" className={textClasses}>
                        <div className="text-left font-medium">{index + 1}</div>
                      </td>
                    );
                  case 'company':
                    return (
                      <td key="company" className={textClasses}>
                        <div className="truncate max-w-32">{record['company']?.name || record['companyName'] || record['company'] || '-'}</div>
                      </td>
                    );
                  case 'person':
                    return (
                      <td key="person" className={nameClasses}>
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
                        <div className="truncate max-w-32">{record['title'] || record['jobTitle'] || '-'}</div>
                      </td>
                    );
                  case 'role':
                    return (
                      <td key="role" className={textClasses}>
                        <div className="truncate max-w-32">{record['buyerGroupRole'] || '-'}</div>
                      </td>
                    );
                  case 'lastAction':
                    return (
                      <td key="lastAction" className={mutedClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const health = getHealthStatus(record);
                            const personName = record.name || record['fullName'] || 'this person';
                            
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                  {health.text}
                                </span>
                                <span className="text-sm text-gray-600 font-normal">
                                  {health['status'] === 'never' 
                                    ? `${personName} not yet contacted` 
                                    : (() => {
                                        const actionDescription = getSmartLastActionDescription(record, health.status);
                                        const timing = formatLastActionTime(record);
                                        return timing && timing !== 'Never' 
                                          ? `${actionDescription} ${timing}`
                                          : actionDescription;
                                      })()
                                  }
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  case 'nextAction':
                    return (
                      <td key="nextAction" className={mutedClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const nextAction = getProspectsNextAction(record, index);
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
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
                  case 'actions':
                    return (
                      <td key="actions" className="px-2 py-4 whitespace-nowrap w-10 text-center">
                        <div className="flex justify-center">
                          <ActionMenu
                            record={record}
                            recordType="person"
                            onEdit={handleEdit}
                            onDelete={(record) => console.log('Delete:', record)}
                            onView={(record) => onRecordClick(record)}
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

      case 'people':
        return (
          <tr 
            key={record.id || index} 
            className="cursor-pointer transition-colors hover:bg-gray-50 h-16"
            onClick={handleRowClick}
          >
            {(() => {
              // Define logical column order for contacts - separate from people
              const logicalOrder = ['rank', 'name', 'title', 'company', 'lastAction', 'nextAction', 'actions'];
              const orderedVisibleColumns = logicalOrder.filter(col => visibleColumns?.includes(col));
              
              return orderedVisibleColumns.map(column => {
                switch (column) {
                  case 'rank':
                    return (
                      <td key="rank" className={textClasses}>
                        <div className="text-left font-medium">{index + 1}</div>
                      </td>
                    );
                  case 'company':
                    return (
                      <td key="company" className={textClasses}>
                        <div className="truncate max-w-32">
                          {record['companyName'] || 
                           record['company'] || 
                           (record['company'] && record['company'].name) || 
                           (record['companies'] && record['companies'].name) ||
                           '-'}
                        </div>
                      </td>
                    );
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
                          {record['title'] || record['jobTitle'] || '-'}
                        </div>
                      </td>
                    );
                  case 'lastAction':
                    return (
                      <td key="lastAction" className={mutedClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            // PRIORITY: Use enhanced API data if available
                            if ((record as any).lastAction) {
                              const health = getHealthStatus(record);
                              return (
                                <>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                    {health.text}
                                  </span>
                                  <span className="text-sm text-gray-600 font-normal">
                                    {(record as any).lastAction}
                                  </span>
                                </>
                              );
                            }
                            
                            // FALLBACK: Use intelligent description logic
                            const health = getHealthStatus(record);
                            const contactName = record.name || record['fullName'] || 'this contact';
                            
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                  {health.text}
                                </span>
                                <span className="text-sm text-gray-600 font-normal">
                                  {(record as any).lastAction || getSmartLastActionDescription(record, health.status)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  case 'nextAction':
                    return (
                      <td key="nextAction" className={textClasses}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const nextAction = getPersonNextAction(record);
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
                                  {nextAction.timing}
                                </span>
                                <span className="text-sm text-gray-600 font-normal truncate">
                                  {nextAction.action}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  case 'actions':
                    return (
                      <td key="actions" className="px-2 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <ActionMenu
                            record={record}
                            recordType="person"
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={(record) => onRecordClick(record)}
                            onCall={handleCall}
                            onSchedule={handleSchedule}
                            onAddAction={handleAddAction}
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

      case 'clients':
        const clientRecord = record as any;
        return (
          <tr key={record.id || index} className="cursor-pointer transition-colors hover:bg-gray-50 h-16 h-full" onClick={handleRowClick}>
            <td className={textClasses}>
              <div className="text-center font-medium">{index + 1}</div>
            </td>
            <td className={nameClasses}>
              <div className="truncate max-w-40">{clientRecord.name || clientRecord.companyName || '-'}</div>
            </td>
            <td className={textClasses}>
              <div className="truncate">{clientRecord.industry || '-'}</div>
            </td>
            <td className={commonClasses}>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clientRecord.status)}`}>
                {clientRecord.status || 'Active'}
              </span>
            </td>
            <td className={textClasses}>
              {clientRecord.totalValue || clientRecord.arr ? `$${parseFloat(clientRecord.totalValue || clientRecord.arr).toLocaleString()}` : '-'}
            </td>
            <td className={textClasses}>
              <div className="text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(clientRecord.healthScore)}`}>
                  {clientRecord.healthScore || 'Good'}
                </span>
              </div>
            </td>
            <td className={mutedClasses}>
              {getLastActionTime(clientRecord)}
            </td>
            <td className={textClasses}>
              <div className="flex items-center gap-2">
                {(() => {
                  const nextAction = getCustomerNextAction(clientRecord);
                  return (
                    <>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
                        {nextAction.timing}
                      </span>
                      <span className="text-sm text-gray-600 font-normal truncate">
                        {nextAction.action}
                      </span>
                    </>
                  );
                })()}
              </div>
            </td>
            <td className="px-2 py-4 whitespace-nowrap w-10 text-center">
              <div className="flex justify-center">
                <ActionMenu
                  record={record}
                  recordType="person"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={(record) => onRecordClick(record)}
                  onAddAction={handleAddAction}
                  className="z-10"
                />
              </div>
            </td>
          </tr>
        );

      case 'partners':
        const partnerRecord = record as any;
        return (
          <tr key={record.id || index} className="cursor-pointer transition-colors hover:bg-gray-50 h-16 h-full" onClick={handleRowClick}>
            <td className={textClasses}>
              <div className="text-center font-medium">{index + 1}</div>
            </td>
            <td className={nameClasses}>
              <div className="truncate max-w-40">{partnerRecord.name || '-'}</div>
            </td>
            <td className={textClasses}>
              <div className="truncate">{partnerRecord.partnerType || partnerRecord.type || '-'}</div>
            </td>
            <td className={commonClasses}>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partnerRecord.relationshipStatus)}`}>
                {partnerRecord.relationshipStatus || 'Active'}
              </span>
            </td>
            <td className={textClasses}>
              <div className="text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthColor(partnerRecord.relationshipStrength)}`}>
                  {partnerRecord.relationshipStrength || 'Medium'}
                </span>
              </div>
            </td>
            <td className={mutedClasses}>
              {getLastActionTime(partnerRecord)}
            </td>
            <td className={textClasses}>
              <div className="truncate">{partnerRecord.nextAction || getNextAction(partnerRecord)}</div>
            </td>
            <td className="px-2 py-4 whitespace-nowrap w-10 text-center">
              <div className="flex justify-center">
                <ActionMenu
                  record={record}
                  recordType="company"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={(record) => onRecordClick(record)}
                  onAddAction={handleAddAction}
                  className="z-10"
                />
              </div>
            </td>
          </tr>
        );

      case 'sellers':
        const sellerRecord = record as any;
        return (
          <tr key={record.id || index} className="cursor-pointer transition-colors hover:bg-gray-50 h-16" onClick={handleRowClick}>
            <td className={textClasses}>
              <div className="text-left font-medium">{index + 1}</div>
            </td>
            <td className={textClasses}>
              <div className="truncate max-w-32">{sellerRecord.company || '-'}</div>
            </td>
            <td className={nameClasses}>
              <div className="truncate max-w-32">{sellerRecord.name || '-'}</div>
            </td>
            <td className={textClasses}>
              <div className="truncate max-w-32">{sellerRecord.title || '-'}</div>
            </td>
            <td className={mutedClasses}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {formatLastActionTime(sellerRecord) || 'Just now'}
                </span>
              </div>
            </td>
            <td className="px-2 py-4 whitespace-nowrap w-10 text-center">
              <div className="flex justify-center">
                <ActionMenu
                  record={record}
                  recordType="person"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={(record) => onRecordClick(record)}
                  onAddAction={handleAddAction}
                  className="z-10"
                />
              </div>
            </td>
          </tr>
        );

      case 'speedrun':
        const speedrunRecord = record as any;
        // Debug: Log the actual record data to see what we're working with
        console.log('🔍 [SPEEDRUN DEBUG] Record data:', {
          id: record.id,
          name: record.name,
          fullName: record.fullName,
          firstName: record.firstName,
          lastName: record.lastName,
          company: record.company,
          title: record.title,
          jobTitle: record.jobTitle,
          stage: record.stage,
          status: record.status,
          displayName: displayName
        });
        
        // Define logical column order for speedrun to match the headers and visible columns
        const speedrunLogicalOrder = ['rank', 'person', 'stage', 'lastAction', 'nextAction', 'actions'];
        const speedrunVisibleColumns = speedrunLogicalOrder.filter(col => visibleColumns?.includes(col));
        
        return (
          <React.Fragment key={record.id || index}>
            <tr 
              className="cursor-pointer transition-colors hover:bg-gray-50 h-16 h-full"
              onClick={handleRowClick}
            >
              {(() => {
                
                return speedrunVisibleColumns.map(column => {
                  switch (column) {
                    case 'rank':
                      return (
                        <td key="rank" className={textClasses}>
                <div className="text-center font-medium">{record.rank || (index + 1)}</div>
              </td>
                      );
                    case 'person':
                      return (
                        <td key="person" className={nameClasses}>
                <div className="truncate max-w-32">{displayName}</div>
              </td>
                      );
                    case 'stage':
                      return (
                        <td key="stage" className={textClasses}>
                <div className="truncate max-w-32">
                  {/* Ensure we display the stage name, not next action instructions */}
                  {(() => {
                    // CRITICAL FIX: Extract proper stage name from potentially corrupted data
                    const getCleanStage = () => {
                      // Get stage from either 'stage' or 'currentStage' field
                      const stageValue = record.stage || record.currentStage || '';
                      
                      // If stage contains action instructions, extract from status or use default
                      if (stageValue && (stageValue.includes('Call') || stageValue.includes('at this company') || stageValue.includes('stop reading') || stageValue.includes('Now') || stageValue.includes('Today'))) {
                        // This is action instruction data, determine stage from timing
                        if (stageValue.includes('Now')) {
                          return 'Ready to Call';
                        } else if (stageValue.includes('Today')) {
                          return 'Today';
                        } else if (stageValue.includes('Call')) {
                          return 'Prospecting';
                        } else {
                          // Fallback to status-based mapping
                          const status = record.status?.toLowerCase() || '';
                          switch (status) {
                            case 'new':
                            case 'uncontacted':
                              return 'Prospect';
                            case 'contacted':
                            case 'qualified':
                              return 'Lead';
                            case 'demo-scheduled':
                            case 'follow-up':
                            case 'active':
                              return 'Opportunity';
                            case 'closed-won':
                            case 'customer':
                              return 'Customer';
                            default:
                              return 'Prospect';
                          }
                        }
                      }
                      
                      // Use stage if it looks like a proper stage name
                      if (stageValue && !stageValue.includes('Call') && !stageValue.includes('-')) {
                        return stageValue;
                      }
                      
                      // Fallback to status or default
                      return record.status || 'Prospect';
                    };
                    
                    return getCleanStage();
                  })()}
                </div>
              </td>
                      );
                    case 'lastAction':
                      return (
                        <td key="lastAction" className={commonClasses}>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const health = getHealthStatus(record);
                              const recordName = record.name || record['fullName'] || 'this contact';
                              return (
                                <>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                    {health.text}
                                  </span>
                                  <span className="text-sm text-gray-600 font-normal">
                                    {health['status'] === 'never' 
                                      ? `${recordName} not yet contacted` 
                                      : getSmartLastActionDescription(record, health.status)
                                    }
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      );
                    case 'nextAction':
                      return (
                        <td key="nextAction" className={textClasses}>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const nextAction = getSpeedrunNextAction(record, index);
                              return (
                                <>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
                                    {nextAction.timing}
                                  </span>
                                  <span className="text-sm text-gray-600 font-normal truncate">
                                    {nextAction.action}
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
                              recordType="speedrun"
                              onEdit={handleEdit}
                              onDelete={(record) => console.log('Delete:', record)}
                              onCall={(record) => console.log('Call:', record)}
                              onQuickAction={(record, action) => console.log('Quick action:', action, record)}
                              onMarkComplete={handleMarkComplete}
                              onAddAction={handleAddAction}
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
          </React.Fragment>
        );

      default:
        return (
          <tr key={record.id || index} className="cursor-pointer" onClick={handleRowClick}>
            <td className={nameClasses}>{displayName}</td>
            <td className={textClasses}>{JSON.stringify(record).substring(0, 100)}...</td>
            <td className={mutedClasses}>{record.status || 'Unknown'}</td>
            <td className="px-2 py-4 whitespace-nowrap w-10 text-center">
              <div className="flex justify-center">
                <ActionMenu
                  record={record}
                  recordType="person"
                  onEdit={(record) => console.log('Edit:', record)}
                  onDelete={(record) => console.log('Delete:', record)}
                  onView={(record) => onRecordClick(record)}
                  className="z-10"
                />
              </div>
            </td>
          </tr>
        );
    }
  };

  // Calculate dynamic height based on actual content
  const headerHeight = 40; // Height of table header
  const rowHeight = 64; // Approximate height per row
  const contentHeight = headerHeight + (data.length * rowHeight);
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 187.5 : 600; // Reserve 160px for other UI elements
  
  // Dynamic height calculation based on content size
  let tableHeight;
  if (data['length'] === 0) {
    // Empty state - use minimal height
    tableHeight = 120;
  } else if (data['length'] === 1) {
    // Single record - use content height with just enough buffer to avoid scroll
    tableHeight = contentHeight + 12;
  } else if (data.length <= 3) {
    // Small datasets - use content height with moderate buffer
    tableHeight = contentHeight + 16;
  } else {
    // Larger datasets - use viewport constraint
    tableHeight = Math.min(contentHeight, maxViewportHeight);
  }
  
  return (
    <div key={`pipeline-table-${section}-${visibleColumns?.join('-')}`} className="bg-white rounded-lg border border-gray-200 flex flex-col relative" style={{ height: `${tableHeight}px` }}>
      
      <div className="flex-1 overflow-auto min-h-0 pipeline-table-scroll">
        <table className="min-w-full table-fixed border-collapse mb-0">
          <colgroup>
            {getTableHeaders().map((_, index) => (
              <col key={index} style={{ width: getColumnWidth(index) }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {getTableHeaders().map((header, index) => {
                const isActionColumn = header === 'Actions';
                const fieldMap: Record<string, string> = {
                  'Rank': 'rank',
                  'Company': 'company',
                  'Person': 'name',
                  'Name': 'name',
                  'Title': 'title',
                  'Status': 'status',
                  'Last Action': 'lastAction',
                  'Next Action': 'nextAction',
                  'Amount': 'amount',
                  'Stage': 'stage',
                  'Priority': 'priority',
                  'Industry': 'industry',
                  'Email': 'email',
                  'Phone': 'phone'
                };
                const field = fieldMap[header] || header.toLowerCase();
                const isCurrentSort = sortField === field;
                
                return (
                  <th 
                    key={header}
                    className={`px-6 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 h-8 border-b border-gray-200 ${
                      !isActionColumn && onColumnSort ? 'cursor-pointer hover:bg-gray-100 transition-colors group' : ''
                    }`}
                    onClick={() => !isActionColumn && onColumnSort?.(header)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{isActionColumn ? '' : header}</span>
                      {!isActionColumn && onColumnSort && (
                        <div className="flex items-center ml-2">
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                            )
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(section === 'speedrun' ? data : paginatedData).map(renderTableRow)}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data.length > pageSize && section !== 'speedrun' && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, data.length)}</span> of{' '}
                <span className="font-medium">{data.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditRecordModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={handleSaveEdit}
        record={selectedRecord}
        recordType={section}
        isLoading={isSubmitting}
      />

      {/* Add Action Modal */}
      <AddActionModal
        isOpen={addActionModalOpen}
        onClose={() => {
          setAddActionModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleSaveAction}
        record={selectedRecord}
        recordType={section}
        isLoading={isSubmitting}
      />

      {/* Record Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        recordType={section as any}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}

// Helper functions for styling
function getStatusColor(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusLower = status.toLowerCase();
  if (['active', 'qualified', 'hot', 'won'].includes(statusLower)) {
    return 'bg-gray-100 text-gray-800';
  }
  if (['new', 'discovery', 'proposal'].includes(statusLower)) {
    return 'bg-orange-100 text-orange-800';
  }
  if (['cold', 'lost', 'closed'].includes(statusLower)) {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority?: string): string {
  if (!priority) return 'bg-gray-100 text-gray-800';
  
  const priorityLower = priority.toLowerCase();
  if (priorityLower === 'high') return 'bg-red-100 text-red-800';
  if (priorityLower === 'medium') return 'bg-orange-100 text-orange-800';
  if (priorityLower === 'low') return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-800';
}

function getStageColor(stage?: string): string {
  if (!stage) return 'bg-gray-100 text-gray-800';
  
  const stageLower = stage.toLowerCase().replace(/\s+/g, '-');
  
  // Closed stages
  if (['won', 'closed-won'].includes(stageLower)) return 'bg-green-100 text-green-800';
  if (['lost', 'closed-lost'].includes(stageLower)) return 'bg-gray-100 text-gray-800';
  if (stageLower === 'closed-lost-to-competition') return 'bg-red-100 text-red-800 border border-red-200';
  
  // Active stages  
  if (['proposal', 'proposal-price-quote'].includes(stageLower)) return 'bg-blue-100 text-blue-800';
  if (['negotiation', 'negotiation-review'].includes(stageLower)) return 'bg-orange-100 text-orange-800';
  if (['discovery', 'qualification', 'needs-analysis'].includes(stageLower)) return 'bg-gray-100 text-gray-800';
  
  return 'bg-gray-100 text-gray-800';
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Vercel-style precise time calculation
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString();
  } catch {
    return 'Recent';
  }
}

function getLastContactTime(record: any): string {
  // Check for actual contact/activity dates first (most accurate)
  const actualContactDates = [
    record.lastContactDate,
    record.lastEmailDate,
    record.lastActivityDate,
    record.lastCallDate,
    record.lastMeetingDate,
    record.lastTouchDate,
    record.lastEmailSent,
    record.lastEmailReceived,
    record.lastActivityAt,
    record.lastEngagementAt
  ].filter(Boolean);
  
  if (actualContactDates.length > 0) {
    // Use the most recent actual contact date
    const mostRecentContact = new Date(Math.max(...actualContactDates.map(d => new Date(d).getTime())));
    return formatDate(mostRecentContact.toISOString());
  }
  
  // Only fall back to record timestamps if no actual contact data exists
  const status = (record.status || '').toLowerCase();
  
  // For new/uncontacted leads, don't show misleading timestamps
  if (status === 'new' || status === 'uncontacted') {
    return 'Not contacted yet';
  }
  
  // For other records, be more specific about what the timestamp represents
  if (record.updatedAt) {
    const updatedDate = new Date(record.updatedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Updated today';
    if (diffInDays === 1) return 'Updated yesterday';
    return `Updated ${diffInDays}d ago`;
  }
  
  if (record.createdAt) {
    const createdDate = new Date(record.createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Added today';
    if (diffInDays === 1) return 'Added yesterday';
    return `Added ${diffInDays}d ago`;
  }
  
  return 'No contact history';
}

function getLastActionTime(record: any): string {
  // Look for the most recent activity timestamp first
  const lastActivity = record.lastActionDate || 
                      record.lastActivityDate ||
                      record.lastEngagementAt ||
                      record.lastCallDate ||
                      record.lastEmailDate ||
                      record.lastMeetingDate;
  
  if (lastActivity) {
    return formatDate(lastActivity);
  }
  
  // Fall back to contact time if no specific action found
  return getLastContactTime(record);
}

function getLastActionDescription(record: any): string {
  // Determine what the last action actually was based on real data
  if (record.lastEmailSent) return 'Sent personalized email';
  if (record.lastCallMade) return 'Left voicemail with value prop';
  if (record.lastMeetingScheduled) return 'Scheduled discovery call';
  if (record.lastLinkedInMessage) return 'Connected on LinkedIn';
  if (record.lastProposalSent) return 'Sent custom proposal';
  if (record.lastFollowUp) return 'Followed up on interest';
  
  // Check for actual contact history
  const lastContactDate = record.lastContactDate || record.lastEngagementDate;
  if (lastContactDate) {
    const daysSince = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
    return `Last contacted ${daysSince} days ago`;
  }
  
  // Logical fallback based on record type and status
  const status = (record.status || '').toLowerCase();
  const name = record['fullName'] || record.name || 'contact';
  
  // Make logical sense - no "Never initial contact planned"
  if (status === 'new' || status === 'uncontacted') {
    return `${name} not yet contacted`;
  }
  if (status === 'contacted') {
    return 'Initial outreach completed';
  }
  if (status === 'engaged' || status === 'responded') {
    return 'Positive engagement received';
  }
  if (status === 'qualified') {
    return 'Lead qualified for next steps';
  }
  
  return 'Contact activity tracked';
}

// 🎨 STANDARDIZED ACTION TIMING COLOR SCHEME
// Consistent colors for both last action and next action timing pills
function getStandardizedActionTimingColor(timing: string, isLastAction: boolean = false): string {
  const timingLower = timing.toLowerCase();
  
  // Last Action Colors (based on recency)
  if (isLastAction) {
    if (timingLower.includes('just now') || timingLower.includes('today')) {
      return 'bg-blue-100 text-blue-800'; // Recent contact
    } else if (timingLower.includes('yesterday') || timingLower.includes('1d ago') || timingLower.includes('2d ago') || timingLower.includes('3d ago')) {
      return 'bg-blue-100 text-blue-800'; // Recent contact
    } else if (timingLower.includes('4d ago') || timingLower.includes('5d ago') || timingLower.includes('6d ago') || timingLower.includes('7d ago') || timingLower.includes('1w ago') || timingLower.includes('2w ago')) {
      return 'bg-gray-100 text-gray-800'; // Moderate timing
    } else if (timingLower.includes('3w ago') || timingLower.includes('4w ago') || timingLower.includes('1mo ago') || timingLower.includes('2mo ago')) {
      return 'bg-orange-100 text-orange-800'; // Stale timing
    } else if (timingLower.includes('3mo ago') || timingLower.includes('6mo ago') || timingLower.includes('1y ago') || timingLower.includes('never')) {
      return 'bg-red-100 text-red-800'; // Very stale or never contacted
    }
  }
  
  // Next Action Colors (based on urgency)
  if (timingLower.includes('now') || timingLower.includes('today') || timingLower.includes('overdue')) {
    return 'bg-red-100 text-red-800'; // Urgent - do now
  } else if (timingLower.includes('tomorrow') || timingLower.includes('this week')) {
    return 'bg-orange-100 text-orange-800'; // High priority - this week
  } else if (timingLower.includes('next week') || timingLower.includes('monday') || timingLower.includes('tuesday')) {
    return 'bg-blue-100 text-blue-800'; // Medium priority - next week
  } else if (timingLower.includes('two weeks') || timingLower.includes('wednesday') || timingLower.includes('thursday') || timingLower.includes('friday')) {
    return 'bg-indigo-100 text-indigo-800'; // Lower priority - two weeks
  } else if (timingLower.includes('next month') || timingLower.includes('future')) {
    return 'bg-gray-100 text-gray-800'; // Low priority - future
  }
  
  // Default fallback
  return 'bg-gray-100 text-gray-800';
}

// Smart Last Action description with tough coach personality and real data
function getSmartLastActionDescription(record: any, healthStatus: string): string {
  const name = record['fullName'] || record.name || 'this contact';
  const status = (record.status || '').toLowerCase();
  const company = record['company'] || 'this company';
  const title = record.title || record.jobTitle || 'contact';
  const amount = record.amount || record.dealValue || 0;
  const priority = record.priority?.toLowerCase() || 'medium';
  
  // Determine if this is an account or contact record
  const isAccount = record['type'] === 'account' || record.accountType || (!record['fullName'] && record.name);
  const recordName = isAccount ? company : name;
  
  // PRIORITY: Use specific action data from activities if available
  if (record['lastActionType'] && record.lastActionDescription) {
    const actionMap = {
      'email': `You emailed ${name} - did they respond?`,
      'call': `You called ${name} - what did they say?`,
      'meeting': `You met with ${name} - close the opportunity already`,
      'linkedin_message': `You messaged ${name} on LinkedIn - follow up`,
      'demo': `You demoed for ${name} - where's the contract?`,
      'proposal': `You sent proposal to ${company} - time to close`,
      'created': `Added ${name} - capitalize on it`
    };
    
    const specificAction = actionMap[record.lastActionType as keyof typeof actionMap];
    if (specificAction) {
      // Add outcome context with coach personality
      if (record.lastActionOutcome) {
        if (record['lastActionOutcome'] === 'positive') return `${specificAction} - Good, now close them`;
        if (record['lastActionOutcome'] === 'interested') return `${specificAction} - Strike while hot`;
        if (record['lastActionOutcome'] === 'scheduled') return `${specificAction} - Don't blow it`;
      }
      return specificAction;
    }
  }
  
  // Check if this is a newly created record (no specific actions yet)
  const isNewRecord = !record['lastActionType'] && !record['lastEmailSent'] && !record['lastCallMade'] && 
                     !record['lastMeetingScheduled'] && !record['lastLinkedInMessage'] && 
                     !record['lastProposalSent'] && !record.lastFollowUp;
  
  if (isNewRecord) {
    return `Added ${name} - capitalize on it`;
  }
  
  // Fallback to legacy fields with coach tone
  if (record.lastEmailSent) return `You emailed ${name} - check your inbox`;
  if (record.lastCallMade) return `You called ${name} - what's the status?`;
  if (record.lastMeetingScheduled) return `You scheduled with ${name} - show up prepared`;
  if (record.lastLinkedInMessage) return `You connected with ${name} - now what?`;
  if (record.lastProposalSent) return `You sent proposal to ${company} - follow up`;
  if (record.lastFollowUp) return `You followed up with ${name} - keep pushing`;
  
  // Coach-level analysis based on health status and real data
  switch (healthStatus) {
    case 'recent':
      // Recent contact = what's the real status?
      if (isAccount) {
        if (status === 'engaged' || status === 'responded') {
          return `${company} is engaged - strike while hot`;
        }
        if (status === 'contacted') {
          return `You reached ${company} - what's their pain?`;
        }
        return `Recent activity with ${company} - capitalize on it`;
      } else {
        if (status === 'engaged' || status === 'responded') {
          if (amount >= 100000) {
            return `${name} is hot - don't let this $${(amount/1000).toFixed(0)}K deal slip`;
          }
          if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('vp')) {
            return `${name} engaged - this executive wants to buy`;
          }
          return `${name} responded - time to close`;
        }
        if (status === 'contacted') {
          return `You reached ${name} - what's their pain?`;
        }
        if (status === 'qualified') {
          return `${name} is qualified - present your solution`;
        }
        return `Recent activity with ${name} - capitalize on it`;
      }
      
    case 'moderate':
      // Moderate timing = wake up call
      if (isAccount) {
        if (status === 'contacted') {
          return `You contacted ${company} - but did you follow up?`;
        }
        if (status === 'engaged') {
          return `${company} is cooling off - re-engage now`;
        }
        return `Stale contact with ${company} - time to heat it up`;
      } else {
        if (status === 'contacted') {
          return `You contacted ${name} - but did you follow up?`;
        }
        if (status === 'engaged') {
          return `${company} is cooling off - re-engage now`;
        }
        return `Stale contact with ${name} - time to heat it up`;
      }
      
    case 'stale':
    case 'very-stale':
      // Stale contact = tough love
      if (isAccount) {
        if (status === 'engaged') {
          return `${company} went cold - you dropped the ball`;
        } else if (status === 'contacted') {
          return `${company} ignored you - try harder`;
        } else {
          return `${company} is dead - revive it or move on`;
        }
      } else {
        if (status === 'engaged') {
          return `${name} went cold - you dropped the ball`;
        } else if (status === 'contacted') {
          return `${name} ignored you - try harder`;
        } else {
          return `${company} is dead - revive it or move on`;
        }
      }
      
    default:
      if (isAccount) {
        return `Account activity with ${company}`;
      } else {
        return `${name} not yet contacted`;
      }
  }
}

function formatLastActionTime(record: any): string {
  // Prioritize lastContactDate as it's more accurate for actual contact timing
  const lastContact = record.lastContactDate || 
                     record.lastContact;
  
  if (lastContact) {
    return formatRelativeTime(lastContact);
  }
  
  // Fall back to lastActionDate if no contact date available
  const lastActivity = record.lastActionDate || 
                      record.lastActivityDate ||
                      record.lastEngagementAt ||
                      record.lastCallDate ||
                      record.lastEmailDate ||
                      record.lastMeetingDate;
  
  if (lastActivity) {
    return formatRelativeTime(lastActivity);
  }
  
  return 'Never';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Vercel-style precise time calculation
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months}mo ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years}y ago`;
  }
}

function getHealthStatus(record: any): { status: string; color: string; text: string } {
  // Look for actual contact/activity dates in priority order
  const lastActivity = record.lastContactDate || 
                      record.lastEngagementDate ||
                      record.lastEmailDate ||
                      record.lastCallDate ||
                      record.lastActivityDate ||
                      record.lastActionDate ||
                      record.updatedAt;

  if (!lastActivity) {
    return { status: 'never', color: 'bg-red-100 text-red-800', text: 'Never' };
  }

  const lastContact = new Date(lastActivity);
  const now = new Date();
  const diffTime = now.getTime() - lastContact.getTime();
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hoursDiff = Math.floor(diffTime / (1000 * 60 * 60));

  // Format time with human-readable precision (Vercel-style)
  const formatPreciseTime = (days: number, hours: number): string => {
    const diffTime = now.getTime() - lastContact.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (days === 0) {
      // Same day - use hours only if meaningful
      if (hours <= 12) return `${hours}h ago`;
      return 'Today';
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.ceil(days / 7)}w ago`;
    if (days < 365) return `${Math.ceil(days / 30)}mo ago`;
    return `${Math.ceil(days / 365)}y ago`;
  };

  // Use standardized color scheme for last action timing
  const timingText = formatPreciseTime(daysDiff, hoursDiff);
  const color = getStandardizedActionTimingColor(timingText, true);
  
  // Determine status for logic purposes
  let status = 'recent';
  if (daysDiff === 0) {
    status = 'recent';
  } else if (daysDiff <= 3) {
    status = 'recent';
  } else if (daysDiff <= 14) {
    status = 'moderate';
  } else if (daysDiff <= 30) {
    status = 'stale';
  } else {
    status = 'very-stale';
  }
  
  return { status, color, text: timingText };
}

function getNextAction(record: any): string {
  return getPredictiveNextAction(record);
}

// Skip Miller-inspired next action system with timezone awareness  
function getPredictiveNextAction(record: any): string {
  const status = record.status?.toLowerCase() || '';
  const stage = record.stage?.toLowerCase() || '';
  const lastContactDate = record.lastContactDate || record.lastEmailDate || record.lastActivity;
  const priority = record.priority?.toLowerCase() || 'medium';
  const amount = record.amount || 0;
  
  // Dano's timezone (ET) vs system timezone (PT) - 3 hour difference
  const now = new Date();
  const danoTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Convert PT to ET
  const danoHour = danoTime.getHours();
  
  // Calculate days since last contact
  const daysSinceContact = lastContactDate 
    ? Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Skip Miller principles: Urgency, Value, and Timing
  const isHighValue = amount > 50000;
  const urgencyMultiplier = isHighValue ? 0.6 : 1.0; // Much faster for high-value deals
  
  // Smart timing based on Dano's ET timezone and business hours
  const getSmartTiming = (baseDays: number): { timing: string; color: string } => {
    let adjustedDays = Math.floor(baseDays * urgencyMultiplier);
    
    // Priority adjustments (Skip Miller: High priority = immediate action)
    if (priority === 'high' || priority === 'high priority') adjustedDays = Math.max(0, Math.floor(adjustedDays * 0.4));
    else if (priority === 'low' || priority === 'low priority') adjustedDays = Math.floor(adjustedDays * 1.8);
    
    // Business hours consideration (8 AM - 6 PM ET)
    const isBusinessHours = danoHour >= 8 && danoHour <= 18;
    
    if (adjustedDays === 0) {
      return isBusinessHours 
        ? { timing: 'Now', color: 'bg-red-100 text-red-800' }
        : { timing: 'Today', color: 'bg-orange-100 text-orange-800' };
    }
    if (adjustedDays === 1) {
      return { timing: 'Tomorrow', color: 'bg-blue-100 text-blue-800' };
    }
    if (adjustedDays <= 3) {
      return { timing: `${adjustedDays} Days`, color: 'bg-blue-100 text-blue-800' };
    }
    if (adjustedDays <= 7) {
      return { timing: 'This Week', color: 'bg-gray-100 text-gray-800' };
    }
    if (adjustedDays <= 14) {
      return { timing: 'Two Weeks', color: 'bg-gray-100 text-gray-800' };
    }
    if (adjustedDays <= 30) {
      return { timing: 'One Month', color: 'bg-gray-100 text-gray-800' };
    }
    return { timing: 'Six Weeks', color: 'bg-gray-100 text-gray-800' };
  };
  
  // Coach-inspired action intelligence with real data
  const getSkipMillerAction = (): { action: string; timing: { timing: string; color: string } } => {
    const name = record['fullName'] || record.name || 'this contact';
    const company = record['company'] || 'this company';
    
    // Stage-based actions for opportunities (Coach: Close the opportunity)
    if (stage) {
      switch (stage) {
        case 'qualification':
          return {
            action: `Call ${name} - qualify this $${(amount/1000).toFixed(0)}K deal`,
            timing: getSmartTiming(2) // Quick qualification
          };
        case 'discovery':
        case 'needs-analysis':
          return {
            action: `Present solution to ${name} - show them the money`,
            timing: getSmartTiming(3)
          };
        case 'proposal':
        case 'proposal-price-quote':
          return {
            action: `Follow up proposal with ${name} - close the deal`,
            timing: getSmartTiming(5)
          };
        case 'negotiation':
        case 'negotiation-review':
          return {
            action: `Close ${name} - $${(amount/1000).toFixed(0)}K waiting`,
            timing: getSmartTiming(1) // Urgent - close the deal
          };
        case 'closed-won':
          return {
            action: `Onboard ${name} - don't screw up the delivery`,
            timing: getSmartTiming(3)
          };
        case 'closed-lost':
        case 'closed-lost-to-competition':
          return {
            action: `Check in with ${name} - learn from the loss`,
            timing: { timing: 'Three Months', color: 'bg-gray-100 text-gray-800' }
          };
        default:
          return {
            action: `Advance ${name} - stop stalling`,
            timing: getSmartTiming(3)
          };
      }
    }
    
    // Status-based actions for leads/prospects (Coach: Build relationships that close)
  switch (status) {
    case 'new':
    case 'uncontacted':
        if (amount >= 100000) {
          return {
            action: `Call ${name} NOW - $${(amount/1000).toFixed(0)}K deal`,
            timing: getSmartTiming(0) // Immediate for high-value leads
          };
        }
        return {
          action: `Call ${name} - stop procrastinating`,
          timing: getSmartTiming(0) // Immediate for new leads
        };
      
    case 'contacted':
        if (daysSinceContact && daysSinceContact > 7) {
          return {
            action: `Re-engage ${name} - you dropped the ball`,
            timing: getSmartTiming(0) // Immediate re-engagement
          };
        }
        return {
          action: `Follow up with ${name} - don't lose momentum`,
          timing: getSmartTiming(3)
        };
      
    case 'responded':
      case 'engaged':
        if (amount >= 50000) {
          return {
            action: `Close ${name} - $${(amount/1000).toFixed(0)}K opportunity`,
            timing: getSmartTiming(1) // Quick response to engagement
          };
        }
        return {
          action: `Schedule discovery call with ${name}`,
          timing: getSmartTiming(1) // Quick response to engagement
        };
      
    case 'qualified':
      case 'interested':
        return {
          action: `Present solution to ${name} - time to close`,
          timing: getSmartTiming(2)
        };
      
    case 'demo':
    case 'demo_scheduled':
        return {
          action: `Follow up demo with ${name} - where's the contract?`,
          timing: getSmartTiming(1) // Strike while iron is hot
        };
      
      case 'nurture':
        return {
          action: `Wake up ${name} - they're going cold`,
          timing: getSmartTiming(14)
        };
      
      case 'hot':
        return {
          action: `Close ${name} NOW - hot lead`,
          timing: getSmartTiming(0) // Immediate action
        };
      
      case 'warm':
        return {
          action: `Heat up ${name} - add value`,
          timing: getSmartTiming(5)
        };
      
      case 'cold':
        return {
          action: `Revive ${name} or move on`,
          timing: getSmartTiming(21)
        };
      
      default:
        // Fallback with context awareness
        if (daysSinceContact === null) {
          return {
            action: `Call ${name} - first contact`,
            timing: getSmartTiming(1)
          };
        } else if (daysSinceContact > 30) {
          return {
            action: `Re-engage ${name} - ${daysSinceContact} days is too long`,
            timing: getSmartTiming(0)
          };
        } else if (daysSinceContact > 14) {
          return {
            action: `Follow up with ${name} - maintain momentum`,
            timing: getSmartTiming(2)
          };
        } else if (daysSinceContact > 7) {
          return {
            action: `Check in with ${name} - what's the status?`,
            timing: getSmartTiming(3)
          };
        } else {
          return {
            action: `Continue with ${name} - build the relationship`,
            timing: getSmartTiming(5)
          };
        }
    }
  };
  
  const { action, timing } = getSkipMillerAction();
  
  return `(${timing.timing}) ${action}`;
}

// Smart Next Action with pill formatting and LLM-level intelligence
function getSmartNextAction(record: any): { timing: string; timingColor: string; action: string } {
  const status = record.status?.toLowerCase() || '';
  const stage = record.stage?.toLowerCase() || '';
  const lastContactDate = record.lastContactDate || record.lastEmailDate || record.lastActivity;
  const priority = record.priority?.toLowerCase() || 'medium';
  const amount = record.amount || 0;
  
  // Current time in Dano's timezone (ET) - use proper timezone detection
  const now = new Date();
  
  // Try to get user's timezone, fallback to ET (UTC-5)
  let danoTime: Date;
  try {
    // Use Intl.DateTimeFormat to get the user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🔍 [TIMEZONE] User timezone:', userTimeZone);
    
    // Convert to ET (Eastern Time) for Dano
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    danoTime = etTime;
  } catch (error) {
    // Fallback: assume ET is UTC-5 (or UTC-4 during daylight saving)
    const etOffset = now.getTimezoneOffset() + (5 * 60); // Convert to ET
    danoTime = new Date(now.getTime() + (etOffset * 60 * 1000));
  }
  
  const danoHour = danoTime.getHours();
  const danoDay = danoTime.getDay(); // 0 = Sunday, 6 = Saturday
  const isBusinessHours = danoHour >= 8 && danoHour <= 18; // 8 AM - 6 PM ET
  const isWeekend = danoDay === 0 || danoDay === 6; // Sunday = 0, Saturday = 6
  
  // Debug logging
  console.log('🔍 [TIMEZONE DEBUG]', {
    now: now.toISOString(),
    danoTime: danoTime.toISOString(),
    danoHour,
    danoDay,
    isWeekend,
    isBusinessHours,
    dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][danoDay]
  });
  
  // Calculate days since last contact for context
  const daysSinceContact = lastContactDate 
    ? Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // LLM-level intelligence for timing decisions with federal holiday awareness
  const getIntelligentTiming = (urgencyLevel: 'immediate' | 'urgent' | 'soon' | 'routine' | 'future'): { timing: string; color: string } => {
    const isHighValue = amount > 50000;
    const isHighPriority = priority === 'high' || priority === 'high priority';
    
    // Check for federal holidays
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isHolidayTomorrow = isFederalHoliday(tomorrow);
    
    switch (urgencyLevel) {
      case 'immediate':
        // Right now - highest urgency
        if (isWeekend || isHolidayTomorrow) {
          return { timing: 'Tuesday', color: 'bg-red-100 text-red-800' };
        }
        return isBusinessHours 
          ? { timing: 'Now', color: 'bg-red-100 text-red-800' }
          : { timing: 'Today', color: 'bg-orange-100 text-orange-800' };
          
      case 'urgent':
        // Within business day - high urgency - use green to match Last Action
        if (isWeekend || isHolidayTomorrow) {
          return { timing: 'Tuesday', color: 'bg-green-100 text-green-800' };
        }
        if (isBusinessHours) {
          return { timing: 'Today', color: 'bg-green-100 text-green-800' };
        } else if (danoHour < 8) {
          return { timing: 'This Morning', color: 'bg-green-100 text-green-800' };
        } else {
          return { timing: 'Today', color: 'bg-green-100 text-green-800' };
        }
        
      case 'soon':
        // Within this week - should be higher priority than "Next Week"
        if (isWeekend || isHolidayTomorrow) {
          return { timing: 'Tuesday', color: 'bg-blue-100 text-blue-800' };
        }
        return { timing: 'This Week', color: 'bg-blue-100 text-blue-800' };
        
      case 'routine':
        // Standard follow-up timing
        if (isWeekend || isHolidayTomorrow) {
          return { timing: 'Tuesday', color: 'bg-gray-100 text-gray-800' };
        }
        return { timing: 'Next Week', color: 'bg-gray-100 text-gray-800' };
        
      case 'future':
        // Long-term follow-up
        return { timing: 'One Month', color: 'bg-gray-100 text-gray-800' };
        
      default:
        if (isWeekend || isHolidayTomorrow) {
          return { timing: 'Tuesday', color: 'bg-gray-100 text-gray-800' };
        }
        return { timing: 'This Week', color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Stage-based intelligence for opportunities
  if (stage) {
    switch (stage) {
      case 'qualification':
        const timing1 = getIntelligentTiming('urgent');
        return {
          timing: timing1.timing,
          timingColor: timing1.color,
          action: 'Discovery call to uncover business pain'
        };
        
      case 'discovery':
      case 'needs-analysis':
        const timing2 = getIntelligentTiming('soon');
        return {
          timing: timing2.timing,
          timingColor: timing2.color,
          action: 'Present tailored solution with ROI'
        };
        
    case 'proposal':
      case 'proposal-price-quote':
        const timing3 = getIntelligentTiming('urgent');
        return {
          timing: timing3.timing,
          timingColor: timing3.color,
          action: 'Follow up on proposal and address concerns'
        };
        
    case 'negotiation':
      case 'negotiation-review':
        const timing4 = getIntelligentTiming('immediate');
        return {
          timing: timing4.timing,
          timingColor: timing4.color,
          action: 'Push for commitment and close'
        };
        
      case 'closed-won':
        const timing5 = getIntelligentTiming('soon');
        return {
          timing: timing5.timing,
          timingColor: timing5.color,
          action: 'Schedule onboarding kickoff'
        };
        
      case 'closed-lost':
      case 'closed-lost-to-competition':
        return {
          timing: 'Three Months',
          timingColor: 'bg-gray-100 text-gray-800',
          action: 'Quarterly check-in for future opportunities'
        };
        
      default:
        const timing6 = getIntelligentTiming('routine');
        return {
          timing: timing6.timing,
          timingColor: timing6.color,
          action: 'Advance opportunity to next stage'
        };
    }
  }
  
  // Status-based intelligence for leads/prospects with context awareness
  if (daysSinceContact && daysSinceContact > 30) {
    const timing = getIntelligentTiming('immediate');
    return {
      timing: timing.timing,
      timingColor: timing.color,
      action: `Re-engage after ${daysSinceContact} days of silence`
    };
  }
  
  switch (status) {
    case 'new':
    case 'uncontacted':
      const timing1 = getIntelligentTiming('immediate');
      return {
        timing: timing1.timing,
        timingColor: timing1.color,
        action: 'Initial outreach with value messaging'
      };
      
    case 'contacted':
      if (daysSinceContact && daysSinceContact > 7) {
        const timing = getIntelligentTiming('urgent');
        return {
          timing: timing.timing,
          timingColor: timing.color,
          action: `Follow up after ${daysSinceContact} days`
        };
      }
      const timing2 = getIntelligentTiming('soon');
      return {
        timing: timing2.timing,
        timingColor: timing2.color,
        action: 'Follow up with additional value'
      };
      
    case 'responded':
    case 'engaged':
      const timing3 = getIntelligentTiming('urgent');
      return {
        timing: timing3.timing,
        timingColor: timing3.color,
        action: 'Schedule discovery call'
      };
      
    case 'qualified':
    case 'interested':
      const timing4 = getIntelligentTiming('urgent');
      return {
        timing: timing4.timing,
        timingColor: timing4.color,
        action: 'Schedule product demo'
      };
      
    case 'demo':
    case 'demo_scheduled':
      const timing5 = getIntelligentTiming('immediate');
      return {
        timing: timing5.timing,
        timingColor: timing5.color,
        action: 'Demo follow-up and proposal'
      };
      
    case 'hot':
      const timing6 = getIntelligentTiming('immediate');
      return {
        timing: timing6.timing,
        timingColor: timing6.color,
        action: 'Strike while iron is hot'
      };
      
    case 'warm':
      const timing7 = getIntelligentTiming('routine');
      return {
        timing: timing7.timing,
        timingColor: timing7.color,
        action: 'Value-add check-in'
      };
      
    case 'cold':
      const timing8 = getIntelligentTiming('future');
      return {
        timing: timing8.timing,
        timingColor: timing8.color,
        action: 'Quarterly industry update'
      };
      
    case 'client':
      const timing9 = getIntelligentTiming('urgent');
      return {
        timing: timing9.timing,
        timingColor: timing9.color,
        action: 'Client success check-in'
      };
      
    default:
      const timing10 = getIntelligentTiming('routine');
      return {
        timing: timing10.timing,
        timingColor: timing10.color,
        action: 'Continue relationship building'
      };
  }
}

// Speedrun-specific Next Action - ALL items should be done TODAY/NOW
function getSpeedrunNextAction(record: any, recordIndex: number): { timing: string; timingColor: string; action: string } {
  const status = record.status?.toLowerCase() || '';
  const priority = record.priority?.toLowerCase() || 'medium';
  const amount = record.amount || 0;
  
  // Current time in Dano's timezone (ET) - use proper timezone detection
  const now = new Date();
  
  // Try to get user's timezone, fallback to ET (UTC-5)
  let danoTime: Date;
  try {
    // Use Intl.DateTimeFormat to get the user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Convert to ET (Eastern Time) for Dano
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    danoTime = etTime;
  } catch (error) {
    // Fallback: assume ET is UTC-5 (or UTC-4 during daylight saving)
    const etOffset = now.getTimezoneOffset() + (5 * 60); // Convert to ET
    danoTime = new Date(now.getTime() + (etOffset * 60 * 1000));
  }
  
  const danoHour = danoTime.getHours();
  const danoDay = danoTime.getDay(); // 0 = Sunday, 6 = Saturday
  const isBusinessHours = danoHour >= 8 && danoHour <= 18; // 8 AM - 6 PM ET
  const isWeekend = danoDay === 0 || danoDay === 6; // Sunday = 0, Saturday = 6
  
  // SPEEDRUN RULE: First item in CURRENT LIST always shows "Now", others show "Today"
  // This means if you're on item #10 (after completing 9), #10 should show "Now"
  const getSpeedrunTiming = (): { timing: string; color: string } => {
    // Check for federal holidays
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isHolidayTomorrow = isFederalHoliday(tomorrow);
    
    // Check if Monday is a working day (not a holiday)
    const monday = new Date(today);
    const daysUntilMonday = (1 - danoDay + 7) % 7; // Calculate days until Monday
    monday.setDate(today.getDate() + daysUntilMonday);
    const isMondayHoliday = isFederalHoliday(monday);
    const isMondayWorkingDay = !isMondayHoliday;
    
    if (recordIndex === 0) {
      // FIRST item in current visible list ALWAYS gets "Now" - regardless of absolute position
      if (isWeekend) {
        // If it's weekend and Monday is a working day, show "Monday"
        if (isMondayWorkingDay) {
          return { timing: 'Monday', color: getStandardizedActionTimingColor('Monday') };
        }
        // If Monday is also a holiday, show "Tuesday"
        return { timing: 'Tuesday', color: getStandardizedActionTimingColor('Tuesday') };
      }
      if (isHolidayTomorrow) {
        return { timing: 'Tuesday', color: getStandardizedActionTimingColor('Tuesday') };
      }
      return { timing: 'Now', color: getStandardizedActionTimingColor('Now') };
    } else {
      // All other Speedrun items should be done TODAY
      if (isWeekend) {
        // If it's weekend and Monday is a working day, show "Monday"
        if (isMondayWorkingDay) {
          return { timing: 'Monday', color: getStandardizedActionTimingColor('Monday') };
        }
        // If Monday is also a holiday, show "Tuesday"
        return { timing: 'Tuesday', color: getStandardizedActionTimingColor('Tuesday') };
      }
      if (isHolidayTomorrow) {
        return { timing: 'Tuesday', color: getStandardizedActionTimingColor('Tuesday') };
      }
      return { timing: 'Today', color: getStandardizedActionTimingColor('Today') };
    }
  };
  
  // Get intelligent action based on status and context with coach personality
  const getSpeedrunAction = (): string => {
    const name = record['fullName'] || record.name || 'this contact';
    const company = record['company'] || 'this company';
    const amount = record.amount || record.dealValue || 0;
    const title = record.title || record.jobTitle || '';
    
    switch (status) {
      case 'new':
      case 'uncontacted':
        if (amount >= 100000) {
          return `Call ${name} NOW - $${(amount/1000).toFixed(0)}K deal at ${company}`;
        }
        if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('vp')) {
          return `Call ${name} - C-level at ${company}`;
        }
        return `Call ${name} at ${company} - stop reading, start dialing`;
        
      case 'contacted':
        return `Follow up with ${name} - don't lose momentum`;
        
      case 'engaged':
      case 'responded':
        if (amount >= 50000) {
          return `Close ${name} - $${(amount/1000).toFixed(0)}K opportunity`;
        }
        return `Schedule discovery call with ${name}`;
        
      case 'qualified':
        return `Present solution to ${name} - time to close`;
        
      case 'demo':
        return `Follow up demo with ${name} - where's the contract?`;
        
      default:
        return `Advance ${name} at ${company} - stop stalling`;
    }
  };
  
  const timing = getSpeedrunTiming();
  const action = getSpeedrunAction();
  
  return {
    timing: timing.timing,
    timingColor: timing.color,
    action: action
  };
}

function getSpeedrunStatusColor(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusLower = status.toLowerCase();
  
  // CLEAR COLOR CODING FOR LEAD/PROSPECT/OPPORTUNITY:
  
  // Lead = Gray (new/uncontacted)
  if (statusLower === 'lead') {
    return 'bg-gray-100 text-gray-800';
  }
  
  // Prospect = Blue (all prospects same color)
  if (statusLower === 'prospect') {
    return 'bg-blue-100 text-blue-800';
  }
  
  // Opportunity = GREEN (high priority deals - user requested green)
  if (statusLower === 'opportunity') {
    return 'bg-green-100 text-green-800';
  }
  
  // Client = Green (existing clients)
  if (statusLower === 'client') {
    return 'bg-green-100 text-green-800';
  }
  
  // Default to gray
  return 'bg-gray-100 text-gray-800';
}

function getSpeedrunStatusLabel(status?: string): string {
  if (!status) return 'Lead';
  
  const statusLower = status.toLowerCase();
  if (['new', 'uncontacted'].includes(statusLower)) return 'Lead';
  if (['contacted', 'qualified', 'responded'].includes(statusLower)) return 'Prospect';
  if (['demo', 'proposal', 'negotiation'].includes(statusLower)) return 'Opportunity';
  if (['client', 'customer'].includes(statusLower)) return 'Client';
  
  // Capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Leads-specific Next Action with macro ranking system (50/day distributed over time)
function getLeadsNextAction(record: any, recordIndex?: number): { timing: string; timingColor: string; action: string } {
  const status = record.status?.toLowerCase() || '';
  const lastContactDate = record.lastContactDate || record.lastEmailDate || record.lastActivity;
  const priority = record.priority?.toLowerCase() || 'medium';
  
  // Check if this lead is also in Speedrun (high priority leads often are)
  const isInSpeedrun = priority === 'urgent' || priority === 'high' || 
                      status === 'responded' || status === 'engaged';
  
  // Weekend detection logic
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const isFriday = dayOfWeek === 5;
  
  // Calculate macro ranking score for timing distribution
  let rankingScore = 0;
  
  // Priority scoring
  if (priority === 'urgent') rankingScore += 100;
  else if (priority === 'high') rankingScore += 50;
  else if (priority === 'medium') rankingScore += 25;
  
  // Status scoring
  if (status === 'responded' || status === 'engaged') rankingScore += 75;
  else if (status === 'contacted') rankingScore += 40;
  else if (status === 'new' || status === 'uncontacted') rankingScore += 30;
  
  // Recent activity scoring
  const daysSinceContact = lastContactDate 
    ? Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceContact <= 3) rankingScore += 20;
  else if (daysSinceContact <= 7) rankingScore += 15;
  else if (daysSinceContact <= 14) rankingScore += 10;
  else if (daysSinceContact >= 30) rankingScore += 25; // Old leads get attention
  
  // Determine timing based on macro ranking distribution (50/day system)
  const getLeadsTiming = (): { timing: string; color: string } => {
    // If this lead is also in Speedrun, match Speedrun timing
    if (isInSpeedrun) {
      return { timing: 'Today', color: getStandardizedActionTimingColor('Today') };
    }
    
    // Macro ranking distribution based on score
    if (rankingScore >= 150) {
      // Top tier - next business day (accounting for weekends)
      if (isWeekend || isFriday) {
        return { timing: 'Monday', color: getStandardizedActionTimingColor('Monday') };
      } else {
        return { timing: 'This Week', color: getStandardizedActionTimingColor('This Week') };
      }
    } 
    else if (rankingScore >= 100) {
      // High tier - next week
      return { timing: 'Next Week', color: getStandardizedActionTimingColor('Next Week') };
    } 
    else if (rankingScore >= 50) {
      // Medium tier - two weeks
      return { timing: 'Two Weeks', color: getStandardizedActionTimingColor('Two Weeks') };
    } 
    else if (rankingScore >= 25) {
      // Lower tier - next month
      return { timing: 'Next Month', color: getStandardizedActionTimingColor('Next Month') };
    }
    else {
      // Lowest tier - future
      return { timing: 'Future', color: getStandardizedActionTimingColor('Future') };
    }
  };
  
  // Get action based on status with coach personality
  const getLeadsAction = (): string => {
    const name = record['fullName'] || record.name || 'this contact';
    const company = record['company'] || 'this company';
    const amount = record.amount || record.dealValue || 0;
    const title = record.title || record.jobTitle || '';
    
    switch (status) {
      case 'new':
      case 'uncontacted':
        if (amount >= 100000) {
          return `Call ${name} NOW - $${(amount/1000).toFixed(0)}K deal waiting`;
        }
        if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('vp')) {
          return `Call ${name} - executive decision maker`;
        }
        return `Call ${name} - stop procrastinating`;
        
      case 'contacted':
        return `Follow up with ${name} - don't let them forget you`;
        
      case 'engaged':
      case 'responded':
        if (amount >= 50000) {
          return `Close ${name} - $${(amount/1000).toFixed(0)}K opportunity`;
        }
        return `Schedule discovery call with ${name}`;
        
      case 'qualified':
        return `Present solution to ${name} - time to close`;
        
      default:
        return `Wake up ${name} at ${company} - they're going cold`;
    }
  };
  
  const timing = getLeadsTiming();
  const action = getLeadsAction();
  
  return {
    timing: timing.timing,
    timingColor: timing.color,
    action: action
  };
}

// Prospects-specific Next Action with proper pill formatting
function getProspectsNextAction(record: any, recordIndex?: number): { timing: string; timingColor: string; action: string } {
  const status = record.status?.toLowerCase() || '';
  const lastContactDate = record.lastContactDate || record.lastEmailDate || record.lastActivity;
  const priority = record.priority?.toLowerCase() || 'medium';
  const buyerGroupRole = record.buyerGroupRole || 'Stakeholder';
  
  // Weekend detection logic
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const isFriday = dayOfWeek === 5;
  
  // Calculate prospect-specific ranking score
  let rankingScore = 0;
  
  // Buyer group role scoring (Decision Makers get highest priority)
  if (buyerGroupRole === 'Decision Maker') rankingScore += 100;
  else if (buyerGroupRole === 'Champion') rankingScore += 75;
  else if (buyerGroupRole === 'Stakeholder') rankingScore += 50;
  else if (buyerGroupRole === 'Blocker') rankingScore += 25; // Blockers need attention too
  else if (buyerGroupRole === 'Introducer') rankingScore += 30;
  
  // Priority scoring
  if (priority === 'urgent') rankingScore += 80;
  else if (priority === 'high') rankingScore += 40;
  else if (priority === 'medium') rankingScore += 20;
  
  // Status scoring
  if (status === 'responded' || status === 'engaged') rankingScore += 60;
  else if (status === 'contacted') rankingScore += 30;
  else if (status === 'new' || status === 'uncontacted') rankingScore += 25;
  
  // Recent activity scoring
  const daysSinceContact = lastContactDate 
    ? Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceContact <= 3) rankingScore += 15;
  else if (daysSinceContact <= 7) rankingScore += 10;
  else if (daysSinceContact <= 14) rankingScore += 5;
  else if (daysSinceContact >= 30) rankingScore += 20; // Old prospects get attention
  
  // Determine timing based on prospect-specific ranking
  const getProspectsTiming = (): { timing: string; color: string } => {
    // Decision Makers get immediate attention
    if (buyerGroupRole === 'Decision Maker' && rankingScore >= 150) {
      if (isWeekend || isFriday) {
        return { timing: 'Monday', color: 'bg-red-100 text-red-800' };
      } else {
        return { timing: 'Today', color: 'bg-red-100 text-red-800' };
      }
    }
    
    // High-value prospects
    if (rankingScore >= 120) {
      if (isWeekend || isFriday) {
        return { timing: 'Monday', color: 'bg-orange-100 text-orange-800' };
      } else {
        return { timing: 'This Week', color: 'bg-orange-100 text-orange-800' };
      }
    } 
    else if (rankingScore >= 80) {
      return { timing: 'Next Week', color: 'bg-blue-100 text-blue-800' };
    } 
    else if (rankingScore >= 50) {
      return { timing: 'Two Weeks', color: 'bg-indigo-100 text-indigo-800' };
    } 
    else if (rankingScore >= 25) {
      return { timing: 'Next Month', color: 'bg-purple-100 text-purple-800' };
    }
    else {
      return { timing: 'Future', color: 'bg-gray-100 text-gray-600' };
    }
  };
  
  // Get action based on buyer group role and status
  const getProspectsAction = (): string => {
    const name = record['fullName'] || record.name || 'this contact';
    const company = record['company'] || 'this company';
    const title = record.title || record.jobTitle || '';
    
    // Role-specific actions
    if (buyerGroupRole === 'Decision Maker') {
      switch (status) {
        case 'new':
        case 'uncontacted':
          return `Call ${name} - decision maker at ${company}`;
        case 'contacted':
          return `Follow up with ${name} - close the deal`;
        case 'engaged':
        case 'responded':
          return `Present solution to ${name} - time to close`;
        default:
          return `Re-engage ${name} - decision maker going cold`;
      }
    } else if (buyerGroupRole === 'Champion') {
      switch (status) {
        case 'new':
        case 'uncontacted':
          return `Connect with ${name} - build champion relationship`;
        case 'contacted':
          return `Nurture ${name} - strengthen champion support`;
        case 'engaged':
        case 'responded':
          return `Leverage ${name} to influence decision makers`;
        default:
          return `Re-engage ${name} - champion support needed`;
      }
    } else if (buyerGroupRole === 'Blocker') {
      switch (status) {
        case 'new':
        case 'uncontacted':
          return `Address ${name}'s concerns - remove blocker`;
        case 'contacted':
          return `Overcome ${name}'s objections`;
        case 'engaged':
        case 'responded':
          return `Convert ${name} from blocker to supporter`;
        default:
          return `Re-engage ${name} - blocker needs attention`;
      }
    } else {
      // Default stakeholder actions
      switch (status) {
        case 'new':
        case 'uncontacted':
          return `Initial outreach to ${name}`;
        case 'contacted':
          return `Follow up with ${name}`;
        case 'engaged':
        case 'responded':
          return `Schedule discovery call with ${name}`;
        default:
          return `Continue nurturing ${name}`;
      }
    }
  };
  
  const timing = getProspectsTiming();
  const action = getProspectsAction();
  
  return {
    timing: timing.timing,
    timingColor: timing.color,
    action: action
  };
}

// Customer-specific Next Action with proper pill formatting
function getCustomerNextAction(record: any): { timing: string; timingColor: string; action: string } {
  const status = record.status?.toLowerCase() || record.customerStatus?.toLowerCase() || '';
  const healthScore = record.healthScore?.toLowerCase() || 'good';
  const lastDealDate = record.lastDealDate;
  const totalValue = record.totalLifetimeValue || record.arr || 0;
  
  // Calculate days since last opportunity for context
  const daysSinceLastDeal = lastDealDate 
    ? Math.floor((new Date().getTime() - new Date(lastDealDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Determine timing based on customer health and activity
  const getCustomerTiming = (): { timing: string; color: string } => {
    // Health-based urgency
    if (healthScore === 'poor' || healthScore === 'at-risk') {
      return { timing: 'Today', color: getStandardizedActionTimingColor('Today') };
    } else if (healthScore === 'fair' || healthScore === 'warning') {
      return { timing: 'This Week', color: getStandardizedActionTimingColor('This Week') };
    }
    
    // Activity-based timing
    if (daysSinceLastDeal && daysSinceLastDeal >= 90) {
      return { timing: 'This Week', color: getStandardizedActionTimingColor('This Week') };
    } else if (daysSinceLastDeal && daysSinceLastDeal >= 60) {
      return { timing: 'Two Weeks', color: getStandardizedActionTimingColor('Two Weeks') };
    } else if (daysSinceLastDeal && daysSinceLastDeal >= 30) {
      return { timing: 'Next Month', color: getStandardizedActionTimingColor('Next Month') };
    }
    
    // High-value customers get regular attention
    if (totalValue >= 100000) {
      return { timing: 'Next Week', color: getStandardizedActionTimingColor('Next Week') };
    }
    
    // Default customer maintenance
    return { timing: 'Next Month', color: getStandardizedActionTimingColor('Next Month') };
  };
  
  const getCustomerAction = (): string => {
    const name = record.name || record['company'] || 'customer';
    
    if (healthScore === 'poor' || healthScore === 'at-risk') {
      return `Urgent customer success check-in`;
    } else if (healthScore === 'fair' || healthScore === 'warning') {
      return `Customer health review`;
    } else if (daysSinceLastDeal && daysSinceLastDeal >= 90) {
      return `Explore new opportunities with ${name}`;
    } else if (daysSinceLastDeal && daysSinceLastDeal >= 60) {
      return `Quarterly business review`;
    } else {
      return `Regular customer success check-in`;
    }
  };
  
  const timing = getCustomerTiming();
  const action = getCustomerAction();
  
  return {
    timing: timing.timing,
    timingColor: timing.color,
    action: action
  };
}

// Company master ranking based on multiple people and opportunities
function getCompanyMasterRank(company: any, fallbackIndex: number): number | string {
  // Partners get excluded from ranking
  if (account['accountType'] === 'partner' || account.tags?.includes('partner')) {
    return '-';
  }
  
  // Calculate composite score based on:
  // 1. Number of contacts (more contacts = higher priority)
  // 2. Open opportunities (active deals boost priority)
  // 3. Customer status (existing customers get attention)
  // 4. Recent activity (recent engagement boosts rank)
  
  let compositeScore = 0;
  
  // People count scoring (more people = more important company)
  const peopleCount = account._count?.people || account.peopleCount || 0;
  compositeScore += peopleCount * 10;
  
  // Open opportunities scoring (active deals = high priority)
  const openOpps = account.openOpportunities || account._count?.opportunities || 0;
  compositeScore += openOpps * 25;
  
  // Customer status scoring (existing customers need attention)
  if (account.isCustomer) {
    compositeScore += 50;
  }
  
  // Revenue/value scoring
  const revenue = account.revenue || account.totalValue || 0;
  if (revenue >= 1000000) compositeScore += 30;
  else if (revenue >= 500000) compositeScore += 20;
  else if (revenue >= 100000) compositeScore += 10;
  
  // Recent activity scoring
  const lastActivity = account.lastActivityDate || account.lastContactDate;
  if (lastActivity) {
    const daysSince = Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) compositeScore += 15;
    else if (daysSince <= 30) compositeScore += 5;
  }
  
  // Convert score to rank (higher score = lower rank number)
  // This creates a dynamic ranking that changes based on activity
  return Math.max(1, fallbackIndex + 1 - Math.floor(compositeScore / 10));
}

// Person master ranking that aligns with Speedrun and other views
// Unified hierarchical ranking system: Companies first, then people within companies
function getPersonMasterRank(record: any, fallbackIndex: number): number | string {
  
  // Partners get excluded from ranking
  if (record['status'] === 'Partner' || record.tags?.includes('partner')) {
    return '-';
  }
  
  // Calculate unified rank based on company importance + person role
  let unifiedScore = 0;
  
  // === COMPANY RANKING FACTORS ===
  // Company size/importance
  const companySize = record.companySize || record.company?.companySize || 0;
  if (companySize >= 1000) unifiedScore += 100;
  else if (companySize >= 500) unifiedScore += 75;
  else if (companySize >= 100) unifiedScore += 50;
  else if (companySize >= 50) unifiedScore += 25;
  
  // Company revenue/value
  const revenue = record.revenue || record.company?.revenue || record.estimatedValue || 0;
  if (revenue >= 10000000) unifiedScore += 100; // $10M+
  else if (revenue >= 1000000) unifiedScore += 75;  // $1M+
  else if (revenue >= 500000) unifiedScore += 50;   // $500K+
  else if (revenue >= 100000) unifiedScore += 25;   // $100K+
  
  // Company industry importance
  const industry = record.industry || record.company?.industry || '';
  if (['Technology', 'Finance', 'Healthcare', 'Manufacturing'].includes(industry)) {
    unifiedScore += 30;
  } else if (['Legal', 'Real Estate', 'Construction'].includes(industry)) {
    unifiedScore += 20;
  }
  
  // === PERSON ROLE RANKING FACTORS ===
  // Buyer group role (Decision Makers get highest priority)
  const buyerGroupRole = record.buyerGroupRole || record.role || '';
  if (buyerGroupRole === 'Decision Maker') unifiedScore += 150;
  else if (buyerGroupRole === 'Champion') unifiedScore += 100;
  else if (buyerGroupRole === 'Stakeholder') unifiedScore += 75;
  else if (buyerGroupRole === 'Blocker') unifiedScore += 50; // Blockers need attention
  else if (buyerGroupRole === 'Introducer') unifiedScore += 60;
  
  // Job title/authority level
  const title = record.title || record.jobTitle || '';
  if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('president')) unifiedScore += 100;
  else if (title.toLowerCase().includes('vp') || title.toLowerCase().includes('vice president')) unifiedScore += 80;
  else if (title.toLowerCase().includes('director') || title.toLowerCase().includes('head of')) unifiedScore += 60;
  else if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('lead')) unifiedScore += 40;
  
  // === RECORD TYPE RANKING FACTORS ===
  // Status-based scoring
  const status = record.status?.toLowerCase() || '';
  if (status === 'responded' || status === 'engaged') unifiedScore += 80;
  else if (status === 'contacted') unifiedScore += 50;
  else if (status === 'new' || status === 'uncontacted') unifiedScore += 30;
  
  // Priority scoring
  const priority = record.priority?.toLowerCase() || '';
  if (priority === 'urgent') unifiedScore += 100;
  else if (priority === 'high') unifiedScore += 60;
  else if (priority === 'medium') unifiedScore += 30;
  
  // Record type importance
  if (record.recordType === 'customers' || record.isCustomer) unifiedScore += 120; // Existing customers
  else if (record.recordType === 'opportunities') unifiedScore += 100; // Active opportunities
  else if (record.recordType === 'leads') unifiedScore += 80; // Qualified leads
  else if (record.recordType === 'prospects') unifiedScore += 60; // Prospects
  
  // === ACTIVITY RANKING FACTORS ===
  // Recent activity boost
  const lastActivity = record.lastActivityDate || record.lastContactDate || record.updatedAt;
  if (lastActivity) {
    const daysSince = Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 3) unifiedScore += 40;
    else if (daysSince <= 7) unifiedScore += 25;
    else if (daysSince <= 14) unifiedScore += 15;
    else if (daysSince >= 30) unifiedScore += 20; // Old records need attention
  }
  
  // Open opportunities boost
  const openOpps = record.openOpportunities || record._count?.opportunities || 0;
  unifiedScore += openOpps * 30;
  
  // === NEXT ACTION PRIORITY RANKING ===
  // The key is ranking by "what's the next action" - who should be contacted next?
  
  // Get next action timing and urgency
  const nextActionDate = record.nextActionDate || record.nextFollowUpDate;
  const nextAction = record.nextAction || record.nextSteps;
  const lastContactDate = record.lastContactDate || record.lastActivityDate;
  
  // Calculate days since last contact
  const daysSinceLastContact = lastContactDate 
    ? Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Calculate days until next action
  const daysUntilNextAction = nextActionDate 
    ? Math.floor((new Date(nextActionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // === ACTION-BASED RANKING LOGIC ===
  let actionPriority = 0;
  
  // Overdue actions get highest priority (rank 1-10)
  if (daysUntilNextAction < 0) {
    actionPriority = Math.abs(daysUntilNextAction) * 50; // More overdue = higher priority
  }
  // Actions due today get high priority (rank 11-20)
  else if (daysUntilNextAction === 0) {
    actionPriority = 100;
  }
  // Actions due tomorrow get medium-high priority (rank 21-30)
  else if (daysUntilNextAction === 1) {
    actionPriority = 80;
  }
  // Actions due this week get medium priority (rank 31-50)
  else if (daysUntilNextAction <= 7) {
    actionPriority = 60 - (daysUntilNextAction * 5);
  }
  // Actions due next week get lower priority (rank 51-70)
  else if (daysUntilNextAction <= 14) {
    actionPriority = 40 - (daysUntilNextAction * 2);
  }
  // No next action set - use last contact timing
  else if (!nextActionDate) {
    if (daysSinceLastContact >= 30) actionPriority = 70; // Haven't contacted in 30+ days
    else if (daysSinceLastContact >= 14) actionPriority = 50; // Haven't contacted in 2+ weeks
    else if (daysSinceLastContact >= 7) actionPriority = 30; // Haven't contacted in 1+ week
    else actionPriority = 10; // Recently contacted
  }
  
  // === COMBINE ACTION PRIORITY WITH COMPANY/PERSON IMPORTANCE ===
  // Action priority is the primary factor, but company/person importance creates sub-ranking
  const finalScore = (actionPriority * 10) + (unifiedScore / 10);
  
  // Convert to rank (higher score = lower rank number, rank 1 is most urgent)
  const rank = Math.max(1, Math.floor(1000 / (finalScore + 1)) + 1);
  
  return rank;
}

// Account stage determination
function getAccountStage(account: any): string {
  if (account.isCustomer) return 'Customer';
  
  const openOpps = account.openOpportunities || account._count?.opportunities || 0;
  if (openOpps > 0) return 'Opportunity';
  
  const peopleCount = account._count?.people || account.peopleCount || 0;
  if (peopleCount > 0) return 'Engaged';
  
  return 'Prospect';
}

// Person stage determination
function getPersonStage(person: any): string {
  const status = person.status?.toLowerCase() || '';
  
  if (person.isCustomer) return 'Customer';
  if (status === 'responded' || status === 'engaged') return 'Engaged';
  if (status === 'contacted') return 'Contacted';
  if (status === 'qualified') return 'Qualified';
  
  return 'Prospect';
}

// Account stage color
function getAccountStageColor(account: any): string {
  const stage = getAccountStage(account);
  
  switch (stage) {
    case 'Customer': return 'bg-green-100 text-green-800';
    case 'Opportunity': return 'bg-blue-100 text-blue-800';
    case 'Engaged': return 'bg-purple-100 text-purple-800';
    case 'Prospect': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Person stage color
function getPersonStageColor(person: any): string {
  const stage = getPersonStage(person);
  
  switch (stage) {
    case 'Customer': return 'bg-green-100 text-green-800';
    case 'Engaged': return 'bg-blue-100 text-blue-800';
    case 'Contacted': return 'bg-purple-100 text-purple-800';
    case 'Qualified': return 'bg-indigo-100 text-indigo-800';
    case 'Prospect': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Customer status color
function getCustomerStatusColor(isCustomer: boolean): string {
  return isCustomer 
    ? 'bg-green-100 text-green-800' 
    : 'bg-blue-100 text-blue-800';
}

// Account Next Action tied to most recent contact activity
function getAccountNextAction(account: any): { timing: string; timingColor: string; action: string } {
  // Import the company-centric ranking system
  const { getAccountNextAction: getCompanyCentricAccountAction } = require('@/platform/services/global-ranking-system');
  
  // For now, we don't have access to allContacts in this context
  // In a full implementation, this would be passed from the parent component
  // Use the company-centric ranking system with empty contacts array
  return getCompanyCentricAccountAction(account, []);
}

// Person Next Action using Company-Centric Ranking System
function getPersonNextAction(person: any): { timing: string; timingColor: string; action: string } {
  // Import the company-centric ranking system
  const { getContactNextAction: getCompanyCentricContactAction } = require('@/platform/services/global-ranking-system');
  
  // Use the company-centric ranking system
  return getCompanyCentricContactAction(person);
}

function generateAdvice(record: any): string {
  const company = record['company'] || 'Unknown Company';
  const title = record.title || record.jobTitle || 'Unknown Title';
  const name = record['fullName'] || 
               (record['firstName'] && record.lastName ? `${record.firstName} ${record.lastName}` : '') ||
               record.name || 'Unknown';
  
  // Generate contextual advice based on role and company
  const titleLower = title.toLowerCase();
  const companyLower = company.toLowerCase();
  
  // Role-based advice with more detail
  if (titleLower.includes('cto') || titleLower.includes('chief technology')) {
    return `Tech leader at ${company}. Focus on scalability challenges, security concerns, and innovation ROI. Likely pain points: legacy system modernization, team productivity, and technical debt management.`;
  }
  if (titleLower.includes('ceo') || titleLower.includes('founder')) {
    return `Decision maker at ${company}. Emphasize business impact, competitive advantage, and growth acceleration. Key concerns: market positioning, operational efficiency, and strategic technology investments.`;
  }
  if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    return `VP-level at ${company}. Discuss strategic initiatives, team efficiency gains, and departmental optimization. Focus on: cross-functional collaboration, process improvement, and measurable business outcomes.`;
  }
  if (titleLower.includes('director')) {
    return `Director at ${company}. Focus on operational improvements, team productivity, and tactical execution. Pain points likely include: resource allocation, workflow bottlenecks, and performance measurement.`;
  }
  if (titleLower.includes('manager')) {
    return `Manager at ${company}. Highlight workflow optimization, team collaboration, and day-to-day efficiency. Address: task management, communication gaps, and team coordination challenges.`;
  }
  
  // Company-based advice with industry insights
  if (companyLower.includes('retail') || companyLower.includes('7-eleven') || companyLower.includes('target') || companyLower.includes('walmart')) {
    return `Retail professional at ${company}. Discuss customer experience optimization, inventory management, and omnichannel solutions. Key pain points: supply chain visibility, customer data integration, and competitive pricing pressure.`;
  }
  if (companyLower.includes('tech') || companyLower.includes('software') || companyLower.includes('digital')) {
    return `Tech industry contact at ${company}. Focus on developer productivity, API integration, and technical scalability. Common challenges: system integration complexity, development velocity, and technical infrastructure costs.`;
  }
  
  // Generic advice with enhanced context
  return `Professional at ${company}. Build rapport by understanding their industry challenges, demonstrate clear value proposition, and focus on measurable business impact. Research their recent company initiatives and market position.`;
}

function getRecordStatus(record: any): string {
  // Flexible data mapping for different workspace naming conventions
  const normalizeStatus = (status: string): string => {
    if (!status) return '';
    const lower = status.toLowerCase();
    
    // Map various naming conventions to standard terms
    const statusMappings: Record<string, string> = {
      // Opportunity variations
      'opp': 'opportunity', 'oppty': 'opportunity', 'deal': 'opportunity',
      'proposal': 'opportunity', 'negotiation': 'opportunity', 'closing': 'opportunity',
      'demo': 'opportunity', 'quote': 'opportunity',
      
      // Prospect variations  
      'qualified': 'prospect', 'contacted': 'prospect', 'engaged': 'prospect',
      'warm': 'prospect', 'responded': 'prospect', 'interested': 'prospect',
      
      // Lead variations
      'new': 'lead', 'uncontacted': 'lead', 'cold': 'lead', 'fresh': 'lead',
      
      // Client variations
      'customer': 'client', 'account': 'client', 'existing': 'client'
    };
    
    return statusMappings[lower] || lower;
  };

  // PRIORITY: Use explicit type field from API if available (most accurate)
  if (record.type) {
    const type = record.type.toLowerCase();
    if (type === 'lead') return 'Lead';
    if (type === 'prospect') return 'Prospect';
    if (type === 'opportunity') return 'Opportunity';
    if (type === 'client') return 'Client';
    if (type === 'account') return 'Account';
    if (type === 'contact') return 'Contact';
  }
  
  // FALLBACK: Use source field from API (indicates origin table)
  if (record.source) {
    const source = record.source.toLowerCase();
    if (source === 'leads') return 'Lead';
    if (source === 'prospects') return 'Prospect';
    if (source === 'opportunities') return 'Opportunity';
    if (source === 'clients') return 'Client';
    if (source === 'accounts') return 'Account';
    if (source === 'contacts') return 'Contact';
  }

  // Determine the primary status based on the record type and properties
  let primaryStatus = 'Lead'; // Default
  
  // Check if they're a client first (clients can still have opportunities)
  const isClient = record.isClient || record['clientStatus'] === 'active' || 
                   record['type'] === 'client' || normalizeStatus(record.status || '') === 'client';
  
  // Check if it's an opportunity (highest priority status)
  // Look for opportunity indicators: stage, amount, dealValue, or related opportunities
  const hasOpportunity = record.stage || record.amount || record.dealValue || 
                        record.opportunities?.length > 0 ||
                        record.value || record.revenue || record.deal_value ||
                        normalizeStatus(record.status || '') === 'opportunity' ||
                        // Additional speedrun-specific opportunity indicators - these should show as green pills
                        (record['status'] && ['qualified', 'proposal', 'negotiation', 'demo', 'won', 'converted', 'closed won', 'contacted', 'opportunity'].includes(record.status.toLowerCase()));
  
  if (hasOpportunity) {
    primaryStatus = 'Opportunity';
  }
  // Check if it's a prospect (has been engaged)
  else if (record.lastContactDate || record.engagementScore ||
           normalizeStatus(record.status || '') === 'prospect') {
    primaryStatus = 'Prospect';
  }
  // Check for lead status
  else if (normalizeStatus(record.status || '') === 'lead') {
    primaryStatus = 'Lead';
  }
  
  // For clients with opportunities, show "Opportunity" status
  // For clients without opportunities, they can still be prospects for more business
  if (isClient) {
    // Clients with active opportunities get "Opportunity" status
    if (hasOpportunity) {
      return 'Opportunity';
    }
    // Existing clients without opportunities are prospects for expansion/upsell
    return primaryStatus === 'Lead' ? 'Prospect' : primaryStatus;
  }
  
  // Fix: When we have an opportunity (green status), always show "Opportunity"
  if (hasOpportunity) {
    return 'Opportunity';
  }
  
  return primaryStatus;
}

function generateDetailedAdvice(record: any): { advice: string; painIntelligence: string; approach: string } {
  const company = record['company'] || 'Unknown Company';
  const title = record.title || record.jobTitle || 'Unknown Title';
  const titleLower = title.toLowerCase();
  const companyLower = company.toLowerCase();
  
  let advice = '';
  let painIntelligence = '';
  let approach = '';
  
  // Role-based detailed analysis
  if (titleLower.includes('cto') || titleLower.includes('chief technology')) {
    advice = `Tech leader focused on strategic technology decisions and innovation roadmap.`;
    painIntelligence = `Likely struggling with: Legacy system modernization (70% of CTOs), technical debt management, cloud migration complexity, and balancing innovation with stability. Security and compliance are top priorities.`;
    approach = `Lead with technical architecture discussions, share case studies of similar tech transformations, and focus on ROI metrics for technology investments.`;
  } else if (titleLower.includes('ceo') || titleLower.includes('founder')) {
    advice = `C-level executive responsible for overall business strategy and growth.`;
    painIntelligence = `Primary concerns: Market competition, operational efficiency, customer acquisition costs, and sustainable growth. Time-constrained and results-focused.`;
    approach = `Present high-level business impact, competitive advantages, and strategic value. Keep initial conversations brief but impactful.`;
  } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    advice = `Senior executive managing strategic initiatives and cross-functional teams.`;
    painIntelligence = `Challenges include: Departmental silos, resource allocation, performance measurement, and aligning team objectives with company goals.`;
    approach = `Focus on strategic outcomes, team productivity gains, and measurable business results. Discuss cross-departmental collaboration benefits.`;
  } else {
    advice = `Professional contributor focused on operational excellence and team collaboration.`;
    painIntelligence = `Common pain points: Workflow inefficiencies, communication gaps, manual processes, and limited visibility into team performance.`;
    approach = `Demonstrate practical solutions, quick wins, and day-to-day productivity improvements. Show clear before/after scenarios.`;
  }
  
  // Industry-specific enhancements
  if (companyLower.includes('retail')) {
    painIntelligence += ` Retail-specific: Inventory optimization, customer experience consistency, omnichannel integration, and seasonal demand fluctuations.`;
  }
  
  return { advice, painIntelligence, approach };
}

function getSource(record: any): string {
  // Check various source fields from the data model
  return record.source || 
         record.leadSource || 
         record.acquisitionSource ||
         record.referralSource ||
         record.origin ||
         'Direct';
}

function getHealthScoreColor(score?: number | string): string {
  if (!score) return 'bg-gray-100 text-gray-800';
  
  const numScore = typeof score === 'string' ? parseInt(score) : score;
  
  if (numScore >= 80) return 'bg-green-100 text-green-800';
  if (numScore >= 60) return 'bg-yellow-100 text-yellow-800';
  if (numScore >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

function getStrengthColor(strength?: string): string {
  if (!strength) return 'bg-gray-100 text-gray-800';
  
  switch (strength.toLowerCase()) {
    case 'strong':
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'weak':
    case 'low':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

