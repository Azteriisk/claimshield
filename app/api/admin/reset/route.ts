import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    db.resetSimulationFixtures();
    return NextResponse.json({
      success: true,
      message: "Simulation store reset to baseline fixtures."
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reset fixtures" }, { status: 500 });
  }
}
