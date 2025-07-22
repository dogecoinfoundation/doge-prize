import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Get the user
    const user = await prisma.user.findFirst();

    if (!user) {
      // Create the user if it doesn't exist
      const hashedPassword = await hash(password, 12);
      await prisma.user.create({
        data: { password: hashedPassword }
      });
      return NextResponse.json({ success: true });
    }

    // If user exists and has a password, don't allow changing it
    if (user.password) {
      return NextResponse.json(
        { error: "Password already set. Use reset-password script to reset it." },
        { status: 403 }
      );
    }

    // If user exists but has no password, set it
    const hashedPassword = await hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting password:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
} 