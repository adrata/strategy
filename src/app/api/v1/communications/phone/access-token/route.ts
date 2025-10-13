import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Required for static export compatibility with Tauri builds
export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  try {
    const { identity, userId } = await request.json();

    console.log(
      "🔐 [TWILIO ACCESS TOKEN] Generating JWT for computer-to-phone calling:",
      identity,
    );

    // Twilio credentials - using your real account and API Key
    const accountSid =
      process['env']['TWILIO_ACCOUNT_SID'] || "CREDENTIAL_REMOVED_FOR_SECURITY";
    const authToken =
      process['env']['TWILIO_AUTH_TOKEN'] || "CREDENTIAL_REMOVED_FOR_SECURITY";

    // Your real Adrata Voice SDK API Key
    const apiKey = process['env']['TWILIO_API_KEY'];
    const apiSecret = process['env']['TWILIO_API_SECRET'];
    const twilioPhoneNumber = process['env']['TWILIO_PHONE_NUMBER'];

    // Check if we have the proper API Secret
    if (!apiSecret) {
      console.error(
        "❌ [TWILIO ACCESS TOKEN] Missing TWILIO_API_SECRET for API Key",
      );
      throw new Error("Twilio API Secret is required for Voice SDK");
    }

    // Current timestamp
    const now = Math.floor(Date.now() / 1000);

    // Create proper Twilio JWT for Voice SDK v2.x
    const payload = {
      // Standard JWT claims
      iss: apiKey, // Issuer: API Key SID
      sub: accountSid, // Subject: Account SID
      exp: now + 60 * 60, // Expires: 1 hour from now
      iat: now, // Issued at: current time
      jti: `${apiKey}-${now}`, // JWT ID: unique identifier

      // Twilio-specific grants
      grants: {
        identity: identity,
        voice: {
          // Outgoing calls configuration
          outgoing: {
            application_sid: "APdefault", // Use default Twilio app or configure your own
            params: {
              userId: userId,
              From: twilioPhoneNumber,
            },
          },
          // Incoming calls configuration
          incoming: {
            allow: true,
          },
        },
      },
    };

    console.log(
      "🔐 [TWILIO ACCESS TOKEN] Creating JWT with payload structure:",
      {
        iss: payload.iss,
        sub: payload.sub,
        identity: payload.grants.identity,
        outgoing: payload.grants.voice.outgoing,
        incoming: payload.grants.voice.incoming,
      },
    );

    // Sign the JWT with Twilio API secret using HS256
    const token = jwt.sign(payload, apiSecret, {
      algorithm: "HS256",
      header: {
        typ: "JWT",
        alg: "HS256",
        cty: "twilio-fpa;v=1", // Twilio-specific content type
      },
    });

    console.log(
      "✅ [TWILIO ACCESS TOKEN] JWT generated successfully for computer calling",
    );
    console.log("🔐 [TWILIO ACCESS TOKEN] Token length:", token.length);

    return NextResponse.json({
      success: true,
      token: token,
      identity: identity,
      expires_in: 3600,
      accountSid: accountSid,
      apiKey: apiKey,
      message: "Computer-to-phone access token generated",
    });
  } catch (error) {
    console.error("❌ [TWILIO ACCESS TOKEN] Failed to generate token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate access token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
