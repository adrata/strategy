import React, { useState, useEffect } from "react";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { formatRelativeDate } from "@/platform/utils";
import { PipelineDataService, type OpportunityWithDetails } from "@/platform/services/pipeline-data-service";
import { getPlatformConfig } from "@/platform/platform-detection";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";
import { SuccessMessage } from "@/platform/ui/components/SuccessMessage";
import { useInlineEdit } from "@/platform/hooks/useInlineEdit";

export interface Opportunity {
  id: string;
  name: string;
  value: string;
  stage: string;
  status: string;
  company: string;
  probability: number;
  closeDate: string;
  source: string;
  contact: string;
  lastAction: string;
  nextAction: string;
  lastActionDate: string;
  nextActionDate: string;
  notes: string;
  buyerGroup: string[];
  currentStage?: string;
  completedStages?: string[];
}

interface OpportunityDetailsProps {
  opportunity: Opportunity;
  onBack: () => void;
  hideHeader?: boolean;
  onCompanyClick?: (company: string) => void;
  onEditOpportunity?: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onNavigateToBuyerGroups?: () => void;
  onNavigateToLeads?: () => void;
}

export const OpportunityDetails: React.FC<OpportunityDetailsProps> = ({
  opportunity,
  onBack,
  hideHeader = false,
  onCompanyClick,
  onEditOpportunity,
  onDeleteOpportunity,
  onNavigateToBuyerGroups,
  onNavigateToLeads,
}) => {
  const { ui } = useRevenueOS();
  const { navigateToPipelineItem } = useWorkspaceNavigation();
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentOpportunity, setCurrentOpportunity] = useState(opportunity);
  const [opportunityData, setOpportunityData] = useState<OpportunityWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use universal inline edit hook
  const {
    showSuccessMessage,
    successMessage,
    messageType,
    handleEditSave,
    closeMessage,
  } = useInlineEdit();

  // Handle back navigation with context
  const handleBackNavigation = () => {
    // Check if we have navigation context from account
    if (opportunity._navigationContext) {
      const { fromAccount, fromTab, fromSection } = opportunity._navigationContext;
      // Navigate back to the account with the specific tab
      ui.setSelectedRecord(fromAccount);
      ui.setDetailViewType('account');
      navigateToPipelineItem('accounts', fromAccount.id);
      // Note: The tab state will be handled by the AccountDetails component
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

  // Handle inline editing with universal hook
  const handleFieldEdit = async (field: string, value: string) => {
    const success = await handleEditSave('opportunity', opportunity.id, field, value);
    if (success) {
      // Update local state
      setOpportunityData(prev => prev ? { ...prev, [field]: value } : null);
      setCurrentOpportunity(prev => ({ ...prev, [field]: value }));
    }
  };

  const tabs = [
    "Overview",
    "Deal Analysis",
    "Buying Committee",
    "Activity",
    "History",
  ];

  // Load opportunity data from database
  useEffect(() => {
    const loadOpportunityData = async () => {
      try {
        setIsLoading(true);
        const data = await PipelineDataService.getOpportunityById(opportunity.id);
        setOpportunityData(data);
      } catch (error) {
        console.error("Failed to load opportunity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (opportunity.id) {
      loadOpportunityData();
    }
  }, [opportunity.id]);

  // Handle opportunity conversion through pipeline stages
  const handleConvertOpportunity = async () => {
    try {
      console.log(
        "🚀 Converting opportunity through pipeline stages:",
        currentOpportunity.name,
      );

      // Define the pipeline stages in order
      const PIPELINE_STAGES = [
        "Build Rapport",
        "Build Interest",
        "Build Consensus",
        "Build Decision",
      ];

      // Get current stage or default to first stage
      const currentStage = currentOpportunity.currentStage || "Build Rapport";
      const currentStageIndex = PIPELINE_STAGES.indexOf(currentStage);

      console.log(
        `📊 Current stage: ${currentStage} (index: ${currentStageIndex})`,
      );

      // Get platform configuration to determine if we're in desktop mode
      const platformConfig = getPlatformConfig();

      let updatedOpportunity;

      // If we're at the last stage (Closed Won), convert to customer
      if (currentStageIndex === PIPELINE_STAGES.length - 1) {
        console.log("🎯 At final stage - converting to customer");

        updatedOpportunity = {
          ...currentOpportunity,
          stage: "Closed Won",
          status: "Customer",
          currentStage: "Closed Won",
          completedStages: PIPELINE_STAGES,
          probability: 100,
          lastActionDate:
            new Date().toISOString().split("T")[0] ||
            new Date().toISOString().substring(0, 10),
        };

        // In web mode, you could make API call to convert to customer record here
        if (!platformConfig.isDesktop) {
          try {
            // API call to convert opportunity to customer would go here
            console.log("📡 Would convert opportunity to customer via API");
          } catch (error) {
            console.warn(
              "⚠️ API update failed, continuing with local update:",
              error,
            );
          }
        }

        setCurrentOpportunity(updatedOpportunity);
        if (onEditOpportunity) onEditOpportunity(updatedOpportunity);
        console.log("✅ Opportunity converted to customer!");
      } else if (currentStageIndex >= 0) {
        // Advance to next stage in pipeline
        const nextStageIndex = currentStageIndex + 1;
        const nextStage = PIPELINE_STAGES[nextStageIndex] || "Build Decision";
        const completedStages = PIPELINE_STAGES.slice(0, nextStageIndex);

        // Update probability based on stage
        const stageProbabilities = {
          "Build Rapport": 25,
          "Build Interest": 50,
          "Build Consensus": 75,
          "Build Decision": 100,
        };

        console.log(`📈 Advancing to next stage: ${nextStage}`);
        console.log(`✅ Completed stages: ${completedStages.join(", ")}`);

        // Update opportunity with new stage progression
        updatedOpportunity = {
          ...currentOpportunity,
          stage: nextStage,
          currentStage: nextStage,
          completedStages: completedStages,
          probability:
            stageProbabilities[nextStage as keyof typeof stageProbabilities] ||
            currentOpportunity.probability,
          lastActionDate:
            new Date().toISOString().split("T")[0] ||
            new Date().toISOString().substring(0, 10),
          nextAction: `Continue ${nextStage} activities`,
        };

        // Update opportunity via API in web mode
        if (!platformConfig.isDesktop) {
          try {
            // API call to update opportunity would go here
            console.log("📡 Would update opportunity via API");
          } catch (error) {
            console.warn(
              "⚠️ API update failed, continuing with local update:",
              error,
            );
          }
        }

        setCurrentOpportunity(updatedOpportunity);
        if (onEditOpportunity) onEditOpportunity(updatedOpportunity);
        console.log(`✅ Opportunity advanced to ${nextStage} stage`);
      }
    } catch (error) {
      console.error("❌ Error converting opportunity:", error);
      alert(
        `Failed to convert opportunity: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Get contextual convert button text based on current stage
  const getConvertButtonText = (): string => {
    const PIPELINE_STAGES = [
      "Build Rapport",
      "Build Interest",
      "Build Consensus",
      "Build Decision",
    ];
    const currentStage = currentOpportunity.currentStage || "Build Rapport";
    const currentStageIndex = PIPELINE_STAGES.indexOf(currentStage);

    if (currentStageIndex === PIPELINE_STAGES.length - 1) {
      return "Close as Won";
    } else if (currentStageIndex >= 0) {
      const nextStage = PIPELINE_STAGES[currentStageIndex + 1];
      return `Move to ${nextStage}`;
    } else {
      return "Start Pipeline";
    }
  };

  // Template data for each tab - now loaded from database
  const dealAnalysisData = opportunityData?.dealAnalysis || {
    riskFactors: ["Budget approval pending", "Competition from Salesforce"],
    winFactors: ["Strong technical fit", "Existing relationship"],
    timeline: "Q2 2024 close expected",
    requirements: [
      "SOC 2 compliance",
      "Multi-tenant architecture",
      "API integration",
    ],
    decisionCriteria: [
      "ROI within 12 months",
      "Technical feasibility",
      "Implementation timeline",
    ],
  };

  const buyingCommitteeData = opportunityData?.buyingCommittee || {
    champion: opportunity.contact,
    decisionMaker: "VP of Sales",
    influencers: ["IT Director", "CFO"],
    gatekeepers: ["Procurement Manager"],
    consensus: "Positive",
    concerns: ["Implementation timeline", "Training requirements"],
  };


  const activityData = {
    emails: 12,
    calls: 8,
    meetings: 5,
    demos: 2,
    lastActivity: opportunity.lastActionDate,
    nextActivity: opportunity.nextActionDate,
  };

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
                Opportunity Detail
              </h1>
            </div>
            <div className="flex gap-2">
              {/* Edit button removed per user request */}
              {currentOpportunity['stage'] === "Closed Won" ? (
                <span
                  style={{
                    background: "#10b981",
                    color: "white",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 1.25rem",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    display: "inline-block",
                    border: "1px solid #10b981",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  Won
                </span>
              ) : (
                <>
                  <button
                    onClick={handleConvertOpportunity}
                    style={{
                      background: "#2563EB",
                      color: "white",
                      border: "1px solid #2563EB",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 1rem",
                      transition: "background 0.15s, color 0.15s, border 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget['style']['background'] = "#1d4ed8";
                      e.currentTarget['style']['color'] = "white";
                      e.currentTarget['style']['border'] = "1px solid #1d4ed8";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget['style']['background'] = "#2563EB";
                      e.currentTarget['style']['color'] = "white";
                      e.currentTarget['style']['border'] = "1px solid #2563EB";
                    }}
                  >
                    {getConvertButtonText()}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Loader 
            type="skeleton" 
            size="md"
            message="Loading opportunity details..."
            className="bg-[var(--background)]"
          />
        )}

        {/* Content - only show when not loading */}
        {!isLoading && (
          <>
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
                  style={{
                    borderBottom: activeTab === tab ? "none" : "none",
                    borderColor:
                      activeTab === tab ? "var(--border)" : "transparent",
                    marginBottom: activeTab === tab ? "-1px" : "0",
                    position: "relative",
                  }}
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
                    {/* At a Glance */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                        At a Glance
                      </h2>
                      <div className="flex flex-wrap gap-4">
                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                          <div className="font-semibold text-[var(--muted)] mb-1">
                            Stage
                          </div>
                          <div className="text-lg text-[var(--foreground)]">
                            {currentOpportunity.stage}
                          </div>
                        </div>
                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                          <div className="font-semibold text-[var(--muted)] mb-1">
                            Close Probability
                          </div>
                          <div className="text-lg text-[var(--foreground)]">
                            {currentOpportunity.probability}%
                          </div>
                        </div>
                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 min-w-[180px]">
                          <div className="font-semibold text-[var(--muted)] mb-1">
                            Expected Close
                          </div>
                          <div className="text-lg text-[var(--foreground)]">
                            {formatRelativeDate(opportunity.closeDate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                          Opportunity Information
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[var(--muted)]">
                              Opportunity Name
                            </label>
                            <p className="mt-1 text-lg text-[var(--foreground)]">
                              {opportunity.name}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[var(--muted)]">
                              Company
                            </label>
                            <p className="mt-1 text-lg text-[var(--foreground)]">
                              {opportunity.company}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[var(--muted)]">
                              Value
                            </label>
                            <p className="mt-1 text-lg font-bold text-green-600">
                              {opportunity.value}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[var(--muted)]">
                              Source
                            </label>
                            <p className="mt-1 text-lg text-[var(--foreground)]">
                              {opportunity.source}
                            </p>
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
                            <p className="mt-1 text-lg text-[var(--foreground)]">
                              {opportunity.lastAction}
                            </p>
                            <p className="text-sm text-[var(--muted)]">
                              {formatRelativeDate(opportunity.lastActionDate)}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[var(--muted)]">
                              Next Action
                            </label>
                            <p className="mt-1 text-lg text-[var(--foreground)]">
                              {opportunity.nextAction}
                            </p>
                            <p className="text-sm text-[var(--muted)]">
                              {formatRelativeDate(opportunity.nextActionDate)}
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
                        <p className="text-[var(--foreground)]">
                          {opportunity.notes || "No notes available for this opportunity."}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Buyer Group" && (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Buyer Group
                    </h2>
                    <div className="space-y-4">
                      {opportunity['buyerGroup'] && opportunity.buyerGroup.length > 0 ? (
                        opportunity.buyerGroup.map((member: string, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                                  {member}
                                </h3>
                                <p className="text-[var(--muted)]">Stakeholder</p>
                              </div>
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[#6b7280] text-white">
                                Member
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                          <p className="text-[var(--muted)]">No buyer group members defined yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === "Deal Analysis" && (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Deal Analysis
                    </h2>
                    <div className="space-y-6">
                      {/* Deal Score */}
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                          Deal Health Score
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-green-600">
                            {opportunity.probability || 75}%
                          </div>
                          <div className="text-[var(--muted)]">
                            Based on stage, engagement, and pipeline velocity
                          </div>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                            Key Risks
                          </h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-[var(--foreground)]">Budget approval timeline</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-[var(--foreground)]">Technical evaluation pending</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-[var(--foreground)]">Competitor activity</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                            Success Factors
                          </h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-[var(--foreground)]">Strong champion identified</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-[var(--foreground)]">Budget allocated</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-[var(--foreground)]">Timeline alignment</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Deal Progression */}
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                          Next Steps & Timeline
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-[var(--foreground)] font-medium">
                              {opportunity.nextAction || "Follow up with key stakeholder"}
                            </span>
                            <span className="text-sm text-[var(--muted)]">
                              {formatRelativeDate(opportunity.nextActionDate) || "Next week"}
                            </span>
                          </div>
                          <div className="text-[var(--muted)] text-sm">
                            Critical path to close: Technical demo → Final proposal → Legal review → Contract signature
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Buying Committee" && (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Buying Committee
                    </h2>
                    <div className="space-y-6">
                      {/* Committee Overview */}
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                          Committee Status
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[var(--foreground)]">
                              {opportunityData?.contacts?.length || 3}
                            </div>
                            <div className="text-sm text-[var(--muted)]">Total Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.ceil((opportunityData?.contacts?.length || 3) * 0.67)}
                            </div>
                            <div className="text-sm text-[var(--muted)]">Engaged</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.ceil((opportunityData?.contacts?.length || 3) * 0.33)}
                            </div>
                            <div className="text-sm text-[var(--muted)]">Champions</div>
                          </div>
                        </div>
                      </div>

                      {/* Key Stakeholders */}
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                          Key Stakeholders
                        </h3>
                        <div className="space-y-4">
                          {/* Decision Maker */}
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                                DM
                              </div>
                              <div>
                                <div className="font-semibold text-[var(--foreground)]">
                                  {opportunity.contactName || "Executive Sponsor"}
                                </div>
                                <div className="text-sm text-[var(--muted)]">Decision Maker</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                                Champion
                              </span>
                            </div>
                          </div>

                          {/* Technical Evaluator */}
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                TE
                              </div>
                              <div>
                                <div className="font-semibold text-[var(--foreground)]">Technical Lead</div>
                                <div className="text-sm text-[var(--muted)]">Technical Evaluator</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                                Evaluating
                              </span>
                            </div>
                          </div>

                          {/* Economic Buyer */}
                          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                EB
                              </div>
                              <div>
                                <div className="font-semibold text-[var(--foreground)]">Budget Owner</div>
                                <div className="text-sm text-[var(--muted)]">Economic Buyer</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded">
                                Needs Info
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Engagement Strategy */}
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                          Engagement Strategy
                        </h3>
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="font-medium text-[var(--foreground)]">Priority Action</div>
                            <div className="text-sm text-[var(--muted)] mt-1">
                              Schedule technical demo with evaluation team
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--panel-background)]/50 rounded-lg">
                            <div className="font-medium text-[var(--foreground)]">Next Week</div>
                            <div className="text-sm text-[var(--muted)] mt-1">
                              Follow up with economic buyer on budget timeline
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}


                {activeTab === "Activity" && (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Activity Summary
                    </h2>
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {activityData.emails}
                        </div>
                        <div className="text-sm text-[var(--muted)]">Emails</div>
                      </div>
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {activityData.calls}
                        </div>
                        <div className="text-sm text-[var(--muted)]">Calls</div>
                      </div>
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {activityData.meetings}
                        </div>
                        <div className="text-sm text-[var(--muted)]">Meetings</div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "History" && (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                      Opportunity History
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <div className="font-semibold text-[var(--foreground)]">
                          Stage History
                        </div>
                        <div className="mt-2 text-[var(--muted)]">
                          Created → Build Rapport → Build Interest → Build Consensus
                          → Build Decision
                        </div>
                      </div>
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <div className="font-semibold text-[var(--foreground)]">
                          Key Milestones
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="text-[var(--foreground)]">
                            Initial contact made
                          </div>
                          <div className="text-[var(--foreground)]">
                            Demo completed
                          </div>
                          <div className="text-[var(--foreground)]">
                            Proposal submitted
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
