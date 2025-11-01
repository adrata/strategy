"use client";

import React, { useState } from "react";
import {
  PlayIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import type { ActionBlock } from "@/platform/services/calendar-service";

interface ActionBlockProps {
  block: ActionBlock;
  onExecute: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export function ActionBlockComponent({
  block,
  onExecute,
  onComplete,
  onEdit,
  onDelete,
  isDragging = false,
  style,
}: ActionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate duration in minutes
  const startMinutes =
    parseInt(block.startTime.split(":")[0]) * 60 +
    parseInt(block.startTime.split(":")[1]);
  const endMinutes =
    parseInt(block.endTime.split(":")[0]) * 60 +
    parseInt(block.endTime.split(":")[1]);
  const durationMinutes = endMinutes - startMinutes;

  // Determine status colors
  const getStatusColor = () => {
    switch (block.status) {
      case "completed":
        return "bg-green-500/20 border-green-500/50";
      case "in-progress":
        return "bg-blue-500/20 border-blue-500/50";
      default:
        return "bg-purple-500/20 border-purple-500/50";
    }
  };

  const getStatusTextColor = () => {
    switch (block.status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-blue-600";
      default:
        return "text-purple-600";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div
      style={style}
      className={`
        relative w-full rounded-lg border-2 p-2 cursor-pointer transition-all
        ${getStatusColor()}
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${isHovered ? "shadow-lg scale-[1.02]" : "shadow-sm"}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status indicator */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {block.status === "completed" ? (
            <CheckCircleIconSolid className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                block.status === "in-progress" ? "bg-blue-600" : "bg-purple-600"
              }`}
            />
          )}
          <h4
            className={`font-semibold text-sm truncate ${getStatusTextColor()}`}
          >
            {block.title}
          </h4>
        </div>

        {/* Action buttons - shown on hover */}
        {isHovered && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {block.status !== "completed" && (
              <>
                {block.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecute();
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Execute"
                  >
                    <PlayIcon className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                )}
                {block.status === "in-progress" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete();
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Complete"
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        )}
      </div>

      {/* Time and duration */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <ClockIcon className="w-3 h-3" />
        <span>
          {block.startTime} - {block.endTime}
        </span>
        <span className="text-gray-400">•</span>
        <span>{formatDuration(durationMinutes)}</span>
      </div>

      {/* Description */}
      {block.description && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {block.description}
        </p>
      )}
    </div>
  );
}

