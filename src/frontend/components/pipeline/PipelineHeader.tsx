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
import { AddNoteModal } from './AddNoteModal';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { AddTaskModal } from './AddTaskModal';
import { AddLeadModal } from '@/platform/ui/components/AddLeadModal';
import { AddProspectModal } from '@/platform/ui/components/AddProspectModal';
import { AddOpportunityModal } from '@/platform/ui/components/AddOpportunityModal';
import { AddCompanyModal } from '@/platform/ui/components/AddCompanyModal';
import { AddPersonModal } from '@/platform/ui/components/AddPersonModal';
import { UnifiedAddActionButton } from '@/platform/ui/components/UnifiedAddActionButton';
import { PanelLoader } from '@/platform/ui/components/Loader';
import { useUnifiedAuth } from '@/platform/auth';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { getCategoryColors } from '@/platform/config/color-palette';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { RankingSystem } from '@/platform/services/ranking-system';
import { PipelineMetrics } from '@/platform/services/pipeline-metrics-calculator';
import { useWorkspaceSpeedrunSettings } from '@/platform/hooks/useWorkspaceSpeedrunSettings';
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
  title?: string;
  subtitle?: string;
}

export function PipelineHeader({ 
  section, 
  metrics, 
  onSectionChange, 
  onRefresh, 
  onClearCache, 
  onAddRecord,
  loading,
  recordCount,
  title,
  subtitle
}: PipelineHeaderProps) {
  const { user } = useUnifiedAuth();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [showAddOpportunityModal, setShowAddOpportunityModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Function to open the correct modal based on section
  const openAddModal = () => {
    console.log('🔧 [Add Button] Opening modal for section:', section);
    setSelectedRecord(null);
    
    switch (section) {
      case 'leads':
        setShowAddLeadModal(true);
        break;
      case 'prospects':
        setShowAddProspectModal(true);
        break;
      case 'opportunities':
        setShowAddOpportunityModal(true);
        break;
      case 'companies':
        setShowAddCompanyModal(true);
        break;
      case 'people':
        setShowAddPersonModal(true);
        break;
      default:
        console.warn('Unknown section for add modal:', section);
        setShowAddLeadModal(true); // fallback
    }
  };

  // Generic success handler for all modals
  const handleAddSuccess = () => {
    // Close all modals
    setShowAddLeadModal(false);
    setShowAddProspectModal(false);
    setShowAddOpportunityModal(false);
    setShowAddCompanyModal(false);
    setShowAddPersonModal(false);
    setSelectedRecord(null);
    
    // Refresh the list
    onRefresh?.();
    
    // Show success message after modal closes
    setTimeout(() => {
      setShowSuccessMessage(true);
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }, 100);
  };
  const [timeData, setTimeData] = useState(() => {
    const data = getTimeTrackingData('America/New_York', user?.id);
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
    
    // Update browser title
    const viewLabel = getViewLabel(view);
    document.title = `Sprint • ${viewLabel}`;
    
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
      setTimeData(getTimeTrackingData('America/New_York', user?.id));
    };

    // Update immediately
    updateTimeData();

    // Set up interval to update every minute
    const interval = setInterval(updateTimeData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle action logging
  const handleActionSubmit = async (actionData: ActionLogData) => {
    // If we have a selected record, use it; otherwise, we need a person name
    const recordId = selectedRecord?.id;
    const recordType = selectedRecord ? section.slice(0, -1) : 'contact'; // Default to contact if no record
    
    if (!recordId && !actionData.person) {
      console.error('No record or person selected for action');
      return;
    }
    
    try {
      const response = await fetch('/api/actions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: recordId,
          recordType: recordType,
          actionType: actionData.type,
          notes: actionData.action,
          person: actionData.person,
          personId: actionData.personId,
          company: actionData.company,
          companyId: actionData.companyId,
          actionPerformedBy: actionData.actionPerformedBy,
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
      console.log('Opening add person popup...');
      // Open add person popup for speedrun section
      setSelectedRecord(null);
      setShowAddActionModal(true);
    } else {
      console.log(`🔧 [PipelineHeader] Creating new ${section.slice(0, -1)} - calling onAddRecord`);
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

  // Add keyboard shortcut for Cmd+Enter (Start Speedrun or Add Action)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field or textarea
      const target = event.target as HTMLElement;
      const isInputField =
        target['tagName'] === "INPUT" ||
        target['tagName'] === "TEXTAREA" ||
        target['contentEditable'] === "true";

      // Check if any modal or popup is open that should take precedence
      const hasOpenModal = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.fixed.inset-0') ||
                          document.querySelector('[data-slide-up]') ||
                          document.querySelector('.slide-up-visible');

      // Command+Enter - only when not in input fields and no modals open
      if (
        (event.metaKey || event.ctrlKey) &&
        (event['key'] === "Enter" || event['keyCode'] === 13) &&
        !isInputField &&
        !hasOpenModal
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (section === 'speedrun') {
          // Start Speedrun for speedrun section
          console.log(`⌨️ Command+Enter pressed for Start Speedrun`);
          navigateToPipeline('speedrun/sprint');
        } else if (section === 'leads' || section === 'people') {
          // Add Lead/Add Person for leads and people sections
          console.log(`⌨️ Command+Enter pressed for Add ${section === 'leads' ? 'Lead' : 'Person'} in ${section} section`);
          onAddRecord();
        } else {
          // Add Action for other sections
          console.log(`⌨️ Command+Enter pressed for Add Action in ${section} section`);
          setSelectedRecord(null);
          setShowAddActionModal(true);
        }
        
        return false;
      }
    };

    // Add event listener with capture to ensure we get the event first
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [section, navigateToPipeline]);


  
  // Get section display info
  const getSectionInfo = () => {
    // Use custom title and subtitle if provided
    if (title && subtitle) {
      return {
        title: title,
        subtitle: subtitle,
        actionButton: 'Add Record',
        secondaryActionButton: 'Add Action'
      };
    }
    
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
          subtitle: 'Real Pipeline',
          actionButton: 'Add Opportunity',
          secondaryActionButton: 'Add Action'
        };
      case 'companies':
        return {
          title: 'Companies',
          subtitle: 'Business entities',
          actionButton: 'Add Company',
          secondaryActionButton: 'Add Action'
        };
      case 'people':
        return {
          title: 'People',
          subtitle: 'Individual entities',
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
      case 'sellers':
        return {
          title: 'Sellers',
          subtitle: 'Sales Team',
          actionButton: 'Add Seller',
          secondaryActionButton: 'Add Action'
        };
      case 'speedrun':
        return {
          title: 'Speedrun',
          subtitle: 'Win more, faster',
          actionButton: 'Add Action',
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

  // Get workspace speedrun settings
  const { settings: workspaceSettings } = useWorkspaceSpeedrunSettings();

  // Format metrics for display
  const formatMetrics = async (): Promise<MetricItem[]> => {
    const metricItems: MetricItem[] = [];
    
    // Handle null metrics case
    if (!metrics) {
      return [];
    }
    
    // Special handling for Speedrun section - show different metrics based on current view
    if (section === 'speedrun') {
      
      // Use unified ranking system for dynamic goals
      const rankingSystem = RankingSystem.getInstance();
      const dynamicGoals = await rankingSystem.getDynamicGoals(workspaceId);
      
      switch (currentView) {
        case 'sales_actions':
          // Sales Actions view - show time indicator and conditionally show targets
          metricItems.push({
            label: timeData.isBeforeWorkingHours ? 'Start Time' : 'Hours Left',
            value: timeData.isBeforeWorkingHours ? `${Math.round(timeData.hoursTillStart)}h` : formatHours(timeData.hoursLeft),
            color: 'text-[var(--foreground)]',
            isHighlight: false
          });
          
          // Only show Today/This Week targets if NOT before working hours
          if (!timeData.isBeforeWorkingHours) {
            metricItems.push({
              label: 'Today',
              value: timeData.todayProgress,
              target: workspaceSettings.dailyTarget, // Use workspace daily target
              isProgress: true,
              color: 'text-[var(--foreground)]'
            });
            metricItems.push({
              label: 'This Week',
              value: timeData.weekProgress,
              target: workspaceSettings.weeklyTarget, // Use workspace weekly target
              isProgress: true,
              color: 'text-[var(--foreground)]'
            });
          }
          break;

        case 'prospects':
          // Quality Targets view - show daily goals progress
          metricItems.push({
            label: 'Actions Left',
            value: '8', // TODO: Calculate from actual actions
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Calls',
            value: '0',
            target: 15,
            isProgress: true,
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Emails',
            value: '0',
            target: 25,
            isProgress: true,
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Meetings',
            value: '0',
            target: 4,
            isProgress: true,
            color: 'text-[var(--foreground)]'
          });
          break;

        case 'insights':
          // Insights view - show intelligence metrics
          metricItems.push({
            label: 'Fresh Insights',
            value: '12',
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Industry Trends',
            value: '8',
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Competitive Intel',
            value: '5',
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Last Updated',
            value: '2h ago',
            color: 'text-[var(--muted)]'
          });
          break;

        case 'time':
          // Calendar view - show time-based metrics
          metricItems.push({
            label: 'Free Time',
            value: '4.5h', // TODO: Calculate from calendar
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Meetings',
            value: '5',
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Focus Blocks',
            value: '3',
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Busy Time',
            value: '3.5h',
            color: 'text-[var(--foreground)]'
          });
          break;

        default:
          // Fallback to original metrics
          metricItems.push({
            label: timeData.isBeforeWorkingHours ? 'Start Time' : 'Hours Left',
            value: timeData.isBeforeWorkingHours ? `${Math.round(timeData.hoursTillStart)}h` : formatHours(timeData.hoursLeft),
            color: 'text-[var(--foreground)]',
            isHighlight: false
          });
          metricItems.push({
            label: 'Today',
            value: timeData.todayProgress,
            target: timeData.todayTarget,
            isProgress: true,
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'This Week',
            value: timeData.weekProgress,
            target: timeData.weekTarget,
            isProgress: true,
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'All Time',
            value: timeData.allTimeRecord.toString(),
            color: 'text-[var(--foreground)]'
          });
      }
      
      return metricItems;
    }
    
    // Special handling for Metrics section
    if (section === 'metrics') {
      metricItems.push({
        label: 'KPIs Tracked',
        value: '16',
        color: 'text-[var(--foreground)]'
      });
      metricItems.push({
        label: 'Data Sources',
        value: '5',
        color: 'text-[var(--foreground)]'
      });
      metricItems.push({
        label: 'Real-time',
        value: 'Live',
        color: 'text-green-600',
        isLive: true
      });
      return metricItems;
    }
    
    // Special handling for Sellers section - Show Total count like other sections
    if (section === 'sellers') {
      // Use recordCount for sellers section
      const totalCount = recordCount || 0;
      
      metricItems.push({
        label: 'Total',
        value: totalCount.toString(),
        color: 'text-[var(--foreground)]'
      });
      
      return metricItems;
    }
    
    // Default metrics for other sections
    if (metrics['totalPipelineValue'] && section !== 'leads') {
      metricItems.push({
        label: section === 'opportunities' ? 'Pipeline Value' : 'Total Value',
        value: metrics.totalPipelineValue,
        color: 'text-[var(--foreground)]'
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
        value: overdueActions > 0 ? overdueActions.toString() : '—',
        color: overdueActions > 0 ? 'text-red-600' : 'text-[var(--foreground)]'
      });
      
      metricItems.push({
        label: uniqueCompanies['size'] === 1 ? 'Company' : 'Companies',
        value: uniqueCompanies.size > 0 ? uniqueCompanies.size.toString() : '—',
        color: 'text-[var(--foreground)]'
      });
      
      metricItems.push({
        label: leadsCount === 1 ? 'Lead' : 'Leads',
        value: leadsCount > 0 ? leadsCount.toString() : '—',
        color: 'text-[var(--foreground)]'
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
          value: overdueActions > 0 ? overdueActions.toString() : '—',
          color: overdueActions > 0 ? 'text-red-600' : 'text-[var(--foreground)]'
        });
        
        metricItems.push({
          label: uniqueCompanies.size === 1 ? 'Company' : 'Companies',
          value: uniqueCompanies.size > 0 ? uniqueCompanies.size.toString() : '—',
          color: 'text-[var(--foreground)]'
        });
        
        metricItems.push({
          label: 'Prospects',
          value: totalCount > 0 ? totalCount.toString() : '—',
          color: 'text-[var(--foreground)]'
        });
      } else {
        // Use recordCount for all other sections
        const totalCount = recordCount || (metrics.totalLeads ?? 0);
        
        // For companies and people sections, show Companies/People first, then Actions
        if (section === 'companies' || section === 'people') {
          metricItems.push({
            label: section === 'companies' ? 'Companies' : 'People',
            value: totalCount > 0 ? totalCount.toString() : '—',
            color: 'text-[var(--foreground)]'
          });
          metricItems.push({
            label: 'Actions',
            value: '—',
            color: 'text-[var(--foreground)]'
          });
        } else {
          metricItems.push({
            label: 'Total',
            value: totalCount > 0 ? totalCount.toString() : '—',
            color: 'text-[var(--foreground)]'
          });
        }
        
        if (metrics.winRate) {
          metricItems.push({
            label: 'Win Rate',
            value: metrics.winRate,
            color: 'text-[var(--foreground)]'
          });
        }
      }
    }
    
    if (metrics.leadConversionRate) {
      metricItems.push({
        label: 'Conversion',
        value: metrics.leadConversionRate,
        color: 'text-[var(--foreground)]'
      });
    }
    
    return metricItems;
  };

  const [metricItems, setMetricItems] = useState<MetricItem[]>([]);

  // Get workspaceId from user context
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;

  useEffect(() => {
    const loadMetrics = async () => {
      const items = await formatMetrics();
      setMetricItems(items);
    };
    loadMetrics();
  }, [section, currentView, metrics, timeData, workspaceId]);

  return (
    <>
      <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Title only */}
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              {sectionInfo.title}
            </h1>
            <p className="text-sm text-[var(--muted)]">{sectionInfo.subtitle}</p>
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
                        <span className={metric.color || 'text-[var(--foreground)]'}>{metric.value}</span>
                        <span className="text-[var(--foreground)]">/{metric.target}</span>
                      </>
                    ) : (
                      <span className={metric.color || 'text-[var(--foreground)]'}>{metric.value}</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] tracking-wide">
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
                      className="bg-[var(--background)] text-black border border-[var(--border)] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--panel-background)] transition-colors flex items-center gap-1 sm:gap-2"
                    >
                      <span className="hidden xs:inline">{sectionInfo.actionButton}</span>
                      <span className="xs:hidden">Add</span>
                    </button>
                  )}
                  {(sectionInfo as any).secondaryActionButton && (
                    <button
                      onClick={() => {
                        setSelectedRecord(null);
                        setShowAddActionModal(true);
                      }}
                      disabled={loading}
                      className="bg-navy-50 text-navy-900 border border-navy-200 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2"
                    >
                      <span className="hidden xs:inline">{(sectionInfo as any).secondaryActionButton}</span>
                      <span className="xs:hidden">Add</span>
                    </button>
                  )}
                </>
              ) : section === 'metrics' ? (
                <>
                  <div className="relative share-dropdown-container">
                    <button
                      onClick={() => setShowShareDropdown(!showShareDropdown)}
                      className="bg-[var(--background)] text-black border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--panel-background)] transition-colors flex items-center gap-2"
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
                      <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg z-50">
                        <button
                          onClick={handleCopyUrl}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--panel-background)] transition-colors"
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
                  {section === 'prospects' || section === 'leads' || section === 'opportunities' || section === 'companies' || section === 'people' || section === 'clients' || section === 'sellers' || section === 'speedrun' ? (
                    <>
                      {sectionInfo['actionButton'] && (
                        <button 
                          onClick={openAddModal}
                          className="px-3 sm:px-4 py-2 bg-[var(--background)] text-black border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--panel-background)] transition-colors flex items-center gap-1 sm:gap-2"
                        >
                          <span className="hidden xs:inline">
                            {section === 'speedrun' ? 
                              (timeData.isBeforeWorkingHours ? `Add Action (${getCommonShortcut('SUBMIT')})` : sectionInfo.actionButton) :
                              `${sectionInfo.actionButton}${((recordCount ?? 0) === 0) ? ` (${getCommonShortcut('SUBMIT')})` : ''}`
                            }
                          </span>
                          <span className="xs:hidden">
                            {sectionInfo.actionButton}
                          </span>
                        </button>
                      )}
                      {(sectionInfo as any).secondaryActionButton && (
                        <button 
                          onClick={() => {
                            // Handle secondary action - Start Speedrun for speedrun section, Add Action for others
                            if (section === 'speedrun') {
                              console.log('Starting speedrun...');
                              navigateToPipeline('speedrun/sprint');
                            } else {
                              setSelectedRecord(null);
                              setShowAddActionModal(true);
                            }
                          }}
                          disabled={loading}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border flex items-center gap-1 sm:gap-2 ${
                            section === 'speedrun' 
                              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                              : section === 'leads'
                              ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                              : section === 'prospects' 
                              ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                              : section === 'opportunities'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                              : section === 'people'
                              ? 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100'
                              : section === 'companies'
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              : 'bg-[var(--panel-background)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--hover)]'
                          }`}
                        >
                          <span className="hidden xs:inline">
                            {section === 'speedrun' ? `Start (${getCommonShortcut('SUBMIT')})` : `${(sectionInfo as any).secondaryActionButton} (${getCommonShortcut('SUBMIT')})`}
                          </span>
                          <span className="xs:hidden">
                            {section === 'speedrun' ? `Start (${getCommonShortcut('SUBMIT')})` : 'Add Action'}
                          </span>
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
                        color={section === 'speedrun' ? 'blue' : 'navy'}
                        section={section}
                      />
                      
                      {sectionInfo['actionButton'] && (
                        <button 
                          onClick={handleAction}
                          className="bg-[var(--background)] text-black border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--panel-background)] transition-colors flex items-center gap-2"
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
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: getCategoryColors(section).bg,
                            color: getCategoryColors(section).primary,
                            borderColor: getCategoryColors(section).primary,
                            border: '1px solid'
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.currentTarget.style.backgroundColor = getCategoryColors(section).bgHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              e.currentTarget.style.backgroundColor = getCategoryColors(section).bg;
                            }
                          }}
                        >
                          {`${(sectionInfo as any).secondaryActionButton} (${getCommonShortcut('SUBMIT')})`}
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
      <CompleteActionModal
        isOpen={showAddActionModal}
        onClose={() => {
          setShowAddActionModal(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleActionSubmit}
        personName={selectedRecord?.name || selectedRecord?.fullName}
        companyName={selectedRecord?.company?.name || selectedRecord?.company}
        section={section}
        isLoading={false}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleTaskSubmit}
        isLoading={false}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => {
          setShowAddLeadModal(false);
          setSelectedRecord(null);
        }}
        onLeadAdded={handleAddSuccess}
        section={section}
      />

      {/* Add Prospect Modal */}
      <AddProspectModal
        isOpen={showAddProspectModal}
        onClose={() => {
          setShowAddProspectModal(false);
          setSelectedRecord(null);
        }}
        onProspectAdded={handleAddSuccess}
        section={section}
      />

      {/* Add Opportunity Modal */}
      <AddOpportunityModal
        isOpen={showAddOpportunityModal}
        onClose={() => {
          setShowAddOpportunityModal(false);
          setSelectedRecord(null);
        }}
        onOpportunityAdded={handleAddSuccess}
        section={section}
      />

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={showAddCompanyModal}
        onClose={() => {
          setShowAddCompanyModal(false);
          setSelectedRecord(null);
        }}
        onCompanyAdded={handleAddSuccess}
        section={section}
      />

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={showAddPersonModal}
        onClose={() => {
          setShowAddPersonModal(false);
          setSelectedRecord(null);
        }}
        onPersonAdded={handleAddSuccess}
        section={section}
      />

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] rounded-lg shadow-lg px-4 py-2 border"
             style={{
               backgroundColor: getCategoryColors(section).bg,
               borderColor: getCategoryColors(section).border
             }}>
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"
                 style={{ color: getCategoryColors(section).primary }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium" style={{ color: getCategoryColors(section).text }}>
              {section.charAt(0).toUpperCase() + section.slice(1)} created successfully!
            </p>
          </div>
        </div>
      )}

    </>
  );
}
