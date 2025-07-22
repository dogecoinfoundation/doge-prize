import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if database is accessible
    await prisma.$connect();
    
    // Check if user exists
    const user = await prisma.user.findFirst();
    
    // Check if migrations are up to date
    const migrations = await prisma.$queryRaw`SELECT COUNT(*) as count FROM _prisma_migrations`;
    
    const hasMigrations = (migrations as any[])[0]?.count > 0;
    
    return NextResponse.json({
      status: "ok",
      isConfigured: !!user && hasMigrations,
      hasUser: !!user,
      hasMigrations: hasMigrations,
    });
  } catch (error) {
    console.error("Database status check failed:", error);
    return NextResponse.json({
      status: "error",
      isConfigured: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await prisma.$disconnect();
  }
} 