import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const claims = db.getClaims();
  const claimants = db.getClaimants();
  const settlements = db.getSettlements();
  const disputes = db.getDisputes();

  const totalClaims = claims.length;
  const verifiedCleanClaims = claims.filter(c => c.status === "VERIFIED_CLEAN").length;
  const flaggedBots = claims.filter(c => c.status === "FLAGGED_BOT" || c.status === "HIJACK_SUSPECT").length;
  const frozenDisputes = claims.filter(c => c.status === "FROZEN_DISPUTE").length;

  // Calculate estimated dollars protected from bot fraud
  const estimatedFraudPrevented = flaggedBots * 45.0 + frozenDisputes * 50.0;
  const botRejectionRate = totalClaims > 0 ? ((flaggedBots / totalClaims) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    metrics: {
      totalClaims,
      verifiedCleanClaims,
      flaggedBots,
      frozenDisputes,
      botRejectionRate: `${botRejectionRate}%`,
      estimatedFraudPrevented: `$${estimatedFraudPrevented.toLocaleString()}`,
      activeSettlementsCount: settlements.length,
      registeredClaimantsCount: claimants.length
    },
    recentClaims: claims.slice(0, 20),
    disputes
  });
}
