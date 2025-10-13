"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  SNOOZE_OPTIONS,
  type SnoozeOption,
} from "./constants";
import {
  snoozeLead,
  removeLead,
} from "./lead-management";

interface SnoozeRemoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadCompany: string;
  onAction: (action: "snoozed" | "removed", leadId: string) => void;
}

export function SnoozeRemoveModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadCompany,
  onAction,
}: SnoozeRemoveModalProps) {
  const [activeTab, setActiveTab] = useState<"snooze" | "remove">("snooze");
  const [selectedSnooze, setSelectedSnooze] = useState<SnoozeOption | null>(
    null,
  );
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("09:00");
  const [removeType, setRemoveType] = useState<"temp" | "permanent">("temp");
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSnooze = () => {
    if (!selectedSnooze) return;

    let snoozeUntil: Date;

    if (selectedSnooze['type'] === "custom") {
      if (!customDate) return;
      const dateTime = new Date(`${customDate}T${customTime}`);
      snoozeUntil = dateTime;
    } else {
      snoozeUntil = new Date(Date.now() + selectedSnooze.duration);
    }

    snoozeLead(leadId, snoozeUntil, reason || undefined);
    onAction("snoozed", leadId);
    onClose();
  };

  const handleRemove = () => {
    removeLead(leadId, removeType === "permanent", reason || undefined);
    onAction("removed", leadId);
    onClose();
  };

  const formatSnoozePreview = (option: SnoozeOption): string => {
    if (option['type'] === "custom" && customDate) {
      const dateTime = new Date(`${customDate}T${customTime}`);
      return `Until ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    const futureDate = new Date(Date.now() + option.duration);
    if (option['id'] === "hour")
      return `Until ${futureDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} today`;
    if (option['id'] === "day")
      return `Until tomorrow at ${futureDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (option['id'] === "week") return `Until ${futureDate.toLocaleDateString()}`;

    return option.label;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[10000]">
      <div className="bg-[var(--background)] rounded-xl w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto border border-[var(--border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Manage Lead
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              {leadName} • {leadCompany}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab("snooze")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "snooze"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            <ClockIcon className="w-4 h-4 inline-block mr-2" />
            Snooze
          </button>
          <button
            onClick={() => setActiveTab("remove")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "remove"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            <TrashIcon className="w-4 h-4 inline-block mr-2" />
            Remove
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "snooze" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
                  When should we bring this lead back?
                </h3>

                <div className="space-y-2">
                  {SNOOZE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSnooze(option)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedSnooze?.id === option.id
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                          : "border-[var(--border)] hover:border-blue-300 hover:bg-[var(--hover-bg)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">
                            {option['id'] === "custom" ? (
                              <span className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {option.label}
                              </span>
                            ) : (
                              option.label
                            )}
                          </div>
                          {selectedSnooze?.id === option['id'] && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                              {formatSnoozePreview(option)}
                            </div>
                          )}
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedSnooze?.id === option.id
                              ? "border-blue-500 bg-blue-500"
                              : "border-[var(--border)]"
                          }`}
                        >
                          {selectedSnooze?.id === option['id'] && (
                            <div className="w-2 h-2 bg-[var(--background)] rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Date/Time Picker */}
                {selectedSnooze?.type === "custom" && (
                  <div className="mt-4 p-4 bg-[var(--panel-background)]/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Reason */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Waiting for budget approval"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSnooze}
                  disabled={
                    !selectedSnooze ||
                    (selectedSnooze['type'] === "custom" && !customDate)
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Snooze Lead
                </button>
              </div>
            </div>
          )}

          {activeTab === "remove" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
                  How should we remove this lead?
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={() => setRemoveType("temp")}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      removeType === "temp"
                        ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/20"
                        : "border-[var(--border)] hover:border-orange-300 hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[var(--foreground)]">
                          Remove for now
                        </div>
                        <div className="text-sm text-[var(--muted)] mt-1">
                          Can be re-added to speedrun later
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          removeType === "temp"
                            ? "border-orange-500 bg-orange-500"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {removeType === "temp" && (
                          <div className="w-2 h-2 bg-[var(--background)] rounded-full m-0.5"></div>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setRemoveType("permanent")}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      removeType === "permanent"
                        ? "border-red-500 bg-red-50/50 dark:bg-red-900/20"
                        : "border-[var(--border)] hover:border-red-300 hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[var(--foreground)]">
                          Remove permanently
                        </div>
                        <div className="text-sm text-[var(--muted)] mt-1">
                          Will never appear in speedrun again
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          removeType === "permanent"
                            ? "border-red-500 bg-red-500"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {removeType === "permanent" && (
                          <div className="w-2 h-2 bg-[var(--background)] rounded-full m-0.5"></div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Required Reason for Permanent Removal */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Reason{" "}
                  {removeType === "permanent" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    removeType === "permanent"
                      ? "e.g., Wrong target market, competitor, unqualified"
                      : "e.g., Not a priority right now"
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removeType === "permanent" && !reason.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    removeType === "permanent"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {removeType === "permanent"
                    ? "Remove Permanently"
                    : "Remove for Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
