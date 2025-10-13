"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { authFetch } from '@/platform/api-fetch';
import { UpdateModal } from './UpdateModal';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { AddTaskModal } from './AddTaskModal';
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
  UniversalTimelineTab,
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
  UniversalSellerCompaniesTab
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
            { id: 'timeline', label: 'Actions' },
            { id: 'intelligence', label: 'Intelligence' },
            { id: 'career', label: 'Career' },
            { id: 'notes', label: 'Notes' }
          ];
    case 'prospects':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'career', label: 'Career' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'opportunities':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'deal-intel', label: 'Deal Intel' },
        { id: 'stakeholders', label: 'Stakeholders' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'close-plan', label: 'Close Plan' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'companies':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'news', label: 'News' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'competitors', label: 'Competitors' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'people':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'career', label: 'Career' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'speedrun':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'career', label: 'Career' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'clients':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'relationship', label: 'Relationship' },
        { id: 'business', label: 'Business' },
        { id: 'personal', label: 'Personal' },
        { id: 'success', label: 'Success' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'partners':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'partnership', label: 'Partnership' },
        { id: 'collaboration', label: 'Collaboration' },
        { id: 'performance', label: 'Performance' },
        { id: 'opportunities', label: 'Opportunities' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'sellers':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Actions' },
        { id: 'companies', label: 'Companies' },
        { id: 'performance', label: 'Performance' },
        { id: 'profile', label: 'Profile' },
        { id: 'notes', label: 'Notes' }
      ];
    default:
      return [
        { id: 'overview', label: 'Home' },
        { id: 'timeline', label: 'Actions' },
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
  { id: 'activity', label: 'Activity' },
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
  const defaultTab = (customTabs || DEFAULT_TABS)[0]?.id || 'overview';
  const [activeTab, setActiveTab] = useState(urlTab || defaultTab);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<DeepValueReport | null>(null);
  
  // Ref for content container to reset scroll position
  const contentRef = useRef<HTMLDivElement>(null);
  
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
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('overview');
  const [hasLoggedAction, setHasLoggedAction] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const tabs = customTabs || getTabsForRecordType(recordType, record);
  
  // Function to update URL with tab parameter
  const updateURLTab = (tabId: string) => {
    const currentPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabId);
    router.replace(`${currentPath}?${params.toString()}`, { scroll: false });
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
    
    // If URL has a valid tab parameter, use it
    if (urlTab && validTabIds.includes(urlTab)) {
      if (activeTab !== urlTab) {
        setActiveTab(urlTab);
      }
    } 
    // If current active tab is not valid for this record type, reset to first tab
    else if (!validTabIds.includes(activeTab)) {
      const newTab = tabs[0]?.id || 'overview';
      setActiveTab(newTab);
      // Update URL to reflect the fallback tab
      updateURLTab(newTab);
    }
  }, [tabs, searchParams]);

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
        
        
        // Optionally refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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

  // Get record display name with fallbacks
  const getDisplayName = () => {
    return record?.name || 
           record?.fullName || 
           (record?.firstName && record?.lastName ? `${record.firstName} ${record.lastName}` : '') ||
           record?.companyName ||
           record?.title ||
           'Unknown Record';
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
                 return 'Small, growing telecommunications company';
               } else if (sizeCategory === 'Small' && growthStage === 'startup') {
                 return 'Small, emerging telecom startup';
               } else if (sizeCategory === 'Mid-size' && growthStage === 'growing') {
                 return 'Mid-size, expanding telecom company';
               } else if (sizeCategory === 'Growing' && growthStage === 'established') {
                 return 'Growing, established telecom company';
               } else {
                 return `${sizeCategory}, ${growthStage} telecommunications company`;
               }
      case 'people':
        const personTitle = record?.jobTitle || record?.title;
        // Use the same company extraction logic as UniversalOverviewTab
        const personCoresignalData = record?.customFields?.coresignal || {};
        const personCompany = personCoresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
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

  // Handle record updates
  const handleUpdateSubmit = async (updatedData: any, actionData?: any) => {
    try {
      setLoading(true);
      console.log('🔄 [UNIVERSAL] Updating record:', record.id, 'with data:', updatedData);
      
      // Prepare update data with proper field mapping
      const updatePayload: Record<string, any> = {};
      
      // Map common fields to streamlined schema - using bracket notation for TypeScript strict mode
      if (updatedData['name']) {
        const nameParts = updatedData['name'].trim().split(' ');
        updatePayload['firstName'] = nameParts[0] || '';
        updatePayload['lastName'] = nameParts.slice(1).join(' ') || '';
        updatePayload['fullName'] = updatedData['name'].trim();
      }
      if (updatedData['firstName']) updatePayload['firstName'] = updatedData['firstName'];
      if (updatedData['lastName']) updatePayload['lastName'] = updatedData['lastName'];
      if (updatedData['fullName']) updatePayload['fullName'] = updatedData['fullName'];
      if (updatedData['email']) updatePayload['email'] = updatedData['email'];
      if (updatedData['workEmail']) updatePayload['workEmail'] = updatedData['workEmail'];
      if (updatedData['phone']) updatePayload['phone'] = updatedData['phone'];
      if (updatedData['mobilePhone']) updatePayload['mobilePhone'] = updatedData['mobilePhone'];
      if (updatedData['title']) updatePayload['jobTitle'] = updatedData['title'];
      if (updatedData['jobTitle']) updatePayload['jobTitle'] = updatedData['jobTitle'];
      if (updatedData['status']) updatePayload['status'] = updatedData['status'];
      if (updatedData['priority']) updatePayload['priority'] = updatedData['priority'];
      if (updatedData['notes']) updatePayload['notes'] = updatedData['notes'];
      if (updatedData['industry']) updatePayload['industry'] = updatedData['industry'];
      if (updatedData['linkedinUrl']) updatePayload['linkedinUrl'] = updatedData['linkedinUrl'];
      if (updatedData['department']) updatePayload['department'] = updatedData['department'];
      if (updatedData['seniority']) updatePayload['seniority'] = updatedData['seniority'];
      if (updatedData['city']) updatePayload['city'] = updatedData['city'];
      if (updatedData['state']) updatePayload['state'] = updatedData['state'];
      if (updatedData['country']) updatePayload['country'] = updatedData['country'];
      if (updatedData['postalCode']) updatePayload['postalCode'] = updatedData['postalCode'];
      if (updatedData['source']) updatePayload['source'] = updatedData['source'];
      if (updatedData['nextAction']) updatePayload['nextAction'] = updatedData['nextAction'];
      if (updatedData['nextActionDate']) updatePayload['nextActionDate'] = updatedData['nextActionDate'];
      if (updatedData['lastActionDate']) updatePayload['lastActionDate'] = updatedData['lastActionDate'];
      if (updatedData['tags']) updatePayload['tags'] = updatedData['tags'];
      if (updatedData['engagementScore']) updatePayload['engagementScore'] = updatedData['engagementScore'];
      if (updatedData['globalRank']) updatePayload['globalRank'] = updatedData['globalRank'];
      if (updatedData['companyRank']) updatePayload['companyRank'] = updatedData['companyRank'];
      
      // Make API call to update the record using v1 APIs
      let response: Response;
      
      if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') {
        // All people-related records use v1 people API
        response = await authFetch(`/api/v1/people/${record.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
      } else if (recordType === 'companies') {
        // Use v1 companies API
        response = await authFetch(`/api/v1/companies/${record.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
      } else {
        // Fallback to legacy unified API for other types
        response = await authFetch('/api/data/unified', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: recordType,
            action: 'update',
            id: record.id,
            data: updatePayload,
            workspaceId: record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP',
            userId: '01K1VBYZG41K9QA0D9CF06KNRG'
          }),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update record');
      }
      
      const result = await response.json();
      console.log('✅ [UNIVERSAL] Record updated successfully:', result);
      
      // Update local record state
      const updatedRecord = {
        ...record,
        ...updatedData,
        ...updatePayload
      };
      
      if (onRecordUpdate) {
        onRecordUpdate(updatedRecord);
      }
      
      // Also dispatch a custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('record-updated', {
        detail: {
          recordType,
          recordId: record.id,
          updatedRecord,
          updateData: updatedData,
          actionData
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
      let response: Response;
      
      if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') {
        // All people-related records use v1 people API
        response = await authFetch(`/api/v1/people/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (recordType === 'companies') {
        // Use v1 companies API
        response = await authFetch(`/api/v1/companies/${recordId}`, {
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${recordType}`);
      }
      
      console.log(`✅ [UNIVERSAL] Successfully deleted ${recordType} ${recordId}`);
      
      // Navigate back to the list
      onBack();
    } catch (error) {
      console.error(`❌ [UNIVERSAL] Error deleting ${recordType} ${recordId}:`, error);
      throw error;
    }
  };

  // Handle inline field save
  const handleInlineFieldSave = async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
    try {
      console.log(`🔄 [UNIVERSAL] Saving ${field} = ${value} for ${recordType} ${recordId}`);
      
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
        'foundedYear', 'headquarters', 'companyType'
      ];
      
      // Determine which model to update based on the field
      let targetModel = recordType;
      let targetId = recordId;
      
      console.log(`🎯 [MODEL TARGETING] Field: ${field}, RecordType: ${recordType}, PersonId: ${record?.personId}, CompanyId: ${record?.companyId}`);
      
      if (personalFields.includes(field)) {
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
      
      // Map field names to match API expectations
      const fieldMapping: Record<string, string> = {
        'name': 'fullName',
        'fullName': 'fullName',  // Ensure fullName maps to fullName
        'title': 'title',
        'jobTitle': 'title',  // Map jobTitle to title
        'workEmail': 'workEmail',
        'mobilePhone': 'mobilePhone',
        'company': 'company',  // Keep company as company for database
        'companyName': 'company'  // Map companyName to company
      };
      
      const apiField = fieldMapping[field] || field;
      
      // Prepare update data
      const updateData: Record<string, any> = {
        [apiField]: value
      };
      
      // Handle name field specially - split into firstName/lastName/fullName
      if (field === 'name' || field === 'fullName') {
        const nameParts = value.trim().split(' ');
        updateData['firstName'] = nameParts[0] || '';
        updateData['lastName'] = nameParts.slice(1).join(' ') || '';
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
      } else {
        // For other record types, try to use appropriate v1 API or throw error
        console.log('🔍 [DEBUG] Unsupported record type for v1 migration:', apiRecordType);
        throw new Error(`Record type '${apiRecordType}' is not yet supported in v1 APIs. Please use companies or people records.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${field}`);
      }
      
      const result = await response.json();
      console.log(`✅ [UNIVERSAL] API Response for ${field}:`, JSON.stringify(result, null, 2));
      console.log(`✅ [UNIVERSAL] API Response status: ${response.status}, success: ${result.success}`);
      
      // Verify the update was successful
      if (!result.success) {
        throw new Error(`API returned success: false - ${result.error || 'Unknown error'}`);
      }
      
      // Additional verification: check if the data was actually updated
      if (result.data && result.data[field] !== value) {
        console.warn(`⚠️ [UNIVERSAL] Field ${field} value mismatch: expected ${value}, got ${result.data[field]}`);
      }
      
      // Update local record state with the new value
      if (onRecordUpdate && result.data) {
        const updatedRecord = { ...record, ...result.data };
        onRecordUpdate(updatedRecord);
        console.log(`🔄 [UNIVERSAL] Updated local record state:`, updatedRecord);
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
        onRecordUpdate(updatedRecord);
        console.log(`🔄 [UNIVERSAL] Updated local record state (fallback):`, updatedRecord);
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
      
      // 🚀 CACHE INVALIDATION: Trigger data refresh if status field was updated
      if (field === 'status') {
        // Determine target section based on status value
        let targetSection = 'people'; // default
        if (value === 'LEAD') targetSection = 'leads';
        else if (value === 'PROSPECT') targetSection = 'prospects';
        else if (value === 'OPPORTUNITY') targetSection = 'opportunities';
        else if (value === 'CLIENT' || value === 'CUSTOMER') targetSection = 'clients';
        
        window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
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
    }
  };

  const handleDeleteConfirm = async () => {
    const recordName = getDisplayName();
    if (deleteConfirmName.trim() !== recordName) {
      alert('Name does not match. Please enter the exact record name to confirm deletion.');
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ [UNIVERSAL] Soft deleting record:', record.id);
      
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
                     recordType === 'timeline' ? 'actions' : 'people',
          entityId: record.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete record');
      }
      
      // Navigate back to the table view immediately
      if (onBack) {
        onBack();
      }
      
      // Show success message after navigation (with a small delay to ensure navigation completes)
      setTimeout(() => {
        showMessage('Record moved to trash successfully!', 'success');
      }, 100);
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error deleting record:', error);
      showMessage('Failed to delete record. Please try again.', 'error');
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
      
      // Use different API endpoints based on record type
      const apiEndpoint = recordType === 'speedrun' ? '/api/speedrun/action-log' : '/api/actions/add';
      
      // Prepare request body based on record type
      const requestBody = recordType === 'speedrun' ? {
        personId: record.id,
        personName: record.name || record.fullName || 'Unknown',
        actionType: actionData.type,
        notes: actionData.action, // Use action field for speedrun
        actionPerformedBy: actionData.actionPerformedBy
      } : {
        recordId: record.id,
        recordType: recordType,
        actionType: actionData.type,
        notes: actionData.action,
        person: actionData.person,
        personId: actionData.personId,
        company: actionData.company,
        companyId: actionData.companyId,
        actionPerformedBy: actionData.actionPerformedBy,
        workspaceId: record.workspaceId || 'default',
        userId: record.userId || 'default'
      };
      
      // Make API call to log the action
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to log action: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showMessage('Action logged successfully!');
        
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
      
      // Collect form data from all tabs using the modal element
      const modalElement = document.querySelector('[data-edit-modal]');
      if (!modalElement) {
        throw new Error('Edit modal element not found.');
      }

      const formData = {
        // Basic info (Overview tab) - mapped to streamlined schema fields
        firstName: (modalElement.querySelector('input[defaultValue*="' + (record?.firstName || '') + '"]') as HTMLInputElement)?.value || record?.firstName,
        lastName: (modalElement.querySelector('input[defaultValue*="' + (record?.lastName || '') + '"]') as HTMLInputElement)?.value || record?.lastName,
        fullName: (modalElement.querySelector('input[defaultValue*="' + (record?.name || record?.fullName || '') + '"]') as HTMLInputElement)?.value || record?.fullName,
        jobTitle: (modalElement.querySelector('input[defaultValue*="' + (record?.title || record?.jobTitle || '') + '"]') as HTMLInputElement)?.value || record?.jobTitle,
        department: (modalElement.querySelector('input[defaultValue*="' + (record?.department || '') + '"]') as HTMLInputElement)?.value || record?.department,
        
        // Speedrun Summary (Overview tab)
        status: (modalElement.querySelector('select[defaultValue*="' + (record?.status || 'active') + '"]') as HTMLSelectElement)?.value || record?.status,
        engagementLevel: (modalElement.querySelector('select[defaultValue*="' + (record?.engagementLevel || 'medium') + '"]') as HTMLSelectElement)?.value || record?.engagementLevel,
        influenceLevel: (modalElement.querySelector('select[defaultValue*="' + (record?.influenceLevel || 'medium') + '"]') as HTMLSelectElement)?.value || record?.influenceLevel,
        decisionPower: (modalElement.querySelector('select[defaultValue*="' + (record?.decisionPower || 'limited') + '"]') as HTMLSelectElement)?.value || record?.decisionPower,
        priority: (modalElement.querySelector('select[defaultValue*="' + (record?.priority || 'medium') + '"]') as HTMLSelectElement)?.value || record?.priority,
        isBuyerGroupMember: (modalElement.querySelector('select[defaultValue*="' + (record?.isBuyerGroupMember ? 'yes' : 'no') + '"]') as HTMLSelectElement)?.value === 'yes',
        
        // Intelligence tab
        engagementStrategy: (modalElement.querySelector('select[defaultValue*="' + (record?.engagementStrategy || 'standard') + '"]') as HTMLSelectElement)?.value || record?.engagementStrategy,
        buyerGroupOptimized: (modalElement.querySelector('select[defaultValue*="' + (record?.buyerGroupOptimized ? 'yes' : 'no') + '"]') as HTMLSelectElement)?.value === 'yes',
        seniority: (modalElement.querySelector('select[defaultValue*="' + (record?.seniority || 'mid-level') + '"]') as HTMLSelectElement)?.value || record?.seniority,
        communicationStyle: (modalElement.querySelector('select[defaultValue*="' + (record?.communicationStyle || 'professional') + '"]') as HTMLSelectElement)?.value || record?.communicationStyle,
        engagementScore: parseInt((modalElement.querySelector('input[type="number"][defaultValue*="' + (record?.engagementScore || 0) + '"]') as HTMLInputElement)?.value || '0'),
        influenceScore: parseInt((modalElement.querySelector('input[type="number"][defaultValue*="' + (record?.influenceScore || 0) + '"]') as HTMLInputElement)?.value || '0'),
        decisionPowerScore: parseInt((modalElement.querySelector('input[type="number"][defaultValue*="' + (record?.decisionPowerScore || 0) + '"]') as HTMLInputElement)?.value || '0'),
        relationshipWarmth: (modalElement.querySelector('select[defaultValue*="' + (record?.relationshipWarmth || 'cold') + '"]') as HTMLSelectElement)?.value || record?.relationshipWarmth,
        
        // Career tab
        industry: (modalElement.querySelector('input[defaultValue*="' + (record?.industry || '') + '"]') as HTMLInputElement)?.value || record?.industry,
        yearsExperience: parseInt((modalElement.querySelector('input[type="number"][defaultValue*="' + (record?.yearsExperience || '') + '"]') as HTMLInputElement)?.value || '0'),
        educationLevel: (modalElement.querySelector('select[defaultValue*="' + (record?.educationLevel || '') + '"]') as HTMLSelectElement)?.value || record?.educationLevel,
        skills: (modalElement.querySelector('input[placeholder*="Comma-separated skills"]') as HTMLInputElement)?.value || record?.skills,
        certifications: (modalElement.querySelector('input[placeholder*="Comma-separated certifications"]') as HTMLInputElement)?.value || record?.certifications,
        
        // Activity tab (Contact info) - mapped to streamlined schema fields
        email: (modalElement.querySelector('input[type="email"]') as HTMLInputElement)?.value || record?.email,
        workEmail: (modalElement.querySelector('input[type="email"]') as HTMLInputElement)?.value || record?.workEmail,
        phone: (modalElement.querySelector('input[type="tel"]') as HTMLInputElement)?.value || record?.phone,
        mobilePhone: (modalElement.querySelector('input[type="tel"]') as HTMLInputElement)?.value || record?.mobilePhone,
        linkedinUrl: (modalElement.querySelector('input[type="url"]') as HTMLInputElement)?.value || record?.linkedinUrl,
        city: (modalElement.querySelector('input[defaultValue*="' + (record?.location || record?.city || '') + '"]') as HTMLInputElement)?.value || record?.city,
        lastContactDate: (modalElement.querySelector('input[type="date"]') as HTMLInputElement)?.value || record?.lastContactDate,
        nextActionDate: (modalElement.querySelectorAll('input[type="date"]')[1] as HTMLInputElement)?.value || record?.nextActionDate,
        nextAction: (modalElement.querySelector('input[defaultValue*="' + (record?.nextAction || '') + '"]') as HTMLInputElement)?.value || record?.nextAction,
        bestContactTime: (modalElement.querySelector('select[defaultValue*="' + (record?.bestContactTime || 'morning') + '"]') as HTMLSelectElement)?.value || record?.bestContactTime,
        
        // Notes tab
        notes: (modalElement.querySelector('textarea') as HTMLTextAreaElement)?.value || record?.notes,
        tags: (modalElement.querySelector('input[placeholder*="Comma-separated tags"]') as HTMLInputElement)?.value || record?.tags,
        valueDriver: (modalElement.querySelector('input[placeholder*="What drives value"]') as HTMLInputElement)?.value || record?.valueDriver,
      };
      
      // Make API call to update the record using v1 APIs
      let response: Response;
      
      if (recordType === 'speedrun' || recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities') {
        // All people-related records use v1 people API
        console.log('🔍 [DEBUG] Using v1 people API for record type:', recordType);
        response = await authFetch(`/api/v1/people/${record.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else if (recordType === 'companies') {
        // Use v1 companies API
        console.log('🔍 [DEBUG] Using v1 companies API');
        response = await authFetch(`/api/v1/companies/${record.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // For other record types, try to use appropriate v1 API or throw error
        console.log('🔍 [DEBUG] Unsupported record type for v1 migration:', recordType);
        throw new Error(`Record type '${recordType}' is not yet supported in v1 APIs. Please use companies or people records.`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DEBUG] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to update record: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showMessage('Record updated successfully!');
        
        // Close the modal
        setIsEditRecordModalOpen(false);
        
        // Trigger record update callback if provided
        if (onRecordUpdate) {
          onRecordUpdate(result.record);
        }
        
        // Refresh the page to show updated data
        window.location.reload();
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
    
    const recordName = record.fullName || record.name || record.companyName || 'this record';
    
    if (deleteConfirmName !== recordName) {
      alert(`Please type "${recordName}" to confirm deletion.`);
      return;
    }

    try {
      setLoading(true);
      
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
                     recordType === 'timeline' ? 'actions' : 'people',
          entityId: record.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete record');
      }

      // Close the modal first
      setIsEditRecordModalOpen(false);
      
      // Navigate back to the table view immediately
      if (onBack) {
        onBack();
      }
      
      // Show success message after navigation (with a small delay to ensure navigation completes)
      setTimeout(() => {
        showMessage('Record moved to trash successfully!', 'success');
      }, 100);
    } catch (error) {
      console.error('Error deleting record:', error);
      showMessage('Failed to delete record. Please try again.', 'error');
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
        onClick={() => setIsEditRecordModalOpen(true)}
        className="px-3 py-1.5 text-sm bg-[var(--background)] text-gray-700 border border-[var(--border)] rounded-md hover:bg-[var(--panel-background)] transition-colors"
      >
        {updateButtonText}
      </button>
    );

    // Add Action button - Check URL path to determine button text and styling
    if (recordType === 'speedrun') {
      // Check if we're on the sprint page or individual record page
      const isOnSprintPage = typeof window !== 'undefined' && window.location.pathname.includes('/speedrun/sprint');
      
      if (isOnSprintPage) {
        // On sprint page: Show "Add Action" with green styling and keyboard shortcut - Responsive for 15-inch laptops
        buttons.push(
          <button
            key="add-action"
            onClick={() => setIsAddActionModalOpen(true)}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-800 border border-green-200 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
          >
            <span className="hidden xs:inline">Add Action ({getCommonShortcut('SUBMIT')})</span>
            <span className="xs:hidden">Add</span>
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
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1"
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
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
          >
            Advance to Opportunity
          </button>
        );
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

  // Render tab content
  const renderTabContent = () => {
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
        return <TabComponent key={activeTab} record={record} recordType={recordType} />;
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
              <UniversalCompanyTab key={activeTab} record={record} recordType={recordType} /> :
              recordType === 'people' || recordType === 'speedrun' ?
                <PersonOverviewTab key={activeTab} record={record} recordType={recordType} /> :
              recordType === 'prospects' ?
                <ProspectOverviewTab key={activeTab} record={record} recordType={recordType} /> :
                <UniversalOverviewTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'career':
          console.log(`💼 [UNIVERSAL] Rendering career tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <ComprehensiveCareerTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'strategy':
          console.log(`🎯 [UNIVERSAL] Rendering strategy tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalStrategyTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'buyer-groups':
          console.log(`👥 [UNIVERSAL] Rendering buyer groups tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            recordType === 'companies' ? 
              <UniversalBuyerGroupsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} /> :
              <UniversalBuyerGroupsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
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
        case 'news':
          console.log(`📰 [UNIVERSAL] Rendering news tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalNewsTab key={activeTab} record={record} recordType={recordType} />
          );
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
              <UniversalTimelineTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'timeline':
          return renderTabWithErrorBoundary(
            <UniversalTimelineTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'notes':
          return renderTabWithErrorBoundary(
            <NotesTab key={activeTab} record={record} recordType={recordType} />
          );
        default:
          console.warn(`🔄 [UNIVERSAL] Unknown tab: ${activeTab}, falling back to overview`);
          return renderTabWithErrorBoundary(
            <UniversalOverviewTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
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
              className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Go to Overview Tab
            </button>
          </div>
        </div>
      );
    }
  };

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
            record={record}
            recordType={recordType}
            onBack={onBack}
            workspaceId={record?.workspaceId}
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
                setActiveTab(tab.id);
                updateURLTab(tab.id);
                // Reset scroll position to top when switching tabs
                if (contentRef.current) {
                  contentRef.current.scrollTop = 0;
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[var(--panel-background)] text-[var(--foreground)] border border-[var(--border)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
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
          <div key={`${activeTab}-${record?.id}`} className="px-1 min-h-[400px]">
            {renderTabContent()}
          </div>
        )}
      </div>

      {/* Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        record={record}
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
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
                disabled={loading || deleteConfirmName.trim() !== getDisplayName()}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  loading || deleteConfirmName.trim() !== getDisplayName()
                    ? 'bg-gray-300 text-[var(--muted)] cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
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
        section={recordType}
        isLoading={loading}
      />

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
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'intelligence', label: 'Intelligence' },
                  { id: 'career', label: 'Career' },
                  { id: 'activity', label: 'Activity' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'delete', label: 'Delete' }
                ].map((tab) => (
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
            <div className="space-y-4">
              {activeEditTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          defaultValue={formatFieldValue(record?.name || record?.fullName, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.name || record?.fullName) ? '' : '-'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
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
                          defaultValue={formatFieldValue(record?.department, '')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formatFieldValue(record?.department) ? '' : '-'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speedrun Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Speedrun Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                        <select
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
                          defaultValue={record?.isBuyerGroupMember ? 'yes' : 'no'}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
                      placeholder={`Type "${record?.fullName || record?.name || 'this record'}" to confirm`}
                    />
                  </div>
                </div>
              )}
            </div>

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
                    disabled={loading || deleteConfirmName !== (record?.fullName || record?.name || 'this record')}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="px-4 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
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
    if (!status) return 'bg-[var(--hover)] text-gray-800';
    const statusLower = status.toLowerCase();
    if (['new', 'uncontacted'].includes(statusLower)) return 'bg-blue-100 text-blue-800';
    if (['contacted', 'responded'].includes(statusLower)) return 'bg-[var(--hover)] text-gray-800';
    if (['qualified', 'hot'].includes(statusLower)) return 'bg-green-100 text-green-800';
    if (['closed_won', 'won'].includes(statusLower)) return 'bg-green-100 text-green-800';
    if (['closed_lost', 'lost'].includes(statusLower)) return 'bg-red-100 text-red-800';
    return 'bg-[var(--hover)] text-gray-800';
  };

  const getPriorityColor = (priority?: string): string => {
    if (!priority) return 'bg-[var(--hover)] text-gray-800';
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'high') return 'bg-red-100 text-red-800';
    if (priorityLower === 'medium') return 'bg-[var(--hover)] text-gray-800';
    if (priorityLower === 'low') return 'bg-green-100 text-green-800';
    return 'bg-[var(--hover)] text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Full Name</label>
              <InlineEditField
                value={record?.fullName || record?.name || ''}
                field="fullName"
                recordId={record?.id || ''}
                recordType="universal"
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
                  recordType="universal"
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
                  recordType="universal"
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
                recordType="universal"
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
                recordType="universal"
                placeholder="Enter department"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Status</label>
              <InlineEditField
                value={record?.status || 'new'}
                field="status"
                recordId={record?.id || ''}
                recordType="universal"
                type="text"
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
                recordType="universal"
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
                recordType="universal"
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
                recordType="universal"
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
                recordType="universal"
                inputType="email"
                placeholder="Enter work email"
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
                recordType="universal"
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
                recordType="universal"
                inputType="tel"
                placeholder="Enter mobile phone"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">LinkedIn</label>
              <InlineEditField
                value={record?.linkedinUrl || record?.linkedin || ''}
                field="linkedinUrl"
                recordId={record?.id || ''}
                recordType="universal"
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
                value={record?.company || record?.companyName || ''}
                field="company"
                recordId={record?.id || ''}
                recordType="universal"
                placeholder="Enter company name"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Company Domain</label>
              <InlineEditField
                value={record?.companyDomain || record?.domain || ''}
                field="companyDomain"
                recordId={record?.id || ''}
                recordType="universal"
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
                recordType="universal"
                placeholder="Enter industry"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Company Size</label>
              <InlineEditField
                value={record?.companySize || record?.employeeCount || ''}
                field="companySize"
                recordId={record?.id || ''}
                recordType="universal"
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
                recordType="universal"
                placeholder="Enter city"
                onSave={handleInlineSave}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] uppercase tracking-wide">State</label>
              <InlineEditField
                value={record?.state || ''}
                field="state"
                recordId={record?.id || ''}
                recordType="universal"
                placeholder="Enter state"
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
                recordType="universal"
                placeholder="Enter country"
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
            recordType="universal"
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



export function NotesTab({ record, recordType }: { record: any; recordType: string }) {
  // Initialize notes instantly from record prop
  const getInitialNotes = () => {
    if (record?.notes) {
      if (typeof record.notes === 'string') {
        return record.notes;
      } else if (typeof record.notes === 'object' && record.notes !== null) {
        return record.notes.content || record.notes.text || '';
      }
    }
    return '';
  };

  const [notes, setNotes] = React.useState<string>(getInitialNotes);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

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
            
            // Only update if the notes are different (to avoid overwriting user changes)
            if (freshNotes !== notes) {
              setNotes(freshNotes);
              console.log('✅ [NOTES] Silently updated notes:', { length: freshNotes.length });
            }
          }
        }
      } catch (error) {
        console.error('❌ [NOTES] Error refreshing notes:', error);
        // Silently fail - user already has notes from record prop
      }
    };

    refreshNotes();
  }, [record?.id, recordType]); // Only depend on record ID and type, not the full record

  // Auto-save function using v1 APIs
  const saveNotes = React.useCallback(async (notesContent: string) => {
    if (!record?.id) {
      console.log('❌ [NOTES] No record ID, skipping save');
      return;
    }

    try {
      console.log('💾 [NOTES] Starting save for:', { recordId: record.id, recordType, contentLength: notesContent.length });
      setSaveStatus('saving');

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
      // Clear saved status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      
    } catch (error) {
      console.error('❌ [NOTES] Error saving notes:', error);
      setSaveStatus('error');
      // Clear error status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [record?.id, recordType]);

  return (
    <div className="h-full">
      <NotesEditor
        value={notes}
        onChange={setNotes}
        placeholder="Add your notes here..."
        autoSave={true}
        saveStatus={saveStatus}
        onSave={saveNotes}
        debounceMs={500}
        lastSavedAt={lastSavedAt}
        className="h-full"
      />
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
                      activity['outcome'] === 'positive' ? 'bg-green-100 text-green-800' :
                      activity['outcome'] === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-[var(--hover)] text-gray-800'
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
