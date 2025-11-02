"use client";

import React, { useState, useCallback } from "react";
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
  onResizeStart?: (edge: "top" | "bottom", e: React.MouseEvent) => void;
}

export const ActionBlockComponent = React.memo(function ActionBlockComponent({
  block,
  onExecute,
  onComplete,
  onEdit,
  onDelete,
  isDragging = false,
  style,
  onResizeStart,
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

  const handleResizeMouseDown = useCallback(
    (edge: "top" | "bottom", e: React.MouseEvent) => {
      // Stop all propagation to prevent drag from starting
      e.stopPropagation();
      e.preventDefault();
      // Stop immediate propagation as well
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      if (onResizeStart) {
        onResizeStart(edge, e);
      }
    },
    [onResizeStart]
  );

  return (
    <div
      style={style}
      className={`
        relative w-full rounded-lg border-2 p-2 transition-all
        ${getStatusColor()}
        ${isDragging ? "opacity-50 scale-95 shadow-lg" : ""}
        ${isHovered && !isDragging ? "shadow-lg scale-[1.02]" : "shadow-sm"}
        ${!isDragging ? "cursor-move" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${block.title}, ${block.startTime} to ${block.endTime}`}
    >
      {/* Resize handles - visible on hover */}
      {onResizeStart && !isDragging && (
        <>
          {/* Top resize handle */}
          <div
            className={`absolute top-0 left-0 right-0 h-2 cursor-n-resize rounded-t-lg transition-opacity ${
              isHovered ? "opacity-100 bg-blue-500/30 hover:bg-blue-500/50" : "opacity-0"
            }`}
            onMouseDown={(e) => handleResizeMouseDown("top", e)}
            role="separator"
            aria-label="Resize event start time"
            aria-orientation="horizontal"
            title="Drag to change start time"
          />
          {/* Bottom resize handle */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-2 cursor-s-resize rounded-b-lg transition-opacity ${
              isHovered ? "opacity-100 bg-blue-500/30 hover:bg-blue-500/50" : "opacity-0"
            }`}
            onMouseDown={(e) => handleResizeMouseDown("bottom", e)}
            role="separator"
            aria-label="Resize event end time"
            aria-orientation="horizontal"
            title="Drag to change end time"
          />
        </>
      )}

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
        {isHovered && !isDragging && (
          <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
            {block.status !== "completed" && (
              <>
                {block.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onExecute();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Execute"
                    aria-label="Start this event"
                  >
                    <PlayIcon className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                )}
                {block.status === "in-progress" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onComplete();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Complete"
                    aria-label="Mark this event as complete"
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEdit();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Edit"
                  aria-label="Edit this event"
                >
                  <PencilIcon className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Delete"
              aria-label="Delete this event"
            >
              <TrashIcon className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        )}
      </div>

      {/* Time and duration */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <ClockIcon className="w-3 h-3" aria-hidden="true" />
        <span>
          {block.startTime} - {block.endTime}
        </span>
        <span className="text-gray-400" aria-hidden="true">
          •
        </span>
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
});
