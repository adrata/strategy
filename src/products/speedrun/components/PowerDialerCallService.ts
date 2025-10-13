import { PowerDialerContact, CallState, CallOutcome } from "./PowerDialerTypes";

export interface CallServiceParams {
  contact: PowerDialerContact;
  userId: string;
  onStateChange: (state: Partial<CallState>) => void;
}

export class PowerDialerCallService {
  private callTimerRef: NodeJS.Timeout | null = null;

  /**
   * Format call duration in MM:SS format
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Start call timer for connected calls
   */
  startCallTimer(
    callStartTime: Date,
    onStateChange: (state: Partial<CallState>) => void,
  ): void {
    if (this.callTimerRef) {
      clearInterval(this.callTimerRef);
    }

    this['callTimerRef'] = setInterval(() => {
      const callDuration = Math.floor(
        (Date.now() - callStartTime.getTime()) / 1000,
      );
      onStateChange({ callDuration });
    }, 1000);
  }

  /**
   * Stop call timer
   */
  stopCallTimer(): void {
    if (this.callTimerRef) {
      clearInterval(this.callTimerRef);
      this['callTimerRef'] = null;
    }
  }

  /**
   * PRODUCTION COMPUTER-TO-PHONE CALLING
   */
  async makeComputerToPhoneCall({
    contact,
    userId,
    onStateChange,
  }: CallServiceParams): Promise<void> {
    console.log(
      `📞 [PowerDialer] Making COMPUTER-TO-PHONE call to ${contact.name}`,
    );

    try {
      // Step 1: Validate and format phone number
      const phoneNumber = contact.phone;
      console.log("📞 [PowerDialer] Original phone number:", phoneNumber);

      // Clean and format phone number to E.164 format
      let formattedPhone = phoneNumber.replace(/\D/g, ""); // Remove all non-digits

      // Add country code if missing
      if (formattedPhone['length'] === 10) {
        formattedPhone = "1" + formattedPhone; // US/Canada
      }

      // Add + prefix for E.164
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }

      console.log("📞 [PowerDialer] Formatted phone number:", formattedPhone);

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formattedPhone)) {
        throw new Error(
          `Invalid phone number format: ${formattedPhone}. Please check the number and try again.`,
        );
      }

      // Step 2: Get Twilio access token for WebRTC
      const tokenResponse = await fetch("/api/v1/communications/phone/access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: `user_${userId}`,
          userId: userId,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          `Failed to get Twilio access token: ${errorData.details || tokenResponse.statusText}`,
        );
      }

      const { token } = await tokenResponse.json();
      console.log("🔐 [PowerDialer] Got Twilio access token");

      // Step 3: Wait for Twilio Voice SDK to be available
      let Device = (window as any).Twilio?.Device;

      // If not available immediately, wait up to 5 seconds for script to load
      if (!Device) {
        console.log("🔄 [PowerDialer] Waiting for Twilio Voice SDK to load...");
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total (100ms * 50)

        while (!Device && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          Device = (window as any).Twilio?.Device;
          attempts++;
        }
      }

      if (!Device) {
        console.error(
          "❌ [PowerDialer] Twilio object:",
          (window as any).Twilio,
        );
        console.error(
          "❌ [PowerDialer] Available on window:",
          Object.keys(window).filter(
            (key) => key.includes("twilio") || key.includes("Twilio"),
          ),
        );
        throw new Error(
          "Twilio Voice SDK not available. The twilio-voice.min.js file may not be loaded correctly. Please refresh the page and try again.",
        );
      }

      console.log("✅ [PowerDialer] Twilio Voice SDK loaded successfully!");

      // Step 4: Initialize Device with proper Voice SDK v2.x configuration
      const device = new Device(token, {
        logLevel: "debug",
        codecPreferences: ["opus", "pcmu"],
        fakeLocalDTMF: true,
        enableRingingState: true,
        closeProtection: true,
      });

      // Step 5: Set up device event handlers
      device.on("registered", () => {
        console.log(
          "📱 [PowerDialer] Device registered and ready for calling!",
        );
      });

      device.on("error", (error: any) => {
        console.error("❌ [PowerDialer] Device error:", error);
        onStateChange({
          status: "error",
          error: `Device error: ${error.message || error.toString()}`,
        });
      });

      device.on("tokenWillExpire", () => {
        console.warn("⚠️ [PowerDialer] Token will expire soon");
      });

      // Step 6: Register the device
      console.log("📱 [PowerDialer] Registering device...");
      await device.register();
      console.log("✅ [PowerDialer] Device registered successfully");

      // Step 7: Prepare call parameters
      const callParams = {
        To: formattedPhone,
        From: "+16025669750", // Your Twilio number
        ContactName: contact.name,
        ContactId: contact.id.toString(),
        UserId: userId,
      };

      console.log("📞 [PowerDialer] Starting call with params:", callParams);

      // Step 8: Update UI to show dialing
      onStateChange({
        status: "dialing",
        startTime: new Date(),
      });

      // Step 9: Make the call using proper Voice SDK v2.x API
      const call = device.connect(callParams);

      // Step 10: Set up call event handlers
      call.on("accept", () => {
        console.log(
          "🎉 [PowerDialer] Call connected! You can now talk through your computer.",
        );
        const callStartTime = new Date();
        onStateChange({
          status: "connected",
          callStartTime,
          callSid:
            call.parameters?.CallSid ||
            call.customParameters?.CallSid ||
            "connected",
        });

        // Start call timer
        this.startCallTimer(callStartTime, onStateChange);
      });

      call.on("disconnect", () => {
        console.log("📞 [PowerDialer] Call ended.");
        this.stopCallTimer();
        onStateChange({ status: "complete" });
      });

      call.on("cancel", () => {
        console.log("📞 [PowerDialer] Call was cancelled.");
        this.stopCallTimer();
        onStateChange({ status: "complete" });
      });

      call.on("error", (error: any) => {
        console.error("❌ [PowerDialer] Call error:", error);
        this.stopCallTimer();
        onStateChange({
          status: "error",
          error: `Call error: ${error.message || error.toString()}`,
        });
      });

      call.on("ringing", () => {
        console.log("📞 [PowerDialer] Call is ringing...");
        onStateChange({
          status: "ringing",
          callSid:
            call.parameters?.CallSid ||
            call.customParameters?.CallSid ||
            "ringing",
        });
      });

      // Initial state - waiting for call events
      console.log(
        "📞 [PowerDialer] Call initiated - waiting for connection...",
      );
    } catch (error) {
      console.error("❌ [PowerDialer] Computer-to-phone call failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown calling error occurred";
      onStateChange({
        status: "error",
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Save call record to database (desktop only)
   */
  async saveCallRecord(
    contactId: number,
    callSid: string,
    outcome: CallOutcome,
    notes: string,
    duration: number,
    userId: string,
  ): Promise<void> {
    try {
      // Check if we're in desktop mode
      if (typeof window !== "undefined" && window.__TAURI__) {
        // Save call record to database
        await window.__TAURI__.invoke("save_call_record", {
          contactId: contactId.toString(),
          callSid: callSid || `manual_${Date.now()}`,
          outcome,
          notes: notes || `${outcome} - Power dialer call`,
          duration: duration || 0,
          userId: userId,
          workspaceId: workspaceId,
        });

        console.log("✅ [PowerDialer] Call record saved to database");

        // Complete the speedrun lead
        await window.__TAURI__.invoke("complete_speedrun_lead", {
          workspaceId: workspaceId,
          userId: userId,
          contactId: contactId.toString(),
          outcome,
          notes: notes || `Completed via power dialer - ${outcome}`,
        });

        console.log("✅ [PowerDialer] Lead marked as complete in database");
      }
    } catch (error) {
      console.error("❌ [PowerDialer] Error saving call data:", error);
      // Continue with the flow even if database save fails
    }
  }

  /**
   * Test calling system capabilities
   */
  async testCallingSystem(): Promise<void> {
    try {
      // Same desktop detection logic as main calling
      const isDesktop =
        typeof window !== "undefined" &&
        ((window as any).__TAURI__ ||
          (window as any).__TAURI_INTERNALS__ ||
          navigator.userAgent.includes("Tauri") ||
          location['protocol'] === "tauri:");

      if (isDesktop) {
        // Desktop mode - test calling systems
        let tauriInvoke = null;
        let method = "";

        if ((window as any).__TAURI__?.invoke) {
          tauriInvoke = (window as any).__TAURI__.invoke;
          method = "Tauri __TAURI__.invoke";
        } else if ((window as any).__TAURI_INTERNALS__?.core?.invoke) {
          tauriInvoke = (window as any).__TAURI_INTERNALS__.core.invoke;
          method = "Tauri __TAURI_INTERNALS__.core.invoke";
        } else if (typeof (window as any).invoke === "function") {
          tauriInvoke = (window as any).invoke;
          method = "Global invoke function";
        }

        if (tauriInvoke) {
          alert(
            `✅ Desktop mode detected! Native Tauri calling ready via ${method}. No WebRTC/microphone permission issues.`,
          );
        } else {
          alert(
            "✅ Desktop mode! Native calling will work through Tauri backend. No browser permission issues.",
          );
        }
      } else if (
        navigator['mediaDevices'] &&
        navigator.mediaDevices.getUserMedia
      ) {
        // Web mode - test microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        alert("✅ Microphone access granted! You can now make calls.");
      } else {
        alert(
          "❌ Microphone not available. Please use the desktop app for calling.",
        );
      }
    } catch (error: any) {
      alert(
        `❌ Error: ${error.message}. Please check your browser settings or try the desktop app.`,
      );
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopCallTimer();
  }
}
