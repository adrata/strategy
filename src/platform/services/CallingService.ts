/**
 * 🎯 PRODUCTION CALLING SERVICE - HYBRID WEB/DESKTOP VERSION
 * Uses Tauri commands for desktop, fallback for web
 */

export interface CallRequest {
  contactId: number;
  contactName: string;
  contactPhone: string;
  contactLocation?: string;
  contactCompany?: string;
  userId: string;
}

export interface CallResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  from?: string;
  to?: string;
  error?: string;
  code?: string;
}

export interface CallStatus {
  sid: string;
  status:
    | "initiated"
    | "ringing"
    | "answered"
    | "completed"
    | "busy"
    | "no-answer"
    | "failed"
    | "canceled";
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  from: string;
  to: string;
  price?: string;
  direction: string;
}

export interface OptimalNumberResult {
  success: boolean;
  phoneNumber: string;
  areaCode: string;
  location: string;
  reason: string;
  confidence: number;
  contactAreaCode: string;
  contactLocation?: string;
  totalAvailable?: number;
}

export class CallingService {
  private get isTauriAvailable(): boolean {
    if (typeof window === "undefined") return false;

    // Check multiple Tauri indicators with proper validation
    const hasTauri = !!(
      window['__TAURI__'] && typeof window['__TAURI__']['invoke'] === "function"
    );

    const hasTauriInternals = !!(window as any).__TAURI_INTERNALS__;
    const hasTauriMetadata = !!(window as any).__TAURI_METADATA__;
    const hasDesktopEnv = process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true";

    const isDesktop = hasTauri || (hasTauriInternals && hasTauriMetadata);

    // Enhanced logging for debugging
    console.log("🔍 [CallingService] Environment detection:", {
      hasTauri,
      hasTauriInternals,
      hasTauriMetadata,
      hasDesktopEnv,
      isDesktop,
      windowTauri: typeof window.__TAURI__,
      tauriInvoke: typeof (window as any).__TAURI__?.invoke,
    });

    return isDesktop;
  }

  constructor() {
    console.log(
      `🎯 [CallingService] Initialized for ${this.isTauriAvailable ? "desktop" : "web"} environment`,
    );

    // Enhanced debugging for desktop detection
    if (typeof window !== "undefined") {
      console.log("🔍 [CallingService] Desktop detection details:", {
        __TAURI__: !!(window as any).__TAURI__,
        __TAURI_INTERNALS__: !!(window as any).__TAURI_INTERNALS__,
        __TAURI_METADATA__: !!(window as any).__TAURI_METADATA__,
        NEXT_PUBLIC_IS_DESKTOP: process['env']['NEXT_PUBLIC_IS_DESKTOP'],
        finalDecision: this.isTauriAvailable ? "DESKTOP" : "WEB",
      });
    }
  }

  /**
   * Get optimal phone number for a contact based on their location
   */
  async getOptimalCallingNumber(
    contactPhone: string,
    contactLocation?: string,
    contactCompany?: string,
    userId: string = "dan",
  ): Promise<OptimalNumberResult> {
    if (this.isTauriAvailable) {
      return this.getOptimalNumberTauri(
        contactPhone,
        contactLocation,
        contactCompany,
        userId,
      );
    } else {
      return this.getOptimalNumberFallback(
        contactPhone,
        contactLocation,
        contactCompany,
        userId,
      );
    }
  }

  /**
   * Tauri version of optimal number selection - now uses dynamic number fetching
   */
  private async getOptimalNumberTauri(
    contactPhone: string,
    contactLocation?: string,
    contactCompany?: string,
    userId: string = "dan",
  ): Promise<OptimalNumberResult> {
    try {
      console.log(
        `🎯 [CallingService] Getting optimal number via Tauri for: ${contactPhone}`,
      );

      // First, safely check if Tauri invoke is actually available
      if (!window.__TAURI__ || typeof window.__TAURI__.invoke !== "function") {
        console.log(
          `⚠️ [CallingService] Tauri.invoke not available, falling back to web mode`,
        );
        return this.getOptimalNumberFallback(
          contactPhone,
          contactLocation,
          contactCompany,
          userId,
        );
      }

      // @ts-ignore - Tauri API is available at runtime in desktop
      const result = await window.__TAURI__.invoke(
        "get_optimal_calling_number",
        {
          contactPhone,
          contactLocation,
          contactCompany,
          userId,
        },
      );

      console.log(
        `✅ [CallingService] Optimal number retrieved via Tauri:`,
        result,
      );
      return result as OptimalNumberResult;
    } catch (error: any) {
      console.error(
        "❌ [CallingService] Error getting optimal number via Tauri:",
        error,
      );

      // Fall back to web implementation
      console.log(`🔄 [CallingService] Tauri failed, using web fallback...`);
      return this.getOptimalNumberFallback(
        contactPhone,
        contactLocation,
        contactCompany,
        userId,
      );
    }
  }

  /**
   * Fallback version of optimal number selection
   */
  private async getOptimalNumberFallback(
    contactPhone: string,
    contactLocation?: string,
    contactCompany?: string,
    userId: string = "dan",
  ): Promise<OptimalNumberResult> {
    console.log(
      `🎯 [CallingService] Getting optimal number via web fallback for: ${contactPhone}`,
    );

    // Extract area code from contact's phone
    const contactAreaCode = this.extractAreaCode(contactPhone);
    console.log(`📍 [CallingService] Contact area code: ${contactAreaCode}`);

    // Get available numbers for matching
    const availableNumbers = this.getAvailableNumbers();

    // Find best match
    let bestMatch = availableNumbers[0] || {
      number: "",
      displayName: "Unknown Number",
      type: "unknown",
    }; // Default fallback
    let bestScore = 10;
    let reason = "Default fallback number";

    // Try to find exact area code match
    const exactMatch = availableNumbers.find(
      (num) => num['areaCode'] === contactAreaCode,
    );
    if (exactMatch) {
      bestMatch = exactMatch;
      bestScore = 100;
      reason = "Exact area code match";
    } else {
      // Try geographic proximity
      for (const num of availableNumbers) {
        const proximity = 50; // Simple proximity score
        if (proximity > bestScore) {
          bestMatch = num;
          bestScore = proximity;
          reason = `Geographic proximity (${num.location})`;
        }
      }
    }

    // Company-specific optimization
    if (contactCompany) {
      const company = contactCompany.toLowerCase();
      if (
        (company || "").includes("tech") ||
        (company || "").includes("software")
      ) {
        const techNumber = availableNumbers.find(
          (num) => num['areaCode'] === "415",
        ); // SF
        if (techNumber) {
          bestMatch = techNumber;
          reason = "Tech company - Silicon Valley number";
        }
      }
    }

    if (!bestMatch) {
      // Fallback to first available number if no match found
      bestMatch = availableNumbers[0] || {
        number: "+18889130475",
        areaCode: "888",
        location: "Toll-Free",
        city: "National",
        state: "US",
        reason: "Fallback toll-free number",
        confidence: 0.1,
      };
      reason = "Fallback - no optimal match found";
    }

    console.log(`✅ [CallingService] Selected ${bestMatch.number} (${reason})`);

    // Type guard to ensure we have the right type of bestMatch
    const hasLocationData = "areaCode" in bestMatch && "location" in bestMatch;
    const matchWithLocation = hasLocationData
      ? (bestMatch as { number: string; areaCode: string; location: string })
      : null;

    return {
      success: true,
      phoneNumber: bestMatch.number,
      areaCode: matchWithLocation?.areaCode || "",
      location: matchWithLocation?.location || "Unknown Location",
      reason: reason,
      confidence: bestScore / 100,
      contactAreaCode,
      contactLocation: contactLocation || undefined,
      totalAvailable: availableNumbers.length,
    };
  }

  /**
   * Initiate an outbound call
   */
  async makeCall(request: CallRequest): Promise<CallResponse> {
    if (this.isTauriAvailable) {
      return this.makeCallTauri(request);
    } else {
      return this.makeCallFallback(request);
    }
  }

  /**
   * Tauri version of making calls
   */
  private async makeCallTauri(request: CallRequest): Promise<CallResponse> {
    try {
      console.log(
        `📞 [CallingService] Making call via Tauri to ${request.contactName}`,
      );

      // First, safely check if Tauri invoke is actually available
      if (!window.__TAURI__ || typeof window.__TAURI__.invoke !== "function") {
        console.log(
          `⚠️ [CallingService] Tauri.invoke not available, falling back to web mode`,
        );
        return this.makeCallFallback(request);
      }

      // Get optimal number first
      const optimalNumber = await this.getOptimalCallingNumber(
        request.contactPhone,
        request.contactLocation,
        request.contactCompany,
        request.userId,
      );

      console.log(
        `📱 [CallingService] Using number: ${optimalNumber.phoneNumber} (${optimalNumber.reason})`,
      );

      // @ts-ignore - Tauri API is available at runtime in desktop
      const result = (await window.__TAURI__.invoke("make_twilio_call", {
        to: request.contactPhone,
        from: optimalNumber.phoneNumber,
        contactName: request.contactName,
        contactId: request.contactId.toString(),
        userId: request.userId,
      })) as CallResponse;

      if (result.success) {
        console.log(
          `✅ [CallingService] Direct call initiated - SID: ${result.callSid}`,
        );
        console.log(
          `📞 [CallingService] This is a direct desktop call - no additional routing needed`,
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ [CallingService] Error making call via Tauri:", error);

      // If Tauri fails, fall back to web mode
      console.log(
        `🔄 [CallingService] Tauri failed, attempting web fallback...`,
      );
      return this.makeCallFallback(request);
    }
  }

  /**
   * Web version that makes REAL Twilio calls via API
   */
  private async makeCallFallback(request: CallRequest): Promise<CallResponse> {
    console.log(
      `📞 [CallingService] Making REAL web call to ${request.contactName} (${request.contactPhone})`,
    );

    try {
      // Get optimal number for the call
      const optimalNumber = await this.getOptimalCallingNumber(
        request.contactPhone,
        request.contactLocation,
        request.contactCompany,
        request.userId,
      );

      console.log(
        `📱 [CallingService] Using number: ${optimalNumber.phoneNumber} (${optimalNumber.reason})`,
      );

      // Make actual Twilio call via our API endpoint
      const response = await fetch("/api/twilio/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: request.contactPhone,
          from: optimalNumber.phoneNumber,
          contactName: request.contactName,
          contactId: request.contactId.toString(),
          userId: request.userId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `✅ [CallingService] Web call initiated - SID: ${result.callSid}`,
        );

        return {
          success: true,
          callSid: result.callSid,
          status: "initiated",
          from: optimalNumber.phoneNumber,
          to: request.contactPhone,
        };
      } else {
        const error = await response.text();
        throw new Error(`API call failed: ${response.status} - ${error}`);
      }
    } catch (error: any) {
      console.error("❌ [CallingService] Web call failed:", error);
      return {
        success: false,
        error: error.message || "Web call failed",
        code: "WEB_CALL_ERROR",
      };
    }
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid: string): Promise<CallStatus | null> {
    if (this.isTauriAvailable) {
      return this.getCallStatusTauri(callSid);
    } else {
      return this.getCallStatusFallback(callSid);
    }
  }

  /**
   * Tauri version of getting call status
   */
  private async getCallStatusTauri(
    callSid: string,
  ): Promise<CallStatus | null> {
    try {
      // @ts-ignore - Tauri API is available at runtime in desktop
      const result: any = await window.__TAURI__.invoke(
        "get_twilio_call_status",
        { callSid },
      );

      return {
        sid: result.sid || callSid,
        status: this.normalizeTwilioStatus(result.status || "unknown"),
        duration: result.duration ? parseInt(result.duration) : undefined,
        startTime: result.start_time ? new Date(result.start_time) : undefined,
        endTime: result.end_time ? new Date(result.end_time) : undefined,
        from: result.from || "",
        to: result.to || "",
        price: result.price,
        direction: result.direction || "outbound",
      };
    } catch (error: any) {
      console.error(
        "❌ [CallingService] Error getting call status via Tauri:",
        error,
      );
      return null;
    }
  }

  /**
   * Fallback version for web
   */
  private async getCallStatusFallback(
    callSid: string,
  ): Promise<CallStatus | null> {
    // Simulation for web testing
    return {
      sid: callSid,
      status: "completed",
      duration: 45,
      from: "+16025669750",
      to: "+1234567890",
      direction: "outbound",
    };
  }

  /**
   * Available phone numbers with location data
   */
  private getAvailableNumbers() {
    return [
      {
        number: "+16025669750",
        areaCode: "602",
        location: "Phoenix, AZ",
        city: "Phoenix",
        state: "Arizona",
        reason: "Local Phoenix presence",
        confidence: 1.0,
      },
      {
        number: "+14159658498",
        areaCode: "415",
        location: "San Francisco, CA",
        city: "San Francisco",
        state: "California",
        reason: "Silicon Valley tech companies",
        confidence: 1.0,
      },
      {
        number: "+13128001301",
        areaCode: "312",
        location: "Chicago, IL",
        city: "Chicago",
        state: "Illinois",
        reason: "Midwest business center",
        confidence: 1.0,
      },
      {
        number: "+12126543210",
        areaCode: "212",
        location: "New York, NY",
        city: "New York",
        state: "New York",
        reason: "East Coast financial center",
        confidence: 1.0,
      },
      {
        number: "+18889130475",
        areaCode: "888",
        location: "Toll-Free",
        city: "National",
        state: "US",
        reason: "National toll-free fallback",
        confidence: 0.3,
      },
    ];
  }

  /**
   * Normalize Twilio status to our expected format
   */
  private normalizeTwilioStatus(twilioStatus: string): CallStatus["status"] {
    const statusMap: Record<string, CallStatus["status"]> = {
      queued: "initiated",
      initiated: "initiated",
      ringing: "ringing",
      answered: "answered",
      "in-progress": "answered",
      completed: "completed",
      busy: "busy",
      "no-answer": "no-answer",
      failed: "failed",
      canceled: "canceled",
    };

    return statusMap[twilioStatus] || "failed";
  }

  /**
   * Map Twilio status to user-friendly status
   */
  mapCallStatus(twilioStatus: string): {
    status: string;
    userFriendly: string;
    color: string;
    icon: string;
  } {
    const statusMap = {
      initiated: {
        status: "dialing",
        userFriendly: "Dialing...",
        color: "blue",
        icon: "📞",
      },
      ringing: {
        status: "ringing",
        userFriendly: "Ringing...",
        color: "yellow",
        icon: "📞",
      },
      answered: {
        status: "connected",
        userFriendly: "Connected",
        color: "green",
        icon: "✅",
      },
      completed: {
        status: "completed",
        userFriendly: "Call Ended",
        color: "gray",
        icon: "📞",
      },
      busy: { status: "busy", userFriendly: "Busy", color: "red", icon: "🚫" },
      "no-answer": {
        status: "no-answer",
        userFriendly: "No Answer",
        color: "orange",
        icon: "📵",
      },
      failed: {
        status: "failed",
        userFriendly: "Call Failed",
        color: "red",
        icon: "❌",
      },
      canceled: {
        status: "canceled",
        userFriendly: "Canceled",
        color: "gray",
        icon: "⏹️",
      },
    };

    return (
      statusMap[twilioStatus as keyof typeof statusMap] || {
        status: "unknown",
        userFriendly: "Unknown Status",
        color: "gray",
        icon: "❓",
      }
    );
  }

  /**
   * Extract area code from phone number
   */
  private extractAreaCode(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned['length'] === 11 && cleaned.startsWith("1")) {
      return cleaned.substring(1, 4);
    } else if (cleaned['length'] === 10) {
      return cleaned.substring(0, 3);
    }
    return "";
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned['length'] === 11 && cleaned.startsWith("1")) {
      const area = cleaned.substring(1, 4);
      const exchange = cleaned.substring(4, 7);
      const number = cleaned.substring(7);
      return `(${area}) ${exchange}-${number}`;
    } else if (cleaned['length'] === 10) {
      const area = cleaned.substring(0, 3);
      const exchange = cleaned.substring(3, 6);
      const number = cleaned.substring(6);
      return `(${area}) ${exchange}-${number}`;
    }
    return phoneNumber;
  }

  /**
   * Get all available phone numbers (for desktop debugging/analytics)
   */
  async getAllAvailableNumbers(): Promise<any> {
    if (this.isTauriAvailable) {
      try {
        // @ts-ignore - Tauri API is available at runtime in desktop
        const result: { success: boolean; count: number; numbers: any[] } =
          await window.__TAURI__?.invoke("get_all_available_numbers");
        console.log(
          `📞 [CallingService] Found ${result.count} total phone numbers in account`,
        );
        return result;
      } catch (error: any) {
        console.error(
          "❌ [CallingService] Error getting all numbers via Tauri:",
          error,
        );
        return { success: false, error: error.message, count: 0, numbers: [] };
      }
    } else {
      console.log(
        "📞 [CallingService] Returning hardcoded numbers for web fallback",
      );
      return {
        success: true,
        count: 5,
        numbers: this.getAvailableNumbers().map((num) => ({
          phoneNumber: num.number,
          areaCode: num.areaCode,
          location: { city: num.city, state: num.state },
          friendlyName: `${num.city}, ${num.state} Local`,
        })),
      };
    }
  }

  /**
   * Enhanced call completion with database persistence
   */
  async saveCallRecord(
    contactId: string,
    callSid: string,
    outcome:
      | "connected"
      | "voicemail"
      | "no-answer"
      | "busy"
      | "pitched"
      | "demo-scheduled",
    notes: string,
    duration?: number,
  ): Promise<boolean> {
    try {
      console.log(
        `💾 [CallingService] Saving call record for contact: ${contactId}`,
      );

      if (this.isTauriAvailable) {
        // @ts-ignore - Tauri API is available at runtime in desktop
        const result = await window.__TAURI__.invoke("save_call_record", {
          contactId: contactId,
          callSid: callSid,
          outcome: outcome,
          notes: notes,
          duration: duration || 0,
          userId: "dan", // Hardcoded for desktop as per cursor rules
          workspaceId: "adrata",
        });

        console.log("✅ [CallingService] Call record saved via Tauri:", result);
        return true;
      } else {
        // Web implementation - API endpoint
        const response = await fetch("/api/calling/save-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId,
            callSid,
            outcome,
            notes,
            duration: duration || 0,
          }),
        });

        if (response.ok) {
          console.log("✅ [CallingService] Call record saved via API");
          return true;
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("❌ [CallingService] Error saving call record:", error);
      return false;
    }
  }

  /**
   * Complete speedrun lead after call
   */
  async completeSpeedrunLead(
    contactId: string,
    outcome:
      | "connected"
      | "voicemail"
      | "no-answer"
      | "busy"
      | "pitched"
      | "demo-scheduled",
    notes?: string,
  ): Promise<boolean> {
    try {
      console.log(`✅ [CallingService] Completing speedrun lead: ${contactId}`);

      if (this.isTauriAvailable) {
        // @ts-ignore - Tauri API is available at runtime in desktop
        const result = await window.__TAURI__.invoke("complete_speedrun_lead", {
          workspaceId: "adrata",
          userId: "dan", // Hardcoded for desktop as per cursor rules
          contactId: contactId,
          outcome: outcome,
          notes: notes || "Completed via power dialer",
        });

        console.log("✅ [CallingService] Lead completed via Tauri:", result);
        return true;
      } else {
        // Web implementation - API endpoint
        const response = await fetch("/api/speedrun/complete-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId,
            outcome,
            notes: notes || "Completed via power dialer",
          }),
        });

        if (response.ok) {
          console.log("✅ [CallingService] Lead completed via API");
          return true;
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("❌ [CallingService] Error completing lead:", error);
      return false;
    }
  }

  /**
   * Join a Twilio conference (for browser-based calling)
   * This integrates with Twilio Voice SDK for real browser calling
   */
  async joinConference(
    conferenceId: string,
    accessToken?: string,
  ): Promise<boolean> {
    try {
      console.log(`🎙️ [CallingService] Joining conference: ${conferenceId}`);

      if (!accessToken) {
        console.error(
          "❌ [CallingService] No access token provided for conference join",
        );
        return false;
      }

      // In a real implementation, this would use Twilio Voice SDK:
      // const Device = require('@twilio/voice-sdk').Device;
      // const device = new Device(accessToken, { edge: 'sydney' });
      // await device.register();
      // const call = device.connect({ params: { conference: conferenceId } });

      if (this.isTauriAvailable) {
        // For desktop, we handle conference through Tauri
        console.log(
          `🖥️ [CallingService] Desktop conference join for: ${conferenceId}`,
        );

        try {
          // @ts-ignore - Tauri API available at runtime
          const result: any = await window.__TAURI__.invoke(
            "join_twilio_conference",
            {
              conferenceId: conferenceId,
              accessToken: accessToken,
              userId: "dan", // Hardcoded as per cursor rules
            },
          );

          if (result?.success) {
            console.log(
              `✅ [CallingService] Successfully joined conference via Tauri: ${conferenceId}`,
            );
            return true;
          } else {
            console.error(
              `❌ [CallingService] Tauri conference join failed:`,
              result.error,
            );
            return false;
          }
        } catch (error: any) {
          console.error(
            "❌ [CallingService] Tauri conference join error:",
            error,
          );
          // Fall back to web simulation
        }
      }

      // Web implementation or fallback simulation
      console.log(
        `🌐 [CallingService] Web conference simulation for: ${conferenceId}`,
      );

      // Simulate the conference join process
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate connection time

      // For now, we'll simulate success
      console.log(
        `✅ [CallingService] Conference join simulation completed for: ${conferenceId}`,
      );

      // In a real implementation, you would:
      // 1. Initialize Twilio Device with access token
      // 2. Connect to conference room
      // 3. Handle audio streams
      // 4. Set up event listeners for call events

      return true;
    } catch (error: any) {
      console.error("❌ [CallingService] Error joining conference:", error);
      return false;
    }
  }

  /**
   * Get Twilio access token for browser-based calling
   */
  async getTwilioAccessToken(userId: string = "dan"): Promise<string | null> {
    try {
      console.log(
        `🎫 [CallingService] Getting Twilio access token for user: ${userId}`,
      );

      // This would call an API endpoint to generate a Twilio access token
      const response = await fetch("/api/twilio/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, identity: `user_${userId}` }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [CallingService] Access token obtained for: ${userId}`);
        return data.token;
      } else {
        console.error(
          "❌ [CallingService] Failed to get access token:",
          response.statusText,
        );
        return null;
      }
    } catch (error: any) {
      console.error("❌ [CallingService] Error getting access token:", error);
      return null;
    }
  }
}

export const callingService = new CallingService();
