import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/platform/prisma";
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

    // Find and validate the reset token
    const resetTokenRecord = await prisma.resetTokens.findFirst({
      where: {
        token: token,
        used: false,
        expiresAt: {
          gt: new Date(), // Token must not be expired
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!resetTokenRecord) {
      console.log("❌ [RESET PASSWORD] Invalid or expired token");
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    console.log("✅ [RESET PASSWORD] Valid token found for user:", resetTokenRecord.user.email);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update the user's password in the database
    await prisma.users.update({
      where: { id: resetTokenRecord.user.id },
      data: { password: hashedPassword }
    });

    // Mark the token as used to prevent reuse
    await prisma.resetTokens.update({
      where: { id: resetTokenRecord.id },
      data: { used: true }
    });
    
    console.log("✅ [RESET PASSWORD] Password updated successfully for:", resetTokenRecord.user.email);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
      user: {
        id: resetTokenRecord.user.id,
        email: resetTokenRecord.user.email,
        name: resetTokenRecord.user.name,
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