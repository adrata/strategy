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

interface OverviewTabProps {
  person: SpeedrunPerson;
  dynamicReports: ValueIdea[];
  isLoadingReports: boolean;
  onReportClick: (reportUrl: string) => void;
  onCompanyDetailClick: () => void;
  onInlineFieldSave?: (field: string, value: string, recordId: string, recordType: string) => Promise<void>;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "Champion":
      return "bg-green-100 text-green-800 border-green-200";
    case "Decision Maker":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Stakeholder":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-[var(--hover)] text-gray-800 border-[var(--border)]";
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
  
  // Handle inline field updates for speedrun
  const handleSpeedrunInlineFieldSave = onInlineFieldSave || (async (field: string, value: string, recordId: string, recordType: string) => {
    try {
      console.log(`🔄 [SPEEDRUN-OVERVIEW] Inline updating ${field} for person:`, recordId, 'to:', value);
      
      // TODO: Implement actual speedrun inline update API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the person object locally (this would normally come from state management)
      (person as any)[field] = value;
      
      console.log(`✅ [SPEEDRUN-OVERVIEW] Inline saved ${field} for speedrun person:`, recordId);
      
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

  return (
    <div className="space-y-6">
      {/* Header - Outside the box like intelligence design */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Lead Overview
        </h2>
        <p className="text-[var(--muted)]">
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
          className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
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
          Add Action
        </button>
      </div>

      {/* Contextual Activity Banner */}
      {contextualInsight && (
        <div className={`p-4 rounded-lg border ${
          activityContext?.priority === 'high' ? 'bg-red-50 border-red-200' :
          activityContext?.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
          'bg-[var(--panel-background)] border-[var(--border)]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                activityContext?.priority === 'high' ? 'bg-red-100 text-red-800' :
                activityContext?.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-[var(--hover)] text-gray-800'
              }`}>
                {activityContext?.activityType === 'email' ? '📧' : 
                 activityContext?.activityType === 'call' ? '📞' : 
                 activityContext?.activityType === 'meeting' ? '🤝' : '📱'}
              </div>
              <div>
                <div className="font-semibold text-[var(--foreground)]">
                  {contextualInsight}
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {activityContext?.nextAction || "Continue engagement"}
                </div>
              </div>
            </div>
            {stageProgression && (
              <div className="text-right">
                <div className="text-sm text-[var(--muted)]">Suggested</div>
                <div className="font-semibold text-green-600">
                  Progress to {stageProgression.toStage}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* At a Glance - Now in a box */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              At a Glance
            </h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              Key metrics and status information
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-[var(--muted)] mb-1">Role</div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(person.customFields?.monacoEnrichment?.buyerGroupAnalysis?.role || person.relationship || "Contact")}`}
            >
              {person.customFields?.monacoEnrichment?.buyerGroupAnalysis
                ?.role ||
                person.relationship ||
                "Contact"}
            </span>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-[var(--muted)] mb-1">
              Last Engagement
            </div>
            <div className="text-lg text-[var(--foreground)]">
              {(() => {
                const monaco = person.customFields?.monacoEnrichment;
                const recentActivity =
                  monaco?.enrichedProfiles?.recentActivity?.[0];
                const lastEngagement =
                  recentActivity?.timestamp || person.lastContact;
                return lastEngagement
                  ? formatRelativeDate(lastEngagement)
                  : "-";
              })()}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
            <div className="font-semibold text-[var(--muted)] mb-1">
              Next Step
            </div>
            <div className="text-lg text-[var(--foreground)]">
              {(() => {
                const monaco = person.customFields?.monacoEnrichment;
                const nextBestAction =
                  monaco?.opportunityIntelligence?.nextBestAction;
                return nextBestAction || person.nextAction || "-";
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Main info - Now in boxes */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Basic Information
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                Contact details and personal information
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
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
                  className="text-lg text-[var(--foreground)]"
                />
              </div>
            </div>
            {/* TITLE FIELD TEMPORARILY HIDDEN
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Title
              </label>
              <p className="mt-1 text-lg text-[var(--foreground)]">
                {person.title || "-"}
              </p>
            </div>
            */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
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
                  className="text-lg text-[var(--foreground)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Phone
              </label>
              <div className="mt-1">
                <InlineEditField
                  value={(() => {
                    const monacoPhone =
                      person.customFields?.monacoEnrichment?.contactInformation
                        ?.phones?.[0]?.number;
                    const phone = monacoPhone || person.phone;
                    return phone
                      ? phone.startsWith("+1")
                        ? phone
                        : `+1 ${phone.replace(/[\(\)\s-]/g, "")}`
                      : "";
                  })()}
                  field="phone"
                  recordId={person.id?.toString() || ''}
                  recordType="speedrun"
                  inputType="tel"
                  placeholder="Enter phone number"
                  onSave={handleSpeedrunInlineFieldSave}
                  className="text-lg text-[var(--muted)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
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
                  className="text-lg text-[var(--foreground)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                LinkedIn Profile
              </label>
              {(() => {
                const monacoLinkedIn =
                  person.customFields?.monacoEnrichment?.contactInformation
                    ?.linkedin_profile;
                const linkedinUrl = monacoLinkedIn || person.linkedin;
                return linkedinUrl ? (
                  <button
                    onClick={async () => {
                      const fullUrl = linkedinUrl.startsWith("http")
                        ? linkedinUrl
                        : `https://${linkedinUrl}`;
                      console.log("🔗 Opening LinkedIn profile:", fullUrl);

                      // Enhanced approach for both web and Tauri desktop
                      try {
                        // Check if we're in Tauri desktop environment
                        if (
                          typeof window !== "undefined" &&
                          (window as any).__TAURI__
                        ) {
                          console.log(
                            "🖥️ Tauri desktop detected - opening external URL",
                          );
                          // For Tauri desktop, we'll use window.open which should work
                          // The Tauri window will handle opening in system browser
                          const opened = window.open(
                            fullUrl,
                            "_blank",
                            "noopener,noreferrer",
                          );
                          if (opened) {
                            console.log(
                              "✅ LinkedIn profile opened in system browser",
                            );
                          } else {
                            console.warn(
                              "⚠️ Window.open blocked - user may need to allow popups",
                            );
                          }
                        } else {
                          console.log("🌐 Web environment - using window.open");
                          window.open(fullUrl, "_blank", "noopener,noreferrer");
                          console.log("✅ LinkedIn profile opened in new tab");
                        }
                      } catch (error) {
                        console.error(
                          "❌ Failed to open LinkedIn profile:",
                          error,
                        );
                        // Fallback attempt
                        try {
                          window.open(fullUrl, "_blank", "noopener,noreferrer");
                        } catch (fallbackError) {
                          console.error(
                            "❌ Fallback also failed:",
                            fallbackError,
                          );
                        }
                      }
                    }}
                    className="mt-1 text-lg font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0 text-left"
                    style={{ color: "#2563EB !important" }}
                  >
                    View LinkedIn Profile
                  </button>
                ) : (
                  <p className="mt-1 text-lg text-[var(--muted)]">-</p>
                );
              })()}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                College
              </label>
              <p className="mt-1 text-lg text-[var(--foreground)]">
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
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Lead Information
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                Lead status and engagement details
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Status
              </label>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  person['status'] === "Opportunity"
                    ? "bg-[#EEF2FF] text-[#3730A3] border border-[#A5B4FC]"
                    : person['status'] === "Customer"
                      ? "bg-green-100 text-green-800"
                      : person['status'] === "Prospect"
                        ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]"
                        : person['status'] === "New" || person['status'] === "Lead"
                          ? "bg-[#FFF7ED] text-[#9A3412] border border-[#FDBA74]"
                          : "bg-[var(--hover)] text-gray-800"
                }`}
              >
                {person.status || "Lead"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Source
              </label>
              <p className="mt-1 text-lg text-[var(--foreground)]">Speedrun</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Company
              </label>
              <button
                onClick={onCompanyDetailClick}
                className="mt-1 text-lg font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0"
              >
                {person.company || "-"}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Created At
              </label>
              <p className="mt-1 text-lg text-[var(--foreground)]">
                {person.lastContact
                  ? formatRelativeDate(person.lastContact)
                  : "Recently added"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wants and Needs - Now in a box */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Wants & Needs Analysis
            </h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              Personal motivations and requirements
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Wants
            </div>
            <div className="text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
              {generatePersonalWants(person)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Needs
            </div>
            <div className="text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
              {generatePersonalNeeds(person)}
            </div>
          </div>
        </div>
      </div>

      {/* Deep Value Reports - Hidden for Dano's workspace */}
      {!isDanoWorkspace && (
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Deep Value Reports
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                AI-generated personalized value propositions
              </p>
            </div>
          </div>
          {isLoadingReports ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
              <span className="ml-2 text-[var(--muted)]">
                Generating personalized reports...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dynamicReports.map((idea, index) => (
                <div
                  key={index}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {idea.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-4">
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
