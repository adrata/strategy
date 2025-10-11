import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  LightBulbIcon,
  BoltIcon,
  EyeIcon,
  RocketLaunchIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  SparklesIcon as SparklesIconSolid,
  LightBulbIcon as LightBulbIconSolid,
  BoltIcon as BoltIconSolid,
  EyeIcon as EyeIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";

interface AdrataMode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
  personality: string;
  capability: string;
  color: string;
  gradient: string;
  examples: string[];
}

interface AdrataIntelligenceProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  className?: string;
}

const ADRATA_MODES: AdrataMode[] = [
  {
    id: "observe",
    name: "Observe",
    description: "Adrata watches and learns",
    icon: EyeIcon,
    iconSolid: EyeIconSolid,
    personality: "Quietly analytical",
    capability: "Adrata observes your work and suggests improvements",
    color: "text-blue-500",
    gradient: "from-blue-400 to-blue-600",
    examples: [
      "Notices patterns in successful deals",
      "Suggests better contact timing",
      "Identifies promising companies",
    ],
  },
  {
    id: "assist",
    name: "Assist",
    description: "Adrata actively helps you win",
    icon: LightBulbIcon,
    iconSolid: LightBulbIconSolid,
    personality: "Thoughtful collaborator",
    capability: "Adrata anticipates your needs and offers solutions",
    color: "text-amber-500",
    gradient: "from-amber-400 to-orange-500",
    examples: [
      "Pre-writes personalized outreach",
      "Researches prospects automatically",
      "Prepares call talking points",
    ],
  },
  {
    id: "accelerate",
    name: "Accelerate",
    description: "Adrata takes action for you",
    icon: BoltIcon,
    iconSolid: BoltIconSolid,
    personality: "Proactive executor",
    capability: "Adrata handles routine tasks and accelerates your pipeline",
    color: "text-purple-500",
    gradient: "from-purple-400 to-purple-600",
    examples: [
      "Automatically enriches new leads",
      "Schedules follow-up sequences",
      "Updates pipeline stages",
    ],
  },
  {
    id: "amplify",
    name: "Amplify",
    description: "Adrata multiplies your impact",
    icon: RocketLaunchIcon,
    iconSolid: RocketLaunchIconSolid,
    personality: "Strategic multiplier",
    capability: "Adrata orchestrates complex sales processes at scale",
    color: "text-emerald-500",
    gradient: "from-emerald-400 to-emerald-600",
    examples: [
      "Manages multi-touch campaigns",
      "Coordinates stakeholder outreach",
      "Optimizes territory coverage",
    ],
  },
  {
    id: "dominate",
    name: "Dominate",
    description: "Adrata becomes your strategic advantage",
    icon: StarIcon,
    iconSolid: StarIconSolid,
    personality: "Elite strategist",
    capability: "Adrata operates with near-autonomous strategic intelligence",
    color: "text-rose-500",
    gradient: "from-rose-400 to-pink-600",
    examples: [
      "Predicts market opportunities",
      "Orchestrates competitive strategy",
      "Maximizes deal velocity across portfolio",
    ],
  },
];

export function AdrataIntelligence({
  currentMode,
  onModeChange,
  className = "",
}: AdrataIntelligenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const currentModeData =
    ADRATA_MODES.find((m) => m['id'] === currentMode) ||
    ADRATA_MODES[1] ||
    ADRATA_MODES[0];

  // Ensure we always have a valid mode
  if (!currentModeData) {
    console.warn("No valid Adrata mode found");
    return <div className={className}>Intelligence mode not available</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Mode Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center space-x-3 px-4 py-3 bg-[var(--background)]/50 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-[var(--background)]/70 transition-all duration-300 shadow-lg"
      >
        <div
          className={`relative p-2 rounded-lg bg-gradient-to-r ${currentModeData.gradient} shadow-lg`}
        >
          <currentModeData.iconSolid className="w-5 h-5 text-white" />

          {/* Magical sparkle effect */}
          <div className="absolute -top-1 -right-1">
            <SparklesIcon className="w-3 h-3 text-yellow-400 animate-pulse" />
          </div>
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[var(--foreground)]">Adrata</span>
            <span className={`text-sm font-medium ${currentModeData.color}`}>
              {currentModeData.name}
            </span>
          </div>
          <p className="text-xs text-[var(--muted)]">{currentModeData.description}</p>
        </div>

        <div
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        >
          <svg
            className="w-4 h-4 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded Mode Selection */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />

          {/* Mode Selection Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--background)]/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  How intelligent should Adrata be?
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Choose how proactively Adrata helps you win deals
                </p>
              </div>

              <div className="space-y-3">
                {ADRATA_MODES.map((mode) => {
                  const IconComponent =
                    hoveredMode === mode.id ? mode.iconSolid : mode.icon;
                  const isActive = currentMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onModeChange(mode.id);
                        setIsExpanded(false);
                      }}
                      onMouseEnter={() => setHoveredMode(mode.id)}
                      onMouseLeave={() => setHoveredMode(null)}
                      className={`w-full flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 text-left group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md"
                          : "hover:bg-[var(--panel-background)] border border-transparent"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg bg-gradient-to-r ${mode.gradient} shadow-lg flex-shrink-0 relative group-hover:scale-110 transition-transform duration-200`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-[var(--foreground)]">
                            {mode.name}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-[var(--muted)] mb-2">
                          {mode.capability}
                        </p>

                        <div className="space-y-1">
                          {mode.examples
                            .slice(0, hoveredMode === mode.id ? 3 : 2)
                            .map((example, idx) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-2 text-xs text-[var(--muted)]"
                              >
                                <div className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
                                <span>{example}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Hover arrow */}
                      <div
                        className={`transition-opacity duration-200 ${hoveredMode === mode.id ? "opacity-100" : "opacity-0"}`}
                      >
                        <svg
                          className="w-5 h-5 text-[var(--muted)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted)] text-center">
                  Adrata learns from your preferences and becomes more effective
                  over time
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
