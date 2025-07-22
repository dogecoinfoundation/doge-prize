import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    return NextResponse.json({ hasPassword: !!user?.password });
  } catch (error) {
    console.error("Error checking password:", error);
    return NextResponse.json({ hasPassword: false }, { status: 500 });
  }
} 