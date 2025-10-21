"use client";

/**
 * UPDATE MODAL
 * 
 * Modal for editing existing records with tabbed interface matching main record view
 */

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { 
  UserIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import { CompanySelector } from './CompanySelector';
import { formatFieldValue, getCompanyName, formatDateValue, formatArrayValue } from './utils/field-formatters';
import { UniversalBuyerGroupsTab } from './tabs/UniversalBuyerGroupsTab';
import { UniversalPeopleTab } from './tabs/UniversalPeopleTab';
import { UniversalActionsTab } from './tabs/UniversalActionsTab';
import { UniversalNewsTab } from './tabs/UniversalNewsTab';
import { UniversalCompanyIntelTab } from './tabs/UniversalCompanyIntelTab';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  recordType: 'speedrun' | 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners';
  onUpdate: (updatedData: any, actionData?: ActionLogData) => Promise<void>;
  onDelete?: (recordId: string) => Promise<void>;
  initialTab?: string;
  context?: 'sprint' | 'pipeline' | 'speedrun' | 'main';
  sourceApp?: string;
}

interface ActionLogData {
  actionType: string;
  notes: string;
  nextAction?: string;
  nextActionDate?: string;
}

export function UpdateModal({ isOpen, onClose, record, recordType, onUpdate, onDelete, initialTab, context = 'main', sourceApp }: UpdateModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [actionData, setActionData] = useState<ActionLogData>({
    actionType: 'update',
    notes: '',
    nextAction: '',
    nextActionDate: ''
  });
  const [includeAction, setIncludeAction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [previousTab, setPreviousTab] = useState<string>('');
  // Set default tab based on record type if initialTab is not provided
  const getDefaultTab = () => {
    if (initialTab) return initialTab;
    
    switch (recordType) {
      case 'speedrun':
      case 'leads':
      case 'prospects':
      case 'companies':
      case 'people':
        return 'overview';
      case 'opportunities':
        return 'overview';
      default:
        return 'home';
    }
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());

  // Handle tab change to track previous tab
  const handleTabChange = (tabId: string) => {
    if (activeTab !== 'delete') {
      setPreviousTab(activeTab);
    }
    setActiveTab(tabId);
  };

  // Get record display name with fallbacks (consistent with UniversalRecordTemplate)
  const getDisplayName = () => {
    return record?.name || 
           record?.fullName || 
           (record?.firstName && record?.lastName ? `${record.firstName} ${record.lastName}` : '') ||
           record?.companyName ||
           record?.title ||
           'Unknown Record';
  };

  // Handle delete with Vercel-style confirmation
  const handleDelete = async () => {
    if (!record?.id) return;
    
    const recordName = getDisplayName();
    
    if (deleteConfirmName !== recordName) {
      alert(`Please type "${recordName}" to confirm deletion.`);
      return;
    }

    try {
      setLoading(true);
      
      console.log(`🗑️ [UpdateModal] Deleting ${recordType} record: ${record.id}`);
      
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
                     recordType === 'actions' ? 'actions' : 'people',
          entityId: record.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ [UpdateModal] Deletion failed:`, responseData);
        throw new Error(responseData.error || 'Failed to delete record');
      }

      console.log(`✅ [UpdateModal] Deletion successful:`, responseData);

      // Close the modal first
      onClose();
      
      // Call the onDelete callback if provided (this should handle navigation and success message)
      if (onDelete) {
        await onDelete(record.id);
      } else {
        // Fallback: dispatch cache invalidation event for other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cache-invalidate', {
            detail: { 
              pattern: `${recordType}-*`, 
              reason: 'record_deleted',
              recordId: record.id
            }
          }));
        }
      }
    } catch (error) {
      console.error('❌ [UpdateModal] Error deleting record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete record. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tab configuration matching the main record view
  const getModalTabs = () => {
    switch (recordType) {
        case 'speedrun':
        case 'people':
          return [
            { id: 'overview', label: 'Overview' },
            { id: 'strategy', label: 'Strategy' },
            { id: 'actions', label: 'Actions' },
            { id: 'career', label: 'Career' },
            { id: 'notes', label: 'Notes' },
            { id: 'delete', label: 'Delete' }
          ];
        case 'companies':
          return [
            { id: 'overview', label: 'Overview' },
            { id: 'strategy', label: 'Strategy' },
            { id: 'actions', label: 'Actions' },
            { id: 'news', label: 'News' },
            { id: 'buyer-groups', label: 'Buyer Group' },
            { id: 'notes', label: 'Notes' },
            { id: 'delete', label: 'Delete' }
          ];
        case 'leads':
          return [
            { id: 'overview', label: 'Overview' },
            { id: 'strategy', label: 'Strategy' },
            { id: 'actions', label: 'Actions' },
            { id: 'career', label: 'Career' },
            { id: 'notes', label: 'Notes' },
            { id: 'delete', label: 'Delete' }
          ];
      case 'prospects':
        return [
          { id: 'overview', label: 'Overview' },
          { id: 'strategy', label: 'Strategy' },
          { id: 'actions', label: 'Actions' },
          { id: 'career', label: 'Career' },
          { id: 'notes', label: 'Notes' },
          { id: 'delete', label: 'Delete' }
        ];
      case 'opportunities':
        return [
          { id: 'overview', label: 'Overview' },
          { id: 'deal-intel', label: 'Deal Intel' },
          { id: 'stakeholders', label: 'Stakeholders' },
          { id: 'competitive', label: 'Competitive' },
          { id: 'close-plan', label: 'Close Plan' },
          { id: 'actions', label: 'Actions' },
          { id: 'notes', label: 'Notes' },
          { id: 'delete', label: 'Delete' }
        ];
      default:
        return [
          { id: 'home', label: 'Home' },
          { id: 'opportunity', label: 'Opportunity' },
          { id: 'company', label: 'Company' },
          { id: 'activity', label: 'Activity' },
          { id: 'notes', label: 'Notes' },
          { id: 'delete', label: 'Delete' }
        ];
    }
  };

  const MODAL_TABS = getModalTabs();

  const renderDeleteTab = () => {
    const recordName = getDisplayName();
    
    // Debug logging to help troubleshoot name matching issues
    console.log('🔍 [DELETE TAB] Record name calculation:', {
      recordName,
      recordFullName: record?.fullName,
      recordName: record?.name,
      recordCompanyName: record?.companyName,
      deleteConfirmName,
      namesMatch: deleteConfirmName === recordName,
      recordType,
      recordId: record?.id
    });
    
    return (
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            Delete {recordType === 'people' ? 'Person' : recordType === 'companies' ? 'Company' : 'Record'}
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
                  To confirm, type <strong>"{recordName}"</strong> in the box below:
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
            placeholder={`Type "${recordName}" to confirm`}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--border)]">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmName('');
                setActiveTab(previousTab || 'overview');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleteConfirmName.trim() !== recordName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Record'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Initialize form data with record data when modal opens
  useEffect(() => {
    if (isOpen && record) {
      if (recordType === 'companies') {
        // Company-specific form data
        setFormData({
          // Company Information
          name: record.name || '',
          legalName: record.legalName || '',
          tradingName: record.tradingName || '',
          localName: record.localName || '',
          description: record.description || '',
          website: record.website || '',
          email: record.email || '',
          phone: record.phone || '',
          fax: record.fax || '',
          
          // Business Details
          industry: record.industry || '',
          sector: record.sector || '',
          size: record.size || '',
          revenue: record.revenue || '',
          currency: record.currency || 'USD',
          employeeCount: record.employeeCount || '',
          foundedYear: record.foundedYear || '',
          
          // Location
          address: record.address || '',
          city: record.city || '',
          state: record.state || '',
          country: record.country || '',
          postalCode: record.postalCode || '',
          
          // Status & Tracking
          status: record.status || 'ACTIVE',
          priority: record.priority || 'MEDIUM',
          tags: record.tags || [],
          
          // Engagement
          lastAction: record.lastAction || '',
          lastActionDate: formatDateValue(record.lastActionDate),
          nextAction: record.nextAction || '',
          nextActionDate: formatDateValue(record.nextActionDate),
          nextActionReasoning: record.nextActionReasoning || '',
          nextActionPriority: record.nextActionPriority || '',
          nextActionType: record.nextActionType || '',
          
          // Legal & Registration
          registrationNumber: record.registrationNumber || '',
          taxId: record.taxId || '',
          vatNumber: record.vatNumber || '',
          domain: record.domain || '',
          logoUrl: record.logoUrl || '',
          
          // Intelligence Fields
          businessChallenges: record.businessChallenges || [],
          businessPriorities: record.businessPriorities || [],
          competitiveAdvantages: record.competitiveAdvantages || [],
          growthOpportunities: record.growthOpportunities || [],
          strategicInitiatives: record.strategicInitiatives || [],
          successMetrics: record.successMetrics || [],
          marketThreats: record.marketThreats || [],
          keyInfluencers: record.keyInfluencers || '',
          decisionTimeline: record.decisionTimeline || '',
          marketPosition: record.marketPosition || '',
          digitalMaturity: record.digitalMaturity || '',
          techStack: record.techStack || [],
          competitors: record.competitors || [],
          
          // Financial & Business
          lastFundingAmount: record.lastFundingAmount || '',
          lastFundingDate: formatDateValue(record.lastFundingDate),
          stockSymbol: record.stockSymbol || '',
          isPublic: record.isPublic || false,
          naicsCodes: record.naicsCodes || [],
          sicCodes: record.sicCodes || [],
          
          // Social Media
          linkedinUrl: record.linkedinUrl || '',
          linkedinFollowers: record.linkedinFollowers || '',
          twitterUrl: record.twitterUrl || '',
          twitterFollowers: record.twitterFollowers || '',
          facebookUrl: record.facebookUrl || '',
          instagramUrl: record.instagramUrl || '',
          youtubeUrl: record.youtubeUrl || '',
          githubUrl: record.githubUrl || '',
          
          // Location (HQ)
          hqLocation: record.hqLocation || '',
          hqFullAddress: record.hqFullAddress || '',
          hqCity: record.hqCity || '',
          hqState: record.hqState || '',
          hqStreet: record.hqStreet || '',
          hqZipcode: record.hqZipcode || '',
          hqRegion: record.hqRegion || [],
          hqCountryIso2: record.hqCountryIso2 || '',
          hqCountryIso3: record.hqCountryIso3 || '',
          
          // Company Updates
          activeJobPostings: record.activeJobPostings || '',
          numTechnologiesUsed: record.numTechnologiesUsed || '',
          technologiesUsed: record.technologiesUsed || [],
          
          // SBI Fields
          confidence: record.confidence || '',
          sources: record.sources || [],
          acquisitionDate: formatDateValue(record.acquisitionDate),
          lastVerified: formatDateValue(record.lastVerified),
          parentCompanyName: record.parentCompanyName || '',
          parentCompanyDomain: record.parentCompanyDomain || '',
          
          // Notes
          notes: record.notes || ''
        });
      } else {
        // Person/other record types
        setFormData({
          // Basic info
          name: record.fullName || record.name || '',
          firstName: record.firstName || '',
          lastName: record.lastName || '',
          email: record.email || record.workEmail || '',
          phone: record.phone || record.mobilePhone || record.workPhone || '',
          
          // Company info - handle both string and object formats
          company: record.company || record.companyName || '',
          vertical: record.vertical || '',
          
          // Job info
          jobTitle: record.jobTitle || record.title || '',
          department: record.department || '',
          
          // Contact details
          linkedinUrl: record.linkedinUrl || '',
          linkedinNavigatorUrl: record.linkedinNavigatorUrl || '',
          linkedinConnectionDate: formatDateValue(record.linkedinConnectionDate),
          bio: record.bio || '',
          address: record.address || '',
          city: record.city || '',
          state: record.state || '',
          country: record.country || '',
          postalCode: record.postalCode || '',
          
          // Status and priority
          status: record.status || 'LEAD',
          priority: record.priority || 'MEDIUM',
          
          // Opportunity fields
          estimatedValue: record.estimatedValue || '',
          currency: record.currency || 'USD',
          expectedCloseDate: formatDateValue(record.expectedCloseDate),
          stage: record.stage || record.currentStage || '',
          probability: record.probability || '',
          
          // Activity fields
          nextAction: record.nextAction || '',
          nextActionDate: formatDateValue(record.nextActionDate),
          lastActionDate: formatDateValue(record.lastActionDate),
          
          // Engagement fields
          engagementStrategy: record.engagementStrategy || '',
          preferredContact: record.preferredContact || '',
          communicationStyle: record.communicationStyle || '',
          
          // Notes
          notes: record.notes || record.description || '',
          tags: record.tags || []
        });
      }
      
      // Set initial tab from prop or default
      setActiveTab(getDefaultTab());
    }
  }, [isOpen, record, initialTab, recordType]);

  const getSectionTitle = () => {
    switch (recordType) {
      case "leads":
        return "Lead";
      case "prospects":
        return "Prospect";
      case "opportunities":
        return "Opportunity";
      case "partners":
        return "Partner";
      case "people":
        return "Person";
      case "companies":
        return "Company";
      case "clients":
        return "Client";
      default:
        return "Record";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await onUpdate(formData, includeAction ? actionData : undefined);
      onClose();
    } catch (error) {
      console.error('Error updating record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update record';
      alert(`${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut for Update Record when modal is open
  useEffect(() => {
    // Only attach event listeners when modal is open
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('⌨️ [UpdateModal] Update Record keyboard shortcut triggered');
        
        // Call handleSubmit directly with a synthetic event
        if (!loading) {
          const syntheticEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
          } as React.FormEvent;
          handleSubmit(syntheticEvent);
        }
      }
    };

    // Use both capture and bubble phases to ensure we get the event
    document.addEventListener('keydown', handleKeyDown, true); // Capture phase
    document.addEventListener('keydown', handleKeyDown, false); // Bubble phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isOpen, loading, handleSubmit]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Contact-specific tab render functions
  const renderProfileTab = () => (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter department"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seniority
          </label>
          <select
            value={formData.seniority || ''}
            onChange={(e) => handleInputChange('seniority', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select seniority</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="executive">Executive</option>
            <option value="c-suite">C-Suite</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          value={formData.city || ''}
          onChange={(e) => handleInputChange('city', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter city"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn URL
        </label>
        <input
          type="url"
          value={formData.linkedinUrl || ''}
          onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter LinkedIn profile URL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Navigator URL
        </label>
        <input
          type="url"
          value={formData.linkedinNavigatorUrl || ''}
          onChange={(e) => handleInputChange('linkedinNavigatorUrl', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter LinkedIn Navigator URL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Connection Date
        </label>
        <input
          type="date"
          value={formData.linkedinConnectionDate || ''}
          onChange={(e) => handleInputChange('linkedinConnectionDate', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bio URL
        </label>
        <input
          type="url"
          value={formData.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter bio URL"
        />
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Intelligence insights will appear here when available.</p>
      </div>
    </div>
  );

  const renderEngagementTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Engagement data will appear here when available.</p>
      </div>
    </div>
  );

  const renderPersonaTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Persona data is read-only in edit mode.</p>
        <p className="text-xs text-[var(--muted)] mt-2">Use the Overview tab to edit basic information.</p>
      </div>
    </div>
  );

  const renderCareerTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Career data is read-only in edit mode.</p>
        <p className="text-xs text-[var(--muted)] mt-2">Use the Overview tab to edit basic information.</p>
      </div>
    </div>
  );

  const renderRoleTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Role information is read-only in edit mode.</p>
        <p className="text-xs text-[var(--muted)] mt-2">Use the Overview tab to edit basic information.</p>
      </div>
    </div>
  );

  const renderEnablersTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Enablers and reports are read-only in edit mode.</p>
        <p className="text-xs text-[var(--muted)] mt-2">Use the main record view to access reports and tools.</p>
      </div>
    </div>
  );

  const renderValueTab = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Value Propositions & Benefits</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Value Proposition 1</label>
            <textarea
              value={formData.valueProp1 || ''}
              onChange={(e) => handleInputChange('valueProp1', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter value proposition or benefit..."
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Value Proposition 2</label>
            <textarea
              value={formData.valueProp2 || ''}
              onChange={(e) => handleInputChange('valueProp2', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter value proposition or benefit..."
              rows={2}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Pain Points & Challenges</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Pain Point 1</label>
            <textarea
              value={formData.painPoint1 || ''}
              onChange={(e) => handleInputChange('painPoint1', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter pain point or challenge..."
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Pain Point 2</label>
            <textarea
              value={formData.painPoint2 || ''}
              onChange={(e) => handleInputChange('painPoint2', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter pain point or challenge..."
              rows={2}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Positioning & Messaging</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Engagement Strategy</label>
            <textarea
              value={formData.engagementStrategy || ''}
              onChange={(e) => handleInputChange('engagementStrategy', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter engagement strategy or opening approach..."
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Preferred Contact Method</label>
            <select
              value={formData.preferredContact || ''}
              onChange={(e) => handleInputChange('preferredContact', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Method</option>
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
              <option value="phone">Phone</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunitiesTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Related opportunities will appear here when available.</p>
        <p className="text-xs text-[var(--muted)] mt-2">This is a read-only view of opportunities associated with this company.</p>
      </div>
    </div>
  );

  const renderBuyerGroupsTab = () => (
    <div className="p-6 space-y-4">
      <UniversalBuyerGroupsTab 
        record={record} 
        recordType={recordType} 
        onSave={async (field: string, value: string) => {
          // Create a simple inline save handler that updates the record
          const updatedData = { [field]: value };
          await onUpdate(updatedData);
        }} 
      />
    </div>
  );

  const renderWorkplaceTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Workplace data is read-only in edit mode.</p>
        <p className="text-xs text-[var(--muted)] mt-2">Use the Overview tab to edit basic information.</p>
      </div>
    </div>
  );

  const renderTimelineTab = () => (
    <div className="p-6">
      <UniversalActionsTab record={record} recordType={recordType} />
    </div>
  );

  // Account-specific tab render functions
  const renderCompanyIntelTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Company intelligence will appear here when available.</p>
      </div>
    </div>
  );

  const renderContactsTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Account contacts will appear here when available.</p>
      </div>
    </div>
  );

  const renderAccountOpportunitiesTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Account opportunities will appear here when available.</p>
      </div>
    </div>
  );

  const renderCompetitiveTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Competitive analysis will appear here when available.</p>
      </div>
    </div>
  );

  // Opportunity-specific tab render functions
  const renderDealIntelTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Deal intelligence will appear here when available.</p>
      </div>
    </div>
  );

  const renderStakeholdersTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Stakeholder information will appear here when available.</p>
      </div>
    </div>
  );

  const renderClosePlanTab = () => (
    <div className="p-6 space-y-4">
      <div className="text-center py-12 text-[var(--muted)]">
        <p className="text-sm">Close plan will appear here when available.</p>
      </div>
    </div>
  );

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (recordType === 'people') {
      switch (activeTab) {
        case 'overview':
          return renderHomeTab();
        case 'career':
          return renderCareerTab();
        case 'role':
          return renderRoleTab();
        case 'enablers':
          return renderEnablersTab();
        case 'company':
          return renderCompanyTab();
        case 'strategy':
          return (
            <div className="p-6">
              <div className="text-center py-12 text-[var(--muted)]">
                <p className="text-sm">Strategy data is available in the main record view.</p>
                <p className="text-xs text-[var(--muted)] mt-2">This feature is read-only in edit mode.</p>
              </div>
            </div>
          );
        case 'buyer-groups':
          return renderBuyerGroupsTab();
        case 'notes':
          return renderNotesTab();
        case 'actions':
          return renderTimelineTab();
        case 'delete':
          return renderDeleteTab();
        default:
          return renderHomeTab();
      }
    } else if (recordType === 'companies') {
      switch (activeTab) {
        case 'overview':
          return renderHomeTab();
        case 'actions':
          return renderTimelineTab();
        case 'news':
          return (
            <div className="p-6">
              <UniversalNewsTab record={record} recordType={recordType} />
            </div>
          );
        case 'strategy':
          return (
            <div className="p-6">
              <UniversalCompanyIntelTab 
                record={record} 
                recordType={recordType}
                onSave={async (field: string, value: string) => {
                  // Create a simple inline save handler that updates the record
                  const updatedData = { [field]: value };
                  await onUpdate(updatedData);
                }} 
              />
            </div>
          );
        case 'people':
          return (
            <div className="p-6">
              <UniversalPeopleTab record={record} recordType={recordType} />
            </div>
          );
        case 'buyer-groups':
          return renderBuyerGroupsTab();
        case 'notes':
          return renderNotesTab();
        case 'delete':
          return renderDeleteTab();
        default:
          return renderHomeTab();
      }
    } else if (recordType === 'speedrun' || recordType === 'leads' || recordType === 'prospects') {
      switch (activeTab) {
        case 'overview':
          return renderHomeTab();
        case 'career':
          return renderCareerTab();
        case 'role':
          return renderRoleTab();
        case 'enablers':
          return renderEnablersTab();
        case 'company':
          return renderCompanyTab();
        case 'strategy':
          return (
            <div className="p-6">
              <div className="text-center py-12 text-[var(--muted)]">
                <p className="text-sm">Strategy data is available in the main record view.</p>
                <p className="text-xs text-[var(--muted)] mt-2">This feature is read-only in edit mode.</p>
              </div>
            </div>
          );
        case 'buyer-groups':
          return renderBuyerGroupsTab();
        case 'notes':
          return renderNotesTab();
        case 'actions':
          return renderTimelineTab();
        case 'delete':
          return renderDeleteTab();
        default:
          return renderHomeTab();
      }
    } else if (recordType === 'opportunities') {
      switch (activeTab) {
        case 'overview':
          return renderHomeTab();
        case 'deal-intel':
          return renderDealIntelTab();
        case 'stakeholders':
          return renderStakeholdersTab();
        case 'competitive':
          return renderCompetitiveTab();
        case 'close-plan':
          return renderClosePlanTab();
        case 'actions':
          return renderTimelineTab();
        case 'notes':
          return renderNotesTab();
        case 'delete':
          return renderDeleteTab();
        default:
          return renderHomeTab();
      }
    } else {
      switch (activeTab) {
        case 'home':
          return renderHomeTab();
        case 'opportunity':
          return renderOpportunityTab();
        case 'company':
          return renderCompanyTab();
        case 'activity':
          return renderActivityTab();
        case 'notes':
          return renderNotesTab();
        case 'delete':
          return renderDeleteTab();
        default:
          return renderHomeTab();
      }
    }
  };

  const renderHomeTab = () => {
    // For companies, render company-specific fields
    if (recordType === 'companies') {
      return (
        <div className="p-6 space-y-6">
          {/* Section 1: Company Information */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Name
                </label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) => handleInputChange('legalName', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trading Name
                </label>
                <input
                  type="text"
                  value={formData.tradingName || ''}
                  onChange={(e) => handleInputChange('tradingName', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder=""
              />
            </div>
          </div>

          {/* Section 2: Business Details */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector
                </label>
                <input
                  type="text"
                  value={formData.sector || ''}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={formData.size || ''}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Employees
                </label>
                <input
                  type="number"
                  value={formData.employeeCount || ''}
                  onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.revenue || ''}
                  onChange={(e) => handleInputChange('revenue', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Founded Year
              </label>
              <input
                type="number"
                min="1800"
                max="2024"
                value={formData.foundedYear || ''}
                onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder=""
              />
            </div>
          </div>

          {/* Section 3: Location */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Location</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder=""
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Tracking */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Status & Tracking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="CLIENT">Client</option>
                  <option value="OPPORTUNITY">Opportunity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority || 'MEDIUM'}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder=""
              />
            </div>
          </div>

          {/* Section 5: Engagement */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Engagement</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Action
              </label>
              <input
                type="text"
                value={formData.lastAction || ''}
                onChange={(e) => handleInputChange('lastAction', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder=""
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Action Date
                </label>
                <input
                  type="date"
                  value={formData.lastActionDate || ''}
                  onChange={(e) => handleInputChange('lastActionDate', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Action Date
                </label>
                <input
                  type="date"
                  value={formData.nextActionDate || ''}
                  onChange={(e) => handleInputChange('nextActionDate', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Action
              </label>
              <input
                type="text"
                value={formData.nextAction || ''}
                onChange={(e) => handleInputChange('nextAction', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder=""
              />
            </div>
          </div>
        </div>
      );
    }

    // For other record types, use the original person fields
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle || ''}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder=""
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder=""
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || 'LEAD'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="LEAD">Lead</option>
              <option value="PROSPECT">Prospect</option>
              <option value="OPPORTUNITY">Opportunity</option>
              <option value="CLIENT">Client</option>
              <option value="SUPERFAN">Superfan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority || 'MEDIUM'}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <CompanySelector
            value={formData.company}
            onChange={(company) => {
              if (company) {
                handleInputChange('company', company.name);
              } else {
                handleInputChange('company', '');
              }
            }}
            placeholder="Search or add company..."
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const renderOpportunityTab = () => (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Value
          </label>
          <input
            type="number"
            value={formData.estimatedValue || ''}
            onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter estimated value"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={formData.currency || 'USD'}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stage
          </label>
          <select
            value={formData.stage || ''}
            onChange={(e) => handleInputChange('stage', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select stage</option>
            <option value="Build Rapport">Build Rapport</option>
            <option value="Discovery">Discovery</option>
            <option value="Qualify">Qualify</option>
            <option value="Propose">Propose</option>
            <option value="Negotiate">Negotiate</option>
            <option value="Close">Close</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Probability (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.probability || ''}
            onChange={(e) => handleInputChange('probability', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter probability"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expected Close Date
        </label>
        <input
          type="date"
          value={formData.expectedCloseDate || ''}
          onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderStrategyTab = () => (
    <div className="p-6 space-y-6">

      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Positioning & Messaging</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Engagement Strategy</label>
            <textarea
              value={formData.engagementStrategy || ''}
              onChange={(e) => handleInputChange('engagementStrategy', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter engagement strategy or opening approach..."
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Preferred Contact Method</label>
            <select
              value={formData.preferredContact || ''}
              onChange={(e) => handleInputChange('preferredContact', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Method</option>
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
              <option value="phone">Phone</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanyTab = () => (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder=""
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vertical
          </label>
          <select
            value={formData.vertical || ''}
            onChange={(e) => handleInputChange('vertical', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-</option>
            <option value="C Stores">C Stores</option>
            <option value="Grocery Stores">Grocery Stores</option>
            <option value="Corporate Retailers">Corporate Retailers</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder=""
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn URL
        </label>
        <input
          type="url"
          value={formData.linkedinUrl || ''}
          onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder=""
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Navigator URL
        </label>
        <input
          type="url"
          value={formData.linkedinNavigatorUrl || ''}
          onChange={(e) => handleInputChange('linkedinNavigatorUrl', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder=""
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Connection Date
        </label>
        <input
          type="date"
          value={formData.linkedinConnectionDate || ''}
          onChange={(e) => handleInputChange('linkedinConnectionDate', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bio URL
        </label>
        <input
          type="url"
          value={formData.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder=""
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={formData.country || ''}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder=""
          />
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Next Action
        </label>
        <input
          type="text"
          value={formData.nextAction || ''}
          onChange={(e) => handleInputChange('nextAction', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder=""
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Next Action Date
          </label>
          <input
            type="date"
            value={formData.nextActionDate || ''}
            onChange={(e) => handleInputChange('nextActionDate', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Action Date
          </label>
          <input
            type="date"
            value={formData.lastActionDate || ''}
            onChange={(e) => handleInputChange('lastActionDate', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border)]">
        <div className="flex items-center">
          <input
            id="include-action"
            type="checkbox"
            checked={includeAction}
            onChange={(e) => setIncludeAction(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-[var(--border)] rounded"
          />
          <label htmlFor="include-action" className="ml-2 block text-sm text-gray-700">
            Log an action with this update
          </label>
        </div>

        {includeAction && (
          <div className="mt-4 space-y-3 p-4 bg-[var(--panel-background)] rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={actionData.actionType}
                onChange={(e) => setActionData(prev => ({ ...prev, actionType: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="update">Record Update</option>
                <option value="call">Phone Call</option>
                <option value="email">Email Sent</option>
                <option value="meeting">Meeting</option>
                <option value="demo">Demo</option>
                <option value="proposal">Proposal Sent</option>
                <option value="follow-up">Follow Up</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Notes
              </label>
              <textarea
                value={actionData.notes}
                onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What happened? What was discussed?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Action
              </label>
              <input
                type="text"
                value={actionData.nextAction}
                onChange={(e) => setActionData(prev => ({ ...prev, nextAction: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What should happen next?"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add notes about this company..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <input
          type="text"
          value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
          onChange={(e) => handleInputChange('tags', e.target.value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag))}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add tags separated by commas..."
        />
      </div>
    </div>
  );

  return (
    <div data-testid="update-modal" className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-[var(--background)] rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Update {getSectionTitle()}
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Edit the information for this {getSectionTitle().toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <div className="flex items-center gap-1 px-6">
            {MODAL_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--hover)] text-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-visible">
            {renderTabContent()}
          </div>

          {/* Footer */}
          {activeTab !== 'delete' && (
            <div className="flex items-center justify-end p-6 border-t border-[var(--border)] bg-[var(--panel-background)]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Updating...' : `Update ${recordType === 'leads' ? 'Lead' : 
                                                        recordType === 'prospects' ? 'Prospect' :
                                                        recordType === 'opportunities' ? 'Opportunity' :
                                                        recordType === 'companies' ? 'Company' :
                                                        recordType === 'people' ? 'Person' :
                                                        recordType === 'clients' ? 'Client' :
                                                        recordType === 'partners' ? 'Partner' :
                                                        'Record'} (${getCommonShortcut('SUBMIT')})`}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-[var(--background)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Action Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="p-1.5 hover:bg-[var(--hover)] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Add Action</h3>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    Log an action for {record?.fullName || record?.name || 'this prospect'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActionModal(false)}
                className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>

            {/* Action Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={actionData.actionType}
                  onChange={(e) => setActionData(prev => ({ ...prev, actionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Email Sent</option>
                  <option value="meeting">Meeting</option>
                  <option value="demo">Demo</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="follow-up">Follow Up</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={actionData.notes}
                  onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What happened? What was discussed?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Action
                </label>
                <input
                  type="text"
                  value={actionData.nextAction}
                  onChange={(e) => setActionData(prev => ({ ...prev, nextAction: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What should happen next?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Action Date
                </label>
                <input
                  type="date"
                  value={actionData.nextActionDate}
                  onChange={(e) => setActionData(prev => ({ ...prev, nextActionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--panel-background)]">
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onUpdate(formData, actionData);
                    setShowActionModal(false);
                    onClose();
                  } catch (error) {
                    console.error('Error saving action:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}