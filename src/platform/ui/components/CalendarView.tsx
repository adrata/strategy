"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Dialog from "@radix-ui/react-dialog";
import { useUnifiedAuth } from "@/platform/auth";
import { CalendarService, type ActionBlock } from "@/platform/services/calendar-service";
import { ActionBlockComponent } from "./ActionBlock";
import { Button } from "@/platform/shared/components/ui/button";

interface CalendarViewProps {
  onClose?: () => void;
}

// Time range configuration
const START_HOUR = 6; // 6 AM
const END_HOUR = 23; // 11 PM
const TIME_INCREMENT = 30; // 30 minutes
const MIN_DURATION_MINUTES = 15;

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
  return ((slotMinutes - startMinutes) / TIME_INCREMENT) * 60;
};

const getBlockHeight = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  return (duration / TIME_INCREMENT) * 60;
};

// Draggable Time Slot Component
interface TimeSlotProps {
  time: string;
  hour: number;
  minute: number;
  isHourStart: boolean;
  blockStartingHere: ActionBlock & { onResizeStart?: (block: ActionBlock, edge: "top" | "bottom", e: React.MouseEvent) => void } | undefined;
  onTimeSlotClick: (time: string) => void;
  onExecuteBlock: (id: string) => void;
  onCompleteBlock: (id: string) => void;
  onEditBlock: (block: ActionBlock) => void;
  onDeleteBlock: (id: string) => void;
  dragOverTime: string | null;
  isDragging: boolean;
  onResizeStart?: (block: ActionBlock, edge: "top" | "bottom", e: React.MouseEvent) => void;
  // Inline creation props
  inlineCreatingTime: string | null;
  inlineBlockTitle: string;
  onInlineTitleChange: (title: string) => void;
  onInlineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInlineBlur: () => void;
  inlineInputRef: React.RefObject<HTMLInputElement | null>;
}

const TimeSlot = React.memo(function TimeSlot({
  time,
  hour,
  minute,
  isHourStart,
  blockStartingHere,
  onTimeSlotClick,
  onExecuteBlock,
  onCompleteBlock,
  onEditBlock,
  onDeleteBlock,
  dragOverTime,
  isDragging,
  onResizeStart,
  inlineCreatingTime,
  inlineBlockTitle,
  onInlineTitleChange,
  onInlineKeyDown,
  onInlineBlur,
  inlineInputRef,
}: TimeSlotProps) {
  const isDragOver = dragOverTime === time;

  return (
    <div
      className="relative flex items-start border-b border-[var(--border)]"
      style={{ minHeight: "60px" }}
      data-time-slot={time}
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
        className={`flex-1 relative transition-colors ${
          isDragOver
            ? "bg-blue-100/50 dark:bg-blue-900/20"
            : "hover:bg-[var(--hover-bg)]/50"
        }`}
        onClick={(e) => {
          if (!isDragging) {
            onTimeSlotClick(time);
          }
        }}
        style={{ minHeight: "60px", cursor: isDragging ? "grabbing" : "pointer" }}
        role="button"
        tabIndex={0}
        aria-label={`Time slot ${time}`}
        data-time-slot={time}
        data-overlay-disabled="true"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTimeSlotClick(time);
          }
        }}
      >
        {/* Drop indicator line - enhanced visual feedback */}
        {isDragOver && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-30 rounded-full shadow-lg animate-pulse" />
        )}

        {/* Inline creating event */}
        {inlineCreatingTime === time && (
          <div
            className="inline-creating-event absolute left-0 right-2 top-1 z-20"
            style={{
              height: "52px", // Default 30-minute block height
            }}
          >
            <div className="relative w-full h-full rounded-lg border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
              <input
                ref={inlineInputRef}
                type="text"
                value={inlineBlockTitle}
                onChange={(e) => onInlineTitleChange(e.target.value)}
                onKeyDown={onInlineKeyDown}
                onBlur={onInlineBlur}
                placeholder="Event title"
                className="w-full h-full px-3 py-2 bg-transparent border-0 outline-none text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] rounded-lg"
                autoFocus
              />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/30 rounded-b-lg" />
            </div>
          </div>
        )}

        {/* Block starting at this slot */}
        {blockStartingHere && (
          <DraggableBlock
            block={blockStartingHere}
            onExecute={() => onExecuteBlock(blockStartingHere.id)}
            onComplete={() => onCompleteBlock(blockStartingHere.id)}
            onEdit={() => onEditBlock(blockStartingHere)}
            onDelete={() => onDeleteBlock(blockStartingHere.id)}
            onResizeStart={onResizeStart ? (block, edge, e) => onResizeStart(block, edge, e) : undefined}
          />
        )}
      </div>
    </div>
  );
});

// Draggable Block Component using dnd-kit
interface DraggableBlockProps {
  block: ActionBlock;
  onExecute: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResizeStart?: (block: ActionBlock, edge: "top" | "bottom", e: React.MouseEvent) => void;
}

const DraggableBlock = React.memo(function DraggableBlock({
  block,
  onExecute,
  onComplete,
  onEdit,
  onDelete,
  onResizeStart,
}: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const blockHeight = useMemo(
    () => getBlockHeight(block.startTime, block.endTime) - 8,
    [block.startTime, block.endTime]
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: "absolute",
        left: 0,
        right: "8px",
        top: "4px",
        height: `${blockHeight}px`,
        zIndex: isDragging ? 50 : 10,
      }}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={`Event: ${block.title} from ${block.startTime} to ${block.endTime}`}
      aria-describedby={`event-${block.id}-description`}
    >
      {/* Drag handle - center area, excluding resize handles and action buttons */}
      <div
        {...listeners}
        className="absolute inset-0 cursor-move pointer-events-auto"
        style={{
          top: "8px", // Exclude top resize handle area (h-2 = 8px)
          bottom: "8px", // Exclude bottom resize handle area (h-2 = 8px)
          zIndex: 1, // Behind action buttons but allows drag
        }}
      />
      
      <ActionBlockComponent
        block={block}
        onExecute={onExecute}
        onComplete={onComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        onResizeStart={onResizeStart ? (edge, e) => onResizeStart(block, edge, e) : undefined}
      />
      <div id={`event-${block.id}-description`} className="sr-only">
        {block.description || "No description"}
      </div>
    </div>
  );
});

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
  
  // Inline creation state
  const [inlineCreatingTime, setInlineCreatingTime] = useState<string | null>(null);
  const [inlineBlockTitle, setInlineBlockTitle] = useState("");
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<"top" | "bottom" | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeCurrentY, setResizeCurrentY] = useState(0);
  const [resizeBlock, setResizeBlock] = useState<ActionBlock | null>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { context }) => {
        if (!context.active) return { x: 0, y: 0 };
        const activeElement = context.active.data.current;
        if (!activeElement || !activeElement['block']) return { x: 0, y: 0 };

        const block = activeElement['block'] as ActionBlock;
        const currentSlotIndex = TIME_SLOTS.indexOf(block.startTime);
        if (currentSlotIndex === -1) return { x: 0, y: 0 };

        let newSlotIndex = currentSlotIndex;

        switch (event.code) {
          case "ArrowUp":
            newSlotIndex = Math.max(0, currentSlotIndex - 1);
            break;
          case "ArrowDown":
            newSlotIndex = Math.min(TIME_SLOTS.length - 1, currentSlotIndex + 1);
            break;
          case "Home":
            newSlotIndex = 0;
            break;
          case "End":
            newSlotIndex = TIME_SLOTS.length - 1;
            break;
        }

        const newTime = TIME_SLOTS[newSlotIndex]!;
        const newY = getSlotPosition(newTime);
        return { x: 0, y: newY };
      },
    })
  );

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

    const dateStr = formatDate(currentDate);
    setBlocks(CalendarService.getBlocksForDate(dateStr));
    setIsLoading(false);
    
    // Clear inline creation when date changes
    setInlineCreatingTime(null);
    setInlineBlockTitle("");

    return unsubscribe;
  }, [currentDate]);

  // Keyboard navigation for selected block
  useEffect(() => {
    if (!selectedBlockId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
      if (!selectedBlock) return;

      const currentSlotIndex = TIME_SLOTS.indexOf(selectedBlock.startTime);
      if (currentSlotIndex === -1) return;

      let newSlotIndex = currentSlotIndex;
      let shouldUpdate = false;

      if (e.key === "ArrowUp" && !e.shiftKey) {
        newSlotIndex = Math.max(0, currentSlotIndex - 1);
        shouldUpdate = true;
      } else if (e.key === "ArrowDown" && !e.shiftKey) {
        newSlotIndex = Math.min(TIME_SLOTS.length - 1, currentSlotIndex + 1);
        shouldUpdate = true;
      } else if (e.key === "Enter") {
        handleEditBlock(selectedBlock);
        return;
      } else if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteBlock(selectedBlockId);
        return;
      } else if (e.key === "Escape") {
        setSelectedBlockId(null);
        return;
      }

      if (shouldUpdate) {
        e.preventDefault();
        const newTime = TIME_SLOTS[newSlotIndex]!;
        const duration = timeToMinutes(selectedBlock.endTime) - timeToMinutes(selectedBlock.startTime);
        const newEndTime = minutesToTime(timeToMinutes(newTime) + duration);

        // Optimistic update
        const updatedBlock = { ...selectedBlock, startTime: newTime, endTime: newEndTime };
        setBlocks((prev) => prev.map((b) => (b.id === selectedBlockId ? updatedBlock : b)));

        // Check for conflicts and persist
        const result = CalendarService.updateBlock(selectedBlockId, {
          startTime: newTime,
          endTime: newEndTime,
        });

        if (!result.success && result.conflicts && result.conflicts.length > 0) {
          // Revert optimistic update
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === selectedBlockId
                ? {
                    ...selectedBlock,
                  }
                : b
            )
          );
          const conflictTitles = result.conflicts.map((c) => c.title).join(", ");
          announceChange(
            `Cannot move event - conflicts with: ${conflictTitles}`
          );
          return;
        }

        // Announce change
        announceChange(`Event moved to ${formatTimeForAnnouncement(newTime)}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBlockId, blocks]);

  // Announce changes for screen readers
  const announceChange = useCallback((message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, []);

  const formatTimeForAnnouncement = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Navigation
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousDay = () => {
    setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
  };

  const goToNextDay = () => {
    setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
  };

  // Handle time slot click - inline creation (Google Calendar/Cron style)
  const handleTimeSlotClick = (time: string) => {
    // Don't create if clicking on existing event or already creating
    if (getBlockStartingAtSlot(time) || inlineCreatingTime) {
      return;
    }
    
    const defaultEndTime = minutesToTime(timeToMinutes(time) + 30);
    setInlineCreatingTime(time);
    setInlineBlockTitle("");
    setNewBlock({
      title: "",
      startTime: time,
      endTime: defaultEndTime,
      description: "",
    });
    // Auto-focus input after state update
    setTimeout(() => {
      inlineInputRef.current?.focus();
    }, 0);
  };
  
  // Save inline created event
  const handleSaveInlineEvent = useCallback(() => {
    if (!inlineCreatingTime || !inlineBlockTitle.trim()) {
      // Cancel if no title
      setInlineCreatingTime(null);
      setInlineBlockTitle("");
      return;
    }
    
    const dateStr = formatDate(currentDate);
    const defaultEndTime = minutesToTime(timeToMinutes(inlineCreatingTime) + 30);
    const result = CalendarService.addBlock({
      title: inlineBlockTitle.trim(),
      startTime: inlineCreatingTime,
      endTime: defaultEndTime,
      date: dateStr,
      description: undefined,
    });
    
    if (!result.success && result.conflicts && result.conflicts.length > 0) {
      const conflictTitles = result.conflicts.map((c) => c.title).join(", ");
      alert(
        `Cannot add event - conflicts with: ${conflictTitles}. Please choose a different time.`
      );
      announceChange(`Conflict detected with ${result.conflicts.length} event(s)`);
      return;
    }
    
    announceChange(`Event "${inlineBlockTitle.trim()}" added`);
    setInlineCreatingTime(null);
    setInlineBlockTitle("");
  }, [inlineCreatingTime, inlineBlockTitle, currentDate, announceChange]);
  
  // Cancel inline creation
  const handleCancelInlineEvent = useCallback(() => {
    setInlineCreatingTime(null);
    setInlineBlockTitle("");
  }, []);
  
  // Handle keyboard events for inline creation
  const handleInlineKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle Enter and Escape - let all other keys (including Space) pass through normally
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveInlineEvent();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelInlineEvent();
    }
    // Don't prevent default for other keys like Space - let them type normally
  }, [handleSaveInlineEvent, handleCancelInlineEvent]);
  
  // Auto-save on blur (Google Calendar style)
  const handleInlineBlur = useCallback(() => {
    // Longer delay to ensure click events register and user has finished typing
    // Only save if there's actual content (not just whitespace)
    setTimeout(() => {
      if (inlineBlockTitle.trim()) {
        handleSaveInlineEvent();
      } else {
        handleCancelInlineEvent();
      }
    }, 200);
  }, [handleSaveInlineEvent, handleCancelInlineEvent, inlineBlockTitle]);
  
  // Handle click outside to save/cancel
  useEffect(() => {
    if (!inlineCreatingTime) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't cancel if clicking within the inline event block or on action buttons
      if (target.closest('.inline-creating-event') || target.closest('button')) {
        return;
      }
      // Delay slightly to allow button clicks to register
      setTimeout(() => {
        handleSaveInlineEvent();
      }, 100);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inlineCreatingTime, handleSaveInlineEvent]);

  // Handle add block
  const handleAddBlock = () => {
    if (!newBlock.title || !newBlock.startTime || !newBlock.endTime) {
      return;
    }

    const dateStr = formatDate(currentDate);
    const result = CalendarService.addBlock({
      title: newBlock.title,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      date: dateStr,
      description: newBlock.description || undefined,
    });

    if (!result.success && result.conflicts && result.conflicts.length > 0) {
      const conflictTitles = result.conflicts.map((c) => c.title).join(", ");
      alert(
        `Cannot add event - conflicts with: ${conflictTitles}. Please choose a different time.`
      );
      announceChange(`Conflict detected with ${result.conflicts.length} event(s)`);
      return;
    }

    announceChange(`Event "${newBlock.title}" added`);

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

    const result = CalendarService.updateBlock(editingBlock.id, {
      title: newBlock.title,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      description: newBlock.description || undefined,
    });

    if (!result.success && result.conflicts && result.conflicts.length > 0) {
      const conflictTitles = result.conflicts.map((c) => c.title).join(", ");
      alert(
        `Cannot update event - conflicts with: ${conflictTitles}. Please choose a different time.`
      );
      announceChange(`Conflict detected with ${result.conflicts.length} event(s)`);
      return;
    }

    if (!result.success) {
      alert("Failed to update event. Please try again.");
      return;
    }

    announceChange(`Event "${newBlock.title}" updated`);

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
    const block = blocks.find((b) => b.id === blockId);
        if (block && confirm(`Are you sure you want to delete "${block.title}"?`)) {
      CalendarService.deleteBlock(blockId);
          announceChange(`Event "${block.title}" deleted`);
          return;
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
  const getBlockStartingAtSlot = useCallback(
    (time: string): ActionBlock | undefined => {
    return blocks.find((block) => block.startTime === time);
    },
    [blocks]
  );

  // Calculate time slot from Y position with improved accuracy
  const getTimeFromY = useCallback((y: number): string | null => {
    if (!calendarGridRef.current) return null;

    const rect = calendarGridRef.current.getBoundingClientRect();
    // Account for padding at top (p-4 = 16px) and scroll position
    const scrollTop = calendarGridRef.current.scrollTop;
    const relativeY = y - rect.top + scrollTop - 16;
    
    // Each slot is 60px tall, calculate which slot we're in
    const slotIndex = Math.floor(relativeY / 60);
    
    // Clamp to valid range
    if (slotIndex < 0 || slotIndex >= TIME_SLOTS.length) return null;

    return TIME_SLOTS[slotIndex]!;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag over with improved time slot detection
  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!event.over) {
      setDragOverTime(null);
      return;
    }

    let detectedTime: string | null = null;

    // First, try to get time from the over element's data
    const overElement = event.over.data.current;
    if (overElement && overElement['timeSlot']) {
      detectedTime = overElement['timeSlot'] as string;
    } else {
      // Fallback: Calculate from mouse position
      const activatorEvent = event.activatorEvent as MouseEvent | undefined;
      if (activatorEvent) {
        // Use current mouse position for accurate detection
        detectedTime = getTimeFromY(activatorEvent.clientY);
      }
      
      // If that doesn't work, try finding the time slot element
      if (!detectedTime && activatorEvent) {
        const element = document.elementFromPoint(
          activatorEvent.clientX,
          activatorEvent.clientY
        );
        const timeSlot = element?.closest("[data-time-slot]");
        if (timeSlot) {
          detectedTime = timeSlot.getAttribute("data-time-slot");
        }
      }
    }

    setDragOverTime(detectedTime);
  }, [getTimeFromY]);

  // Handle drag end with improved drop target detection
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      
      const draggedBlock = blocks.find((b) => b.id === active.id);
      if (!draggedBlock) {
        setActiveId(null);
        setDragOverTime(null);
        return;
      }

      // Capture dragOverTime before clearing it
      const currentDragOverTime = dragOverTime;
      setActiveId(null);
      setDragOverTime(null);

      // Get drop target time - prefer currentDragOverTime if available, otherwise calculate
      let dropTime: string | null = currentDragOverTime;

      if (!dropTime && over) {
        const overElement = over.data.current;
        if (overElement && overElement['timeSlot']) {
          dropTime = overElement['timeSlot'] as string;
        }
      }

      // Final fallback: calculate from mouse position
      if (!dropTime) {
        const mouseEvent = event.activatorEvent as MouseEvent;
        if (mouseEvent) {
          dropTime = getTimeFromY(mouseEvent.clientY);
        }
      }

      if (!dropTime || dropTime === draggedBlock.startTime) return;

      // Calculate new times
      const duration =
        timeToMinutes(draggedBlock.endTime) - timeToMinutes(draggedBlock.startTime);
      const newStartMinutes = timeToMinutes(dropTime);
      const newEndMinutes = newStartMinutes + duration;

      // Check bounds
      const lastSlotMinutes = timeToMinutes(TIME_SLOTS[TIME_SLOTS.length - 1]!);
      if (
        newEndMinutes <= lastSlotMinutes &&
        newStartMinutes >= timeToMinutes(TIME_SLOTS[0]!)
      ) {
        const newEndTime = minutesToTime(newEndMinutes);

        // Optimistic update
        const updatedBlock = {
          ...draggedBlock,
          startTime: dropTime,
          endTime: newEndTime,
        };
        setBlocks((prev) =>
          prev.map((b) => (b.id === draggedBlock.id ? updatedBlock : b))
        );

        // Check for conflicts and persist
        const result = CalendarService.updateBlock(draggedBlock.id, {
          startTime: dropTime,
          endTime: newEndTime,
        });

        if (!result.success && result.conflicts && result.conflicts.length > 0) {
          // Revert optimistic update
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === draggedBlock.id
                ? {
                    ...draggedBlock,
                  }
                : b
            )
          );
          const conflictTitles = result.conflicts.map((c) => c.title).join(", ");
          announceChange(
            `Cannot move event - conflicts with: ${conflictTitles}`
          );
          return;
        }

        announceChange(
          `Event "${draggedBlock.title}" moved to ${formatTimeForAnnouncement(dropTime)}`
        );
      }
    },
    [blocks, dragOverTime, getTimeFromY, announceChange]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (block: ActionBlock, edge: "top" | "bottom", e: React.MouseEvent) => {
      e.stopPropagation();
      setResizeBlock(block);
      setResizeEdge(edge);
      setResizeStartY(e.clientY);
      setResizeCurrentY(e.clientY);
      setIsResizing(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = edge === "top" ? "n-resize" : "s-resize";
    },
    []
  );

  // Handle resize move
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeBlock || !resizeEdge) return;
    setResizeCurrentY(e.clientY);
  }, [isResizing, resizeBlock, resizeEdge]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    if (!isResizing || !resizeBlock || !resizeEdge) return;

    const newTime = getTimeFromY(resizeCurrentY);
    if (!newTime) {
      setIsResizing(false);
      setResizeBlock(null);
      setResizeEdge(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      return;
    }

    const currentStartMinutes = timeToMinutes(resizeBlock.startTime);
    const currentEndMinutes = timeToMinutes(resizeBlock.endTime);
    const newTimeMinutes = timeToMinutes(newTime);

    let newStartTime = resizeBlock.startTime;
    let newEndTime = resizeBlock.endTime;

    if (resizeEdge === "top") {
      // Resizing top edge - change start time
      const minStartMinutes = timeToMinutes(TIME_SLOTS[0]!);
      if (
        newTimeMinutes < currentEndMinutes &&
        newTimeMinutes >= minStartMinutes
      ) {
        // Ensure minimum duration
        const duration = currentEndMinutes - newTimeMinutes;
        if (duration >= MIN_DURATION_MINUTES) {
          newStartTime = newTime;
        }
      }
    } else {
      // Resizing bottom edge - change end time
      const maxEndMinutes = timeToMinutes(TIME_SLOTS[TIME_SLOTS.length - 1]!);
      if (
        newTimeMinutes > currentStartMinutes &&
        newTimeMinutes <= maxEndMinutes
      ) {
        // Ensure minimum duration
        const duration = newTimeMinutes - currentStartMinutes;
        if (duration >= MIN_DURATION_MINUTES) {
          newEndTime = newTime;
        }
      }
    }

    if (
      newStartTime !== resizeBlock.startTime ||
      newEndTime !== resizeBlock.endTime
    ) {
      // Optimistic update
      const updatedBlock = {
        ...resizeBlock,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      setBlocks((prev) =>
        prev.map((b) => (b.id === resizeBlock.id ? updatedBlock : b))
      );

      // Check for conflicts and persist
      const result = CalendarService.updateBlock(resizeBlock.id, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      if (!result.success && result.conflicts && result.conflicts.length > 0) {
        // Revert optimistic update
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === resizeBlock.id
              ? {
                  ...resizeBlock,
                }
              : b
          )
        );
        const conflictTitles = result.conflicts.map((c) => c.title).join(", ");
        announceChange(
          `Cannot resize event - conflicts with: ${conflictTitles}`
        );
        return;
      }

      announceChange(
        `Event "${resizeBlock.title}" resized to ${formatTimeForAnnouncement(
          newStartTime
        )} - ${formatTimeForAnnouncement(newEndTime)}`
      );
    }

    setIsResizing(false);
    setResizeBlock(null);
    setResizeEdge(null);
    setResizeStartY(0);
    setResizeCurrentY(0);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, [
    isResizing,
    resizeBlock,
    resizeEdge,
    resizeCurrentY,
    getTimeFromY,
    announceChange,
  ]);

  // Set up resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
    return undefined;
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Memoized blocks array for SortableContext
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  // Active block being dragged
  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === activeId),
    [blocks, activeId]
  );

  const isToday = formatDate(currentDate) === formatDate(new Date());

  return (
    <div className="h-full flex flex-col bg-[var(--background)]" role="application" aria-label="Calendar">
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]" id="calendar-title">
                Calendar
              </h1>
              <p className="text-sm text-[var(--muted)]" aria-live="polite">
                {formatDisplayDate(currentDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
              title="Previous day"
              aria-label="Go to previous day"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
            <Button
              variant={isToday ? "default" : "secondary"}
              onClick={goToToday}
              aria-label={isToday ? "Today (current day)" : "Go to today"}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              title="Next day"
              aria-label="Go to next day"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex-1 overflow-y-auto"
          ref={calendarGridRef}
          role="grid"
          aria-labelledby="calendar-title"
        >
        <div className="relative p-4">
            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {/* Time slots */}
          <div className="space-y-0">
                {TIME_SLOTS.map((time) => {
              const hour = parseInt(time.split(":")[0]!);
              const minute = parseInt(time.split(":")[1]!);
              const isHourStart = minute === 0;
              const blockStartingHere = getBlockStartingAtSlot(time);

                  const blockWithResize =
                    blockStartingHere && blockStartingHere.id === resizeBlock?.id
                      ? {
                          ...blockStartingHere,
                          onResizeStart: (edge: "top" | "bottom", e: React.MouseEvent) =>
                            handleResizeStart(blockStartingHere, edge, e),
                        }
                      : blockStartingHere
                      ? {
                          ...blockStartingHere,
                          onResizeStart: (edge: "top" | "bottom", e: React.MouseEvent) =>
                            handleResizeStart(blockStartingHere, edge, e),
                        }
                      : undefined;

              return (
                    <TimeSlot
                  key={time}
                      time={time}
                      hour={hour}
                      minute={minute}
                      isHourStart={isHourStart}
                      blockStartingHere={blockStartingHere ? { ...blockStartingHere, onResizeStart: undefined } : undefined}
                      onTimeSlotClick={handleTimeSlotClick}
                      onExecuteBlock={handleExecuteBlock}
                      onCompleteBlock={handleCompleteBlock}
                      onEditBlock={handleEditBlock}
                      onDeleteBlock={handleDeleteBlock}
                      dragOverTime={dragOverTime}
                      isDragging={!!activeId || isResizing}
                      onResizeStart={handleResizeStart}
                      inlineCreatingTime={inlineCreatingTime}
                      inlineBlockTitle={inlineBlockTitle}
                      onInlineTitleChange={setInlineBlockTitle}
                      onInlineKeyDown={handleInlineKeyDown}
                      onInlineBlur={handleInlineBlur}
                      inlineInputRef={inlineInputRef}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>
                  </div>

        <DragOverlay>
          {activeBlock ? (
            <div
                        style={{
                width: "300px",
                opacity: 0.8,
                        }}
                      >
                        <ActionBlockComponent
                block={activeBlock}
                onExecute={() => {}}
                onComplete={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging={true}
                        />
                      </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit Modal with Radix Dialog */}
      <Dialog.Root open={showAddModal} onOpenChange={setShowAddModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-xl z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
                {editingBlock ? "Edit Action Block" : "Add Action Block"}
              </Dialog.Title>
              <Dialog.Close asChild>
              <button
                className="p-1 hover:bg-[var(--hover-bg)] rounded transition-colors"
                  aria-label="Close dialog"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
              </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-sm font-medium text-[var(--foreground)] mb-1"
                >
                  Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={newBlock.title}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, title: e.target.value })
                  }
                  placeholder="Action title"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                  aria-required="true"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="event-start-time"
                    className="block text-sm font-medium text-[var(--foreground)] mb-1"
                  >
                    Start Time
                  </label>
                  <input
                    id="event-start-time"
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label
                    htmlFor="event-end-time"
                    className="block text-sm font-medium text-[var(--foreground)] mb-1"
                  >
                    End Time
                  </label>
                  <input
                    id="event-end-time"
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    aria-required="true"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="block text-sm font-medium text-[var(--foreground)] mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="event-description"
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
                <Dialog.Close asChild>
                <button
                    className="flex-1 px-4 py-2 bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                  onClick={() => {
                    setEditingBlock(null);
                    setNewBlock({
                      title: "",
                      startTime: "",
                      endTime: "",
                      description: "",
                    });
                  }}
                >
                  Cancel
                </button>
                </Dialog.Close>
                <button
                  onClick={editingBlock ? handleUpdateBlock : handleAddBlock}
                  disabled={!newBlock.title || !newBlock.startTime || !newBlock.endTime}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-disabled={
                    !newBlock.title || !newBlock.startTime || !newBlock.endTime
                  }
                >
                  {editingBlock ? "Update" : "Add"} Block
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
