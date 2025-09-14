"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

interface PowerDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDialerActive: boolean;
  readyContactsCount: number;
}

export function PowerDialerModal({
  isOpen,
  onClose,
  onConfirm,
  isDialerActive,
  readyContactsCount,
}: PowerDialerModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error toggling dialer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const action = isDialerActive ? "Stop" : "Start";
  const actionColor = isDialerActive ? "red" : "blue";

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg p-6 w-96 max-w-[90vw] border border-[var(--border)] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDialerActive ? "bg-red-500/10" : "bg-blue-500/10"
              }`}
            >
              {isDialerActive ? (
                <PauseIcon
                  className={`w-5 h-5 ${isDialerActive ? "text-red-500" : "text-blue-500"}`}
                />
              ) : (
                <PlayIcon
                  className={`w-5 h-5 ${isDialerActive ? "text-red-500" : "text-blue-500"}`}
                />
              )}
            </div>
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              {action} Power Dialer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Status */}
          <div
            className={`rounded-lg p-4 border ${
              isDialerActive
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <PhoneIcon
                className={`w-5 h-5 ${isDialerActive ? "text-red-600" : "text-blue-600"}`}
              />
              <span
                className={`font-medium ${
                  isDialerActive
                    ? "text-red-900 dark:text-red-200"
                    : "text-blue-900 dark:text-blue-200"
                }`}
              >
                Dialer Status: {isDialerActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p
              className={`text-sm ${
                isDialerActive
                  ? "text-red-700 dark:text-red-300"
                  : "text-blue-700 dark:text-blue-300"
              }`}
            >
              {isDialerActive
                ? "The Power Dialer is currently running and dialing through your contacts."
                : `Ready to dial through ${readyContactsCount} contacts in your speedrun.`}
            </p>
          </div>

          {/* Action Description */}
          <div className="bg-[var(--hover-bg)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
              {isDialerActive ? (
                <>
                  <PauseIcon className="w-4 h-4" />
                  Stopping the dialer will:
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  Starting the dialer will:
                </>
              )}
            </h4>
            <ul className="text-sm text-[var(--muted)] space-y-1">
              {isDialerActive ? (
                <>
                  <li>• Immediately pause all automatic dialing</li>
                  <li>• Stop the current call sequence</li>
                  <li>• Return to manual dialing mode</li>
                  <li>• Preserve your current progress</li>
                </>
              ) : (
                <>
                  <li>
                    • Begin automatically dialing through your speedrun contacts
                  </li>
                  <li>• Start with the highest priority prospects</li>
                  <li>• Show call interface for each connection</li>
                  <li>• Track call outcomes and notes automatically</li>
                </>
              )}
            </ul>
          </div>

          {/* Warning/Tips */}
          {!isDialerActive && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                    !
                  </span>
                </div>
                <div>
                  <div className="font-medium text-amber-900 dark:text-amber-200 text-sm mb-1">
                    Ready to dial?
                  </div>
                  <div className="text-amber-700 dark:text-amber-300 text-xs">
                    Make sure you have your headset ready and are in a quiet
                    environment for making calls.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Count */}
          <div className="text-center py-2">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {readyContactsCount}
            </div>
            <div className="text-sm text-[var(--muted)]">
              contacts ready to dial
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
              isDialerActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isDialerActive ? "Stopping..." : "Starting..."}
              </>
            ) : (
              <>
                {isDialerActive ? (
                  <PauseIcon className="w-4 h-4" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                {action} Dialer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
