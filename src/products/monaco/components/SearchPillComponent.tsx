import React, { useState, useEffect, useRef } from "react";
import { SearchPill } from "../types";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchPillComponentProps {
  pill: SearchPill;
  onToggle: (pillId: string) => void;
  onUpdateValue: (pillId: string, newValue: string) => void;
  onRemove: (pillId: string) => void;
}

export const SearchPillComponent: React.FC<SearchPillComponentProps> = ({
  pill,
  onToggle,
  onUpdateValue,
  onRemove,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pillRef['current'] && !pillRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPillColor = (type: string) => {
    switch (type) {
      case "location":
        return {
          bg: "bg-purple-100 dark:bg-purple-900/30",
          text: "text-purple-700 dark:text-purple-300",
          border: "border-purple-300 dark:border-purple-600",
        };
      case "industry":
        return {
          bg: "bg-purple-100 dark:bg-purple-900/30",
          text: "text-purple-800 dark:text-purple-300",
          border: "border-purple-300 dark:border-purple-600",
        };
      case "developer_type":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-300",
          border: "border-blue-300 dark:border-blue-600",
        };
      case "tech_stack":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-700 dark:text-green-300",
          border: "border-green-300 dark:border-green-600",
        };
      case "role_level":
        return {
              bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-600",
        };
      case "department":
        return {
          bg: "bg-indigo-100 dark:bg-indigo-900/30",
          text: "text-indigo-700 dark:text-indigo-300",
          border: "border-indigo-300 dark:border-indigo-600",
        };
      case "size":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-200 dark:border-purple-700",
        };
      default:
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-200 dark:border-purple-700",
        };
    }
  };

  const colors = getPillColor(pill.type);

  return (
    <div ref={pillRef} className="relative">
      <div
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium ${
          pill.isActive
            ? `${colors.bg} ${colors.text} ${colors.border}`
            : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"
        } transition-all duration-200`}
      >
        <button
          onClick={() => onToggle(pill.id)}
          className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
            pill.isActive ? "bg-current border-current" : "border-gray-300"
          }`}
        >
          {pill['isActive'] && (
            <svg
              className="w-2 h-2 text-white"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <path
                d="M1.5 4l1.5 1.5L6.5 2"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <span className="capitalize">
          {pill.type}: {pill.value}
        </span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="ml-1 p-0.5 hover:bg-black/10 rounded transition-colors"
        >
          <ChevronDownIcon className="w-3 h-3" />
        </button>
        <button
          onClick={() => onRemove(pill.id)}
          className="ml-1 p-0.5 hover:bg-black/10 rounded transition-colors"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-48">
          <div className="p-2">
            <div className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wide">
              Alternative {pill.type}s
            </div>
            {pill.alternatives.map((alt, index) => (
              <button
                key={index}
                onClick={() => {
                  onUpdateValue(pill.id, alt);
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-2 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
