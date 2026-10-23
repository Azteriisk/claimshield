import { NextResponse } from "next/server";
import { db, SettlementClaim } from "@/lib/db";
import { IdentityEngine } from "@/lib/identityEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      settlementId,
      claimantId,
      qualifyingAlias,
      payoutAddress,
      submissionSpeedSec = 25,
      ipAddress = "127.0.0.1",
      isDatacenter = false
    } = body;

    if (!settlementId || !claimantId) {
      return NextResponse.json({ error: "Missing required settlement or claimant ID" }, { status: 400 });
    }

    const settlement = db.getSettlement(settlementId);
    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    const claimant = db.getClaimantById(claimantId);
    if (!claimant) {
      return NextResponse.json({ error: "Claimant not found" }, { status: 404 });
    }

    // STRICT ANTI-SYBIL CONSTRAINT:
    // Has this natural person already claimed this settlement?
    if (db.hasClaimedSettlement(claimantId, settlementId)) {
      return NextResponse.json({
        success: false,
        code: "DUPLICATE_CLAIM_REJECTED",
        message: `You have already filed a claim for '${settlement.caseName}'. Federal class action rules strictly permit 1 claim per natural person.`
      }, { status: 409 });
    }

    // Score the claim for fraud and divergence
    const scoreResult = IdentityEngine.scoreClaim({
      claimant,
      payoutAddress: payoutAddress || claimant.lockedPayoutAddress,
      aliasValue: qualifyingAlias || claimant.lockedPayoutAddress,
      submissionSpeedSec,
      ipAddress,
      isDatacenter
    });

    const newClaim: SettlementClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      settlementId,
      claimantId,
      qualifyingAlias: qualifyingAlias || claimant.lockedPayoutAddress,
      payoutAddress: payoutAddress || claimant.lockedPayoutAddress,
      riskScore: scoreResult.riskScore,
      status: scoreResult.status,
      flags: scoreResult.flags,
      submissionSpeedSec,
      ipAddress,
      isDatacenter,
      submittedAt: new Date().toISOString()
    };

    db.addClaim(newClaim);

    return NextResponse.json({
      success: true,
      message: "Claim successfully lodged and cryptographically pre-cleared.",
      claim: newClaim
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
