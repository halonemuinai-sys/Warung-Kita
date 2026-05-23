import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ connected: true });
  } catch (error) {
    console.error("Database connection check failed:", error);
    return NextResponse.json({ connected: false });
  }
}
