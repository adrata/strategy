import { NextRequest, NextResponse } from "next/server";

// Use force-static for desktop compatibility
export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  try {
    const { to, from, contactName, contactId, userId, simple, webrtc } =
      await request.json();

    console.log("📞 [TWILIO MAKE-CALL] Initiating call:", {
      to,
      from,
      contactName,
      simple,
      webrtc,
    });

    // Twilio credentials
    const accountSid = "CREDENTIAL_REMOVED_FOR_SECURITY";
    const authToken =
      process['env']['TWILIO_AUTH_TOKEN'] || "CREDENTIAL_REMOVED_FOR_SECURITY";

    // For WebRTC computer-to-phone calls
    if (webrtc) {
      console.log(
        "🖥️ [TWILIO MAKE-CALL] Setting up computer-to-phone WebRTC call",
      );

      // Create TwiML webhook URL for computer-to-phone bridge
      const baseUrl =
        process['env']['NEXT_PUBLIC_API_URL'] || "https://action.adrata.com";
      const webhookUrl = `${baseUrl}/api/twilio/voice?contactName=${encodeURIComponent(contactName)}&contactId=${contactId}&userId=${userId}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: to,
            From: from,
            Url: webhookUrl,
            Method: "POST",
            StatusCallback: `${baseUrl}/api/twilio/status`,
            StatusCallbackEvent: "initiated,ringing,answered,completed",
            StatusCallbackMethod: "POST",
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        console.log(
          "✅ [TWILIO MAKE-CALL] Computer-to-phone call initiated:",
          result.sid,
        );
        return NextResponse.json({
          success: true,
          callSid: result.sid,
          type: "webrtc-computer-to-phone",
          message:
            "Computer-to-phone call initiated - use WebRTC to connect your audio",
          instructions:
            "Your computer microphone and speakers will handle the call audio",
        });
      } else {
        throw new Error(result.message || "Failed to make WebRTC call");
      }
    }

    // Simple phone-to-phone call (fallback mode)
    if (simple) {
      console.log("📱 [TWILIO MAKE-CALL] Making simple phone-to-phone call");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: to,
            From: from,
            Url: "https://demo.twilio.com/docs/voice.xml",
            Method: "POST",
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        console.log("✅ [TWILIO MAKE-CALL] Simple call initiated:", result.sid);
        return NextResponse.json({
          success: true,
          callSid: result.sid,
          type: "simple-phone-to-phone",
          message: "Simple phone call initiated",
        });
      } else {
        throw new Error(result.message || "Failed to make simple call");
      }
    }

    // Default: Computer-to-phone WebRTC call
    console.log("🖥️ [TWILIO MAKE-CALL] Defaulting to computer-to-phone call");

    const baseUrl =
      process['env']['NEXT_PUBLIC_API_URL'] || "https://action.adrata.com";
    const webhookUrl = `${baseUrl}/api/twilio/voice?contactName=${encodeURIComponent(contactName)}&contactId=${contactId}&userId=${userId}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Url: webhookUrl,
          Method: "POST",
        }),
      },
    );

    const result = await response.json();

    if (response.ok) {
      console.log(
        "✅ [TWILIO MAKE-CALL] Default computer-to-phone call initiated:",
        result.sid,
      );
      return NextResponse.json({
        success: true,
        callSid: result.sid,
        type: "computer-to-phone",
        message: "Computer-to-phone call initiated",
      });
    } else {
      throw new Error(result.message || "Failed to make call");
    }
  } catch (error) {
    console.error("❌ [TWILIO MAKE-CALL] Call failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to make call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
