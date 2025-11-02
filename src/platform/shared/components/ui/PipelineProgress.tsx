import React from "react";

interface PipelineStage {
  name: string;
  completed: boolean;
  current: boolean;
}

interface PipelineProgressProps {
  stages?: PipelineStage[];
  className?: string;
  directionalIntelligence?: string;
  showHeader?: boolean;
  headerTitle?: string;
}

const defaultStages: PipelineStage[] = [
  { name: "Build", completed: true, current: false },
  { name: "Justify", completed: true, current: false },
  { name: "Negotiate", completed: true, current: true },
  { name: "Legal/Procurement", completed: false, current: false },
  { name: "Sign", completed: false, current: false },
  { name: "Paid", completed: false, current: false },
];

const defaultDirectionalIntelligence =
  "Focus on technical integration concerns with IT team. Sarah Chen (VP Engineering) is showing strong interest but needs security compliance documentation. Recommend scheduling a technical deep-dive with their architecture team to address scalability questions and demonstrate our enterprise-grade security features.";

export function PipelineProgress({
  stages = defaultStages,
  className = "",
  directionalIntelligence = defaultDirectionalIntelligence,
  showHeader = true,
  headerTitle = "Pipeline Progress",
}: PipelineProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {headerTitle}
        </h3>
      )}

      {/* Compact Pipeline Progress */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          {stages.map((stage, stageIndex) => {
            const isCompleted = stage.completed;
            const isCurrent = stage.current;
            const isFuture = !isCompleted && !isCurrent;

            return (
              <React.Fragment key={stage.name}>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isCompleted || isCurrent
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isCompleted || isCurrent
                        ? "text-blue-500"
                        : "text-muted"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
                {stageIndex < stages.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    isCompleted || (isCurrent && stageIndex === 0) ? "bg-blue-500" : "bg-gray-300"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Directional Intelligence */}
      <div className="bg-hover rounded-lg p-3">
        <div className="text-xs font-medium text-foreground mb-1">
          Directional Intelligence:
        </div>
        <div className="text-xs text-muted leading-relaxed">
          {directionalIntelligence}
        </div>
      </div>
    </div>
  );
}
