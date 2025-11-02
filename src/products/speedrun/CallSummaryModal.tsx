"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useEscapeKey } from '@/platform/hooks/useEscapeKey';

interface CallSummaryModalProps {
  isOpen: boolean;
  contactName: string;
  contactCompany: string;
  onSummary: (outcome: CallOutcome, notes: string) => void;
  onClose: () => void;
}

type CallOutcome =
  | "connected"
  | "voicemail"
  | "no-answer"
  | "busy"
  | "pitched"
  | "demo-scheduled"
  | "not-interested"
  | "callback-later"
  | "wrong-number"
  | "failed";

const SUMMARY_OPTIONS = [
  {
    outcome: "connected" as CallOutcome,
    label: "They Answered",
    description: "Had a conversation with the contact",
    color: "bg-green-500 hover:bg-green-600",
    icon: PhoneIcon,
    category: "success",
  },
  {
    outcome: "pitched" as CallOutcome,
    label: "Successfully Pitched",
    description: "Presented solution, contact showed interest",
    color: "bg-blue-500 hover:bg-blue-600",
    icon: ChatBubbleLeftRightIcon,
    category: "success",
  },
  {
    outcome: "demo-scheduled" as CallOutcome,
    label: "Demo Scheduled",
    description: "Booked a follow-up meeting or demonstration",
    color: "bg-purple-500 hover:bg-purple-600",
    icon: CalendarDaysIcon,
    category: "success",
  },
  {
    outcome: "voicemail" as CallOutcome,
    label: "Voicemail",
    description: "Call went to voicemail (may have left message)",
    color: "bg-yellow-500 hover:bg-yellow-600",
    icon: PhoneIcon,
    category: "attempted",
  },
  {
    outcome: "no-answer" as CallOutcome,
    label: "No Answer",
    description: "Phone rang but nobody picked up",
    color: "bg-orange-500 hover:bg-orange-600",
    icon: PhoneIcon,
    category: "attempted",
  },
  {
    outcome: "busy" as CallOutcome,
    label: "Busy Signal",
    description: "Line was busy or engaged",
    color: "bg-red-500 hover:bg-red-600",
    icon: PhoneIcon,
    category: "attempted",
  },
  {
    outcome: "not-interested" as CallOutcome,
    label: "Not Interested",
    description: "Contact politely declined",
    color: "bg-panel-background0 hover:bg-gray-600",
    icon: XMarkIcon,
    category: "closure",
  },
  {
    outcome: "callback-later" as CallOutcome,
    label: "Callback Later",
    description: "Contact asked to be called back at specific time",
    color: "bg-indigo-500 hover:bg-indigo-600",
    icon: CalendarDaysIcon,
    category: "followup",
  },
  {
    outcome: "wrong-number" as CallOutcome,
    label: "Wrong Number",
    description: "Phone number was incorrect or invalid",
    color: "bg-gray-400 hover:bg-panel-background0",
    icon: XMarkIcon,
    category: "closure",
  },
  {
    outcome: "failed" as CallOutcome,
    label: "Call Failed",
    description: "Technical issue or network problem",
    color: "bg-red-400 hover:bg-red-500",
    icon: XMarkIcon,
    category: "technical",
  },
];

export function CallSummaryModal({
  isOpen,
  contactName,
  contactCompany,
  onSummary,
  onClose,
}: CallSummaryModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ESC key to close modal
  useEscapeKey(isOpen, onClose);

  const handleSubmit = async () => {
    if (!selectedOutcome) return;

    setIsSubmitting(true);
    try {
      await onSummary(selectedOutcome, notes);
      onClose();
    } catch (error) {
      console.error("Error submitting call summary:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = SUMMARY_OPTIONS.find(
    (opt) => opt['outcome'] === selectedOutcome,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <PhoneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Call Summary
              </h2>
              <p className="text-muted">
                How did the call go with{" "}
                <span className="font-medium">{contactName}</span>?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-2 hover:bg-hover rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="p-6 bg-hover border-b border-border">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {contactName}
              </h3>
              <p className="text-muted">{contactCompany}</p>
            </div>
          </div>
        </div>

        {/* Summary Options */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            What happened?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {SUMMARY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOutcome === option.outcome;

              return (
                <button
                  key={option.outcome}
                  onClick={() => setSelectedOutcome(option.outcome)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border hover:border-blue-300 hover:bg-hover"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${option.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {option.label}
                      </h4>
                      <p className="text-sm text-muted">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-background rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Call Notes {selectedOutcome && "(Optional)"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                selectedOutcome
                  ? `Add any notes about the ${selectedOption?.label.toLowerCase()} call...`
                  : "Select an outcome first..."
              }
              disabled={!selectedOutcome}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedOutcome || isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save & Continue
                  {selectedOutcome && (
                    <span className="ml-2 px-2 py-1 bg-background/20 rounded text-xs">
                      {selectedOption?.label}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
