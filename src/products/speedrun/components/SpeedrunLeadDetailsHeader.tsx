import React from "react";
import {
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SpeedrunPerson } from "../types/SpeedrunTypes";

interface SpeedrunLeadDetailsHeaderProps {
  person: SpeedrunPerson;
  personIndex: number;
  totalPersons: number;
  isListening: boolean;
  showMoreActions: boolean;
  onBack: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;

  onComplete: (personId: number) => void;
  onShowMoreActions: (show: boolean) => void;
  onShowSnoozeRemoveModal: (show: boolean) => void;
  onShowAutoDialerPopup: (show: boolean) => void;
  canNavigatePrevious: () => boolean;
  canNavigateNext: () => boolean;
  getInitials: (name: string) => string;
  getRoleColor: (role: string) => string;
}

export function SpeedrunLeadDetailsHeader({
  person,
  personIndex,
  totalPersons,
  isListening,
  showMoreActions,
  onBack,
  onNavigatePrevious,
  onNavigateNext,

  onComplete,
  onShowMoreActions,
  onShowSnoozeRemoveModal,
  onShowAutoDialerPopup,
  canNavigatePrevious,
  canNavigateNext,
  getInitials,
  getRoleColor,
}: SpeedrunLeadDetailsHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--border)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                {person.name}
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {person.company}
              </p>
            </div>
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(person.customFields?.monacoEnrichment?.buyerGroupAnalysis?.role || person.relationship || "Contact")}`}
          >
            {person.customFields?.monacoEnrichment?.buyerGroupAnalysis?.role ||
              person.relationship ||
              "Contact"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-sm text-[var(--muted)]">
            {personIndex + 1} of {totalPersons}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onNavigatePrevious}
              disabled={!canNavigatePrevious()}
              className="p-2 rounded-lg hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateNext}
              disabled={!canNavigateNext()}
              className="p-2 rounded-lg hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onComplete(person.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Mark as Complete (Ctrl+Enter)"
            >
              Complete
            </button>

            <div className="relative">
              <button
                onClick={() => onShowMoreActions(!showMoreActions)}
                className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
              >
                <ChevronDownIcon className="w-5 h-5" />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--background)] rounded-md shadow-lg z-10 border border-[var(--border)]">
                  <button
                    onClick={() => {
                      onShowSnoozeRemoveModal(true);
                      onShowMoreActions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[var(--panel-background)] flex items-center space-x-2"
                  >
                    <ClockIcon className="w-4 h-4" />
                    <span>Snooze</span>
                  </button>
                  <button
                    onClick={() => {
                      onShowSnoozeRemoveModal(true);
                      onShowMoreActions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[var(--panel-background)] flex items-center space-x-2 text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
