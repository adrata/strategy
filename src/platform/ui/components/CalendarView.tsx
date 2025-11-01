"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUnifiedAuth } from "@/platform/auth";
import { CalendarService, type ActionBlock } from "@/platform/services/calendar-service";
import { ActionBlockComponent } from "./ActionBlock";

interface CalendarViewProps {
  onClose?: () => void;
}

// Time range configuration
const START_HOUR = 6; // 6 AM
const END_HOUR = 23; // 11 PM
const TIME_INCREMENT = 30; // 30 minutes

// Generate time slots
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_INCREMENT) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Helper functions
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

const getSlotPosition = (time: string): number => {
  const slotMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(TIME_SLOTS[0]!);
  return ((slotMinutes - startMinutes) / TIME_INCREMENT) * 60; // 60px per 30-minute slot
};

const getBlockHeight = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  return (duration / TIME_INCREMENT) * 60; // 60px per 30-minute slot
};

export function CalendarView({ onClose }: CalendarViewProps) {
  const { user: authUser } = useUnifiedAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blocks, setBlocks] = useState<ActionBlock[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ActionBlock | null>(null);
  const [newBlock, setNewBlock] = useState({
    title: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Drag and drop state
  const [draggedBlock, setDraggedBlock] = useState<ActionBlock | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<'top' | 'bottom' | null>(null);
  const [dragStartTime, setDragStartTime] = useState<string>('');
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // Initialize calendar service
  useEffect(() => {
    if (authUser?.id && authUser?.activeWorkspaceId) {
      CalendarService.initialize(authUser.id, authUser.activeWorkspaceId);
    }
  }, [authUser?.id, authUser?.activeWorkspaceId]);

  // Subscribe to calendar service changes
  useEffect(() => {
    const unsubscribe = CalendarService.subscribe(() => {
      const dateStr = formatDate(currentDate);
      setBlocks(CalendarService.getBlocksForDate(dateStr));
    });

    // Load initial blocks
    const dateStr = formatDate(currentDate);
    setBlocks(CalendarService.getBlocksForDate(dateStr));
    setIsLoading(false);

    return unsubscribe;
  }, [currentDate]);

  // Navigation
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousDay = () => {
    setCurrentDate(
      new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
    );
  };

  const goToNextDay = () => {
    setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
  };

  // Handle time slot click
  const handleTimeSlotClick = (time: string) => {
    const defaultEndTime = minutesToTime(timeToMinutes(time) + 30);
    setNewBlock({
      title: "",
      startTime: time,
      endTime: defaultEndTime,
      description: "",
    });
    setSelectedTimeSlot(time);
    setShowAddModal(true);
  };

  // Handle add block
  const handleAddBlock = () => {
    if (!newBlock.title || !newBlock.startTime || !newBlock.endTime) {
      return;
    }

    const dateStr = formatDate(currentDate);
    CalendarService.addBlock({
      title: newBlock.title,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      date: dateStr,
      description: newBlock.description || undefined,
    });

    // Reset form
    setNewBlock({
      title: "",
      startTime: "",
      endTime: "",
      description: "",
    });
    setShowAddModal(false);
    setSelectedTimeSlot(null);
  };

  // Handle edit block
  const handleEditBlock = (block: ActionBlock) => {
    setEditingBlock(block);
    setNewBlock({
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      description: block.description || "",
    });
    setShowAddModal(true);
  };

  // Handle update block
  const handleUpdateBlock = () => {
    if (!editingBlock || !newBlock.title || !newBlock.startTime || !newBlock.endTime) {
      return;
    }

    CalendarService.updateBlock(editingBlock.id, {
      title: newBlock.title,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      description: newBlock.description || undefined,
    });

    // Reset form
    setEditingBlock(null);
    setNewBlock({
      title: "",
      startTime: "",
      endTime: "",
      description: "",
    });
    setShowAddModal(false);
  };

  // Handle delete block
  const handleDeleteBlock = (blockId: string) => {
    if (confirm("Are you sure you want to delete this action block?")) {
      CalendarService.deleteBlock(blockId);
    }
  };

  // Handle execute block
  const handleExecuteBlock = (blockId: string) => {
    CalendarService.executeBlock(blockId);
  };

  // Handle complete block
  const handleCompleteBlock = (blockId: string) => {
    CalendarService.completeBlock(blockId);
  };

  // Get block that starts at this time slot
  const getBlockStartingAtSlot = (time: string): ActionBlock | undefined => {
    return blocks.find((block) => block.startTime === time);
  };

  const isToday = formatDate(currentDate) === formatDate(new Date());

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                Calendar
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {formatDisplayDate(currentDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
              title="Previous day"
            >
              <ChevronLeftIcon className="w-5 h-5 text-[var(--muted)]" />
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isToday
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--hover-bg)] text-[var(--foreground)] hover:bg-[var(--panel-background)]"
              }`}
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
              title="Next day"
            >
              <ChevronRightIcon className="w-5 h-5 text-[var(--muted)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative p-4">
          {/* Time slots */}
          <div className="space-y-0">
            {TIME_SLOTS.map((time, index) => {
              const hour = parseInt(time.split(":")[0]!);
              const minute = parseInt(time.split(":")[1]!);
              const isHourStart = minute === 0;
              const blockStartingHere = getBlockStartingAtSlot(time);

              return (
                <div
                  key={time}
                  className="relative flex items-start border-b border-[var(--border)]"
                  style={{ minHeight: "60px" }}
                >
                  {/* Time label */}
                  <div className="w-20 flex-shrink-0 pt-1">
                    {isHourStart && (
                      <span className="text-xs font-medium text-[var(--muted)]">
                        {hour === 12
                          ? "12 PM"
                          : hour > 12
                            ? `${hour - 12} PM`
                            : `${hour} AM`}
                      </span>
                    )}
                  </div>

                  {/* Time slot content */}
                  <div
                    className="flex-1 relative cursor-pointer hover:bg-[var(--hover-bg)]/50 transition-colors"
                    onClick={() => handleTimeSlotClick(time)}
                    style={{ minHeight: "60px" }}
                  >
                    {/* Block starting at this slot */}
                    {blockStartingHere && (
                      <div
                        className="absolute left-0 right-2 z-10"
                        style={{
                          top: "4px",
                          height: `${getBlockHeight(blockStartingHere.startTime, blockStartingHere.endTime) - 8}px`,
                        }}
                      >
                        <ActionBlockComponent
                          block={blockStartingHere}
                          onExecute={() => handleExecuteBlock(blockStartingHere.id)}
                          onComplete={() => handleCompleteBlock(blockStartingHere.id)}
                          onEdit={() => handleEditBlock(blockStartingHere)}
                          onDelete={() => handleDeleteBlock(blockStartingHere.id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {editingBlock ? "Edit Action Block" : "Add Action Block"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBlock(null);
                  setNewBlock({
                    title: "",
                    startTime: "",
                    endTime: "",
                    description: "",
                  });
                }}
                className="p-1 hover:bg-[var(--hover-bg)] rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newBlock.title}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, title: e.target.value })
                  }
                  placeholder="Action title"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newBlock.description}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, description: e.target.value })
                  }
                  placeholder="Add description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBlock(null);
                    setNewBlock({
                      title: "",
                      startTime: "",
                      endTime: "",
                      description: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingBlock ? handleUpdateBlock : handleAddBlock}
                  disabled={!newBlock.title || !newBlock.startTime || !newBlock.endTime}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingBlock ? "Update" : "Add"} Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

