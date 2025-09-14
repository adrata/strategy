"use client";

import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

export interface PainDataSource {
  source: string;
  type: "external" | "discovery";
  confidence: number; // 0-100
  lastUpdated: string;
  data: string;
}

export interface PainPoint {
  id: string;
  category: "financial" | "operational" | "competitive" | "compliance" | "strategic";
  title: string;
  description: string;
  quantifiedImpact?: number; // Dollar amount
  urgency: "critical" | "high" | "medium" | "low";
  sources: PainDataSource[];
  evidence: string[];
  consequences: string[];
  timeline: string;
}

export interface PainIntelligenceData {
  personId: string;
  personName: string;
  role: string;
  company: string;
  totalPainPoints: number;
  criticalPainPoints: PainPoint[];
  externalDataPercentage: number; // Should be 70-80%
  discoveryDataPercentage: number; // Should be 20-30%
  lastAnalyzed: string;
  confidenceScore: number;
}

interface PainIntelligenceProps {
  painData: PainIntelligenceData;
  showDetailedView?: boolean;
  className?: string;
}

export const PainIntelligence: React.FC<PainIntelligenceProps> = ({
  painData,
  showDetailedView = true,
  className = "",
}) => {
  const [expandedPain, setExpandedPain] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "sources">("overview");

  const getPainCategoryIcon = (category: string) => {
    switch (category) {
      case "financial":
        return <CurrencyDollarIcon className="w-5 h-5 text-red-500" />;
      case "operational":
        return <ChartBarIcon className="w-5 h-5 text-yellow-500" />;
      case "competitive":
        return <ArrowTrendingUpIcon className="w-5 h-5 text-orange-500" />;
      case "compliance":
        return <ShieldExclamationIcon className="w-5 h-5 text-purple-500" />;
      case "strategic":
        return <LightBulbIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPainCategoryColor = (category: string) => {
    switch (category) {
      case "financial":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "operational":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "competitive":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "compliance":
        return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
      case "strategic":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  const totalQuantifiedPain = painData.criticalPainPoints.reduce(
    (sum, pain) => sum + (pain.quantifiedImpact || 0),
    0
  );

  return (
    <div className={`bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            Pain Intelligence
          </h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            Directional intelligence based on {painData.externalDataPercentage}% external sources, {painData.discoveryDataPercentage}% seller discovery
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-600">
            {totalQuantifiedPain > 0 ? formatCurrency(totalQuantifiedPain) : "TBD"}
          </div>
          <div className="text-xs text-[var(--muted)]">Quantified Impact</div>
        </div>
      </div>

      {/* Data Source Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            {painData.externalDataPercentage}%
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">External Sources</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Market research, financial reports, job postings, tech stack analysis
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-green-700 dark:text-green-300">
            {painData.discoveryDataPercentage}%
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">Seller Discovery</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Call notes, meeting insights, stakeholder feedback
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
            {painData.confidenceScore}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">Confidence</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Data validation & cross-verification
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {showDetailedView && (
        <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
          {[
            { id: "overview", label: "Overview" },
            { id: "detailed", label: "Detailed Analysis" },
            { id: "sources", label: "Data Sources" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#9B59B6] text-[#9B59B6]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-4">
        {(activeTab === "overview" || !showDetailedView) && (
          <>
            {/* Critical Pain Points */}
            <div className="space-y-3">
              {painData.criticalPainPoints.map((pain) => (
                <div
                  key={pain.id}
                  className={`border-l-4 rounded-r-lg p-4 ${getPainCategoryColor(pain.category)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPainCategoryIcon(pain.category)}
                        <h4 className="font-semibold text-[var(--foreground)]">
                          {pain.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(pain.urgency)}`}>
                          {pain.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mb-2">
                        {pain.description}
                      </p>
                      
                      {/* Quick Impact & Timeline */}
                      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                        {pain['quantifiedImpact'] && (
                          <span className="flex items-center gap-1">
                            <CurrencyDollarIcon className="w-3 h-3" />
                            {formatCurrency(pain.quantifiedImpact)} impact
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {pain.timeline}
                        </span>
                        <span className="flex items-center gap-1">
                          <InformationCircleIcon className="w-3 h-3" />
                          {pain.sources.length} sources
                        </span>
                      </div>
                    </div>
                    
                    {showDetailedView && (
                      <button
                        onClick={() => setExpandedPain(expandedPain === pain.id ? null : pain.id)}
                        className="ml-4 p-1 hover:bg-[var(--hover-bg)] rounded"
                      >
                        {expandedPain === pain.id ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedPain === pain['id'] && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      {/* Evidence */}
                      {pain.evidence.length > 0 && (
                        <div className="mb-3">
                          <h5 className="font-medium text-[var(--foreground)] mb-2">Evidence:</h5>
                          <ul className="space-y-1">
                            {pain.evidence.map((evidence, index) => (
                              <li key={index} className="text-sm text-[var(--muted)] flex items-start gap-2">
                                <span className="w-1 h-1 bg-[var(--muted)] rounded-full mt-2 flex-shrink-0"></span>
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Consequences */}
                      {pain.consequences.length > 0 && (
                        <div className="mb-3">
                          <h5 className="font-medium text-[var(--foreground)] mb-2">Consequences of Inaction:</h5>
                          <ul className="space-y-1">
                            {pain.consequences.map((consequence, index) => (
                              <li key={index} className="text-sm text-[var(--muted)] flex items-start gap-2">
                                <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                {consequence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Data Sources for this pain */}
                      <div>
                        <h5 className="font-medium text-[var(--foreground)] mb-2">Data Sources:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {pain.sources.map((source, index) => (
                            <div key={index} className="bg-[var(--background)] border border-[var(--border)] rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${
                                  source['type'] === "external" ? "bg-blue-500" : "bg-green-500"
                                }`}></span>
                                <span className="text-xs font-medium">{source.source}</span>
                                <span className="text-xs text-[var(--muted)]">
                                  {source.confidence}% confidence
                                </span>
                              </div>
                              <p className="text-xs text-[var(--muted)]">{source.data}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "detailed" && showDetailedView && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pain Categories Breakdown */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                <h4 className="font-semibold text-[var(--foreground)] mb-3">Pain Categories</h4>
                <div className="space-y-2">
                  {[
                    { category: "financial", count: painData.criticalPainPoints.filter(p => p['category'] === "financial").length },
                    { category: "operational", count: painData.criticalPainPoints.filter(p => p['category'] === "operational").length },
                    { category: "competitive", count: painData.criticalPainPoints.filter(p => p['category'] === "competitive").length },
                    { category: "compliance", count: painData.criticalPainPoints.filter(p => p['category'] === "compliance").length },
                    { category: "strategic", count: painData.criticalPainPoints.filter(p => p['category'] === "strategic").length },
                  ].map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPainCategoryIcon(item.category)}
                        <span className="text-sm capitalize">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgency Distribution */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                <h4 className="font-semibold text-[var(--foreground)] mb-3">Urgency Distribution</h4>
                <div className="space-y-2">
                  {[
                    { urgency: "critical", count: painData.criticalPainPoints.filter(p => p['urgency'] === "critical").length },
                    { urgency: "high", count: painData.criticalPainPoints.filter(p => p['urgency'] === "high").length },
                    { urgency: "medium", count: painData.criticalPainPoints.filter(p => p['urgency'] === "medium").length },
                    { urgency: "low", count: painData.criticalPainPoints.filter(p => p['urgency'] === "low").length },
                  ].map((item) => (
                    <div key={item.urgency} className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(item.urgency)}`}>
                        {item.urgency}
                      </span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Timeline */}
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
              <h4 className="font-semibold text-[var(--foreground)] mb-3">Analysis Timeline</h4>
              <div className="text-sm text-[var(--muted)]">
                <p>Last analyzed: {painData.lastAnalyzed}</p>
                <p>Total pain points identified: {painData.totalPainPoints}</p>
                <p>Critical pain points: {painData.criticalPainPoints.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sources" && showDetailedView && (
          <div className="space-y-4">
            {/* External Sources */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
                External Data Sources ({painData.externalDataPercentage}%)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {painData.criticalPainPoints
                  .flatMap(pain => pain.sources.filter(s => s['type'] === "external"))
                  .map((source, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{source.source}</span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          {source.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">{source.data}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">Updated: {source.lastUpdated}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Discovery Sources */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3">
                Seller Discovery ({painData.discoveryDataPercentage}%)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {painData.criticalPainPoints
                  .flatMap(pain => pain.sources.filter(s => s['type'] === "discovery"))
                  .map((source, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{source.source}</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          {source.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">{source.data}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">Updated: {source.lastUpdated}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Example Pain Data for different roles and companies
export const ExamplePainData: Record<string, PainIntelligenceData> = {
  "michael-chen-adp": {
    personId: "michael-chen-adp",
    personName: "Michael Chen",
    role: "Chief Technology Officer",
    company: "ADP",
    totalPainPoints: 8,
    criticalPainPoints: [
      {
        id: "adp-cloud-transformation",
        category: "strategic",
        title: "Cloud-First Transformation Under Pressure",
        description: "ADP's legacy payroll infrastructure struggles with 24B+ annual transactions while Workday gains market share. Cloud modernization delayed 18 months due to security concerns.",
        quantifiedImpact: 8500000, // $8.5M
        urgency: "critical",
        timeline: "Q1 2025 deadline",
        sources: [
          {
            source: "SEC 10-K Filing Analysis",
            type: "external",
            confidence: 92,
            lastUpdated: "2024-12-15",
            data: "ADP reported $47M in technology modernization costs with cloud migration as top priority. CEO highlighted competitive pressure from cloud-native payroll providers."
          },
          {
            source: "LinkedIn Job Postings Analysis",
            type: "external", 
            confidence: 88,
            lastUpdated: "2024-12-10",
            data: "500+ cloud engineering positions posted in past 6 months, including 47 'Senior Cloud Migration Engineers' and 23 'AWS Solutions Architects' - indicating massive infrastructure shift."
          },
          {
            source: "Executive Advisory Call Notes",
            type: "discovery",
            confidence: 95,
            lastUpdated: "2024-12-12",
            data: "Michael mentioned 'we're 18 months behind on cloud transformation' and 'board is asking tough questions about our Workday response strategy' during partner advisory session."
          }
        ],
        evidence: [
          "ADP stock down 12% since Workday's Q3 earnings beat",
          "Customer win rate decreased from 73% to 61% in cloud deals",
          "Legacy infrastructure costs 40% more to maintain than cloud alternatives",
          "Engineering team velocity 50% slower than cloud-native competitors"
        ],
        consequences: [
          "Continued market share erosion to Workday and newer entrants",
          "Escalating infrastructure costs - currently $47M annually",
          "Developer productivity gap widening vs cloud-native competitors",
          "Board pressure for CEO/CTO changes if transformation doesn't accelerate"
        ]
      },
      {
        id: "adp-security-compliance",
        category: "compliance",
        title: "SOC 2 Type II Audit Pressure with Q1 Deadline",
        description: "ADP faces accelerated SOC 2 Type II audit timeline due to enterprise customer demands, with current vendor assessment processes creating 6-week bottlenecks.",
        quantifiedImpact: 3200000, // $3.2M
        urgency: "critical",
        timeline: "January 31, 2025",
        sources: [
          {
            source: "Gartner Security Research",
            type: "external",
            confidence: 87,
            lastUpdated: "2024-12-08",
            data: "Enterprise payroll providers must achieve SOC 2 Type II certification by Q1 2025 to maintain Fortune 500 customer base. Failure results in average 15% customer churn."
          },
          {
            source: "Compliance Team Status Meeting",
            type: "discovery",
            confidence: 90,
            lastUpdated: "2024-12-14",
            data: "Chief Legal Officer Susan Williams confirmed 'vendor security assessments are our biggest audit bottleneck - taking 6 weeks per vendor when we need 1 week turnaround.'"
          }
        ],
        evidence: [
          "Current vendor assessment cycle: 6 weeks (target: 1 week)",
          "127 enterprise prospects waiting for SOC 2 Type II certification",
          "3 major enterprise customers threatened contract review without certification",
          "Compliance team working 60+ hour weeks to meet deadline"
        ],
        consequences: [
          "Loss of $45M in enterprise deals if certification delayed",
          "Potential customer churn from existing Fortune 500 accounts",
          "Regulatory penalties and audit fees escalation",
          "Competitive disadvantage vs already-certified competitors"
        ]
      },
      {
        id: "adp-development-velocity",
        category: "operational",
        title: "Engineering Productivity Gap vs Competitors",
        description: "ADP's development cycles 40% slower than industry benchmarks, with manual security reviews creating deployment bottlenecks affecting customer deliverables.",
        quantifiedImpact: 2100000, // $2.1M
        urgency: "high",
        timeline: "Ongoing - worsening quarterly",
        sources: [
          {
            source: "DORA Metrics Industry Report",
            type: "external",
            confidence: 91,
            lastUpdated: "2024-12-05",
            data: "Payroll SaaS leaders deploy 4.2x per week vs ADP's 1.1x. Lead time for changes: Industry average 2.4 days, ADP 7.1 days. Security reviews cause 65% of deployment delays."
          },
          {
            source: "Engineering All-Hands Q&A",
            type: "discovery", 
            confidence: 93,
            lastUpdated: "2024-12-11",
            data: "Michael admitted 'our engineers spend more time on security reviews than feature development' and 'we're losing talent to companies with better development workflows.'"
          }
        ],
        evidence: [
          "Deployment frequency: 1.1x/week (industry: 4.2x/week)",
          "Lead time for changes: 7.1 days (industry: 2.4 days)",
          "38% of developers actively job searching (Glassdoor reviews)",
          "Customer feature requests backlog at 18-month average"
        ],
        consequences: [
          "Continued talent loss to faster-moving competitors",
          "Customer satisfaction declining due to slow feature delivery",
          "Revenue impact from delayed product launches",
          "Technical debt accumulation affecting long-term scalability"
        ]
      }
    ],
    externalDataPercentage: 78,
    discoveryDataPercentage: 22,
    lastAnalyzed: "December 15, 2024",
    confidenceScore: 91
  },
  
  "sarah-rodriguez-adp": {
    personId: "sarah-rodriguez-adp",
    personName: "Sarah Rodriguez", 
    role: "VP of Engineering",
    company: "ADP",
    totalPainPoints: 6,
    criticalPainPoints: [
      {
        id: "adp-microservices-migration",
        category: "operational",
        title: "Microservices Architecture Migration Challenges",
        description: "Managing 2,000+ engineers through complex microservices migration while maintaining 99.9% uptime for 24B+ annual transactions across 140 countries.",
        quantifiedImpact: 4200000, // $4.2M
        urgency: "high",
        timeline: "18-month migration timeline",
        sources: [
          {
            source: "Engineering Architecture Review",
            type: "external",
            confidence: 85,
            lastUpdated: "2024-12-10",
            data: "ADP's monolithic architecture processes 24B transactions annually. Microservices migration estimated to improve scalability by 300% and reduce downtime by 40%."
          },
          {
            source: "Team Lead Feedback Session",
            type: "discovery",
            confidence: 92,
            lastUpdated: "2024-12-13",
            data: "Sarah mentioned 'coordinating 2,000 engineers on microservices migration is like conducting an orchestra while the music is playing' during architectural planning session."
          }
        ],
        evidence: [
          "Current monolithic architecture limits horizontal scaling",
          "Development teams blocked by shared database bottlenecks",
          "Deployment coordination requires 40+ engineering teams",
          "International compliance requirements vary by country/region"
        ],
        consequences: [
          "Continued scalability limitations affecting growth",
          "Engineering productivity bottlenecks increasing",
          "Risk of system failures during high-transaction periods",
          "Competitive disadvantage vs cloud-native architecture"
        ]
      },
      {
        id: "adp-team-scaling",
        category: "strategic",
        title: "Engineering Team Scaling for Global Growth",
        description: "Scaling engineering organization to support international expansion while maintaining code quality and security standards across distributed teams.",
        quantifiedImpact: 1800000, // $1.8M
        urgency: "medium",
        timeline: "Next 12 months",
        sources: [
          {
            source: "Global Expansion Strategy Document",
            type: "external",
            confidence: 88,
            lastUpdated: "2024-12-08",
            data: "ADP plans 40% international revenue growth requiring 500+ additional engineers across EMEA and APAC regions. Current hiring velocity insufficient for growth targets."
          },
          {
            source: "Engineering Leadership Sync",
            type: "discovery",
            confidence: 89,
            lastUpdated: "2024-12-12",
            data: "Sarah expressed concerns about 'maintaining our engineering culture and standards while scaling globally' and 'ensuring security compliance across all regions.'"
          }
        ],
        evidence: [
          "Current hiring velocity: 15 engineers/month (target: 35/month)",
          "International compliance requirements increasing complexity",
          "Remote team coordination challenges across time zones",
          "Code review and security standards vary by location"
        ],
        consequences: [
          "Delayed international expansion affecting revenue targets",
          "Quality and security inconsistencies across regions",
          "Engineering culture dilution with rapid scaling",
          "Increased technical debt from rushed implementations"
        ]
      }
    ],
    externalDataPercentage: 74,
    discoveryDataPercentage: 26,
    lastAnalyzed: "December 14, 2024", 
    confidenceScore: 87
  },

  "james-wilson-adp": {
    personId: "james-wilson-adp",
    personName: "James Wilson",
    role: "Senior Software Engineer",
    company: "ADP",
    totalPainPoints: 4,
    criticalPainPoints: [
      {
        id: "adp-security-vulnerabilities",
        category: "operational",
        title: "Security Vulnerability Management Bottleneck",
        description: "40% of engineering team struggles with security vulnerabilities in development pipeline, blocking promotion opportunities and affecting development velocity.",
        quantifiedImpact: 850000, // $850K
        urgency: "high",
        timeline: "Immediate - affecting Q4 reviews",
        sources: [
          {
            source: "Security Scan Reports",
            type: "external",
            confidence: 93,
            lastUpdated: "2024-12-12",
            data: "Automated security scans show 847 high/critical vulnerabilities in main codebase. Average resolution time: 21 days (industry standard: 7 days). 40% of engineers have critical findings blocking deployments."
          },
          {
            source: "1:1 Performance Review",
            type: "discovery",
            confidence: 96,
            lastUpdated: "2024-12-14",
            data: "James mentioned 'security issues are preventing me from getting promoted to Principal - I need to show security leadership but current tools make it impossible' during performance discussion."
          }
        ],
        evidence: [
          "847 high/critical vulnerabilities currently open",
          "Average resolution time: 21 days (target: 7 days)",
          "40% of engineers blocked by security findings",
          "Security training completion rate only 62%"
        ],
        consequences: [
          "Engineer promotion delays affecting retention",
          "Increased security risk from unresolved vulnerabilities", 
          "Development velocity reduction from security friction",
          "Potential security incidents affecting business operations"
        ]
      },
      {
        id: "adp-infrastructure-costs",
        category: "financial", 
        title: "AWS Infrastructure Cost Overruns",
        description: "Q4 payroll peak demands require 2.5x infrastructure scaling, but AWS costs exceeded budget by 30%, affecting team budget allocation and potential promotion case.",
        quantifiedImpact: 920000, // $920K
        urgency: "high",
        timeline: "Q4 peak season planning",
        sources: [
          {
            source: "AWS Cost Analysis Report",
            type: "external",
            confidence: 94,
            lastUpdated: "2024-12-11", 
            data: "Q4 infrastructure costs projected at $3.2M vs $2.4M budget. Peak payroll processing requires 2.5x compute capacity for 6-week period. Auto-scaling optimization could reduce costs by 35%."
          },
          {
            source: "Team Budget Planning Meeting",
            type: "discovery",
            confidence: 91,
            lastUpdated: "2024-12-13",
            data: "James noted 'if I can optimize our Q4 infrastructure costs, it would be a strong case for my director-level promotion' during team budget review."
          }
        ],
        evidence: [
          "Q4 infrastructure budget overrun: 30% ($800K excess)",
          "Peak payroll processing requires 2.5x scaling", 
          "Current auto-scaling not optimized for payroll patterns",
          "Infrastructure costs growing faster than transaction volume"
        ],
        consequences: [
          "Budget cuts affecting other engineering initiatives",
          "Pressure to reduce infrastructure quality during peak periods",
          "Career advancement blocked by cost management concerns",
          "Competitive disadvantage from higher operational costs"
        ]
      }
    ],
    externalDataPercentage: 76,
    discoveryDataPercentage: 24,
    lastAnalyzed: "December 13, 2024",
    confidenceScore: 89
  },

  "steve-ferro-datacorp": {
    personId: "steve-ferro-datacorp",
    personName: "Steve Ferro",
    role: "VP of Sales Operations",
    company: "DataCorp Solutions",
    totalPainPoints: 5,
    criticalPainPoints: [
      {
        id: "datacorp-sales-velocity",
        category: "operational",
        title: "Sales Operations Inefficiencies Reducing Deal Velocity",
        description: "Manual CRM processes and fragmented sales tools causing 15% reduction in deal velocity while competitors accelerate customer acquisition.",
        quantifiedImpact: 1200000, // $1.2M
        urgency: "high",
        timeline: "Q4 2024 performance review",
        sources: [
          {
            source: "SalesForce Performance Analytics",
            type: "external",
            confidence: 89,
            lastUpdated: "2024-12-14",
            data: "DataCorp's sales cycle length increased 15% compared to industry benchmarks. Average deal size decreased 8% while competitors show growth."
          },
          {
            source: "Industry Conference Discussion",
            type: "discovery",
            confidence: 94,
            lastUpdated: "2024-12-15",
            data: "Steve mentioned 'our sales ops are killing our velocity - deals that should close in 30 days are taking 45' during conference networking session."
          }
        ],
        evidence: [
          "Sales cycle extended from 30 to 45 days average",
          "Deal velocity down 15% year-over-year",
          "Sales team productivity metrics declining",
          "CRM data shows process bottlenecks in qualification stage"
        ],
        consequences: [
          "Continued revenue miss against targets",
          "Sales team frustration and potential turnover",
          "Competitive disadvantage in fast-moving deals",
          "Executive pressure on sales operations leadership"
        ]
      }
    ],
    externalDataPercentage: 78,
    discoveryDataPercentage: 22,
    lastAnalyzed: "December 15, 2024",
    confidenceScore: 91
  },

  "susan-smith-datacorp": {
    personId: "susan-smith-datacorp",
    personName: "Susan Smith",
    role: "Director of IT Security",
    company: "DataCorp Solutions",
    totalPainPoints: 4,
    criticalPainPoints: [
      {
        id: "datacorp-quantum-security",
        category: "compliance",
        title: "Legacy Security Infrastructure Vulnerable to Quantum Threats",
        description: "Current security systems unprepared for quantum computing threats with $2M+ budget authority for infrastructure upgrades in next 18 months.",
        quantifiedImpact: 2300000, // $2.3M
        urgency: "critical",
        timeline: "18-month quantum readiness deadline",
        sources: [
          {
            source: "NIST Quantum Security Framework",
            type: "external",
            confidence: 91,
            lastUpdated: "2024-12-10",
            data: "Organizations must implement quantum-resistant cryptography by 2026. DataCorp's current infrastructure uses RSA-2048 encryption vulnerable to quantum attacks."
          },
          {
            source: "IT Security Budget Planning Meeting",
            type: "discovery",
            confidence: 87,
            lastUpdated: "2024-12-13",
            data: "Susan confirmed $2M+ budget approved for security infrastructure modernization with quantum-resistant focus for 2025 implementation."
          }
        ],
        evidence: [
          "Current RSA-2048 encryption vulnerable to quantum computing",
          "No quantum-resistant algorithms implemented",
          "$2M+ budget approved for security modernization",
          "Regulatory compliance requirements increasing"
        ],
        consequences: [
          "Data breach risk from quantum-capable attackers",
          "Regulatory non-compliance penalties",
          "Customer trust and reputation damage",
          "Competitive disadvantage in security-conscious deals"
        ]
      }
    ],
    externalDataPercentage: 82,
    discoveryDataPercentage: 18,
    lastAnalyzed: "December 14, 2024",
    confidenceScore: 89
  },

  "jennifer-martinez-techflow": {
    personId: "jennifer-martinez-techflow",
    personName: "Jennifer Martinez",
    role: "Chief Revenue Officer",
    company: "TechFlow Dynamics",
    totalPainPoints: 6,
    criticalPainPoints: [
      {
        id: "techflow-revenue-growth",
        category: "financial",
        title: "Revenue Growth Plateau Threatening IPO Timeline",
        description: "Quarterly revenue growth stagnated at 12% while IPO requirements demand 25%+ growth with board pressure mounting for Q2 2025 filing.",
        quantifiedImpact: 15000000, // $15M
        urgency: "critical", 
        timeline: "Q2 2025 IPO deadline",
        sources: [
          {
            source: "SEC IPO Filing Analysis",
            type: "external",
            confidence: 94,
            lastUpdated: "2024-12-12",
            data: "TechFlow's S-1 filing shows 12% quarterly growth vs industry requirement of 25% for successful IPO pricing. Revenue run rate must increase $50M annually."
          },
          {
            source: "Board Meeting Minutes",
            type: "discovery",
            confidence: 88,
            lastUpdated: "2024-12-14",
            data: "Board expressed concerns about revenue growth trajectory. Jennifer noted 'we need to triple our growth rate or delay IPO by 12 months' in strategy session."
          }
        ],
        evidence: [
          "Current quarterly growth: 12% (target: 25%)",
          "IPO filing delayed pending revenue acceleration", 
          "Board pressure for immediate growth initiatives",
          "Competitive growth rates significantly higher"
        ],
        consequences: [
          "IPO delay costing $50M+ in market timing",
          "Investor confidence erosion",
          "Executive team credibility at stake",
          "Talent retention challenges without equity event"
        ]
      },
      {
        id: "techflow-customer-acquisition",
        category: "strategic",
        title: "Customer Acquisition Cost Escalation",
        description: "CAC increased 40% while customer lifetime value remained flat, creating unsustainable unit economics threatening long-term profitability.",
        quantifiedImpact: 3400000, // $3.4M
        urgency: "high",
        timeline: "Immediate optimization needed",
        sources: [
          {
            source: "Customer Analytics Platform",
            type: "external",
            confidence: 92,
            lastUpdated: "2024-12-11",
            data: "CAC increased from $2,400 to $3,360 per customer while LTV remained at $12,000. Unit economics ratio declined from 5:1 to 3.6:1."
          },
          {
            source: "Revenue Operations Review",
            type: "discovery",
            confidence: 90,
            lastUpdated: "2024-12-13",
            data: "Jennifer highlighted 'our acquisition costs are eating into margins - we need better targeting and conversion optimization' during ops review."
          }
        ],
        evidence: [
          "CAC increased 40% from $2,400 to $3,360",
          "LTV/CAC ratio declined from 5:1 to 3.6:1",
          "Marketing efficiency metrics trending negative",
          "Customer acquisition forecasting at risk"
        ],
        consequences: [
          "Profitability margin compression",
          "Investor concern about scalability",
          "Marketing budget allocation challenges",
          "Growth strategy sustainability questioned"
        ]
      }
    ],
    externalDataPercentage: 79,
    discoveryDataPercentage: 21,
    lastAnalyzed: "December 15, 2024",
    confidenceScore: 92
  },

  "david-kim-innovatesoft": {
    personId: "david-kim-innovatesoft", 
    personName: "David Kim",
    role: "VP of Product Engineering",
    company: "InnovateSoft",
    totalPainPoints: 5,
    criticalPainPoints: [
      {
        id: "innovatesoft-development-bottlenecks",
        category: "operational",
        title: "Development Pipeline Bottlenecks Affecting Product Roadmap",
        description: "Engineering team capacity constraints and technical debt causing 30% delay in product feature delivery with customer churn increasing.",
        quantifiedImpact: 2800000, // $2.8M
        urgency: "high",
        timeline: "Q1 2025 roadmap at risk",
        sources: [
          {
            source: "Engineering Metrics Dashboard",
            type: "external",
            confidence: 88,
            lastUpdated: "2024-12-09",
            data: "Story points velocity decreased 30% over 6 months. Technical debt ratio increased to 40% of development time. Feature delivery success rate at 65%."
          },
          {
            source: "Product Planning Session",
            type: "discovery", 
            confidence: 91,
            lastUpdated: "2024-12-14",
            data: "David expressed frustration: 'we're spending more time fixing old code than building new features - customers are starting to notice delays.'"
          }
        ],
        evidence: [
          "Feature delivery delayed 30% on average",
          "Technical debt consuming 40% of development time",
          "Engineering velocity metrics declining",
          "Customer feature requests backlog growing"
        ],
        consequences: [
          "Customer churn from unmet feature expectations",
          "Competitive disadvantage in product innovation",
          "Engineering team morale and retention issues",
          "Revenue impact from delayed product launches"
        ]
      },
      {
        id: "innovatesoft-talent-retention",
        category: "strategic",
        title: "Senior Engineering Talent Retention Crisis",
        description: "Lost 3 senior engineers to competitors in Q4, with remaining team at 85% capacity and critical knowledge gaps in core platform areas.",
        quantifiedImpact: 1600000, // $1.6M
        urgency: "critical",
        timeline: "Immediate hiring and retention needed",
        sources: [
          {
            source: "HR Analytics and Industry Reports",
            type: "external",
            confidence: 87,
            lastUpdated: "2024-12-08",
            data: "Tech industry turnover at 15% annually. Senior engineers command 25% salary premiums. Knowledge transfer typically takes 6+ months for complex systems."
          },
          {
            source: "Engineering Leadership Meeting",
            type: "discovery",
            confidence: 93,
            lastUpdated: "2024-12-12",
            data: "David warned: 'if we lose one more senior engineer, our platform stability is at risk - we need better tools and processes to retain talent.'"
          }
        ],
        evidence: [
          "3 senior engineers departed in Q4",
          "Team operating at 85% capacity", 
          "Critical knowledge gaps in platform areas",
          "Increased hiring competition and salary expectations"
        ],
        consequences: [
          "Platform stability and reliability risks",
          "Knowledge transfer delays for new hires",
          "Increased recruiting and training costs",
          "Project timeline delays from capacity constraints"
        ]
      }
    ],
    externalDataPercentage: 76,
    discoveryDataPercentage: 24,
    lastAnalyzed: "December 13, 2024",
    confidenceScore: 88
  }
}; 