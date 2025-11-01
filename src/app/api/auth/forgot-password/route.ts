import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/platform/prisma";
import { sendEmail } from "@/platform/services/ResendService";
import crypto from "crypto";

// Required for static export (desktop build)
export const dynamic = 'force-static';

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

    // Generate cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Store reset token in database with expiration
    await prisma.resetTokens.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: expiresAt,
        used: false,
      },
    });

    console.log("🔐 [FORGOT PASSWORD] Generated secure reset token for:", user.email);

    // Create reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Send actual email using Resend
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset Your Adrata Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2F6FDC; margin-bottom: 20px;">Reset Your Adrata Password</h2>
          
          <p>Hello ${user.name || 'there'},</p>
          
          <p>We received a request to reset your password for your Adrata account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #2F6FDC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset My Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
          
          <p><strong>This link will expire in 24 hours.</strong></p>
          
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            This email was sent from Adrata. If you have any questions, please contact our support team.
          </p>
        </div>
      `,
      text: `
        Reset Your Adrata Password
        
        Hello ${user.name || 'there'},
        
        We received a request to reset your password for your Adrata account. 
        
        Click this link to reset your password: ${resetLink}
        
        This link will expire in 24 hours.
        
        If you didn't request a password reset, you can safely ignore this email.
        
        ---
        This email was sent from Adrata. If you have any questions, please contact our support team.
      `
    });

    if (!emailResult.success) {
      console.error("❌ [FORGOT PASSWORD] Failed to send email:", emailResult.error);
      return NextResponse.json(
        { success: false, error: "Failed to send password reset email" },
        { status: 500 }
      );
    }

    console.log("✅ [FORGOT PASSWORD] Email sent successfully to:", user.email);

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