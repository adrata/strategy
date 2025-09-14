import React from "react";
import { PendingAction } from "../types";

interface PendingActionBarProps {
  pendingAction: PendingAction;
  onExecute: () => void;
  onCancel: () => void;
}

export const PendingActionBar: React.FC<PendingActionBarProps> = ({
  pendingAction,
  onExecute,
  onCancel,
}) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            🎯 Action Ready:{" "}
            {pendingAction.type.replace("_", " ").toUpperCase()}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 whitespace-pre-line">
            {pendingAction.summary}
          </p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={onExecute}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            ✅ Accept Action
            <span className="text-xs opacity-80">(⌘↵)</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
