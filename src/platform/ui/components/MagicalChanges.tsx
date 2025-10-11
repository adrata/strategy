import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import {
  CheckIcon as CheckIconSolid,
  SparklesIcon as SparklesIconSolid,
} from "@heroicons/react/24/solid";

interface MagicalChange {
  id: string;
  type: "enhance" | "create" | "update" | "insight";
  title: string;
  description: string;
  before?: any;
  after?: any;
  confidence: number;
  impact: "low" | "medium" | "high";
  category: "contact" | "company" | "opportunity" | "intelligence";
}

interface MagicalChangesProps {
  changes: MagicalChange[];
  onApprove: (changeId: string) => void;
  onReject: (changeId: string) => void;
  onApproveAll: () => void;
  className?: string;
}

const CHANGE_COLORS = {
  enhance: "from-blue-400 to-blue-600",
  create: "from-emerald-400 to-emerald-600",
  update: "from-amber-400 to-orange-500",
  insight: "from-purple-400 to-purple-600",
};

const IMPACT_INDICATORS = {
  low: { color: "bg-[var(--hover)] text-gray-700", label: "Minor" },
  medium: { color: "bg-blue-100 text-blue-700", label: "Helpful" },
  high: { color: "bg-purple-100 text-purple-700", label: "Game-changing" },
};

const CATEGORY_ICONS = {
  contact: "👤",
  company: "🏢",
  opportunity: "💰",
  intelligence: "🧠",
};

export function MagicalChanges({
  changes,
  onApprove,
  onReject,
  onApproveAll,
  className = "",
}: MagicalChangesProps) {
  const [animatingChanges, setAnimatingChanges] = useState<Set<string>>(
    new Set(),
  );
  const [approvedChanges, setApprovedChanges] = useState<Set<string>>(
    new Set(),
  );

  const handleApprove = (changeId: string) => {
    setAnimatingChanges((prev) => new Set([...prev, changeId]));

    setTimeout(() => {
      setApprovedChanges((prev) => new Set([...prev, changeId]));
      onApprove(changeId);

      setTimeout(() => {
        setAnimatingChanges((prev) => {
          const newSet = new Set(prev);
          newSet.delete(changeId);
          return newSet;
        });
      }, 500);
    }, 300);
  };

  const handleReject = (changeId: string) => {
    onReject(changeId);
  };

  if (changes['length'] === 0) return null;

  return (
    <div
      className={`bg-[var(--background)]/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[var(--background)]/20 rounded-lg">
              <SparklesIconSolid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Adrata has insights for you
              </h3>
              <p className="text-white/80 text-sm">
                {changes.length} magical improvements ready
              </p>
            </div>
          </div>

          {changes.length > 1 && (
            <button
              onClick={onApproveAll}
              className="px-4 py-2 bg-[var(--background)]/20 text-white rounded-lg hover:bg-[var(--background)]/30 transition-colors text-sm font-medium"
            >
              Accept All ✨
            </button>
          )}
        </div>
      </div>

      {/* Changes List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {changes.map((change) => {
          const isAnimating = animatingChanges.has(change.id);
          const isApproved = approvedChanges.has(change.id);
          const gradient = CHANGE_COLORS[change.type];
          const impact = IMPACT_INDICATORS[change.impact];

          return (
            <div
              key={change.id}
              className={`relative transition-all duration-500 ${
                isAnimating
                  ? "scale-105 opacity-75"
                  : isApproved
                    ? "scale-95 opacity-50"
                    : "scale-100 opacity-100"
              }`}
            >
              <div className="flex items-start space-x-4 p-4 bg-[var(--panel-background)] rounded-xl hover:bg-[var(--hover)] transition-colors">
                {/* Magic Icon */}
                <div
                  className={`p-3 rounded-lg bg-gradient-to-r ${gradient} shadow-lg flex-shrink-0 relative`}
                >
                  <span className="text-white text-lg">
                    {CATEGORY_ICONS[change.category]}
                  </span>

                  {/* Confidence indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--background)] rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-gray-700">
                      {Math.round(change.confidence * 100)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title and Impact */}
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-[var(--foreground)]">
                      {change.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${impact.color}`}
                    >
                      {impact.label}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--muted)] mb-3">
                    {change.description}
                  </p>

                  {/* Before/After Visual */}
                  {change['before'] && change['after'] && (
                    <div className="bg-[var(--background)] rounded-lg p-3 mb-3 border border-[var(--border)]">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="text-xs text-[var(--muted)] mb-1">
                            Before
                          </div>
                          <div className="text-sm text-gray-700 truncate">
                            {typeof change['before'] === "string"
                              ? change.before
                              : JSON.stringify(change.before)}
                          </div>
                        </div>

                        <ArrowRightIcon className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />

                        <div className="flex-1">
                          <div className="text-xs text-[var(--muted)] mb-1">
                            After
                          </div>
                          <div className="text-sm font-medium text-[var(--foreground)] truncate">
                            {typeof change['after'] === "string"
                              ? change.after
                              : JSON.stringify(change.after)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(change.id)}
                      disabled={isAnimating || isApproved}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckIconSolid className="w-4 h-4" />
                      <span>Apply Magic</span>
                    </button>

                    <button
                      onClick={() => handleReject(change.id)}
                      disabled={isAnimating || isApproved}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[var(--loading-bg)] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Not now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Magical approval animation */}
              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/90 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <SparklesIconSolid className="w-6 h-6 text-purple-500 animate-spin" />
                    <span className="text-purple-700 font-medium">
                      Applying magic...
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-[var(--panel-background)] border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted)] text-center">
          Adrata only suggests changes it&apos;s confident will help you win
          more deals
        </p>
      </div>
    </div>
  );
}

// Hook for managing magical changes
export function useMagicalChanges() {
  const [changes, setChanges] = useState<MagicalChange[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addChange = (change: Omit<MagicalChange, "id">) => {
    const newChange: MagicalChange = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setChanges((prev) => [...prev, newChange]);
    setIsVisible(true);
  };

  const removeChange = (changeId: string) => {
    setChanges((prev) => prev.filter((c) => c.id !== changeId));
  };

  const handleApprove = (changeId: string) => {
    const change = changes.find((c) => c['id'] === changeId);
    if (change) {
      // Execute the change logic here
      console.log("Applying magical change:", change);
      removeChange(changeId);
    }
  };

  const handleReject = (changeId: string) => {
    removeChange(changeId);
  };

  const handleApproveAll = () => {
    changes.forEach((change) => {
      console.log("Applying magical change:", change);
    });
    setChanges([]);
    setIsVisible(false);
  };

  // Hide when no changes
  useEffect(() => {
    if (changes['length'] === 0) {
      setIsVisible(false);
    }
  }, [changes.length]);

  return {
    changes,
    isVisible,
    addChange,
    handleApprove,
    handleReject,
    handleApproveAll,
    setIsVisible,
  };
}
