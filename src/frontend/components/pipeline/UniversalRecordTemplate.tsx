"use client";

import React, { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { authFetch, apiPost } from '@/platform/api-fetch';
import { UpdateModal } from './UpdateModal';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { AddTaskModal } from './AddTaskModal';
import { SetReminderModal } from './SetReminderModal';
import { AddPersonToCompanyModal } from './AddPersonToCompanyModal';
import { AddCompanyModal } from '@/platform/ui/components/AddCompanyModal';
import { CompanySelector } from './CompanySelector';
import { formatFieldValue, getCompanyName, formatDateValue, formatArrayValue } from './utils/field-formatters';
import { sanitizeName } from '@/platform/utils/name-normalization';
import { UnifiedAddActionButton } from '@/platform/ui/components/UnifiedAddActionButton';
import { TrashIcon, CameraIcon, ChevronUpIcon, ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import { InlineEditField } from './InlineEditField';
import { TabErrorBoundary } from './TabErrorBoundary';
import { Loader, CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { SuccessMessage } from '@/platform/ui/components/SuccessMessage';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { getCategoryColors } from '@/platform/config/color-palette';
import { useInlineEdit } from '@/platform/hooks/useInlineEdit';
import { ProfileImageUploadModal } from './ProfileImageUploadModal';
import { PipelineProgress } from './PipelineProgress';
import { NotesEditor } from '@/platform/ui/components/NotesEditor';
import { ValueTab } from './tabs/ValueTab';
import { DeepValueReportView } from '@/platform/ui/components/reports/DeepValueReportView';
import { DeepValueReport } from '@/platform/services/deep-value-report-service';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { DatePicker } from '@/platform/ui/components/DatePicker';

// Import universal tab components
import {
  UniversalOverviewTab,
  UniversalInsightsTab,
  UniversalCompanyTab,
  UniversalProfileTab,
  UniversalPainValueTab,
  UniversalActionsTab,
  UniversalIndustryIntelTab,
  UniversalOutreachTab,
  UniversalEngagementTab,
  UniversalDealIntelTab,
  UniversalCompanyIntelTab,
  UniversalClosePlanTab,
  UniversalCompetitiveTab,
  UniversalRelationshipTab,
  UniversalPersonalTab,
  UniversalBusinessTab,
  UniversalSuccessTab,
  UniversalPartnershipTab,
  UniversalCollaborationTab,
  UniversalPerformanceTab,
  UniversalIndustryTab,
  UniversalCareerTab as PlaceholderCareerTab,
  UniversalLandminesTab,
  UniversalStakeholdersTab,
  UniversalDocumentsTab,
  UniversalContactsTab,
  UniversalOpportunitiesTab,
  UniversalStrategyTab,
  UniversalBuyerGroupsTab,
  UniversalCompetitorsTab,
  UniversalSellerCompaniesTab,
  UniversalPeopleTab
} from './tabs';
import { UniversalNewsTab } from './tabs/UniversalNewsTab';

// Import new role and enablers tab components
import { UniversalRoleTab } from './tabs/UniversalRoleTab';
import { UniversalEnablersTab } from './tabs/UniversalEnablersTab';

// Import new dedicated overview components
import { ProspectOverviewTab } from './tabs/ProspectOverviewTab';
import { PersonOverviewTab } from './tabs/PersonOverviewTab';

// Import new comprehensive tab components
import { UniversalInsightsTab as ComprehensiveInsightsTab } from './tabs/UniversalInsightsTab';
import { UniversalCareerTab as ComprehensiveCareerTab } from './tabs/UniversalCareerTab';
import { UniversalHistoryTab } from './tabs/UniversalHistoryTab';
import { UniversalBuyerGroupTab } from './tabs/UniversalBuyerGroupTab';
import { UniversalProfileTab as ComprehensiveProfileTab } from './tabs/UniversalProfileTab';
import { UniversalCompanyTab as ComprehensiveCompanyTab } from './tabs/UniversalCompanyTab';
import { CompanyOverviewTab } from './tabs/CompanyOverviewTab';
import { HierarchicalBreadcrumb } from './HierarchicalBreadcrumb';
import { URLFixer } from './URLFixer';

// Import speedrun-specific components for intelligence tab
import { InsightsTab as SpeedrunInsightsTab } from '@/products/speedrun/components/InsightsTab';
import { extractProductionInsights } from '@/products/speedrun/utils/monacoExtractors';

export interface UniversalRecordTemplateProps {
  record: any;
  recordType: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'deals' | 'speedrun';
  onBack: () => void;
  onComplete?: () => void;
  onSnooze?: (recordId: string, duration: string) => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onRecordUpdate?: (updatedRecord: any) => void;
  recordIndex?: number;
  totalRecords?: number;
  // Optional customization props
  customTabs?: TabConfig[];
  showDialer?: boolean;
  showReports?: boolean;
  contextualActions?: ContextualAction[];
  // Profile popup context
  profilePopupContext?: {
    isProfileOpen: boolean;
    setIsProfileOpen: (open: boolean) => void;
    profileAnchor: HTMLElement | null;
    setProfileAnchor: (anchor: HTMLElement | null) => void;
  };
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  component?: React.ComponentType<{ record: any; recordType: string }>;
}

export interface ContextualAction {
  id: string;
  label: string;
  icon?: string;
  action: (record: any) => void | Promise<void>;
  condition?: (record: any) => boolean;
}

// Import the tab registry functions
import { getTabsForRecordType as getRegistryTabs } from './config/tab-registry';

// Record type-specific tab configurations
const getTabsForRecordType = (recordType: string, record?: any): TabConfig[] => {
  // Use the tab registry which now handles dynamic component resolution
  return getRegistryTabs(recordType, record);
};

const DEFAULT_TABS: TabConfig[] = [
  { id: 'overview', label: 'Home' },
  { id: 'company', label: 'Account' },
  { id: 'actions', label: 'Actions' },
  { id: 'notes', label: 'Notes' }
];

export function UniversalRecordTemplate({ 
  record, 
  recordType, 
  onBack, 
  onComplete, 
  onSnooze, 
  onNavigatePrevious,
  onNavigateNext,
  onRecordUpdate,
  recordIndex, 
  totalRecords,
  customTabs,
  showDialer = false,
  showReports = false,
  contextualActions = [],
  profilePopupContext
}: UniversalRecordTemplateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentRecord, clearCurrentRecord } = useRecordContext();
  
  // Initialize active tab from URL parameter or default to first tab
  const urlTab = searchParams.get('tab');
  const validTabs = (customTabs || getTabsForRecordType(recordType, record));
  const defaultTab = validTabs[0]?.id || 'overview';
  const [activeTab, setActiveTab] = useState(() => {
    // Only use URL tab if it's valid for this record type
    const validTabIds = validTabs.map(t => t.id);
    return (urlTab && validTabIds.includes(urlTab)) ? urlTab : defaultTab;
  });
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<DeepValueReport | null>(null);
  const [localRecord, setLocalRecord] = useState(record);
  const [isPending, startTransition] = useTransition();
  
  // Pipeline context for user data
  const { 
    user: pipelineUser, 
    company, 
    workspace
  } = usePipeline();
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<Set<string>>(new Set());
  const [hasCompletedRecords, setHasCompletedRecords] = useState(false);
  
  // Check if user has started speedrun (has completed records)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completedRecords = JSON.parse(localStorage.getItem('speedrunCompletedRecords') || '[]');
      setHasCompletedRecords(completedRecords.length > 0);
    }
    
    // Listen for speedrun action completion events to update the button text
    const handleSpeedrunActionLogged = () => {
      if (typeof window !== 'undefined') {
        const completedRecords = JSON.parse(localStorage.getItem('speedrunCompletedRecords') || '[]');
        setHasCompletedRecords(completedRecords.length > 0);
      }
    };
    
    document.addEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    return () => {
      document.removeEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    };
  }, []);
  
  // 🚀 CRITICAL FIX: Clear recentlyUpdatedFields when navigating to a different record
  // This prevents stale local state from overriding fresh API data
  useEffect(() => {
    if (record?.id && localRecord?.id && record.id !== localRecord.id) {
      console.log(`🔄 [UNIVERSAL] Record ID changed from ${localRecord.id} to ${record.id}, clearing recentlyUpdatedFields`);
      setRecentlyUpdatedFields(new Set());
      setPendingSaves(new Set());
    }
  }, [record?.id, localRecord?.id]);
  
  // Update local record state when prop changes, but not during pending saves
  useEffect(() => {
    console.log(`🔄 [UNIVERSAL] Record prop updated:`, {
      recordId: record?.id,
      name: record?.name,
      tradingName: record?.tradingName,
      description: record?.description,
      updatedAt: record?.updatedAt,
      pendingSaves: Array.from(pendingSaves),
      recentlyUpdatedFields: Array.from(recentlyUpdatedFields),
      timestamp: Date.now()
    });
    
    // Only sync if there are no pending saves for any field
    if (pendingSaves.size === 0) {
      // CRITICAL: Check if incoming record prop is incomplete (has fewer fields than localRecord)
      // This prevents flashing when record prop is updated with only partial data from API response
      const recordFieldCount = record ? Object.keys(record).filter(k => record[k] !== undefined).length : 0;
      const localRecordFieldCount = localRecord ? Object.keys(localRecord).filter(k => localRecord[k] !== undefined).length : 0;
      const isIncompleteUpdate = recordFieldCount > 0 && localRecordFieldCount > 0 && recordFieldCount < localRecordFieldCount * 0.8; // Less than 80% of fields
      
      if (isIncompleteUpdate && record?.id === localRecord?.id) {
        console.log(`⏸️ [UNIVERSAL] Skipping sync - record prop appears incomplete:`, {
          recordId: record?.id,
          recordFields: recordFieldCount,
          localRecordFields: localRecordFieldCount,
          recordKeys: Object.keys(record || {}),
          localRecordKeys: Object.keys(localRecord || {})
        });
        return; // Don't sync with incomplete record
      }
      
      console.log(`🔄 [UNIVERSAL] Syncing localRecord with record prop:`, {
        recordId: record?.id,
        recordName: record?.name || record?.fullName,
        pendingSaves: Array.from(pendingSaves),
        recentlyUpdatedFields: Array.from(recentlyUpdatedFields),
        hasRecord: !!record,
        linkedinUrl: record?.linkedinUrl,
        linkedin: record?.linkedin,
        createdAt: record?.createdAt,
        updatedAt: record?.updatedAt,
        tradingName: record?.tradingName,
        description: record?.description,
        recordFieldCount,
        localRecordFieldCount
      });
      
      // If there are recently updated fields, merge carefully to avoid overwriting local changes
      if (recentlyUpdatedFields.size > 0) {
        console.log(`🔄 [UNIVERSAL] Merging record prop with local changes, preserving recently updated fields:`, Array.from(recentlyUpdatedFields));
        setLocalRecord((prevLocalRecord: any) => {
          // CRITICAL: Start with prevLocalRecord to preserve ALL existing fields
          // Then apply updates from record prop
          // IMPORTANT: Don't overwrite non-null values with null from record prop
          const mergedRecord = {
            ...prevLocalRecord, // Start with all existing fields
            ...Object.keys(record).reduce((acc, key) => {
              // Only include fields that are not null/undefined in the record prop
              // This prevents overwriting existing values with null
              if (record[key] !== null && record[key] !== undefined) {
                acc[key] = record[key];
              }
              return acc;
            }, {} as Record<string, any>) // Apply updates from record prop (only non-null values)
          };
          
          // Preserve recently updated fields from local record (override record prop)
          recentlyUpdatedFields.forEach(field => {
            if (prevLocalRecord && prevLocalRecord[field] !== undefined) {
              mergedRecord[field] = prevLocalRecord[field];
              console.log(`🔄 [UNIVERSAL] Preserving recently updated field '${field}': ${prevLocalRecord[field]}`);
            }
          });
          
          // CRITICAL: Always preserve linkedinNavigatorUrl from localRecord if it exists and record prop doesn't have it
          // This handles the case where the API response might not include it or returns null
          if (prevLocalRecord?.linkedinNavigatorUrl !== undefined && 
              prevLocalRecord?.linkedinNavigatorUrl !== null &&
              (!record?.linkedinNavigatorUrl || record?.linkedinNavigatorUrl === null)) {
            mergedRecord.linkedinNavigatorUrl = prevLocalRecord.linkedinNavigatorUrl;
            console.log(`🔄 [UNIVERSAL] Preserving linkedinNavigatorUrl from localRecord (always preserve): ${prevLocalRecord.linkedinNavigatorUrl}`);
          }
          
          // Also preserve if it was recently updated
          if (prevLocalRecord?.linkedinNavigatorUrl !== undefined && 
              (recentlyUpdatedFields.has('linkedinNavigatorUrl') || 
               (!record?.linkedinNavigatorUrl && prevLocalRecord?.linkedinNavigatorUrl))) {
            mergedRecord.linkedinNavigatorUrl = prevLocalRecord.linkedinNavigatorUrl;
            console.log(`🔄 [UNIVERSAL] Preserving linkedinNavigatorUrl from localRecord (recently updated): ${prevLocalRecord.linkedinNavigatorUrl}`);
          }
          
          // CRITICAL: Always preserve status/stage from localRecord if it was recently updated
          // This ensures status changes are not overwritten by stale API responses
          if (recentlyUpdatedFields.has('status') && prevLocalRecord?.status !== undefined) {
            mergedRecord.status = prevLocalRecord.status;
            mergedRecord.stage = prevLocalRecord.stage || prevLocalRecord.status; // Also sync stage field
            console.log(`🔄 [UNIVERSAL] Preserving status from localRecord (recently updated): ${prevLocalRecord.status}`);
          } else if (prevLocalRecord?.status && (!record?.status || record?.status === null)) {
            // If status exists in localRecord but not in record prop, preserve it
            mergedRecord.status = prevLocalRecord.status;
            mergedRecord.stage = prevLocalRecord.stage || prevLocalRecord.status;
            console.log(`🔄 [UNIVERSAL] Preserving status from localRecord (missing in record prop): ${prevLocalRecord.status}`);
          }
          
          console.log(`🔄 [UNIVERSAL] Final merged record:`, {
            id: mergedRecord.id,
            tradingName: mergedRecord.tradingName,
            description: mergedRecord.description,
            linkedinNavigatorUrl: mergedRecord.linkedinNavigatorUrl,
            email: mergedRecord.email,
            phone: mergedRecord.phone,
            linkedinUrl: mergedRecord.linkedinUrl,
            updatedAt: mergedRecord.updatedAt,
            totalFields: Object.keys(mergedRecord).length
          });
          return mergedRecord;
        });
      } else {
        // No recently updated fields, safe to sync completely
        // BUT: CRITICAL - Always merge with prevLocalRecord to preserve all existing fields
        // The record prop might be incomplete (e.g., only contains updated field from API response)
        console.log(`🔄 [UNIVERSAL] Merging record prop with prevLocalRecord (preserving all fields):`, {
          id: record.id,
          tradingName: record.tradingName,
          description: record.description,
          linkedinNavigatorUrl: record.linkedinNavigatorUrl,
          updatedAt: record.updatedAt
        });
        
        setLocalRecord((prevLocalRecord: any) => {
          if (!prevLocalRecord) return record;
          
          // CRITICAL: Merge record prop with prevLocalRecord, preserving ALL existing fields
          // Start with prevLocalRecord (has all fields), then apply updates from record prop
          // IMPORTANT: Don't overwrite non-null values with null from record prop
          const mergedRecord = {
            ...prevLocalRecord, // Start with all existing fields from prevLocalRecord
            ...Object.keys(record).reduce((acc, key) => {
              // Only include fields that are not null/undefined in the record prop
              // This prevents overwriting existing values with null
              if (record[key] !== null && record[key] !== undefined) {
                acc[key] = record[key];
              }
              return acc;
            }, {} as Record<string, any>) // Apply updates from record prop (only non-null values)
          };
          
          // Ensure linkedinNavigatorUrl is preserved if it exists in prevLocalRecord
          if (prevLocalRecord?.linkedinNavigatorUrl !== undefined && 
              prevLocalRecord?.linkedinNavigatorUrl !== null &&
              (!record?.linkedinNavigatorUrl || record?.linkedinNavigatorUrl === null)) {
            mergedRecord.linkedinNavigatorUrl = prevLocalRecord.linkedinNavigatorUrl;
            console.log(`🔄 [UNIVERSAL] Preserving linkedinNavigatorUrl from prevLocalRecord (no recent updates): ${prevLocalRecord.linkedinNavigatorUrl}`);
          }
          
          // CRITICAL: Preserve status/stage from prevLocalRecord if record prop doesn't have it or has null
          // This ensures status changes persist even when API response is incomplete
          if (prevLocalRecord?.status && (!record?.status || record?.status === null)) {
            mergedRecord.status = prevLocalRecord.status;
            mergedRecord.stage = prevLocalRecord.stage || prevLocalRecord.status;
            console.log(`🔄 [UNIVERSAL] Preserving status from prevLocalRecord (missing in record prop): ${prevLocalRecord.status}`);
          } else if (prevLocalRecord?.status && record?.status && prevLocalRecord.status !== record.status) {
            // If both have status but they differ, prefer prevLocalRecord if it's more recent (check updatedAt)
            const prevUpdated = prevLocalRecord.updatedAt ? new Date(prevLocalRecord.updatedAt).getTime() : 0;
            const recordUpdated = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
            if (prevUpdated >= recordUpdated) {
              mergedRecord.status = prevLocalRecord.status;
              mergedRecord.stage = prevLocalRecord.stage || prevLocalRecord.status;
              console.log(`🔄 [UNIVERSAL] Preserving status from prevLocalRecord (more recent): ${prevLocalRecord.status}`);
            }
          }
          
          console.log(`🔄 [UNIVERSAL] Merged record fields:`, {
            prevFields: Object.keys(prevLocalRecord).length,
            recordFields: Object.keys(record).length,
            mergedFields: Object.keys(mergedRecord).length,
            preservedFields: Object.keys(prevLocalRecord).filter(k => record[k] === undefined || record[k] === null).length
          });
          
          return mergedRecord;
        });
      }
    } else {
      console.log(`⏸️ [UNIVERSAL] Skipping record sync due to pending saves:`, Array.from(pendingSaves));
    }
  }, [record, pendingSaves, recentlyUpdatedFields]);
  
  // Ref for content container to reset scroll position
  const contentRef = useRef<HTMLDivElement>(null);
  // Ref to track URL sync to prevent circular updates
  const urlSyncRef = useRef(false);
  
  // Use universal inline edit hook
  const {
    showSuccessMessage,
    successMessage,
    messageType,
    handleEditSave,
    closeMessage,
    showMessage,
  } = useInlineEdit();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSetReminderModalOpen, setIsSetReminderModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [isSnoozeDropdownOpen, setIsSnoozeDropdownOpen] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [selectedSnoozeDate, setSelectedSnoozeDate] = useState<Date | null>(null);
  const snoozeDropdownRef = useRef<HTMLDivElement>(null);

  // Close snooze dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (snoozeDropdownRef.current && !snoozeDropdownRef.current.contains(event.target as Node)) {
        setIsSnoozeDropdownOpen(false);
      }
    };

    if (isSnoozeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSnoozeDropdownOpen]);
  const [activeEditTab, setActiveEditTab] = useState('overview');
  const [hasLoggedAction, setHasLoggedAction] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const tabs = useMemo(() => {
    const baseTabs = customTabs || getTabsForRecordType(recordType, record);
    
    // Filter out co-workers tab if person doesn't have a company associated
    if (['leads', 'prospects', 'people'].includes(recordType)) {
      // Check companyId first (more reliable than company object which may be null if company is deleted)
      const hasCompany = record?.companyId;
      if (!hasCompany) {
        return baseTabs.filter(tab => tab.id !== 'co-workers');
      }
    }
    
    return baseTabs;
  }, [customTabs, recordType, record?.companyId]);
  
  // Function to update URL with tab parameter
  const updateURLTab = (tabId: string) => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentTab = currentParams.get('tab');
    
    // Only update if tab actually changed
    if (currentTab === tabId) return;
    
    const currentPath = window.location.pathname;
    currentParams.set('tab', tabId);
    router.replace(`${currentPath}?${currentParams.toString()}`, { scroll: false });
  };
  
  // Handle profile click for popup
  const handleProfileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!profilePopupContext) {
      console.warn('🔍 [PROFILE] ProfilePopupContext not available');
      return;
    }
    
    console.log('🔘 Profile avatar clicked in record view!', { 
      isProfileOpen: profilePopupContext.isProfileOpen, 
      profileAnchor: profilePopupContext.profileAnchor,
      record: !!record,
      recordType
    });
    
    event.preventDefault();
    event.stopPropagation();
    
    const avatarElement = event.currentTarget;
    console.log('🎯 Setting profile anchor:', avatarElement);
    console.log('🎯 Avatar rect:', avatarElement.getBoundingClientRect());
    profilePopupContext.setProfileAnchor(avatarElement);
    
    const newState = !profilePopupContext.isProfileOpen;
    console.log('🔄 Toggling profile open state:', profilePopupContext.isProfileOpen, '->', newState);
    profilePopupContext.setIsProfileOpen(newState);
    
    // Additional debugging
    setTimeout(() => {
      console.log('🔍 After state change:', { 
        isProfileOpen: newState, 
        profileAnchor: avatarElement,
        shouldRenderPopup: newState && avatarElement,
        record,
        recordType
      });
    }, 100);
  };
  
  // Reset active tab when tabs change or URL changes to ensure valid tab is selected
  useEffect(() => {
    const validTabIds = tabs.map(tab => tab.id);
    const urlTab = searchParams.get('tab');
    
    // Reset sync ref when tabs or record changes
    urlSyncRef.current = false;
    
    // If URL has a valid tab parameter, sync state with it
    if (urlTab && validTabIds.includes(urlTab)) {
      if (activeTab !== urlTab) {
        setActiveTab(urlTab);
      }
    } 
    // If current active tab is not valid for this record type, reset to first tab
    else if (!validTabIds.includes(activeTab)) {
      const newTab = tabs[0]?.id || 'overview';
      setActiveTab(newTab);
      updateURLTab(newTab);
    }
    // If URL doesn't have a tab but we have an active tab, update URL
    else if (!urlTab && activeTab && validTabIds.includes(activeTab)) {
      updateURLTab(activeTab);
    }
  }, [tabs, searchParams]); // Remove activeTab to prevent circular updates

  // Set current record context when component mounts or record changes
  useEffect(() => {
    if (record && recordType) {
      setCurrentRecord(record, recordType);
    }
    return () => {
      clearCurrentRecord();
    };
  }, [record, recordType, setCurrentRecord, clearCurrentRecord]);

  // Close dropdown when clicking outside

  // Listen for record updates from AI chat
  useEffect(() => {
    const handleRecordUpdate = (event: CustomEvent) => {
      const { recordId, recordType: updatedRecordType, updatedFields } = event.detail;
      
      if (recordId === record?.id && updatedRecordType === recordType) {
        // Show success message
        showMessage(`Updated ${updatedFields.join(', ')} successfully`);
        
        // Dispatch event to update the UI without page reload
        window.dispatchEvent(new CustomEvent('record-updated', {
          detail: {
            recordType,
            recordId: record?.id,
            updatedFields
          }
        }));
      }
    };

    window.addEventListener('recordUpdated', handleRecordUpdate as EventListener);
    
    return () => {
      window.removeEventListener('recordUpdated', handleRecordUpdate as EventListener);
    };
  }, [record?.id, recordType]);

  // Keyboard shortcut for Add Action (⌘⏎) and Start Speedrun (⌘⏎)
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
                          document.querySelector('.slide-up-visible') ||
                          document.querySelector('.z-50'); // CompleteActionModal uses z-50

      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isInputField && !hasOpenModal) {
        // Only trigger if we have a record
        if (record) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          if (recordType === 'speedrun') {
            // Check if we're on a speedrun sprint page (Add Action) or individual record page (both Add Action and Start Speedrun)
            const isOnSprintPage = typeof window !== 'undefined' && window.location.pathname.includes('/speedrun/sprint');
            
            if (isOnSprintPage) {
              console.log('⌨️ [UniversalRecordTemplate] Add Action keyboard shortcut triggered');
              setIsAddActionModalOpen(true);
            } else {
              // On individual record page: Open Add Action modal (same as for other record types)
              console.log('⌨️ [UniversalRecordTemplate] Add Action keyboard shortcut triggered for speedrun record');
              setIsAddActionModalOpen(true);
            }
          } else {
            // For all other record types (leads, prospects, etc.), trigger Add Action
            console.log('⌨️ [UniversalRecordTemplate] Add Action keyboard shortcut triggered for', recordType);
            setIsAddActionModalOpen(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [record, recordType]);

  // Keyboard shortcut handler for inline edit modal
  useEffect(() => {
    if (!isEditRecordModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('⌨️ [UniversalRecordTemplate] Inline edit modal keyboard shortcut triggered');
        
        // Trigger the save function
        handleSaveRecord();
      }
    };

    // Use both capture and bubble phases to ensure we get the event
    document.addEventListener('keydown', handleKeyDown, true); // Capture phase
    document.addEventListener('keydown', handleKeyDown, false); // Bubble phase
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isEditRecordModalOpen]);

  // Get record display name with fallbacks
  const getDisplayName = () => {
    // For opportunities, always use company name (opportunities are company records)
    if (recordType === 'opportunities') {
      const companyName = localRecord?.name || 
                         localRecord?.companyName ||
                         (typeof localRecord?.company === 'string' ? localRecord.company : localRecord?.company?.name) ||
                         'Unknown Opportunity';
      return sanitizeName(companyName) || companyName;
    }
    
    // Get the raw name first
    const rawName = localRecord?.name || 
                    localRecord?.fullName || 
                    (localRecord?.firstName && localRecord?.lastName ? `${localRecord.firstName} ${localRecord.lastName}` : '') ||
                    localRecord?.companyName ||
                    localRecord?.title ||
                    'Unknown Record';
    
    // Sanitize the name to remove bullet points and other unwanted characters
    // This ensures the display name is clean even if the database has unsanitized data
    return sanitizeName(rawName) || rawName;
  };

  // Normalize string for comparison (remove punctuation, normalize whitespace, lowercase)
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Get first initial for squircle
  const getFirstInitial = () => {
    const name = getDisplayName();
    if (!name || name === 'Unknown Record') return '?';
    return name.charAt(0).toUpperCase();
  };

  // Handle image upload - store on the person record, not the lead/prospect
  // TEMPORARILY COMMENTED OUT - WILL BE IMPLEMENTED LATER
  /*
  const handleImageUpload = async (imageData: string) => {
    try {
      console.log('🖼️ [UPLOAD] Starting image upload with data length:', imageData.length);
      
      // Convert base64 to blob for upload
      const base64Data = imageData.split(',')[1]; // Remove data:image/...;base64, prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      console.log('🖼️ [UPLOAD] Created blob:', blob.size, 'bytes, type:', blob.type);
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('image', blob, 'profile-image.jpg');
      formData.append('personId', record.personId || record.id);
      formData.append('recordType', recordType);

      console.log('🖼️ [UPLOAD] Sending to API:', {
        personId: record.personId || record.id,
        recordType,
        blobSize: blob.size
      });

      // Upload to the API endpoint
      const uploadResponse = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      });

      console.log('🖼️ [UPLOAD] API response status:', uploadResponse.status);

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log('🖼️ [UPLOAD] API response:', result);
        
        // Update the local record state with the new image URL
        const updateData = {
          profileImageUrl: result.imageUrl
        };

        // Update the record with the new image URL
        await handleUpdateSubmit(updateData);
        
        // Show success message
        showMessage('Profile image updated successfully!', 'success');
      } else {
        const errorData = await uploadResponse.json();
        console.error('🖼️ [UPLOAD] API error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('🖼️ [UPLOAD] Error uploading image:', error);
      showMessage('Failed to upload image. Please try again.', 'error');
    }
  };
  */

  // Get profile image URL - check person record first, then fallback to record itself
  const getProfileImageUrl = () => {
    // Check the record's profileImageUrl first (for direct storage)
    if (record?.profileImageUrl) {
      return record.profileImageUrl;
    }
    
    // Then check if there's a person record with an image
    if (record?.person?.profilePictureUrl) {
      return record.person.profilePictureUrl;
    }
    
    return null;
  };

  // Get record subtitle based on type
  const getSubtitle = () => {
    switch (recordType) {
      case 'leads':
      case 'prospects':
      case 'speedrun':
        // Check if this is a company record
        if (record?.isCompanyLead || record?.recordType === 'company') {
          const coresignalData = record?.customFields?.coresignalData;
          const industry = coresignalData?.industry || record?.industry || 'Unknown Industry';
          const employeeCount = coresignalData?.employees_count || record?.size || record?.employeeCount;
          return employeeCount ? `${employeeCount} employees • ${industry}` : industry;
        }
        // For person records, show title
        const title = record?.title || record?.jobTitle;
        return title || 'Unknown Title';
      case 'opportunities':
      case 'deals':
        // For opportunities, show opportunity stage and amount (opportunities are company records)
        // Default to QUALIFICATION if status is OPPORTUNITY but no stage is set
        const opportunityStage = record?.opportunityStage || 
                                record?.stage || 
                                (record?.status === 'OPPORTUNITY' ? 'QUALIFICATION' : null) ||
                                'QUALIFICATION';
        const opportunityAmount = record?.opportunityAmount || record?.amount || record?.revenue || record?.value;
        const amountDisplay = opportunityAmount ? `$${Number(opportunityAmount).toLocaleString()}` : 'No Amount';
        return `${opportunityStage} • ${amountDisplay}`;
      case 'companies':
        // Use real company data with graceful fallback
        const coresignalData = record?.customFields?.coresignalData;
        const categories = coresignalData?.categories_and_keywords || [];
        const employeeCount = coresignalData?.employees_count || record?.size || record?.employeeCount;
        
        // Extract industry for fallback
        const industry = coresignalData?.industry || 
                         record?.industry || 
                         categories[0];
        
        // Priority 1: If we have employee count, show size category
        if (employeeCount) {
          const count = parseInt(employeeCount.toString().replace(/\D/g, ''));
          if (!isNaN(count) && count > 0) {
            if (count <= 50) {
              return 'Small company';
            } else if (count <= 200) {
              return 'Mid-size company';
            } else if (count <= 1000) {
              return 'Growing company';
            } else {
              return 'Large company';
            }
          }
        }
        
        // Priority 2: If we have industry, show that
        if (industry && industry !== 'company') {
          return `${industry} company`;
        }
        
        // Priority 3: Default fallback when no data available
        return 'Newly added company';
      case 'people':
        const personTitle = record?.jobTitle || record?.title;
        // Use the same company extraction logic as UniversalOverviewTab
        const personCoresignalData = record?.customFields?.coresignal || {};
        const personCompany = personCoresignalData.experience?.find((exp: any) => exp.active_experience === 1)?.company_name || 
                             personCoresignalData.experience?.[0]?.company_name || 
                             record?.company?.name || 
                             record?.companyName || 
                             'Company';
        return personTitle ? `${personCompany} • ${personTitle}` : personCompany;
      case 'clients':
        return `${record?.status || 'Unknown Status'} • ${record?.totalValue ? `$${record.totalValue.toLocaleString()}` : 'No Value'}`;
      case 'partners':
        return `${record?.type || 'Unknown Type'} • ${record?.status || 'Unknown Status'}`;
      default:
        return record?.email || record?.phone || record?.description || '';
    }
  };

  // This matches the user's implementation
  // handleInlineFieldSave is already implemented by the user

  // Helper function to parse full name into firstName and lastName
  const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
    const trimmedName = fullName.trim();
    
    // Handle empty names
    if (!trimmedName) {
      return { firstName: '', lastName: '' };
    }
    
    const nameParts = trimmedName.split(/\s+/); // Split on one or more spaces
    
    // Check if first part is a valid name (contains at least one letter)
    const isValidFirstName = (part: string): boolean => {
      return /[a-zA-Z]/.test(part);
    };
    
    // Single name case
    if (nameParts.length === 1) {
      if (isValidFirstName(nameParts[0])) {
        return { firstName: nameParts[0], lastName: '' };
      } else {
        // If single part is invalid (like "."), treat as lastName
        return { firstName: '', lastName: nameParts[0] };
      }
    }
    
    // Multiple parts - check if first part is valid
    if (isValidFirstName(nameParts[0])) {
      return {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ')
      };
    } else {
      // First part is invalid (like "."), treat everything as lastName
      return {
        firstName: '',
        lastName: trimmedName
      };
    }
  };

  // Handle record updates
  // Handle saving a reminder
  const handleSaveReminder = async (reminderAt: Date, note?: string) => {
    try {
      const workspaceId = record?.workspaceId || '';
      const entityType = recordType === 'people' || recordType === 'leads' || recordType === 'prospects' 
        ? 'people' 
        : 'companies';
      
      const result = await authFetch('/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId: record?.id,
          reminderAt: reminderAt.toISOString(),
          note: note || null,
        }),
      });

      if (result.success) {
        showMessage('Reminder set successfully!');
      } else {
        throw new Error(result.error || 'Failed to save reminder');
      }
    } catch (error) {
      console.error('Failed to save reminder:', error);
      throw error;
    }
  };

  const handleUpdateSubmit = async (updatedData: any, actionData?: any) => {
    try {
      setLoading(true);
      console.log('🔄 [UNIVERSAL] Updating record:', localRecord.id, 'with data:', updatedData);
      
      // Prepare update data with proper field mapping
      const updatePayload: Record<string, any> = {};
      
      // Helper function to safely add fields to payload with type conversion and null handling
      const addField = (key: string, value: any, type?: 'string' | 'number' | 'boolean' | 'date') => {
        if (value === undefined || value === null || value === '') {
          return; // Skip empty values
        }
        
        let processedValue = value;
        
        // Type conversion
        if (type === 'number') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            processedValue = numValue;
          } else {
            return; // Skip invalid numbers
          }
        } else if (type === 'boolean') {
          if (typeof value === 'string') {
            processedValue = value.toLowerCase() === 'true';
          } else {
            processedValue = Boolean(value);
          }
        } else if (type === 'date') {
          if (value instanceof Date) {
            processedValue = value.toISOString();
          } else if (typeof value === 'string' && value.trim() && value !== '-') {
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              console.warn(`⚠️ [UNIVERSAL] Invalid date value: "${value}", skipping field`);
              return; // Skip invalid dates
            }
            processedValue = dateValue.toISOString();
          } else {
            return; // Skip invalid dates, empty strings, or dash placeholders
          }
        } else {
          // String type - trim whitespace
          if (typeof value === 'string') {
            processedValue = value.trim();
            if (processedValue === '') {
              return; // Skip empty strings after trimming
            }
          }
        }
        
        updatePayload[key] = processedValue;
      };
      
      // Map common fields to streamlined schema - using bracket notation for TypeScript strict mode
      if ('name' in updatedData && updatedData['name'] !== undefined) {
        const nameValue = updatedData['name'];
        // Only process name if it's not empty - preserve existing values if name is empty
        if (typeof nameValue === 'string' && nameValue.trim() !== '') {
          // Sanitize the name to remove bullet characters and other unwanted characters
          const sanitizedName = sanitizeName(nameValue);
          if (sanitizedName) {
            if (recordType === 'companies') {
              // For companies, 'name' is the company name
              updatePayload['name'] = sanitizedName;
            } else {
              // For people, split name into firstName/lastName with validation
              const { firstName, lastName } = parseFullName(sanitizedName);
              // Only update firstName/lastName if we got valid values from parsing
              // Don't default to "Unknown User" - preserve existing values if name parsing fails
              if (firstName || lastName) {
                updatePayload['firstName'] = firstName;
                updatePayload['lastName'] = lastName;
              }
              updatePayload['fullName'] = sanitizedName;
            }
          }
          // If sanitization results in empty string, skip processing to preserve existing values
        }
        // If name is empty, skip processing to preserve existing firstName/lastName values
      }
      if ('firstName' in updatedData && updatedData['firstName'] !== undefined) {
        // Only update if value is not empty - preserve existing value if empty
        const firstNameValue = updatedData['firstName'];
        if (typeof firstNameValue === 'string' && firstNameValue.trim() !== '') {
          const sanitizedFirstName = sanitizeName(firstNameValue);
          if (sanitizedFirstName) {
            updatePayload['firstName'] = sanitizedFirstName;
          }
        }
      }
      if ('lastName' in updatedData && updatedData['lastName'] !== undefined) {
        // Only update if value is not empty - preserve existing value if empty
        const lastNameValue = updatedData['lastName'];
        if (typeof lastNameValue === 'string' && lastNameValue.trim() !== '') {
          const sanitizedLastName = sanitizeName(lastNameValue);
          if (sanitizedLastName) {
            updatePayload['lastName'] = sanitizedLastName;
          }
        }
      }
      if ('fullName' in updatedData && updatedData['fullName'] !== undefined) {
        // Only update fullName if it's not empty
        const fullNameValue = updatedData['fullName'];
        if (typeof fullNameValue === 'string' && fullNameValue.trim() !== '') {
          const sanitizedFullName = sanitizeName(fullNameValue);
          if (sanitizedFullName) {
            updatePayload['fullName'] = sanitizedFullName;
          }
        }
      }
      
      // Sync fullName when firstName or lastName are updated individually
      if (('firstName' in updatedData || 'lastName' in updatedData) && 
          (updatedData['firstName'] !== undefined || updatedData['lastName'] !== undefined)) {
        // Use updated values if they're non-empty, otherwise fall back to existing values
        const firstName = (updatedData['firstName'] !== undefined && 
                          typeof updatedData['firstName'] === 'string' && 
                          updatedData['firstName'].trim() !== '')
                          ? updatedData['firstName'].trim()
                          : (localRecord?.firstName || '');
        const lastName = (updatedData['lastName'] !== undefined && 
                         typeof updatedData['lastName'] === 'string' && 
                         updatedData['lastName'].trim() !== '')
                         ? updatedData['lastName'].trim()
                         : (localRecord?.lastName || '');
        const computedFullName = `${firstName} ${lastName}`.trim();
        // Only update fullName if we have at least one name component
        if (computedFullName) {
          updatePayload['fullName'] = computedFullName;
        }
      }
      
      // Basic contact fields
      addField('email', updatedData['email']);
      addField('workEmail', updatedData['workEmail']);
      addField('phone', updatedData['phone']);
      addField('mobilePhone', updatedData['mobilePhone']);
      addField('linkedinUrl', updatedData['linkedinUrl']);
      
      // Company-specific fields (only for company records)
      if (recordType === 'companies') {
        // Basic company fields
        addField('name', updatedData['name']);
        addField('legalName', updatedData['legalName']);
        addField('tradingName', updatedData['tradingName']);
        addField('localName', updatedData['localName']);
        addField('description', updatedData['description']);
        addField('website', updatedData['website']);
        addField('fax', updatedData['fax']);
        addField('industry', updatedData['industry']);
        addField('sector', updatedData['sector']);
        addField('size', updatedData['size']);
        addField('revenue', updatedData['revenue']);
        addField('currency', updatedData['currency']);
        addField('employeeCount', updatedData['employeeCount']);
        addField('foundedYear', updatedData['foundedYear']);
        addField('registrationNumber', updatedData['registrationNumber']);
        addField('taxId', updatedData['taxId']);
        addField('vatNumber', updatedData['vatNumber']);
        addField('domain', updatedData['domain']);
        addField('logoUrl', updatedData['logoUrl']);
        addField('lastAction', updatedData['lastAction']);
        addField('nextActionReasoning', updatedData['nextActionReasoning']);
        addField('nextActionPriority', updatedData['nextActionPriority']);
        addField('nextActionType', updatedData['nextActionType']);
        addField('status', updatedData['status']);
        addField('priority', updatedData['priority']);
        
        // Intelligence fields
        addField('businessChallenges', updatedData['businessChallenges']);
        addField('businessPriorities', updatedData['businessPriorities']);
        addField('competitiveAdvantages', updatedData['competitiveAdvantages']);
        addField('growthOpportunities', updatedData['growthOpportunities']);
        addField('strategicInitiatives', updatedData['strategicInitiatives']);
        addField('successMetrics', updatedData['successMetrics']);
        addField('marketThreats', updatedData['marketThreats']);
        addField('keyInfluencers', updatedData['keyInfluencers']);
        addField('decisionTimeline', updatedData['decisionTimeline']);
        addField('marketPosition', updatedData['marketPosition']);
        addField('digitalMaturity', updatedData['digitalMaturity']);
        addField('techStack', updatedData['techStack']);
        addField('competitors', updatedData['competitors']);
        
        // Social media fields
        addField('linkedinUrl', updatedData['linkedinUrl']);
        addField('linkedinFollowers', updatedData['linkedinFollowers']);
        addField('twitterUrl', updatedData['twitterUrl']);
        addField('twitterFollowers', updatedData['twitterFollowers']);
        addField('facebookUrl', updatedData['facebookUrl']);
        addField('instagramUrl', updatedData['instagramUrl']);
        addField('youtubeUrl', updatedData['youtubeUrl']);
        addField('githubUrl', updatedData['githubUrl']);
        
        // HQ Location fields
        addField('hqLocation', updatedData['hqLocation']);
        addField('hqFullAddress', updatedData['hqFullAddress']);
        addField('hqCity', updatedData['hqCity']);
        addField('hqState', updatedData['hqState']);
        addField('hqStreet', updatedData['hqStreet']);
        addField('hqZipcode', updatedData['hqZipcode']);
        addField('hqRegion', updatedData['hqRegion']);
        addField('hqCountryIso2', updatedData['hqCountryIso2']);
        addField('hqCountryIso3', updatedData['hqCountryIso3']);
        
        // Business fields
        addField('lastFundingAmount', updatedData['lastFundingAmount']);
        addField('lastFundingDate', updatedData['lastFundingDate'], 'date');
        addField('stockSymbol', updatedData['stockSymbol']);
        addField('isPublic', updatedData['isPublic']);
        addField('naicsCodes', updatedData['naicsCodes']);
        addField('sicCodes', updatedData['sicCodes']);
        
        // Tech fields
        addField('activeJobPostings', updatedData['activeJobPostings']);
        addField('numTechnologiesUsed', updatedData['numTechnologiesUsed']);
        addField('technologiesUsed', updatedData['technologiesUsed']);
        
        // SBI fields
        addField('confidence', updatedData['confidence']);
        addField('sources', updatedData['sources']);
        addField('acquisitionDate', updatedData['acquisitionDate'], 'date');
        addField('lastVerified', updatedData['lastVerified'], 'date');
        addField('parentCompanyName', updatedData['parentCompanyName']);
        addField('parentCompanyDomain', updatedData['parentCompanyDomain']);
      }
      
      // Job and company fields
      if ('title' in updatedData && updatedData['title'] !== undefined) {
        updatePayload['jobTitle'] = updatedData['title'];
      }
      addField('jobTitle', updatedData['jobTitle']);
      addField('department', updatedData['department']);
      addField('seniority', updatedData['seniority']);
      
      // Company information (will need special handling for company linking)
      addField('company', updatedData['company']);
      addField('vertical', updatedData['vertical']);
      
      // Status and priority
      // Normalize status and priority to uppercase for enum compatibility
      if ('status' in updatedData && updatedData['status'] !== undefined) {
        const statusValue = updatedData['status'];
        // Map common status values to valid enum values
        const statusMap: Record<string, string> = {
          'new': 'LEAD',
          'lead': 'LEAD',
          'prospect': 'PROSPECT',
          'opportunity': 'OPPORTUNITY',
          'client': 'CLIENT',
          'superfan': 'SUPERFAN'
        };
        updatePayload['status'] = statusMap[statusValue.toLowerCase()] || statusValue.toUpperCase();
      }
      
      if ('priority' in updatedData && updatedData['priority'] !== undefined) {
        const priorityValue = updatedData['priority'];
        // Map common priority values to valid enum values
        const priorityMap: Record<string, string> = {
          'low': 'LOW',
          'medium': 'MEDIUM',
          'high': 'HIGH'
        };
        updatePayload['priority'] = priorityMap[priorityValue.toLowerCase()] || priorityValue.toUpperCase();
      }
      
      // Location fields
      addField('address', updatedData['address']);
      addField('city', updatedData['city']);
      addField('state', updatedData['state']);
      addField('country', updatedData['country']);
      addField('postalCode', updatedData['postalCode']);
      
      // Activity and engagement
      addField('nextAction', updatedData['nextAction']);
      addField('nextActionDate', updatedData['nextActionDate'], 'date');
      addField('lastActionDate', updatedData['lastActionDate'], 'date');
      addField('engagementScore', updatedData['engagementScore'], 'number');
      
      // Notes and tags
      addField('notes', updatedData['notes']);
      if ('tags' in updatedData && updatedData['tags'] !== undefined) {
        updatePayload['tags'] = updatedData['tags'];
      }
      
      // Ranking and scoring (numeric fields)
      addField('globalRank', updatedData['globalRank'], 'number');
      addField('companyRank', updatedData['companyRank'], 'number');
      
      // Additional fields from UpdateModal
      addField('source', updatedData['source']);
      addField('bio', updatedData['bio']);
      addField('profilePictureUrl', updatedData['profilePictureUrl']);
      
      // Opportunity fields (for leads/prospects)
      addField('estimatedValue', updatedData['estimatedValue'], 'number');
      addField('currency', updatedData['currency']);
      addField('expectedCloseDate', updatedData['expectedCloseDate'], 'date');
      addField('stage', updatedData['stage']);
      addField('probability', updatedData['probability'], 'number');
      
      console.log('📝 [UNIVERSAL] Mapped update payload:', updatePayload);
      
      // Make API call to update the record using v1 APIs
      // Note: The API will handle company linking automatically when it receives the 'company' field
      let result: any;
      
      // For company leads, use companies API instead of people API
      if (recordType === 'leads' && localRecord?.isCompanyLead) {
        // Company leads use v1 companies API
        console.log('📡 [UNIVERSAL] Making PATCH request to companies API for company lead with payload:', updatePayload);
        result = await authFetch(`/api/v1/companies/${localRecord.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
      } else if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects') {
        // All people-related records use v1 people API
        console.log('📡 [UNIVERSAL] Making PATCH request to people API with payload:', updatePayload);
        result = await authFetch(`/api/v1/people/${localRecord.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
      } else if (recordType === 'companies' || recordType === 'opportunities') {
        // Opportunities are companies
        console.log('📡 [UNIVERSAL] Making PATCH request to companies API with payload:', updatePayload);
        result = await authFetch(`/api/v1/companies/${localRecord.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
      } else {
        // Fallback to legacy unified API for other types
        console.log('📡 [UNIVERSAL] Making PATCH request to unified API with payload:', updatePayload);
        result = await authFetch('/api/data/unified', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: recordType,
            action: 'update',
            id: localRecord.id,
            data: updatePayload,
            workspaceId: record?.workspaceId || '',
            userId: '01K1VBYZG41K9QA0D9CF06KNRG'
          }),
        });
      }
      
      if (!result.success) {
        console.error('❌ [UNIVERSAL] API update failed:', {
          error: result.error,
          details: result.details,
          code: result.code
        });
        throw new Error(result.error || 'Failed to update record');
      }
      console.log('✅ [UNIVERSAL] Record updated successfully:', result.data);

      // 🚀 INDUSTRY BEST PRACTICE: Only set record-specific flags to avoid race conditions
      // Section-level flags are cleared by useFastSectionData before PipelineDetailPage can read them
      // Record-specific flags are only read/cleared by loadDirectRecord, preventing race conditions

      // Sanitize name fields in API response to ensure consistency
      const sanitizedApiData = { ...result.data };
      if (sanitizedApiData.fullName) {
        sanitizedApiData.fullName = sanitizeName(sanitizedApiData.fullName) || sanitizedApiData.fullName;
      }
      if (sanitizedApiData.firstName) {
        sanitizedApiData.firstName = sanitizeName(sanitizedApiData.firstName) || sanitizedApiData.firstName;
      }
      if (sanitizedApiData.lastName) {
        sanitizedApiData.lastName = sanitizeName(sanitizedApiData.lastName) || sanitizedApiData.lastName;
      }
      if (sanitizedApiData.name && recordType !== 'companies') {
        sanitizedApiData.name = sanitizeName(sanitizedApiData.name) || sanitizedApiData.name;
      }

      // Update local record state with sanitized API response
      setLocalRecord(sanitizedApiData);

      // Call the parent onRecordUpdate callback
      if (onRecordUpdate) {
        console.log('🔄 [UNIVERSAL] Calling onRecordUpdate callback');
        await onRecordUpdate(sanitizedApiData);
      }
      
      // Update local record state with API response data (using sanitized data)
      const updatedRecord = {
        ...localRecord,
        ...updatedData,
        ...updatePayload,
        ...sanitizedApiData // Include sanitized data from API response
      };
      
      console.log('🔄 [UNIVERSAL] Updated local record state:', {
        originalRecord: localRecord,
        updateData: updatedData,
        updatePayload: updatePayload,
        apiResponse: sanitizedApiData,
        finalRecord: updatedRecord
      });
      
      // Update local state immediately for UI refresh
      setLocalRecord(updatedRecord);
      
      if (onRecordUpdate) {
        onRecordUpdate(updatedRecord);
      }
      
      // Invalidate all caches for this record to ensure fresh data on refresh
      if (typeof window !== 'undefined') {
        // Clear sessionStorage caches
        sessionStorage.removeItem(`cached-${recordType}-${localRecord.id}`);
        sessionStorage.removeItem(`current-record-${recordType}`);
        
        // Clear all relevant localStorage caches to force refresh
        const workspaceId = record?.workspaceId || '';
        
        // Clear all data caches that might contain this record
        // Record type mapping: people/leads/prospects/opportunities/speedrun → people cache
        // companies → companies cache, all types affect counts cache
        localStorage.removeItem(`adrata-people-${workspaceId}`);        // people, leads, prospects, opportunities, speedrun
        localStorage.removeItem(`adrata-prospects-${workspaceId}`);     // prospects
        localStorage.removeItem(`adrata-leads-${workspaceId}`);         // leads  
        localStorage.removeItem(`adrata-opportunities-${workspaceId}`); // opportunities
        localStorage.removeItem(`adrata-companies-${workspaceId}`);     // companies
        localStorage.removeItem(`adrata-speedrun-${workspaceId}`);      // speedrun
        localStorage.removeItem(`adrata-fast-counts-${workspaceId}`);   // all record types affect counts
        
        // Clear acquisition OS cache (used by PipelineDetailPage)
        // The unified cache system uses keys like: adrata-cache-revenue-os:v4:${workspaceId}:${userId}
        const cacheKeys = Object.keys(localStorage);
        cacheKeys.forEach(key => {
          if (key.startsWith('adrata-cache-revenue-os:') && key.includes(workspaceId)) {
            localStorage.removeItem(key);
            console.log(`🗑️ [CACHE] Cleared unified cache: ${key}`);
          }
        });
        
        // Also clear SWR cache if available (used by useAdrataData)
        if ((window as any).__SWR_CACHE__) {
          const swrCache = (window as any).__SWR_CACHE__;
          const swrKeys = Array.from(swrCache.keys()) as string[];
          swrKeys.forEach((key: string) => {
            if (key.includes('revenue-os') && key.includes(workspaceId)) {
              swrCache.delete(key);
              console.log(`🗑️ [CACHE] Cleared SWR cache: ${key}`);
            }
          });
        }
        
        console.log('🗑️ [CACHE] Invalidated all caches after update:', {
          workspaceId,
          recordType,
          recordId: localRecord.id,
          clearedCaches: [
            `adrata-people-${workspaceId}`,
            `adrata-prospects-${workspaceId}`,
            `adrata-leads-${workspaceId}`,
            `adrata-opportunities-${workspaceId}`,
            `adrata-companies-${workspaceId}`,
            `adrata-speedrun-${workspaceId}`,
            `adrata-fast-counts-${workspaceId}`,
            'revenue-os:*'
          ]
        });
        
        // Force next page load to bypass cache and fetch fresh from API
        sessionStorage.setItem(`force-refresh-${recordType}-${localRecord.id}`, 'true');
        console.log(`🔄 [FORCE REFRESH] Set force refresh flag for ${recordType} record ${localRecord.id}`);
      }
      
      // Also dispatch a custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('record-updated', {
        detail: {
          recordType,
          recordId: localRecord.id,
          updatedRecord,
          updateData: updatedData,
          actionData
        }
      }));
      
      // Dispatch cache invalidation event for other components
      window.dispatchEvent(new CustomEvent('cache-invalidated', {
        detail: {
          recordType,
          recordId: localRecord.id,
        }
      }));
      
      if (actionData) {
        console.log('📝 [UNIVERSAL] Logging action with update:', actionData);
        // TODO: Implement action logging API call
        setHasLoggedAction(true);
        showMessage('Record updated and action logged successfully!');
      } else {
        showMessage('Record updated successfully!');
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error updating record:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle snooze functionality with new dropdown options
  const handleSnoozeOption = (option: 'next-sprint' | 'end-of-day' | 'tomorrow' | 'choose-date', customDate?: Date) => {
    if (!record) return;

    let snoozeUntil: string;
    let duration: string;
    let targetSprint: number | null = null;

    const now = new Date();

    switch (option) {
      case 'next-sprint': {
        // Calculate next sprint index based on record rank
        // Sprint context may not be available, so calculate from rank
        const SPRINT_SIZE = 10;
        const rank = record.globalRank || record.rank || 999999;
        const currentSprintIndex = Math.floor((rank - 1) / SPRINT_SIZE);
        const nextSprintIndex = currentSprintIndex + 1;
        // Snooze until end of current day (midnight) so it appears in next sprint
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        snoozeUntil = tomorrow.toISOString();
        duration = 'next-sprint';
        break;
      }
      case 'end-of-day': {
        // Snooze until 4pm today, record appears in sprint 5
        const eod = new Date(now);
        eod.setHours(16, 0, 0, 0); // 4pm
        if (eod < now) {
          // If 4pm has passed, set for tomorrow 4pm
          eod.setDate(eod.getDate() + 1);
        }
        snoozeUntil = eod.toISOString();
        duration = 'end-of-day';
        targetSprint = 5; // Record appears in sprint 5
        break;
      }
      case 'tomorrow': {
        // Snooze until midnight tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        snoozeUntil = tomorrow.toISOString();
        duration = 'tomorrow';
        break;
      }
      case 'choose-date': {
        if (!customDate) return;
        // Use selected date, set to start of day
        const selectedDate = new Date(customDate);
        selectedDate.setHours(0, 0, 0, 0);
        snoozeUntil = selectedDate.toISOString();
        duration = 'custom-date';
        break;
      }
      default:
        return;
    }

    // Store snooze data in localStorage
    const snoozeData: any = {
      recordId: record.id,
      recordName: record.fullName || record.name || 'Unknown',
      recordType,
      duration,
      snoozeUntil,
      snoozedAt: new Date().toISOString()
    };

    // Add target sprint if specified (for End of Day)
    if (targetSprint !== null) {
      snoozeData.targetSprint = targetSprint;
    }

    // Get existing snoozed records
    const existingSnoozed = JSON.parse(localStorage.getItem('snoozedRecords') || '[]');

    // Add new snooze record (replace if already exists)
    const updatedSnoozed = existingSnoozed.filter((item: any) => item.recordId !== record.id);
    updatedSnoozed.push(snoozeData);

    // Save to localStorage
    localStorage.setItem('snoozedRecords', JSON.stringify(updatedSnoozed));

    // Call parent handler if provided
    if (onSnooze) {
      onSnooze(record.id, duration);
    }

    const optionLabels: Record<string, string> = {
      'next-sprint': 'Next Sprint',
      'end-of-day': 'End of Day',
      'tomorrow': 'Tomorrow',
      'custom-date': 'Custom Date'
    };
    showMessage(`Snoozed until ${optionLabels[duration] || duration}`);
    
    setTimeout(() => onBack(), 1000);
  };

  // Legacy handleSnooze for backward compatibility (kept for non-speedrun records)
  const handleSnooze = () => {
    const snoozeOptions = [
      { label: "1 Hour", value: "1h" },
      { label: "1 Day", value: "1d" },
      { label: "1 Week", value: "1w" },
      { label: "1 Quarter (3 months)", value: "1q" }
    ];

    const optionsList = snoozeOptions.map((option, index) => `${index + 1}. ${option.label}`).join('\n');
    const choice = prompt(`How long would you like to snooze this record?\n\n${optionsList}\n\nEnter 1, 2, 3, or 4:`);
    
    if (choice && ['1', '2', '3', '4'].includes(choice.trim())) {
      const selectedOption = snoozeOptions[parseInt(choice.trim()) - 1];
      if (!selectedOption) return;
      
      // Store snooze data in localStorage
      const snoozeData = {
        recordId: record.id,
        recordName: record.fullName || record.name || 'Unknown',
        recordType,
        duration: selectedOption.value,
        snoozeUntil: calculateSnoozeUntil(selectedOption.value),
        snoozedAt: new Date().toISOString()
      };
      
      // Get existing snoozed records
      const existingSnoozed = JSON.parse(localStorage.getItem('snoozedRecords') || '[]');
      
      // Add new snooze record (replace if already exists)
      const updatedSnoozed = existingSnoozed.filter((item: any) => item.recordId !== record.id);
      updatedSnoozed.push(snoozeData);
      
      // Save to localStorage
      localStorage.setItem('snoozedRecords', JSON.stringify(updatedSnoozed));
      
      // Call parent handler if provided
      if (onSnooze) {
        onSnooze(record.id, selectedOption.value);
      }
      
      showMessage(`Snoozed for ${selectedOption.label.toLowerCase()}`);
      setTimeout(() => onBack(), 1000);
    }
  };

  // Calculate snooze until date (legacy function)
  const calculateSnoozeUntil = (duration: string): string => {
    const now = new Date();
    
    switch (duration) {
      case '1h':
        now.setHours(now.getHours() + 1);
        break;
      case '1d':
        now.setDate(now.getDate() + 1);
        break;
      case '1w':
        now.setDate(now.getDate() + 7);
        break;
      case '1q':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setHours(now.getHours() + 1);
    }
    
    return now.toISOString();
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmName('');
  };

  // Handle delete record
  const handleDeleteRecord = async (recordId: string) => {
    try {
      console.log(`🗑️ [UNIVERSAL] Deleting ${recordType} ${recordId}`);
      
      // Make API call to soft delete the record using v1 APIs
      let result: any;
      
      // For company leads, use companies API instead of people API
      if (recordType === 'leads' && localRecord?.isCompanyLead) {
        // Company leads use v1 companies API
        result = await authFetch(`/api/v1/companies/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects') {
        // All people-related records use v1 people API
        result = await authFetch(`/api/v1/people/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (recordType === 'companies' || recordType === 'opportunities') {
        // Opportunities are companies
        result = await authFetch(`/api/v1/companies/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        // For other record types, try to use appropriate v1 API or throw error
        console.log('🔍 [DEBUG] Unsupported record type for v1 migration:', recordType);
        throw new Error(`Record type '${recordType}' is not yet supported in v1 APIs. Please use companies or people records.`);
      }
      
      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${recordType}`);
      }
      
      console.log(`✅ [UNIVERSAL] Successfully deleted ${recordType} ${recordId}`);
      
      // Show success message
      showMessage('Record deleted successfully!', 'success');
      
      // Navigate back to the list with a small delay to ensure message is visible
      setTimeout(() => {
        onBack();
      }, 100);
    } catch (error) {
      console.error(`❌ [UNIVERSAL] Error deleting ${recordType} ${recordId}:`, error);
      throw error;
    }
  };

  // Helper function to update sessionStorage cache after successful save
  const updateSessionStorageCache = (updatedRecordData: any, fieldName: string, recId: string, recType: string) => {
    try {
      // Map recordType to section for cache keys
      // PipelineDetailPage reads from cached-${section}-${recordId} and current-record-${section}
      const section = recType === 'universal' ? 'leads' : recType;
      
      const cachedKey = `cached-${section}-${recId}`;
      const currentKey = `current-record-${section}`;
      
      // Update the cache with fresh data
      sessionStorage.setItem(cachedKey, JSON.stringify(updatedRecordData));
      sessionStorage.setItem(currentKey, JSON.stringify({ 
        id: recId, 
        data: updatedRecordData, 
        timestamp: Date.now() 
      }));
      
      console.log(`💾 [UNIVERSAL] Updated sessionStorage cache for ${recId} after ${fieldName} update:`, {
        recType,
        section,
        cachedKey,
        currentKey,
        updatedField: fieldName,
        hasLinkedinUrl: !!updatedRecordData?.linkedinUrl
      });
    } catch (error) {
      console.warn('Failed to update sessionStorage cache:', error);
    }
  };

  // Handle inline field save
  const handleInlineFieldSave = async (field: string, value: string | any, recordId?: string, recordTypeParam?: string) => {
    console.log(`🔍 [INLINE EDIT AUDIT] Starting save for field: ${field}`, {
      field,
      value,
      recordId,
      recordTypeParam,
      currentRecord: record,
      currentLocalRecord: localRecord,
      // Email-specific debugging
      isEmailField: field === 'email',
      currentEmailInRecord: record?.email,
      currentEmailInLocalRecord: localRecord?.email
    });
    
    // Track this field as having a pending save
    setPendingSaves(prev => new Set(prev).add(field));
    
    try {
      console.log(`🔄 [UNIVERSAL] Saving ${field} = ${value} for ${recordType} ${recordId}`);
      
      // Special handling for company field
      if (field === 'company') {
        console.log(`🏢 [UNIVERSAL] Company field update - value type: ${typeof value}, is object: ${typeof value === 'object'}`);
        
        if (typeof value === 'object' && value !== null && value.id) {
          // Company object selected from dropdown
          console.log(`🏢 [UNIVERSAL] Company object selected:`, value);
          
          // Update the person record with the companyId and company name
          const updateData = {
            companyId: value.id,
            company: value.name
          };
          
          console.log(`🔄 [UNIVERSAL] Updating person ${recordId} with company data:`, updateData);
          
          const response = await fetch(`/api/v1/people/${recordId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updateData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update company');
          }
          
          const result = await response.json();
          console.log(`✅ [UNIVERSAL] Company object update response:`, result);
          
          // Update local state
          setLocalRecord((prev: any) => ({
            ...prev,
            companyId: value.id,
            company: value.name
          }));
          
          // Track company field as recently updated
          setRecentlyUpdatedFields(prev => new Set(prev).add('company'));
          setTimeout(() => {
            setRecentlyUpdatedFields(prev => {
              const next = new Set(prev);
              next.delete('company');
              return next;
            });
          }, 3000);
          
          if (onRecordUpdate && result.data) {
            const updatedRecord = { ...record, ...result.data };
            onRecordUpdate(updatedRecord);
            // Update sessionStorage cache with fresh data
            updateSessionStorageCache(updatedRecord, 'company', recordId || '', recordType);
          }
          
          showMessage(`Updated company to ${value.name} successfully`);
          
          // Trigger server refresh
          setTimeout(() => router.refresh(), 500);
          return;
        } else if (typeof value === 'string') {
          // String value - could be updating existing company name or creating new one
          console.log(`🏢 [UNIVERSAL] Company string update: "${value}"`);
          
          // If there's an existing companyId, update the company name
          if (record?.companyId) {
            console.log(`🏢 [UNIVERSAL] Updating existing company ${record.companyId} name to: "${value}"`);
            
            const response = await fetch(`/api/v1/companies/${record.companyId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ name: value }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to update company name');
            }
            
            const result = await response.json();
            console.log(`✅ [UNIVERSAL] Company name update response:`, result);
            
            // Also update the person record's company field to reflect the new company name
            console.log(`🔄 [UNIVERSAL] Updating person record ${recordId} company field to: "${value}"`);
            const personUpdateResponse = await fetch(`/api/v1/people/${recordId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ company: value }),
            });
            
            if (!personUpdateResponse.ok) {
              console.warn('⚠️ [UNIVERSAL] Failed to update person record company field, but company was updated successfully');
            } else {
              const personUpdateResult = await personUpdateResponse.json();
              console.log(`✅ [UNIVERSAL] Person record company field updated:`, personUpdateResult);
            }
            
            // Update local state with both company and person updates
            setLocalRecord((prev: any) => ({
              ...prev,
              company: value
            }));
            
            // Track company field as recently updated
            setRecentlyUpdatedFields(prev => new Set(prev).add('company'));
            setTimeout(() => {
              setRecentlyUpdatedFields(prev => {
                const next = new Set(prev);
                next.delete('company');
                return next;
              });
            }, 3000);
            
            if (onRecordUpdate && result.data) {
              const updatedRecord = { ...record, ...result.data, company: value };
              onRecordUpdate(updatedRecord);
              // Update sessionStorage cache with fresh data
              updateSessionStorageCache(updatedRecord, 'company name', recordId || '', recordType);
            }
            
            showMessage(`Updated company name to ${value} successfully`);
            
            // Clear caches to ensure fresh data on refresh
            if (typeof window !== 'undefined') {
              const workspaceId = record?.workspaceId || '';
              
              // Clear all relevant caches
              localStorage.removeItem(`adrata-companies-${workspaceId}`);
              localStorage.removeItem(`adrata-people-${workspaceId}`);
              localStorage.removeItem(`adrata-prospects-${workspaceId}`);
              localStorage.removeItem(`adrata-leads-${workspaceId}`);
              localStorage.removeItem(`adrata-opportunities-${workspaceId}`);
              localStorage.removeItem(`adrata-speedrun-${workspaceId}`);
              localStorage.removeItem(`adrata-fast-counts-${workspaceId}`);
              
              // Clear unified cache system
              const cacheKeys = Object.keys(localStorage);
              cacheKeys.forEach(key => {
                if (key.startsWith('adrata-cache-revenue-os:') && key.includes(workspaceId)) {
                  localStorage.removeItem(key);
                }
              });
              
              // Clear SWR cache
              if ((window as any).__SWR_CACHE__) {
                const swrCache = (window as any).__SWR_CACHE__;
                const swrKeys = Array.from(swrCache.keys()) as string[];
                swrKeys.forEach((key: string) => {
                  if (key.includes('revenue-os') && key.includes(workspaceId)) {
                    swrCache.delete(key);
                  }
                });
              }
              
              // Set force refresh flag for this record
              const forceRefreshKey = `force-refresh-${recordType}-${record.id}`;
              sessionStorage.setItem(forceRefreshKey, 'true');
              console.log(`🔄 [COMPANY UPDATE] Set force refresh flag for ${recordType} record ${record.id}`, {
                recordType,
                recordId: record.id,
                forceRefreshKey,
                allSessionKeys: Object.keys(sessionStorage),
                forceRefreshFlags: Object.keys(sessionStorage).filter(key => key.startsWith('force-refresh-'))
              });
            }
            
            // Trigger server refresh
            setTimeout(() => router.refresh(), 500);
            return;
          } else {
            // No existing companyId - create new company and link it
            console.log(`🏢 [UNIVERSAL] Creating new company: "${value}"`);
            
            // First create the company
            const createResponse = await fetch('/api/v1/companies', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ name: value }),
            });
            
            if (!createResponse.ok) {
              const errorData = await createResponse.json();
              throw new Error(errorData.error || 'Failed to create company');
            }
            
            const createResult = await createResponse.json();
            console.log(`✅ [UNIVERSAL] Company creation response:`, createResult);
            
            if (createResult.success && createResult.data) {
              // Now link the person to the new company
              const linkResponse = await fetch(`/api/v1/people/${recordId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  companyId: createResult.data.id,
                  company: createResult.data.name
                }),
              });
              
              if (!linkResponse.ok) {
                const errorData = await linkResponse.json();
                throw new Error(errorData.error || 'Failed to link company');
              }
              
              const linkResult = await linkResponse.json();
              console.log(`✅ [UNIVERSAL] Company linking response:`, linkResult);
              
              // Update local state
              setLocalRecord((prev: any) => ({
                ...prev,
                companyId: createResult.data.id,
                company: createResult.data.name
              }));
              
              // Track company field as recently updated
              setRecentlyUpdatedFields(prev => new Set(prev).add('company'));
              setTimeout(() => {
                setRecentlyUpdatedFields(prev => {
                  const next = new Set(prev);
                  next.delete('company');
                  return next;
                });
              }, 3000);
              
              if (onRecordUpdate && linkResult.data) {
                const updatedRecord = { ...record, ...linkResult.data };
                onRecordUpdate(updatedRecord);
                // Update sessionStorage cache with fresh data
                updateSessionStorageCache(updatedRecord, 'company creation', recordId || '', recordType);
              }
              
              showMessage(`Created and linked company ${value} successfully`);
              
              // Clear caches to ensure fresh data on refresh
              if (typeof window !== 'undefined') {
                const workspaceId = record?.workspaceId || '';
                
                // Clear all relevant caches
                localStorage.removeItem(`adrata-companies-${workspaceId}`);
                localStorage.removeItem(`adrata-people-${workspaceId}`);
                localStorage.removeItem(`adrata-prospects-${workspaceId}`);
                localStorage.removeItem(`adrata-leads-${workspaceId}`);
                localStorage.removeItem(`adrata-opportunities-${workspaceId}`);
                localStorage.removeItem(`adrata-speedrun-${workspaceId}`);
                localStorage.removeItem(`adrata-fast-counts-${workspaceId}`);
                
                // Clear unified cache system
                const cacheKeys = Object.keys(localStorage);
                cacheKeys.forEach(key => {
                  if (key.startsWith('adrata-cache-revenue-os:') && key.includes(workspaceId)) {
                    localStorage.removeItem(key);
                  }
                });
                
                // Clear SWR cache
                if ((window as any).__SWR_CACHE__) {
                  const swrCache = (window as any).__SWR_CACHE__;
                  const swrKeys = Array.from(swrCache.keys()) as string[];
                  swrKeys.forEach((key: string) => {
                    if (key.includes('revenue-os') && key.includes(workspaceId)) {
                      swrCache.delete(key);
                    }
                  });
                }
                
                // Set force refresh flag for this record
                sessionStorage.setItem(`force-refresh-${recordType}-${record.id}`, 'true');
                console.log(`🔄 [COMPANY CREATE] Set force refresh flag for ${recordType} record ${record.id}`);
              }
              
              // Trigger server refresh
              setTimeout(() => router.refresh(), 500);
              return;
            } else {
              throw new Error('Failed to create company');
            }
          }
        }
      }
      
      // Define which fields belong to which models
      const personalFields = [
        'name', 'fullName', 'firstName', 'lastName', 'displayName',
        'title', 'department', 'seniority',
        'email', 'workEmail', 'personalEmail', 'secondaryEmail',
        'phone', 'mobilePhone', 'workPhone',
        'linkedinUrl', 'linkedinNavigatorUrl', 'twitterHandle',
        'address', 'city', 'state', 'country', 'postalCode',
        'dateOfBirth', 'gender'
      ];
      
      const leadFields = [
        'status', 'priority', 'source', 'estimatedValue', 'currency',
        'notes', 'description', 'tags', 'customFields',
        'preferredLanguage', 'timezone', 'lastEnriched',
        'enrichmentSources', 'emailVerified', 'phoneVerified',
        'mobileVerified', 'enrichmentScore', 'emailConfidence',
        'phoneConfidence', 'dataCompleteness', 'buyerGroupRole',
        'completedStages', 'lastActionDate', 'lastAction', 'nextAction', 'nextActionDate',
        'engagementLevel', 'communicationStyle', 'decisionMakingStyle',
        'buyingSignals', 'competitorMentions', 'budget', 'avgResponseTime'
      ];
      
      const companyFields = [
        'company', 'companyName', 'companyDomain', 'industry',
        'companySize', 'website', 'revenue', 'employeeCount',
        'foundedYear', 'headquarters', 'companyType',
        'legalName', 'tradingName', 'localName', 'description',
        'phone', 'email', 'fax', 'address', 'city', 'state', 'country', 'postalCode',
        'sector', 'size', 'currency', 'domain', 'logoUrl', 'status', 'priority',
        // Additional company fields from API whitelist
        'registrationNumber', 'taxId', 'vatNumber', 'tags', 'notes',
        'lastAction', 'lastActionDate', 'nextAction', 'nextActionDate',
        'nextActionReasoning', 'nextActionPriority', 'nextActionType',
        'actionStatus', 'globalRank', 'entityId', 'mainSellerId',
        'actualCloseDate', 'expectedCloseDate', 'opportunityAmount',
        'opportunityProbability', 'opportunityStage', 'acquisitionDate',
        'competitors', 'businessChallenges', 'businessPriorities',
        'competitiveAdvantages', 'growthOpportunities', 'strategicInitiatives',
        'successMetrics', 'marketThreats', 'keyInfluencers', 'decisionTimeline',
        'marketPosition', 'digitalMaturity', 'techStack', 'linkedinUrl',
        'linkedinNavigatorUrl', 'linkedinFollowers', 'twitterUrl', 'twitterFollowers',
        'facebookUrl', 'instagramUrl', 'youtubeUrl', 'githubUrl',
        'hqLocation', 'hqFullAddress', 'hqCity', 'hqState', 'hqStreet',
        'hqZipcode', 'hqRegion', 'hqCountryIso2', 'hqCountryIso3',
        'lastFundingAmount', 'lastFundingDate', 'stockSymbol', 'isPublic',
        'naicsCodes', 'sicCodes', 'activeJobPostings', 'numTechnologiesUsed',
        'technologiesUsed', 'confidence', 'sources', 'lastVerified',
        'parentCompanyName', 'parentCompanyDomain', 'targetIndustry'
      ];
      
      // Determine which model to update based on the field
      let targetModel = recordType;
      let targetId = recordId;
      
      // Special handling for action editing - if recordTypeParam is "action", use actions model
      if (recordTypeParam === 'action') {
        targetModel = 'actions';
        targetId = recordId;
        console.log(`🎯 [MODEL TARGETING] Action field ${field} -> actions model (${targetId})`);
      }
      
      console.log(`🎯 [MODEL TARGETING] Field: ${field}, RecordType: ${recordType}, PersonId: ${record?.personId}, CompanyId: ${record?.companyId}`);
      
      // Handle "universal" recordType by detecting actual record type
      if (recordType === 'universal') {
        // Check if this is a person record (has firstName, lastName, email, etc.)
        if (record?.firstName || record?.lastName || record?.email || record?.jobTitle) {
          targetModel = 'people';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] Universal record detected as person -> people model (${targetId})`);
        }
        // Check if this is a company record (has employees, revenue, industry)
        else if (record?.employeeCount || record?.revenue || record?.industry) {
          targetModel = 'companies';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] Universal record detected as company -> companies model (${targetId})`);
        }
        // Default to people for personal fields
        else if (personalFields.includes(field)) {
          targetModel = 'people';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] Universal record with personal field ${field} -> people model (${targetId})`);
        }
        // Default to companies for company fields
        else if (companyFields.includes(field)) {
          targetModel = 'companies';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] Universal record with company field ${field} -> companies model (${targetId})`);
        }
      } else if (field === 'linkedinNavigatorUrl') {
        // Special case: linkedinNavigatorUrl can exist on both people and companies
        // Route based on the record type being edited
        if (recordType === 'companies') {
          // Editing a company record - save to company
          targetModel = 'companies';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] linkedinNavigatorUrl -> companies model (${targetId}) - saving to company`);
        } else if (recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'speedrun') {
          // Editing a person record - save to person
          targetModel = 'people';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] linkedinNavigatorUrl -> people model (${targetId}) - saving to person`);
        } else if (record?.companyId && companyFields.includes(field)) {
          // Person record with company - but linkedinNavigatorUrl should still go to person
          targetModel = 'people';
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] linkedinNavigatorUrl -> people model (${targetId}) - person field even with company`);
        } else {
          // Default to current record type
          targetModel = recordType;
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] linkedinNavigatorUrl -> ${recordType} model (${targetId}) - default`);
        }
      } else if (personalFields.includes(field)) {
        // Personal fields should go to the people model when personId exists
        if (record?.personId) {
          targetModel = 'people';
          targetId = record.personId;
          console.log(`🎯 [MODEL TARGETING] Personal field ${field} -> people model (${targetId})`);
        } else {
          // If no personId, keep on current record
          targetModel = recordType;
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] Personal field ${field} -> ${recordType} model (no personId)`);
        }
      } else if (companyFields.includes(field)) {
        // Company fields should go to the companies model when companyId exists
        if (record?.companyId) {
          targetModel = 'companies';
          targetId = record.companyId;
          console.log(`🎯 [MODEL TARGETING] Company field ${field} -> companies model (${targetId})`);
        } else {
          // Keep company fields on the current record if no separate company record
          targetModel = recordType;
          targetId = recordId;
          console.log(`🎯 [MODEL TARGETING] Company field ${field} -> ${recordType} model (no companyId)`);
        }
      } else {
        // Lead/prospect specific fields stay on the current record
        targetModel = recordType;
        targetId = recordId;
        console.log(`🎯 [MODEL TARGETING] Record-specific field ${field} -> ${recordType} model`);
      }
      
      // Map field names to match API expectations based on target model
      let fieldMapping: Record<string, string>;

      if (targetModel === 'companies') {
        // Company-specific field mapping
        fieldMapping = {
          'name': 'name',  // Keep name as name for companies
          'companyName': 'name',
          'title': 'jobTitle',  // Not used for companies but kept for consistency
          'workEmail': 'workEmail',
          'personalEmail': 'personalEmail',
          'mobilePhone': 'mobilePhone',
          'company': 'company',
          'bio': 'bio',
          'linkedinUrl': 'linkedinUrl',
          'linkedinNavigatorUrl': 'linkedinNavigatorUrl',
          'address': 'address',
          'postalCode': 'postalCode'
        };
      } else if (targetModel === 'actions') {
        // Action-specific field mapping
        fieldMapping = {
          'description': 'description',
          'title': 'title',
          'subject': 'subject',
          'type': 'type',
          'status': 'status',
          'notes': 'notes'
        };
      } else {
        // People/leads/prospects field mapping
        fieldMapping = {
          'name': 'fullName',  // Map name to fullName for people
          'fullName': 'fullName',
          'title': 'jobTitle',
          'jobTitle': 'jobTitle',
          'workEmail': 'workEmail',
          'personalEmail': 'personalEmail',
          'mobilePhone': 'mobilePhone',
          'company': 'company',
          'companyName': 'company',
          'bio': 'bio',
          'linkedinUrl': 'linkedinUrl',
          'linkedinNavigatorUrl': 'linkedinNavigatorUrl',
          'address': 'address',
          'postalCode': 'postalCode',
          'engagementPriority': 'priority'  // Map engagementPriority to priority for database consistency
        };
      }
      
      const apiField = fieldMapping[field] || field;
      
      console.log(`🔍 [INLINE EDIT AUDIT] Field mapping:`, {
        originalField: field,
        mappedField: apiField,
        fieldMapping,
        value,
        targetModel,
        targetId,
        recordType
      });

      // Special logging for linkedinNavigatorUrl field
      if (field === 'linkedinNavigatorUrl') {
        console.log(`🔍 [LINKEDIN NAVIGATOR AUDIT] Special handling for linkedinNavigatorUrl:`, {
          field,
          apiField,
          value,
          targetModel,
          targetId,
          recordType,
          fieldMapping,
          isPersonalField: personalFields.includes(field),
          isCompanyField: companyFields.includes(field)
        });
      }
      
      // Special debug for legalName
      if (field === 'legalName') {
        console.log(`🔍 [LEGAL NAME DEBUG] Field mapping for legalName:`, {
          field,
          apiField,
          value,
          targetModel,
          recordType
        });
      }
      
      // Validate that the mapped field is appropriate for the target model
      if (targetModel === 'companies' && !['name', 'legalName', 'tradingName', 'localName', 'description', 'website', 'email', 'phone', 'fax', 'address', 'city', 'state', 'country', 'postalCode', 'industry', 'sector', 'size', 'revenue', 'currency', 'employeeCount', 'foundedYear', 'registrationNumber', 'taxId', 'vatNumber', 'domain', 'logoUrl', 'status', 'priority', 'tags', 'customFields', 'notes', 'lastAction', 'lastActionDate', 'nextAction', 'nextActionDate', 'nextActionReasoning', 'nextActionPriority', 'nextActionType', 'actionStatus', 'globalRank', 'entityId', 'mainSellerId', 'actualCloseDate', 'expectedCloseDate', 'opportunityAmount', 'opportunityProbability', 'opportunityStage', 'acquisitionDate', 'competitors', 'businessChallenges', 'businessPriorities', 'competitiveAdvantages', 'growthOpportunities', 'strategicInitiatives', 'successMetrics', 'marketThreats', 'keyInfluencers', 'decisionTimeline', 'marketPosition', 'digitalMaturity', 'techStack', 'linkedinUrl', 'linkedinNavigatorUrl', 'linkedinFollowers', 'twitterUrl', 'twitterFollowers', 'facebookUrl', 'instagramUrl', 'youtubeUrl', 'githubUrl', 'hqLocation', 'hqFullAddress', 'hqCity', 'hqState', 'hqStreet', 'hqZipcode', 'hqRegion', 'hqCountryIso2', 'hqCountryIso3', 'lastFundingAmount', 'lastFundingDate', 'stockSymbol', 'isPublic', 'naicsCodes', 'sicCodes', 'activeJobPostings', 'numTechnologiesUsed', 'technologiesUsed', 'confidence', 'sources', 'lastVerified', 'parentCompanyName', 'parentCompanyDomain', 'targetIndustry'].includes(apiField)) {
        console.warn(`⚠️ [FIELD MAPPING] Field '${apiField}' may not be valid for companies model`);
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {
        [apiField]: value
      };
      
      console.log(`🔍 [INLINE EDIT AUDIT] Update data prepared:`, updateData);
      
      // Handle name field specially - split into firstName/lastName/fullName
      // BUT ONLY for people-related records, NOT for companies
      if ((field === 'name' || field === 'fullName') && targetModel !== 'companies') {
        // 🔧 NAME CLEANING FIX: Clean trailing dashes and spaces before sending to API
        // This provides defense-in-depth even if API cleaning fails
        let cleanedValue = typeof value === 'string' ? value.trim() : value;
        if (typeof cleanedValue === 'string') {
          // Remove trailing " -" or "- " patterns that might be left over
          cleanedValue = cleanedValue.replace(/\s*-\s*$/, '').trim();
          // Remove any trailing dashes or spaces
          cleanedValue = cleanedValue.replace(/[\s-]+$/, '').trim();
        }
        
        const { firstName, lastName } = parseFullName(cleanedValue);
        updateData['firstName'] = firstName || '';
        updateData['lastName'] = lastName || '';
        updateData['fullName'] = cleanedValue;
        console.log(`🔄 [UNIVERSAL] Name field update - original: ${value}, cleaned: ${cleanedValue}, firstName: ${updateData['firstName']}, lastName: ${updateData['lastName']}, fullName: ${updateData['fullName']}`);
      }
      
      // Map recordType to pluralized form for API
      const apiRecordType = targetModel === 'people' ? 'people' : 
                           targetModel === 'leads' ? 'leads' :
                           targetModel === 'prospects' ? 'prospects' :
                           targetModel === 'opportunities' ? 'opportunities' :
                           targetModel === 'companies' ? 'companies' :
                           targetModel === 'clients' ? 'clients' :
                           targetModel === 'partners' ? 'partners' :
                           `${targetModel}s`;
      
      console.log(`🔄 [UNIVERSAL] Updating ${apiRecordType} ${targetId} with field ${apiField}:`, updateData);
      console.log(`🔄 [UNIVERSAL] Original record:`, record);
      console.log(`🔄 [UNIVERSAL] Target model: ${targetModel}, Target ID: ${targetId}`);
      
      // Make API call to save the change using v1 APIs
      let response: Response;
      
      console.log(`🔍 [INLINE EDIT AUDIT] Making API request:`, {
        targetModel,
        targetId,
        apiRecordType,
        updateData,
        requestBody: JSON.stringify(updateData)
      });
      
      if (targetModel === 'people' || targetModel === 'leads' || targetModel === 'prospects' || targetModel === 'opportunities' || targetModel === 'speedrun') {
        // All people-related records use v1 people API
        console.log(`🔄 [UNIVERSAL] Using v1 people API for ${targetModel} ${targetId}`);
        response = await fetch(`/api/v1/people/${targetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
        });
      } else if (targetModel === 'companies') {
        // Use v1 companies API
        console.log(`🔄 [UNIVERSAL] Using v1 companies API for ${targetId}`);
        response = await fetch(`/api/v1/companies/${targetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
        });
      } else if (targetModel === 'actions') {
        // Use v1 actions API
        console.log(`🔄 [UNIVERSAL] Using v1 actions API for ${targetId}`);
        response = await fetch(`/api/v1/actions/${targetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
        });
      } else {
        // For other record types, try to use appropriate v1 API or throw error
        console.log('🔍 [DEBUG] Unsupported record type for v1 migration:', apiRecordType);
        throw new Error(`Record type '${apiRecordType}' is not yet supported in v1 APIs. Please use companies, people, or actions records.`);
      }
      
      if (!response.ok) {
        let errorMessage = `Failed to update ${field}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Handle empty body from 405 or other errors
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log(`✅ [UNIVERSAL] API Response for ${field}:`, JSON.stringify(result, null, 2));
      console.log(`✅ [UNIVERSAL] API Response status: ${response.status}, success: ${result.success}`);
      
      console.log(`🔍 [INLINE EDIT AUDIT] API Response analysis:`, {
        field,
        expectedValue: value,
        responseData: result.data,
        fieldInResponse: result.data?.[field],
        fieldInResponseMapped: result.data?.[apiField],
        allResponseFields: Object.keys(result.data || {})
      });

      // Special logging for linkedinNavigatorUrl API response
      if (field === 'linkedinNavigatorUrl') {
        console.log(`🔍 [LINKEDIN NAVIGATOR API RESPONSE] API response analysis for linkedinNavigatorUrl:`, {
          field,
          apiField,
          expectedValue: value,
          responseData: result.data,
          fieldInResponse: result.data?.[field],
          fieldInResponseMapped: result.data?.[apiField],
          linkedinNavigatorUrlInResponse: result.data?.linkedinNavigatorUrl,
          allResponseFields: Object.keys(result.data || {}),
          responseSuccess: result.success,
          responseError: result.error
        });
      }
      
      // Verify the update was successful
      if (!result.success) {
        throw new Error(`API returned success: false - ${result.error || 'Unknown error'}`);
      }
      
      // Additional verification: check if the data was actually updated
      if (result.data && result.data[field] !== value) {
        console.warn(`⚠️ [UNIVERSAL] Field ${field} value mismatch: expected ${value}, got ${result.data[field]}`);
      }
      
      // Check if the mapped field was updated
      if (result.data && result.data[apiField] !== value) {
        console.warn(`⚠️ [UNIVERSAL] Mapped field ${apiField} value mismatch: expected ${value}, got ${result.data[apiField]}`);
      }
      
      // 🚀 ENHANCED DATA CONSISTENCY CHECK: Verify the save was successful
      const actualSavedValue = result.data?.[apiField] ?? result.data?.[field];
      // Fix: Handle null values correctly - null === null should pass, and undefined should pass when value is null
      const isValueConsistent = actualSavedValue === value || 
                                (actualSavedValue === undefined && value === null) ||
                                (actualSavedValue === null && value === null);
      
      if (!isValueConsistent) {
        console.warn(`⚠️ [UNIVERSAL] Data consistency check FAILED for field ${field}:`, {
          expectedValue: value,
          actualSavedValue,
          apiField,
          resultData: result.data,
          fieldInResult: result.data?.[field],
          apiFieldInResult: result.data?.[apiField],
          note: 'This may indicate a server-side transformation or validation'
        });
        
        // For critical fields, show user warning
        const criticalFields = ['name', 'fullName', 'email', 'phone', 'legalName', 'company'];
        if (criticalFields.includes(field)) {
          console.error(`🚨 [UNIVERSAL] CRITICAL: Field ${field} save verification failed!`);
        }
      } else {
        console.log(`✅ [UNIVERSAL] Data consistency check PASSED for field ${field}: ${value}`);
      }
      
      // Update local record state optimistically with proper field mapping
      console.log(`🔍 [INLINE EDIT AUDIT] Updating local record state optimistically:`, {
        field,
        value,
        apiField,
        personalFields,
        companyFields,
        isPersonalField: personalFields.includes(field),
        isCompanyField: companyFields.includes(field),
        currentLocalRecord: localRecord,
        resultData: result.data
      });
      
      setLocalRecord((prev: any) => {
        // Use the actual value from API response if available, otherwise use the input value
        // CRITICAL FIX: When value is null (deleted), always use null, even if API response is undefined
        let actualValue: any;
        if (value === null) {
          // User deleted the field - always use null, regardless of API response
          actualValue = null;
          console.log(`🔄 [NULL VALUE HANDLING] Field ${field} was deleted (null), using null in local state`);
        } else if (result.data && result.data[apiField] !== undefined) {
          // API returned a value (including null) - use it
          actualValue = result.data[apiField];
        } else {
          // API didn't return the field - use the value we sent
          actualValue = value;
        }
        
        // IMPORTANT: For linkedinNavigatorUrl, preserve the saved value if API response is null/undefined
        // BUT: If user deleted it (value is null), always use null
        if (field === 'linkedinNavigatorUrl' && value !== null && (actualValue === null || actualValue === undefined)) {
          actualValue = value; // Use the value we just saved (but only if it wasn't deleted)
          console.log(`🔄 [LINKEDIN NAVIGATOR LOCAL STATE] Preserving saved value in local state:`, value);
        }
        
        // 🚀 CRITICAL: For status field, always preserve the saved value and update both status and stage
        if (field === 'status') {
          // Always use the value we just saved for status
          actualValue = value;
          console.log(`🔄 [STATUS LOCAL STATE] Preserving status value in local state:`, value);
        }
        
        // 🔧 NAME UPDATE FIX: For name/fullName fields, always preserve the saved value
        // This ensures that user edits (like removing " -" suffix) are not overwritten by API responses
        if (field === 'name' || field === 'fullName') {
          // Clean the value to remove trailing dashes/spaces (same as API does)
          const cleanedValue = typeof value === 'string' 
            ? value.trim().replace(/\s*-\s*$/, '').trim().replace(/[\s-]+$/, '').trim()
            : value;
          
          // Always use the cleaned value we just saved, not the API response
          // This prevents the API from overwriting our update with stale/merged data
          actualValue = cleanedValue;
          
          // Ensure updateData has the correct values
          if (updateData['fullName']) {
            updateData['fullName'] = cleanedValue;
          }
          
          console.log(`🔄 [NAME LOCAL STATE] Preserving name value in local state:`, {
            originalValue: value,
            cleanedValue: cleanedValue,
            apiResponseValue: result.data?.[apiField],
            usingValue: actualValue
          });
        }
        
        const updatedRecord = {
          ...prev,
          [field]: actualValue,
          // Also update the API field name if different
          ...(apiField !== field ? { [apiField]: actualValue } : {}),
          // 🚀 CRITICAL: For status field, also update stage field (they're often used interchangeably)
          ...(field === 'status' ? { stage: actualValue } : {}),
          // If updating person fields, update the person object as well
          ...(personalFields.includes(field) && prev.person ? {
            person: {
              ...prev.person,
              [field]: actualValue,
              ...(apiField !== field ? { [apiField]: actualValue } : {})
            }
          } : {}),
          // If updating company fields, update the company object as well
          ...(companyFields.includes(field) && prev.company ? {
            company: {
              ...prev.company,
              [field]: actualValue,
              ...(apiField !== field ? { [apiField]: actualValue } : {})
            }
          } : {}),
          // Update related fields if name was changed
          ...(field === 'name' || field === 'fullName' ? {
            firstName: updateData['firstName'] || prev.firstName || '',
            lastName: updateData['lastName'] || prev.lastName || '',
            fullName: updateData['fullName'] || actualValue
          } : {})
        };
        
        console.log(`🔍 [INLINE EDIT AUDIT] Local record state updated:`, {
          previousRecord: prev,
          updatedRecord,
          field,
          apiField,
          inputValue: value,
          actualValue,
          resultDataField: result.data?.[apiField]
        });
        
        return updatedRecord;
      });
      
      // Update local record state with the new value
      console.log(`🔍 [INLINE EDIT AUDIT] onRecordUpdate analysis:`, {
        hasOnRecordUpdate: !!onRecordUpdate,
        hasResultData: !!result.data,
        resultData: result.data,
        originalRecord: record
      });
      
      if (onRecordUpdate && result.data) {
        // Map API response fields back to frontend field names
        const mappedResponseData = { ...result.data };
        
        // If we mapped the field, ensure the response contains the frontend field name
        if (apiField !== field && result.data[apiField] !== undefined) {
          mappedResponseData[field] = result.data[apiField];
        }
        
        // CRITICAL FIX: When value is null (deleted), always use null, even if API response is undefined
        let actualValue: any;
        if (value === null) {
          // User deleted the field - always use null, regardless of API response
          actualValue = null;
          console.log(`🔄 [NULL VALUE HANDLING] Field ${field} was deleted (null), using null in onRecordUpdate`);
        } else if (result.data[apiField] !== undefined) {
          // API returned a value (including null) - use it
          actualValue = result.data[apiField];
        } else {
          // API didn't return the field - use the value we sent
          actualValue = value;
        }
        mappedResponseData[field] = actualValue;
        
        // IMPORTANT: Preserve fields that might not be in the API response
        // For linkedinNavigatorUrl and other nullable fields, ensure they're always included
        const preservedFields: Record<string, any> = {};
        
        // CRITICAL FIX: When user deletes a field (value is null), always preserve null
        // This ensures deleted fields are properly cleared in the merged record
        if (value === null) {
          preservedFields[field] = null;
          if (apiField !== field) {
            preservedFields[apiField] = null;
          }
          console.log(`🔄 [FIELD DELETION PRESERVE] Field ${field} was deleted - preserving null:`, {
            field,
            apiField,
            preservedValue: null
          });
        }
        
        if (field === 'linkedinNavigatorUrl') {
          // CRITICAL FIX: If user deleted it (value is null), always use null
          // Otherwise, preserve the saved value if API response is missing/null
          const navigatorValue = value === null 
            ? null  // User deleted it - always use null
            : (result.data[apiField] !== undefined && result.data[apiField] !== null 
                ? result.data[apiField] 
                : value); // Use the value we just saved if API response is missing/null
          preservedFields[field] = navigatorValue;
          preservedFields[apiField] = navigatorValue;
          console.log(`🔄 [LINKEDIN NAVIGATOR PRESERVE] Ensuring linkedinNavigatorUrl is preserved:`, {
            savedValue: value,
            apiResponseValue: result.data[apiField],
            preservedValue: navigatorValue
          });
        }
        
        // 🚀 CRITICAL: For status field, always preserve the saved value
        if (field === 'status') {
          // Always use the value we just saved for status
          const statusValue = value;
          preservedFields[field] = statusValue;
          preservedFields['stage'] = statusValue; // Also update stage field
          preservedFields[apiField] = statusValue;
          console.log(`🔄 [STATUS PRESERVE] Ensuring status is preserved:`, {
            savedValue: value,
            apiResponseValue: result.data[apiField],
            preservedValue: statusValue
          });
        }
        
        // 🔧 NAME UPDATE FIX: For name/fullName fields, always preserve the saved value
        // This ensures that user edits (like removing " -" suffix) are not overwritten
        if (field === 'name' || field === 'fullName') {
          // Clean the value to remove trailing dashes/spaces (same as API does)
          const cleanedValue = typeof value === 'string' 
            ? value.trim().replace(/\s*-\s*$/, '').trim().replace(/[\s-]+$/, '').trim()
            : value;
          
          // Always use the cleaned value we just saved, not the API response
          preservedFields[field] = cleanedValue;
          preservedFields[apiField] = cleanedValue;
          
          // Also preserve firstName and lastName if they were updated
          if (updateData['firstName'] !== undefined) {
            preservedFields['firstName'] = updateData['firstName'];
          }
          if (updateData['lastName'] !== undefined) {
            preservedFields['lastName'] = updateData['lastName'];
          }
          if (updateData['fullName'] !== undefined) {
            preservedFields['fullName'] = cleanedValue;
          }
          
          console.log(`🔄 [NAME PRESERVE] Ensuring name is preserved:`, {
            savedValue: value,
            cleanedValue: cleanedValue,
            apiResponseValue: result.data?.[apiField],
            preservedValue: cleanedValue,
            updateData: {
              firstName: updateData['firstName'],
              lastName: updateData['lastName'],
              fullName: updateData['fullName']
            }
          });
        }
        
        // CRITICAL: Ensure all existing record fields are preserved
        // The API response might only include the updated field, so we need to preserve all other fields
        // Start with all existing record fields, then apply API response updates, then preserved fields
        // CRITICAL FIX: When user explicitly deleted a field (value is null), we MUST update it to null
        // IMPORTANT: Don't overwrite existing non-null values with null from API response UNLESS we explicitly set it to null
        const fullyMergedRecord = {
          ...record, // Start with ALL existing fields (preserves everything)
          ...Object.keys(mappedResponseData).reduce((acc, key) => {
            const apiValue = mappedResponseData[key];
            const currentValue = record[key];
            
            // CRITICAL FIX: If this is the field we just updated and value is null (deleted), always use null
            if (key === field && value === null) {
              acc[key] = null;
              console.log(`🔄 [MERGE] Field ${key} was deleted - setting to null:`, { current: currentValue, api: apiValue });
            }
            // Only update if API has a non-null value AND it's different from current value
            // This prevents overwriting existing values with null from unrelated API responses
            else if (apiValue !== null && apiValue !== undefined && apiValue !== currentValue) {
              acc[key] = apiValue;
              console.log(`🔄 [MERGE] Updating ${key} from API response:`, { current: currentValue, api: apiValue });
            } else if (apiValue === null || apiValue === undefined) {
              // API value is null/undefined - preserve current value (don't include in acc)
              // UNLESS this is the field we just updated and we set it to null
              if (key === field && value === null) {
                // Already handled above
              } else if (currentValue !== null && currentValue !== undefined) {
                console.log(`🔄 [MERGE] Preserving ${key} from record (API returned null/undefined):`, currentValue);
              }
            } else {
              // API value is same as current value - no change needed
              console.log(`🔄 [MERGE] Skipping ${key} (API value same as current):`, apiValue);
            }
            return acc;
          }, {} as Record<string, any>), // Apply API response updates (only non-null values that differ)
          ...preservedFields // Apply preserved fields (like linkedinNavigatorUrl)
        };
        
        // Log comprehensive field preservation audit
        const fieldsPreserved = Object.keys(record).filter(key => fullyMergedRecord[key] === record[key]);
        const fieldsUpdated = Object.keys(mappedResponseData).filter(key => 
          mappedResponseData[key] !== null && 
          mappedResponseData[key] !== undefined && 
          fullyMergedRecord[key] !== record[key]
        );
        const fieldsMissing = Object.keys(record).filter(key => 
          record[key] !== null && 
          record[key] !== undefined && 
          !mappedResponseData.hasOwnProperty(key) &&
          !preservedFields.hasOwnProperty(key)
        );
        
        console.log(`🔍 [FIELD PRESERVATION AUDIT] Comprehensive merge analysis:`, {
          totalFieldsInRecord: Object.keys(record).length,
          totalFieldsInMerged: Object.keys(fullyMergedRecord).length,
          fieldsPreserved: fieldsPreserved.length,
          fieldsUpdated: fieldsUpdated.length,
          fieldsMissing: fieldsMissing.length,
          fieldsPreservedList: fieldsPreserved.slice(0, 10), // Limit to first 10 for readability
          fieldsUpdatedList: fieldsUpdated,
          fieldsMissingList: fieldsMissing.slice(0, 10), // Limit to first 10 for readability
          originalField: field,
          apiField: apiField
        });

        // Special logging for linkedinNavigatorUrl onRecordUpdate
        if (field === 'linkedinNavigatorUrl') {
          console.log(`🔍 [LINKEDIN NAVIGATOR ONRECORDUPDATE] onRecordUpdate for linkedinNavigatorUrl:`, {
            field,
            apiField,
            originalValue: value,
            actualValue,
            resultData: result.data,
            mappedResponseData,
            updatedRecordLinkedinNavigatorUrl: fullyMergedRecord.linkedinNavigatorUrl,
            originalRecordLinkedinNavigatorUrl: record.linkedinNavigatorUrl,
            allFieldsPreserved: Object.keys(record).filter(k => fullyMergedRecord[k] !== undefined)
          });
        }

        onRecordUpdate(fullyMergedRecord);
        console.log(`🔄 [UNIVERSAL] Updated parent record state:`, fullyMergedRecord);
      } else if (onRecordUpdate) {
        // Fallback: update local state with the new field value
        const updatedRecord = {
          ...record,
          [field]: value,
          // Also update the API field name if different
          ...(apiField !== field ? { [apiField]: value } : {}),
          // Update related fields if name was changed
          ...(field === 'name' || field === 'fullName' ? {
            firstName: updateData['firstName'],
            lastName: updateData['lastName'],
            fullName: updateData['fullName']
          } : {})
        };
        console.log(`🔍 [INLINE EDIT AUDIT] Calling onRecordUpdate with fallback:`, updatedRecord);
        onRecordUpdate(updatedRecord);
        console.log(`🔄 [UNIVERSAL] Updated parent record state (fallback):`, updatedRecord);
      } else {
        console.log(`🔍 [INLINE EDIT AUDIT] No onRecordUpdate callback available`);
      }
      
      // Also dispatch a custom event to notify other components of the update
      // CRITICAL FIX: When value is null (deleted), always include it in eventRecord
      const eventRecord = onRecordUpdate && result.data ? { 
        ...record, 
        ...result.data,
        // CRITICAL FIX: If field was deleted (value is null), ensure it's set to null
        ...(value === null ? { [field]: null, ...(apiField !== field ? { [apiField]: null } : {}) } : {})
      } : {
        ...record,
        [field]: value,
        // Also update API field name if different
        ...(apiField !== field ? { [apiField]: value } : {})
      };
      
      window.dispatchEvent(new CustomEvent('record-updated', {
        detail: {
          recordType,
          recordId,
          updatedRecord: eventRecord,
          field,
          value
        }
      }));
      
      // 🚀 SPECIAL HANDLING: Status field updates need to trigger count refreshes
      if (field === 'status') {
        const newStatus = value as string;
        const oldStatus = record.status || record.stage || 'LEAD';
        
        // Determine which sections are affected
        const getSectionForStatus = (status: string): string | null => {
          const statusUpper = status?.toUpperCase() || '';
          if (statusUpper === 'LEAD') return 'leads';
          if (statusUpper === 'PROSPECT') return 'prospects';
          if (statusUpper === 'OPPORTUNITY') return 'opportunities';
          if (statusUpper === 'CLIENT' || statusUpper === 'CUSTOMER') return 'clients';
          return null;
        };
        
        const newSection = getSectionForStatus(newStatus);
        const oldSection = getSectionForStatus(oldStatus);
        
        console.log(`🔄 [STATUS UPDATE] Status changed from ${oldStatus} to ${newStatus}`, {
          oldSection,
          newSection,
          recordId
        });
        
        // Trigger pipeline data refresh for both old and new sections
        if (newSection) {
          window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
            detail: { 
              section: newSection,
              type: 'status-change',
              fromSection: oldSection || 'unknown',
              recordId: record.id 
            }
          }));
        }
        
        if (oldSection && oldSection !== newSection) {
          window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
            detail: { 
              section: oldSection,
              type: 'status-change',
              toSection: newSection || 'unknown',
              recordId: record.id 
            }
          }));
        }
        
        // Trigger count refresh for left panel - refresh both old and new sections
        if (oldSection) {
          window.dispatchEvent(new CustomEvent('refresh-counts', {
            detail: { 
              reason: 'status-change',
              section: oldSection,
              recordId: record.id,
              oldStatus,
              newStatus
            }
          }));
        }
        
        if (newSection && newSection !== oldSection) {
          window.dispatchEvent(new CustomEvent('refresh-counts', {
            detail: { 
              reason: 'status-change',
              section: newSection,
              recordId: record.id,
              oldStatus,
              newStatus
            }
          }));
        }
        
        // Also trigger a general refresh-counts event for any listeners that don't specify a section
        window.dispatchEvent(new CustomEvent('refresh-counts', {
          detail: { 
            reason: 'status-change',
            recordId: record.id,
            oldStatus,
            newStatus
          }
        }));
        
        // Show success message with status change info
        const statusLabel = newStatus === 'LEAD' ? 'Lead' : 
                           newStatus === 'PROSPECT' ? 'Prospect' :
                           newStatus === 'OPPORTUNITY' ? 'Opportunity' :
                           newStatus === 'CLIENT' || newStatus === 'CUSTOMER' ? 'Client' :
                           newStatus;
        showMessage(`Successfully updated status to ${statusLabel}!`);
      } else {
        showMessage(`Updated ${field} successfully`);
      }
      
      // Dispatch actionUpdated event for action record types
      if (targetModel === 'actions') {
        // Clear actions cache
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        console.log('🗑️ [UNIVERSAL] Cleared actions cache for record:', record.id);
        
        document.dispatchEvent(new CustomEvent('actionUpdated', {
          detail: {
            recordId: record.id,
            recordType: recordType,
            actionId: targetId,
            field: field,
            value: value,
            timestamp: new Date().toISOString()
          }
        }));
        console.log('🔄 [UNIVERSAL] Dispatched actionUpdated event for action:', targetId);
      }
      
      // Track this field as recently updated to prevent stale prop overwrites
      setRecentlyUpdatedFields(prev => new Set(prev).add(field));
      
      // Remove from recently updated fields after 3 seconds
      setTimeout(() => {
        setRecentlyUpdatedFields(prev => {
          const next = new Set(prev);
          next.delete(field);
          return next;
        });
      }, 3000);
      
      // 🚀 CACHE VERSIONING: Increment version counter for this record
      // This allows us to detect stale cache even within the 30-second window
      if (typeof window !== 'undefined') {
        const versionKey = `edit-version-${recordType}-${record.id}`;
        const currentVersion = parseInt(sessionStorage.getItem(versionKey) || '0', 10);
        const newVersion = currentVersion + 1;
        sessionStorage.setItem(versionKey, newVersion.toString());
        console.log(`🔄 [CACHE VERSION] Incremented version for ${recordType} ${record.id}: ${currentVersion} → ${newVersion}`);
      }
      
      // 🚀 CACHE INVALIDATION & REVALIDATION: Prepare updated record data
      // CRITICAL FIX: When value is null (deleted), always include it in updatedRecord
      const updatedRecord = onRecordUpdate && result.data ? { 
        ...record, 
        ...result.data,
        // CRITICAL FIX: If field was deleted (value is null), ensure it's set to null
        ...(value === null ? { [field]: null, ...(apiField !== field ? { [apiField]: null } : {}) } : {})
      } : { 
        ...record, 
        [field]: value,
        // Also update API field name if different
        ...(apiField !== field ? { [apiField]: value } : {})
      };
      
      // Debug: Log the updated record
      console.log(`🔍 [CACHE UPDATE] Updated record prepared:`, {
        field,
        originalValue: record?.[field],
        newValue: value,
        updatedRecordLinkedinUrl: updatedRecord?.linkedinUrl,
        hasResultData: !!result.data,
        resultDataLinkedinUrl: result.data?.linkedinUrl,
        fullUpdatedRecord: updatedRecord
      });
      
      // CRITICAL FIX: Don't update sessionStorage cache here - we'll clear it anyway
      // Updating the cache then immediately clearing it creates a race condition
      // Instead, we'll let the next page load fetch fresh data from the API
      console.log('🚫 [CACHE] Skipping sessionStorage cache update - will use version-based staleness detection instead');
      
      // 🚀 SERVER REVALIDATION: Removed router.refresh() to prevent premature component unmounting
      // The optimistic update and onRecordUpdate callback already ensure UI consistency
      // Cache invalidation below ensures fresh data on next navigation
      console.log(`🔄 [UNIVERSAL] Skipping router.refresh() to preserve success message state`);
      
      // 🗑️ COMPREHENSIVE CACHE INVALIDATION: Clear all caches to ensure fresh data on next load
      if (typeof window !== 'undefined') {
        const workspaceId = record?.workspaceId || '';
        
        // Clear all relevant localStorage caches
        localStorage.removeItem(`adrata-people-${workspaceId}`);
        localStorage.removeItem(`adrata-prospects-${workspaceId}`);
        localStorage.removeItem(`adrata-leads-${workspaceId}`);
        localStorage.removeItem(`adrata-opportunities-${workspaceId}`);
        localStorage.removeItem(`adrata-companies-${workspaceId}`);
        localStorage.removeItem(`adrata-speedrun-${workspaceId}`);
        localStorage.removeItem(`adrata-fast-counts-${workspaceId}`);
        
        // Clear unified cache system
        const cacheKeys = Object.keys(localStorage);
        cacheKeys.forEach(key => {
          if (key.startsWith('adrata-cache-revenue-os:') && key.includes(workspaceId)) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear SWR cache if available
        if ((window as any).__SWR_CACHE__) {
          const swrCache = (window as any).__SWR_CACHE__;
          const swrKeys = Array.from(swrCache.keys()) as string[];
          swrKeys.forEach((key: string) => {
            if (key.includes('revenue-os') && key.includes(workspaceId)) {
              swrCache.delete(key);
            }
          });
        }
        
        // 🚀 CRITICAL FIX: Set force-refresh flags for useFastSectionData to detect
        // This ensures fresh data is fetched instead of stale cache on next page load
        
        // Set record-specific force-refresh flag using the actual section name from URL
        sessionStorage.setItem(`force-refresh-${recordType}-${record.id}`, 'true');
        console.log(`🔄 [CACHE DEBUG] Set record-specific force-refresh flag: force-refresh-${recordType}-${record.id}`);
        
        // Also set a general section-level force-refresh flag for list views
        // This is needed because useFastSectionData checks for keys that include the section name
        if (targetModel === 'companies') {
          // For companies, ensure we use the correct section name from the URL
          sessionStorage.setItem(`force-refresh-companies`, 'true');
          console.log('🔄 [CACHE] Set force-refresh flags for companies:', {
            recordSpecific: `force-refresh-${recordType}-${record.id}`,
            sectionLevel: 'force-refresh-companies',
            recordType,
            targetModel
          });
          console.log(`🔄 [CACHE DEBUG] Set section-level force-refresh flag: force-refresh-companies`);
        } else if (targetModel === 'people' || targetModel === 'leads' || targetModel === 'prospects' || targetModel === 'opportunities') {
          // For people records, set both people and specific section flags
          sessionStorage.setItem(`force-refresh-people`, 'true');
          sessionStorage.setItem(`force-refresh-${targetModel}`, 'true');
          console.log('🔄 [CACHE] Set force-refresh flags for people/section:', {
            recordSpecific: `force-refresh-${recordType}-${record.id}`,
            sectionLevel: `force-refresh-${targetModel}`,
            recordType,
            targetModel
          });
        }
        
        // 🚀 CRITICAL FIX: Clear sessionStorage instant-load cache to prevent stale data
        // This cache is checked BEFORE useFastSectionData runs, so it must be cleared
        sessionStorage.removeItem(`cached-${targetModel}-${targetId}`);
        sessionStorage.removeItem(`cached-${recordType}-${record.id}`);
        sessionStorage.removeItem(`current-record-${targetModel}`);
        sessionStorage.removeItem(`current-record-${recordType}`);
        
        // 🚀 ADDITIONAL FIX: Clear section-based caches used by PipelineDetailPage
        // PipelineDetailPage uses section-based cache keys, so we need to clear those too
        sessionStorage.removeItem(`cached-companies-${record.id}`);
        sessionStorage.removeItem(`current-record-companies`);
        sessionStorage.removeItem(`cached-people-${record.id}`);
        sessionStorage.removeItem(`current-record-people`);
        
        console.log('🗑️ [CACHE] Cleared sessionStorage instant-load caches:', {
          keys: [
            `cached-${targetModel}-${targetId}`,
            `cached-${recordType}-${record.id}`,
            `current-record-${targetModel}`,
            `current-record-${recordType}`
          ]
        });
        
        console.log('🗑️ [CACHE] Invalidated all caches after inline field update:', {
          workspaceId,
          recordType,
          recordId: record.id,
          field,
          targetModel,
          clearedCaches: [
            `adrata-people-${workspaceId}`,
            `adrata-prospects-${workspaceId}`,
            `adrata-leads-${workspaceId}`,
            `adrata-opportunities-${workspaceId}`,
            `adrata-companies-${workspaceId}`,
            `adrata-speedrun-${workspaceId}`,
            `adrata-fast-counts-${workspaceId}`,
            'revenue-os:*'
          ],
          forceRefreshFlags: [
            `force-refresh-${recordType}-${record.id}`,
            targetModel === 'companies' ? 'force-refresh-companies' : `force-refresh-${targetModel}`
          ]
        });
        
        // 🚀 CRITICAL FIX: Use Next.js router.refresh() to invalidate client-side router cache
        // This ensures fresh data is loaded when navigating back to the record
        try {
          router.refresh();
          console.log('🔄 [ROUTER] Called router.refresh() to invalidate Next.js client-side cache');
        } catch (error) {
          console.warn('⚠️ [ROUTER] Failed to call router.refresh():', error);
        }
      }
      
      // Dispatch cache invalidation event for other components
      window.dispatchEvent(new CustomEvent('cache-invalidated', {
        detail: {
          recordType,
          recordId: record.id,
        }
      }));
      
      // 🚀 CACHE INVALIDATION: Trigger data refresh if status field was updated
      if (field === 'status') {
        // Normalize status value to uppercase for consistent comparison
        const normalizedStatus = typeof value === 'string' ? value.toUpperCase().trim() : value;
        
        // Determine target section based on status value (case-insensitive)
        const getSectionFromStatus = (status: string | null): string => {
          if (!status) return 'people'; // default
          const statusUpper = status.toUpperCase().trim();
          if (statusUpper === 'LEAD') return 'leads';
          if (statusUpper === 'PROSPECT') return 'prospects';
          if (statusUpper === 'OPPORTUNITY') return 'opportunities';
          if (statusUpper === 'CLIENT' || statusUpper === 'CUSTOMER' || statusUpper === 'SUPERFAN') return 'clients';
          return 'people'; // default fallback
        };
        
        const targetSection = getSectionFromStatus(normalizedStatus);
        
        // Determine current section from recordType
        const currentSection = recordType === 'leads' ? 'leads' : 
                              recordType === 'prospects' ? 'prospects' :
                              recordType === 'opportunities' ? 'opportunities' :
                              recordType === 'clients' ? 'clients' : 'people';
        
        console.log(`🔄 [STATUS CHANGE] Status update detected:`, {
          field,
          value,
          normalizedStatus,
          currentSection,
          targetSection,
          recordId,
          recordType,
          willNavigate: targetSection !== currentSection
        });
        
        // Trigger refresh events for both old and new sections
        window.dispatchEvent(new CustomEvent('refresh-counts', {
          detail: { 
            section: targetSection,
            type: 'status-update',
            field, 
            value: normalizedStatus, 
            recordId,
            oldSection: currentSection,
            newSection: targetSection
          }
        }));
        
        // Also refresh the old section counts
        if (currentSection !== targetSection) {
          window.dispatchEvent(new CustomEvent('refresh-counts', {
            detail: { 
              section: currentSection,
              type: 'status-update',
              field, 
              value: normalizedStatus, 
              recordId,
              oldSection: currentSection,
              newSection: targetSection
            }
          }));
        }
        
        // CRITICAL FIX: Navigate to the correct section when status changes
        // This ensures LEAD → PROSPECT → OPPORTUNITY conversions work properly
        // Only navigate if we're actually changing sections (not just updating status within same section)
        if (targetSection !== currentSection && typeof window !== 'undefined') {
          console.log(`🔄 [STATUS CHANGE] Status changed to ${normalizedStatus}, navigating from ${currentSection} to ${targetSection}`);
          
          // Generate proper slug for navigation using person's ID and name (not company)
          const { generateSlug } = require('@/platform/utils/url-utils');
          const recordName = record?.fullName || record?.name || record?.firstName || 'record';
          const recordSlug = generateSlug(recordName, recordId);
          
          // Get workspace slug from current URL
          const currentPath = window.location.pathname;
          const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
          
          if (workspaceMatch) {
            const workspaceSlug = workspaceMatch[1];
            const newUrl = `/${workspaceSlug}/${targetSection}/${recordSlug}`;
            
            console.log(`🔗 [STATUS CHANGE] Navigating to: ${newUrl}`, {
              workspaceSlug,
              targetSection,
              recordSlug,
              recordName,
              recordId,
              oldUrl: currentPath
            });
            
            // Navigate to the new section with proper record (not company)
            // Use window.location.href for reliable navigation
            // Small delay to ensure save completes and API response is processed
            setTimeout(() => {
              window.location.href = newUrl;
            }, 500);
          } else {
            // Fallback for non-workspace URLs
            const newUrl = `/${targetSection}/${recordSlug}`;
            console.log(`🔗 [STATUS CHANGE] Navigating to (no workspace): ${newUrl}`);
            setTimeout(() => {
              window.location.href = newUrl;
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error saving field:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      alert(`Failed to save ${field}: ${errorMessage}`);
      throw error; // Re-throw to let InlineEditField handle the error state
    } finally {
      // Remove this field from pending saves
      setPendingSaves(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  // Handle person added to company
  const handlePersonAdded = async (newPerson: any) => {
    console.log('Person added to company:', newPerson);
    setIsAddPersonModalOpen(false);
    
    // Dispatch refresh events for immediate table update
    window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
      detail: { 
        section: 'leads',
        type: 'record-created',
        recordId: newPerson.id 
      }
    }));
    
    window.dispatchEvent(new CustomEvent('refresh-counts', {
      detail: { 
        section: 'leads',
        type: 'record-created'
      }
    }));
    
    // Trigger router refresh for server-side data
    router.refresh();
    
    // Optionally refresh the record data
    if (onRecordUpdate) {
      await onRecordUpdate(record.id);
    }
    
    // Switch to the people tab if we're on a company record
    if (recordType === 'companies') {
      const validTabs = (customTabs || getTabsForRecordType(recordType, record));
      const peopleTab = validTabs.find(tab => tab.id === 'people');
      if (peopleTab) {
        setActiveTab('people');
        // Update URL to reflect the tab change
        updateURLTab('people');
      }
    }
    
    // Show success message
    showMessage(`Person ${newPerson.fullName || newPerson.firstName + ' ' + newPerson.lastName} added successfully!`, 'success');
  };

  // Handle company added and associate with person/lead/prospect
  const handleCompanyAdded = async (newCompany: any) => {
    console.log('Company added, associating with person:', newCompany);
    setIsAddCompanyModalOpen(false);
    
    try {
      // Use the same approach as handleUpdateSubmit - just use company name, let the API handle the linking
      const updateData = {
        company: newCompany.name
      };
      
      console.log('🔄 [UNIVERSAL] Updating record with company:', {
        recordId: record.id,
        recordType: recordType,
        updateData,
        newCompany
      });
      
      const responseData = await authFetch(`/api/v1/people/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      // Additional debugging for the API call
      console.log('🔍 [UNIVERSAL] API call details:', {
        url: `/api/v1/people/${record.id}`,
        method: 'PATCH',
        updateData,
        responseData,
        responseType: typeof responseData,
        hasSuccess: 'success' in responseData,
        hasData: 'data' in responseData
      });
      
      console.log('✅ [UNIVERSAL] Company association response:', responseData);
      
      // Check if the response is valid
      if (!responseData) {
        console.error('❌ [UNIVERSAL] No response data received');
        throw new Error('No response data received from server');
      }
      
      if (!responseData.success) {
        console.error('❌ [UNIVERSAL] API returned error:', {
          success: responseData.success,
          error: responseData.error,
          details: responseData.details,
          data: responseData.data
        });
        throw new Error(responseData.error || 'Invalid response from server');
      }
      
      // Update local record state with API response data (same pattern as handleUpdateSubmit)
      const updatedRecord = {
        ...localRecord,
        ...updateData,
        ...responseData.data // Include any additional data from API response
      };
      
      console.log('🔄 [UNIVERSAL] Updated local record state:', {
        originalRecord: localRecord,
        updateData: updateData,
        apiResponse: responseData.data,
        finalRecord: updatedRecord
      });
      
      // Update local state immediately for UI refresh
      setLocalRecord(updatedRecord);
      
      // Call onRecordUpdate with the updated record (same as handleUpdateSubmit)
      if (onRecordUpdate) {
        console.log('🔄 [UNIVERSAL] Triggering record update after company association');
        onRecordUpdate(updatedRecord);
      }
      
      // Invalidate all caches for this record to ensure fresh data on refresh (same as handleUpdateSubmit)
      if (typeof window !== 'undefined') {
        // Clear sessionStorage caches
        sessionStorage.removeItem(`cached-${recordType}-${localRecord.id}`);
        sessionStorage.removeItem(`current-record-${recordType}`);
        
        // Clear all relevant localStorage caches to force refresh
        const workspaceId = record?.workspaceId || '';
        
        // Clear all data caches that might contain this record
        localStorage.removeItem(`adrata-people-${workspaceId}`);        // people, leads, prospects, opportunities, speedrun
        localStorage.removeItem(`adrata-prospects-${workspaceId}`);     // prospects
        localStorage.removeItem(`adrata-leads-${workspaceId}`);         // leads  
        localStorage.removeItem(`adrata-opportunities-${workspaceId}`); // opportunities
        localStorage.removeItem(`adrata-companies-${workspaceId}`);     // companies
        localStorage.removeItem(`adrata-speedrun-${workspaceId}`);      // speedrun
        localStorage.removeItem(`adrata-fast-counts-${workspaceId}`);   // all record types affect counts
        
        // Clear acquisition OS cache (used by PipelineDetailPage)
        const cacheKeys = Object.keys(localStorage);
        cacheKeys.forEach(key => {
          if (key.startsWith('adrata-cache-revenue-os:') && key.includes(workspaceId)) {
            localStorage.removeItem(key);
            console.log(`🗑️ [CACHE] Cleared unified cache: ${key}`);
          }
        });
        
        // Also clear SWR cache if available (used by useAdrataData)
        if ((window as any).__SWR_CACHE__) {
          const swrCache = (window as any).__SWR_CACHE__;
          const swrKeys = Array.from(swrCache.keys()) as string[];
          swrKeys.forEach((key: string) => {
            if (key.includes('revenue-os') && key.includes(workspaceId)) {
              swrCache.delete(key);
              console.log(`🗑️ [CACHE] Cleared SWR cache: ${key}`);
            }
          });
        }
        
        console.log('🗑️ [CACHE] Invalidated all caches after company association:', {
          workspaceId,
          recordType,
          recordId: localRecord.id,
          clearedCaches: [
            `adrata-people-${workspaceId}`,
            `adrata-prospects-${workspaceId}`,
            `adrata-leads-${workspaceId}`,
            `adrata-opportunities-${workspaceId}`,
            `adrata-companies-${workspaceId}`,
            `adrata-speedrun-${workspaceId}`,
            `adrata-fast-counts-${workspaceId}`,
            'revenue-os:*'
          ]
        });
        
        // Force next page load to bypass cache and fetch fresh from API
        sessionStorage.setItem(`force-refresh-${recordType}-${localRecord.id}`, 'true');
        console.log(`🔄 [FORCE REFRESH] Set force refresh flag for ${recordType} record ${localRecord.id}`);
      }
      
      // Dispatch custom events to notify other components of the update (same as handleUpdateSubmit)
      window.dispatchEvent(new CustomEvent('record-updated', {
        detail: {
          recordType,
          recordId: localRecord.id,
          updatedRecord,
          updateData: updateData
        }
      }));
      
      // Dispatch cache invalidation event for other components
      window.dispatchEvent(new CustomEvent('cache-invalidated', {
        detail: {
          recordType,
          recordId: localRecord.id,
        }
      }));
      
      // Dispatch refresh events for immediate table update
      window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
        detail: { 
          section: 'companies',
          type: 'record-created',
          recordId: newCompany.id 
        }
      }));
      
      window.dispatchEvent(new CustomEvent('refresh-counts', {
        detail: { 
          section: 'companies',
          type: 'record-created'
        }
      }));
      
      // Trigger router refresh for server-side data
      router.refresh();
      
      // Show success message
      showMessage(`Company ${newCompany.name} added and associated successfully!`, 'success');
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error associating company:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        recordId: record.id,
        recordType: recordType,
        newCompany: newCompany,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to associate company: ${errorMessage}`, 'error');
      
      // Re-throw to ensure we know something went wrong
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    const recordName = getDisplayName();
    if (normalizeString(deleteConfirmName) !== normalizeString(recordName)) {
      alert('Name does not match. Please enter the exact record name to confirm deletion.');
      return;
    }

    try {
      setLoading(true);
      console.log(`🗑️ [UniversalRecordTemplate] Soft deleting ${recordType} record: ${record.id}`);
      
      // Perform soft delete via new v1 deletion API
      const response = await fetch('/api/v1/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'soft_delete',
          entityType: recordType === 'companies' ? 'companies' : 
                     recordType === 'people' ? 'people' : 
                     'people',
          entityId: record.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ [UniversalRecordTemplate] Deletion failed:`, responseData);
        throw new Error(responseData.error || 'Failed to delete record');
      }

      console.log(`✅ [UniversalRecordTemplate] Deletion successful:`, responseData);
      
      // Close the delete confirmation modal
      setShowDeleteConfirm(false);
      setDeleteConfirmName('');
      
      // Dispatch cache invalidation event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cache-invalidate', {
          detail: { 
            pattern: `${recordType}-*`, 
            reason: 'record_deleted',
            recordId: record.id
          }
        }));
        
        // Also dispatch a refresh event for the sidebar counts
        window.dispatchEvent(new CustomEvent('refresh-sidebar-counts', {
          detail: { 
            section: recordType,
            action: 'delete'
          }
        }));
      }
      
      // Show success message
      showMessage('Record moved to trash successfully!', 'success');
      
      // Navigate back to the list page after a brief delay
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');
        const workspaceIndex = pathParts.findIndex(part => part.length > 0);
        const workspace = pathParts[workspaceIndex];
        
        // Construct the list page URL
        const listPageUrl = `/${workspace}/${recordType}`;
        console.log(`🔄 [UniversalRecordTemplate] Redirecting to list page: ${listPageUrl}`);
        router.push(listPageUrl);
      }, 500);
      
    } catch (error) {
      console.error('❌ [UniversalRecordTemplate] Error deleting record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete record. Please try again.';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle advance to prospect
  const handleAdvanceToProspect = async () => {
    try {
      setLoading(true);
      console.log('⬆️ [UNIVERSAL] Advancing to prospect:', record.id);
      
      // Make API call to advance lead to prospect (update status in people table)
      const response = await fetch(`/api/v1/people/${record.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          status: 'PROSPECT' // Update status from LEAD to PROSPECT
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ [UNIVERSAL] Advance to prospect failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url
        });
        throw new Error(`Failed to advance to prospect: ${response.status} ${response.statusText || errorText}`);
      }

      const result = await response.json();
      console.log('✅ [UNIVERSAL] Successfully advanced to prospect:', result);
      
      showMessage('Successfully advanced to prospect!');
      
      // 🚀 CACHE INVALIDATION: Trigger data refresh for left panel
      window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
        detail: { 
          section: 'prospects',
          type: 'status-change',
          fromSection: 'leads',
          recordId: record.id 
        }
      }));
      
      // Wait briefly for refresh to process before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update URL to prospects page with proper slug format
      const prospectId = result.data?.id || record.id;
      const prospectName = result.data?.fullName || record.fullName || record.name || 'Unknown';
      
      // Use generateSlug utility for consistent slug generation
      const { generateSlug } = require('@/platform/utils/url-utils');
      const prospectSlug = generateSlug(prospectName, prospectId);
      
      // Get current path and replace the section properly
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/prospects/${prospectSlug}`;
        console.log(`🔗 [ADVANCE] Navigating to prospect: ${newUrl}`, {
          workspaceSlug,
          prospectSlug,
          prospectName,
          prospectId
        });
        router.push(newUrl);
      } else {
        const newUrl = `/prospects/${prospectSlug}`;
        console.log(`🔗 [ADVANCE] Navigating to prospect: ${newUrl}`);
        router.push(newUrl);
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error advancing to prospect:', error);
      showMessage('Failed to advance to prospect. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle advance to opportunity
  const handleAdvanceToOpportunity = async () => {
    try {
      setLoading(true);
      console.log('⬆️ [UNIVERSAL] Advancing to opportunity:', record.id);
      
      // Make API call to advance prospect to opportunity (update status in people table)
      const response = await fetch(`/api/v1/people/${record.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          status: 'OPPORTUNITY' // Update status from PROSPECT to OPPORTUNITY
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ [UNIVERSAL] Advance to opportunity failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url
        });
        throw new Error(`Failed to advance to opportunity: ${response.status} ${response.statusText || errorText}`);
      }

      const result = await response.json();
      console.log('✅ [UNIVERSAL] Successfully advanced to opportunity:', result);
      
      showMessage('Successfully advanced to opportunity!');
      
      // 🚀 CACHE INVALIDATION: Trigger data refresh for left panel
      window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
        detail: { 
          section: 'opportunities',
          type: 'status-change',
          fromSection: 'prospects',
          recordId: record.id 
        }
      }));
      
      // Wait briefly for refresh to process before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update URL to opportunities page with proper slug format
      const opportunityId = result.data?.id || record.id;
      const opportunityName = result.data?.fullName || record.fullName || record.name || 'Unknown';
      
      // Use generateSlug utility for consistent slug generation
      const { generateSlug } = require('@/platform/utils/url-utils');
      const opportunitySlug = generateSlug(opportunityName, opportunityId);
      
      // Get current path and replace the section properly
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/opportunities/${opportunitySlug}`;
        console.log(`🔗 [ADVANCE] Navigating to opportunity: ${newUrl}`, {
          workspaceSlug,
          opportunitySlug,
          opportunityName,
          opportunityId
        });
        router.push(newUrl);
      } else {
        const newUrl = `/opportunities/${opportunitySlug}`;
        console.log(`🔗 [ADVANCE] Navigating to opportunity: ${newUrl}`);
        router.push(newUrl);
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error advancing to opportunity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to advance to opportunity: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle action submission
  const handleActionSubmit = async (actionData: ActionLogData) => {
    try {
      setLoading(true);
      console.log('🔄 [UNIVERSAL] Submitting action:', actionData);
      
      // Use v1 actions API for all record types including speedrun
      const apiEndpoint = '/api/v1/actions';
      
      // Prepare request body for v1 actions API (unified format for all record types)
      const requestBody = {
        type: actionData.type,
        subject: actionData.action.length > 100 ? actionData.action.substring(0, 100) + '...' : actionData.action,
        description: actionData.action,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        // Only include personId/companyId if they are valid (not empty strings or undefined)
        ...(actionData.personId && actionData.personId.trim() !== '' && { personId: actionData.personId }),
        ...(actionData.companyId && actionData.companyId.trim() !== '' && { companyId: actionData.companyId }),
        // Include companyName to help resolve company if companyId is invalid or missing
        ...(actionData.company && actionData.company.trim() !== '' && { companyName: actionData.company.trim() })
      };
      
        console.log('📤 [UNIVERSAL] Request body prepared:', {
          type: 'type' in requestBody ? requestBody.type : 'not included',
          subject: 'subject' in requestBody ? requestBody.subject : 'not included',
          hasPersonId: 'personId' in requestBody,
          hasCompanyId: 'companyId' in requestBody,
          personId: 'personId' in requestBody ? requestBody.personId : 'not included',
          companyId: 'companyId' in requestBody ? requestBody.companyId : 'not included',
          fullRequestBody: requestBody
        });
        
        console.log('📤 [UNIVERSAL] Action data being sent:', {
          recordId: record.id,
          recordType: recordType,
          actionData: actionData,
          requestBody: requestBody
        });
      
      // Make API call to log the action using apiPost for better error handling
      console.log('🌐 [UNIVERSAL] Making API call to:', apiEndpoint);
      const result = await apiPost(apiEndpoint, requestBody);
        
        console.log('📡 [UNIVERSAL] Full API response result:', {
          success: result.success,
          data: result.data,
          error: result.error,
          message: result.message,
          fullResult: result
        });
        
        // Debug the created action
        if (result.success && result.data) {
          console.log('✅ [UNIVERSAL] Action created successfully:', {
            actionId: result.data.id,
            actionType: result.data.type,
            actionSubject: result.data.subject,
            personId: result.data.personId,
            companyId: result.data.companyId,
            createdAt: result.data.createdAt
          });
        }

        if (result.success) {
          showMessage('Action logged successfully!');
        
        // Clear actions cache to force refresh
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        console.log('🗑️ [UNIVERSAL] Cleared actions cache for record:', record.id);
        
        // Close the modal
        setIsAddActionModalOpen(false);
        
        // 🎯 SPEEDRUN RECORD MOVEMENT: Move current record to bottom and gray out
        // Always dispatch event for speedrun sprint views, regardless of recordType
        // The event listener will handle filtering based on the record's context
        console.log('🎯 [SPEEDRUN] Action logged - dispatching event for record:', {
          recordId: record.id,
          recordType: recordType,
          recordName: record.name || record.fullName,
          hasOnNavigateNext: !!onNavigateNext
        });
        
        // Dispatch custom event to trigger record movement in left panel
        // This works for both speedrun table view and sprint view
        const eventDetail = {
          currentRecord: record,
          actionData: actionData,
          timestamp: new Date().toISOString()
        };
        
        console.log('🎯 [SPEEDRUN] Dispatching speedrunActionLogged event:', {
          recordId: record.id,
          recordName: record.name || record.fullName,
          recordType: recordType,
          eventDetail: eventDetail,
          timestamp: eventDetail.timestamp
        });
        
        document.dispatchEvent(new CustomEvent('speedrunActionLogged', {
          detail: eventDetail
        }));
        
        console.log('✅ [SPEEDRUN] Event dispatched successfully');
        
        // Update progress tracking for speedrun section
        if (recordType === 'speedrun' && record.id) {
          try {
            // Import markLeadAsCompleted function
            const { markLeadAsCompleted } = await import('@/products/speedrun/state');
            markLeadAsCompleted(record.id);
            console.log('📊 [SPEEDRUN] Updated progress tracking for record:', record.id);
          } catch (error) {
            console.warn('⚠️ [SPEEDRUN] Could not update progress tracking:', error);
          }
        }
        
        // Navigate to next record only for speedrun (traditional sales sections like leads and prospects stay on same record)
        if (recordType === 'speedrun' && onNavigateNext) {
          console.log('🎯 [SPEEDRUN] Navigating to next record');
          onNavigateNext();
        }
        
        // Optionally refresh the record or trigger a callback
        if (onRecordUpdate) {
          // Trigger record update to refresh any activity lists
          onRecordUpdate(record);
        }
        
        // IMPORTANT: Dispatch events AFTER onRecordUpdate to ensure event listeners are active
        // onRecordUpdate causes component re-renders, which can cleanup/recreate event listeners
        // By dispatching after, we ensure the new listeners catch the events
        console.log('📤 [UNIVERSAL] Dispatching events after record update');
        
        // Use setTimeout to ensure events are dispatched after React has finished re-rendering
        setTimeout(() => {
          console.log('📤 [UNIVERSAL] Dispatching actionCreated event');
          document.dispatchEvent(new CustomEvent('actionCreated', {
            detail: {
              recordId: record.id,
              recordType: recordType,
              actionId: result.data?.id,
              actionData: result.data, // Include full action data for matching by personId/companyId
              timestamp: new Date().toISOString()
            }
          }));
          
          console.log('📤 [UNIVERSAL] Dispatching actionCreatedWithData event:', {
            recordId: record.id,
            recordType: recordType,
            actionDataId: result.data?.id,
            actionDataType: result.data?.type,
            hasActionData: !!result.data
          });

          document.dispatchEvent(new CustomEvent('actionCreatedWithData', {
            detail: {
              recordId: record.id,
              recordType: recordType,
              actionData: result.data, // Full action data from API response
              timestamp: new Date().toISOString()
            }
          }));
        }, 100); // Small delay to ensure React has finished re-rendering
      } else {
        throw new Error(result.error || 'Failed to log action');
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error logging action:', error);
      
      // Handle authentication errors specifically
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
        showMessage('Authentication required. Please refresh the page or log in again.', 'error');
        console.warn('🔐 [UNIVERSAL] Authentication error detected - user may need to re-authenticate');
      } else {
        showMessage(`Error: ${errorMessage}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle task submission
  const handleTaskSubmit = async (taskData: any) => {
    try {
      setLoading(true);
      console.log('🔄 [UNIVERSAL] Submitting task:', taskData);
      
      // Make API call to create the task
      const response = await fetch('/api/tasks/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: record.id,
          recordType: recordType,
          subject: taskData.subject,
          description: taskData.description,
          priority: taskData.priority,
          scheduledDate: taskData.scheduledDate,
          type: taskData.type,
          workspaceId: record.workspaceId || 'default',
          userId: record.userId || 'default'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showMessage('Task created successfully!');
        
        // Close the modal
        setIsAddTaskModalOpen(false);
        
        // Optionally refresh the record or trigger a callback
        if (onRecordUpdate) {
          onRecordUpdate(record);
        }
      } else {
        throw new Error(result.error || 'Failed to create task');
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error creating task:', error);
      showMessage(`Error: ${error instanceof Error ? error.message : 'Failed to create task'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle record saving
  const handleSaveRecord = async () => {
    try {
      setLoading(true);
      console.log('🔄 [UNIVERSAL] Saving record updates...');
      console.log('🔍 [DEBUG] Record object:', {
        id: record?.id,
        fullName: record?.fullName,
        company: record?.company,
        workspaceId: record?.workspaceId
      });
      
      // Collect form data using FormData API
      const formElement = document.getElementById('edit-record-form') as HTMLFormElement;
      if (!formElement) {
        throw new Error('Edit record form not found.');
      }

      const formData = new FormData(formElement);
      
      // Helper function to safely get form values
      const getFormValue = (name: string): string => {
        const value = formData.get(name);
        return value ? value.toString() : '';
      };

      const getFormNumber = (name: string): number => {
        const value = formData.get(name);
        return value ? parseInt(value.toString()) || 0 : 0;
      };

      const getFormBoolean = (name: string): boolean => {
        const value = formData.get(name);
        return value === 'yes';
      };

      // Build update payload from form data - only include fields that exist in the form
      const rawPayload = {
        // Basic info (Overview tab)
        firstName: getFormValue('firstName'),
        lastName: getFormValue('lastName'),
        jobTitle: getFormValue('jobTitle'),
        department: getFormValue('department'),
        
        // Bio/Status fields
        status: getFormValue('status'),
        engagementLevel: getFormValue('engagementLevel'),
        influenceLevel: getFormValue('influenceLevel'),
        decisionPower: getFormValue('decisionPower'),
        priority: getFormValue('priority'),
        isBuyerGroupMember: getFormBoolean('isBuyerGroupMember'),
        
        // Intelligence tab
        engagementStrategy: getFormValue('engagementStrategy'),
        buyerGroupOptimized: getFormBoolean('buyerGroupOptimized'),
        seniority: getFormValue('seniority'),
        communicationStyle: getFormValue('communicationStyle'),
        engagementScore: getFormNumber('engagementScore'),
        influenceScore: getFormNumber('influenceScore'),
        decisionPowerScore: getFormNumber('decisionPowerScore'),
        relationshipWarmth: getFormValue('relationshipWarmth'),
        
        // Company-specific fields (when recordType === 'companies')
        ...(recordType === 'companies' ? {
          name: getFormValue('name'),
          legalName: getFormValue('legalName'),
          website: getFormValue('website'),
          phone: getFormValue('phone'),
          description: getFormValue('description'),
          industry: getFormValue('industry'),
          size: getFormValue('size'),
          foundedYear: getFormNumber('foundedYear'),
        } : {})
      };

      console.log('📝 [DEBUG] Raw form data collected:', rawPayload);
      
      // Filter out empty strings, null, undefined, and zero values (except booleans)
      // This prevents sending invalid data that could violate database constraints
      const updatePayload = Object.fromEntries(
        Object.entries(rawPayload).filter(([key, value]) => {
          // Always include boolean values (even if false)
          if (typeof value === 'boolean') return true;
          // Exclude empty strings, null, undefined, and 0
          if (value === '' || value === null || value === undefined || value === 0) return false;
          return true;
        })
      );

      console.log('📝 [DEBUG] Cleaned payload to send:', updatePayload);
      
      // Make API call to update the record using v1 APIs
      let result: any;
      
      try {
        if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects') {
          // All people-related records use v1 people API
          console.log('🔍 [DEBUG] Using v1 people API for record type:', recordType);
          console.log('🔍 [DEBUG] API endpoint:', `/api/v1/people/${record.id}`);
          console.log('🔍 [DEBUG] Payload being sent:', JSON.stringify(updatePayload, null, 2));
          
          result = await authFetch(`/api/v1/people/${record.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          });
          
          console.log('✅ [DEBUG] API response:', result);
        } else if (recordType === 'companies' || recordType === 'opportunities') {
          // Opportunities are companies
          console.log('🔍 [DEBUG] Using v1 companies API');
          console.log('🔍 [DEBUG] Payload being sent:', JSON.stringify(updatePayload, null, 2));
          
          result = await authFetch(`/api/v1/companies/${record.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          });
          
          console.log('✅ [DEBUG] API response:', result);
        } else {
          // For other record types, try to use appropriate v1 API or throw error
          console.log('🔍 [DEBUG] Unsupported record type for v1 migration:', recordType);
          throw new Error(`Record type '${recordType}' is not yet supported in v1 APIs. Please use companies or people records.`);
        }
      } catch (error) {
        console.error('❌ [DEBUG] API Error details:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error(`Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      if (result.success) {
        // Show success message
        showMessage('Record updated successfully!');
        
        // Close the modal
        setIsEditRecordModalOpen(false);
        
        // Trigger record update callback if provided
        if (onRecordUpdate) {
          onRecordUpdate(result.data || result.record);
        }
        
        // UPDATE CACHE: Ensure sessionStorage cache is updated with fresh data
        const updatedRecord = result.data || result.record;
        if (updatedRecord && typeof window !== 'undefined') {
          updateSessionStorageCache(updatedRecord, 'modal-save', record.id, recordType);
          console.log(`💾 [UNIVERSAL] Updated sessionStorage cache after modal save for ${recordType} record ${record.id}`);
        }
        
        // Dispatch event to update the UI without page reload
        window.dispatchEvent(new CustomEvent('record-updated', {
          detail: {
            recordType,
            recordId: record.id,
            updatedRecord: result.data || result.record
          }
        }));
        
        // DO NOT reload the page - let the UI update via state
      } else {
        throw new Error(result.error || 'Failed to update record');
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error updating record:', error);
      showMessage(`Error: ${error instanceof Error ? error.message : 'Failed to update record'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecordFromModal = async () => {
    if (!record?.id) return;
    
    const recordName = getDisplayName();
    
    if (normalizeString(deleteConfirmName) !== normalizeString(recordName)) {
      alert(`Please type "${recordName}" to confirm deletion.`);
      return;
    }

    try {
      setLoading(true);
      
      console.log(`🗑️ [UniversalRecordTemplate] Deleting ${recordType} record: ${record.id}`);
      
      // Perform soft delete via new v1 deletion API
      const response = await fetch('/api/v1/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'soft_delete',
          entityType: recordType === 'companies' ? 'companies' : 
                     recordType === 'people' ? 'people' : 
                     'people',
          entityId: record.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ [UniversalRecordTemplate] Deletion failed:`, responseData);
        throw new Error(responseData.error || 'Failed to delete record');
      }

      console.log(`✅ [UniversalRecordTemplate] Deletion successful:`, responseData);

      // Close the modal first
      setIsEditRecordModalOpen(false);
      setDeleteConfirmName('');
      
      // Dispatch cache invalidation event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cache-invalidate', {
          detail: { 
            pattern: `${recordType}-*`, 
            reason: 'record_deleted',
            recordId: record.id
          }
        }));
        
        // Also dispatch a refresh event for the sidebar counts
        window.dispatchEvent(new CustomEvent('refresh-sidebar-counts', {
          detail: { 
            section: recordType,
            action: 'delete'
          }
        }));
      }
      
      // Show success message
      const recordTypeLabel = recordType === 'companies' ? 'Company' : recordType === 'people' ? 'Person' : 'Record';
      showMessage(`${recordTypeLabel} deleted successfully!`, 'success');
      
      // Navigate back to the list page immediately using onBack callback
      // This ensures we navigate to the correct list page and don't try to reload the deleted record
      try {
        if (onBack) {
          console.log(`🔄 [UniversalRecordTemplate] Navigating back to list page using onBack callback`);
          onBack();
        } else {
          // Fallback: Navigate manually if onBack is not provided
          const currentPath = window.location.pathname;
          const pathParts = currentPath.split('/').filter(part => part.length > 0);
          const workspaceIndex = pathParts.findIndex(part => part.length > 0);
          const workspace = pathParts[workspaceIndex] || pathParts[0];
          
          // Construct the list page URL - ensure we use the correct route structure
          const listPageUrl = `/${workspace}/${recordType}`;
          console.log(`🔄 [UniversalRecordTemplate] Redirecting to list page: ${listPageUrl}`);
          router.push(listPageUrl);
        }
      } catch (navError) {
        console.error('❌ [UniversalRecordTemplate] Navigation error, using fallback:', navError);
        // Fallback navigation if onBack fails
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/').filter(part => part.length > 0);
        const workspaceIndex = pathParts.findIndex(part => part.length > 0);
        const workspace = pathParts[workspaceIndex] || pathParts[0];
        const listPageUrl = `/${workspace}/${recordType}`;
        router.push(listPageUrl);
      }
    } catch (error) {
      console.error('❌ [UniversalRecordTemplate] Error deleting record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete record. Please try again.';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Report handlers
  const handleReportClick = (report: DeepValueReport) => {
    console.log('📊 [UNIVERSAL] Opening report:', report.title);
    setActiveReport(report);
  };

  const handleReportBack = () => {
    setActiveReport(null);
  };

  const handleReportSave = async (content: string) => {
    if (!activeReport) return;
    
    try {
      // Save report content to Workshop
      const response = await authFetch('/api/workshop/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: activeReport.title,
          content,
          type: 'PAPER',
          reportType: activeReport.type,
          sourceRecordId: activeReport.sourceRecordId,
          sourceRecordType: activeReport.sourceRecordType,
          generatedByAI: true,
          workspaceId: activeReport.workspaceId,
          userId: activeReport.userId
        })
      });

      if (response.ok) {
        console.log('✅ [UNIVERSAL] Report saved to Workshop');
      }
    } catch (error) {
      console.error('❌ [UNIVERSAL] Failed to save report:', error);
    }
  };

  // Get action buttons based on record type and context
  const getActionButtons = () => {
    const buttons = [];
    
    // Contextual actions
    contextualActions.forEach(action => {
      if (!action.condition || action.condition(record)) {
        buttons.push(
          <button
            key={action.id}
            onClick={() => action.action(record)}
            className="px-3 py-1.5 text-sm bg-hover text-gray-700 rounded-md hover:bg-loading-bg transition-colors"
          >
            {action.label}
          </button>
        );
      }
    });

    // Add Company button - only for person/lead/prospect records without a company
    if ((recordType === 'people' || recordType === 'leads' || recordType === 'prospects') && 
        !record?.companyId && !record?.company) {
      buttons.push(
        <button
          key="add-company"
          onClick={() => setIsAddCompanyModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-background text-gray-700 border border-border rounded-md hover:bg-panel-background transition-colors"
        >
          Add Company
        </button>
      );
    }

    // Set Reminder button - FIRST BUTTON for all record types
    if (recordType === 'people' || recordType === 'companies' || 
        recordType === 'leads' || recordType === 'prospects') {
      buttons.push(
        <button
          key="set-reminder"
          onClick={() => setIsSetReminderModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-hover text-foreground border border-border rounded-md hover:bg-panel-background hover:border-primary/50 transition-colors flex items-center gap-1.5"
        >
          <ClockIcon className="w-4 h-4" />
          <span>Set Reminder</span>
        </button>
      );
    }

    // Update Record button - for all record types
    const updateButtonText = recordType === 'leads' ? 'Update Lead' : 
                            recordType === 'prospects' ? 'Update Prospect' :
                            recordType === 'opportunities' ? 'Update Opportunity' :
                            recordType === 'companies' ? 'Update Company' :
                            recordType === 'people' ? 'Update Person' :
                            recordType === 'clients' ? 'Update Client' :
                            recordType === 'partners' ? 'Update Partner' :
                            'Update Record';
    
    buttons.push(
      <button
        key="update-record"
        onClick={() => setIsUpdateModalOpen(true)}
        className="px-3 py-1.5 text-sm bg-hover text-foreground border border-border rounded-md hover:bg-panel-background hover:border-primary/50 transition-colors"
      >
        {updateButtonText}
      </button>
    );

    // Snooze button - only for speedrun records
    if (recordType === 'speedrun') {
      buttons.push(
        <div key="snooze" className="relative" ref={snoozeDropdownRef}>
          <button
            onClick={() => setIsSnoozeDropdownOpen(!isSnoozeDropdownOpen)}
            className="px-3 py-1.5 text-sm bg-background text-gray-700 border border-border rounded-md hover:bg-panel-background transition-colors flex items-center gap-1.5"
          >
            <ClockIcon className="w-4 h-4" />
            <span>Snooze</span>
            <svg
              className={`w-4 h-4 transition-transform ${isSnoozeDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isSnoozeDropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-background rounded-md shadow-lg border border-border z-[9999] py-1">
          <button
            onClick={() => {
              setIsSnoozeDropdownOpen(false);
              handleSnoozeOption('next-sprint');
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover transition-colors"
          >
            Next Sprint
          </button>
          <button
            onClick={() => {
              setIsSnoozeDropdownOpen(false);
              handleSnoozeOption('end-of-day');
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover transition-colors"
          >
            End of Day
          </button>
          <button
            onClick={() => {
              setIsSnoozeDropdownOpen(false);
              handleSnoozeOption('tomorrow');
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover transition-colors"
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              setIsSnoozeDropdownOpen(false);
              setIsDatePickerModalOpen(true);
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover transition-colors"
          >
            Choose Date
          </button>
        </div>
      )}
        </div>
      );
    }

    // Add Person button - for company records and company leads/prospects
    const isCompanyRecord = (recordType === 'speedrun' && record?.recordType === 'company') ||
                           (recordType === 'leads' && record?.isCompanyLead === true) ||
                           (recordType === 'prospects' && record?.isCompanyLead === true) ||
                           (recordType === 'companies');
    
    if (isCompanyRecord) {
      buttons.push(
        <button
          key="add-person"
          onClick={() => setIsAddPersonModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-background text-gray-700 border border-border rounded-md hover:bg-panel-background transition-colors"
        >
          Add Person
        </button>
      );
    }

    // Add Action button - Check URL path to determine button text and styling
    if (recordType === 'speedrun') {
      // Check if we're on the sprint page or individual record page
      const isOnSprintPage = typeof window !== 'undefined' && window.location.pathname.includes('/speedrun/sprint');
      
      if (isOnSprintPage) {
        // On sprint page: Show "Add Action" button with green styling and keyboard shortcut - Always show shortcut
        buttons.push(
          <button
            key="add-action"
            onClick={() => setIsAddActionModalOpen(true)}
            className="px-3 py-1.5 text-sm bg-success-bg text-success-text border border-success-border rounded-md hover:bg-success hover:text-button-text transition-colors flex items-center gap-1"
          >
            <span className="hidden xs:inline">Add Action ({getCommonShortcut('SUBMIT')})</span>
            <span className="xs:hidden">Add Action ({getCommonShortcut('SUBMIT')})</span>
          </button>
        );
      } else {
        // On individual record page: Show "Add Action" button first (no shortcut), then "Start Speedrun" with shortcut
      // Add Action button - THEME-AWARE BUTTON (works in both light and dark mode)
      const getAddActionButtonClasses = (recordType: string) => {
        // Use theme-aware colors that work in both light and dark mode
        if (recordType === 'leads') {
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-warning/10 text-warning border border-warning hover:bg-warning/20';
        } else if (recordType === 'prospects') {
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-primary/10 text-primary border border-primary hover:bg-primary/20';
        } else if (recordType === 'opportunities') {
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-info/10 text-info border border-info hover:bg-info/20';
        } else {
          // Default theme-aware styling
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-panel-background text-foreground border border-border hover:bg-hover';
        }
      };
      buttons.push(
        <button
          key="add-action"
          onClick={() => setIsAddActionModalOpen(true)}
          className={getAddActionButtonClasses(recordType)}
        >
          Add Action
        </button>
      );
        
        // Start/Continue Speedrun button - blue styling
        const buttonText = hasCompletedRecords ? 'Continue Speedrun' : 'Start Speedrun';
        const buttonTextShort = hasCompletedRecords ? 'Continue' : 'Start';
        buttons.push(
          <button
            key="start-speedrun"
            onClick={() => {
              // Navigate to speedrun/sprint page
              const currentPath = window.location.pathname;
              const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
              if (workspaceMatch) {
                const workspaceSlug = workspaceMatch[1];
                router.push(`/${workspaceSlug}/speedrun/sprint`);
              } else {
                router.push('/speedrun/sprint');
              }
            }}
            className="px-3 py-1.5 text-sm bg-info-bg text-info-text border border-info-border rounded-md hover:bg-info hover:text-button-text transition-colors flex items-center gap-1"
          >
            <span className="hidden xs:inline">{buttonText} ({getCommonShortcut('SUBMIT')})</span>
            <span className="xs:hidden">{buttonTextShort} ({getCommonShortcut('SUBMIT')})</span>
          </button>
        );
      }
    } else {
      // Context-aware advance button (moved before Add Action)
      // Check if this is a company record - don't show advance buttons for companies
      const isCompanyRecord = (recordType === 'speedrun' && record?.recordType === 'company') ||
                             (recordType === 'leads' && record?.isCompanyLead === true) ||
                             (recordType === 'prospects' && record?.isCompanyLead === true) ||
                             (recordType === 'companies');
      
      if (!isCompanyRecord) {
        if (recordType === 'leads') {
          // Advance to Lead button - LIGHT GRAY BUTTON (for leads)
          buttons.push(
            <button
              key="advance-to-prospect"
              onClick={handleAdvanceToProspect}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              Advance to Prospect
            </button>
          );
        } else if (recordType === 'prospects') {
          // Advance to Opportunity button - LIGHT BLUE BUTTON (matching list page style)
          buttons.push(
            <button
              key="advance-to-opportunity"
              onClick={handleAdvanceToOpportunity}
              className="px-3 py-1.5 text-sm bg-info-bg text-info-text border border-info-border rounded-md hover:bg-info hover:text-button-text transition-colors"
            >
              Advance to Opportunity
            </button>
          );
        } else if (recordType === 'people') {
        // Dynamic advance button for people based on their status
        const currentStatus = record?.status;
        if (currentStatus === 'LEAD') {
          buttons.push(
            <button
              key="advance-to-prospect"
              onClick={handleAdvanceToProspect}
              className="px-3 py-1.5 text-sm bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-colors"
            >
              Advance to Prospect
            </button>
          );
        } else if (currentStatus === 'PROSPECT') {
          buttons.push(
            <button
              key="advance-to-opportunity"
              onClick={handleAdvanceToOpportunity}
              className="px-3 py-1.5 text-sm bg-info-bg text-info-text border border-info-border rounded-md hover:bg-info hover:text-button-text transition-colors"
            >
              Advance to Opportunity
            </button>
          );
        }
      }
      }

      // Add Action button - THEME-AWARE BUTTON (works in both light and dark mode)
      const getAddActionButtonClasses = (recordType: string) => {
        // Use theme-aware colors that work in both light and dark mode
        if (recordType === 'leads') {
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-warning/10 text-warning border border-warning hover:bg-warning/20';
        } else if (recordType === 'prospects') {
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-primary/10 text-primary border border-primary hover:bg-primary/20';
        } else if (recordType === 'opportunities') {
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-info/10 text-info border border-info hover:bg-info/20';
        } else {
          // Default theme-aware styling
          return 'px-3 py-1.5 text-sm rounded-md transition-colors bg-panel-background text-foreground border border-border hover:bg-hover';
        }
      };
      buttons.push(
        <button
          key="add-action"
          onClick={() => setIsAddActionModalOpen(true)}
          className={getAddActionButtonClasses(recordType)}
        >
          Add Action ({getCommonShortcut('SUBMIT')})
        </button>
      );
    }



    return buttons;
  };

  // Render tab content - memoized to prevent unnecessary rerenders
  const renderTabContent = useMemo(() => {
    console.log(`🔄 [UNIVERSAL] Rendering tab content for: ${activeTab}, record:`, record?.name || record?.id);
    console.log(`🔄 [UNIVERSAL] Available tabs:`, tabs.map(t => t.id));
    console.log(`🔄 [UNIVERSAL] Record data keys:`, Object.keys(record || {}));
    console.log(`🔄 [UNIVERSAL] Record type: ${recordType}, Active tab: ${activeTab}`);
    
    // Validate record data exists
    if (!record) {
      console.error(`🚨 [UNIVERSAL] No record data provided for tab: ${activeTab}`);
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium mb-2">No Data Available</h3>
            <p className="text-yellow-600 text-sm">
              Record data is not available for this {activeTab} tab.
            </p>
            <div className="mt-4 text-xs text-muted">
              Record Type: {recordType} | Active Tab: {activeTab}
            </div>
          </div>
        </div>
      );
    }
    
    const activeTabConfig = tabs.find(tab => tab['id'] === activeTab);
    
    if (activeTabConfig?.component) {
      try {
        const TabComponent = activeTabConfig.component;
        // NotesTab requires additional props for pending saves tracking
        if (activeTab === 'notes') {
          return (
            <TabComponent 
              key={activeTab} 
              record={record} 
              recordType={recordType} 
              onSave={handleInlineFieldSave}
              setPendingSaves={setPendingSaves}
              setLocalRecord={setLocalRecord}
              localRecord={localRecord}
              onRecordUpdate={onRecordUpdate}
            />
          );
        }
        return <TabComponent key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />;
      } catch (error) {
        console.error(`🚨 [UNIVERSAL] Error rendering custom tab component:`, error);
        return (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium mb-2">Component Error</h3>
              <p className="text-red-600 text-sm mb-2">
                Failed to load the custom {activeTab} tab component.
              </p>
              <details className="text-xs text-red-500">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">{error instanceof Error ? error.message : String(error)}</pre>
              </details>
            </div>
          </div>
        );
      }
    }
    
    // Default tab rendering with enhanced error boundaries
    const renderTabWithErrorBoundary = (tabComponent: React.ReactNode) => {
      return (
        <div className="p-6">
          <TabErrorBoundary 
            tabName={activeTab} 
            recordId={record?.id} 
            recordType={recordType}
            onError={(error, errorInfo) => {
              console.error(`🚨 [TAB ERROR BOUNDARY] ${activeTab} tab error:`, error, errorInfo);
            }}
          >
            {tabComponent}
          </TabErrorBoundary>
        </div>
      );
    };

    try {
      switch (activeTab) {
        case 'overview':
          console.log(`🏠 [UNIVERSAL] Rendering overview tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            recordType === 'companies' ? 
              <UniversalCompanyTab key={activeTab} record={localRecord} recordType={recordType} onSave={handleInlineFieldSave} /> :
              recordType === 'people' || recordType === 'speedrun' ?
                <PersonOverviewTab key={activeTab} record={localRecord} recordType={recordType} onSave={handleInlineFieldSave} /> :
              recordType === 'prospects' ?
                <ProspectOverviewTab key={activeTab} record={localRecord} recordType={recordType} onSave={handleInlineFieldSave} /> :
                <UniversalOverviewTab key={activeTab} record={localRecord} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'career':
          console.log(`💼 [UNIVERSAL] Rendering career tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'intelligence':
          console.log(`🧠 [UNIVERSAL] Rendering intelligence tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            (recordType === 'companies' || record?.isCompanyLead || record?.recordType === 'company') ? 
              <UniversalCompanyIntelTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              recordType === 'speedrun' ?
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              recordType === 'people' ?
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'buyer-groups':
          console.log(`👥 [UNIVERSAL] Rendering buyer groups tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            recordType === 'companies' ? 
              <UniversalBuyerGroupsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              <UniversalBuyerGroupsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'people':
          console.log(`👥 [UNIVERSAL] Rendering people tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalPeopleTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'co-workers':
          console.log(`👥 [UNIVERSAL] Rendering co-workers tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalPeopleTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'competitors':
          console.log(`🏢 [UNIVERSAL] Rendering competitors tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalCompetitorsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'insights':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <ComprehensiveInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'intelligence':
          console.log(`🧠 [UNIVERSAL] Rendering intelligence tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            (recordType === 'companies' || record?.isCompanyLead || record?.recordType === 'company') ? 
              <UniversalCompanyIntelTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              recordType === 'speedrun' ?
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              recordType === 'people' ?
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'value':
          console.log(`📊 [UNIVERSAL] Rendering value tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <ValueTab key={activeTab} record={record} recordType={recordType} onReportClick={handleReportClick} />
          );
        // case 'news':
        //   console.log(`📰 [UNIVERSAL] Rendering news tab for ${recordType}`);
        //   return renderTabWithErrorBoundary(
        //     <UniversalNewsTab key={activeTab} record={record} recordType={recordType} />
        //   );
        case 'companies':
          return renderTabWithErrorBoundary(
            <UniversalSellerCompaniesTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'profile':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <ComprehensiveProfileTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              <UniversalProfileTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'pain-value':
          return renderTabWithErrorBoundary(
            <UniversalPainValueTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'industry-intel':
          return renderTabWithErrorBoundary(
            <UniversalIndustryIntelTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'outreach':
          return renderTabWithErrorBoundary(
            <UniversalOutreachTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'engagement':
          return renderTabWithErrorBoundary(
            <UniversalEngagementTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'deal-intel':
          return renderTabWithErrorBoundary(
            <UniversalDealIntelTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'company-intel':
          return renderTabWithErrorBoundary(
            <UniversalCompanyIntelTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'close-plan':
          return renderTabWithErrorBoundary(
            <UniversalClosePlanTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'competitive':
          return renderTabWithErrorBoundary(
            <UniversalCompetitorsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'relationship':
          return renderTabWithErrorBoundary(
            <UniversalRelationshipTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'personal':
          return renderTabWithErrorBoundary(
            <UniversalPersonalTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'business':
          return renderTabWithErrorBoundary(
            <UniversalBusinessTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'success':
          return renderTabWithErrorBoundary(
            <UniversalSuccessTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'partnership':
          return renderTabWithErrorBoundary(
            <UniversalPartnershipTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'collaboration':
          return renderTabWithErrorBoundary(
            <UniversalCollaborationTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'performance':
          return renderTabWithErrorBoundary(
            <UniversalPerformanceTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'industry':
          return renderTabWithErrorBoundary(
            <UniversalIndustryTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'persona':
          return renderTabWithErrorBoundary(
            <UniversalProfileTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'career':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'workplace':
          return renderTabWithErrorBoundary(
            <UniversalCompanyTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'landmines':
          return renderTabWithErrorBoundary(
            <UniversalLandminesTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'stakeholders':
          console.log(`👥 [UNIVERSAL] Rendering stakeholders tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalStakeholdersTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'documents':
          return renderTabWithErrorBoundary(
            <UniversalDocumentsTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'opportunities':
          return renderTabWithErrorBoundary(
            <UniversalOpportunitiesTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'history':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <UniversalHistoryTab key={activeTab} recordType={recordType} /> :
              <UniversalActionsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'actions':
          return renderTabWithErrorBoundary(
            <UniversalActionsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'timeline':
          return renderTabWithErrorBoundary(
            <UniversalActionsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'notes':
          return renderTabWithErrorBoundary(
            <NotesTab 
              key="notes" 
              record={record} 
              recordType={recordType}
              setPendingSaves={setPendingSaves}
              setLocalRecord={setLocalRecord}
              localRecord={localRecord}
              onRecordUpdate={onRecordUpdate}
            />
          );
        case 'company':
          console.log(`🏢 [UNIVERSAL] Rendering company tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <CompanyOverviewTab key={activeTab} record={localRecord} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        default:
          console.warn(`🔄 [UNIVERSAL] Unknown tab: ${activeTab}, falling back to overview`);
          return renderTabWithErrorBoundary(
            <UniversalOverviewTab key={activeTab} record={localRecord} recordType={recordType} onSave={handleInlineFieldSave} />
          );
      }
    } catch (error) {
      console.error(`🚨 [UNIVERSAL] Error rendering tab ${activeTab}:`, error);
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Tab Loading Error</h3>
            <p className="text-red-600 text-sm mb-2">
              There was an error loading the {activeTab} tab content.
            </p>
            <details className="text-xs text-red-500 mt-2">
              <summary className="cursor-pointer">Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error instanceof Error ? error.message : String(error)}</pre>
            </details>
            <button 
              onClick={() => setActiveTab('overview')}
              className="mt-3 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded hover:bg-blue-100"
            >
              Go to Overview Tab
            </button>
          </div>
        </div>
      );
    }
  }, [activeTab, record, recordType, tabs]);

  // If a report is active, show the report view
  if (activeReport) {
    return (
      <DeepValueReportView
        report={activeReport}
        record={record}
        recordType={recordType}
        onBack={handleReportBack}
        onSave={handleReportSave}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* URL Fixer - Automatically fixes malformed URLs */}
      <URLFixer />
      
      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={closeMessage}
        type={messageType}
      />

      {/* Breadcrumb Header */}
      <div className="flex-shrink-0 bg-background border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <HierarchicalBreadcrumb 
            record={localRecord}
            recordType={recordType}
            onBack={onBack}
            workspaceId={localRecord?.workspaceId}
          />
          
          <div className="flex items-center gap-1">
            {(() => {
              // Ensure recordIndex is always at least 1 for proper navigation
              const safeRecordIndex = recordIndex || 1;
              const safeTotalRecords = totalRecords || 0;
              
              console.log(`🔍 [UNIVERSAL] Navigation arrows state:`, {
                recordIndex,
                safeRecordIndex,
                totalRecords,
                safeTotalRecords,
                canGoPrevious: !(!safeRecordIndex || safeRecordIndex <= 1),
                canGoNext: !(!safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords),
                isPreviousDisabled: !safeRecordIndex || safeRecordIndex <= 1,
                isNextDisabled: !safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords,
                hasOnNavigatePrevious: !!onNavigatePrevious,
                hasOnNavigateNext: !!onNavigateNext,
                recordId: record?.id,
                recordName: record?.name || record?.fullName,
                recordType: recordType,
                // Additional debugging
                previousButtonDisabled: !safeRecordIndex || safeRecordIndex <= 1 || !safeTotalRecords || safeTotalRecords <= 1,
                nextButtonDisabled: !safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords || safeTotalRecords <= 1,
                // Debug the actual disabled conditions
                prevDisabledCondition: `!${safeRecordIndex} || ${safeRecordIndex} <= 1 || !${safeTotalRecords}`,
                nextDisabledCondition: `!${safeRecordIndex} || !${safeTotalRecords} || ${safeRecordIndex} >= ${safeTotalRecords}`,
                prevDisabledResult: !safeRecordIndex || safeRecordIndex <= 1 || !safeTotalRecords,
                nextDisabledResult: !safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords
              });
              
              // For speedrun (descending order), update titles to reflect that right arrow goes to lower numbers
              const isDescending = recordType === 'speedrun';
              const leftHandler = onNavigatePrevious;
              const rightHandler = onNavigateNext;
              
              const leftDisabled = !safeRecordIndex || safeRecordIndex <= 1 || !safeTotalRecords;
              const rightDisabled = !safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords;
              
              const leftTitle = isDescending 
                ? (!safeTotalRecords || safeTotalRecords <= 1 ? "No other records to navigate" : "Previous record (higher rank)")
                : (!safeTotalRecords || safeTotalRecords <= 1 ? "No other records to navigate" : "Previous record");
              const rightTitle = isDescending
                ? (!safeTotalRecords || safeTotalRecords <= 1 ? "No other records to navigate" : "Next record (lower rank)")
                : (!safeTotalRecords || safeTotalRecords <= 1 ? "No other records to navigate" : "Next record");
              
              return (
                <>
                  <button
                    onClick={() => {
                      console.log(`🔍 [UNIVERSAL] Left arrow clicked!`, {
                        isDescending,
                        hasHandler: !!leftHandler,
                        recordIndex,
                        totalRecords,
                        recordId: record?.id,
                        recordName: record?.name || record?.fullName
                      });
                      if (leftHandler && !leftDisabled) {
                        console.log(`✅ [UNIVERSAL] Navigating ${isDescending ? 'to next record (lower rank)' : 'to previous record'}`);
                        leftHandler();
                      } else {
                        console.warn(`❌ [UNIVERSAL] Cannot navigate - leftDisabled: ${leftDisabled}`);
                      }
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      leftDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-foreground hover:text-blue-600 hover:bg-panel-background'
                    }`}
                    disabled={leftDisabled}
                    title={leftTitle}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      console.log(`🔍 [UNIVERSAL] Right arrow clicked!`, {
                        isDescending,
                        hasHandler: !!rightHandler,
                        recordIndex,
                        totalRecords,
                        recordId: record?.id,
                        recordName: record?.name || record?.fullName
                      });
                      if (rightHandler && !rightDisabled) {
                        console.log(`✅ [UNIVERSAL] Navigating ${isDescending ? 'to previous record (higher rank)' : 'to next record'}`);
                        rightHandler();
                      } else {
                        console.warn(`❌ [UNIVERSAL] Cannot navigate - rightDisabled: ${rightDisabled}`);
                      }
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      rightDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-foreground hover:text-blue-600 hover:bg-panel-background'
                    }`}
                    disabled={rightDisabled}
                    title={rightTitle}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Main Header - Minimal Design */}
      <div className="flex-shrink-0 border-b border-border px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Minimal Avatar with Rank */}
            <div className="relative group">
              <div 
                className="w-10 h-10 bg-hover border border-border rounded-xl flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-[var(--primary)] transition-colors"
                onClick={handleProfileClick}
                title="Click to open profile"
              >
                {getProfileImageUrl() ? (
                  <img 
                    src={getProfileImageUrl()} 
                    alt={getDisplayName()}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {(() => {
                      console.log(`🔍 [RANK DEBUG] Record rank:`, record?.rank, 'RecordIndex:', recordIndex, 'RecordType:', recordType, 'Record:', record);
                      // 🎯 FIX: For speedrun records, use countdown rank from navigation (N-1 format: 50, 49, 48... 3, 2, 1)
                      if (recordType === 'speedrun' && recordIndex !== undefined) {
                        return recordIndex; // Use the recordIndex directly (countdown format: N-1)
                      }
                      return record?.rank !== undefined ? record.rank : (recordIndex !== undefined ? recordIndex : getFirstInitial());
                    })()}
                  </span>
                )}
              </div>
              
              {/* Hover overlay with upload option - TEMPORARILY COMMENTED OUT */}
              {/*
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-0.5">
                <button
                  onClick={() => setIsImageUploadModalOpen(true)}
                  className="cursor-pointer text-white hover:text-blue-200 transition-colors"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
              */}
            </div>
            <div className="flex items-center gap-3">
              <div>
                {/* Stage and Type Pills - Show for all company-related records */}
                {(recordType === 'companies' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') && (
                  <div className="flex items-center gap-2 mb-2">
                    {/* Type Pill - Show for leads/prospects with relationship types, hidden for regular companies */}
                    {recordType !== 'companies' && (() => {
                      const isPartnerOS = typeof window !== 'undefined' && sessionStorage.getItem('activeSubApp') === 'partneros';
                      const relationshipType = localRecord?.relationshipType;
                      
                      if (isPartnerOS) {
                        // PartnerOS: Future Partner or Partner
                        if (relationshipType === 'PARTNER' || relationshipType === 'FUTURE_PARTNER') {
                          const typeLabel = relationshipType === 'PARTNER' ? 'Partner' : 'Future Partner';
                          const typeColor = relationshipType === 'PARTNER' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/10 text-muted border-muted/20';
                          return (
                            <>
                              <span className="text-xs text-muted font-medium">Type:</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${typeColor}`}>
                                {typeLabel}
                              </span>
                            </>
                          );
                        }
                      } else {
                        // RevenueOS: Future Client or Client
                        if (relationshipType === 'CLIENT' || relationshipType === 'FUTURE_CLIENT') {
                          const typeLabel = relationshipType === 'CLIENT' ? 'Client' : 'Future Client';
                          const typeColor = relationshipType === 'CLIENT' ? 'bg-success/10 text-success border-success/20' : 'bg-muted/10 text-muted border-muted/20';
                          return (
                            <>
                              <span className="text-xs text-muted font-medium">Type:</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${typeColor}`}>
                                {typeLabel}
                              </span>
                            </>
                          );
                        }
                      }
                      return null;
                    })()}
                    
                    {/* Stage Pill - Now shown for companies too */}
                    {(() => {
                      const isPartnerOS = typeof window !== 'undefined' && sessionStorage.getItem('activeSubApp') === 'partneros';
                      const status = localRecord?.status;
                      const relationshipType = localRecord?.relationshipType;
                      
                      // Map status to display labels
                      const stageMap: Record<string, string> = {
                        'LEAD': 'Lead',
                        'PROSPECT': 'Prospect',
                        'OPPORTUNITY': 'Opportunity',
                        'CLIENT': isPartnerOS ? 'Partner' : 'Client',
                        'ACTIVE': 'Active',
                        'INACTIVE': 'Inactive'
                      };
                      
                      // For PartnerOS, limit stages to Lead, Prospect, Partner
                      if (isPartnerOS) {
                        if (status === 'CLIENT' || relationshipType === 'PARTNER' || relationshipType === 'FUTURE_PARTNER') {
                          const stageLabel = 'Partner';
                          const stageColor = 'bg-primary/10 text-primary border-primary/20';
                          return (
                            <>
                              <span className="text-xs text-muted font-medium ml-2">Stage:</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${stageColor}`}>
                                {stageLabel}
                              </span>
                            </>
                          );
                        } else if (status === 'LEAD' || status === 'PROSPECT') {
                          const stageLabel = stageMap[status] || status;
                          const stageColor = status === 'LEAD' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-info/10 text-info border-info/20';
                          return (
                            <>
                              <span className="text-xs text-muted font-medium ml-2">Stage:</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${stageColor}`}>
                                {stageLabel}
                              </span>
                            </>
                          );
                        }
                      } else {
                        // RevenueOS: Lead, Prospect, Opportunity, Client
                        if (status && (status === 'LEAD' || status === 'PROSPECT' || status === 'OPPORTUNITY' || status === 'CLIENT')) {
                          const stageLabel = stageMap[status] || status;
                          const stageColor = 
                            status === 'LEAD' ? 'bg-warning/10 text-warning border-warning/20' :
                            status === 'PROSPECT' ? 'bg-info/10 text-info border-info/20' :
                            status === 'OPPORTUNITY' ? 'bg-primary/10 text-primary border-primary/20' :
                            'bg-success/10 text-success border-success/20';
                          return (
                            <>
                              <span className="text-xs text-muted font-medium ml-2">Stage:</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${stageColor}`}>
                                {stageLabel}
                              </span>
                            </>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                )}
                <h1 className="text-2xl font-bold text-foreground mb-1">{getDisplayName()}</h1>
                <p className="text-sm text-muted">{getSubtitle()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getActionButtons()}
          </div>
        </div>

        {/* Minimal Tabs */}
        <div className="flex items-center gap-1 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                console.log(`🔄 [UNIVERSAL] Tab clicked: ${tab.id}, was: ${activeTab}`);
                // Immediate visual feedback - update state first
                setActiveTab(tab.id);
                // Reset scroll position to top when switching tabs
                if (contentRef.current) {
                  contentRef.current.scrollTop = 0;
                }
                // Non-blocking URL update in background
                startTransition(() => {
                  updateURLTab(tab.id);
                });
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-panel-background text-foreground border border-border'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-hide" ref={contentRef}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size="lg" />
          </div>
        ) : (
          <div key={record?.id} className="px-6 py-6 min-h-[400px]">
            {renderTabContent}
          </div>
        )}
      </div>

      {/* Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        record={localRecord}
        recordType={recordType as 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'partners' | 'clients'}
        onUpdate={handleUpdateSubmit}
        onDelete={handleDeleteRecord}
        initialTab={activeTab}
      />

      {/* Set Reminder Modal */}
      <SetReminderModal
        isOpen={isSetReminderModalOpen}
        onClose={() => setIsSetReminderModalOpen(false)}
        onSave={handleSaveReminder}
        recordName={getDisplayName()}
        recordType={recordType === 'people' || recordType === 'leads' || recordType === 'prospects' ? 'people' : 'companies'}
      />

      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-xl border border-gray-100 shadow-sm p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Note</h3>
            <textarea
              placeholder="Enter your note here..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement note saving
                  setIsAddNoteModalOpen(false);
                  showMessage('Note added successfully!');
                }}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Confirm Deletion</h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete this record? This will move it to the trash where it can be restored later.
            </p>
            <p className="text-sm text-muted mb-4">
              Please type <strong>{getDisplayName()}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Enter record name"
              className="w-full p-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-sm bg-hover text-gray-700 rounded-md hover:bg-loading-bg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading || normalizeString(deleteConfirmName) !== normalizeString(getDisplayName())}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  loading || normalizeString(deleteConfirmName) !== normalizeString(getDisplayName())
                    ? 'bg-gray-300 text-muted cursor-not-allowed'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Action Modal */}
      <CompleteActionModal
        isOpen={isAddActionModalOpen}
        onClose={() => setIsAddActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        personName={record?.fullName || record?.name || 'Unknown'}
        companyName={record?.company?.name || record?.company || ''}
        personId={['leads', 'people', 'prospects', 'speedrun'].includes(recordType) ? record?.id : undefined}
        companyId={(() => {
          // Only include companyId if it's a valid company ID (not just a string name)
          // For companies record type, use the record ID
          if (recordType === 'companies') {
            return record?.id;
          }
          // For other record types, only use companyId if it exists and is a valid ID format
          // Company IDs are typically ULIDs (26 chars) or numeric strings
          const companyId = record?.companyId || record?.company?.id;
          // Only return companyId if it exists and looks like a valid ID (not just a company name string)
          if (companyId && typeof companyId === 'string' && (companyId.length > 10 || /^[0-9]+$/.test(companyId))) {
            return companyId;
          }
          return undefined;
        })()}
        section={recordType}
        isLoading={loading}
      />

      {/* Add Person to Company Modal */}
      {(() => {
        // Show for companies and for speedrun/leads/prospects company records
        const isCompanyRecord = recordType === 'companies' ||
                               (recordType === 'speedrun' && record?.recordType === 'company') ||
                               (recordType === 'leads' && record?.isCompanyLead === true) ||
                               (recordType === 'prospects' && record?.isCompanyLead === true);
        
        if (isCompanyRecord) {
          return (
            <AddPersonToCompanyModal
              isOpen={isAddPersonModalOpen}
              onClose={() => setIsAddPersonModalOpen(false)}
              companyId={record?.id}
              companyName={record?.name || record?.companyName || record?.company || ''}
              onPersonAdded={handlePersonAdded}
            />
          );
        }
        return null;
      })()}

      {/* Add Company Modal */}
      {(recordType === 'people' || recordType === 'leads' || recordType === 'prospects') && (
        <AddCompanyModal
          isOpen={isAddCompanyModalOpen}
          onClose={() => setIsAddCompanyModalOpen(false)}
          onCompanyAdded={handleCompanyAdded}
          section={recordType}
        />
      )}

      {/* Snooze Date Picker Modal */}
      {isDatePickerModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-xl border border-gray-100 shadow-sm p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Choose Snooze Date</h3>
              <button
                onClick={() => {
                  setIsDatePickerModalOpen(false);
                  setSelectedSnoozeDate(null);
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <DatePicker
                value={selectedSnoozeDate || undefined}
                onChange={(date) => setSelectedSnoozeDate(date)}
                placeholder="Select date"
                className="w-full"
                inModal={true}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDatePickerModalOpen(false);
                  setSelectedSnoozeDate(null);
                }}
                className="px-4 py-2 text-sm bg-background text-gray-700 border border-border rounded-md hover:bg-panel-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedSnoozeDate) {
                    handleSnoozeOption('choose-date', selectedSnoozeDate);
                    setIsDatePickerModalOpen(false);
                    setSelectedSnoozeDate(null);
                  }
                }}
                disabled={!selectedSnoozeDate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Upload Modal - TEMPORARILY COMMENTED OUT */}
      {/*
      <ProfileImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSave={handleImageUpload}
        currentImageUrl={getProfileImageUrl()}
        personName={getDisplayName()}
      />
      */}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        isLoading={loading}
      />


      {/* Edit Record Modal */}
      {isEditRecordModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-xl border border-gray-100 shadow-sm p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-edit-modal>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {(() => {
                  // Check if this is a company-only record
                  const isCompanyRecord = (recordType === 'speedrun' && record?.recordType === 'company') ||
                                         (recordType === 'leads' && record?.isCompanyLead === true) ||
                                         (recordType === 'prospects' && record?.isCompanyLead === true);
                  
                  if (isCompanyRecord) {
                    return 'Update Company';
                  }
                  
                  return recordType === 'leads' ? 'Update Lead' : 
                         recordType === 'prospects' ? 'Update Prospect' :
                         recordType === 'opportunities' ? 'Update Opportunity' :
                         recordType === 'companies' ? 'Update Company' :
                         recordType === 'people' ? 'Update Person' :
                         recordType === 'clients' ? 'Update Client' :
                         recordType === 'partners' ? 'Update Partner' :
                         'Update Record';
                })()}
              </h3>
              <button
                onClick={() => setIsEditRecordModalOpen(false)}
                className="text-muted hover:text-muted transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-border mb-6">
              <nav className="-mb-px flex space-x-8">
                {(recordType === 'companies' ? [
                  { id: 'overview', label: 'Overview' },
                  { id: 'strategy', label: 'Strategy' },
                  { id: 'timeline', label: 'Actions' },
                  { id: 'news', label: 'News' },
                  { id: 'buyer-groups', label: 'Buyer Group' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'delete', label: 'Delete' }
                ] : [
                  { id: 'overview', label: 'Overview' },
                  { id: 'strategy', label: 'Strategy' },
                  { id: 'actions', label: 'Actions' },
                  { id: 'career', label: 'Career' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'delete', label: 'Delete' }
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEditTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeEditTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-muted hover:text-gray-700 hover:border-border'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <form id="edit-record-form" onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {activeEditTab === 'overview' && (
                <div className="space-y-6">
                  {recordType === 'companies' ? (
                    <>
                      {/* Company Information */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">Company Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                            <input
                              type="text"
                              name="name"
                              defaultValue={formatFieldValue(record?.name || record?.companyName, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter company name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                            <input
                              type="text"
                              name="legalName"
                              defaultValue={formatFieldValue(record?.legalName, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                              type="url"
                              name="website"
                              defaultValue={formatFieldValue(record?.website, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              name="phone"
                              defaultValue={formatFieldValue(record?.phone, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            name="description"
                            defaultValue={formatFieldValue(record?.description, '')}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="-"
                          />
                        </div>
                      </div>

                      {/* Business Details */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">Business Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <input
                              type="text"
                              name="industry"
                              defaultValue={formatFieldValue(record?.industry, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Employees</label>
                            <select
                              name="size"
                              defaultValue={record?.size || ''}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-</option>
                              <option value="1-10">1-10 employees</option>
                              <option value="11-50">11-50 employees</option>
                              <option value="51-200">51-200 employees</option>
                              <option value="201-500">201-500 employees</option>
                              <option value="501-1000">501-1000 employees</option>
                              <option value="1000+">1000+ employees</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                            <input
                              type="number"
                              name="foundedYear"
                              min="1800"
                              max="2024"
                              defaultValue={formatFieldValue(record?.foundedYear, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              name="status"
                              defaultValue={record?.status || 'ACTIVE'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="PROSPECT">Prospect</option>
                              <option value="CLIENT">Client</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Basic Information */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              defaultValue={formatFieldValue(record?.firstName, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.firstName) ? '' : '-'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              defaultValue={formatFieldValue(record?.lastName, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.lastName) ? '' : '-'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              name="jobTitle"
                              defaultValue={formatFieldValue(record?.title || record?.jobTitle, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.title || record?.jobTitle) ? '' : '-'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <CompanySelector
                              value={record?.company || record?.companyName || ''}
                              onChange={(company) => {
                                // Handle company selection - this would need to be connected to form state
                                console.log('Company selected:', company);
                              }}
                              placeholder="Search or add company..."
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input
                              type="text"
                              name="department"
                              defaultValue={formatFieldValue(record?.department, '')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.department) ? '' : '-'}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">Bio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                            <select
                              name="status"
                              defaultValue={record?.status || 'active'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="qualified">Qualified</option>
                              <option value="cold">Cold</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Level</label>
                            <select
                              name="engagementLevel"
                              defaultValue={record?.engagementLevel || 'medium'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Influence Level</label>
                            <select
                              name="influenceLevel"
                              defaultValue={record?.influenceLevel || 'medium'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Decision Power</label>
                            <select
                              name="decisionPower"
                              defaultValue={record?.decisionPower || 'limited'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="high">High</option>
                              <option value="moderate">Moderate</option>
                              <option value="limited">Limited</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              name="priority"
                              defaultValue={record?.priority || 'medium'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Group Member</label>
                            <select
                              name="isBuyerGroupMember"
                              defaultValue={record?.isBuyerGroupMember ? 'yes' : 'no'}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeEditTab === 'intelligence' && (
                <div className="space-y-6">
                  {/* Intelligence Profile */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Intelligence Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Strategy</label>
                        <select
                          name="engagementStrategy"
                          defaultValue={record?.engagementStrategy || 'standard'}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="standard">Standard Outreach</option>
                          <option value="personalized">Personalized</option>
                          <option value="executive">Executive</option>
                          <option value="technical">Technical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Group Optimized</label>
                        <select
                          name="buyerGroupOptimized"
                          defaultValue={record?.buyerGroupOptimized ? 'yes' : 'no'}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seniority</label>
                        <select
                          name="seniority"
                          defaultValue={record?.seniority || 'mid-level'}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="executive">Executive</option>
                          <option value="senior">Senior</option>
                          <option value="mid-level">Mid-Level</option>
                          <option value="junior">Junior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Communication Style</label>
                        <select
                          name="communicationStyle"
                          defaultValue={record?.communicationStyle || 'professional'}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="technical">Technical</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Key Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Score</label>
                        <input
                          type="number"
                          name="engagementScore"
                          min="0"
                          max="100"
                          defaultValue={record?.engagementScore || ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={record?.engagementScore ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Influence Score</label>
                        <input
                          type="number"
                          name="influenceScore"
                          min="0"
                          max="100"
                          defaultValue={record?.influenceScore || ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={record?.influenceScore ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Decision Power Score</label>
                        <input
                          type="number"
                          name="decisionPowerScore"
                          min="0"
                          max="100"
                          defaultValue={record?.decisionPowerScore || ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={record?.decisionPowerScore ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Warmth</label>
                        <select
                          name="relationshipWarmth"
                          defaultValue={record?.relationshipWarmth || 'cold'}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="warm">Warm</option>
                          <option value="neutral">Neutral</option>
                          <option value="cold">Cold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'career' && (
                <div className="space-y-6">
                  {/* Current Role */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Current Role</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          name="careerJobTitle"
                          defaultValue={formatFieldValue(record?.title || record?.jobTitle, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.title || record?.jobTitle) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <CompanySelector
                          value={record?.company || record?.companyName || ''}
                          onChange={(company) => {
                            // Handle company selection - this would need to be connected to form state
                            console.log('Company selected:', company);
                          }}
                          placeholder="Search or add company..."
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input
                          type="text"
                          name="careerDepartment"
                          defaultValue={formatFieldValue(record?.department, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.department) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.industry, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.industry) ? '' : '-'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Background */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Professional Background</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          defaultValue={record?.yearsExperience || ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={record?.yearsExperience ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                        <select
                          defaultValue={record?.educationLevel || ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{record?.educationLevel ? '' : '-'}</option>
                          <option value="high-school">High School</option>
                          <option value="associate">Associate</option>
                          <option value="bachelor">Bachelor's</option>
                          <option value="master">Master's</option>
                          <option value="phd">PhD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.skills, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.skills) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.certifications, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.certifications) ? '' : '-'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'activity' && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue={formatFieldValue(record?.email, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.email) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          defaultValue={formatFieldValue(record?.phone, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.phone) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <input
                          type="url"
                          defaultValue={formatFieldValue(record?.linkedinUrl || record?.linkedin, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.linkedinUrl || record?.linkedin) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.location || record?.city, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.location || record?.city) ? '' : '-'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Engagement History */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Engagement History</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact Date</label>
                        <input
                          type="date"
                          defaultValue={record?.lastContactDate ? new Date(record.lastContactDate).toISOString().split('T')[0] : ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
                        <input
                          type="date"
                          defaultValue={record?.nextActionDate ? new Date(record.nextActionDate).toISOString().split('T')[0] : ''}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.nextAction, '')}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.nextAction) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Best Contact Time</label>
                        <select
                          defaultValue={record?.bestContactTime || 'morning'}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="anytime">Anytime</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="text-center py-12 text-muted">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Actions Yet</h3>
                    <p className="text-sm text-muted mb-4">
                      Company timeline activities will appear here when available.
                    </p>
                    <p className="text-xs text-muted">
                      Actions, meetings, and other company-related activities will be displayed in this timeline.
                    </p>
                  </div>
                </div>
              )}


              {activeEditTab === 'buyer-groups' && (
                <div className="space-y-6">
                  <div className="text-center py-12 text-muted">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Buyer Groups</h3>
                    <p className="text-sm text-muted mb-4">
                      Buyer group information will appear here when available.
                    </p>
                    <p className="text-xs text-muted">
                      Information about decision-making groups and key stakeholders will be displayed here.
                    </p>
                  </div>
                </div>
              )}

              {activeEditTab === 'notes' && (
                <div className="space-y-6">
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={8}
                      defaultValue={formatFieldValue(record?.notes, '')}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={formatFieldValue(record?.notes) ? '' : '-'}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      defaultValue={formatArrayValue(record?.tags, '')}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formatArrayValue(record?.tags) ? '' : '-'}
                    />
                  </div>

                  {/* Value Driver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value Driver</label>
                    <input
                      type="text"
                      defaultValue={formatFieldValue(record?.valueDriver, '')}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formatFieldValue(record?.valueDriver) ? '' : '-'}
                    />
                  </div>
                </div>
              )}

              {activeEditTab === 'delete' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Delete Record
                    </h3>
                    <p className="text-sm text-muted mb-6">
                      This action cannot be undone. This will soft delete the record and remove it from your active lists.
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Are you sure you want to delete this record?
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            To confirm, type <strong>"{record?.fullName || record?.name || 'this record'}"</strong> in the box below:
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                      Type the name to confirm deletion
                    </label>
                    <input
                      id="delete-confirm"
                      type="text"
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder={`Type "${getDisplayName()}" to confirm`}
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              {activeEditTab === 'delete' ? (
                <>
                  <button
                    onClick={() => {
                      setDeleteConfirmName('');
                      setActiveEditTab('overview');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteRecordFromModal}
                    disabled={loading || normalizeString(deleteConfirmName) !== normalizeString(getDisplayName())}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Deleting...' : 'Delete Record'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditRecordModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    className="px-4 py-2 text-sm font-medium text-info-text bg-info-bg border border-info-border rounded-lg hover:bg-info hover:text-button-text transition-colors"
                  >
                    Complete ({getCommonShortcut('SUBMIT')})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Default Tab Components
function ActivityTab({ record, recordType }: { record: any; recordType: string }) {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const mockActivities = [
          {
            id: '1',
            type: 'email',
            subject: `Email sent to ${record?.fullName || record?.name || 'Contact'}`,
            description: 'Initial outreach email sent',
            outcome: null,
            status: 'completed',
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            duration: null,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: '2',
            type: 'call',
            subject: `Phone call to ${record?.fullName || record?.name || 'Contact'}`,
            description: 'Follow-up call attempt',
            outcome: 'no-answer',
            status: 'completed',
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            duration: 0,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: '3',
            type: 'meeting',
            subject: `Discovery call with ${record?.fullName || record?.name || 'Contact'}`,
            description: 'Discovery call to understand needs',
            outcome: 'positive',
            status: 'completed',
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            duration: 30,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            id: '4',
            type: 'linkedin',
            subject: `LinkedIn connection request sent`,
            description: 'Sent connection request with personalized note',
            outcome: 'pending',
            status: 'completed',
            completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            duration: null,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ];
        setActivities(mockActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (record?.id) {
      loadActivities();
    }
  }, [record?.id, record?.fullName, record?.name]);

  // Normalize activity type to one of the 4 main types
  const normalizeActivityType = (type: string): 'email' | 'linkedin' | 'call' | 'meeting' => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('email')) return 'email';
    if (lowerType.includes('linkedin')) return 'linkedin';
    if (lowerType.includes('call') || lowerType.includes('phone')) return 'call';
    if (lowerType.includes('meeting') || lowerType.includes('discovery')) return 'meeting';
    
    // Default fallback
    return 'email';
  };

  const getActivityIcon = (type: string) => {
    const normalizedType = normalizeActivityType(type);
    
    switch (normalizedType) {
      case 'email':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'call':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'meeting':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: string, outcome?: string) => {
    if (status === 'completed') {
      if (outcome === 'positive') return 'text-green-600 bg-green-50';
      if (outcome === 'negative' || outcome === 'no-answer') return 'text-red-600 bg-red-50';
      return 'text-muted bg-panel-background';
    }
    if (status === 'planned' || status === 'scheduled') return 'text-blue-600 bg-blue-50';
    return 'text-muted bg-panel-background';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <CompanyDetailSkeleton message="Loading company details..." />;
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2">
          Recent Activity
        </h3>
        
        {activities['length'] === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-muted">No activities recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                <div className={`p-2 rounded ${getStatusColor(activity.status, activity.outcome)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-muted uppercase tracking-wide">
                        {normalizeActivityType(activity.type)}
                      </span>
                      <span className="text-sm font-medium text-foreground">{activity.subject}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {formatDate(activity.completedAt || activity.createdAt)}
                    </span>
                  </div>
                  {activity['description'] && (
                    <p className="text-sm text-muted mt-1">{activity.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status, activity.outcome)}`}>
                      {activity.status}
                    </span>
                    {activity['outcome'] && activity.outcome !== 'null' && (
                      <span className="text-xs text-muted">
                        {activity.outcome}
                      </span>
                    )}
                    {activity.duration !== null && activity.duration !== undefined && (
                      <span className="text-xs text-muted">
                        {activity.duration}min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Activity Button */}
        <button className="w-full mt-4 px-4 py-2 border border-border rounded-md text-sm font-medium text-gray-700 hover:bg-panel-background transition-colors">
          Add Activity
        </button>
      </div>
    </div>
  );
}

function OverviewTab({ record, recordType, onSave }: { record: any; recordType: string; onSave: (field: string, value: string, recordId: string, recordType: string) => Promise<void> }) {
  // Create a wrapper function that adapts the signature for InlineEditField
  const handleInlineSave = async (field: string, value: string) => {
    return onSave(field, value, record?.id || '', recordType);
  };

  const getStatusColor = (status?: string): string => {
    if (!status) return 'bg-hover text-foreground';
    const statusLower = status.toLowerCase();
    if (['new', 'uncontacted'].includes(statusLower)) return 'bg-status-new-bg text-status-new-text';
    if (['contacted', 'responded'].includes(statusLower)) return 'bg-status-contacted-bg text-status-contacted-text';
    if (['qualified', 'hot'].includes(statusLower)) return 'bg-status-qualified-bg text-status-qualified-text';
    if (['closed_won', 'won'].includes(statusLower)) return 'bg-status-won-bg text-status-won-text';
    if (['closed_lost', 'lost'].includes(statusLower)) return 'bg-status-lost-bg text-status-lost-text';
    return 'bg-hover text-foreground';
  };

  const getPriorityColor = (priority?: string): string => {
    if (!priority) return 'bg-hover text-foreground';
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'high') return 'bg-priority-high-bg text-priority-high-text';
    if (priorityLower === 'medium') return 'bg-priority-medium-bg text-priority-medium-text';
    if (priorityLower === 'low') return 'bg-priority-low-bg text-priority-low-text';
    return 'bg-hover text-foreground';
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Stage</label>
              <InlineEditField
                value={record?.status || 'new'}
                field="status"
                recordId={record?.id || ''}
                recordType={recordType}
                type="text"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Full Name</label>
              <InlineEditField
                value={record?.fullName || record?.name || ''}
                field="fullName"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter full name"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">First Name</label>
                <InlineEditField
                  value={record?.firstName || ''}
                  field="firstName"
                  recordId={record?.id || ''}
                  recordType={recordType}
                  placeholder="First name"
                  onSave={handleInlineSave}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Last Name</label>
                <InlineEditField
                  value={record?.lastName || ''}
                  field="lastName"
                  recordId={record?.id || ''}
                  recordType={recordType}
                  placeholder="Last name"
                  onSave={handleInlineSave}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Title</label>
              <InlineEditField
                value={record?.title || record?.jobTitle || ''}
                field="title"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter title"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Department</label>
              <InlineEditField
                value={record?.department || ''}
                field="department"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter department"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Priority</label>
              <InlineEditField
                value={record?.priority || 'medium'}
                field="priority"
                recordId={record?.id || ''}
                recordType={recordType}
                type="text"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Role</label>
              <InlineEditField
                value={record?.role || ''}
                field="role"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="select"
                options={[
                  { value: '', label: 'Select Role' },
                  { value: 'Decision Maker', label: 'Decision Maker' },
                  { value: 'Champion', label: 'Champion' },
                  { value: 'Stakeholder', label: 'Stakeholder' },
                  { value: 'Blocker', label: 'Blocker' },
                  { value: 'Introducer', label: 'Introducer' }
                ]}
                placeholder="Select role"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Email</label>
              <InlineEditField
                value={record?.email || ''}
                field="email"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="email"
                placeholder="Enter email address"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Work Email</label>
              <InlineEditField
                value={record?.workEmail || ''}
                field="workEmail"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="email"
                placeholder="Enter work email"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Personal Email</label>
              <InlineEditField
                value={record?.personalEmail || ''}
                field="personalEmail"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="email"
                placeholder="Enter personal email"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Phone</label>
              <InlineEditField
                value={record?.phone || ''}
                field="phone"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="tel"
                placeholder="Enter phone number"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Mobile Phone</label>
              <InlineEditField
                value={record?.mobilePhone || ''}
                field="mobilePhone"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="tel"
                placeholder="Enter mobile phone"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">LinkedIn</label>
              {console.log(`🔍 [LINKEDIN DEBUG] OverviewTab LinkedIn field:`, {
                recordId: record?.id,
                linkedinUrl: record?.linkedinUrl,
                linkedin: record?.linkedin,
                finalValue: record?.linkedinUrl || record?.linkedin || '',
                recordType
              })}
              <InlineEditField
                value={record?.linkedinUrl || record?.linkedin || ''}
                field="linkedinUrl"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="url"
                placeholder="Enter LinkedIn URL"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2">Company Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Company</label>
              <InlineEditField
                value={record?.name || record?.company || record?.companyName || ''}
                field="name"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter company name"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Company Domain</label>
              <InlineEditField
                value={record?.companyDomain || record?.domain || ''}
                field="domain"
                recordId={record?.id || ''}
                recordType={recordType}
                inputType="url"
                placeholder="Enter company domain"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Industry</label>
              <InlineEditField
                value={record?.industry || ''}
                field="industry"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter industry"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Total Employees</label>
              <InlineEditField
                value={record?.employeeCount || record?.size || ''}
                field="employeeCount"
                recordId={record?.id || ''}
                recordType={recordType}
                type="text"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2">Location Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">City</label>
              <InlineEditField
                value={record?.city || ''}
                field="city"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter city"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Country</label>
              <InlineEditField
                value={record?.country || ''}
                field="country"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter country"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Address</label>
              <InlineEditField
                value={record?.address || ''}
                field="address"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter address"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">Postal Code</label>
              <InlineEditField
                value={record?.postalCode || ''}
                field="postalCode"
                recordId={record?.id || ''}
                recordType={recordType}
                placeholder="Enter postal code"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Description */}
      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2">Notes & Description</h3>
        <div className="bg-panel-background p-4 rounded-lg">
          <InlineEditField
            value={record?.notes || record?.description || ''}
            field="notes"
            recordId={record?.id || ''}
            recordType={recordType}
            type="textarea"
            placeholder="Add notes or description..."
            onSave={handleInlineSave}
            className="text-sm text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}

function CompanyTab({ record, recordType }: { record: any; recordType: string }) {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Company Details</h3>
        <div className="text-center py-12 text-muted">
          <p className="text-sm">Company enrichment data will appear here when available.</p>
        </div>
      </div>
    </div>
  );
}



export function NotesTab({ record, recordType, setPendingSaves, setLocalRecord, localRecord, onRecordUpdate }: { 
  record: any; 
  recordType: string;
  setPendingSaves: React.Dispatch<React.SetStateAction<Set<string>>>;
  setLocalRecord: React.Dispatch<React.SetStateAction<any>>;
  localRecord: any;
  onRecordUpdate?: (updatedRecord: any) => void;
}) {
  const { updateCurrentRecord } = useRecordContext();
  
  // Initialize notes instantly from record prop - memoized to prevent unnecessary recalculations
  // CRITICAL: Prioritize localRecord.notes if available, as it's updated immediately after save
  const getInitialNotes = React.useMemo(() => {
    // First check localRecord (updated immediately after save)
    const localNotes = localRecord?.notes;
    if (localNotes) {
      if (typeof localNotes === 'string') {
        return localNotes;
      } else if (typeof localNotes === 'object' && localNotes !== null) {
        return localNotes.content || localNotes.text || '';
      }
    }
    
    // Fallback to record prop
    if (record?.notes) {
      if (typeof record.notes === 'string') {
        return record.notes;
      } else if (typeof record.notes === 'object' && record.notes !== null) {
        return record.notes.content || record.notes.text || '';
      }
    }
    return '';
  }, [record?.notes, localRecord?.notes]);

  // Utility functions for notes statistics
  const getWordCount = (text: string) => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    return text ? text.length : 0;
  };

  const [notes, setNotes] = React.useState<string>(getInitialNotes);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(
    (record?.updatedAt && getInitialNotes.trim().length > 0) 
      ? new Date(record.updatedAt) 
      : null
  );
  const [lastSavedNotes, setLastSavedNotes] = React.useState<string>(getInitialNotes);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState<boolean>(false);
  const [isFocused, setIsFocused] = React.useState<boolean>(false);
  
  // Track if initial mount is complete to prevent refresh during active editing
  const isInitialMountRef = React.useRef(true);
  const previousRecordIdRef = React.useRef<string | undefined>(record?.id);
  const notesRef = React.useRef<string>(getInitialNotes);
  const isTypingRef = React.useRef(false); // Track if user is actively typing
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null); // Track typing timeout
  const lastSavedTimestampRef = React.useRef<number>(0); // Track when notes were last saved

  // Update ref whenever notes change
  React.useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Reset state when record ID changes (user navigates to different record)
  React.useEffect(() => {
    if (record?.id !== previousRecordIdRef.current) {
      console.log('🔄 [NOTES] Record ID changed, resetting notes state:', { 
        previousId: previousRecordIdRef.current, 
        newId: record?.id,
        initialNotes: getInitialNotes 
      });
      previousRecordIdRef.current = record?.id;
      isInitialMountRef.current = true;
      setNotes(getInitialNotes);
      setLastSavedNotes(getInitialNotes);
      notesRef.current = getInitialNotes;
      setHasUnsavedChanges(false);
      setSaveStatus('idle');
      lastSavedTimestampRef.current = 0; // Reset timestamp on record change
      if (record?.updatedAt && getInitialNotes.trim().length > 0) {
        setLastSavedAt(new Date(record.updatedAt));
      } else {
        setLastSavedAt(null);
      }
    }
  }, [record?.id, getInitialNotes]);

  // Sync notes state when record.notes prop changes (after initial mount)
  // Simplified to prevent glitches - only sync when absolutely necessary
  React.useEffect(() => {
    // Skip sync entirely during initial mount or if user is actively editing
    if (isInitialMountRef.current || isFocused || isTypingRef.current || saveStatus === 'saving' || hasUnsavedChanges) {
      return;
    }

    const newNotes = getInitialNotes;
    const timeSinceLastSave = Date.now() - lastSavedTimestampRef.current;
    const wasJustSaved = timeSinceLastSave < 10000; // Prevent syncing for 10 seconds after save
    
    // Only sync if notes actually changed and we haven't just saved
    if (newNotes !== notes && 
        newNotes !== lastSavedNotes &&
        !wasJustSaved) {
      // Use requestAnimationFrame to batch the update and prevent visual glitches
      requestAnimationFrame(() => {
        if (!isFocused && !isTypingRef.current && saveStatus !== 'saving' && !hasUnsavedChanges) {
          setNotes(newNotes);
          setLastSavedNotes(newNotes);
        }
      });
    }
  }, [getInitialNotes, notes, lastSavedNotes, isFocused, saveStatus, hasUnsavedChanges]);

  // Silently refresh notes from API in background (no loading state)
  // Simplified to prevent glitches - only refresh on record ID change, not continuously
  React.useEffect(() => {
    const refreshNotes = async () => {
      if (!record?.id) return;

      const isInitialMount = isInitialMountRef.current;
      
      // On initial mount, use notes from props (already set in getInitialNotes)
      // Only refresh from API if we don't have notes and user isn't typing
      if (isInitialMount) {
        // Mark initial mount as complete immediately to prevent sync conflicts
        isInitialMountRef.current = false;
        
        // Get current notes value
        const currentInitialNotes = notesRef.current || notes;
        
        // Only fetch from API if we don't have notes from props
        if (!currentInitialNotes || currentInitialNotes.trim().length === 0) {
          try {
            const apiEndpoint = recordType === 'companies' 
              ? `/api/v1/companies/${record.id}`
              : `/api/v1/people/${record.id}`;

            const response = await fetch(apiEndpoint, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data?.notes !== undefined) {
                const freshNotes = typeof result.data.notes === 'string' 
                  ? result.data.notes 
                  : result.data.notes?.content || result.data.notes?.text || '';
                
                if (freshNotes && freshNotes.trim().length > 0) {
                  // Use requestAnimationFrame to batch update and prevent glitches
                  requestAnimationFrame(() => {
                    setNotes(freshNotes);
                    setLastSavedNotes(freshNotes);
                    notesRef.current = freshNotes;
                    if (result.data.updatedAt) {
                      setLastSavedAt(new Date(result.data.updatedAt));
                    }
                  });
                }
              }
            }
          } catch (error) {
            // Silently fail - user already has notes from record prop
          }
        }
        return;
      }
      
      // After initial mount, only refresh if user is not actively editing
      // Wait longer to ensure user has finished typing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (isTypingRef.current || isFocused || saveStatus === 'saving' || hasUnsavedChanges) {
        return;
      }
      
      try {
        const apiEndpoint = recordType === 'companies' 
          ? `/api/v1/companies/${record.id}`
          : `/api/v1/people/${record.id}`;

        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.notes !== undefined) {
            const freshNotes = typeof result.data.notes === 'string' 
              ? result.data.notes 
              : result.data.notes?.content || result.data.notes?.text || '';
            
            const currentNotes = notesRef.current;
            const timeSinceLastSave = Date.now() - lastSavedTimestampRef.current;
            const wasJustSaved = timeSinceLastSave < 10000; // Don't overwrite if just saved
            
            // Only update if notes changed, not just saved, and user isn't editing
            if (freshNotes !== currentNotes && 
                !wasJustSaved && 
                !isFocused && 
                !isTypingRef.current && 
                saveStatus !== 'saving' && 
                !hasUnsavedChanges) {
              // Use requestAnimationFrame to batch update and prevent glitches
              requestAnimationFrame(() => {
                if (!isFocused && !isTypingRef.current && saveStatus !== 'saving' && !hasUnsavedChanges) {
                  setNotes(freshNotes);
                  setLastSavedNotes(freshNotes);
                  notesRef.current = freshNotes;
                  if (result.data.updatedAt) {
                    setLastSavedAt(new Date(result.data.updatedAt));
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        // Silently fail - user already has notes from record prop
      }
    };

    // Only refresh on record ID change
    refreshNotes();
  }, [record?.id, recordType]);

  // Auto-save function using v1 APIs
  const saveNotes = React.useCallback(async (notesContent: string) => {
    if (!record?.id) {
      console.log('❌ [NOTES] No record ID, skipping save');
      return;
    }

    // Prevent saving if content hasn't changed since last save
    if (notesContent === lastSavedNotes && saveStatus !== 'error') {
      console.log('🔄 [NOTES] Content unchanged since last save, skipping save');
      return;
    }

    try {
      // Only set saving status if not already saving to prevent status flickering
      if (saveStatus !== 'saving') {
      setSaveStatus('saving');
      }
      setHasUnsavedChanges(false);
      
      // Suppress console logs during autosave to reduce noise (only log errors)
      // console.log('💾 [NOTES] Starting save for:', { recordId: record.id, recordType, contentLength: notesContent.length });
      
      // Add notes to pending saves to prevent record prop sync from overwriting
      setPendingSaves(prev => new Set(prev).add('notes'));

      // Map record types to v1 API endpoints
      const apiEndpoint = recordType === 'companies' 
        ? `/api/v1/companies/${record.id}`
        : `/api/v1/people/${record.id}`;

      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesContent }),
      });

      console.log('📡 [NOTES] API response:', { status: response.status, ok: response.ok, endpoint: apiEndpoint });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [NOTES] API error response:', errorText);
        throw new Error(`Failed to save notes: ${response.statusText}`);
      }

      const result = await response.json();
      // Suppress success logs during autosave to reduce noise
      // console.log('✅ [NOTES] Save result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save notes');
      }

      // Only update status if it's not already saved to prevent unnecessary re-renders
      if (saveStatus !== 'saved') {
      setSaveStatus('saved');
      }
      setLastSavedAt(new Date());
      setLastSavedNotes(notesContent);
      lastSavedTimestampRef.current = Date.now(); // Track when notes were saved
      
      // Reset typing state after successful save
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Clear saved status after 2 seconds to reduce visual distraction
      setTimeout(() => {
        if (saveStatus === 'saved' && notesContent === lastSavedNotes) {
          setSaveStatus('idle');
        }
      }, 2000);
      
      // Update sessionStorage cache to prevent stale data on navigation
      if (typeof window !== 'undefined' && record?.id) {
        const cacheKeys = [
          `cached-${recordType}-${record.id}`,
          `cached-speedrun-${record.id}`, // Also update speedrun cache for people records
          `current-record-${recordType}`
        ];
        
        cacheKeys.forEach(key => {
          const cachedData = sessionStorage.getItem(key);
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData);
              const updatedCache = typeof parsed.data === 'object' && parsed.data 
                ? { ...parsed, data: { ...parsed.data, notes: notesContent, updatedAt: new Date().toISOString() } }
                : { ...parsed, notes: notesContent, updatedAt: new Date().toISOString() };
              sessionStorage.setItem(key, JSON.stringify(updatedCache));
              console.log('🔄 [NOTES] Updated cache:', key);
            } catch (e) {
              // If it's just a plain object, update directly
              try {
                const parsed = JSON.parse(cachedData);
                parsed.notes = notesContent;
                parsed.updatedAt = new Date().toISOString();
                sessionStorage.setItem(key, JSON.stringify(parsed));
                console.log('🔄 [NOTES] Updated cache (plain object):', key);
              } catch (err) {
                console.warn('⚠️ [NOTES] Failed to update cache:', err);
              }
            }
          }
        });
      }
      
      // Update local record state to reflect saved notes
      setLocalRecord((prev: any) => ({
        ...prev,
        notes: notesContent,
        updatedAt: new Date().toISOString()
      }));
      
      // Notify parent component of the update
      if (onRecordUpdate) {
        onRecordUpdate({
          ...record,
          ...localRecord,
          notes: notesContent,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Keep saved status persistent - don't auto-clear
      
    } catch (error) {
      console.error('❌ [NOTES] Error saving notes:', error);
      setSaveStatus('error');
      setHasUnsavedChanges(true); // Mark as having unsaved changes on error
      // Clear error status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Show user-friendly error message
      console.warn('⚠️ [NOTES] Save failed - changes will be retried automatically');
    } finally {
      // Remove notes from pending saves to allow record sync again
      setPendingSaves(prev => {
        const next = new Set(prev);
        next.delete('notes');
        return next;
      });
    }
  }, [record, recordType, lastSavedNotes, saveStatus, updateCurrentRecord, setPendingSaves, setLocalRecord, onRecordUpdate, localRecord]);

  // Handle notes change to track user editing
  const handleNotesChange = React.useCallback((newNotes: string) => {
    // Mark user as typing
    isTypingRef.current = true;
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to mark user as not typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      typingTimeoutRef.current = null;
    }, 2000);
    
    setNotes(newNotes);
    setHasUnsavedChanges(newNotes !== lastSavedNotes);
  }, [lastSavedNotes]);

  // Handle focus/blur to track editing state
  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
    isTypingRef.current = true; // Mark as typing when focused
  }, []);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
    // Mark as not typing after a short delay to allow for save operations
    setTimeout(() => {
      isTypingRef.current = false;
    }, 500);
  }, []);
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Notes Header with static auto-save message */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-background">
        <h2 className="text-lg font-semibold text-foreground">
          Notes
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            Notes auto-save
          </span>
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Save failed
            </span>
          )}
        </div>
      </div>
      
      {/* Notes Editor */}
      <div className="flex-1">
        <NotesEditor
          key={`notes-${record?.id || 'unknown'}`}
          value={notes}
          onChange={handleNotesChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Add your notes here..."
          autoSave={true}
          saveStatus={saveStatus}
          onSave={saveNotes}
          debounceMs={1000}
          lastSavedAt={lastSavedAt}
          className="h-full"
          showHeader={false}
        />
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-2 border-t border-border bg-background">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-4">
            <span>{getWordCount(notes)} words</span>
            <span>{getCharacterCount(notes)} characters</span>
          </div>
          <div className="text-muted">
            {getWordCount(notes) > 0 && (
              <span>
                {Math.ceil(getWordCount(notes) / 200)} min read
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IndustryTab({ record, recordType }: { record: any; recordType: string }) {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Industry Information</h3>
        <div className="text-center py-12 text-muted">
          <p className="text-sm">Industry data and insights will appear here when available.</p>
        </div>
      </div>
    </div>
  );
}

function CareerTab({ record, recordType }: { record: any; recordType: string }) {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Career Information</h3>
        <div className="text-center py-12 text-muted">
          <p className="text-sm">Career history and professional background will appear here when available.</p>
        </div>
      </div>
    </div>
  );
}

function LandminesTab({ record, recordType }: { record: any; recordType: string }) {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Landmines</h3>
        <div className="text-center py-12 text-muted">
          <p className="text-sm">Potential issues and red flags will appear here when available.</p>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ record, recordType }: { record: any; recordType: string }) {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const mockActivities = [
          {
            id: '1',
            type: 'email',
            subject: `Email sent to ${record?.fullName || record?.name || 'Contact'}`,
            description: 'Initial outreach email sent',
            outcome: null,
            status: 'completed',
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            duration: null,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: '2',
            type: 'call',
            subject: `Phone call to ${record?.fullName || record?.name || 'Contact'}`,
            description: 'Follow-up call attempt',
            outcome: 'no-answer',
            status: 'completed',
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            duration: 0,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: '3',
            type: 'meeting',
            subject: `Discovery call with ${record?.fullName || record?.name || 'Contact'}`,
            description: 'Discovery call to understand needs',
            outcome: 'positive',
            status: 'completed',
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            duration: 30,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ];
        setActivities(mockActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [record]);

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">History</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="sm" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-panel-background p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{activity.subject}</h4>
                    <p className="text-sm text-muted mt-1">{activity.description}</p>
                    <p className="text-xs text-muted mt-2">
                      {activity.completedAt.toLocaleDateString()} • {activity.type}
                    </p>
                  </div>
                  {activity['outcome'] && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity['outcome'] === 'positive' ? 'bg-success-bg text-success-text' :
                      activity['outcome'] === 'negative' ? 'bg-error-bg text-error-text' :
                      'bg-hover text-foreground'
                    }`}>
                      {activity.outcome}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No history available yet.</p>
          </div>
        )}
      </div>

      {/* Profile Popup - UniversalRecordTemplate Implementation */}
      {(() => {
        if (!profilePopupContext) {
          console.log('🔍 UniversalRecordTemplate Profile popup not available - no profilePopupContext');
          return false;
        }
        
        const shouldRender = profilePopupContext.isProfileOpen && profilePopupContext.profileAnchor;
        console.log('🔍 UniversalRecordTemplate Profile popup render check:', { 
          isProfileOpen: profilePopupContext.isProfileOpen, 
          profileAnchor: !!profilePopupContext.profileAnchor,
          profileAnchorElement: profilePopupContext.profileAnchor,
          user: !!pipelineUser,
          company,
          workspace,
          shouldRender
        });
        if (shouldRender) {
          console.log('✅ UniversalRecordTemplate ProfileBox SHOULD render - all conditions met');
        } else {
          console.log('❌ UniversalRecordTemplate ProfileBox will NOT render:', {
            missingProfileOpen: !profilePopupContext.isProfileOpen,
            missingProfileAnchor: !profilePopupContext.profileAnchor
          });
        }
        return shouldRender;
      })() && profilePopupContext && profilePopupContext.profileAnchor && (
        <div
          style={{
            position: "fixed",
            left: profilePopupContext.profileAnchor.getBoundingClientRect().left,
            bottom: window.innerHeight - profilePopupContext.profileAnchor.getBoundingClientRect().top + 5,
            zIndex: 9999,
          }}
        >
          <ProfileBox
            user={pipelineUser}
            company={company}
            workspace={workspace}
            isProfileOpen={profilePopupContext.isProfileOpen}
            setIsProfileOpen={profilePopupContext.setIsProfileOpen}
            userId={pipelineUser?.id}
            userEmail={pipelineUser?.email}
            isSellersVisible={true}
            setIsSellersVisible={() => {}}
            isRtpVisible={true}
            setIsRtpVisible={() => {}}
            isProspectsVisible={true}
            setIsProspectsVisible={() => {}}
            isLeadsVisible={true}
            setIsLeadsVisible={() => {}}
            isOpportunitiesVisible={true}
            setIsOpportunitiesVisible={() => {}}
            isCustomersVisible={false}
            setIsCustomersVisible={() => {}}
            isPartnersVisible={true}
            setIsPartnersVisible={() => {}}
            onThemesClick={() => {
              console.log('🎨 Themes clicked in UniversalRecordTemplate');
            }}
            onSignOut={() => {
              console.log('🚪 Sign out clicked in UniversalRecordTemplate');
            }}
          />
        </div>
      )}
    </div>
  );
}
