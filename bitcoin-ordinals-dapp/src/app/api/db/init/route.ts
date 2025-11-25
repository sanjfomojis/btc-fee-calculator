/**
 * API Route for Database Initialization
 * 
 * Run this once to set up the database schema
 * POST /api/db/init
 */

import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/db";

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json(
      { success: true, message: "Database initialized successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to initialize database:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize database" },
      { status: 500 }
    );
  }
}

