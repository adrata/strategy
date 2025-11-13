import React from "react";
import { SpeedrunPerson, ValueIdea } from "../types/SpeedrunTypes";
import {
  formatRelativeDate,
  generatePersonalWants,
  generatePersonalNeeds,
} from "../utils/monacoExtractors";
import { IntelligentStageProgression } from "../IntelligentStageProgression";
import { useAuth } from "@/platform/hooks/useAuth";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";
import { getCategoryColors } from "@/platform/config/color-palette";
import { getPhoneDisplayValue } from "@/platform/utils/phone-validator";
import { getCommonShortcut } from "@/platform/utils/keyboard-shortcuts";
import { useActionLogs } from "../hooks/useActionLogs";

interface OverviewTabProps {
  person: SpeedrunPerson;
  dynamicReports: ValueIdea[];
  isLoadingReports: boolean;
  onReportClick: (reportUrl: string) => void;
  onCompanyDetailClick: () => void;
  onInlineFieldSave?: (field: string, value: string | null, recordId: string, recordType: string) => Promise<void>;
}

  const getRoleColor = (role: string) => {
  switch (role) {
    case "Champion":
      return "bg-success/10 text-success border-success";
    case "Decision Maker":
      return "bg-primary/10 text-primary border-primary";
    case "Stakeholder":
      return "bg-info/10 text-info border-info";
    default:
      return "bg-hover text-foreground border-border";
  }
};

export function OverviewTab({
  person,
  dynamicReports,
  isLoadingReports,
  onReportClick,
  onCompanyDetailClick,
  onInlineFieldSave,
}: OverviewTabProps) {
  // Get auth context to check workspace
  const { authUser } = useAuth();
  
  // Get workspace ID for action logs
  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id || '';
  
  // Fetch action logs for this person
  const { actionLogs, loading: actionLogsLoading } = useActionLogs(person.id?.toString() || '', workspaceId);
  
  // Handle inline field updates for speedrun - use the passed-in handler
  const handleSpeedrunInlineFieldSave = onInlineFieldSave || (async (field: string, value: string | null, recordId: string, recordType: string) => {
    try {
      console.log(`🔄 [SPEEDRUN-OVERVIEW] Inline updating ${field} for person:`, recordId, 'to:', value);
      
      // Prepare update data
      const updateData: any = {
        [field]: field === 'globalRank' && value !== null ? parseInt(value as string) : value,
        updatedAt: new Date().toISOString()
      };
      
      // Make API call to update person
      const response = await fetch(`/api/v1/people/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${field}`);
      }

      const result = await response.json();
      console.log(`✅ [SPEEDRUN-OVERVIEW] Successfully updated ${field} for person:`, recordId, result.data);
      
      // Update the person object with the full API response to ensure all fields are synced
      if (result.success && result.data) {
        Object.assign(person, result.data);
      } else {
        // Fallback: update just the field if response structure is different
        (person as any)[field] = field === 'globalRank' && value !== null ? parseInt(value as string) : value;
      }
      
      // CRITICAL FIX: Clear caches to ensure fresh data on next load
      if (typeof window !== 'undefined') {
        // Clear sessionStorage caches
        sessionStorage.removeItem(`cached-speedrun-${recordId}`);
        sessionStorage.removeItem(`current-record-speedrun`);
        
        // Clear all relevant localStorage caches to force refresh
        const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id || '';
        if (workspaceId) {
          localStorage.removeItem(`adrata-people-${workspaceId}`);
          localStorage.removeItem(`adrata-speedrun-${workspaceId}`);
          localStorage.removeItem(`adrata-fast-counts-${workspaceId}`);
          
          // Clear unified cache system keys
          const cacheKeys = Object.keys(localStorage);
          cacheKeys.forEach(key => {
            if (key.includes(`speedrun`) || key.includes(`people`) || key.includes(`revenue-os`)) {
              if (key.includes(workspaceId)) {
                localStorage.removeItem(key);
              }
            }
          });
        }
        
        console.log(`🗑️ [SPEEDRUN-OVERVIEW] Cleared caches after saving ${field}`);
      }
      
      // Dispatch event to trigger data refresh in other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('speedrun-data-updated', {
          detail: {
            personId: recordId,
            field,
            value,
            updatedRecord: result.data || person
          }
        }));
        
        // Also dispatch pipeline refresh event for consistency
        window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
          detail: {
            section: 'speedrun',
            type: 'field-update',
            recordId: recordId,
            field
          }
        }));
      }
      
    } catch (error) {
      console.error(`❌ [SPEEDRUN-OVERVIEW] Error inline saving ${field}:`, error);
      throw error;
    }
  });
  
  // Check if this is Dano's workspace (Retail Product Solutions)
  const isDanoWorkspace = authUser?.email === "dano@retail-products.com" || 
                         authUser?.id === "01K1VBYYV7TRPY04NW4TW4XWRB" ||
                         authUser?.activeWorkspaceId === "01K1VBYV8ETM2RCQA4GNN9EG72";
  
  // Get contextual activity insights
  const contextualInsight = IntelligentStageProgression.getContextualInsight(person);
  const stageProgression = IntelligentStageProgression.analyzeStageProgression(person);
  const activityContext = IntelligentStageProgression.getEnhancedRankingContext(person);

  // Get action type icon for notes display
  const getActionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email': return '📧';
      case 'call': return '📞';
      case 'linkedin': return '💼';
      case 'meeting': return '🤝';
      case 'text': return '💬';
      default: return '📝';
    }
  };

  // Filter action logs to only those with notes and limit to 5 most recent
  const recentActionLogsWithNotes = actionLogs
    .filter(log => log.notes && log.notes.trim().length > 0)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header - Outside the box like intelligence design */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Lead Overview
        </h2>
        <p className="text-muted">
          Comprehensive lead information and engagement insights
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            // TODO: Implement update record functionality
            console.log('Update Record clicked for:', person.name);
          }}
          className="px-4 py-2 bg-background border border-border text-foreground rounded-lg font-medium hover:bg-hover transition-colors"
        >
          Update Record
        </button>
        
        <button
          onClick={() => {
            // TODO: Implement advance to prospect functionality
            console.log('Advance to Prospect clicked for:', person.name);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Advance to Prospect
        </button>
        
        <button
          onClick={() => {
            // TODO: Implement add action functionality
            console.log('Add Action clicked for:', person.name);
          }}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: getCategoryColors('people').bg,
            color: getCategoryColors('people').primary,
            border: `1px solid ${getCategoryColors('people').border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = getCategoryColors('people').bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = getCategoryColors('people').bg;
          }}
        >
          Add Action ({getCommonShortcut('SUBMIT')})
        </button>
      </div>

      {/* Contextual Activity Banner */}
      {contextualInsight && (
        <div className={`p-4 rounded-lg border ${
          activityContext?.priority === 'high' ? 'bg-red-50 border-red-200' :
          activityContext?.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
          'bg-panel-background border-border'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                activityContext?.priority === 'high' ? 'bg-error/10 text-error' :
                activityContext?.priority === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-hover text-foreground'
              }`}>
                {activityContext?.activityType === 'email' ? '📧' : 
                 activityContext?.activityType === 'call' ? '📞' : 
                 activityContext?.activityType === 'meeting' ? '🤝' : '📱'}
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {contextualInsight}
                </div>
                <div className="text-sm text-muted">
                  {activityContext?.nextAction || "Continue engagement"}
                </div>
              </div>
            </div>
            {stageProgression && (
              <div className="text-right">
                <div className="text-sm text-muted">Suggested</div>
                <div className="font-semibold text-green-600">
                  Progress to {stageProgression.toStage}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* At a Glance - Now in a box */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              At a Glance
            </h3>
            <p className="text-sm text-muted mt-1">
              Key metrics and status information
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-muted mb-1">Role</div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(person.customFields?.monacoEnrichment?.buyerGroupAnalysis?.role || person.relationship || "Contact")}`}
            >
              {person.customFields?.monacoEnrichment?.buyerGroupAnalysis
                ?.role ||
                person.relationship ||
                "Contact"}
            </span>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-muted mb-1">
              Last Action
            </div>
            <div className="text-lg text-foreground">
              <InlineEditField
                value={person.lastAction || ''}
                field="lastAction"
                recordId={person.id?.toString() || ''}
                recordType="speedrun"
                placeholder="Enter last action"
                onSave={handleSpeedrunInlineFieldSave}
                className="text-lg text-foreground"
              />
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-muted mb-1">
              Next Step
            </div>
            <div className="text-lg text-foreground">
              <InlineEditField
                value={(() => {
                  const monaco = person.customFields?.monacoEnrichment;
                  const nextBestAction =
                    monaco?.opportunityIntelligence?.nextBestAction;
                  return nextBestAction || person.nextAction || '';
                })()}
                field="nextAction"
                recordId={person.id?.toString() || ''}
                recordType="speedrun"
                placeholder="Enter next action"
                onSave={handleSpeedrunInlineFieldSave}
                className="text-lg text-foreground"
              />
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-muted mb-1">
              Rank
            </div>
            <div className="mt-1">
              {(() => {
                // Check if state-based ranking is active
                const isStateBased = (person as any).rankingMode === 'state-based';
                const stateRank = (person as any).stateRank;
                const companyRankInState = (person as any).companyRankInState;
                const personRankInCompany = (person as any).personRankInCompany;
                
                if (isStateBased && stateRank && companyRankInState && personRankInCompany) {
                  // Show state-based hierarchy
                  return (
                    <div className="space-y-1">
                      <div className="text-lg text-foreground font-semibold">
                        #{stateRank}-{companyRankInState}-{personRankInCompany}
                      </div>
                      <div className="text-xs text-muted">
                        State-Company-Person
                      </div>
                    </div>
                  );
                } else {
                  // Show global rank
                  const globalRank = (person as any).globalRank;
                  const winningScoreRank = person.winningScore?.rank;
                  const rankValue = globalRank ? globalRank.toString() : (winningScoreRank || '');
                  
                  return (
                    <InlineEditField
                      value={rankValue}
                      field="globalRank"
                      recordId={person.id?.toString() || ''}
                      recordType="speedrun"
                      inputType="number"
                      placeholder="Enter rank (1-999)"
                      onSave={handleSpeedrunInlineFieldSave}
                      className="text-lg text-foreground font-semibold"
                      min={1}
                      max={999}
                    />
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Main info - Now in boxes */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Basic Information
              </h3>
              <p className="text-sm text-muted mt-1">
                Contact details and personal information
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted">
                Name
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={person.name || ''}
                  field="name"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  placeholder="Enter name"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            {/* TITLE FIELD TEMPORARILY HIDDEN
            <div>
              <label className="block text-sm font-medium text-muted">
                Title
              </label>
              <p className="mt-1 text-lg text-foreground">
                {person.title || "-"}
              </p>
            </div>
            */}
            <div>
              <label className="block text-sm font-medium text-muted">
                Email
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={person.email || ''}
                  field="email"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  inputType="email"
                  placeholder="Enter email"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Phone
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={(() => {
                    const monacoPhone =
                      person.customFields?.monacoEnrichment?.contactInformation
                        ?.phones?.[0]?.number;
                    const phone = monacoPhone || person.phone;
                    return getPhoneDisplayValue(phone);
                  })()}
                  field="phone"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  inputType="tel"
                  placeholder="Enter phone number"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-muted"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Vertical
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={(() => {
                    const monaco = person.customFields?.monacoEnrichment;
                    const vertical = monaco?.companyIntelligence?.industry;
                    return vertical || "Technology";
                  })()}
                  field="vertical"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  inputType="select"
                  options={[
                    { value: 'Technology', label: 'Technology' },
                    { value: 'Healthcare', label: 'Healthcare' },
                    { value: 'Financial Services', label: 'Financial Services' },
                    { value: 'Manufacturing', label: 'Manufacturing' },
                    { value: 'Retail', label: 'Retail' },
                    { value: 'Education', label: 'Education' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                State
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={person.state || person.company?.hqState || ''}
                  field="state"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  placeholder="Enter state"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                LinkedIn
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={(() => {
                    const monacoLinkedIn =
                      person.customFields?.monacoEnrichment?.contactInformation
                        ?.linkedin_profile;
                    return monacoLinkedIn || person.linkedin || person.linkedinUrl || '';
                  })()}
                  field="linkedinUrl"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  inputType="url"
                  placeholder="Enter LinkedIn URL"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                LinkedIn Navigator
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={person.linkedinNavigatorUrl || ''}
                  field="linkedinNavigatorUrl"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  inputType="url"
                  placeholder="Enter LinkedIn Navigator URL"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                LinkedIn Connection Date
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={person.linkedinConnectionDate || ''}
                  field="linkedinConnectionDate"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  variant="date"
                  placeholder="Select connection date"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                College
              </label>
              <p className="mt-1 text-lg text-foreground">
                {person.customFields?.monacoEnrichment?.enrichedProfiles?.education
                  ?.map(
                    (edu) => `${edu.degree} from ${edu.school} (${edu.year})`,
                  )
                  .join(", ") ||
                  "Professional background in business and industry expertise"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Lead Information
              </h3>
              <p className="text-sm text-muted mt-1">
                Lead status and engagement details
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted">
                Status
              </label>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  person['status'] === "Opportunity"
                    ? "bg-[#EEF2FF] text-[#3730A3] border border-[#A5B4FC]"
                    : person['status'] === "Customer"
                      ? "bg-green-50/70 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : person['status'] === "Prospect"
                        ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]"
                        : person['status'] === "New" || person['status'] === "Lead"
                          ? "bg-[#FFF7ED] text-[#9A3412] border border-[#FDBA74]"
                          : "bg-hover text-foreground"
                }`}
              >
                {person.status || "Lead"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Source
              </label>
              <p className="mt-1 text-lg text-foreground">Speedrun</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Company
              </label>
              <button
                onClick={onCompanyDetailClick}
                className="mt-1 text-lg font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0"
              >
                {typeof person.company === 'object' ? person.company?.name || "-" : person.company || "-"}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Created At
              </label>
              <p className="mt-1 text-lg text-foreground">
                {person.lastContact
                  ? formatRelativeDate(person.lastContact)
                  : "Recently added"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Influencer Level
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={(person as any).influenceLevel || ''}
                  field="influenceLevel"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  placeholder="Enter influencer level"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">
                Engagement Strategy
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={(person as any).engagementStrategy || ''}
                  field="engagementStrategy"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  placeholder="Enter engagement strategy"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wants and Needs - Now in a box */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Wants & Needs Analysis
            </h3>
            <p className="text-sm text-muted mt-1">
              Personal motivations and requirements
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Wants
            </div>
            <div className="text-foreground bg-background border border-border rounded-lg p-4">
              {generatePersonalWants(person)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Needs
            </div>
            <div className="text-foreground bg-background border border-border rounded-lg p-4">
              {generatePersonalNeeds(person)}
            </div>
          </div>
        </div>
      </div>

      {/* Last Actions - Show real action logs */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Last Actions
            </h3>
            <p className="text-sm text-muted mt-1">
              Recent actions and activity logs
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {actionLogsLoading ? (
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 bg-loading-bg rounded-full"></div>
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-loading-bg rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-loading-bg rounded"></div>
                </div>
              </div>
            </div>
          ) : actionLogs.length > 0 ? (
            <ul className="space-y-2">
              {actionLogs.slice(0, 10).map((log) => {
                // Get user display name - prefer userName from log, fallback to checking if it's current user
                const userName = log.userName || 
                  (log.userId && authUser?.id === log.userId ? 'You' : 
                   (log.userEmail || 'Unknown User'));
                
                return (
                  <li key={log.id} className="text-sm text-foreground">
                    <span className="text-muted">`{log.type}`</span>{' '}
                    {log.notes || log.actionLog || 'Action completed'}{' '}
                    <span className="text-muted">- {userName} - {formatRelativeDate(log.timestamp.toISOString())}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <div className="text-muted mb-2">📋</div>
              <p className="text-muted text-sm">
                No actions yet. Use the "Add Action" button to log activities!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Notes - New section */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Recent Notes
            </h3>
            <p className="text-sm text-muted mt-1">
              Personal notes and recent activity notes
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Person's notes field */}
          {person.notes && person.notes.trim().length > 0 && (
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0 mt-1">📝</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">
                      Personal Notes
                    </span>
                    <span className="text-sm text-muted">
                      Contact notes
                    </span>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">
                    {person.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent action log notes */}
          {actionLogsLoading ? (
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 bg-loading-bg rounded-full"></div>
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-loading-bg rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-loading-bg rounded"></div>
                </div>
              </div>
            </div>
          ) : recentActionLogsWithNotes.length > 0 ? (
            <div className="space-y-3">
              {recentActionLogsWithNotes.map((log) => (
                <div
                  key={log.id}
                  className="bg-background border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {getActionIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground capitalize">
                          {log.type}
                        </span>
                        <span className="text-sm text-muted">
                          {formatRelativeDate(log.timestamp.toISOString())}
                        </span>
                      </div>
                      <p className="text-foreground text-sm leading-relaxed">
                        {log.notes}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !person.notes && (
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <div className="text-muted mb-2">📝</div>
              <p className="text-muted text-sm">
                No notes available yet. Add notes in the Notes tab or complete actions to start tracking!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deep Value Reports - Hidden for Dano's workspace */}
      {!isDanoWorkspace && (
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Deep Value Reports
              </h3>
              <p className="text-sm text-muted mt-1">
                AI-generated personalized value propositions
              </p>
            </div>
          </div>
          {isLoadingReports ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
              <span className="ml-2 text-muted">
                Generating personalized reports...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dynamicReports.map((idea, index) => (
                <div
                  key={index}
                  className="bg-background border border-border rounded-lg p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {idea.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted mb-4">
                    {idea.description}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onReportClick(`${idea.title}|${idea.type}-mini`)}
                      className="text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0 hover:underline"
                    >
                      Mini Report
                    </button>
                    <button
                      onClick={() => onReportClick(`${idea.title}|${idea.type}-deep`)}
                      className="text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0 hover:underline"
                    >
                      Deep Value Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
