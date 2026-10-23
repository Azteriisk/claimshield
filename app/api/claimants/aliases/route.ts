import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { claimantId, aliasType, aliasValue } = await request.json();

    if (!claimantId || !aliasType || !aliasValue) {
      return NextResponse.json({ error: "Missing required alias fields" }, { status: 400 });
    }

    const claimant = db.getClaimantById(claimantId);
    if (!claimant) {
      return NextResponse.json({ error: "Claimant not found" }, { status: 404 });
    }

    // Check if this alias already belongs to another user
    const existing = db.getAliasByValue(aliasType, aliasValue);
    if (existing && existing.claimantId !== claimantId) {
      return NextResponse.json({
        error: `This ${aliasType.toLowerCase()} is already bound to another registered identity vault.`
      }, { status: 409 });
    }

    const newAlias = {
      id: `alias-${Date.now()}`,
      claimantId,
      aliasType,
      aliasValue: aliasValue.trim(),
      isVerified: true, // Auto-verified via OTP in the demo
      verifiedAt: new Date().toISOString()
    };

    db.addAlias(newAlias);

    return NextResponse.json({
      success: true,
      message: `Verified and bound ${aliasValue} to your identity anchor.`,
      alias: newAlias
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
