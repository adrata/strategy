"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";

interface OpportunityProps {
  opportunity: {
    id: string;
    name: string;
    accountName: string;
    value: number;
    stage: string;
    probability: number;
    closeDate: string;
    pacing: string;
    type: string;
    source: string;
    owner: string;
    nextSteps: string;
    lastActivity: string;
    businessCase: string;
    notes: string;
    buyerGroup: {
      groupSentiment: string;
      stakeholders: Array<{
        name: string;
        title: string;
        department: string;
        isDecisionMaker: boolean;
        sentiment: string;
        influenceLevel: number;
        engagementLevel: number;
        notes: string;
      }>;
    };
    painPositioning: Array<{
      painPoint: string;
      impactLevel: number;
      ourSolution: string;
      solutionFit: number;
      evidence: string;
    }>;
    competitorAnalysis: Array<{
      competitorName: string;
      threatLevel: string;
      theirAdvantages: string[];
      ourAdvantages: string[];
      battleCard: {
        strategy: string;
        trapQuestions: string[];
        winStories: string[];
      };
    }>;
    landmines: Array<{
      category: string;
      severity: string;
      status: string;
      description: string;
      impact: string;
      mitigationPlan: string;
      owner: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export function EnhancedOpportunityView({ opportunity }: OpportunityProps) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "buyer-group"
    | "pain"
    | "competitive"
    | "landmines"
    | "activity"
  >("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "buyer-group", label: "Buyer Group" },
    { id: "pain", label: "Pain & Positioning" },
    { id: "competitive", label: "Competitive" },
    { id: "landmines", label: "Landmines" },
    { id: "activity", label: "Activity" },
  ];

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "discovery":
        return "bg-gray-200 text-gray-800";
      case "qualification":
        return "bg-gray-300 text-gray-800";
      case "proposal":
        return "bg-gray-400 text-gray-800";
      case "negotiation":
        return "bg-gray-500 text-white";
      case "closed-won":
        return "bg-gray-800 text-white";
      case "closed-lost":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPacingColor = (pacing: string) => {
    switch (pacing) {
      case "ahead":
        return "bg-gray-800 text-white";
      case "on-pace":
        return "bg-gray-500 text-white";
      case "behind":
        return "bg-gray-300 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "champion":
        return "bg-gray-800 text-white";
      case "supportive":
        return "bg-gray-600 text-white";
      case "neutral":
        return "bg-gray-400 text-gray-800";
      case "skeptical":
        return "bg-gray-300 text-gray-800";
      case "blocker":
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLandmineColor = (category: string) => {
    switch (category) {
      case "people":
        return "bg-gray-600 text-white";
      case "value":
        return "bg-gray-700 text-white";
      case "budget":
        return "bg-gray-400 text-gray-800";
      case "timing":
        return "bg-gray-500 text-white";
      case "company":
        return "bg-gray-300 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-6xl mx-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {opportunity.name}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-lg text-gray-600">
                {opportunity.accountName}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(opportunity.stage)}`}
              >
                {opportunity.stage.toUpperCase()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPacingColor(opportunity.pacing)}`}
              >
                {opportunity['pacing'] === "on-pace"
                  ? "ON PACE"
                  : opportunity.pacing.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-6 mt-3">
              <div>
                <span className="text-sm text-gray-500">Value:</span>
                <span className="ml-2 text-xl font-bold text-green-600">
                  ${opportunity.value.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Probability:</span>
                <span className="ml-2 text-lg font-semibold">
                  {opportunity.probability}%
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Close Date:</span>
                <span className="ml-2 text-gray-900">
                  {opportunity.closeDate}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Owner</div>
            <div className="font-medium text-gray-900">{opportunity.owner}</div>
            <div className="text-sm text-gray-500 mt-2">Created</div>
            <div className="text-gray-900">{opportunity.createdAt}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {opportunity.buyerGroup.stakeholders.length}
            </div>
            <div className="text-sm text-gray-600">Stakeholders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {
                opportunity.buyerGroup.stakeholders.filter(
                  (s: any) =>
                    s['sentiment'] === "champion" || s['sentiment'] === "supportive",
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Supporters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {opportunity.landmines.length}
            </div>
            <div className="text-sm text-gray-600">Landmines</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {opportunity.competitorAnalysis.length}
            </div>
            <div className="text-sm text-gray-600">Competitors</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-gray-400 text-gray-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6 min-h-[600px]">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Opportunity Details
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <p className="text-gray-900">{opportunity.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <p className="text-gray-900">{opportunity.source}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Steps
                    </label>
                    <p className="text-gray-900">{opportunity.nextSteps}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Activity
                    </label>
                    <p className="text-gray-900">{opportunity.lastActivity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Case
                    </label>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-blue-900 leading-relaxed">
                        {opportunity.businessCase}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {opportunity.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "buyer-group" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Buyer Group Analysis
              </h3>
              <div className="text-sm text-gray-500">
                Group Sentiment:{" "}
                <span className="font-medium text-gray-900">
                  {opportunity.buyerGroup.groupSentiment}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {opportunity.buyerGroup.stakeholders.map(
                (stakeholder: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">
                            {stakeholder.name}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(stakeholder.sentiment)}`}
                          >
                            {stakeholder.sentiment.toUpperCase()}
                          </span>
                          {stakeholder['isDecisionMaker'] && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              DECISION MAKER
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">
                          {stakeholder.title} • {stakeholder.department}
                        </p>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              INFLUENCE LEVEL
                            </label>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${stakeholder.influenceLevel * 20}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {stakeholder.influenceLevel}/5
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              ENGAGEMENT LEVEL
                            </label>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${stakeholder.engagementLevel * 20}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {stakeholder.engagementLevel}/5
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            NOTES
                          </label>
                          <p className="text-sm text-gray-700">
                            {stakeholder.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {activeTab === "pain" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Pain Points & Positioning
            </h3>
            <div className="space-y-6">
              {opportunity.painPositioning.map((pain: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Pain Point
                      </h4>
                      <p className="text-gray-700 mb-4">{pain.painPoint}</p>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          IMPACT LEVEL
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{
                                width: `${(pain.impactLevel / 10) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {pain.impactLevel}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Our Solution
                      </h4>
                      <p className="text-gray-700 mb-4">{pain.ourSolution}</p>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          SOLUTION FIT
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${(pain.solutionFit / 10) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {pain.solutionFit}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      EVIDENCE/METRICS
                    </label>
                    <p className="text-sm text-gray-700">{pain.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "competitive" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Competitive Analysis
            </h3>
            <div className="space-y-6">
              {opportunity.competitorAnalysis.map(
                (competitor: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {competitor.competitorName}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          competitor['threatLevel'] === "high"
                            ? "bg-red-100 text-red-800"
                            : competitor['threatLevel'] === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {competitor.threatLevel.toUpperCase()} THREAT
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Their Advantages
                        </h5>
                        <ul className="space-y-1">
                          {competitor.theirAdvantages.map(
                            (advantage: any, idx: number) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-700 flex items-start"
                              >
                                <span className="text-red-500 mr-2">•</span>
                                {advantage}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Our Advantages
                        </h5>
                        <ul className="space-y-1">
                          {competitor.ourAdvantages.map(
                            (advantage: any, idx: number) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-700 flex items-start"
                              >
                                <span className="text-green-500 mr-2">•</span>
                                {advantage}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Battle Card Strategy
                        </h5>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-blue-900 text-sm leading-relaxed">
                            {competitor.battleCard.strategy}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">
                            Trap Questions
                          </h6>
                          <ul className="space-y-1">
                            {competitor.battleCard.trapQuestions.map(
                              (question: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  <span className="font-medium text-orange-600">
                                    Q:
                                  </span>{" "}
                                  {question}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">
                            Win Stories
                          </h6>
                          <ul className="space-y-1">
                            {competitor.battleCard.winStories.map(
                              (story: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  <span className="font-medium text-green-600">
                                    ✓
                                  </span>{" "}
                                  {story}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {activeTab === "landmines" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Risk Management & Landmines
              </h3>
              <div className="text-sm text-gray-500">
                Total Risks:{" "}
                <span className="font-medium text-red-600">
                  {opportunity.landmines.length}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {opportunity.landmines.map((landmine: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLandmineColor(landmine.category)}`}
                      >
                        {landmine.category.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          landmine['severity'] === "high"
                            ? "bg-red-100 text-red-800"
                            : landmine['severity'] === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {landmine.severity.toUpperCase()}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        landmine['status'] === "open"
                          ? "bg-red-100 text-red-800"
                          : landmine['status'] === "mitigating"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {landmine.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">
                    {landmine.description}
                  </h4>

                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        IMPACT
                      </label>
                      <p className="text-sm text-gray-700">{landmine.impact}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        MITIGATION PLAN
                      </label>
                      <p className="text-sm text-gray-700">
                        {landmine.mitigationPlan}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      OWNER
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {landmine.owner}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Activity Timeline
            </h3>
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📈</div>
              <p>Activity timeline will be displayed here</p>
              <p className="text-sm mt-2">
                Email tracking, meeting notes, and deal progression
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
