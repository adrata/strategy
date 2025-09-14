"use client";

import React, { useState } from "react";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromptEditor({ isOpen, onClose }: PromptEditorProps) {
  const [activeTab, setActiveTab] = useState("user");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[800px] max-w-[95vw] max-h-[95vh] border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">AI Prompt Editor</h2>
          </div>
          <button onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p>Revolutionary prompt customization interface coming soon...</p>
        </div>
      </div>
    </div>
  );
}
