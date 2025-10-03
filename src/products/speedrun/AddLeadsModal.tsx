"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface AddLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
}

export function AddLeadsModal({
  isOpen,
  onClose,
  onConfirm,
}: AddLeadsModalProps) {
  const [leadCount, setLeadCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(leadCount);
      onClose();
    } catch (error) {
      console.error("Error adding leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg p-6 w-96 max-w-[90vw] border border-[var(--border)] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Add More Leads
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Add new leads to your speedrun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        <div className="space-y-6">
          {/* Lead Count Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
              How many leads would you like to add?
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[10, 20, 30, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setLeadCount(count)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    leadCount === count
                      ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]"
                      : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-[var(--muted)]">leads</div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--muted)]">Custom:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={leadCount}
                onChange={(e) =>
                  setLeadCount(
                    Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                  )
                }
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lead Source Info */}
          <div className="bg-[var(--hover-bg)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              What you&apos;ll get:
            </h4>
            <ul className="text-sm text-[var(--muted)] space-y-1">
              <li>• SmartRank-scored leads from production database</li>
              <li>• Real contact information (email, phone, LinkedIn)</li>
              <li>• Company intelligence and buying signals</li>
              <li>
                • Prioritized by revenue potential and likelihood to close
              </li>
            </ul>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                Adding {leadCount} leads to your speedrun
              </div>
              <div className="text-blue-700 dark:text-blue-300 text-xs">
                These will be added to your &quot;Ready&quot; section and
                available immediately for outreach.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-blue-200 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-300 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                Add {leadCount} Leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
