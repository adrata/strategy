"use client";

/**
 * 🚀 PIPELINE HEADER COMPONENT
 * 
 * Clean header with section info, metrics, and actions
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
// Removed deleted PipelineDataStore - using unified data system
import { getTimeTrackingData, formatHours } from '@/platform/utils/time-tracking';
import { isWeekend, isHoliday } from '@/platform/utils/workday-utils';
import { AddNoteModal } from './AddNoteModal';
import { AddActionModal, ActionLogData } from './AddActionModal';
import { AddTaskModal } from './AddTaskModal';
import { UnifiedAddActionButton } from '@/platform/ui/components/UnifiedAddActionButton';
import { PanelLoader } from '@/platform/ui/components/Loader';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { getDynamicGoals } from '@/platform/services/global-ranking-system';
import { PipelineMetrics } from '@/platform/services/pipeline-metrics-calculator';
import { 
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  FlagIcon,
  // BullseyeIcon, // Not available in this version
  LinkIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

interface MetricItem {
  label: string;
  value: string | number;
  target?: number;
  isProgress?: boolean;
  isHighlight?: boolean;
  color?: string;
  isLive?: boolean;
}

type SpeedrunView = 'sales_actions' | 'prospects' | 'time' | 'insights';

interface PipelineHeaderProps {
  section: string;
  metrics: PipelineMetrics | null;
  onSectionChange: (section: string) => void;
  onRefresh: () => void;
  onClearCache: () => void;
  onAddRecord?: () => void;
  loading?: boolean;
  recordCount?: number;
}

export function PipelineHeader({ 
  section, 
  metrics, 
  onSectionChange, 
  onRefresh, 
  onClearCache, 
  onAddRecord,
  loading,
  recordCount
}: PipelineHeaderProps) {
  const { user } = useUnifiedAuth();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [timeData, setTimeData] = useState(() => {
    const data = getTimeTrackingData();
    // Provide realistic defaults if data is empty
    return {
      ...data,
      hoursLeft: data.hoursLeft || 6.5, // Realistic work day remaining
      todayProgress: data.todayProgress || 12, // Some progress made
      todayTarget: data.todayTarget || 30,
      weekProgress: data.weekProgress || 47, // This week progress
      weekTarget: data.weekTarget || 250,
      allTimeRecord: data.allTimeRecord || 285 // All time record
    };
  });
  
  // Get view from URL params or default to now timeframe
  const getInitialView = (): SpeedrunView => {
    if (typeof window === 'undefined') return 'sales_actions';
    const urlView = searchParams.get('view');
    // For speedrun section, we use timeframe parameters instead of view parameters
    if (section === 'speedrun') {
      return 'sales_actions'; // Always use sales_actions for speedrun content (internal)
    }
    if (urlView === 'actions' || urlView === 'sales_actions') return 'sales_actions';
    if (urlView === 'targets' || urlView === 'prospects') return 'prospects';
    if (urlView === 'calendar' || urlView === 'time') return 'time';
    if (urlView === 'insights') return 'insights';
    return 'sales_actions';
  };
  
  // Speedrun dropdown state
  const [currentView, setCurrentView] = useState<SpeedrunView>(getInitialView);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddActionDropdown, setShowAddActionDropdown] = useState(false);
  
  // Share dropdown state
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.speedrun-dropdown-container')) {
        setShowDropdown(false);
      }
      if (showShareDropdown && !(event.target as Element).closest('.share-dropdown-container')) {
        setShowShareDropdown(false);
      }
      if (showAddActionDropdown && !(event.target as Element).closest('.add-action-dropdown-container')) {
        setShowAddActionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown, showShareDropdown, showAddActionDropdown]);

  // Sync URL with view changes (disabled for speedrun for clean URLs)
  useEffect(() => {
    if (section === 'speedrun') {
      // Keep clean URLs for Speedrun - no view parameters
      const currentParams = new URLSearchParams(searchParams.toString());
      if (currentParams.has('view')) {
        currentParams.delete('view');
        const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [section, searchParams, pathname, router]);

  // Sync state with URL changes
  useEffect(() => {
    if (section === 'speedrun') {
      const newView = getInitialView();
      if (newView !== currentView) {
        setCurrentView(newView);
      }
    }
  }, [searchParams, section]);

  const getUrlParamForView = (view: SpeedrunView): string => {
    switch (view) {
      case 'sales_actions': return 'actions';
      case 'prospects': return 'targets';
      case 'time': return 'calendar';
      case 'insights': return 'insights';
      default: return 'actions';
    }
  };

  // Dropdown helper functions
  const handleViewChange = (view: SpeedrunView) => {
    setCurrentView(view);
    setShowDropdown(false);
    
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('view', getUrlParamForView(view));
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    
    // Emit event to update middle panel content based on selected view
    window.dispatchEvent(new CustomEvent('speedrun-view-change', { 
      detail: { view } 
    }));
  };

  const getViewIcon = (view: SpeedrunView) => {
    switch (view) {
      case 'sales_actions': return CheckCircleIcon;
      case 'prospects': return FlagIcon;
      case 'time': return CalendarIcon;
      case 'insights': return ChartBarIcon;
      default: return CheckCircleIcon;
    }
  };

  const getViewLabel = (view: SpeedrunView) => {
    switch (view) {
      case 'sales_actions': return 'Actions';
      case 'prospects': return 'Targets';
      case 'time': return 'Calendar';
      case 'insights': return 'Insights';
      default: return 'Actions';
    }
  };

  // Timeframe functionality
  const getCurrentTimeframe = (): string => {
    if (typeof window === 'undefined') return 'now';
    const urlView = searchParams.get('view');
    if (urlView === 'week') return 'week';
    if (urlView === 'month') return 'month';
    if (urlView === 'quarter') return 'quarter';
    return 'now'; // Default to 'now'
  };

  const getTimeframeLabel = (): string => {
    const timeframe = getCurrentTimeframe();
    switch (timeframe) {
      case 'now': return 'Now';
      case 'week': return 'Week';
      case 'month': return 'Month';
      case 'quarter': return 'Quarter';
      default: return 'Now';
    }
  };

  const handleTimeframeChange = (timeframe: string) => {
    setShowDropdown(false);
    
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('view', timeframe);
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    
    // Emit event to update data filtering
    window.dispatchEvent(new CustomEvent('speedrun-timeframe-change', { 
      detail: { timeframe } 
    }));
  };

  // Share functionality
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setShowShareDropdown(false);
      
      // Hide feedback after 2 seconds
      setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Update time data every minute
  useEffect(() => {
    const updateTimeData = () => {
      setTimeData(getTimeTrackingData());
    };

    // Update immediately
    updateTimeData();

    // Set up interval to update every minute
    const interval = setInterval(updateTimeData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle action logging
  const handleActionSubmit = async (actionData: ActionLogData) => {
    // If we have a selected record, use it; otherwise, use the contact from actionData
    const recordId = selectedRecord?.id || actionData.contactId;
    const recordType = selectedRecord ? section.slice(0, -1) : 'contact'; // Default to contact if no record
    
    if (!recordId && !actionData.contactId) {
      console.error('No record or contact selected for action');
      return;
    }
    
    try {
      const response = await fetch('/api/actions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: recordId,
          recordType: recordType,
          actionType: actionData.actionType,
          notes: actionData.notes,
          nextAction: actionData.nextAction,
          nextActionDate: actionData.nextActionDate,
          actionPerformedBy: actionData.actionPerformedBy,
          contactId: actionData.contactId,
          workspaceId: user?.activeWorkspaceId || user?.workspaces?.[0]?.id,
          userId: user?.id
        })
      });

      if (response.ok) {
        setShowAddActionModal(false);
        setSelectedRecord(null);
        // Trigger refresh
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  // Handle task creation
  const handleTaskSubmit = async (taskData: any) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: taskData.subject,
          description: taskData.description,
          type: taskData.type,
          priority: taskData.priority,
          status: 'planned',
          scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate).toISOString() : null,
          workspaceId: user?.activeWorkspaceId || user?.workspaces?.[0]?.id,
          userId: user?.id
        })
      });

      if (response.ok) {
        setShowAddTaskModal(false);
        // Trigger refresh
        onRefresh();
        alert('Task created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  
  // Handle button action
  const handleAction = useCallback(() => {
    if (section === 'speedrun') {
      console.log('Starting speedrun...');
      // Use workspace-aware navigation
      navigateToPipeline('speedrun/start');
    } else {
      console.log(`Creating new ${section.slice(0, -1)}`);
      onAddRecord?.();
    }
  }, [section, navigateToPipeline, onAddRecord]);

   // Add keyboard shortcut for Cmd+G (Go/Start) - ONLY for Speedrun
  useEffect(() => {
    if (section !== 'speedrun') return; // Only enable shortcut for Speedrun
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'g') {
        event.preventDefault();
        handleAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, section]);


  
  // Get section display info
  const getSectionInfo = () => {
    const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Format record count with comma for thousands
    const formatRecordCount = (count: number) => {
      return count.toLocaleString();
    };
    
    switch (section) {
      case 'leads':
        return {
          title: 'Leads',
          subtitle: 'Cold relationships',
          actionButton: 'Add Lead',
          secondaryActionButton: 'Add Action'
        };
      case 'prospects':
        return {
          title: 'Prospects',
          subtitle: 'Warm relationships',
          actionButton: 'Add Prospect',
          secondaryActionButton: 'Add Action'
        };
      case 'opportunities':
        return {
          title: 'Opportunities',
          subtitle: recordCount ? `${formatRecordCount(recordCount)} records` : 'Real pipeline',
          actionButton: 'Add Opportunity',
          secondaryActionButton: 'Add Action'
        };
      case 'companies':
        return {
          title: 'Companies',
          subtitle: recordCount ? `${formatRecordCount(recordCount)} records` : 'Business entities',
          actionButton: 'Add Company',
          secondaryActionButton: 'Add Action'
        };
      case 'people':
        return {
          title: 'People',
          subtitle: recordCount ? `${formatRecordCount(recordCount)} records` : 'Individual entities',
          actionButton: 'Add Person',
          secondaryActionButton: 'Add Action'
        };
      case 'clients':
        return {
          title: 'Clients',
          subtitle: recordCount ? `${formatRecordCount(recordCount)} records` : 'Earned relationships',
          actionButton: 'Add Client'
        };
      case 'partners':
        return {
          title: 'Partners',
          subtitle: recordCount ? `${formatRecordCount(recordCount)} records` : 'Strategic alliances',
          actionButton: 'Add Partner'
        };
      case 'speedrun':
        return {
          title: 'Speedrun',
          subtitle: 'Win more, faster',
          actionButton: 'Add Person',
          secondaryActionButton: 'Start Speedrun',
          showStartSpeedrun: true
        };
      case 'dashboard':
        // Get current date and week number with week range
        const now = new Date();
        // Use ISO week calculation for accurate week numbers
        const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        // Calculate week range (Monday-Sunday, business standard)
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Monday + 6 = Sunday
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const startMonth = monthNames[startOfWeek.getMonth()];
        const endMonth = monthNames[endOfWeek.getMonth()];
        const startDay = startOfWeek.getDate();
        const endDay = endOfWeek.getDate();
        
        // Format: "Week 36 (Aug 31-Sep 6)" 
        const weekRange = startMonth === endMonth 
          ? `${startMonth} ${startDay}-${endDay}`
          : `${startMonth} ${startDay}-${endMonth} ${endDay}`;
        
        return {
          title: 'Dashboard',
          subtitle: `Week ${weekNumber} (${weekRange})`,
          actionButton: 'Add Person',
          secondaryActionButton: 'Add Action',
          showShare: true,
          showAddNote: true,
          showStartSpeedrun: false
        };
      case 'metrics':
        return {
          title: 'Metrics',
          subtitle: 'Key performance indicators',
          actionButton: 'Share'
        };
      default:
        return {
          title: sectionTitle,
          subtitle: 'Pipeline data',
          actionButton: 'Add Record'
        };
    }
  };

  const sectionInfo = getSectionInfo();

  // Format metrics for display
  const formatMetrics = (): MetricItem[] => {
    const metricItems: MetricItem[] = [];
    
    // Handle null metrics case
    if (!metrics) {
      return [];
    }
    
    // Special handling for Speedrun section - show different metrics based on current view
    if (section === 'speedrun') {
      // Check if today is a weekend or holiday - hide stats if so
      const today = new Date();
      if (isWeekend(today) || isHoliday(today)) {
        return []; // Return empty array to hide all stats
      }
      
      // Use imported getDynamicGoals function
      const dynamicGoals = getDynamicGoals();
      
      switch (currentView) {
        case 'sales_actions':
          // Sales Actions view - show only 3 key metrics
          metricItems.push({
            label: 'Hours Left',
            value: formatHours(timeData.hoursLeft),
            color: 'text-gray-900',
            isHighlight: false
          });
          metricItems.push({
            label: 'Today',
            value: timeData.todayProgress,
            target: dynamicGoals.daily,
            isProgress: true,
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'This Week',
            value: timeData.weekProgress,
            target: dynamicGoals.weekly,
            isProgress: true,
            color: 'text-gray-900'
          });
          // Removed 'All Time' to show only 3 stats
          break;

        case 'prospects':
          // Quality Targets view - show daily goals progress
          metricItems.push({
            label: 'Actions Left',
            value: '8', // TODO: Calculate from actual actions
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Calls',
            value: '0',
            target: 15,
            isProgress: true,
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Emails',
            value: '0',
            target: 25,
            isProgress: true,
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Meetings',
            value: '0',
            target: 4,
            isProgress: true,
            color: 'text-gray-900'
          });
          break;

        case 'insights':
          // Insights view - show intelligence metrics
          metricItems.push({
            label: 'Fresh Insights',
            value: '12',
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Industry Trends',
            value: '8',
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Competitive Intel',
            value: '5',
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Last Updated',
            value: '2h ago',
            color: 'text-gray-500'
          });
          break;

        case 'time':
          // Calendar view - show time-based metrics
          metricItems.push({
            label: 'Free Time',
            value: '4.5h', // TODO: Calculate from calendar
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Meetings',
            value: '5',
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Focus Blocks',
            value: '3',
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'Busy Time',
            value: '3.5h',
            color: 'text-gray-900'
          });
          break;

        default:
          // Fallback to original metrics
          metricItems.push({
            label: 'Hours Left',
            value: formatHours(timeData.hoursLeft),
            color: 'text-gray-900',
            isHighlight: false
          });
          metricItems.push({
            label: 'Today',
            value: timeData.todayProgress,
            target: timeData.todayTarget,
            isProgress: true,
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'This Week',
            value: timeData.weekProgress,
            target: timeData.weekTarget,
            isProgress: true,
            color: 'text-gray-900'
          });
          metricItems.push({
            label: 'All Time',
            value: timeData.allTimeRecord.toString(),
            color: 'text-gray-900'
          });
      }
      
      return metricItems;
    }
    
    // Special handling for Metrics section
    if (section === 'metrics') {
      metricItems.push({
        label: 'KPIs Tracked',
        value: '16',
        color: 'text-gray-900'
      });
      metricItems.push({
        label: 'Data Sources',
        value: '5',
        color: 'text-gray-900'
      });
      metricItems.push({
        label: 'Real-time',
        value: 'Live',
        color: 'text-green-600',
        isLive: true
      });
      return metricItems;
    }
    
    // Special handling for Sellers section - Monaco-style metrics
    if (section === 'sellers') {
      metricItems.push({
        label: 'Qualification Score',
        value: '83%',
        color: 'text-gray-900'
      });
      metricItems.push({
        label: 'People',
        value: '12',
        color: 'text-gray-900'
      });
      metricItems.push({
        label: 'Daily Target',
        value: '200/day',
        color: 'text-gray-900'
      });
      metricItems.push({
        label: 'Weekly',
        value: '150/400',
        color: 'text-gray-900'
      });
      return metricItems;
    }
    
    // Default metrics for other sections
    if (metrics['totalPipelineValue'] && section !== 'leads') {
      metricItems.push({
        label: section === 'opportunities' ? 'Pipeline Value' : 'Total Value',
        value: metrics.totalPipelineValue,
        color: 'text-gray-900'
      });
    }
    
    // For leads, show Accounts and Leads counts from the unified API
    if (section === 'leads') {
      // Use the counts from the unified API data
      const leadsCount = recordCount || (metrics.totalLeads ?? 0);
      
      // Calculate unique companies (accounts) from the actual leads data
      const uniqueCompanies = new Set();
      if ('data' in metrics && Array.isArray(metrics.data)) {
        metrics.data.forEach((lead: any) => {
          if (lead.company) uniqueCompanies.add(lead.company);
        });
      }
      
      // Calculate overdue actions
      const now = new Date();
      const overdueActions = metrics.data ? metrics.data.filter((lead: any) => {
        const nextActionDate = lead.nextActionDate || lead.nextContactDate;
        if (!nextActionDate) return false;
        return new Date(nextActionDate) < now;
      }).length : 0;
      
      metricItems.push({
        label: 'Actions',
        value: overdueActions.toString(),
        color: overdueActions > 0 ? 'text-red-600' : 'text-gray-900'
      });
      
      metricItems.push({
        label: uniqueCompanies['size'] === 1 ? 'Company' : 'Companies',
        value: uniqueCompanies.size.toString(),
        color: 'text-gray-900'
      });
      
      metricItems.push({
        label: leadsCount === 1 ? 'Lead' : 'Leads',
        value: leadsCount.toString(),
        color: 'text-gray-900'
      });
    } else if (section !== 'dashboard') {
      // For prospects section, show detailed stats instead of just total
      if (section === 'prospects') {
        const totalCount = recordCount || (metrics.totalLeads ?? 0);
        
        // Calculate unique companies from the actual data
        const uniqueCompanies = new Set();
        if ('data' in metrics && Array.isArray(metrics.data)) {
          metrics.data.forEach((prospect: any) => {
            if (prospect.company || prospect.companyName) {
              uniqueCompanies.add(prospect.company || prospect.companyName);
            }
          });
        }
        
        // Calculate overdue actions
        const now = new Date();
        const overdueActions = metrics.data ? metrics.data.filter((prospect: any) => {
          const nextActionDate = prospect.nextActionDate || prospect.nextContactDate;
          if (!nextActionDate) return false;
          return new Date(nextActionDate) < now;
        }).length : 0;
        
        // Calculate recent activity (last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentActivity = metrics.data ? metrics.data.filter((prospect: any) => {
          const lastActionDate = prospect.lastActionDate || prospect.lastContactDate || prospect.lastContact;
          if (!lastActionDate) return false;
          return new Date(lastActionDate) >= sevenDaysAgo;
        }).length : 0;
        
        metricItems.push({
          label: 'Actions',
          value: overdueActions.toString(),
          color: overdueActions > 0 ? 'text-red-600' : 'text-gray-900'
        });
        
        metricItems.push({
          label: uniqueCompanies.size === 1 ? 'Company' : 'Companies',
          value: uniqueCompanies.size.toString(),
          color: 'text-gray-900'
        });
        
        metricItems.push({
          label: 'Prospects',
          value: totalCount.toString(),
          color: 'text-gray-900'
        });
      } else {
        // Use recordCount for all other sections
        const totalCount = recordCount || (metrics.totalLeads ?? 0);
        
        metricItems.push({
          label: 'Total',
          value: totalCount.toString(),
          color: 'text-gray-900'
        });
        
        if (metrics.winRate) {
          metricItems.push({
            label: 'Win Rate',
            value: metrics.winRate,
            color: 'text-gray-900'
          });
        }
      }
    }
    
    if (metrics.leadConversionRate) {
      metricItems.push({
        label: 'Conversion',
        value: metrics.leadConversionRate,
        color: 'text-gray-900'
      });
    }
    
    return metricItems;
  };

  const metricItems = formatMetrics();

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Title only */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {sectionInfo.title}
            </h1>
            <p className="text-sm text-gray-500">{sectionInfo.subtitle}</p>
          </div>
          
          {/* Right side: Compact metrics and Add button */}
          <div className="flex items-center gap-6">
            {/* Compact metrics */}
            <div className="flex items-center gap-4 text-sm">
              {metricItems.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className={`font-semibold ${metric.isHighlight ? 'text-lg' : 'text-base'} flex items-center justify-center gap-1`}>
                    {metric['isLive'] && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    {metric.isProgress ? (
                      <>
                        <span className={metric.color || 'text-gray-900'}>{metric.value}</span>
                        <span className="text-gray-900">/{metric.target}</span>
                      </>
                    ) : (
                      <span className={metric.color || 'text-gray-900'}>{metric.value}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 tracking-wide">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Speedrun timeframe dropdown - only show for speedrun section */}
              {/* Removed Now dropdown for cleaner Speedrun interface */}


              {/* Dashboard section with Add Person and Add Action buttons */}
              {section === 'dashboard' ? (
                <>
                  {sectionInfo['actionButton'] && (
                    <button
                      onClick={handleAction}
                      className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      {sectionInfo.actionButton}
                    </button>
                  )}
                  {(sectionInfo as any).secondaryActionButton && (
                    <button
                      onClick={() => {
                        setSelectedRecord(null);
                        setShowAddActionModal(true);
                      }}
                      disabled={loading}
                      className="bg-navy-50 text-navy-900 border border-navy-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(sectionInfo as any).secondaryActionButton}
                    </button>
                  )}
                </>
              ) : section === 'metrics' ? (
                <>
                  <div className="relative share-dropdown-container">
                    <button
                      onClick={() => setShowShareDropdown(!showShareDropdown)}
                      className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      Share
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Copy feedback notification */}
                    {copyFeedback && (
                      <div className="absolute top-full right-0 mt-1 px-3 py-2 bg-green-100 text-green-700 text-sm rounded-md shadow-lg z-50 whitespace-nowrap border border-green-200">
                        URL copied to clipboard!
                      </div>
                    )}
                    
                    {showShareDropdown && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <button
                          onClick={handleCopyUrl}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Copy URL
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {/* For prospects, leads, opportunities, companies, people, clients, and speedrun, show custom buttons; for others, show unified button */}
                  {section === 'prospects' || section === 'leads' || section === 'opportunities' || section === 'companies' || section === 'people' || section === 'clients' || section === 'speedrun' ? (
                    <>
                      {sectionInfo['actionButton'] && (
                        <button 
                          onClick={handleAction}
                          className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          {sectionInfo.actionButton}
                        </button>
                      )}
                      {(sectionInfo as any).secondaryActionButton && (
                        <button 
                          onClick={() => {
                            // Handle secondary action - Start Speedrun for speedrun section, Add Action for others
                            if (section === 'speedrun') {
                              console.log('Starting speedrun...');
                              navigateToPipeline('speedrun/start');
                            } else {
                              setSelectedRecord(null);
                              setShowAddActionModal(true);
                            }
                          }}
                          disabled={loading}
                          className="bg-blue-100 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {(sectionInfo as any).secondaryActionButton}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Unified Add Action Experience for other sections */}
                      <UnifiedAddActionButton
                        onAddAction={() => {
                          setSelectedRecord(null);
                          setShowAddActionModal(true);
                        }}
                        onAddNote={section === 'speedrun' ? () => setShowAddNoteModal(true) : undefined}
                        variant={section === 'speedrun' ? 'dropdown' : 'simple'}
                        size="md"
                        color={section === 'speedrun' ? 'blue' : 'red'}
                      />
                      
                      {sectionInfo['actionButton'] && (
                        <button 
                          onClick={handleAction}
                          className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          {sectionInfo.actionButton}
                        </button>
                      )}
                      {(sectionInfo as any).secondaryActionButton && (
                        <button 
                          onClick={() => {
                            // Handle secondary action (Add Action for prospects)
                            setSelectedRecord(null);
                            setShowAddActionModal(true);
                          }}
                          disabled={loading}
                          className="bg-navy-50 text-navy-900 border border-navy-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {(sectionInfo as any).secondaryActionButton}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        workspaceId={user?.activeWorkspaceId || user?.workspaces?.[0]?.id || ''}
        userId={user?.id || ''}
      />

      {/* Add Action Modal */}
      <AddActionModal
        isOpen={showAddActionModal}
        onClose={() => {
          setShowAddActionModal(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleActionSubmit}
        record={selectedRecord}
        recordType={section.slice(0, -1)}
        isLoading={false}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleTaskSubmit}
        isLoading={false}
      />

    </>
  );
}
