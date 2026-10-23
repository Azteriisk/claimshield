import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    let count = 20;
    try {
      const body = await req.json();
      if (body && typeof body.count === "number" && body.count > 0 && body.count <= 100) {
        count = body.count;
      }
    } catch {
      // Default to 20 if no body provided
    }

    const generatedClaims = db.simulateBotAttackWave(count);

    return NextResponse.json({
      success: true,
      count: generatedClaims.length,
      claims: generatedClaims,
      message: `Simulated ${generatedClaims.length} inbound Sybil bot claims flagged under FRCP Rule 23.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to simulate bot wave" }, { status: 500 });
  }
}
