import React, { useState, useEffect } from "react";
import {
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  TrashIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { LeadDetailsHeaderProps } from "./LeadDetailsTypes";
import { AccurateTargetCalculator, type AccurateTargets } from "../../AccurateTargetCalculator";
import { useSpeedrunMetrics } from "@/platform/hooks/useSpeedrunMetrics";

export function LeadDetailsHeader({
  person,
  personIndex,
  totalPersons,
  isListening,
  showMoreActions,
  onBack,
  onNavigatePrevious,
  onNavigateNext,
  onComplete,

  onDial,
  onMoreActions,
  onUpdate,
  onSnooze,
  onRemove,
  canNavigatePrevious,
  canNavigateNext,
}: LeadDetailsHeaderProps) {
  // State for accurate targets - using dynamic values based on actual data
  const [accurateTargets, setAccurateTargets] = useState<AccurateTargets>({
    completedToday: 0, // Track completed contacts today
    people: 30, // Match left panel Speedrun count
    dailyTarget: 30, // Set to 30 as requested
    weeklyTarget: 0, // Remove weekly target as requested
    dailyProgress: 30, // Match daily target
    weeklyProgress: 0 // Remove weekly progress
  });

  // Load accurate targets on component mount
  useEffect(() => {
    const loadAccurateTargets = async () => {
      try {
        const targets = await AccurateTargetCalculator.getCachedOrFreshTargets();
        setAccurateTargets(targets);
      } catch (error) {
        console.error("Failed to load accurate targets:", error);
      }
    };

    loadAccurateTargets();

    // Update targets every 5 minutes
    const interval = setInterval(loadAccurateTargets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center justify-between mt-2 mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--hover)] text-gray-700 rounded-lg hover:bg-[var(--loading-bg)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center font-semibold text-sm">
          {(person as any).globalRank || (person as any).winningScore?.rank || personIndex}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {person.name}
          </h1>
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">
                {person.company}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {/* Real-time Target Numbers */}
        <div className="flex items-center gap-4 text-sm text-[var(--muted)] mr-4">
          <div className="text-center">
            <div className="font-semibold">
              <span className="text-red-600">{accurateTargets.completedToday}</span>
              <span className="text-black">/{accurateTargets.dailyTarget}</span>
            </div>
            <div className="text-xs">Daily Target</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-black">{accurateTargets.people}</div>
            <div className="text-xs">People</div>
          </div>
        </div>

        {/* Pulse button removed per user request */}

        {/* Dial button - Hidden on small screens, shown in More dropdown */}
        {/* DIAL BUTTON TEMPORARILY HIDDEN
        <button
          onClick={onDial}
          className="hidden md:flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--panel-background)] transition-colors"
        >
          <span className="text-sm">⌘</span>
          <span className="text-sm">D</span>
          Dial
        </button>
        */}

        {/* Complete button */}
        <button
          onClick={() => onComplete(person.id)}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
        >
          <span className="text-sm opacity-70">⌘</span>
          <span className="text-sm opacity-70">↵</span>
          Complete
        </button>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => onMoreActions(!showMoreActions)}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
          >
            More
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {showMoreActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => onMoreActions(false)}
              />
              <div className="absolute right-0 top-12 w-48 bg-[var(--background)] border border-[var(--border)] dark:border-[var(--border)] rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {/* Pulse button removed per user request */}

                  {/* DIAL BUTTON TEMPORARILY HIDDEN FROM MOBILE TOO
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDial();
                      onMoreActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2 md:hidden"
                  >
                    <span className="text-sm">⌘D</span>
                    Dial
                  </button>

                  <div className="border-t border-[var(--border)] dark:border-[var(--border)] my-1 md:hidden"></div>
                  */}

                  <button
                    onClick={() => {
                      onUpdate?.();
                      onMoreActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--panel-background)] dark:hover:bg-[var(--foreground)]/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Update
                  </button>
                  <div className="border-t border-[var(--border)] dark:border-[var(--border)] my-1"></div>
                  <button
                    onClick={() => {
                      onSnooze(person.id);
                      onMoreActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2"
                  >
                    <ClockIcon className="w-4 h-4" />
                    Snooze
                  </button>
                  <button
                    onClick={() => {
                      onRemove(person.id);
                      onMoreActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={onNavigatePrevious}
          disabled={!canNavigatePrevious()}
          className="px-3 py-2 border border-[var(--border)] bg-transparent text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--panel-background)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        <button
          onClick={onNavigateNext}
          disabled={!canNavigateNext()}
          className="px-3 py-2 border border-[var(--border)] bg-transparent text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--panel-background)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
