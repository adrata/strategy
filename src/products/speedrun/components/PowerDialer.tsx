"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  PhoneIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  PowerDialerProps,
  CallState,
  CallOutcome,
  ForwardingStatus,
} from "./PowerDialerTypes";
import { PhoneNumberService } from "@/platform/services/phoneNumberService";
import { CallbackForwardingService } from "@/platform/services/callback-forwarding-service";

// Extracted PowerDialer Header Component
function PowerDialerHeader({
  callState,
  contacts,
  forwardingStatus,
  togglePause,
  onDialerClose,
}: {
  callState: CallState;
  contacts: any[];
  forwardingStatus: ForwardingStatus | null;
  togglePause: () => void;
  onDialerClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
          <PhoneIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Power Dialer
          </h2>
          <p className="text-muted text-sm">
            Contact {callState.currentContact + 1} of {contacts.length}
          </p>
          {forwardingStatus && (
            <div
              className={`text-xs mt-1 flex items-center gap-1 ${
                forwardingStatus.enabled ? "text-green-600" : "text-yellow-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  forwardingStatus.enabled ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              {forwardingStatus.message}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={togglePause}
          className="p-2 hover:bg-hover rounded-lg transition-colors"
        >
          {callState.isPaused ? (
            <PlayIcon className="w-5 h-5 text-foreground" />
          ) : (
            <PauseIcon className="w-5 h-5 text-foreground" />
          )}
        </button>
        <button
          onClick={onDialerClose}
          className="p-2 hover:bg-hover rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}

// Extracted Contact Card Component
function PowerDialerContact({ contact }: { contact: any }) {
  return (
    <div className="bg-hover rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            {contact.name}
          </h3>
          <p className="text-muted">
            {contact.title} at {contact.company}
          </p>
          <p className="text-muted text-sm mt-1">{contact.phone}</p>
        </div>
        <div className="text-right">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              contact['priority'] === "High"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : contact['priority'] === "Medium"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            }`}
          >
            {contact.priority} Priority
          </span>
        </div>
      </div>
      <div className="text-sm text-muted">
        <span className="font-medium">Next Action:</span> {contact.nextAction}
      </div>
    </div>
  );
}

// Extracted Progress Bar Component
function PowerDialerProgress({
  callState,
  contacts,
}: {
  callState: CallState;
  contacts: any[];
}) {
  return (
    <div className="bg-hover rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Progress
        </span>
        <span className="text-sm text-muted">
          {callState.currentContact + 1}/{contacts.length}
        </span>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((callState.currentContact + 1) / contacts.length) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

// Extracted Call Status Component
function PowerDialerCallStatus({
  callState,
  currentContact,
  startCall,
  setCallOutcome,
  setNotes,
  formatDuration,
}: {
  callState: CallState;
  currentContact: any;
  startCall: () => void;
  setCallOutcome: (outcome: CallOutcome) => void;
  setNotes: (notes: string) => void;
  formatDuration: (seconds: number) => string;
}) {
  const handleOutcomeAndComplete = (outcome: CallOutcome, notes: string) => {
    setCallOutcome(outcome);
    setNotes(notes);
  };

  return (
    <div className="flex items-center justify-center mb-6">
      {callState['status'] === "idle" && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startCall}
            disabled={callState.isPaused}
            className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors shadow-lg"
          >
            <PhoneIcon className="w-6 h-6" />
            Call {currentContact.name}
          </button>

          <div className="text-center">
            <p className="text-xs text-muted mb-2">
              📞 Native calling: Direct computer-to-phone via Twilio WebRTC
            </p>
          </div>
        </div>
      )}

      {callState['status'] === "dialing" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-xl">
            <PhoneIcon className="w-6 h-6 animate-pulse" />
            📞 Initializing call...
          </div>
          <div className="text-center">
            <p className="text-sm text-muted">
              Setting up WebRTC connection...
            </p>
          </div>
        </div>
      )}

      {callState['status'] === "ringing" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-xl">
            <PhoneIcon className="w-6 h-6 animate-pulse" />
            📞 Calling {currentContact.name}...
          </div>

          <div className="text-center mb-4">
            <p className="text-sm text-foreground font-medium mb-2">
              📞 {currentContact.name}&apos;s phone is ringing!
            </p>
          </div>

          <div className="bg-hover rounded-lg p-4 w-full">
            <p className="text-sm font-medium text-foreground mb-3 text-center">
              What happened with the call?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "connected",
                    "Call answered - connected successfully",
                  )
                }
                className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                ✅ They Answered
              </button>
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "voicemail",
                    "Call went to voicemail",
                  )
                }
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                📧 Voicemail
              </button>
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "no-answer",
                    "No answer - phone rang but not picked up",
                  )
                }
                className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                📵 No Answer
              </button>
              <button
                onClick={() =>
                  handleOutcomeAndComplete("busy", "Busy signal received")
                }
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                📞 Busy Signal
              </button>
            </div>
          </div>
        </div>
      )}

      {callState['status'] === "connected" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-8 py-4 bg-green-500 text-white rounded-xl">
            <PhoneIcon className="w-6 h-6" />
            🎉 Connected - You&apos;re talking to {currentContact.name}!
          </div>

          <div className="text-center mb-4">
            <p className="text-sm text-foreground font-medium mb-2">
              💻 {currentContact.name} answered - you&apos;re connected!
            </p>
            <p className="text-xs text-muted">
              Duration: {formatDuration(callState.callDuration)}
            </p>
          </div>

          <div className="bg-hover rounded-lg p-4 w-full">
            <p className="text-sm font-medium text-foreground mb-3 text-center">
              How did the call go?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "connected",
                    "Successfully connected and spoke with contact",
                  )
                }
                className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                ✅ Great Conversation
              </button>
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "pitched",
                    "Pitched our services successfully",
                  )
                }
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                🎯 Pitched Services
              </button>
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "demo-scheduled",
                    "Scheduled a demo meeting",
                  )
                }
                className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                📅 Demo Scheduled
              </button>
              <button
                onClick={() =>
                  handleOutcomeAndComplete(
                    "callback-later",
                    "Need to call back at a better time",
                  )
                }
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                📞 Call Back Later
              </button>
            </div>
          </div>
        </div>
      )}

      {callState['status'] === "error" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white rounded-xl">
            <XMarkIcon className="w-6 h-6" />❌ Call Failed
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
              {callState.error || "Call failed"}
            </p>
            <p className="text-xs text-muted">
              Please check connection and try again
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Main PowerDialer Component
export function PowerDialer({
  contacts,
  onCallComplete,
  onDialerClose,
  userId,
  workspaceId,
}: PowerDialerProps) {
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    currentContact: 0,
    callStartTime: null,
    callDuration: 0,
    isPaused: false,
  });

  const [notes, setNotes] = useState("");
  const [isAutoAdvance, setIsAutoAdvance] = useState(true);
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);
  const [delayBetweenCalls, setDelayBetweenCalls] = useState(30);
  const [autoAdvanceTimer, setAutoAdvanceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [forwardingStatus, setForwardingStatus] =
    useState<ForwardingStatus | null>(null);

  const phoneService = useRef(new PhoneNumberService());
  const forwardingService = useRef(new CallbackForwardingService());

  const currentContact = contacts[callState.currentContact];

  // Check callback forwarding status on mount
  useEffect(() => {
    const checkForwardingStatus = async () => {
      try {
        const status =
          await forwardingService.current.getForwardingStatus(userId);
        setForwardingStatus(status);
      } catch (error) {
        console.error("Error checking forwarding status:", error);
        setForwardingStatus({
          enabled: false,
          message: "⚠️ Callback forwarding not configured",
        });
      }
    };

    checkForwardingStatus();
  }, [userId]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start calling
  const startCall = useCallback(async () => {
    if (!currentContact) return;
    setCallState((prev) => ({ ...prev, status: "dialing" }));

    // Simulate call progression (in real app, this would be handled by WebRTC)
    setTimeout(() => {
      setCallState((prev) => ({ ...prev, status: "ringing" }));
    }, 2000);
  }, [currentContact]);

  // Complete call
  const completeCall = useCallback(async () => {
    if (!currentContact || !callOutcome) return;

    console.log(
      `🔄 [PowerDialer] Completing call for ${currentContact.name} with outcome: ${callOutcome}`,
    );

    // Send call data to parent for UI updates
    onCallComplete(currentContact.id, notes, callOutcome);

    // Save call record (desktop only)
    try {
      if (typeof window !== "undefined" && window.__TAURI__) {
        await window.__TAURI__.invoke("save_call_record", {
          contactId: currentContact.id.toString(),
          callSid: callState.callSid || `manual_${Date.now()}`,
          outcome: callOutcome,
          notes: notes || `${callOutcome} - Power dialer call`,
          duration: callState.duration || 0,
          userId: userId,
          workspaceId: workspaceId,
        });

        await window.__TAURI__.invoke("complete_speedrun_lead", {
          workspaceId: workspaceId,
          userId: userId,
          contactId: currentContact.id.toString(),
          outcome: callOutcome,
          notes: notes || `Completed via power dialer - ${callOutcome}`,
        });
      }
    } catch (error) {
      console.error("❌ [PowerDialer] Error saving call data:", error);
    }

    // Reset and advance
    setNotes("");
    setCallOutcome(null);

    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }

    if (callState.currentContact < contacts.length - 1) {
      setCallState((prev) => ({
        ...prev,
        currentContact: prev.currentContact + 1,
        status: "idle",
        callStartTime: null,
        callDuration: 0,
      }));

      if (isAutoAdvance && !callState.isPaused) {
        const timer = setTimeout(() => {
          startCall();
        }, delayBetweenCalls * 1000);
        setAutoAdvanceTimer(timer);
      }
    } else {
      onDialerClose();
    }
  }, [
    currentContact,
    callOutcome,
    notes,
    onCallComplete,
    callState.currentContact,
    callState.callSid,
    callState.duration,
    callState.isPaused,
    contacts.length,
    isAutoAdvance,
    delayBetweenCalls,
    onDialerClose,
    startCall,
    autoAdvanceTimer,
  ]);

  // Toggle pause
  const togglePause = useCallback(() => {
    const newPausedState = !callState.isPaused;
    setCallState((prev) => ({ ...prev, isPaused: newPausedState }));

    if (newPausedState && autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  }, [callState.isPaused, autoAdvanceTimer]);

  // Handle outcome changes
  useEffect(() => {
    if (callOutcome && callState['status'] === "ringing") {
      setCallState((prev) => ({ ...prev, status: "complete" }));
    }
  }, [callOutcome, callState.status]);

  if (!currentContact) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full">
        <PowerDialerHeader
          callState={callState}
          contacts={contacts}
          forwardingStatus={forwardingStatus}
          togglePause={togglePause}
          onDialerClose={onDialerClose}
        />

        <div className="p-6">
          <PowerDialerContact contact={currentContact} />

          <PowerDialerCallStatus
            callState={callState}
            currentContact={currentContact}
            startCall={startCall}
            setCallOutcome={setCallOutcome}
            setNotes={setNotes}
            formatDuration={formatDuration}
          />

          {/* Call Notes - only show when completing */}
          {callState['status'] === "complete" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Call Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this call..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={completeCall}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                  Next Contact
                </button>
              </div>
            </div>
          )}

          <PowerDialerProgress callState={callState} contacts={contacts} />

          {/* Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isAutoAdvance}
                  onChange={(e) => setIsAutoAdvance(e.target.checked)}
                  className="rounded border-border"
                />
                Auto-advance to next contact
              </label>
              {callState['isPaused'] && (
                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  Dialer Paused
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-foreground font-medium">
                Delay between calls:
              </label>
              <select
                value={delayBetweenCalls}
                onChange={(e) => setDelayBetweenCalls(Number(e.target.value))}
                className="px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
