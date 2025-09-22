"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { UpdateModal } from './UpdateModal';
import { AddActionModal } from './AddActionModal';
import { AddTaskModal } from './AddTaskModal';
import { UnifiedAddActionButton } from '@/platform/ui/components/UnifiedAddActionButton';
import { TrashIcon, CameraIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { InlineEditField } from './InlineEditField';
import { TabErrorBoundary } from './TabErrorBoundary';
import { Loader } from '@/platform/ui/components/Loader';
import { SuccessMessage } from '@/platform/ui/components/SuccessMessage';
import { useInlineEdit } from '@/platform/hooks/useInlineEdit';
import { ProfileImageUploadModal } from './ProfileImageUploadModal';
import { PipelineProgress } from './PipelineProgress';

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
  UniversalCareerTab,
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

// Import new comprehensive tab components
import { UniversalInsightsTab as ComprehensiveInsightsTab } from './tabs/UniversalInsightsTab';
import { UniversalCareerTab as ComprehensiveCareerTab } from './tabs/UniversalCareerTab';
import { UniversalHistoryTab } from './tabs/UniversalHistoryTab';
import { UniversalBuyerGroupTab } from './tabs/UniversalBuyerGroupTab';
import { UniversalProfileTab as ComprehensiveProfileTab } from './tabs/UniversalProfileTab';
import { UniversalCompanyTab as ComprehensiveCompanyTab } from './tabs/UniversalCompanyTab';
import { HierarchicalBreadcrumb } from './HierarchicalBreadcrumb';
import { URLFixer } from './URLFixer';

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
          { id: 'strategy', label: 'Strategy' },
          { id: 'buyer-groups', label: 'Buyer Group' },
          { id: 'notes', label: 'Notes' },
          { id: 'timeline', label: 'Timeline' }
        ];
    case 'prospects':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'strategy', label: 'Strategy' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'industry', label: 'Industry' },
        { id: 'competitive', label: 'Competitors' }
      ];
    case 'opportunities':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'deal-intel', label: 'Deal Intel' },
        { id: 'stakeholders', label: 'Stakeholders' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'close-plan', label: 'Close Plan' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'companies':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'intelligence', label: 'Intelligence' },
        { id: 'buyer-groups', label: 'Buyer Group' },
        { id: 'notes', label: 'Notes' },
        { id: 'timeline', label: 'Timeline' }
      ];
    case 'people':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'insights', label: 'Insights' },
        { id: 'profile', label: 'Profile' },
        { id: 'career', label: 'Career' },
        { id: 'company', label: 'Company' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'clients':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'relationship', label: 'Relationship' },
        { id: 'business', label: 'Business' },
        { id: 'personal', label: 'Personal' },
        { id: 'success', label: 'Success' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'partners':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'partnership', label: 'Partnership' },
        { id: 'collaboration', label: 'Collaboration' },
        { id: 'performance', label: 'Performance' },
        { id: 'opportunities', label: 'Opportunities' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'notes', label: 'Notes' }
      ];
    case 'sellers':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'companies', label: 'Companies' },
        { id: 'performance', label: 'Performance' },
        { id: 'profile', label: 'Profile' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'notes', label: 'Notes' }
      ];
    default:
      return [
        { id: 'overview', label: 'Home' },
        { id: 'company', label: companyName },
        { id: 'industry', label: 'Industry' },
        { id: 'career', label: 'Career' },
        { id: 'landmines', label: 'Landmines' },
        { id: 'timeline', label: 'Timeline' },
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
  contextualActions = []
}: UniversalRecordTemplateProps) {
  const router = useRouter();
  const { setCurrentRecord, clearCurrentRecord } = useRecordContext();
  const [activeTab, setActiveTab] = useState((customTabs || DEFAULT_TABS)[0]?.id || 'overview');
  const [loading, setLoading] = useState(false);
  
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
  const [hasLoggedAction, setHasLoggedAction] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const tabs = customTabs || getTabsForRecordType(recordType, record);
  
  // Reset active tab when tabs change to ensure valid tab is selected
  useEffect(() => {
    const validTabIds = tabs.map(tab => tab.id);
    if (!validTabIds.includes(activeTab)) {
      const newTab = tabs[0]?.id || 'overview';
      setActiveTab(newTab);
    }
  }, [tabs, activeTab]);

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
        const title = record?.title || record?.jobTitle;
        const company = record?.company || record?.companyName || 'Company';
        return title ? `${title} • ${company}` : company;
      case 'opportunities':
      case 'deals':
        return `${record?.stage || 'Unknown Stage'} • ${record?.amount || record?.value ? `$${(record.amount || record.value).toLocaleString()}` : 'No Amount'}`;
      case 'companies':
        return `${record?.industry || 'Unknown Industry'} • ${record?.size || record?.employeeCount || 'Unknown Size'}`;
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
      
      // Map common fields - using bracket notation for TypeScript strict mode
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
      if (updatedData['phone']) updatePayload['phone'] = updatedData['phone'];
      if (updatedData['title']) updatePayload['jobTitle'] = updatedData['title'];
      if (updatedData['jobTitle']) updatePayload['jobTitle'] = updatedData['jobTitle'];
      if (updatedData['company']) updatePayload['company'] = updatedData['company'];
      if (updatedData['status']) updatePayload['status'] = updatedData['status'];
      if (updatedData['priority']) updatePayload['priority'] = updatedData['priority'];
      if (updatedData['notes']) updatePayload['notes'] = updatedData['notes'];
      if (updatedData['industry']) updatePayload['industry'] = updatedData['industry'];
      if (updatedData['linkedin']) updatePayload['linkedin'] = updatedData['linkedin'];
      if (updatedData['linkedinUrl']) updatePayload['linkedinUrl'] = updatedData['linkedinUrl'];
      if (updatedData['companyDomain']) updatePayload['companyDomain'] = updatedData['companyDomain'];
      if (updatedData['companySize']) updatePayload['companySize'] = updatedData['companySize'];
      if (updatedData['department']) updatePayload['department'] = updatedData['department'];
      if (updatedData['city']) updatePayload['city'] = updatedData['city'];
      if (updatedData['state']) updatePayload['state'] = updatedData['state'];
      if (updatedData['country']) updatePayload['country'] = updatedData['country'];
      if (updatedData['postalCode']) updatePayload['postalCode'] = updatedData['postalCode'];
      if (updatedData['relationship']) updatePayload['relationship'] = updatedData['relationship'];
      if (updatedData['source']) updatePayload['source'] = updatedData['source'];
      if (updatedData['estimatedValue']) updatePayload['estimatedValue'] = updatedData['estimatedValue'];
      if (updatedData['currency']) updatePayload['currency'] = updatedData['currency'];
      if (updatedData['expectedCloseDate']) updatePayload['expectedCloseDate'] = updatedData['expectedCloseDate'];
      if (updatedData['stage']) updatePayload['stage'] = updatedData['stage'];
      if (updatedData['probability']) updatePayload['probability'] = updatedData['probability'];
      if (updatedData['nextAction']) updatePayload['nextAction'] = updatedData['nextAction'];
      if (updatedData['nextActionDate']) updatePayload['nextActionDate'] = updatedData['nextActionDate'];
      if (updatedData['lastActionDate']) updatePayload['lastActionDate'] = updatedData['lastActionDate'];
      if (updatedData['tags']) updatePayload['tags'] = updatedData['tags'];
      if (updatedData['painPoint1']) updatePayload['painPoint1'] = updatedData['painPoint1'];
      if (updatedData['painPoint2']) updatePayload['painPoint2'] = updatedData['painPoint2'];
      if (updatedData['valueProp1']) updatePayload['valueProp1'] = updatedData['valueProp1'];
      if (updatedData['valueProp2']) updatePayload['valueProp2'] = updatedData['valueProp2'];
      if (updatedData['openingLine']) updatePayload['openingLine'] = updatedData['openingLine'];
      if (updatedData['bestContactMethod']) updatePayload['bestContactMethod'] = updatedData['bestContactMethod'];
      
      // Make API call to update the record using unified API
      const response = await fetch('/api/data/unified', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: recordType,
          action: 'update',
          id: record.id,
          data: updatePayload,
          workspaceId: record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace ID as fallback
          userId: '01K1VBYZG41K9QA0D9CF06KNRG' // Dan's user ID as fallback
        }),
      });
      
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
      
      // Make API call to soft delete the record using unified API
      const response = await fetch(`/api/data/unified?type=${recordType}&id=${recordId}&workspaceId=${record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP'}&userId=01K1VBYZG41K9QA0D9CF06KNRG`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
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
      
      // Make API call to save the change using unified API
      const requestPayload = {
        type: apiRecordType,
        action: 'update',
        id: targetId,
        data: updateData,
        workspaceId: record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace ID as fallback
        userId: '01K1VBYZG41K9QA0D9CF06KNRG' // Dan's user ID as fallback
      };
      
      console.log(`🔄 [UNIVERSAL] Making API call to update ${apiField} for ${apiRecordType} ${targetId}`);
      console.log(`🔄 [UNIVERSAL] Request payload:`, JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch('/api/data/unified', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      
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
      console.log('🗑️ [UNIVERSAL] Deleting record:', record.id);
      
      // TODO: Implement actual delete API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showMessage('Record deleted successfully!');
      setTimeout(() => {
        onBack(); // Go back to list after successful deletion
      }, 2000);
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error deleting record:', error);
      alert('Failed to delete record. Please try again.');
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
      
      // Make API call to advance lead to prospect
      const response = await fetch('/api/data/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: recordType,
          action: 'advance_to_prospect',
          id: record.id,
          data: record,
          workspaceId: record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace ID as fallback
          userId: '01K1VBYZG41K9QA0D9CF06KNRG' // Dan's user ID as fallback
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to advance to prospect: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [UNIVERSAL] Successfully advanced to prospect:', result);
      
      showMessage('Successfully advanced to prospect!');
      
      // Update URL to prospects page
      const newProspectId = result.newRecordId || record.id.replace('lead_', 'prospect_');
      
      // Get current path and replace the section properly
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/prospects/${newProspectId}`;
        console.log(`🔗 [ADVANCE] Navigating to prospect: ${newUrl}`);
        window.location.href = newUrl;
      } else {
        const newUrl = `/prospects/${newProspectId}`;
        console.log(`🔗 [ADVANCE] Navigating to prospect: ${newUrl}`);
        window.location.href = newUrl;
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
      console.log('⬆️ [UNIVERSAL] Advancing to lead:', record.id);
      
      // Make API call to advance prospect to lead
      const response = await fetch('/api/data/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: recordType,
          action: 'advance_to_opportunity',
          id: record.id,
          data: record,
          workspaceId: record?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace ID as fallback
          userId: '01K1VBYZG41K9QA0D9CF06KNRG' // Dan's user ID as fallback
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to advance to lead: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [UNIVERSAL] Successfully advanced to lead:', result);
      
      showMessage('Successfully advanced to lead!');
      
      // Update URL to leads page
      const newLeadId = result.newRecordId || record.id.replace('prospect_', 'lead_');
      
      // Create a proper slug format: name-ulid (matching existing pattern)
      const leadName = record.fullName || record.name || 'lead';
      const cleanName = leadName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const leadSlug = `${cleanName}-${newLeadId}`;
      
      // Get current path and replace the section properly
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/leads/${leadSlug}`;
        console.log(`🔗 [ADVANCE] Navigating to lead: ${newUrl}`);
        window.location.href = newUrl;
      } else {
        const newUrl = `/leads/${leadSlug}`;
        console.log(`🔗 [ADVANCE] Navigating to lead: ${newUrl}`);
        window.location.href = newUrl;
      }
      
    } catch (error) {
      console.error('❌ [UNIVERSAL] Error advancing to lead:', error);
      showMessage('Failed to advance to lead. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle action submission
  const handleActionSubmit = async (actionData: any) => {
    try {
      setLoading(true);
      console.log('🔄 [UNIVERSAL] Submitting action:', actionData);
      
      // Make API call to log the action
      const response = await fetch('/api/actions/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: record.id,
          recordType: recordType,
          actionType: actionData.actionType,
          notes: actionData.notes,
          nextAction: actionData.nextAction,
          nextActionDate: actionData.nextActionDate,
          actionPerformedBy: actionData.actionPerformedBy,
          contactId: actionData.contactId,
          workspaceId: record.workspaceId || 'default', // Fallback if not available
          userId: record.userId || 'default' // Fallback if not available
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to log action: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showMessage('Action logged successfully!');
        
        // Close the modal
        setIsAddActionModalOpen(false);
        
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
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {action.label}
          </button>
        );
      }
    });

    // Edit button removed per user request

    // Add Action button - WHITE BUTTON WITH GRAY BORDER
    buttons.push(
      <button
        key="add-action"
        onClick={() => setIsAddActionModalOpen(true)}
        className="px-3 py-1.5 text-sm bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Add Action
      </button>
    );

    // Context-aware advance button
    if (recordType === 'leads') {
      // Advance to Lead button - LIGHT GRAY BUTTON (for leads)
      buttons.push(
        <button
          key="advance-to-prospect"
          onClick={handleAdvanceToProspect}
          className="px-3 py-1.5 text-sm bg-gray-50 text-gray-900 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
        >
          Advance to Prospect
        </button>
      );
    } else if (recordType === 'prospects') {
      // Advance to Lead button - LIGHT BLUE BUTTON (matching list page style)
      buttons.push(
        <button
          key="advance-to-lead"
          onClick={handleAdvanceToOpportunity}
          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          Advance to Lead
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
            <div className="mt-4 text-xs text-gray-500">
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
            <UniversalOverviewTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'strategy':
          console.log(`🎯 [UNIVERSAL] Rendering strategy tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            <UniversalStrategyTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
          );
        case 'buyer-groups':
          console.log(`👥 [UNIVERSAL] Rendering buyer groups tab for ${recordType}`);
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <UniversalBuyerGroupTab key={activeTab} recordType={recordType} /> :
              <UniversalBuyerGroupsTab key={activeTab} record={record} recordType={recordType} onSave={handleInlineFieldSave} />
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
            <UniversalInsightsTab key={activeTab} record={record} recordType={recordType} />
          );
        case 'company':
          return renderTabWithErrorBoundary(
            recordType === 'people' ? 
              <ComprehensiveCompanyTab key={activeTab} record={record} recordType={recordType} /> :
              <UniversalCompanyTab key={activeTab} record={record} recordType={recordType} />
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
              <UniversalCareerTab key={activeTab} record={record} recordType={recordType} />
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

  return (
    <div className="h-full flex flex-col bg-white">
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
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <HierarchicalBreadcrumb 
            record={record}
            recordType={recordType}
            onBack={onBack}
            workspaceId={record?.workspaceId}
          />
          
          <div className="flex items-center gap-1">
            {(() => {
              console.log(`🔍 [UNIVERSAL] Navigation arrows state:`, {
                recordIndex,
                totalRecords,
                canGoPrevious: !(!recordIndex || recordIndex <= 1),
                canGoNext: !(!recordIndex || !totalRecords || recordIndex >= totalRecords),
                isPreviousDisabled: !recordIndex || recordIndex <= 1,
                isNextDisabled: !recordIndex || !totalRecords || recordIndex >= totalRecords,
                hasOnNavigatePrevious: !!onNavigatePrevious,
                hasOnNavigateNext: !!onNavigateNext
              });
              
              return (
                <>
                  <button
                    onClick={() => {
                      console.log(`🔍 [UNIVERSAL] Previous button clicked!`, {
                        hasOnNavigatePrevious: !!onNavigatePrevious,
                        recordIndex,
                        totalRecords
                      });
                      if (onNavigatePrevious) {
                        onNavigatePrevious();
                      } else {
                        console.warn(`❌ [UNIVERSAL] onNavigatePrevious is not defined!`);
                      }
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      !recordIndex || recordIndex <= 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-900 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    disabled={!recordIndex || recordIndex <= 1}
                    title="Previous record"
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
                        totalRecords
                      });
                      if (onNavigateNext) {
                        onNavigateNext();
                      } else {
                        console.warn(`❌ [UNIVERSAL] onNavigateNext is not defined!`);
                      }
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      !recordIndex || !totalRecords || recordIndex >= totalRecords
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-900 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    disabled={!recordIndex || !totalRecords || recordIndex >= totalRecords}
                    title="Next record"
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
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Minimal Avatar with Rank */}
            <div className="relative group">
              <div className="w-10 h-10 bg-white border border-gray-300 rounded-xl flex items-center justify-center overflow-hidden relative">
                {getProfileImageUrl() ? (
                  <img 
                    src={getProfileImageUrl()} 
                    alt={getDisplayName()}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-700">
                    {recordIndex !== undefined ? recordIndex + 1 : getFirstInitial()}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{getDisplayName()}</h1>
              <p className="text-sm text-gray-600">{getSubtitle()}</p>
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
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gray-50 text-gray-900 border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size="lg" />
          </div>
        ) : (
          <div key={`${activeTab}-${record?.id}`} className="px-1 py-1">
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
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
            <textarea
              placeholder="Enter your note here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Please type <strong>{getDisplayName()}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Enter record name"
              className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading || deleteConfirmName.trim() !== getDisplayName()}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  loading || deleteConfirmName.trim() !== getDisplayName()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Action Modal */}
      <AddActionModal
        isOpen={isAddActionModalOpen}
        onClose={() => setIsAddActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        record={record}
        recordType={recordType}
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
      return 'text-gray-600 bg-gray-50';
    }
    if (status === 'planned' || status === 'scheduled') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
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
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
          Recent Activity
        </h3>
        
        {activities['length'] === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No activities recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className={`p-2 rounded ${getStatusColor(activity.status, activity.outcome)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {normalizeActivityType(activity.type)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{activity.subject}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.completedAt || activity.createdAt)}
                    </span>
                  </div>
                  {activity['description'] && (
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status, activity.outcome)}`}>
                      {activity.status}
                    </span>
                    {activity['outcome'] && activity.outcome !== 'null' && (
                      <span className="text-xs text-gray-500">
                        {activity.outcome}
                      </span>
                    )}
                    {activity.duration !== null && activity.duration !== undefined && (
                      <span className="text-xs text-gray-500">
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
        <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusLower = status.toLowerCase();
    if (['new', 'uncontacted'].includes(statusLower)) return 'bg-blue-100 text-blue-800';
    if (['contacted', 'responded'].includes(statusLower)) return 'bg-gray-100 text-gray-800';
    if (['qualified', 'hot'].includes(statusLower)) return 'bg-green-100 text-green-800';
    if (['closed_won', 'won'].includes(statusLower)) return 'bg-green-100 text-green-800';
    if (['closed_lost', 'lost'].includes(statusLower)) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority?: string): string => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'high') return 'bg-red-100 text-red-800';
    if (priorityLower === 'medium') return 'bg-gray-100 text-gray-800';
    if (priorityLower === 'low') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Full Name</label>
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
                <label className="text-xs text-gray-500 uppercase tracking-wide">First Name</label>
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
                <label className="text-xs text-gray-500 uppercase tracking-wide">Last Name</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Title</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Department</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Priority</label>
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
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Role</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Work Email</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Mobile Phone</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">LinkedIn</label>
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
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Company Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Company</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Company Domain</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Industry</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Company Size</label>
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
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Location Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">City</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">State</label>
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
              <label className="text-xs text-gray-500 uppercase tracking-wide">Country</label>
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
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Notes & Description</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
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
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Company Details</h3>
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Company enrichment data will appear here when available.</p>
        </div>
      </div>
    </div>
  );
}



function NotesTab({ record, recordType }: { record: any; recordType: string }) {
  const handleSaveNotes = async (field: string, value: string) => {
    console.log(`💾 [NOTES-TAB] Saving ${field} for ${recordType}:`, record?.id, value);
    // TODO: Implement actual notes save API call
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Notes</h3>
        <InlineEditField
          value={record?.notes || ''}
          field="notes"
          recordId={record?.id || ''}
          recordType="universal"
          type="textarea"
          placeholder="Add notes about this record..."
          onSave={handleSaveNotes}
          className="w-full h-32"
        />
      </div>
    </div>
  );
}

function IndustryTab({ record, recordType }: { record: any; recordType: string }) {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Industry Information</h3>
        <div className="text-center py-12 text-gray-500">
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
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Career Information</h3>
        <div className="text-center py-12 text-gray-500">
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
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Landmines</h3>
        <div className="text-center py-12 text-gray-500">
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
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">History</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="sm" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{activity.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {activity.completedAt.toLocaleDateString()} • {activity.type}
                    </p>
                  </div>
                  {activity['outcome'] && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity['outcome'] === 'positive' ? 'bg-green-100 text-green-800' :
                      activity['outcome'] === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.outcome}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No history available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
