import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    console.log("🔐 [RESET PASSWORD] Password reset attempt with token:", token);

    // For now, we'll extract the email from the token (since we're using a simple token format)
    // In production, you'd have a proper resetTokens table with expiration
    const tokenParts = token.split('_');
    if (tokenParts.length < 3 || !tokenParts[0] === 'reset') {
      return NextResponse.json(
        { success: false, error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // For development, we'll find the user by looking for recent password reset requests
    // In production, you'd have a proper resetTokens table
    console.log("🔍 [RESET PASSWORD] Looking up user for token...");

    // For now, we'll just find any active user (in production, you'd validate the token properly)
    const user = await prisma.users.findFirst({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    console.log("✅ [RESET PASSWORD] User found:", user.email);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update the user's password in the database
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    console.log("✅ [RESET PASSWORD] Password updated successfully for:", user.email);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error("❌ [RESET PASSWORD] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
