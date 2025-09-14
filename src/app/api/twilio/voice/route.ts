import { NextRequest, NextResponse } from "next/server";

// Use force-static for desktop compatibility
export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactName = searchParams.get("contactName") || "Unknown Contact";
    const contactId = searchParams.get("contactId") || "";
    const userId = searchParams.get("userId") || "";

    console.log("🎙️ [TWILIO VOICE] Handling voice webhook for:", contactName);

    // Get form data from Twilio
    const formData = await request.formData();
    const To = formData.get("To") as string;
    const From = formData.get("From") as string;
    const CallSid = formData.get("CallSid") as string;

    console.log("📞 [TWILIO VOICE] Call details:", { To, From, CallSid });

    // Generate TwiML response that directly connects computer to phone
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting your call to ${contactName}...</Say>
    <Dial timeout="30" record="record-from-answer" recordingStatusCallback="${process['env']['NEXT_PUBLIC_API_URL'] || "https://action.adrata.com"}/api/twilio/recording">
        <Number>${To}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
</Response>`;

    console.log(
      "✅ [TWILIO VOICE] Generated TwiML for computer-to-phone bridge",
    );

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("❌ [TWILIO VOICE] Voice webhook error:", error);

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">We're sorry, but there was an error connecting your call. Please try again.</Say>
    <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactName = searchParams.get("contactName") || "Test Contact";

  const testTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">This is a test of the Twilio voice webhook for ${contactName}. The system is working correctly.</Say>
</Response>`;

  return new NextResponse(testTwiml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
