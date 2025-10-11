import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

interface RossWelcomeToastProps {
  onGoToChat?: () => void;
}

export function RossWelcomeToast({ onGoToChat }: RossWelcomeToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if user has already seen the welcome message today
    const lastShown = localStorage.getItem("ross_welcome_last_shown");
    const today = new Date().toDateString();

    if (lastShown !== today && !hasShown) {
      // Show after a brief delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasShown(true);
        localStorage.setItem("ross_welcome_last_shown", today);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleGoToChat = () => {
    setIsVisible(false);
    onGoToChat?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-2 z-50 animate-in slide-in-from-top-2 duration-500">
      <div className="bg-[var(--background)] rounded-lg shadow-lg border border-[var(--border)] dark:border-[var(--border)] max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] dark:border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] dark:text-white">
                Ross Sylvester
              </h3>
              <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                Adrata Founder
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[var(--muted)] hover:text-[var(--muted)] dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="px-4 py-4">
          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
            Welcome to a new world. Where the gap between what you want and what
            you can achieve disappears.
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-[var(--panel-background)] dark:bg-gray-750 flex gap-2">
          <button
            onClick={handleGoToChat}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Chat with Ross
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-[var(--muted)] dark:text-[var(--muted)] text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
