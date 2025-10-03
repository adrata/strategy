import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("🔐 [FORGOT PASSWORD] Password reset request for:", email);

    // Find user by email
    const user = await prisma.users.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      console.log("🔐 [FORGOT PASSWORD] User not found for:", email);
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, we've sent a password reset link.",
      });
    }

    console.log("✅ [FORGOT PASSWORD] User found:", user.email);

    // Generate reset token (in production, use a proper JWT or crypto token)
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Store reset token in database (you might want to add a resetTokens table)
    // For now, we'll just log it - in production, store it securely
    console.log("🔐 [FORGOT PASSWORD] Generated reset token for:", user.email);

    // In production, you would:
    // 1. Store the reset token in database with expiration
    // 2. Send actual email with reset link
    // 3. Use proper email service (SendGrid, AWS SES, etc.)
    
    // For development, we'll just return success
    console.log("📧 [FORGOT PASSWORD] Would send email to:", user.email);
    console.log("🔗 [FORGOT PASSWORD] Reset link would be:", `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your email address.",
    });

  } catch (error) {
    console.error("❌ [FORGOT PASSWORD] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
