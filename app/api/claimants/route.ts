import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { IdentityEngine } from "@/lib/identityEngine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const claimantId = searchParams.get("id");

  if (!claimantId) {
    // Return all claimants for switcher / demo inspection
    const claimants = db.getClaimants();
    return NextResponse.json({ claimants });
  }

  const claimant = db.getClaimantById(claimantId);
  if (!claimant) {
    return NextResponse.json({ error: "Claimant not found" }, { status: 404 });
  }

  const aliases = db.getAliasesForClaimant(claimant.id);
  const claims = db.getClaimsForClaimant(claimant.id);

  return NextResponse.json({
    claimant,
    aliases,
    claims
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = IdentityEngine.verifyAndRegister(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
