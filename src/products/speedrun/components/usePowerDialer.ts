import { useState, useEffect, useCallback, useRef } from "react";
import {
  PowerDialerProps,
  CallState,
  CallOutcome,
  ForwardingStatus,
  PowerDialerContact,
  PowerDialerSettings,
} from "./PowerDialerTypes";
import { PowerDialerCallService } from "./PowerDialerCallService";
import { PhoneNumberService } from "@/platform/services/phoneNumberService";
import { CallbackForwardingService } from "@/platform/services/callback-forwarding-service";

export function usePowerDialer({
  contacts,
  onCallComplete,
  onDialerClose,
  userId,
}: PowerDialerProps) {
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    currentContact: 0,
    callStartTime: null,
    callDuration: 0,
    isPaused: false,
  });

  const [notes, setNotes] = useState("");
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);
  const [callAnswered, setCallAnswered] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [forwardingStatus, setForwardingStatus] =
    useState<ForwardingStatus | null>(null);

  const [settings, setSettings] = useState<PowerDialerSettings>({
    isAutoAdvance: true,
    delayBetweenCalls: 30, // Default 30 seconds
  });

  const phoneService = useRef(new PhoneNumberService());
  const forwardingService = useRef(new CallbackForwardingService());
  const callService = useRef(new PowerDialerCallService());
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          message:
            "⚠️ Callback forwarding not configured. Return calls may not reach you.",
        });
      }
    };

    checkForwardingStatus();
  }, [userId]);

  // Handle call state changes from call service
  const handleCallStateChange = useCallback((newState: Partial<CallState>) => {
    setCallState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Start calling the current contact
  const startCall = useCallback(async () => {
    if (!currentContact) return;

    setCallState((prev) => ({ ...prev, status: "dialing" }));

    try {
      console.log(
        `📞 [PowerDialer] Making smart call to ${currentContact.name}`,
      );

      // Smart calling: Try WebRTC first, fallback to API
      await callService.current.makeComputerToPhoneCall({
        contact: currentContact,
        userId,
        onStateChange: handleCallStateChange,
      });
    } catch (error: any) {
      console.error("❌ [PowerDialer] Failed to make call:", error);
      setCallState((prev) => ({
        ...prev,
        status: "error",
        error: error?.message || error?.toString() || "Call failed",
      }));
    }
  }, [currentContact, userId, handleCallStateChange]);

  // Complete current call and advance
  const completeCall = useCallback(async () => {
    if (!currentContact || !callOutcome) return;

    console.log(
      `🔄 [PowerDialer] Completing call for ${currentContact.name} with outcome: ${callOutcome}`,
    );

    // Send call data to parent for UI updates
    onCallComplete(currentContact.id, notes, callOutcome);

    // Save call record and complete lead via call service
    await callService.current.saveCallRecord(
      currentContact.id,
      callState.callSid || `manual_${Date.now()}`,
      callOutcome,
      notes,
      callState.duration || 0,
      userId,
    );

    // Reset call state for next call
    setNotes("");
    setCallOutcome(null);
    setCallAnswered(false);

    // Clear any active timers
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }

    // Move to next contact
    if (callState.currentContact < contacts.length - 1) {
      console.log(
        `➡️ [PowerDialer] Advancing to next contact (${callState.currentContact + 1}/${contacts.length})`,
      );
      setCallState((prev) => {
        // Create new state without optional fields
        const {
          callSid,
          fromNumber,
          startTime,
          connectedTime,
          duration,
          error,
          ...baseState
        } = prev;
        return {
          ...baseState,
          currentContact: baseState.currentContact + 1,
          status: "idle" as const,
          callStartTime: null,
          callDuration: 0,
        };
      });

      // Auto-start next call if enabled and not paused
      if (settings['isAutoAdvance'] && !callState.isPaused) {
        console.log(
          `⏳ [PowerDialer] Auto-advancing in ${settings.delayBetweenCalls} seconds...`,
        );
        const timer = setTimeout(() => {
          console.log(`🚀 [PowerDialer] Auto-starting next call`);
          startCall();
        }, settings.delayBetweenCalls * 1000);
        setAutoAdvanceTimer(timer);
      }
    } else {
      // Finished all contacts
      console.log("🎉 [PowerDialer] All contacts completed! Closing dialer...");
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
    settings.isAutoAdvance,
    settings.delayBetweenCalls,
    onDialerClose,
    startCall,
    autoAdvanceTimer,
    userId,
  ]);

  // Pause/Resume dialer
  const togglePause = useCallback(() => {
    const newPausedState = !callState.isPaused;
    setCallState((prev) => ({ ...prev, isPaused: newPausedState }));

    // Clear auto-advance timer if pausing
    if (newPausedState && autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
      console.log("⏸️ Dialer paused - auto-advance timer cleared");
    } else if (!newPausedState) {
      console.log("▶️ Dialer resumed");
    }
  }, [callState.isPaused, autoAdvanceTimer]);

  // Skip current contact
  const skipContact = useCallback(() => {
    setCallAnswered(false);
    setCallState((prev) => ({ ...prev, status: "complete" }));
    setNotes("Skipped during power dialing session");
    setCallOutcome("failed");
    setTimeout(completeCall, 500);
  }, [completeCall]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<PowerDialerSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  // Test calling system
  const testCallingSystem = useCallback(async () => {
    await callService.current.testCallingSystem();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const callServiceRef = callService.current;
    const timerRef = autoAdvanceTimerRef.current;

    return () => {
      callServiceRef.cleanup();
      if (timerRef) {
        clearTimeout(timerRef);
      }
    };
  }, []);

  return {
    // State
    callState,
    notes,
    callOutcome,
    callAnswered,
    forwardingStatus,
    settings,
    currentContact,

    // Actions
    startCall,
    completeCall,
    togglePause,
    skipContact,
    testCallingSystem,
    updateSettings,

    // Setters
    setNotes,
    setCallOutcome,
    setCallAnswered,

    // Utilities
    formatDuration: callService.current.formatDuration,
  };
}
