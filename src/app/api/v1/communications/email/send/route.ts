import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/platform/services/ResendService";

export const dynamic = "force-dynamic";

/**
 * Send Email API - Direct email sending using Resend
 * 
 * POST: Send email via Resend API
 */

export async function POST(request: NextRequest) {
  try {
    console.log("📧 [EMAIL SEND API] Processing email send request");

    const body = await request.json();
    const { 
      to,
      from,
      subject,
      html,
      text,
      replyTo,
      cc,
      bcc,
      test
    } = body;

    // Handle test request
    if (test) {
      return NextResponse.json({
        success: true,
        message: "Email send API is available",
        endpoint: "/api/email/send"
      });
    }

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: "to, subject, and html/text are required" },
        { status: 400 }
      );
    }

    console.log(`📧 [EMAIL SEND API] Sending email to: ${to}`);
    console.log(`📧 [EMAIL SEND API] Subject: ${subject}`);
    console.log(`📧 [EMAIL SEND API] From: ${from || 'Adrata <noreply@adrata.com>'}`);

    // Send email using ResendService
    const result = await sendEmail({
      to: Array.isArray(to) ? to : [to],
      from,
      subject,
      html,
      text,
      replyTo,
      cc,
      bcc
    });

    if (!result.success) {
      console.error("❌ [EMAIL SEND API] Failed to send email:", result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to send email",
          details: result.error
        },
        { status: 500 }
      );
    }

    console.log("✅ [EMAIL SEND API] Email sent successfully");

    return NextResponse.json({ 
      success: true, 
      message: "Email sent successfully",
      emailId: result.emailId
    });

  } catch (error) {
    console.error("❌ [EMAIL SEND API] Error processing email send:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process email send request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
