import { NextRequest, NextResponse } from "next/server";

// Use force-static for desktop compatibility
export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  try {
    console.log("🎙️ [TWIML APP] Handling computer-to-phone call");

    // Get form data from Twilio
    const formData = await request.formData();
    const To = formData.get("To") as string;
    const From = formData.get("From") as string;
    const CallSid = formData.get("CallSid") as string;
    const ContactName =
      (formData.get("ContactName") as string) || "Unknown Contact";
    const ContactId = (formData.get("ContactId") as string) || "";
    const UserId = (formData.get("UserId") as string) || "";

    console.log("📞 [TWIML APP] Computer-to-phone call details:", {
      To,
      From,
      CallSid,
      ContactName,
      ContactId,
      UserId,
    });

    // Generate TwiML that connects computer (browser) to phone
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting you to ${ContactName}...</Say>
    <Dial timeout="30" callerId="${From}" record="record-from-answer">
        <Number>${To}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
</Response>`;

    console.log(
      "✅ [TWIML APP] Generated TwiML for computer-to-phone bridge:",
      ContactName,
    );

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("❌ [TWIML APP] TwiML application error:", error);

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
  const contactName = searchParams.get("ContactName") || "Test Contact";

  const testTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">This is a test of the computer-to-phone TwiML application for ${contactName}. The system is working correctly.</Say>
</Response>`;

  return new NextResponse(testTwiml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
