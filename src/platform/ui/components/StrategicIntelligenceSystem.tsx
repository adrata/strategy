/**
 * 🎯 STRATEGIC INTELLIGENCE SYSTEM
 * Inspired by Musk's Recursive Product Strategy & Mehta's Product Strategy Stack
 * Transforms how enterprises think about long-term strategy and execution
 */

import React, { useState } from "react";
import {
  ArrowTrendingUpIcon,
  LightBulbIcon,
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useRustApi } from "@/platform/hooks/useRustApi";

// Recursive Product Strategy Framework (Musk-inspired)
interface RecursiveStrategy {
  id: string;
  universeToTransform: string;
  horizonYears: number;
  motivationLevel:
    | "survival"
    | "security"
    | "belonging"
    | "respect"
    | "self-actualization";

  stages: {
    stage: number;
    description: string;
    timeframe: string;
    wedge: string;
    adjacentMarkets: string[];
    customerValue: string;
    whatNotToDo: string[]; // Non-goals
    successMetrics: string[];
    nextStageEnablers: string[];
  }[];

  currentStage: number;
  visibility: "weeks" | "months" | "years" | "decades";
}

// Product Strategy Stack Framework (Mehta-inspired)
interface ProductStrategyStack {
  id: string;
  lastUpdated: Date;

  // Top of stack - Most durable
  mission: {
    statement: string;
    emotional: string;
    aspirational: string;
    durable: true;
  };

  // Company Strategy - 1-3 year durability
  companyStrategy: {
    logicalPlan: string;
    marketPosition: string;
    uniqueStrengths: string[];
    risks: string[];
    assumptions: string[];
    targetUser: string;
    keyUseCases: string[];
  };

  // Product Strategy - Strategic choices
  productStrategy: {
    structuralDecisions: string[];
    navigationPriorities: string[]; // Max 4-5 for mobile
    wireframes: {
      id: string;
      title: string;
      description: string;
      strategicRationale: string;
    }[];
    crossFunctionalAlignment: string[];
  };

  // Product Roadmap - Next 100 days
  roadmap: {
    next100Days: {
      priority: number;
      initiative: string;
      strategicAlignment: string;
      dependencies: string[];
    }[];
  };

  // Goals - Bottom of stack (comes FROM strategy, not TO strategy)
  goals: {
    type: "NCT"; // Narratives, Commitments, Tasks (not OKRs)
    quarterly: {
      narrative: string; // Multi-sentence strategic context
      commitments: {
        // 3-5 measurable, 100% achievable
        id: string;
        description: string;
        metric: string;
        target: number;
        current: number;
        probability: 100; // Must be deterministic
      }[];
      tasks: {
        // Warm start, most fungible
        id: string;
        description: string;
        owner: string;
        priority: "high" | "medium" | "low";
      }[];
    };
  };

  // Mehta's explicit non-goals
  nonGoals: {
    category: string;
    decisions: string[];
    rationale: string;
    controversialChoices: string[];
  }[];
}

// Maslow/Horizon Framework
interface MotivationHorizon {
  currentLevel:
    | "survival"
    | "security"
    | "belonging"
    | "respect"
    | "self-actualization";
  visibility: "weeks" | "months" | "years" | "decades";
  description: string;
  strategicImplications: string[];
}

export function StrategicIntelligenceSystem() {
  const [activeTab, setActiveTab] = useState<"recursive" | "stack" | "horizon">(
    "recursive",
  );

  // 🚀 RUST INTEGRATION: High-performance intelligence processing
  const { 
    isInitialized: rustInitialized, 
    isLoading: rustLoading, 
    error: rustError,
    processIntelligence,
    generateBuyerGroup 
  } = useRustApi();

  // Adrata's Recursive Strategy (inspired by Tesla's approach)
  const [recursiveStrategy] = useState<RecursiveStrategy>({
    id: "adrata_recursive_2025",
    universeToTransform: "Business Intelligence & Sales Acceleration",
    horizonYears: 50,
    motivationLevel: "self-actualization",
    currentStage: 1,
    visibility: "decades",

    stages: [
      {
        stage: 1,
        description:
          "Create the world's best AI-powered sales intelligence platform",
        timeframe: "2025-2027",
        wedge: "Real-time enrichment with 625x performance advantage",
        adjacentMarkets: ["Pipeline platforms", "Data providers", "Sales tools"],
        customerValue: "Get enriched leads instantly vs. waiting 90 seconds",
        whatNotToDo: [
          "Build another Pipeline clone",
          "Compete on features alone",
          "Ignore mobile",
        ],
        successMetrics: ["$100M ARR", "10,000+ companies", "95% retention"],
        nextStageEnablers: [
          "AI model superiority",
          "Network effects",
          "Data partnerships",
        ],
      },
      {
        stage: 2,
        description:
          "Build the intelligence network that powers all B2B relationships",
        timeframe: "2027-2030",
        wedge: "Network effects from millions of users sharing intelligence",
        adjacentMarkets: [
          "Marketing automation",
          "Customer success",
          "HR systems",
        ],
        customerValue:
          "Access unique intelligence only available through network",
        whatNotToDo: [
          "Become a data broker",
          "Sacrifice privacy",
          "Lose focus on UX",
        ],
        successMetrics: ["$1B ARR", "1M+ users", "Network effects measurable"],
        nextStageEnablers: [
          "Cross-platform adoption",
          "API ecosystem",
          "Enterprise integration",
        ],
      },
      {
        stage: 3,
        description:
          "Transform how all businesses discover and build relationships",
        timeframe: "2030-2035",
        wedge: "AI that predicts and facilitates optimal business connections",
        adjacentMarkets: [
          "Business networking",
          "Partnership platforms",
          "Industry events",
        ],
        customerValue: "Discover hidden opportunities before competitors",
        whatNotToDo: [
          "Replace human judgment",
          "Become too broad",
          "Ignore compliance",
        ],
        successMetrics: [
          "10B+ business connections",
          "Global platform recognition",
        ],
        nextStageEnablers: [
          "AI breakthrough",
          "Global expansion",
          "Regulatory frameworks",
        ],
      },
      {
        stage: 4,
        description:
          "Enable perfect information flow for all business decisions",
        timeframe: "2035-2045",
        wedge: "Real-time business intelligence for every decision maker",
        adjacentMarkets: [
          "Business intelligence",
          "Financial markets",
          "Economic research",
        ],
        customerValue: "Make business decisions with perfect information",
        whatNotToDo: [
          "Control information",
          "Exclude small businesses",
          "Ignore ethics",
        ],
        successMetrics: [
          "Universal business adoption",
          "Economic impact measurable",
        ],
        nextStageEnablers: [
          "AI/human collaboration",
          "Global standards",
          "Trust systems",
        ],
      },
      {
        stage: 5,
        description:
          "Create more efficient and equitable global business ecosystem",
        timeframe: "2045-2075",
        wedge: "AI-orchestrated business ecosystem optimization",
        adjacentMarkets: ["Economic systems", "Global trade", "Social impact"],
        customerValue: "Participate in optimized global business ecosystem",
        whatNotToDo: [
          "Replace human agency",
          "Increase inequality",
          "Ignore sustainability",
        ],
        successMetrics: [
          "Measurable global efficiency gains",
          "Reduced business friction",
        ],
        nextStageEnablers: [
          "Global cooperation",
          "Ethical AI",
          "Sustainable systems",
        ],
      },
    ],
  });

  // Adrata's Product Strategy Stack (inspired by Mehta's framework)
  const [strategyStack] = useState<ProductStrategyStack>({
    id: "adrata_stack_2025",
    lastUpdated: new Date(),

    mission: {
      statement:
        "Every business professional deserves superhuman intelligence capabilities",
      emotional: "Empowering human potential through AI collaboration",
      aspirational: "Eliminate information asymmetry in business forever",
      durable: true,
    },

    companyStrategy: {
      logicalPlan:
        "Build AI-first platform → Create network effects → Expand adjacent markets → Global transformation",
      marketPosition:
        "AI-native sales intelligence leader disrupting legacy Pipeline providers",
      uniqueStrengths: [
        "625x performance",
        "Real-time intelligence",
        "Cross-platform",
        "Network effects",
      ],
      risks: [
        "Competitor AI response",
        "Regulatory changes",
        "Economic downturn",
      ],
      assumptions: [
        "AI adoption accelerates",
        "Privacy regulations stabilize",
        "Remote work continues",
      ],
      targetUser:
        "Growth-focused sales professionals at companies with 50-500 employees",
      keyUseCases: [
        "Lead enrichment",
        "Opportunity intelligence",
        "Team collaboration",
        "Pipeline optimization",
      ],
    },

    productStrategy: {
      structuralDecisions: [
        "Modular app architecture over monolithic CRM",
        "Real-time sync over periodic updates",
        "AI-human collaboration over full automation",
        "Usage-based pricing over per-seat fees",
        "Cross-platform consistency over platform optimization",
      ],
      navigationPriorities: ["Acquire", "Monaco", "Speedrun", "Pipeline"], // Max 4 for mobile
      wireframes: [
        {
          id: "unified_intelligence",
          title: "Unified Intelligence Dashboard",
          description:
            "Single view of all business relationships and opportunities",
          strategicRationale:
            "Reduces cognitive load and increases action speed",
        },
        {
          id: "collaboration_hub",
          title: "Team Collaboration Hub",
          description: "Shared workspace for opportunity development",
          strategicRationale: "Creates network effects and team stickiness",
        },
      ],
      crossFunctionalAlignment: [
        "Engineering: AI-first architecture decisions",
        "Design: Human-AI collaboration patterns",
        "Marketing: Network effects messaging",
        "Sales: Usage-based value demonstration",
      ],
    },

    roadmap: {
      next100Days: [
        {
          priority: 1,
          initiative: "Launch team collaboration features",
          strategicAlignment: "Enable network effects and viral growth",
          dependencies: [
            "Real-time sync",
            "Permission system",
            "UI components",
          ],
        },
        {
          priority: 2,
          initiative: "Optimize AI cost structure",
          strategicAlignment: "Maintain 95% margins while scaling",
          dependencies: [
            "Smart routing",
            "Caching system",
            "Model optimization",
          ],
        },
        {
          priority: 3,
          initiative: "Mobile app feature parity",
          strategicAlignment: "Support anytime/anywhere sales intelligence",
          dependencies: ["Offline sync", "Mobile UI", "Notification system"],
        },
      ],
    },

    goals: {
      type: "NCT",
      quarterly: {
        narrative:
          "Build foundation for viral growth by enabling seamless team collaboration and demonstrating clear ROI through AI-powered intelligence. Focus on user experience that makes switching back to old tools impossible while maintaining cost structure that enables aggressive growth.",
        commitments: [
          {
            id: "team_adoption",
            description: "Increase team adoption rate",
            metric: "Percentage of individual users who bring teammates",
            target: 45,
            current: 23,
            probability: 100,
          },
          {
            id: "intelligence_quality",
            description: "Improve intelligence accuracy",
            metric: "User-validated accuracy score",
            target: 94,
            current: 87,
            probability: 100,
          },
          {
            id: "cost_optimization",
            description: "Maintain margin while scaling",
            metric: "Gross margin percentage",
            target: 95,
            current: 94,
            probability: 100,
          },
        ],
        tasks: [
          {
            id: "collab_ui",
            description: "Build team collaboration UI components",
            owner: "Design",
            priority: "high",
          },
          {
            id: "ai_routing",
            description: "Implement smart AI request routing",
            owner: "Engineering",
            priority: "high",
          },
          {
            id: "mobile_sync",
            description: "Optimize mobile offline sync",
            owner: "Engineering",
            priority: "medium",
          },
        ],
      },
    },

    nonGoals: [
      {
        category: "Product Scope",
        decisions: [
          "We will NOT build a full Pipeline replacement",
          "We will NOT compete on traditional Pipeline features",
          "We will NOT sacrifice intelligence quality for speed",
        ],
        rationale: "Focus on AI-powered intelligence, not feature parity",
        controversialChoices: ["Rejected traditional Pipeline workflow patterns"],
      },
      {
        category: "Business Model",
        decisions: [
          "We will NOT use per-seat pricing",
          "We will NOT monetize data directly",
          "We will NOT compromise user privacy for intelligence",
        ],
        rationale: "Usage-based model aligns costs with value delivered",
        controversialChoices: ["Rejected industry-standard per-seat model"],
      },
    ],
  });

  const [motivationHorizon] = useState<MotivationHorizon>({
    currentLevel: "self-actualization",
    visibility: "decades",
    description:
      "Building technology to fundamentally improve how humans access and use business intelligence",
    strategicImplications: [
      "Long-term thinking enables breakthrough innovations",
      "Mission-driven approach attracts top talent",
      "Patient capital strategy vs quarterly optimization",
      "Focus on global impact over short-term metrics",
    ],
  });

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-[90rem] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Strategic Intelligence System
          </h1>
          <p className="text-gray-600">
            Enterprise strategy powered by Musk&apos;s recursive approach and
            Mehta&apos;s strategy stack
          </p>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4 mb-8">
          {[
            {
              key: "recursive",
              label: "Recursive Strategy",
              icon: ArrowTrendingUpIcon,
            },
            { key: "stack", label: "Strategy Stack", icon: FlagIcon },
            {
              key: "horizon",
              label: "Motivation Horizon",
              icon: LightBulbIcon,
            },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Recursive Strategy View */}
        {activeTab === "recursive" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">
                50-Year Recursive Product Strategy
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Universe to Transform
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {recursiveStrategy.universeToTransform}
                  </p>

                  <h3 className="font-medium text-gray-900 mb-2">
                    Current Stage
                  </h3>
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      Stage {recursiveStrategy.currentStage} of{" "}
                      {recursiveStrategy.stages.length}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Strategic Visibility
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Planning horizon: {recursiveStrategy.visibility}
                  </p>

                  <h3 className="font-medium text-gray-900 mb-2">
                    Motivation Level
                  </h3>
                  <p className="text-gray-600 capitalize">
                    {recursiveStrategy.motivationLevel}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {recursiveStrategy.stages.map((stage, index) => (
                <div
                  key={stage.stage}
                  className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                    stage['stage'] === recursiveStrategy.currentStage
                      ? "border-blue-500 bg-blue-50"
                      : stage.stage < recursiveStrategy.currentStage
                        ? "border-green-500"
                        : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Stage {stage.stage}: {stage.timeframe}
                    </h3>
                    {stage['stage'] === recursiveStrategy['currentStage'] && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        Current
                      </span>
                    )}
                    {stage.stage < recursiveStrategy['currentStage'] && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    )}
                  </div>

                  <p className="text-gray-800 mb-4">{stage.description}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Strategic Wedge
                      </h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {stage.wedge}
                      </p>

                      <h4 className="font-medium text-gray-900 mb-2">
                        Customer Value
                      </h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {stage.customerValue}
                      </p>

                      <h4 className="font-medium text-gray-900 mb-2">
                        Adjacent Markets
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {stage.adjacentMarkets.map((market, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                          >
                            {market}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Explicit Non-Goals
                      </h4>
                      <ul className="space-y-1 mb-3">
                        {stage.whatNotToDo.map((item, i) => (
                          <li
                            key={i}
                            className="text-gray-600 text-sm flex items-start"
                          >
                            <XCircleIcon className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <h4 className="font-medium text-gray-900 mb-2">
                        Success Metrics
                      </h4>
                      <ul className="space-y-1">
                        {stage.successMetrics.map((metric, i) => (
                          <li
                            key={i}
                            className="text-gray-600 text-sm flex items-start"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                            {metric}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy Stack View */}
        {activeTab === "stack" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">
                Product Strategy Stack
              </h2>
              <p className="text-gray-600 mb-6">
                Goals flow FROM strategy, not TO strategy. Built bottom-up for
                execution clarity.
              </p>

              {/* Stack Visualization */}
              <div className="space-y-4">
                {/* Mission - Top of Stack */}
                <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    Mission (Most Durable)
                  </h3>
                  <p className="text-purple-800 font-medium">
                    {strategyStack.mission.statement}
                  </p>
                  <p className="text-purple-700 text-sm mt-1">
                    {strategyStack.mission.emotional}
                  </p>
                </div>

                {/* Company Strategy */}
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Company Strategy (1-3 Years)
                  </h3>
                  <p className="text-blue-800 mb-3">
                    {strategyStack.companyStrategy.logicalPlan}
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        Target User
                      </h4>
                      <p className="text-blue-700 text-sm mb-2">
                        {strategyStack.companyStrategy.targetUser}
                      </p>

                      <h4 className="font-medium text-blue-900 mb-1">
                        Unique Strengths
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        {strategyStack.companyStrategy.uniqueStrengths.map(
                          (strength, i) => (
                            <li key={i}>• {strength}</li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        Key Use Cases
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        {strategyStack.companyStrategy.keyUseCases.map(
                          (useCase, i) => (
                            <li key={i}>• {useCase}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Product Strategy */}
                <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Product Strategy (Structural Decisions)
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">
                        Strategic Choices
                      </h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        {strategyStack.productStrategy.structuralDecisions.map(
                          (decision, i) => (
                            <li key={i}>• {decision}</li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-900 mb-2">
                        Navigation Priorities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {strategyStack.productStrategy.navigationPriorities.map(
                          (priority, i) => (
                            <span
                              key={i}
                              className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm"
                            >
                              {priority}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roadmap */}
                <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Product Roadmap (Next 100 Days)
                  </h3>
                  <div className="space-y-3">
                    {strategyStack.roadmap.next100Days.map((item, i) => (
                      <div key={i} className="bg-white rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {item.initiative}
                          </h4>
                          <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                            Priority {item.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {item.strategicAlignment}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.dependencies.map((dep, j) => (
                            <span
                              key={j}
                              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals - Bottom of Stack */}
                <div className="bg-gradient-to-r from-red-100 to-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Goals - NCTs (Come FROM Strategy)
                  </h3>

                  <div className="mb-4">
                    <h4 className="font-medium text-red-900 mb-2">
                      Quarterly Narrative
                    </h4>
                    <p className="text-red-700 text-sm bg-white rounded p-3">
                      {strategyStack.goals.quarterly.narrative}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">
                        Commitments (100% Achievable)
                      </h4>
                      <div className="space-y-2">
                        {strategyStack.goals.quarterly.commitments.map(
                          (commitment) => (
                            <div
                              key={commitment.id}
                              className="bg-white rounded p-3"
                            >
                              <p className="font-medium text-gray-900 text-sm">
                                {commitment.description}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-gray-600 text-xs">
                                  {commitment.metric}
                                </span>
                                <span className="text-gray-900 font-medium text-sm">
                                  {commitment.current} / {commitment.target}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{
                                    width: `${(commitment.current / commitment.target) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-900 mb-2">
                        Tasks (Most Fungible)
                      </h4>
                      <div className="space-y-2">
                        {strategyStack.goals.quarterly.tasks.map((task) => (
                          <div key={task.id} className="bg-white rounded p-3">
                            <div className="flex items-start justify-between">
                              <p className="text-gray-900 text-sm font-medium">
                                {task.description}
                              </p>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  task['priority'] === "high"
                                    ? "bg-red-200 text-red-800"
                                    : task['priority'] === "medium"
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs mt-1">
                              Owner: {task.owner}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Non-Goals Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Explicit Non-Goals</h3>
              <p className="text-gray-600 mb-4">
                Strategic choices mean saying NO to good options. These are our
                explicit non-goals:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {strategyStack.nonGoals.map((category, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {category.category}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {category.rationale}
                    </p>

                    <ul className="space-y-1 mb-3">
                      {category.decisions.map((decision, j) => (
                        <li
                          key={j}
                          className="text-gray-700 text-sm flex items-start"
                        >
                          <XCircleIcon className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                          {decision}
                        </li>
                      ))}
                    </ul>

                    {category.controversialChoices.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm mb-1">
                          Controversial Choices:
                        </h5>
                        <ul className="space-y-1">
                          {category.controversialChoices.map((choice, j) => (
                            <li key={j} className="text-gray-600 text-xs">
                              • {choice}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Motivation Horizon View */}
        {activeTab === "horizon" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">
                Motivation & Horizon Framework
              </h2>
              <p className="text-gray-600 mb-6">
                Honest self-assessment of motivations and strategic visibility
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Current Motivation Level
                  </h3>
                  <div className="bg-purple-100 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 capitalize">
                      {motivationHorizon.currentLevel}
                    </h4>
                    <p className="text-purple-700 text-sm mt-2">
                      {motivationHorizon.description}
                    </p>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-3 mt-6">
                    Strategic Visibility
                  </h3>
                  <div className="bg-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 capitalize">
                      {motivationHorizon.visibility}
                    </h4>
                    <p className="text-blue-700 text-sm mt-2">
                      Planning and executing with decades-long vision
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Strategic Implications
                  </h3>
                  <div className="space-y-3">
                    {motivationHorizon.strategicImplications.map(
                      (implication, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-700 text-sm">{implication}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Maslow's Hierarchy Visualization */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">
                Entrepreneurial Motivation Hierarchy
              </h3>

              <div className="space-y-3">
                {[
                  {
                    level: "self-actualization",
                    label: "Self-Actualization",
                    description: "Change the world, build generational impact",
                    active: true,
                  },
                  {
                    level: "respect",
                    label: "Respect & Recognition",
                    description: "Industry recognition, peer respect",
                    active: false,
                  },
                  {
                    level: "belonging",
                    label: "Belonging",
                    description: "Team building, community creation",
                    active: false,
                  },
                  {
                    level: "security",
                    label: "Security",
                    description: "Financial security, stable business",
                    active: false,
                  },
                  {
                    level: "survival",
                    label: "Survival",
                    description: "Basic needs, initial funding",
                    active: false,
                  },
                ].map((item, i) => (
                  <div
                    key={item.level}
                    className={`rounded-lg p-4 border-l-4 ${
                      item.active
                        ? "bg-green-50 border-green-500"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className={`font-medium ${item.active ? "text-green-900" : "text-gray-700"}`}
                        >
                          {item.label}
                        </h4>
                        <p
                          className={`text-sm ${item.active ? "text-green-700" : "text-gray-600"}`}
                        >
                          {item.description}
                        </p>
                      </div>
                      {item['active'] && (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
