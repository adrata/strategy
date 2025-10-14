import React, { useState, useEffect } from "react";
import { formatRelativeDate } from "@/platform/utils";
import { PipelineClientService } from "@/platform/services/pipeline-client-service";
import { getCategoryColors } from "@/platform/config/color-palette";
import { authFetch } from "@/platform/api-fetch";
// Define CompanyWithDetails interface locally
interface CompanyWithDetails {
  id: string;
  name: string;
  industry?: string;
  opportunities?: Array<{
    id: string;
    name: string;
    amount?: number;
    stage?: string;
    probability?: number;
  }>;
  contacts?: Array<{
    id: string;
    fullName: string;
    jobTitle?: string;
    department?: string;
  }>;
  financials?: {
    totalRevenue?: string;
    totalOpportunities?: string;
    avgDealSize?: string;
    paymentTerms?: string;
    creditRating?: string;
    lifetimeValue?: string;
  };
}
import { ArrowLeftIcon, PlusIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { CompleteActionModal, ActionLogData } from "@/platform/ui/components/CompleteActionModal";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";
import { SuccessMessage } from "@/platform/ui/components/SuccessMessage";
import { useInlineEdit } from "@/platform/hooks/useInlineEdit";
import { AddPersonToCompanyModal } from "@/frontend/components/pipeline/AddPersonToCompanyModal";

export interface Company {
  id: string;
  name: string;
  type: string;
  industry: string;
  employees: number;
  revenue: string;
  tier: string;
  status: string;
  owner: string;
  lastAction: string;
  nextAction: string;
  lastActionDate: string;
  nextActionDate: string;
  notes: string;
  contacts: string[];
}

interface CompanyDetailsProps {
  company: Company;
  onBack: () => void;
  hideHeader?: boolean;
  onCompanyClick?: (company: string) => void;
  onReportClick?: (reportKey: string) => void;
  onEditCompany?: (company: Company) => void;
  onDeleteCompany?: (company: Company) => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  onBack,
  hideHeader = false,
  onCompanyClick,
  onReportClick,
  onEditCompany,
  onDeleteCompany,
}) => {
  const { ui } = useAcquisitionOS();
  const { navigateToPipelineItem } = useWorkspaceNavigation();
  const [activeTab, setActiveTab] = useState("Overview");
  const [companyData, setCompanyData] = useState<CompanyWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [notesData, setNotesData] = useState<any[]>([]);
  
  // Use universal inline edit hook
  const {
    showSuccessMessage,
    successMessage,
    messageType,
    handleEditSave,
    closeMessage,
  } = useInlineEdit();
  
  // Define all possible tabs
  const allTabs = [
    "Overview",
    "People", 
    "Opportunities",
    "Timeline",
    "Notes",
  ];

  // Filter tabs based on available data
  const getAvailableTabs = () => {
    const availableTabs = ["Overview"]; // Always show Overview
    
    
    // Add People if we have people
    if (contactsData.length > 0) {
      availableTabs.push("People");
    }
    
    // Add Opportunities if we have opportunities
    if (opportunitiesData.length > 0) {
      availableTabs.push("Opportunities");
    }
    
    // Add Timeline if we have any timeline data
    if (timelineData.length > 0) {
      availableTabs.push("Timeline");
    }
    
    // Add Notes if we have notes or allow adding notes
    if (notesData.length > 0 || account.notes) {
      availableTabs.push("Notes");
    }
    
    return availableTabs;
  };

  const tabs = getAvailableTabs();

  // Handle contact click with navigation history
  const handleContactClick = (contact: any) => {
    console.log('🔍 [CompanyDetails] Contact clicked:', {
      contact,
      contactId: contact.id,
      contactName: contact.name,
      hasId: !!contact.id
    });

    // Validate contact has required id for navigation
    if (!contact.id) {
      console.error('❌ [CompanyDetails] Contact missing id, cannot navigate:', contact);
      return;
    }

    // Store the current company context in the contact record for back navigation
    const contactWithContext = {
      ...contact,
      _navigationContext: {
        fromCompany: company,
        fromTab: activeTab,
        fromSection: 'companies'
      }
    };

    console.log('🔍 [CompanyDetails] Navigating to contact with context:', contactWithContext);

    // Use the existing handleRecordClick method which manages navigation history
    ui.handleRecordClick(contactWithContext, 'contact');
  };

  // Handle opportunity click with navigation history
  const handleOpportunityClick = (opportunity: any) => {
    // Store the current account context in the opportunity record for back navigation
    const opportunityWithContext = {
      ...opportunity,
      _navigationContext: {
        fromCompany: company,
        fromTab: activeTab,
        fromSection: 'companies'
      }
    };

    // Use the existing handleRecordClick method which manages navigation history
    ui.handleRecordClick(opportunityWithContext, 'opportunity');
  };

  // Handle inline editing with universal hook
  const handleFieldEdit = async (field: string, value: string) => {
    const success = await handleEditSave('account', account.id, field, value);
    if (success) {
      // Update local state
      setAccountData((prev: AccountWithDetails | null) => prev ? { ...prev, [field]: value } : null);
    }
  };

  // Load account data from database
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        setIsLoading(true);
        const data = await PipelineClientService.getAccountById(account.id);
        setAccountData(data);
      } catch (error) {
        console.error("Failed to load account data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (account.id) {
      loadAccountData();
    }
  }, [account.id]);

  // Load timeline and notes data
  useEffect(() => {
    const loadTimelineAndNotes = async () => {
      if (!account.id) return;
      
      try {
        // Load timeline data
        const timelineResponse = await fetch(`/api/timeline/account/${account.id}`);
        if (timelineResponse.ok) {
          const timelineResult = await timelineResponse.json();
          setTimelineData(timelineResult.timeline || []);
        }

        // Load notes data (from timeline API)
        const notesResponse = await fetch(`/api/timeline/account/${account.id}`);
        if (notesResponse.ok) {
          const notesResult = await notesResponse.json();
          const notes = notesResult.timeline?.filter((event: any) => event['type'] === 'note') || [];
          setNotesData(notes);
        }
      } catch (error) {
        console.error("Failed to load timeline/notes data:", error);
      }
    };

    loadTimelineAndNotes();
  }, [account.id]);

  // Handle navigation back from contact/opportunity details
  useEffect(() => {
    // Check if we're navigating back to this account and should restore the appropriate tab
    if (account['id'] === ui.selectedRecord?.id && ui['detailViewType'] === 'account') {
      // Check if the selected record has navigation context indicating we came from a specific tab
      const navigationContext = ui.selectedRecord?._navigationContext;
      if (navigationContext) {
        const fromTab = navigationContext.fromTab;
        if (fromTab === 'People' || fromTab === 'Opportunities') {
          setActiveTab(fromTab);
          // Clear the navigation context to prevent repeated tab switching
          delete ui.selectedRecord._navigationContext;
        }
      }
    }
  }, [account.id, ui.selectedRecord, ui.detailViewType]);

  // Use loaded data or fallbacks
  const opportunitiesData = accountData?.opportunities?.map((opp: any) => ({
    name: opp.name,
    value: opp.amount ? `$${opp.amount.toLocaleString()}` : "TBD",
    stage: opp.stage,
    probability: opp.probability || 0,
  })) || [];

  const financialsData = accountData?.financials || {
    totalRevenue: "Revenue undisclosed",
    totalOpportunities: "$0",
    avgDealSize: "$0",
    paymentTerms: "Net 30",
    creditRating: "Unrated",
    lifetimeValue: "$0",
  };

  const contactsData = accountData?.contacts?.map((contact: any) => ({
    id: contact.id, // CRITICAL: Include id for navigation
    name: contact.fullName,
    title: contact.jobTitle || "",
    department: contact.department || "Unknown Department",
    relationship: "Active", // Could be enhanced with relationship scoring
  })) || [];

  // Debug logging
  console.log('🔍 [CompanyDetails] Debug info:', {
    accountId: account.id,
    accountName: account.name,
    accountData: accountData,
    contactsCount: accountData?.contacts?.length || 0,
    contactsData: contactsData,
    hasContactsArray: Array.isArray(accountData?.contacts),
    accountDataKeys: Object.keys(accountData || {})
  });

  // Handle action submission
  const handleActionSubmit = async (actionData: any) => {
    try {
      const response = await authFetch('/api/v1/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: actionData.actionType,
          subject: actionData.notes.length > 100 ? actionData.notes.substring(0, 100) + '...' : actionData.notes,
          description: actionData.notes,
          companyId: account.id,
          outcome: actionData.nextAction,
          scheduledAt: actionData.nextActionDate,
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setShowAddActionModal(false);
        // Optionally refresh account data
        if (account.id) {
          const data = await PipelineClientService.getAccountById(account.id);
          setAccountData(data);
        }
      }
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  const handlePersonAdded = async (person: any) => {
    // Refresh company data to show the new person
    if (account.id) {
      try {
        const data = await PipelineClientService.getAccountById(account.id);
        setAccountData(data);
      } catch (error) {
        console.error('Failed to refresh company data:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={closeMessage}
        type={messageType}
      />

      {/* Header */}
      {!hideHeader && (
        <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-[var(--muted)]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">
                  {account.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-[var(--muted)] mt-1">
                  <span>{account.industry}</span>
                  <span>•</span>
                  <span>{account.employees} employees</span>
                  <span>•</span>
                  <span>Tier: {account.tier}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddActionModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Action
              </button>
              <button
                onClick={() => setShowAddPersonModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <UserPlusIcon className="w-4 h-4" />
                Add Person
              </button>
              <button
                onClick={() => onEditAccount?.(account)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Account
              </button>
              <button
                onClick={() => onDeleteAccount?.(account)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <PipelineSkeleton message="Loading account details..." />
      )}

      {/* Content - only show when not loading */}
      {!isLoading && (
        <>
          {/* Tabs */}
          <div className="bg-[var(--background)] border-b border-[var(--border)] px-6">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-gray-400 text-gray-700"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "Overview" && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                    At a Glance
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Tier
                      </div>
                      <div className="text-lg text-[var(--foreground)]">
                        {account.tier}
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Status
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          account['status'] === "Active"
                            ? "bg-[#10b981] text-white"
                            : account['status'] === "Prospect"
                              ? "bg-[#2563EB] text-white"
                              : "bg-[#6b7280] text-white"
                        }`}
                      >
                        {account.status}
                      </span>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Annual Revenue
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {account['name'] === "Nike Corporation"
                          ? "$51.2B"
                          : account['name'] === "Procore Technologies"
                            ? "$648.9M"
                            : account['name'] === "Finally"
                              ? "$104.8M"
                              : account['name'] === "LeadIQ"
                                ? "$105.4M"
                                : account.revenue}
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Contract Value
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {account['name'] === "Nike Corporation"
                          ? "$450,000"
                          : account.revenue.replace(/[\$,]/g, "")
                            ? `$${(parseInt(account.revenue.replace(/[\$,KM]/g, "")) * (account.revenue.includes("K") ? 1000 : account.revenue.includes("M") ? 1000000 : 1) * 0.25).toLocaleString()}`
                            : "$0"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Account Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Company Name
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={account.name}
                            field="name"
                            onSave={handleFieldEdit}
                            placeholder="Enter company name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Industry
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={account.industry}
                            field="industry"
                            onSave={handleFieldEdit}
                            placeholder="Enter industry"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Employee Count
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={account.employees.toString()}
                            field="employees"
                            onSave={handleFieldEdit}
                            placeholder="Enter employee count"
                            type="number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Account Owner
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={account.owner}
                            field="owner"
                            onSave={handleFieldEdit}
                            placeholder="Enter account owner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Engagement
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Last Action
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={account.lastAction}
                            field="lastAction"
                            onSave={handleFieldEdit}
                            placeholder="Enter last action"
                          />
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          {formatRelativeDate(account.lastActionDate)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Next Action
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={account.nextAction}
                            field="nextAction"
                            onSave={handleFieldEdit}
                            placeholder="Enter next action"
                          />
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          {formatRelativeDate(account.nextActionDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                    Notes
                  </h2>
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <InlineEditField
                      value={account.notes || ""}
                      field="notes"
                      onSave={handleFieldEdit}
                      placeholder="No notes available for this account. Click to add notes."
                      type="textarea"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "People" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Key People
                  </h2>
                  <button
                    onClick={() => setShowAddActionModal(true)}
                    className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: getCategoryColors('companies').bg,
                      color: getCategoryColors('companies').primary,
                      border: `1px solid ${getCategoryColors('companies').border}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getCategoryColors('companies').bgHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getCategoryColors('companies').bg;
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
                
                {contactsData['length'] === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No people yet</h3>
                    <p className="text-[var(--muted)]">Add people to track relationships</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactsData.map((contact: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleContactClick(contact)}
                        className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 cursor-pointer hover:bg-[var(--muted)]/10 hover:border-[var(--border)] transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">
                              {contact.name}
                            </h3>
                            <p className="text-[var(--muted)]">{contact.title}</p>
                            <p className="text-sm text-[var(--muted)]">
                              {contact.department}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              contact['relationship'] === "Warm"
                                ? "bg-[#2563EB] text-white"
                                : contact['relationship'] === "Hot"
                                  ? "bg-[#10b981] text-white"
                                  : "bg-[#6b7280] text-white"
                            }`}
                          >
                            {contact.relationship}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "Opportunities" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Active Opportunities
                  </h2>
                  <button
                    onClick={() => setShowAddActionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
                
                {opportunitiesData['length'] === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No opportunities yet</h3>
                    <p className="text-[var(--muted)]">Add opportunities to track deals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opportunitiesData.map((opp: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleOpportunityClick(opp)}
                        className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 cursor-pointer hover:bg-[var(--muted)]/10 hover:border-[var(--border)] transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">
                              {opp.name}
                            </h3>
                            <p className="text-[var(--muted)]">
                              Stage: {opp.stage}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {opp.value}
                            </div>
                            <div className="text-sm text-[var(--muted)]">
                              {opp.probability}% probability
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}


            {activeTab === "Timeline" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Action Timeline
                  </h2>
                  <div className="text-sm text-[var(--muted)]">
                    {timelineData.length} events
                  </div>
                </div>
                {timelineData['length'] === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No timeline events yet</h3>
                    <p className="text-[var(--muted)]">Activities, emails, meetings, and interactions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timelineData.map((event: any, idx: number) => (
                      <div key={event.id || idx} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${
                            event['type'] === 'record_created' ? 'bg-gray-400' :
                            event['type'] === 'activity' ? 'bg-blue-500' :
                            event['type'] === 'email' ? 'bg-green-500' :
                            event['type'] === 'note' ? 'bg-yellow-500' :
                            event['type'] === 'calendar_event' ? 'bg-purple-500' :
                            'bg-gray-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-[var(--foreground)] mb-1">{event.title}</h3>
                                {event['description'] && (
                                  <p className="text-sm text-[var(--muted)] mb-2">{event.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(event.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {event['user'] && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {event.user}
                                    </span>
                                  )}
                                  <span className="capitalize">{event.type.replace('_', ' ')}</span>
                                </div>
                              </div>
                              {event['buyingSignal'] && (
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                                  {Math.round((event.buyingSignalScore || 0) * 100)}% signal
                                </span>
                              )}
                            </div>
                            
                            {/* Show additional metadata for specific event types */}
                            {event['type'] === 'email' && event['metadata'] && (
                              <div className="mt-3 p-3 bg-[var(--panel-background)] rounded-lg">
                                <div className="text-xs text-[var(--muted)] space-y-1">
                                  <div><strong>From:</strong> {event.metadata.from}</div>
                                  {event['metadata']['to'] && (
                                    <div><strong>To:</strong> {Array.isArray(event.metadata.to) ? event.metadata.to.join(', ') : event.metadata.to}</div>
                                  )}
                                  {event['metadata']['buyingSignal'] && (
                                    <div><strong>Buying Signal:</strong> {event.metadata.buyingSignal.replace('_', ' ')}</div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {event['type'] === 'calendar_event' && event['metadata'] && (
                              <div className="mt-3 p-3 bg-[var(--panel-background)] rounded-lg">
                                <div className="text-xs text-[var(--muted)] space-y-1">
                                  {event['metadata']['location'] && (
                                    <div><strong>Location:</strong> {event.metadata.location}</div>
                                  )}
                                  {event['metadata']['meetingUrl'] && (
                                    <div><strong>Meeting URL:</strong> 
                                      <a href={event.metadata.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                        Join Meeting
                                      </a>
                                    </div>
                                  )}
                                  {event['metadata']['attendees'] && event.metadata.attendees.length > 0 && (
                                    <div><strong>Attendees:</strong> {event.metadata.attendees.join(', ')}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "Notes" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Notes & Observations
                  </h2>
                  <div className="text-sm text-[var(--muted)]">
                    {notesData.length} notes
                  </div>
                </div>
                <p className="text-[var(--muted)] mb-6">Keep track of important information, meeting notes, and observations</p>
                
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add your thoughts, meeting notes, or observations..."
                      className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Add Note
                    </button>
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-2">Tip: Press Cmd/Ctrl + Enter to save quickly</p>
                </div>

                {notesData['length'] === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No notes yet</h3>
                    <p className="text-[var(--muted)]">Add your first note to track important information about this account</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notesData.map((note: any, idx: number) => (
                      <div key={note.id || idx} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-yellow-500"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-[var(--foreground)] mb-1">
                                  {note.title || 'Note'}
                                </h3>
                                <p className="text-sm text-[var(--muted)] mb-3">{note.description}</p>
                                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(note.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {note['user'] && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {note.user}
                                    </span>
                                  )}
                                  <span className="capitalize">Note</span>
                                </div>
                              </div>
                              {note['priority'] && (
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                  note['priority'] === 'high' ? 'bg-red-100 text-red-700' :
                                  note['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-[var(--hover)] text-gray-700'
                                }`}>
                                  {note.priority} priority
                                </span>
                              )}
                            </div>
                            
                            {/* Show note content if available */}
                            {note['metadata'] && note['metadata']['content'] && (
                              <div className="mt-3 p-3 bg-[var(--panel-background)] rounded-lg">
                                <div className="text-sm text-gray-700">
                                  {note.metadata.content}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Add Action Modal */}
      <CompleteActionModal
        isOpen={showAddActionModal}
        onClose={() => setShowAddActionModal(false)}
        onSubmit={handleActionSubmit}
        personName={account?.name || ''}
        companyName={account?.name || ''}
        section="companies"
        isLoading={false}
      />

      {/* Add Person Modal */}
      <AddPersonToCompanyModal
        isOpen={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        companyId={account.id}
        companyName={account.name}
        onPersonAdded={handlePersonAdded}
      />
    </div>
  );
};
