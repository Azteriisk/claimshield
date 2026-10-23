import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DisputeEngine } from "@/lib/disputeEngine";

export async function GET() {
  const disputes = db.getDisputes();
  return NextResponse.json({
    count: disputes.length,
    disputes
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = DisputeEngine.triggerDispute(body);

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
