import { NextResponse } from "next/server";
import { DisputeEngine } from "@/lib/disputeEngine";

export async function POST(request: Request) {
  try {
    const { disputeId, proofType = "DYNAMIC_LIVENESS_VIDEO" } = await request.json();

    if (!disputeId) {
      return NextResponse.json({ error: "Dispute ID is required" }, { status: 400 });
    }

    const result = DisputeEngine.resolveAppealWithStepUp(disputeId, proofType);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
