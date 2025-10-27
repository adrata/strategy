"use client";

import React, { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { authFetch } from '@/platform/api-fetch';
import { UpdateModal } from './UpdateModal';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { AddTaskModal } from './AddTaskModal';
import { AddPersonToCompanyModal } from './AddPersonToCompanyModal';
import { AddCompanyModal } from '@/platform/ui/components/AddCompanyModal';
import { CompanySelector } from './CompanySelector';
import { formatFieldValue, getCompanyName, formatDateValue, formatArrayValue } from './utils/field-formatters';
import { UnifiedAddActionButton } from '@/platform/ui/components/UnifiedAddActionButton';
import { TrashIcon, CameraIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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

// Record type-specific tab configurations
const getTabsForRecordType = (recordType: string, record?: any): TabConfig[] => {
  // Get company name for dynamic tab label
  const companyName = record?.company || record?.companyName || 'Company';
  
  switch (recordType) {
        case 'leads':
          return [
            { id: 'overview', label: 'Overview' },
            { id: 'actions', label: 'Actions' },
            { id: 'intelligence', label: 'Intelligence' },
            { id: 'company', label: 'Company' },
            { id: 'career', label: 'Career' },
            { id: 'notes', label: 'Notes' }
          ];
    case 'prospects':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'company', label: 'Company' },
        { id: 'career', label: 'Career' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'opportunities':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'deal-intel', label: 'Deal Intel' },
        { id: 'stakeholders', label: 'Stakeholders' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'close-plan', label: 'Close Plan' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'companies':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'news', label: 'News' },
        { id: 'people', label: 'People' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'people':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'company', label: 'Company' },
        { id: 'career', label: 'Career' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'speedrun':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'company', label: 'Company' },
        { id: 'actions', label: 'Actions' },
        { id: 'strategy', label: 'Intelligence' },
        { id: 'career', label: 'Career' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'clients':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'relationship', label: 'Relationship' },
        { id: 'business', label: 'Business' },
        { id: 'personal', label: 'Personal' },
        { id: 'success', label: 'Success' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'partners':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'partnership', label: 'Partnership' },
        { id: 'collaboration', label: 'Collaboration' },
        { id: 'performance', label: 'Performance' },
        { id: 'opportunities', label: 'Opportunities' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'sellers':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'actions', label: 'Actions' },
        { id: 'companies', label: 'Companies' },
        { id: 'performance', label: 'Performance' },
        { id: 'profile', label: 'Profile' },
        { id: 'notes', label: 'Notes' }
      ];
    default:
      return [
        { id: 'overview', label: 'Home' },
        { id: 'actions', label: 'Actions' },
        { id: 'company', label: companyName },
        { id: 'industry', label: 'Industry' },
        { id: 'career', label: 'Career' },
        { id: 'landmines', label: 'Landmines' },
        { id: 'notes', label: 'Notes' }
      ];
  }
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
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<Set<string>>(new Set());
  
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
        description: record?.description
      });
      
      // If there are recently updated fields, merge carefully to avoid overwriting local changes
      if (recentlyUpdatedFields.size > 0) {
        console.log(`🔄 [UNIVERSAL] Merging record prop with local changes, preserving recently updated fields:`, Array.from(recentlyUpdatedFields));
        setLocalRecord(prevLocalRecord => {
          const mergedRecord = { ...record };
          
          // Preserve recently updated fields from local record
          recentlyUpdatedFields.forEach(field => {
            if (prevLocalRecord && prevLocalRecord[field] !== undefined) {
              mergedRecord[field] = prevLocalRecord[field];
              console.log(`🔄 [UNIVERSAL] Preserving recently updated field '${field}': ${prevLocalRecord[field]}`);
            }
          });
          
          console.log(`🔄 [UNIVERSAL] Final merged record:`, {
            id: mergedRecord.id,
            tradingName: mergedRecord.tradingName,
            description: mergedRecord.description,
            updatedAt: mergedRecord.updatedAt
          });
          return mergedRecord;
        });
      } else {
        // No recently updated fields, safe to sync completely
        console.log(`🔄 [UNIVERSAL] Setting localRecord directly from record prop (no recently updated fields):`, {
          id: record.id,
          tradingName: record.tradingName,
          description: record.description,
          updatedAt: record.updatedAt
        });
        setLocalRecord(record);
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
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('overview');
  const [hasLoggedAction, setHasLoggedAction] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const tabs = useMemo(() => {
    return customTabs || getTabsForRecordType(recordType, record);
  }, [customTabs, recordType, record?.company, record?.companyName]);
  
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
            // Check if we're on a speedrun sprint page (Add Action) or individual record page (Start Speedrun)
            const isOnSprintPage = typeof window !== 'undefined' && window.location.pathname.includes('/speedrun/sprint');
            
            if (isOnSprintPage) {
              console.log('⌨️ [UniversalRecordTemplate] Add Action keyboard shortcut triggered');
              setIsAddActionModalOpen(true);
            } else {
              console.log('⌨️ [UniversalRecordTemplate] Start Speedrun keyboard shortcut triggered');
              // Navigate to speedrun/sprint page
              const currentPath = window.location.pathname;
              const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
              if (workspaceMatch) {
                const workspaceSlug = workspaceMatch[1];
                router.push(`/${workspaceSlug}/speedrun/sprint`);
              } else {
                router.push('/speedrun/sprint');
              }
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
    return localRecord?.name || 
           localRecord?.fullName || 
           (localRecord?.firstName && localRecord?.lastName ? `${localRecord.firstName} ${localRecord.lastName}` : '') ||
           localRecord?.companyName ||
           localRecord?.title ||
           'Unknown Record';
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
        const title = record?.title || record?.jobTitle;
        // 🎯 FIX: Show only title, not company
        return title || 'Unknown Title';
      case 'opportunities':
      case 'deals':
        return `${record?.stage || 'Unknown Stage'} • ${record?.amount || record?.value ? `$${(record.amount || record.value).toLocaleString()}` : 'No Amount'}`;
      case 'companies':
        // Generate strategic company context for sellers - size and growth stage
        const coresignalData = record?.customFields?.coresignalData;
        const categories = coresignalData?.categories_and_keywords || [];
        const employeeCount = coresignalData?.employees_count || record?.size || record?.employeeCount;
        
        // Extract industry for dynamic subtitle
        const industry = coresignalData?.industry || 
                         record?.industry || 
                         categories[0] || 
                         'company';
        const industryText = industry === 'company' ? 'company' : `${industry} company`;
        
        // Determine company size category based on real data
        let sizeCategory = '';
        if (employeeCount) {
          const count = parseInt(employeeCount.toString().replace(/\D/g, ''));
          if (count <= 50) {
            sizeCategory = 'Small';
          } else if (count <= 200) {
            sizeCategory = 'Mid-size';
          } else if (count <= 1000) {
            sizeCategory = 'Growing';
          } else {
            sizeCategory = 'Large';
          }
        } else {
          sizeCategory = 'Small'; // Default for unknown size
        }
        
        // Determine growth stage based on company age and context
        const foundedYear = coresignalData?.founded_year || record?.founded;
        let growthStage = '';
        if (foundedYear) {
          const currentYear = new Date().getFullYear();
          const age = currentYear - parseInt(foundedYear);
          if (age <= 5) {
            growthStage = 'startup';
          } else if (age <= 15) {
            growthStage = 'growing';
          } else {
            growthStage = 'established';
          }
        } else {
          growthStage = 'growing'; // Default assumption
        }
        
        // Combine size and growth stage for strategic context
               if (sizeCategory === 'Small' && growthStage === 'growing') {
                 return `Small, growing ${industryText}`;
               } else if (sizeCategory === 'Small' && growthStage === 'startup') {
                 return `Small, emerging ${industry === 'company' ? 'startup' : `${industry} startup`}`;
               } else if (sizeCategory === 'Mid-size' && growthStage === 'growing') {
                 return `Mid-size, expanding ${industryText}`;
               } else if (sizeCategory === 'Growing' && growthStage === 'established') {
                 return `Growing, established ${industryText}`;
               } else {
                 return `${sizeCategory}, ${growthStage} ${industryText}`;
               }
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
        if (recordType === 'companies') {
          // For companies, 'name' is the company name
          updatePayload['name'] = updatedData['name'].trim();
        } else {
          // For people, split name into firstName/lastName with validation
          const { firstName, lastName } = parseFullName(updatedData['name']);
          updatePayload['firstName'] = firstName || 'Unknown';
          updatePayload['lastName'] = lastName || 'User';
          updatePayload['fullName'] = updatedData['name'].trim();
        }
      }
      if ('firstName' in updatedData && updatedData['firstName'] !== undefined) {
        updatePayload['firstName'] = updatedData['firstName'] || 'Unknown';
      }
      if ('lastName' in updatedData && updatedData['lastName'] !== undefined) {
        updatePayload['lastName'] = updatedData['lastName'] || 'User';
      }
      if ('fullName' in updatedData && updatedData['fullName'] !== undefined) {
        updatePayload['fullName'] = updatedData['fullName'];
      }
      
      // Sync fullName when firstName or lastName are updated individually
      if (('firstName' in updatedData || 'lastName' in updatedData) && 
          (updatedData['firstName'] !== undefined || updatedData['lastName'] !== undefined)) {
        const firstName = updatedData['firstName'] !== undefined ? updatedData['firstName'] : (localRecord?.firstName || '');
        const lastName = updatedData['lastName'] !== undefined ? updatedData['lastName'] : (localRecord?.lastName || '');
        updatePayload['fullName'] = `${firstName} ${lastName}`.trim();
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
      
      if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') {
        // All people-related records use v1 people API
        console.log('📡 [UNIVERSAL] Making PATCH request to people API with payload:', updatePayload);
        result = await authFetch(`/api/v1/people/${localRecord.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
      } else if (recordType === 'companies') {
        // Use v1 companies API
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
            workspaceId: record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP',
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

      // Update local record state
      setLocalRecord(result.data);

      // Call the parent onRecordUpdate callback
      if (onRecordUpdate) {
        console.log('🔄 [UNIVERSAL] Calling onRecordUpdate callback');
        await onRecordUpdate(result.data);
      }
      
      // Update local record state with API response data
      const updatedRecord = {
        ...localRecord,
        ...updatedData,
        ...updatePayload,
        ...result.data // Include any additional data from API response
      };
      
      console.log('🔄 [UNIVERSAL] Updated local record state:', {
        originalRecord: localRecord,
        updateData: updatedData,
        updatePayload: updatePayload,
        apiResponse: result.data,
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
        const workspaceId = record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
        
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
        // The unified cache system uses keys like: adrata-cache-acquisition-os:v4:${workspaceId}:${userId}
        const cacheKeys = Object.keys(localStorage);
        cacheKeys.forEach(key => {
          if (key.startsWith('adrata-cache-acquisition-os:') && key.includes(workspaceId)) {
            localStorage.removeItem(key);
            console.log(`🗑️ [CACHE] Cleared unified cache: ${key}`);
          }
        });
        
        // Also clear SWR cache if available (used by useAdrataData)
        if ((window as any).__SWR_CACHE__) {
          const swrCache = (window as any).__SWR_CACHE__;
          const swrKeys = Array.from(swrCache.keys()) as string[];
          swrKeys.forEach((key: string) => {
            if (key.includes('acquisition-os') && key.includes(workspaceId)) {
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
            'acquisition-os:*'
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

  // Handle snooze functionality
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

  // Calculate snooze until date
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
      
      if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') {
        // All people-related records use v1 people API
        result = await authFetch(`/api/v1/people/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (recordType === 'companies') {
        // Use v1 companies API
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
              const workspaceId = record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
              
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
                if (key.startsWith('adrata-cache-acquisition-os:') && key.includes(workspaceId)) {
                  localStorage.removeItem(key);
                }
              });
              
              // Clear SWR cache
              if ((window as any).__SWR_CACHE__) {
                const swrCache = (window as any).__SWR_CACHE__;
                const swrKeys = Array.from(swrCache.keys()) as string[];
                swrKeys.forEach((key: string) => {
                  if (key.includes('acquisition-os') && key.includes(workspaceId)) {
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
                const workspaceId = record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
                
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
                  if (key.startsWith('adrata-cache-acquisition-os:') && key.includes(workspaceId)) {
                    localStorage.removeItem(key);
                  }
                });
                
                // Clear SWR cache
                if ((window as any).__SWR_CACHE__) {
                  const swrCache = (window as any).__SWR_CACHE__;
                  const swrKeys = Array.from(swrCache.keys()) as string[];
                  swrKeys.forEach((key: string) => {
                    if (key.includes('acquisition-os') && key.includes(workspaceId)) {
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
        'linkedinUrl', 'twitterHandle',
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
          'postalCode': 'postalCode'
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
        const { firstName, lastName } = parseFullName(value);
        updateData['firstName'] = firstName || '';
        updateData['lastName'] = lastName || '';
        updateData['fullName'] = value.trim();
        console.log(`🔄 [UNIVERSAL] Name field update - original: ${value}, firstName: ${updateData['firstName']}, lastName: ${updateData['lastName']}, fullName: ${updateData['fullName']}`);
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
      const isValueConsistent = actualSavedValue === value || actualSavedValue === undefined;
      
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
        const actualValue = result.data && result.data[apiField] !== undefined ? result.data[apiField] : value;
        
        const updatedRecord = {
          ...prev,
          [field]: actualValue,
          // Also update the API field name if different
          ...(apiField !== field ? { [apiField]: actualValue } : {}),
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
            firstName: updateData['firstName'],
            lastName: updateData['lastName'],
            fullName: updateData['fullName']
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
        
        // Use the actual value from API response for consistency
        const actualValue = result.data[apiField] !== undefined ? result.data[apiField] : value;
        mappedResponseData[field] = actualValue;
        
        const updatedRecord = { ...record, ...mappedResponseData };
        console.log(`🔍 [INLINE EDIT AUDIT] Calling onRecordUpdate with mapped result.data:`, {
          originalField: field,
          apiField: apiField,
          resultData: result.data,
          mappedResponseData: mappedResponseData,
          updatedRecord: updatedRecord,
          actualValue
        });
        onRecordUpdate(updatedRecord);
        console.log(`🔄 [UNIVERSAL] Updated parent record state:`, updatedRecord);
      } else if (onRecordUpdate) {
        // Fallback: update local state with the new field value
        const updatedRecord = {
          ...record,
          [field]: value,
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
      const eventRecord = onRecordUpdate && result.data ? { ...record, ...result.data } : {
        ...record,
        [field]: value
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
      
      showMessage(`Updated ${field} successfully`);
      
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
      const updatedRecord = onRecordUpdate && result.data ? { ...record, ...result.data } : { ...record, [field]: value };
      
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
      
      // 🚀 SERVER REVALIDATION: Trigger background refresh to ensure data consistency
      // Use a longer delay to allow the optimistic update and parent state update to settle
      setTimeout(() => {
        console.log(`🔄 [UNIVERSAL] Triggering server revalidation for ${field} update`);
        router.refresh();
      }, 500);
      
      // 🗑️ COMPREHENSIVE CACHE INVALIDATION: Clear all caches to ensure fresh data on next load
      if (typeof window !== 'undefined') {
        const workspaceId = record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
        
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
          if (key.startsWith('adrata-cache-acquisition-os:') && key.includes(workspaceId)) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear SWR cache if available
        if ((window as any).__SWR_CACHE__) {
          const swrCache = (window as any).__SWR_CACHE__;
          const swrKeys = Array.from(swrCache.keys()) as string[];
          swrKeys.forEach((key: string) => {
            if (key.includes('acquisition-os') && key.includes(workspaceId)) {
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
            'acquisition-os:*'
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
        // Determine target section based on status value
        let targetSection = 'people'; // default
        if (value === 'LEAD') targetSection = 'leads';
        else if (value === 'PROSPECT') targetSection = 'prospects';
        else if (value === 'OPPORTUNITY') targetSection = 'opportunities';
        else if (value === 'CLIENT' || value === 'CUSTOMER') targetSection = 'clients';
        
        window.dispatchEvent(new CustomEvent('refresh-counts', {
          detail: { 
            section: targetSection,
            type: 'status-update',
            field, 
            value, 
            recordId 
          }
        }));
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
    
    // Optionally refresh the record data
    if (onRecordUpdate) {
      await onRecordUpdate(record.id);
    }
    
    // Show success message
    showMessage('Person added successfully!', 'success');
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
        const workspaceId = record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
        
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
          if (key.startsWith('adrata-cache-acquisition-os:') && key.includes(workspaceId)) {
            localStorage.removeItem(key);
            console.log(`🗑️ [CACHE] Cleared unified cache: ${key}`);
          }
        });
        
        // Also clear SWR cache if available (used by useAdrataData)
        if ((window as any).__SWR_CACHE__) {
          const swrCache = (window as any).__SWR_CACHE__;
          const swrKeys = Array.from(swrCache.keys()) as string[];
          swrKeys.forEach((key: string) => {
            if (key.includes('acquisition-os') && key.includes(workspaceId)) {
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
            'acquisition-os:*'
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
      
      // Show success message
      showMessage('Company added and associated successfully!', 'success');
      
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
      
      // Create a proper slug: name-id (matching existing pattern)
      const prospectSlug = `${prospectName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${prospectId}`;
      
      // Get current path and replace the section properly
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/prospects/${prospectSlug}`;
        console.log(`🔗 [ADVANCE] Navigating to prospect: ${newUrl}`);
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
      
      // Create a proper slug: name-id (matching existing pattern)
      const opportunitySlug = `${opportunityName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${opportunityId}`;
      
      // Get current path and replace the section properly
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/opportunities/${opportunitySlug}`;
        console.log(`🔗 [ADVANCE] Navigating to opportunity: ${newUrl}`);
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
        ...(actionData.companyId && actionData.companyId.trim() !== '' && { companyId: actionData.companyId })
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
      
      // Make API call to log the action
      console.log('🌐 [UNIVERSAL] Making API call to:', apiEndpoint);
      let response;
      try {
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(requestBody),
        });
      } catch (networkError) {
        console.error('❌ [UNIVERSAL] Network error during API call:', networkError);
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
      }

      console.log('📡 [UNIVERSAL] API response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = '';
        try {
          const errorBody = await response.json();
          errorDetails = errorBody.error || errorBody.message || 'Unknown error';
          console.error('❌ [UNIVERSAL] API error response:', errorBody);
        } catch (e) {
          errorDetails = response.statusText || `HTTP ${response.status}`;
          console.error('❌ [UNIVERSAL] Could not parse error response:', e);
        }
        
        throw new Error(`Failed to log action: ${errorDetails} (Status: ${response.status})`);
        }

        const result = await response.json();
        
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
        
        // Dispatch event to trigger actions refresh
        document.dispatchEvent(new CustomEvent('actionCreated', {
          detail: {
            recordId: record.id,
            recordType: recordType,
            actionId: result.data?.id,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Dispatch event with full action data for optimistic update
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
        
        // Close the modal
        setIsAddActionModalOpen(false);
        
        // 🎯 SPEEDRUN RECORD MOVEMENT: Move current record to bottom and gray out
        if (recordType === 'speedrun' && onNavigateNext) {
          console.log('🎯 [SPEEDRUN] Action logged - moving to next record');
          
          // Dispatch custom event to trigger record movement in left panel
          document.dispatchEvent(new CustomEvent('speedrunActionLogged', {
            detail: {
              currentRecord: record,
              actionData: actionData,
              timestamp: new Date().toISOString()
            }
          }));
          
          // Navigate to next record
          onNavigateNext();
        }
        
        // Optionally refresh the record or trigger a callback
        if (onRecordUpdate) {
          // Trigger record update to refresh any activity lists
          onRecordUpdate(record);
        }
      } else {
        throw new Error(result.error || 'Failed to log action');
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error logging action:', error);
      showMessage(`Error: ${error instanceof Error ? error.message : 'Failed to log action'}`, 'error');
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
        if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') {
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
        } else if (recordType === 'companies') {
          // Use v1 companies API
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
      // Save report content to Atrium
      const response = await authFetch('/api/atrium/reports', {
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
        console.log('✅ [UNIVERSAL] Report saved to Atrium');
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
            className="px-3 py-1.5 text-sm bg-[var(--hover)] text-gray-700 rounded-md hover:bg-[var(--loading-bg)] transition-colors"
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
          className="px-3 py-1.5 text-sm bg-[var(--background)] text-gray-700 border border-[var(--border)] rounded-md hover:bg-[var(--panel-background)] transition-colors"
        >
          Add Company
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
        className="px-3 py-1.5 text-sm bg-[var(--background)] text-gray-700 border border-[var(--border)] rounded-md hover:bg-[var(--panel-background)] transition-colors"
      >
        {updateButtonText}
      </button>
    );

    // Add Person button - only for company records
    if (recordType === 'companies') {
      buttons.push(
        <button
          key="add-person"
          onClick={() => setIsAddPersonModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
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
        // On sprint page: Show "Add Action with the shortcut" with green styling and keyboard shortcut - Responsive for 15-inch laptops
        buttons.push(
          <button
            key="add-action"
            onClick={() => setIsAddActionModalOpen(true)}
            className="px-3 py-1.5 text-sm bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] rounded-md hover:bg-[var(--success)] hover:text-[var(--button-text)] transition-colors flex items-center gap-1"
          >
            <span className="hidden xs:inline">Add Action ({getCommonShortcut('SUBMIT')})</span>
            <span className="xs:hidden">Add Action</span>
          </button>
        );
      } else {
        // On individual record page: Show "Start Speedrun" with blue styling - Responsive for 15-inch laptops
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
            className="px-3 py-1.5 text-sm bg-[var(--info-bg)] text-[var(--info-text)] border border-[var(--info-border)] rounded-md hover:bg-[var(--info)] hover:text-[var(--button-text)] transition-colors flex items-center gap-1"
          >
            <span className="hidden xs:inline">Start Speedrun ({getCommonShortcut('SUBMIT')})</span>
            <span className="xs:hidden">Start ({getCommonShortcut('SUBMIT')})</span>
          </button>
        );
      }
    } else {
      // Context-aware advance button (moved before Add Action)
      if (recordType === 'leads') {
        // Advance to Lead button - LIGHT GRAY BUTTON (for leads)
        buttons.push(
          <button
            key="advance-to-prospect"
            onClick={handleAdvanceToProspect}
            className="px-3 py-1.5 text-sm bg-[var(--panel-background)] text-[var(--foreground)] border border-[var(--border)] rounded-md hover:bg-[var(--hover)] transition-colors"
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
            className="px-3 py-1.5 text-sm bg-[var(--info-bg)] text-[var(--info-text)] border border-[var(--info-border)] rounded-md hover:bg-[var(--info)] hover:text-[var(--button-text)] transition-colors"
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
              className="px-3 py-1.5 text-sm bg-[var(--panel-background)] text-[var(--foreground)] border border-[var(--border)] rounded-md hover:bg-[var(--hover)] transition-colors"
            >
              Advance to Prospect
            </button>
          );
        } else if (currentStatus === 'PROSPECT') {
          buttons.push(
            <button
              key="advance-to-opportunity"
              onClick={handleAdvanceToOpportunity}
              className="px-3 py-1.5 text-sm bg-[var(--info-bg)] text-[var(--info-text)] border border-[var(--info-border)] rounded-md hover:bg-[var(--info)] hover:text-[var(--button-text)] transition-colors"
            >
              Advance to Opportunity
            </button>
          );
        }
      }

      // Add Action button - CATEGORY COLORED BUTTON (matching section colors)
      const categoryColors = getCategoryColors(recordType);
      buttons.push(
        <button
          key="add-action"
          onClick={() => setIsAddActionModalOpen(true)}
          className="px-3 py-1.5 text-sm rounded-md transition-colors"
          style={{
            backgroundColor: categoryColors.bg,
            color: categoryColors.primary,
            border: `1px solid ${categoryColors.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = categoryColors.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = categoryColors.bg;
          }}
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
            <div className="mt-4 text-xs text-[var(--muted)]">
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
            <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'intelligence':
          console.log(`🧠 [UNIVERSAL] Rendering intelligence tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            recordType === 'companies' ? 
              <UniversalCompanyIntelTab key={activeTab} record={record} recordType={recordType} /> :
              recordType === 'speedrun' ?
                <SpeedrunInsightsTab 
                  key={activeTab} 
                  person={record} 
                  insightsData={extractProductionInsights(record)} 
                /> :
              recordType === 'people' ?
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} /> :
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} />
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
        case 'competitors':
          console.log(`🏢 [UNIVERSAL] Rendering competitors tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalCompetitorsTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'insights':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <ComprehensiveInsightsTab key={activeTab} record={record} recordType={recordType} /> :
              <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'intelligence':
          console.log(`🧠 [UNIVERSAL] Rendering intelligence tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            recordType === 'companies' ? 
              <UniversalCompanyIntelTab key={activeTab} record={record} recordType={recordType} /> :
              recordType === 'speedrun' ?
                <SpeedrunInsightsTab 
                  key={activeTab} 
                  person={record} 
                  insightsData={extractProductionInsights(record)} 
                /> :
              recordType === 'people' ?
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} /> :
                <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} />
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
              <ComprehensiveProfileTab key={activeTab} record={record} recordType={recordType} /> :
              <UniversalProfileTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'pain-value':
          return renderTabWithErrorBoundary(
            <UniversalPainValueTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'industry-intel':
          return renderTabWithErrorBoundary(
            <UniversalIndustryIntelTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'outreach':
          return renderTabWithErrorBoundary(
            <UniversalOutreachTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'engagement':
          return renderTabWithErrorBoundary(
            <UniversalEngagementTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'deal-intel':
          return renderTabWithErrorBoundary(
            <UniversalDealIntelTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'company-intel':
          return renderTabWithErrorBoundary(
            <UniversalCompanyIntelTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'close-plan':
          return renderTabWithErrorBoundary(
            <UniversalClosePlanTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'competitive':
          return renderTabWithErrorBoundary(
            <UniversalCompetitorsTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'relationship':
          return renderTabWithErrorBoundary(
            <UniversalRelationshipTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'personal':
          return renderTabWithErrorBoundary(
            <UniversalPersonalTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'business':
          return renderTabWithErrorBoundary(
            <UniversalBusinessTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'success':
          return renderTabWithErrorBoundary(
            <UniversalSuccessTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'partnership':
          return renderTabWithErrorBoundary(
            <UniversalPartnershipTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'collaboration':
          return renderTabWithErrorBoundary(
            <UniversalCollaborationTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'performance':
          return renderTabWithErrorBoundary(
            <UniversalPerformanceTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'industry':
          return renderTabWithErrorBoundary(
            <UniversalIndustryTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'persona':
          return renderTabWithErrorBoundary(
            <UniversalProfileTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'career':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} /> :
              <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} />
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
            <UniversalStakeholdersTab key={activeTab} record={record} recordType={recordType} />
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
    <div className="h-full flex flex-col bg-[var(--background)]">
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
      <div className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--border)] px-6 py-3">
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
              
              return (
                <>
                  <button
                    onClick={() => {
                      console.log(`🔍 [UNIVERSAL] Previous button clicked!`, {
                        hasOnNavigatePrevious: !!onNavigatePrevious,
                        recordIndex,
                        totalRecords,
                        canNavigate: !(!recordIndex || recordIndex <= 1),
                        recordId: record?.id,
                        recordName: record?.name || record?.fullName
                      });
                      if (onNavigatePrevious && safeRecordIndex && safeRecordIndex > 1) {
                        console.log(`✅ [UNIVERSAL] Navigating to previous record`);
                        onNavigatePrevious();
                      } else {
                        console.warn(`❌ [UNIVERSAL] Cannot navigate previous - safeRecordIndex: ${safeRecordIndex}, safeTotalRecords: ${safeTotalRecords}`);
                      }
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      !safeRecordIndex || safeRecordIndex <= 1 || !safeTotalRecords
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-[var(--foreground)] hover:text-blue-600 hover:bg-[var(--panel-background)]'
                    }`}
                    disabled={!safeRecordIndex || safeRecordIndex <= 1 || !safeTotalRecords}
                    title={!safeTotalRecords || safeTotalRecords <= 1 ? "No other records to navigate" : "Previous record"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      console.log(`🔍 [UNIVERSAL] Next button clicked!`, {
                        hasOnNavigateNext: !!onNavigateNext,
                        recordIndex,
                        totalRecords,
                        canNavigate: !(!recordIndex || !totalRecords || recordIndex >= totalRecords),
                        recordId: record?.id,
                        recordName: record?.name || record?.fullName
                      });
                      if (onNavigateNext && safeRecordIndex && safeTotalRecords && safeRecordIndex < safeTotalRecords) {
                        console.log(`✅ [UNIVERSAL] Navigating to next record`);
                        onNavigateNext();
                      } else {
                        console.warn(`❌ [UNIVERSAL] Cannot navigate next - safeRecordIndex: ${safeRecordIndex}, safeTotalRecords: ${safeTotalRecords}`);
                      }
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      !safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-[var(--foreground)] hover:text-blue-600 hover:bg-[var(--panel-background)]'
                    }`}
                    disabled={!safeRecordIndex || !safeTotalRecords || safeRecordIndex >= safeTotalRecords}
                    title={!safeTotalRecords || safeTotalRecords <= 1 ? "No other records to navigate" : "Next record"}
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
      <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Minimal Avatar with Rank */}
            <div className="relative group">
              <div 
                className="w-10 h-10 bg-[var(--background)] border border-[var(--border)] rounded-xl flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-[var(--primary)] transition-colors"
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
                  <span className="text-sm font-semibold text-gray-700">
                    {(() => {
                      console.log(`🔍 [RANK DEBUG] Record rank:`, record?.rank, 'RecordIndex:', recordIndex, 'RecordType:', recordType, 'Record:', record);
                      // 🎯 FIX: For speedrun records, use sequential rank from navigation, not database rank
                      if (recordType === 'speedrun' && recordIndex !== undefined) {
                        return recordIndex; // Use the recordIndex directly (already 1-based)
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
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">{getDisplayName()}</h1>
              <p className="text-sm text-[var(--muted)]">{getSubtitle()}</p>
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
                  ? 'bg-[var(--panel-background)] text-[var(--foreground)] border border-[var(--border)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
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
          <div key={record?.id} className="px-1 min-h-[400px]">
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

      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-xl border border-gray-100 shadow-sm p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Add Note</h3>
            <textarea
              placeholder="Enter your note here..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
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
          <div className="bg-[var(--background)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Confirm Deletion</h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              Are you sure you want to delete this record? This will move it to the trash where it can be restored later.
            </p>
            <p className="text-sm text-[var(--muted)] mb-4">
              Please type <strong>{getDisplayName()}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Enter record name"
              className="w-full p-3 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-sm bg-[var(--hover)] text-gray-700 rounded-md hover:bg-[var(--loading-bg)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading || normalizeString(deleteConfirmName) !== normalizeString(getDisplayName())}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  loading || normalizeString(deleteConfirmName) !== normalizeString(getDisplayName())
                    ? 'bg-gray-300 text-[var(--muted)] cursor-not-allowed'
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
        companyId={recordType === 'companies' ? record?.id : (record?.companyId || record?.company?.id)}
        section={recordType}
        isLoading={loading}
      />

      {/* Add Person to Company Modal */}
      {recordType === 'companies' && (
        <AddPersonToCompanyModal
          isOpen={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
          companyId={record?.id}
          companyName={record?.name || record?.companyName || ''}
          onPersonAdded={handlePersonAdded}
        />
      )}

      {/* Add Company Modal */}
      {(recordType === 'people' || recordType === 'leads' || recordType === 'prospects') && (
        <AddCompanyModal
          isOpen={isAddCompanyModalOpen}
          onClose={() => setIsAddCompanyModalOpen(false)}
          onCompanyAdded={handleCompanyAdded}
          section={recordType}
        />
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
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-xl border border-gray-100 shadow-sm p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-edit-modal>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {recordType === 'leads' ? 'Update Lead' : 
                 recordType === 'prospects' ? 'Update Prospect' :
                 recordType === 'opportunities' ? 'Update Opportunity' :
                 recordType === 'companies' ? 'Update Company' :
                 recordType === 'people' ? 'Update Person' :
                 recordType === 'clients' ? 'Update Client' :
                 recordType === 'partners' ? 'Update Partner' :
                 'Update Record'}
              </h3>
              <button
                onClick={() => setIsEditRecordModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-[var(--border)] mb-6">
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
                        : 'border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]'
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
                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Company Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                            <input
                              type="text"
                              name="name"
                              defaultValue={formatFieldValue(record?.name || record?.companyName, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                              type="url"
                              name="website"
                              defaultValue={formatFieldValue(record?.website, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              name="phone"
                              defaultValue={formatFieldValue(record?.phone, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="-"
                          />
                        </div>
                      </div>

                      {/* Business Details */}
                      <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Business Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <input
                              type="text"
                              name="industry"
                              defaultValue={formatFieldValue(record?.industry, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Employees</label>
                            <select
                              name="size"
                              defaultValue={record?.size || ''}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              name="status"
                              defaultValue={record?.status || 'ACTIVE'}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              defaultValue={formatFieldValue(record?.firstName, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.firstName) ? '' : '-'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              defaultValue={formatFieldValue(record?.lastName, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.lastName) ? '' : '-'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              name="jobTitle"
                              defaultValue={formatFieldValue(record?.title || record?.jobTitle, '')}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formatFieldValue(record?.department) ? '' : '-'}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Bio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                            <select
                              name="status"
                              defaultValue={record?.status || 'active'}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Intelligence Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Strategy</label>
                        <select
                          name="engagementStrategy"
                          defaultValue={record?.engagementStrategy || 'standard'}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Key Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Score</label>
                        <input
                          type="number"
                          name="engagementScore"
                          min="0"
                          max="100"
                          defaultValue={record?.engagementScore || ''}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={record?.decisionPowerScore ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Warmth</label>
                        <select
                          name="relationshipWarmth"
                          defaultValue={record?.relationshipWarmth || 'cold'}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Current Role</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          name="careerJobTitle"
                          defaultValue={formatFieldValue(record?.title || record?.jobTitle, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.department) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.industry, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.industry) ? '' : '-'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Background */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Professional Background</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          defaultValue={record?.yearsExperience || ''}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={record?.yearsExperience ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                        <select
                          defaultValue={record?.educationLevel || ''}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.skills) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.certifications, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue={formatFieldValue(record?.email, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.email) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          defaultValue={formatFieldValue(record?.phone, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.phone) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <input
                          type="url"
                          defaultValue={formatFieldValue(record?.linkedinUrl || record?.linkedin, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.linkedinUrl || record?.linkedin) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.location || record?.city, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.location || record?.city) ? '' : '-'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Engagement History */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Engagement History</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact Date</label>
                        <input
                          type="date"
                          defaultValue={record?.lastContactDate ? new Date(record.lastContactDate).toISOString().split('T')[0] : ''}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
                        <input
                          type="date"
                          defaultValue={record?.nextActionDate ? new Date(record.nextActionDate).toISOString().split('T')[0] : ''}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.nextAction, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.nextAction) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Best Contact Time</label>
                        <select
                          defaultValue={record?.bestContactTime || 'morning'}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="text-center py-12 text-[var(--muted)]">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Actions Yet</h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                      Company timeline activities will appear here when available.
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Actions, meetings, and other company-related activities will be displayed in this timeline.
                    </p>
                  </div>
                </div>
              )}

              {activeEditTab === 'news' && (
                <div className="space-y-6">
                  <div className="text-center py-12 text-[var(--muted)]">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No News Available</h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                      Company news and updates will appear here when available.
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Recent news articles, press releases, and company updates will be displayed here.
                    </p>
                  </div>
                </div>
              )}

              {activeEditTab === 'buyer-groups' && (
                <div className="space-y-6">
                  <div className="text-center py-12 text-[var(--muted)]">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Buyer Groups</h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                      Buyer group information will appear here when available.
                    </p>
                    <p className="text-xs text-[var(--muted)]">
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
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={formatFieldValue(record?.notes) ? '' : '-'}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      defaultValue={formatArrayValue(record?.tags, '')}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formatArrayValue(record?.tags) ? '' : '-'}
                    />
                  </div>

                  {/* Value Driver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value Driver</label>
                    <input
                      type="text"
                      defaultValue={formatFieldValue(record?.valueDriver, '')}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formatFieldValue(record?.valueDriver) ? '' : '-'}
                    />
                  </div>
                </div>
              )}

              {activeEditTab === 'delete' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                      Delete Record
                    </h3>
                    <p className="text-sm text-[var(--muted)] mb-6">
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
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder={`Type "${getDisplayName()}" to confirm`}
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
              {activeEditTab === 'delete' ? (
                <>
                  <button
                    onClick={() => {
                      setDeleteConfirmName('');
                      setActiveEditTab('overview');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    className="px-4 py-2 text-sm font-medium text-[var(--info-text)] bg-[var(--info-bg)] border border-[var(--info-border)] rounded-lg hover:bg-[var(--info)] hover:text-[var(--button-text)] transition-colors"
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
      return 'text-[var(--muted)] bg-[var(--panel-background)]';
    }
    if (status === 'planned' || status === 'scheduled') return 'text-blue-600 bg-blue-50';
    return 'text-[var(--muted)] bg-[var(--panel-background)]';
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">
          Recent Activity
        </h3>
        
        {activities['length'] === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--hover)] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted)]">No activities recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border border-[var(--border)] rounded-lg">
                <div className={`p-2 rounded ${getStatusColor(activity.status, activity.outcome)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                        {normalizeActivityType(activity.type)}
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{activity.subject}</span>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {formatDate(activity.completedAt || activity.createdAt)}
                    </span>
                  </div>
                  {activity['description'] && (
                    <p className="text-sm text-[var(--muted)] mt-1">{activity.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status, activity.outcome)}`}>
                      {activity.status}
                    </span>
                    {activity['outcome'] && activity.outcome !== 'null' && (
                      <span className="text-xs text-[var(--muted)]">
                        {activity.outcome}
                      </span>
                    )}
                    {activity.duration !== null && activity.duration !== undefined && (
                      <span className="text-xs text-[var(--muted)]">
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
        <button className="w-full mt-4 px-4 py-2 border border-[var(--border)] rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--panel-background)] transition-colors">
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
    if (!status) return 'bg-[var(--hover)] text-[var(--foreground)]';
    const statusLower = status.toLowerCase();
    if (['new', 'uncontacted'].includes(statusLower)) return 'bg-[var(--status-new-bg)] text-[var(--status-new-text)]';
    if (['contacted', 'responded'].includes(statusLower)) return 'bg-[var(--status-contacted-bg)] text-[var(--status-contacted-text)]';
    if (['qualified', 'hot'].includes(statusLower)) return 'bg-[var(--status-qualified-bg)] text-[var(--status-qualified-text)]';
    if (['closed_won', 'won'].includes(statusLower)) return 'bg-[var(--status-won-bg)] text-[var(--status-won-text)]';
    if (['closed_lost', 'lost'].includes(statusLower)) return 'bg-[var(--status-lost-bg)] text-[var(--status-lost-text)]';
    return 'bg-[var(--hover)] text-[var(--foreground)]';
  };

  const getPriorityColor = (priority?: string): string => {
    if (!priority) return 'bg-[var(--hover)] text-[var(--foreground)]';
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'high') return 'bg-[var(--priority-high-bg)] text-[var(--priority-high-text)]';
    if (priorityLower === 'medium') return 'bg-[var(--priority-medium-bg)] text-[var(--priority-medium-text)]';
    if (priorityLower === 'low') return 'bg-[var(--priority-low-bg)] text-[var(--priority-low-text)]';
    return 'bg-[var(--hover)] text-[var(--foreground)]';
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Stage</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Full Name</label>
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
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">First Name</label>
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
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Last Name</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Title</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Department</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Priority</label>
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
          <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Role</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Email</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Work Email</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Personal Email</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Phone</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Mobile Phone</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">LinkedIn</label>
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
          <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">Company Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Company</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Company Domain</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Industry</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Total Employees</label>
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
          <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">Location Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">City</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Country</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Address</label>
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
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Postal Code</label>
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">Notes & Description</h3>
        <div className="bg-[var(--panel-background)] p-4 rounded-lg">
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide">Company Details</h3>
        <div className="text-center py-12 text-[var(--muted)]">
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
  const getInitialNotes = React.useMemo(() => {
    if (record?.notes) {
      if (typeof record.notes === 'string') {
        return record.notes;
      } else if (typeof record.notes === 'object' && record.notes !== null) {
        return record.notes.content || record.notes.text || '';
      }
    }
    return '';
  }, [record?.notes]);

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

  // Sync notes state when record.notes prop changes
  React.useEffect(() => {
    const newNotes = getInitialNotes;
    // Only sync if:
    // 1. Notes have actually changed from what's currently displayed
    // 2. User is not currently focused on the textarea
    // 3. Not currently saving
    // 4. No unsaved changes
    // 5. Notes from prop are different from our last saved version (prevents stale cache overwrites)
    if (newNotes !== notes && 
        newNotes !== lastSavedNotes &&
        !isFocused && 
        saveStatus !== 'saving' && 
        !hasUnsavedChanges &&
        !isInitialMountRef.current) {
      console.log('🔄 [NOTES] Syncing notes from prop:', { newNotes, currentNotes: notes, lastSavedNotes });
      setNotes(newNotes);
      setLastSavedNotes(newNotes);
    }
  }, [getInitialNotes, notes, lastSavedNotes, isFocused, saveStatus, hasUnsavedChanges]);

  // Silently refresh notes from API in background (no loading state)
  React.useEffect(() => {
    const refreshNotes = async () => {
      if (!record?.id) return;

      try {
        console.log('🔄 [NOTES] Silently refreshing notes for:', { recordId: record.id, recordType });

        // Map record types to v1 API endpoints
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
          if (result.success && result.data?.notes) {
            const freshNotes = typeof result.data.notes === 'string' 
              ? result.data.notes 
              : result.data.notes.content || result.data.notes.text || '';
            
            // Only update if the notes are different and we're not currently editing or saving
            // This prevents overwriting user changes during active editing
            if (freshNotes !== notes && saveStatus !== 'saving' && !isFocused && !hasUnsavedChanges) {
              setNotes(freshNotes);
              setLastSavedNotes(freshNotes);
              if (result.data.updatedAt) {
                setLastSavedAt(new Date(result.data.updatedAt));
              }
              console.log('✅ [NOTES] Silently updated notes:', { length: freshNotes.length });
            }
          }
        }
      } catch (error) {
        console.error('❌ [NOTES] Error refreshing notes:', error);
        // Silently fail - user already has notes from record prop
      } finally {
        // Mark initial mount as complete after first refresh
        isInitialMountRef.current = false;
      }
    };

    // Only refresh on initial load or when record ID changes, not on every notes change
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
      console.log('💾 [NOTES] Starting save for:', { recordId: record.id, recordType, contentLength: notesContent.length });
      setSaveStatus('saving');
      setHasUnsavedChanges(false);
      
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
      console.log('✅ [NOTES] Save result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save notes');
      }

      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setLastSavedNotes(notesContent);
      
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
    setNotes(newNotes);
    setHasUnsavedChanges(newNotes !== lastSavedNotes);
  }, [lastSavedNotes]);

  // Handle focus/blur to track editing state
  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <NotesEditor
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
        />
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <div className="flex items-center gap-4">
            <span>{getWordCount(notes)} words</span>
            <span>{getCharacterCount(notes)} characters</span>
          </div>
          <div className="text-[var(--muted)]">
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide">Industry Information</h3>
        <div className="text-center py-12 text-[var(--muted)]">
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide">Career Information</h3>
        <div className="text-center py-12 text-[var(--muted)]">
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide">Landmines</h3>
        <div className="text-center py-12 text-[var(--muted)]">
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
        <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide">History</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="sm" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-[var(--panel-background)] p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-[var(--foreground)]">{activity.subject}</h4>
                    <p className="text-sm text-[var(--muted)] mt-1">{activity.description}</p>
                    <p className="text-xs text-[var(--muted)] mt-2">
                      {activity.completedAt.toLocaleDateString()} • {activity.type}
                    </p>
                  </div>
                  {activity['outcome'] && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity['outcome'] === 'positive' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' :
                      activity['outcome'] === 'negative' ? 'bg-[var(--error-bg)] text-[var(--error-text)]' :
                      'bg-[var(--hover)] text-[var(--foreground)]'
                    }`}>
                      {activity.outcome}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--muted)]">
            <p className="text-sm">No history available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
