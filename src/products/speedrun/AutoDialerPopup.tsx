"use client";

import React, { useState } from "react";
import {
  PhoneIcon,
  XMarkIcon,
  PlayIcon,
  UserIcon,
  RocketLaunchIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface SpeedrunPerson {
  id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  mobilePhone?: string;
  linkedin?: string;
  linkedinNavigatorUrl?: string;
  linkedinConnectionDate?: string;
  photo: string | null;
  priority: string;
  status: string;
  lastContact: string;
  nextAction: string;
  relationship: string;
  bio: string;
  interests: string[];
  recentActivity: string;
  commission: string;
  notes?: string; // Notes field for persistence
}

interface AutoDialerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPerson?: SpeedrunPerson;
  allCallableContacts: SpeedrunPerson[];
  onStartAutoDialer: () => void;
  onDialSingle: (person: SpeedrunPerson) => void;
}

export function AutoDialerPopup({
  isOpen,
  onClose,
  selectedPerson,
  allCallableContacts,
  onStartAutoDialer,
  onDialSingle,
}: AutoDialerPopupProps) {
  const [hoveredOption, setHoveredOption] = useState<"auto" | "single" | null>(
    null,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="relative p-8 text-center border-b border-[var(--border)]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>

          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Adrata Dialer
          </h2>
          <p className="text-[var(--muted)]">
            Optimize your outreach with better calling.
          </p>
        </div>

        {/* Options */}
        <div className="p-8 space-y-4">
          {/* Auto-Dialer Option */}
          <button
            onClick={onStartAutoDialer}
            onMouseEnter={() => setHoveredOption("auto")}
            onMouseLeave={() => setHoveredOption(null)}
            className={`w-full p-6 rounded-2xl border transition-all duration-300 text-left group ${
              hoveredOption === "auto"
                ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg scale-[1.02]"
                : "border-[var(--border)] hover:border-blue-300 hover:bg-[var(--hover-bg)]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  hoveredOption === "auto"
                    ? "bg-blue-500 shadow-lg"
                    : "bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-500"
                }`}
              >
                <RocketLaunchIcon
                  className={`w-6 h-6 transition-all duration-300 ${
                    hoveredOption === "auto"
                      ? "text-white"
                      : "text-blue-600 group-hover:text-white"
                  }`}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    Auto-Dialer
                  </h3>
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded-md">
                    INTELLIGENT
                  </div>
                </div>

                <p className="text-[var(--muted)] mb-3">
                  Call all {allCallableContacts.length} contacts sequentially.
                  Automatically advance on no answer, prompt for notes on
                  connection.
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <ChartBarIcon className="w-3 h-3" />
                    Auto-advance
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <PhoneIcon className="w-3 h-3" />
                    Call tracking
                  </span>
                  <span className="flex items-center gap-1 text-[var(--muted)]">
                    <UserIcon className="w-3 h-3" />
                    Progress analytics
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Single Dial Option */}
          {selectedPerson && (
            <button
              onClick={() => onDialSingle(selectedPerson)}
              onMouseEnter={() => setHoveredOption("single")}
              onMouseLeave={() => setHoveredOption(null)}
              className={`w-full p-6 rounded-2xl border transition-all duration-300 text-left group ${
                hoveredOption === "single"
                  ? "border-green-400 bg-green-50/50 dark:bg-green-900/20 shadow-lg scale-[1.02]"
                  : "border-[var(--border)] hover:border-green-300 hover:bg-[var(--hover-bg)]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    hoveredOption === "single"
                      ? "bg-green-500 shadow-lg"
                      : "bg-green-100 dark:bg-green-900/30 group-hover:bg-green-500"
                  }`}
                >
                  <UserIcon
                    className={`w-6 h-6 transition-all duration-300 ${
                      hoveredOption === "single"
                        ? "text-white"
                        : "text-green-600 group-hover:text-white"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                    Dial {selectedPerson.name}
                  </h3>

                  <div className="mb-3">
                    <p className="text-[var(--muted)] text-sm mb-1">
                      {selectedPerson.title} at {selectedPerson.company}
                    </p>
                    <p className="text-[var(--foreground)] font-medium">
                      {selectedPerson.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPerson['priority'] === "High"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : selectedPerson['priority'] === "Medium"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-[var(--hover)] text-gray-700 dark:bg-[var(--foreground)]/30 dark:text-[var(--muted)]"
                      }`}
                    >
                      {selectedPerson.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6">
          <div className="text-center text-xs text-[var(--muted)] flex items-center justify-center gap-1">
            <PhoneIcon className="w-3 h-3" />
            Powered by intelligent call routing and automated workflows
          </div>
          {/* CMD+D SHORTCUT REFERENCE TEMPORARILY HIDDEN
          <div className="text-center text-xs text-[var(--muted)] mt-1">
            Press{" "}
            <kbd className="px-1 py-0.5 bg-[var(--hover)] rounded text-xs">
              ⌘D
            </kbd>{" "}
            to open dialer
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
