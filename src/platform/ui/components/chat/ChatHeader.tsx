"use client";

import React from "react";
import { ChevronRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

interface ChatHeaderProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  viewMode: "ai" | "conversations" | "chat";
  setViewMode: (mode: "ai" | "conversations" | "chat") => void;
  selectedConversation: string | null;
  setSelectedConversation: (conversation: string | null) => void;
  totalUnreadMessages: number;
  currentSubApp: any;
}

const AI_MODELS = ["Adrata Powerhouse", "Adrata Advanced", "Adrata Core"];

export function ChatHeader({
  selectedModel,
  setSelectedModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  viewMode,
  setViewMode,
  selectedConversation,
  setSelectedConversation,
  totalUnreadMessages,
  currentSubApp,
}: ChatHeaderProps) {
  const handleBack = () => {
    if (viewMode === "chat") {
      setViewMode("conversations");
      setSelectedConversation(null);
    } else if (viewMode === "conversations") {
      setViewMode("ai");
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Back button or current mode */}
        <div className="flex items-center space-x-3">
          {(viewMode === "conversations" || viewMode === "chat") && (
            <button
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          <div className="flex items-center space-x-2">
            {viewMode === "ai" && (
              <>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {currentSubApp?.name || "AI Assistant"}
                </span>
              </>
            )}

            {viewMode === "conversations" && (
              <>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">💬</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Conversations
                </span>
                {totalUnreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {totalUnreadMessages}
                  </span>
                )}
              </>
            )}

            {viewMode === "chat" && selectedConversation && (
              <>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">💬</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedConversation === "ross-dan-real"
                    ? "Ross & Dan"
                    : "Chat"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side - Model selector for AI mode */}
        {viewMode === "ai" && (
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedModel}
              </span>
              <ChevronRightIcon
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  isModelDropdownOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {AI_MODELS.map((model) => (
                  <button
                    key={model}
                    onClick={() => {
                      setSelectedModel(model);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      selectedModel === model
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View mode switcher */}
        {viewMode === "ai" && (
          <div className="flex items-center">
            <button
              onClick={() => setViewMode("conversations")}
              className="ml-3 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors flex items-center space-x-1"
            >
              <span>💬</span>
              <span>Chat</span>
              {totalUnreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {totalUnreadMessages}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
