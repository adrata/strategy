"use client";

import React, { useState } from "react";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminderAt: Date, note?: string) => Promise<void>;
  recordName: string;
  recordType: string;
}

export function SetReminderModal({
  isOpen,
  onClose,
  onSave,
  recordName,
  recordType,
}: SetReminderModalProps) {
  const [selectedQuickOption, setSelectedQuickOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const getQuickOptionDate = (option: string): Date => {
    const now = new Date();
    switch (option) {
      case "in-an-hour":
        return new Date(now.getTime() + 60 * 60 * 1000);
      case "end-of-day":
        const endOfDay = new Date(now);
        endOfDay.setHours(17, 0, 0, 0); // 5 PM
        if (endOfDay < now) {
          endOfDay.setDate(endOfDay.getDate() + 1); // If past 5 PM, set for tomorrow
        }
        return endOfDay;
      case "tomorrow":
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
        return tomorrow;
      default:
        return now;
    }
  };

  const handleQuickOptionSelect = (option: string) => {
    setSelectedQuickOption(option);
    setCustomDate("");
    setCustomTime("");
  };

  const handleCustomDateTimeChange = () => {
    setSelectedQuickOption(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let reminderAt: Date;

      if (selectedQuickOption) {
        reminderAt = getQuickOptionDate(selectedQuickOption);
      } else if (customDate && customTime) {
        const dateTimeString = `${customDate}T${customTime}`;
        reminderAt = new Date(dateTimeString);
        if (isNaN(reminderAt.getTime())) {
          alert("Please enter a valid date and time");
          setIsSaving(false);
          return;
        }
      } else {
        alert("Please select a quick option or enter a custom date and time");
        setIsSaving(false);
        return;
      }

      // Validate that the reminder is in the future
      if (reminderAt <= new Date()) {
        alert("Please select a date and time in the future");
        setIsSaving(false);
        return;
      }

      await onSave(reminderAt, note || undefined);
      // Reset form
      setSelectedQuickOption(null);
      setCustomDate("");
      setCustomTime("");
      setNote("");
      onClose();
    } catch (error) {
      console.error("Failed to save reminder:", error);
      alert("Failed to save reminder. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get current date/time for min values
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl border border-border w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-foreground" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Set Reminder</h2>
              <p className="text-sm text-muted">
                {recordType === "people" ? "Person" : "Company"}: {recordName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Options */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Quick Options
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleQuickOptionSelect("in-an-hour")}
                className={`px-4 py-3 text-left rounded-lg border transition-colors ${
                  selectedQuickOption === "in-an-hour"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-hover border-border text-foreground hover:bg-panel-background"
                }`}
              >
                <div className="font-medium">In an hour</div>
                <div className="text-xs text-muted mt-1">
                  {new Date(now.getTime() + 60 * 60 * 1000).toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => handleQuickOptionSelect("end-of-day")}
                className={`px-4 py-3 text-left rounded-lg border transition-colors ${
                  selectedQuickOption === "end-of-day"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-hover border-border text-foreground hover:bg-panel-background"
                }`}
              >
                <div className="font-medium">End of day</div>
                <div className="text-xs text-muted mt-1">
                  {(() => {
                    const endOfDay = getQuickOptionDate("end-of-day");
                    return endOfDay.toLocaleString();
                  })()}
                </div>
              </button>
              <button
                onClick={() => handleQuickOptionSelect("tomorrow")}
                className={`px-4 py-3 text-left rounded-lg border transition-colors ${
                  selectedQuickOption === "tomorrow"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-hover border-border text-foreground hover:bg-panel-background"
                }`}
              >
                <div className="font-medium">Tomorrow</div>
                <div className="text-xs text-muted mt-1">
                  {getQuickOptionDate("tomorrow").toLocaleString()}
                </div>
              </button>
            </div>
          </div>

          {/* Custom Date/Time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Or choose a specific date and time
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">Date</label>
                <input
                  type="date"
                  value={customDate}
                  min={currentDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    handleCustomDateTimeChange();
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Time</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    handleCustomDateTimeChange();
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this reminder..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground hover:bg-hover rounded-md transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (!selectedQuickOption && (!customDate || !customTime))}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Set Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

