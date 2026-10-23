import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const settlements = db.getSettlements();
  return NextResponse.json({
    count: settlements.length,
    settlements
  });
}
