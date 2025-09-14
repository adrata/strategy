"use client";

import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import {
  DirectionalIntelligence,
  PersonalityAssessment,
} from "@/platform/services/intelligenceOrchestrator";

interface DirectionalIntelligenceProps {
  insights: DirectionalIntelligence[];
  personalityAssessments: Record<string, PersonalityAssessment>;
  companyName: string;
}

export function DirectionalIntelligenceComponent({
  insights,
  personalityAssessments,
  companyName,
}: DirectionalIntelligenceProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [expandedPersonality, setExpandedPersonality] = useState<string | null>(
    null,
  );

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case "high":
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
      case "medium":
        return <LightBulbIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "high":
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/20";
      case "medium":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getPersonalityColor = (trait: string) => {
    switch (trait) {
      case "Direct":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "Chatty":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "Rule-Follower":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "Friendly":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    if (confidence >= 0.4) return "Low Confidence";
    return "Very Low Confidence";
  };

  if (!insights || insights['length'] === 0) {
    return (
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          🧠 Directional Intelligence
        </h3>
        <p className="text-[var(--muted)]">
          Run the data pipeline to generate unique directional intelligence for{" "}
          {companyName}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Directional Intelligence Section */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            🧠 Directional Intelligence
          </h3>
          <span className="text-sm text-[var(--muted)]">
            {insights.length} unique insights
          </span>
        </div>

        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getPriorityIcon(insight.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                        {insight.category.replace("-", " ")}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--background)] border border-[var(--border)]">
                        {insight.priority} priority
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {insight.uniquenessScore}% unique
                      </span>
                    </div>

                    <p className="text-[var(--foreground)] font-medium mb-2">
                      {insight.insight}
                    </p>

                    {expandedInsight === `${index}` && (
                      <div className="mt-4 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                        <h4 className="font-semibold text-[var(--foreground)] mb-2">
                          🔍 Reasoning & Sources
                        </h4>
                        <p className="text-[var(--muted)] mb-3">
                          {insight.reasoning}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {insight.sources.map((source, sourceIndex) => (
                            <span
                              key={sourceIndex}
                              className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              📊 {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedInsight(
                      expandedInsight === `${index}` ? null : `${index}`,
                    )
                  }
                  className="ml-2 p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
                >
                  {expandedInsight === `${index}` ? (
                    <ChevronUpIcon className="w-4 h-4 text-[var(--muted)]" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-[var(--muted)]" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personality Assessments Section */}
      {Object.keys(personalityAssessments).length > 0 && (
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              👤 Personality Intelligence
            </h3>
            <span className="text-sm text-[var(--muted)]">
              {Object.keys(personalityAssessments).length} people analyzed
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(personalityAssessments).map(
              ([personId, assessment]) => (
                <div
                  key={personId}
                  className="border border-[var(--border)] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-[var(--foreground)]">
                          Person {personId.slice(-3)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
                          {getConfidenceText(assessment.confidenceScore)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {assessment.primaryTraits.map((trait, traitIndex) => (
                          <span
                            key={traitIndex}
                            className={`text-xs px-3 py-1 rounded-full font-medium ${getPersonalityColor(trait.trait)}`}
                          >
                            {trait.level} {trait.trait}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-[var(--muted)] mb-2">
                        {assessment.summary}
                      </p>

                      {expandedPersonality === personId && (
                        <div className="mt-4 space-y-3">
                          {assessment.primaryTraits.map((trait, traitIndex) => (
                            <div
                              key={traitIndex}
                              className="p-3 bg-[var(--hover-bg)] rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-[var(--foreground)]">
                                  {trait.level} {trait.trait}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  {Math.round(trait.confidence * 100)}%
                                  confidence
                                </span>
                              </div>
                              <p className="text-sm text-[var(--muted)] mb-2">
                                {trait.reasoning}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {trait.sources.map((source, sourceIndex) => (
                                  <span
                                    key={sourceIndex}
                                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  >
                                    {source}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setExpandedPersonality(
                          expandedPersonality === personId ? null : personId,
                        )
                      }
                      className="ml-2 p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
                    >
                      {expandedPersonality === personId ? (
                        <ChevronUpIcon className="w-4 h-4 text-[var(--muted)]" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-[var(--muted)]" />
                      )}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
