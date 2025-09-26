"use client";

import React, { useState, useEffect } from "react";
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
import { OpenAIService } from "@/platform/ai/services/openaiService";

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
  const [aiDescriptions, setAiDescriptions] = useState<Record<string, string>>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState<Set<string>>(new Set());
  const openaiService = new OpenAIService();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
      case "high":
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
      case "medium":
        return <LightBulbIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    // Neutral colors for all priorities
    return "border-l-gray-400 bg-gray-50 dark:bg-gray-900/20";
  };

  const getPersonalityColor = (trait: string) => {
    // Neutral colors for all personality traits
    return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    if (confidence >= 0.4) return "Low Confidence";
    return "Very Low Confidence";
  };

  // Generate AI description for an insight
  const generateAIDescription = async (insight: DirectionalIntelligence, index: number) => {
    const insightKey = `${index}`;
    
    // Don't regenerate if already exists or is loading
    if (aiDescriptions[insightKey] || loadingDescriptions.has(insightKey)) {
      return;
    }

    setLoadingDescriptions(prev => new Set(prev).add(insightKey));

    try {
      const prompt = `Generate a concise 1-3 sentence AI description for this business insight about ${companyName}:

Insight: "${insight.insight}"
Category: ${insight.category}
Priority: ${insight.priority}
Confidence: ${Math.round(insight.confidence * 100)}%

Provide a professional, actionable description that explains what this insight means for the business and why it matters. Keep it concise and business-focused.`;

      const description = await openaiService.generateContent(prompt, {
        temperature: 0.7,
        maxTokens: 150,
        optimizeForCost: true
      });

      setAiDescriptions(prev => ({
        ...prev,
        [insightKey]: description
      }));
    } catch (error) {
      console.error('Failed to generate AI description:', error);
      setAiDescriptions(prev => ({
        ...prev,
        [insightKey]: "AI description unavailable"
      }));
    } finally {
      setLoadingDescriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(insightKey);
        return newSet;
      });
    }
  };

  // Generate descriptions for all insights on component mount
  useEffect(() => {
    insights.forEach((insight, index) => {
      generateAIDescription(insight, index);
    });
  }, [insights, companyName]);

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
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
                        {insight.uniquenessScore}% unique
                      </span>
                    </div>

                    <p className="text-[var(--foreground)] font-medium mb-2">
                      {insight.insight}
                    </p>

                    {/* AI Description */}
                    <div className="mt-3 p-3 bg-[var(--hover-bg)] rounded-lg border border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-[var(--muted)]">🤖 AI Analysis</span>
                        {loadingDescriptions.has(`${index}`) && (
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        )}
                      </div>
                      {aiDescriptions[`${index}`] ? (
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                          {aiDescriptions[`${index}`]}
                        </p>
                      ) : loadingDescriptions.has(`${index}`) ? (
                        <p className="text-sm text-[var(--muted)] italic">
                          Generating AI analysis...
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--muted)] italic">
                          AI analysis unavailable
                        </p>
                      )}
                    </div>

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
                              className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
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
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
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
                                    className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
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
