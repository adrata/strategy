"use client";

import React from "react";
import { formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { MonacoRecord, Company, Person } from "../types";
import { DirectionalIntelligenceComponent } from "./DirectionalIntelligence";
import { useMonacoPipeline } from "@/platform/hooks/useMonacoPipeline";
import { PainIntelligence, PainIntelligenceData, ExamplePainData } from "./PainIntelligence";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";

interface MonacoRecordDetailProps {
  record: MonacoRecord;
  onBack: () => void;
  defaultTab?: string;
  onPersonClick?: (person: Person) => void;
}

// Generate pain intelligence data for the enhanced pain component
const generatePainIntelligenceData = (person: Person): PainIntelligenceData => {
  const personKey = `${person.name.toLowerCase().replace(' ', '-')}-${person.company?.toLowerCase().replace(' ', '-') || 'company'}`;
  
  // Check if we have example data for this person
  if (ExamplePainData[personKey]) {
    return ExamplePainData[personKey];
  }
  
  // Generate default pain intelligence data based on role and company
  const role = person.buyerGroupRole || "Stakeholder";
  const company = person.company || "Company";
  const painSummary = (person as any).painSummary || "";
  
  // Create basic pain data if no example exists
  return {
    personId: person.id || personKey,
    personName: person.name || "Unknown",
    role: person.title || "Professional", 
    company: company || "Unknown Company",
    totalPainPoints: 3,
    criticalPainPoints: [
      {
        id: `${personKey}-default-pain`,
        category: "operational",
        title: "Process Efficiency Challenges",
        description: painSummary || `${person.name} faces operational challenges that impact their role as ${person.title || 'Professional'} at ${company}.`,
        quantifiedImpact: 500000,
        urgency: "medium",
        timeline: "Next quarter",
        sources: [
          {
            source: "Industry Analysis",
            type: "external",
            confidence: 75,
            lastUpdated: new Date().toISOString().split('T')[0],
            data: `Market research indicates common challenges in ${person.department || 'technology'} roles similar to ${person.title || 'Professional'}.`
          },
          {
            source: "Profile Analysis",
            type: "discovery",
            confidence: 70,
            lastUpdated: new Date().toISOString().split('T')[0],
            data: painSummary || "Based on role and seniority level, typical operational challenges identified."
          }
        ],
        evidence: [
          "Industry benchmarks show efficiency gaps",
          "Role-specific challenges documented",
          "Company size and stage indicators"
        ],
        consequences: [
          "Continued operational inefficiency",
          "Competitive disadvantage",
          "Resource allocation challenges"
        ]
      }
    ],
    externalDataPercentage: 75,
    discoveryDataPercentage: 25,
    lastAnalyzed: new Date().toLocaleDateString(),
    confidenceScore: 72
  };
};

export function MonacoRecordDetail({
  record,
  onBack,
  defaultTab = "Overview",
  onPersonClick,
}: MonacoRecordDetailProps) {
  const isCompany = "icpScore" in record;

  // Monaco pipeline hook for getting real intelligence
  const {
    getCompanyIntelligence,
    runCompanyPipeline,
    isPipelineLoading,
    isCompanyPipelineRunning,
  } = useMonacoPipeline();

  // Get real intelligence data from the pipeline
  const pipelineIntelligence = isCompany
    ? getCompanyIntelligence(record.id)
    : null;

  // Rich company data from Acquisition OS
  const getRichCompanyData = (company: Company) => ({
    ...company,
    marketCap: "$2.5B",
    fundingRounds: [
      {
        type: "Series B",
        amount: "$25M",
        date: "2023-03-15",
        investors: ["Accel Partners", "Sequoia Capital"],
      },
      {
        type: "Series A",
        amount: "$8M",
        date: "2021-09-20",
        investors: ["First Round Capital", "Y Combinator"],
      },
    ],
    keyContacts: [
      {
        name: "Sarah Chen",
        title: "VP of Engineering",
        email: "sarah.chen@techcorp.com",
        linkedin: "linkedin.com/in/sarahchen",
        department: "Engineering",
      },
      {
        name: "Michael Rodriguez",
        title: "CTO",
        email: "michael.r@techcorp.com",
        linkedin: "linkedin.com/in/mrodriguez",
        department: "Technology",
      },
      {
        name: "Jennifer Wang",
        title: "Head of Product",
        email: "jen.wang@techcorp.com",
        linkedin: "linkedin.com/in/jenwang",
        department: "Product",
      },
    ],
    technologies: [
      "React",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Kubernetes",
      "Docker",
      "Redis",
    ],
    recentNews: [
      {
        title: "TechCorp Raises $25M Series B for AI Platform Expansion",
        date: "2024-01-10",
        source: "TechCrunch",
        summary:
          "Company plans to expand AI capabilities and hire 50 engineers.",
      },
      {
        title: "TechCorp Partners with Microsoft for Enterprise Solutions",
        date: "2024-01-05",
        source: "Business Wire",
        summary: "Strategic partnership to deliver enterprise-grade solutions.",
      },
    ],
    engagementHistory: [
      {
        type: "demo",
        date: "2024-01-12",
        contact: "Sarah Chen",
        outcome: "Positive - requested technical deep dive",
        nextSteps: "Schedule architecture review",
      },
      {
        type: "email",
        date: "2024-01-08",
        contact: "Michael Rodriguez",
        outcome: "Opened whitepaper, 15 min read time",
        nextSteps: "Follow up on technical questions",
      },
    ],
    intentSignals: [
      {
        signal: "Downloaded technical whitepaper",
        strength: "high" as const,
        date: "2024-01-08",
        source: "Website",
      },
      {
        signal: "Multiple team members viewing pricing page",
        strength: "medium" as const,
        date: "2024-01-06",
        source: "Analytics",
      },
      {
        signal: "Posted DevOps engineer job openings",
        strength: "medium" as const,
        date: "2024-01-04",
        source: "LinkedIn",
      },
    ],
  });

  // Rich person data from Acquisition OS
  const getRichPersonData = (person: Person) => ({
    ...person,
    bio: "Experienced engineering leader with 12+ years building scalable systems at high-growth companies. Passionate about technical excellence and team development.",
    education: [
      {
        school: "Stanford University",
        degree: "MS Computer Science",
        year: "2012",
      },
      {
        school: "UC Berkeley",
        degree: "BS Electrical Engineering",
        year: "2010",
      },
    ],
    workHistory: [
      {
        company: "TechCorp Solutions",
        title: "VP of Engineering",
        duration: "2022-Present",
        description:
          "Leading 45-person engineering org, architecting next-gen platform",
      },
      {
        company: "Airbnb",
        title: "Engineering Manager",
        duration: "2019-2022",
        description:
          "Managed payments infrastructure team, 3x throughput improvement",
      },
      {
        company: "Stripe",
        title: "Senior Software Engineer",
        duration: "2015-2019",
        description:
          "Built core API services, designed microservices architecture",
      },
    ],
    preferredContact: "email" as const,
    timezone: "PST",
    socialProfiles: {
      linkedin: "linkedin.com/in/sarahchen",
      twitter: "@sarahchen_eng",
      github: "github.com/sarahchen",
    },
    engagementScore: 87,
    lastEngagement: {
      type: "Demo attendance",
      date: "2024-01-12",
      outcome: "Highly engaged, asked technical questions",
    },
    interests: [
      "System Architecture",
      "Engineering Leadership",
      "Machine Learning",
      "DevOps",
    ],
    expertiseAreas: [
      "Distributed Systems",
      "Cloud Infrastructure",
      "Team Scaling",
      "Platform Engineering",
    ],
    mutualConnections: [
      { name: "Alex Chen", relationship: "Former colleague at Stripe" },
      { name: "Maria Rodriguez", relationship: "Stanford classmate" },
    ],
  });

  const richData = isCompany
    ? getRichCompanyData(record as Company)
    : getRichPersonData(record as Person);

  // Tab state
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Intelligence data from pipeline
  const hasIntelligence = isCompany && (record as any).companyIntelligence;
  const intelligenceData = hasIntelligence
    ? (record as any).companyIntelligence
    : null;

  // Company tabs - include intelligence if available
  const companyTabs = [
    "Overview",
    "Technology",
    "People",
    ...(hasIntelligence
      ? ["Intelligence", "Competitive Analysis", "Sales Strategy"]
      : []),
    "Engagement",
    "Intent Signals",
  ];

  // Person tabs
  const personTabs = ["Profile", "Engagement", "Intelligence", "Network"];

  return (
    <div
      className="flex-1 p-6 overflow-y-auto scrollbar-hide"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Back button and Transfer Company */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back
        </button>

        <button className="px-4 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg font-medium transition-colors hover:bg-[#2563EB]/10 flex items-center gap-2">
          <div className="w-4 h-4 bg-[#2563EB] rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">+</span>
          </div>
          Add to OS {formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}
        </button>
      </div>

      {/* Record header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start gap-6 mb-8">
          {isCompany ? (
            // Company header
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#2563EB]">
                    {record.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--foreground)]">
                    {record.name}
                  </h1>
                  <p className="text-lg text-[var(--muted)]">
                    {(record as Company).domain}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#2563EB]/10 text-[#2563EB]">
                      Potential Commission: $
                      {((record as Company).icpScore * 500).toLocaleString()}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {(record as Company).status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-[var(--foreground)]">
                  High-value enterprise software company with strong technical
                  leadership and active buying signals. Recent Series B funding
                  indicates growth trajectory and budget availability.
                </p>
              </div>
            </div>
          ) : (
            // Person header
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--hover-bg)] flex items-center justify-center text-2xl font-semibold text-[var(--foreground)] border border-[var(--border)]">
                  {record.name
                    .split(" ")
                    .map((n) => n?.[0] || '')
                    .join("")}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--foreground)]">
                    {record.name}
                  </h1>
                  <p className="text-lg text-[var(--muted)]">
                    {(record as Person).title}
                  </p>
                  <p className="text-lg font-medium text-[var(--foreground)]">
                    {(record as Person).company}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#2563EB]/10 text-[#2563EB]">
                      {(record as Person).seniority}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {(record as Person).status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-[var(--foreground)]">
                  {isCompany ? "" : (richData as any).bio}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced header with intelligence indicators */}
        {isCompany && hasIntelligence && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white text-lg">🧠</span>
              </div>
              <div>
                <div className="font-semibold text-[var(--foreground)]">
                  AI Intelligence Available
                </div>
                <div className="text-sm text-[var(--muted)]">
                  Pipeline analysis completed with actionable insights
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {intelligenceData.buyingSignals?.length || 0}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Buying Signals
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {intelligenceData.salesIntelligence?.avgDealSize || "N/A"}
                </div>
                <div className="text-xs text-[var(--muted)]">Avg Deal Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {intelligenceData.salesIntelligence?.avgSalesCycle || "N/A"}
                </div>
                <div className="text-xs text-[var(--muted)]">Sales Cycle</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced tabs navigation */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border)] overflow-x-auto">
          {(isCompany ? companyTabs : personTabs).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-[#9B59B6] text-[#9B59B6]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {/* Intelligence Tab - Enhanced with Real DirectionalIntelligence */}
          {activeTab === "Intelligence" && isCompany && (
            <div className="space-y-6">
              {/* Pipeline Status */}
              {isPipelineLoading && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <Loader type="dots" size="sm" />
                    <div>
                      <div className="font-semibold text-blue-900 dark:text-blue-100">
                        Running Intelligence Pipeline
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Analyzing {record.name} with comprehensive data
                        sources...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Run Pipeline Button if no intelligence */}
              {!pipelineIntelligence && !isPipelineLoading && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🧠</div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                      Generate Intelligence
                    </h3>
                    <p className="text-[var(--muted)] mb-4">
                      Run our full data pipeline to generate unique directional
                      intelligence, personality assessments, and actionable
                      insights for {record.name}.
                    </p>
                    <button
                      onClick={() =>
                        runCompanyPipeline.mutate({
                          companyId: record.id,
                          companyName: record.name,
                        })
                      }
                      disabled={isPipelineLoading}
                      className="px-6 py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50"
                    >
                      Run Intelligence Pipeline
                    </button>
                  </div>
                </div>
              )}

              {/* Real DirectionalIntelligence Component */}
              {pipelineIntelligence && (
                <div className="space-y-6">
                  {/* Intelligence Summary Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                        <span className="text-white text-lg">✅</span>
                      </div>
                      <div>
                        <div className="font-semibold text-green-900 dark:text-green-100">
                          Intelligence Analysis Complete
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Generated{" "}
                          {pipelineIntelligence.directionalIntelligence
                            ?.length || 0}{" "}
                          unique insights with{" "}
                          {Math.round(
                            (pipelineIntelligence.confidenceMetrics?.overall ||
                              0) * 100,
                          )}
                          % confidence
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {pipelineIntelligence.overallScore || 0}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Intelligence Score
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {pipelineIntelligence.directionalIntelligence
                            ?.length || 0}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Unique Insights
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {
                            Object.keys(
                              pipelineIntelligence.personalityAssessments || {},
                            ).length
                          }
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300">
                          People Analyzed
                        </div>
                      </div>
                      <div>
                                        <div className="text-2xl font-bold text-[var(--muted)]">
                  {Math.round(
                    (pipelineIntelligence.confidenceMetrics
                      ?.uniquenessScore || 0) * 100,
                  )}
                  %
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  Uniqueness
                </div>
                      </div>
                    </div>
                  </div>

                  {/* DirectionalIntelligence Component */}
                  <DirectionalIntelligenceComponent
                    insights={
                      pipelineIntelligence.directionalIntelligence || []
                    }
                    personalityAssessments={
                      pipelineIntelligence.personalityAssessments || {}
                    }
                    companyName={record.name}
                  />
                </div>
              )}

              {/* Fallback to basic intelligence if no pipeline data */}
              {!pipelineIntelligence &&
                !isPipelineLoading &&
                hasIntelligence && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                          <span>🎯</span> Business Priorities
                        </h3>
                        <div className="space-y-2">
                          {intelligenceData.businessPriorities?.map(
                            (priority: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span className="text-sm text-[var(--foreground)]">
                                  {priority}
                                </span>
                              </div>
                            ),
                          ) || (
                            <p className="text-sm text-[var(--muted)]">
                              No priorities identified
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                          <span>⚠️</span> Pain Points
                        </h3>
                        <div className="space-y-2">
                          {intelligenceData.painPoints?.map(
                            (pain: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span className="text-sm text-[var(--foreground)]">
                                  {pain}
                                </span>
                              </div>
                            ),
                          ) || (
                            <p className="text-sm text-[var(--muted)]">
                              No pain points identified
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                          <span>📈</span> Buying Signals
                        </h3>
                        <div className="space-y-2">
                          {intelligenceData.buyingSignals?.map(
                            (signal: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-sm text-[var(--foreground)]">
                                  {signal}
                                </span>
                              </div>
                            ),
                          ) || (
                            <p className="text-sm text-[var(--muted)]">
                              No buying signals detected
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                          <span>🧠</span> Executive Insights
                        </h3>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                          {intelligenceData.executiveInsights ||
                            "No executive insights available"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Overview Tab - Original content */}
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {isCompany ? (
                // Company sections
                <>
                  <div className="space-y-6">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                        Company Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Industry:</span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(record as Company).industry}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">
                            Employees:
                          </span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(record as Company).employeeCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Revenue:</span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(record as Company).revenue}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">
                            Market Cap:
                          </span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(richData as any).marketCap}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                        Technology Stack
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(richData as any).technologies.map((tech: string) => (
                          <span
                            key={tech}
                            className="px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Person sections
                <>
                  <div className="space-y-6">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Title:</span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(record as Person).title}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Company:</span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(record as Person).company}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">
                            Department:
                          </span>
                          <span className="font-medium text-[var(--foreground)]">
                            {(record as Person).department}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                        Professional Background
                      </h3>
                      <div className="space-y-4">
                        {(richData as any).workHistory
                          .slice(0, 2)
                          .map((work: any, index: number) => (
                            <div
                              key={index}
                              className="border-l-4 border-[#2563EB] pl-4"
                            >
                              <div className="font-medium text-[var(--foreground)]">
                                {work.title} at {work.company}
                              </div>
                              <div className="text-sm text-[var(--muted)]">
                                {work.duration}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
