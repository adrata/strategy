"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  CogIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useUnifiedAuth } from "@/platform/auth";
import { SpeedrunSettingsClientService } from "@/platform/services/speedrun-settings-client";

interface UserProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  dailyTarget: number;
  weeklyTarget: number;
  role: "AE" | "SDR" | "CSM" | "VP" | "other";
  strategy: "optimal" | "speed" | "revenue";
  quota: number;
  pipelineHealth: "healthy" | "behind" | "ahead";
  phoneNumber?: string;
  callingRegion?: string;
  autoAdvanceDialer?: boolean;
  autoCallTimeout?: number; // seconds
  preferredCallTimes?: {
    start: string;
    end: string;
  };
}

export function UserProfileSettings({
  isOpen,
  onClose,
}: UserProfileSettingsProps) {
  const { user } = useUnifiedAuth();
  const [settings, setSettings] = useState<UserSettings>({
    dailyTarget: 40,
    weeklyTarget: 200,
    role: "AE",
    strategy: "optimal",
    quota: 100000,
    pipelineHealth: "healthy",
    phoneNumber: "",
    callingRegion: "US",
    autoAdvanceDialer: true,
    autoCallTimeout: 30,
    preferredCallTimes: {
      start: "09:00",
      end: "17:00",
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        try {
          const userSettings =
            await SpeedrunSettingsClientService.getUserSettings(user.id);
          if (userSettings) {
            setSettings({
              dailyTarget: userSettings.dailyTarget || 40,
              weeklyTarget: userSettings.weeklyTarget || 200,
              role: userSettings.role || "AE",
              strategy: userSettings.strategy || "optimal",
              quota: userSettings.quota || 100000,
              pipelineHealth: userSettings.pipelineHealth || "healthy",
              phoneNumber: "",
              callingRegion: "US",
              autoAdvanceDialer: true,
              autoCallTimeout: 30,
              preferredCallTimes: {
                start: "09:00",
                end: "17:00",
              },
            });
          }
        } catch (error) {
          console.error("Failed to load user settings:", error);
        }
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const success = await SpeedrunSettingsClientService.saveUserSettings(
        user.id,
        settings,
      );
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Profile Settings
              </h2>
              <p className="text-[var(--muted)] text-sm">
                Customize your speedrun and calling preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--foreground)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-[var(--hover-bg)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-2">
              User Information
            </h3>
            <div className="text-sm text-[var(--muted)]">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {user?.name || "Sales Rep"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {user?.email || "sales@company.com"}
              </p>
            </div>
          </div>

          {/* Role & Targets */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">
              Sales Role & Targets
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Role
                </label>
                <select
                  value={settings.role}
                  onChange={(e) =>
                    updateSettings({
                      role: e.target.value as
                        | "AE"
                        | "SDR"
                        | "CSM"
                        | "VP"
                        | "other",
                    })
                  }
                  className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SDR">SDR (Sales Development Rep)</option>
                  <option value="AE">AE (Account Executive)</option>
                  <option value="CSM">CSM (Customer Success Manager)</option>
                  <option value="VP">VP (Vice President)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Daily Target
                  </label>
                  <input
                    type="number"
                    value={settings.dailyTarget}
                    onChange={(e) =>
                      updateSettings({
                        dailyTarget: parseInt(e.target.value) || 40,
                      })
                    }
                    className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Weekly Target
                  </label>
                  <input
                    type="number"
                    value={settings.weeklyTarget}
                    onChange={(e) =>
                      updateSettings({
                        weeklyTarget: parseInt(e.target.value) || 200,
                      })
                    }
                    className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calling Preferences */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <PhoneIcon className="w-5 h-5" />
              Calling Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={settings.phoneNumber}
                  onChange={(e) =>
                    updateSettings({ phoneNumber: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                  className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Calling Region
                </label>
                <select
                  value={settings.callingRegion}
                  onChange={(e) =>
                    updateSettings({ callingRegion: e.target.value })
                  }
                  className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Call Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.preferredCallTimes?.start ?? "09:00"}
                    onChange={(e) =>
                      updateSettings({
                        preferredCallTimes: {
                          start: e.target.value,
                          end: settings.preferredCallTimes?.end ?? "17:00",
                        },
                      })
                    }
                    className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Call End Time
                  </label>
                  <input
                    type="time"
                    value={settings.preferredCallTimes?.end ?? "17:00"}
                    onChange={(e) =>
                      updateSettings({
                        preferredCallTimes: {
                          start: settings.preferredCallTimes?.start ?? "09:00",
                          end: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Power Dialer Settings */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <CogIcon className="w-5 h-5" />
              Power Dialer Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--foreground)]">
                    Auto-advance to next contact
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    Automatically move to the next contact after completing a
                    call
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoAdvanceDialer}
                    onChange={(e) =>
                      updateSettings({ autoAdvanceDialer: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Call Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.autoCallTimeout}
                  onChange={(e) =>
                    updateSettings({
                      autoCallTimeout: parseInt(e.target.value) || 30,
                    })
                  }
                  min="10"
                  max="120"
                  className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-[var(--muted)] mt-1">
                  How long to wait before automatically moving to the next
                  contact (10-120 seconds)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : saveSuccess ? (
              <CheckIcon className="w-4 h-4" />
            ) : null}
            {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
