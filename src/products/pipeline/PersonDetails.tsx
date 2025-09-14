import React, { useState, useEffect } from "react";
import { formatRelativeDate } from "@/platform/utils";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { InlineEditField } from "@/platform/ui/components/InlineEditField";
import { SuccessMessage } from "@/platform/ui/components/SuccessMessage";
import { useInlineEdit } from "@/platform/hooks/useInlineEdit";

export interface PersonRecord {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  influence: string;
  lastAction: string;
  nextAction: string;
  lastActionDate: string;
  nextActionDate: string;
  notes: string;
  relationship: string;
}

interface PersonWithDetails extends PersonRecord {
  account?: {
    id: string;
    name: string;
    industry?: string;
  };
  activities?: Array<{
    id: string;
    type: string;
    outcome?: string;
    completedAt?: Date;
  }>;
  created_at?: string;
  updated_at?: string;
}

interface PersonDetailsProps {
  person: PersonRecord;
  onBack: () => void;
  hideHeader?: boolean;
  onCompanyClick?: (company: string) => void;
  onEditPerson?: (person: PersonRecord) => void;
  onDeletePerson?: (person: PersonRecord) => void;
}

export const PersonDetails: React.FC<PersonDetailsProps> = ({
  person,
  onBack,
  hideHeader = false,
  onCompanyClick,
  onEditPerson,
  onDeletePerson,
}) => {
  const { ui } = useAcquisitionOS();
  const { navigateToPipelineItem } = useWorkspaceNavigation();
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentPerson, setCurrentPerson] = useState(person);
  const [contactData, setContactData] = useState<ContactWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    "Timeline",
    "Notes",
  ];

  // Filter tabs based on available data
  const getAvailableTabs = () => {
    const availableTabs = ["Overview"]; // Always show Overview
    
    
    // Add Timeline if we have any timeline data
    if (timelineData.length > 0) {
      availableTabs.push("Timeline");
    }
    
    // Add Notes if we have notes or allow adding notes
    if (notesData.length > 0 || contact.notes) {
      availableTabs.push("Notes");
    }
    
    return availableTabs;
  };

  const tabs = getAvailableTabs();

  // Handle back navigation with context
  const handleBackNavigation = () => {
    // Check if we have navigation context from account
    if ((contact as any)._navigationContext) {
      const { fromCompany, fromTab, fromSection } = (person as any)._navigationContext;
      
      // Navigate back to the company with the specific tab
      ui.setSelectedRecord(fromCompany);
      ui.setDetailViewType('company');
      navigateToPipelineItem('companies', fromCompany.id);
      
      // Note: The tab state will be handled by the CompanyDetails component
      // when it re-renders with the selected account
    } else {
      // Fallback to default back behavior
      if (onBack) {
        onBack();
      } else {
        // Use the UI hook's back navigation
        ui.handleBackNavigation();
      }
    }
  };

  // Load contact data from database
  useEffect(() => {
    const loadContactData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/data/contacts/${contact.id}`);
        
        if (!response.ok) {
          console.warn(`Contact API returned ${response.status}, using provided data`);
          setContactData(contact as ContactWithDetails);
          return;
        }
        
        const result = await response.json();
        
        if (result['success'] && result.contact) {
          const enrichedContact = {
            ...contact,
            ...result.contact,
            // Ensure we keep the original interface while adding enriched data
            name: result.displayContact.name || displayContact.name,
            title: result.contact.jobTitle || displayContact.title,
            company: result.displayContact.company || displayContact.company,
            company: result.person.company,
            activities: result.contact.activities,
            created_at: result.contact.created_at,
            updated_at: result.contact.updated_at,
          };
          setContactData(enrichedContact);
          setCurrentContact(enrichedContact);
        } else {
          // Fallback to provided contact data
          setContactData(contact as ContactWithDetails);
        }
      } catch (error) {
        console.error("Failed to load contact data:", error);
        // Continue with provided contact data on error
        setContactData(contact as ContactWithDetails);
      } finally {
        setIsLoading(false);
      }
    };

    if (contact.id) {
      loadContactData();
    } else {
      // If no ID, use provided data immediately
      setContactData(contact as ContactWithDetails);
      setIsLoading(false);
    }
  }, [contact.id]);

  // Load timeline and notes data
  useEffect(() => {
    const loadTimelineAndNotes = async () => {
      if (!contact.id) return;
      
      try {
        // Load timeline data
        const timelineResponse = await fetch(`/api/timeline/contact/${contact.id}`);
        if (timelineResponse.ok) {
          const timelineResult = await timelineResponse.json();
          setTimelineData(timelineResult.timeline || []);
        }

        // Load notes data (from timeline API)
        const notesResponse = await fetch(`/api/timeline/contact/${contact.id}`);
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
  }, [contact.id]);

  // Handle inline editing with universal hook
  const handleFieldEdit = async (field: string, value: string) => {
    const success = await handleEditSave('contact', contact.id, field, value);
    if (success) {
      // Update local state
      setContactData(prev => prev ? { ...prev, [field]: value } : null);
      setCurrentContact(prev => ({ ...prev, [field]: value }));
    }
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <PipelineSkeleton 
        message="Loading contact details..."
      />
    );
  }

  // Use loaded data or fallback to provided contact
  const displayContact = contactData || contact;

  return (
    <div className="p-4">
      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={closeMessage}
        type={messageType}
      />
      
      <div className="w-full px-0">
        {!hideHeader && (
          <div className="flex items-center justify-between mt-2 mb-8">
            <div className="flex items-center gap-4">
            <button
              onClick={handleBackNavigation}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {displayContact.name || displayContact.email?.split('@')[0] || 'Contact Detail'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              style={{
                background: "white",
                color: "black",
                border: "1.5px solid #2563EB",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                transition: "background 0.15s, color 0.15s, border 0.15s",
                cursor: "pointer",
                marginRight: "0.5rem",
              }}
              onClick={() =>
                typeof onEditContact === "function"
                  ? onEditContact(displayContact)
                  : null
              }
            >
              Edit
            </button>

            <button
              style={{
                background: "#2563EB",
                color: "white",
                border: "1px solid #2563EB",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Schedule Meeting
            </button>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-2 mb-0 pb-2 border-b border-[var(--border)]"
          style={{
            borderColor: "var(--border)",
            marginTop: "-18px",
            borderBottomWidth: "1px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-5 py-2 text-base font-semibold rounded-t-lg transition-colors focus:outline-none
                ${
                  activeTab === tab
                    ? "bg-[var(--background)] border-x border-t border-[var(--border)] text-[var(--foreground)] z-10"
                    : "text-[var(--muted,#888)] hover:text-[var(--accent)] border border-transparent"
                }
              `}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[var(--background)] rounded-b-xl border-b border-[var(--border)] shadow-sm pt-0 px-6 pb-6 w-full min-h-[400px] -mt-2">
          <div className="pt-6">
            {activeTab === "Overview" && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                    At a Glance
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Role
                      </div>
                      <div className="text-lg text-[var(--foreground)]">
                        {displayContact.role}
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Department
                      </div>
                      <div className="text-lg text-[var(--foreground)]">
                        {displayContact.department}
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                      <div className="font-semibold text-[var(--muted)] mb-1">
                        Relationship
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          displayContact['relationship'] === "Warm"
                            ? "bg-[#2563EB] text-white"
                            : displayContact['relationship'] === "Hot"
                              ? "bg-[#10b981] text-white"
                              : "bg-[#6b7280] text-white"
                        }`}
                      >
                        {displayContact.relationship}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Contact Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Name
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={displayContact.name}
                            field="name"
                            onSave={handleFieldEdit}
                            placeholder="Enter contact name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Title
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={displayContact.title}
                            field="title"
                            onSave={handleFieldEdit}
                            placeholder="Enter job title"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Email
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={displayContact.email}
                            field="email"
                            onSave={handleFieldEdit}
                            placeholder="Enter email address"
                            type="email"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Phone
                        </label>
                        <div className="mt-1 text-lg text-[var(--foreground)]">
                          <InlineEditField
                            value={displayContact.phone}
                            field="phone"
                            onSave={handleFieldEdit}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Role & Organization
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Company
                        </label>
                        <p
                          className="mt-1 text-lg font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                          onClick={() =>
                            onCompanyClick && onCompanyClick(displayContact.company)
                          }
                        >
                          {displayContact.company}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Department
                        </label>
                        <p className="mt-1 text-lg text-[var(--foreground)]">
                          {displayContact.department}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)]">
                          Influence
                        </label>
                        <p className="mt-1 text-lg text-[var(--foreground)]">
                          {displayContact.influence}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-[var(--foreground)] mb-1">
                      Last Action
                    </div>
                    <div className="text-lg text-[var(--foreground)]">
                      {displayContact.lastAction}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {formatRelativeDate(displayContact.lastActionDate)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-[var(--foreground)] mb-1">
                      Next Action
                    </div>
                    <div className="text-lg text-[var(--foreground)]">
                      {displayContact.nextAction}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {formatRelativeDate(displayContact.nextActionDate)}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                    Value Intelligence
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                        Role-Based Analysis
                      </h3>
                      <p className="text-sm text-[var(--muted)] mb-4">
                        Comprehensive analysis of their role and decision-making
                        power within the organization
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="/reports/role-mini"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Mini Report
                        </a>
                        <a
                          href="/reports/role-deep"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Deep Value Report
                        </a>
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                        Influence Mapping
                      </h3>
                      <p className="text-sm text-[var(--muted)] mb-4">
                        Strategic analysis of their influence network and key
                        relationships
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="/reports/influence-mini"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Mini Report
                        </a>
                        <a
                          href="/reports/influence-deep"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Deep Value Report
                        </a>
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                        Communication Strategy
                      </h3>
                      <p className="text-sm text-[var(--muted)] mb-4">
                        Personalized communication approach based on their
                        profile and preferences
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="/reports/communication-mini"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Mini Report
                        </a>
                        <a
                          href="/reports/communication-deep"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Deep Value Report
                        </a>
                      </div>
                    </div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                        Engagement History
                      </h3>
                      <p className="text-sm text-[var(--muted)] mb-4">
                        Detailed analysis of past interactions and engagement
                        patterns
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="/reports/engagement-mini"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Mini Report
                        </a>
                        <a
                          href="/reports/engagement-deep"
                          className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                          Deep Value Report
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}



            {activeTab === "Timeline" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Activity Timeline
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
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-600 space-y-1">
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
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-600 space-y-1">
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
                    <p className="text-[var(--muted)]">Add your first note to track important information about this contact</p>
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
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {note.priority} priority
                                </span>
                              )}
                            </div>
                            
                            {/* Show note content if available */}
                            {note['metadata'] && note['metadata']['content'] && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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
        </div>
      </div>
    </div>
  );
};
