"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  Cog6ToothIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { SpeedrunUserSettings } from "./types";
import { resetSpeedrunToDefaults } from "./state";

interface SpeedrunSettingsProps {
  settings: SpeedrunUserSettings;
  onSettingsChange: (settings: Partial<SpeedrunUserSettings>) => Promise<void>;
}

export function SpeedrunSettings({
  settings,
  onSettingsChange,
}: SpeedrunSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async () => {
    try {
      await onSettingsChange(localSettings);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Could add error UI feedback here
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings); // Reset to original
    setIsOpen(false);
  };

  const handleReset = () => {
    if (
      confirm(
        "This will clear all speedrun data and reset to default settings. Are you sure?",
      )
    ) {
      resetSpeedrunToDefaults(localSettings.role);
      // Refresh the page to reload with fresh data
      window.location.reload();
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-6 h-6 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md flex items-center justify-center text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="Speedrun Settings"
      >
        <Cog6ToothIcon className="w-4 h-4" />
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-96 max-w-[90vw] border border-[var(--border)] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Speedrun Settings
              </h3>
              <button
                onClick={handleCancel}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Weekly Target */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Weekly Contact Target
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={localSettings.weeklyTarget}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      weeklyTarget: parseInt(e.target.value) || 20,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  How many contacts you want to reach out to each week
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Your Role
                </label>
                <select
                  value={localSettings.role}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      role: e.target.value as SpeedrunUserSettings["role"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AE">Account Executive (AE)</option>
                  <option value="SDR">Sales Development Rep (SDR)</option>
                  <option value="CSM">Customer Success Manager (CSM)</option>
                  <option value="VP">VP of Sales</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Helps determine optimal contact volume and focus
                </p>
              </div>

              {/* Strategy */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Prioritization Strategy
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      value="optimal"
                      checked={localSettings['strategy'] === "optimal"}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          strategy: e.target
                            .value as SpeedrunUserSettings["strategy"],
                        }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">
                        Optimal (Recommended)
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        70% speed, 30% revenue - Balanced approach for hitting
                        quota
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      value="speed"
                      checked={localSettings['strategy'] === "speed"}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          strategy: e.target
                            .value as SpeedrunUserSettings["strategy"],
                        }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">
                        Speed Focus
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        90% speed, 10% revenue - Prioritize quick wins and logo
                        velocity
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      value="revenue"
                      checked={localSettings['strategy'] === "revenue"}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          strategy: e.target
                            .value as SpeedrunUserSettings["strategy"],
                        }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">
                        Revenue Focus
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        20% speed, 80% revenue - Prioritize high-value
                        enterprise deals
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Yearly Target */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Yearly Target
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[var(--muted)]">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={localSettings.quota}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        quota: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full pl-8 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000000"
                  />
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Your yearly sales target (helps prioritize opportunities)
                </p>
              </div>

              {/* Pipeline Health */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Pipeline Health
                </label>
                <select
                  value={localSettings.pipelineHealth}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      pipelineHealth: e.target
                        .value as SpeedrunUserSettings["pipelineHealth"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ahead">Ahead of Goal</option>
                  <option value="healthy">On Track</option>
                  <option value="behind">Behind Goal</option>
                </select>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Adjusts contact prioritization based on your current
                  performance
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
              >
                Save Settings
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                title="Reset all speedrun data"
              >
                <TrashIcon className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-[var(--hover-bg)] rounded-lg">
              <h4 className="font-medium text-[var(--foreground)] mb-2">
                Preview
              </h4>
              <div className="text-sm text-[var(--muted)] space-y-1">
                <div>
                  • Weekly target: {localSettings.weeklyTarget} contacts
                </div>
                <div>• Strategy: {localSettings.strategy} prioritization</div>
                <div>• Role: {localSettings.role}</div>
                <div>
                  • Target: ${localSettings.quota.toLocaleString()}/year
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
