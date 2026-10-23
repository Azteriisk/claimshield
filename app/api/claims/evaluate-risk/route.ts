import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * B2B ENTERPRISE API ENDPOINT
 * Used by Settlement Administrators (Epiq, Kroll, Angeion, JND)
 * to evaluate incoming claims on their portals in real time.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      settlementId,
      claimantName,
      email,
      payoutAddress,
      ipAddress = "192.0.2.1",
      isDatacenter = false,
      submissionSpeedSec = 2.0
    } = body;

    let riskScore = 0.10;
    const flags: string[] = [];

    // 1. Blacklist check
    if (payoutAddress && db.isBlacklisted(payoutAddress)) {
      riskScore = 1.0;
      flags.push("BLACKLISTED_PAYOUT_SYNDICATE");
    }

    // 2. Inhuman submission speed (bots often complete complex web forms in < 3s)
    if (submissionSpeedSec < 3.0) {
      riskScore += 0.35;
      flags.push("SUPERHUMAN_SUBMISSION_SPEED");
    }

    // 3. Datacenter / Commercial Proxy IP (AWS, DigitalOcean, Hetzner, etc.)
    if (isDatacenter) {
      riskScore += 0.25;
      flags.push("DATACENTER_PROXY_IP");
    }

    // 4. Payout email divergence
    if (email && payoutAddress && payoutAddress.includes("@")) {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      const payoutDomain = payoutAddress.split("@")[1]?.toLowerCase();
      if (emailDomain !== payoutDomain && !["gmail.com", "yahoo.com", "outlook.com", "icloud.com"].includes(payoutDomain)) {
        riskScore += 0.20;
        flags.push("SUSPICIOUS_PAYOUT_DOMAIN");
      }
    }

    const finalRisk = Math.min(Math.round(riskScore * 100) / 100, 1.0);
    const verdict = finalRisk >= 0.6 ? "REJECT_BOT" : finalRisk >= 0.35 ? "FLAG_MANUAL_AUDIT" : "APPROVED_AUTHENTIC";

    return NextResponse.json({
      settlementId,
      riskScore: finalRisk,
      verdict,
      flags,
      antiSybilPassed: finalRisk < 0.6,
      auditToken: `tok_rule23_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      evaluatedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
