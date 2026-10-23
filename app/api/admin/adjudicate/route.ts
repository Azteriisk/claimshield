import { NextResponse } from "next/server";
import { db, IdentityDispute, SettlementClaim } from "@/lib/db";
import { Role, Permission, hasPermission } from "@/lib/rbac/permissions";
import { webhookDispatcher } from "@/lib/webhooks/dispatcher";

interface AdjudicationRequest {
  action: "RELEASE_ESCROW" | "DISQUALIFY_AND_BLACKLIST" | "REQUEST_PROOF" | "FREEZE_ESCROW";
  disputeId?: string;
  claimId?: string;
  examinerNotes?: string;
  examinerRole?: Role;
  tenantId?: string;
  actorName?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get("tenant") || "all";

    const disputes = db.getDisputes();
    const claims = db.getClaims();
    const settlements = db.getSettlements();

    // Contested claims include hijack suspects, frozen disputes, and bot flags
    const contestedClaims = claims.filter(
      c => c.status === "HIJACK_SUSPECT" || c.status === "FROZEN_DISPUTE"
    );

    const deliveryLogs = webhookDispatcher.getDeliveryLogs({
      tenantId: tenantParam !== "all" ? tenantParam : undefined
    });

    const pendingDisputes = disputes.filter(
      d => d.status === "FROZEN_PENDING_STEP_UP" || d.status === "SUPPLEMENTARY_PROOF_REQUESTED"
    );
    const resolvedDisputes = disputes.filter(
      d => d.status === "RESOLVED_APPELLANT_WON" || d.status === "IMPOSTER_DISQUALIFIED"
    );

    return NextResponse.json({
      disputes,
      contestedClaims,
      settlements,
      recentDeliveryLogs: deliveryLogs.slice(0, 10),
      summary: {
        pendingDisputesCount: pendingDisputes.length,
        resolvedDisputesCount: resolvedDisputes.length,
        totalContestedClaimsCount: contestedClaims.length
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal adjudication error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: AdjudicationRequest = await request.json();
    const {
      action,
      disputeId,
      claimId,
      examinerNotes,
      examinerRole: bodyRole,
      tenantId = "kroll",
      actorName = "Senior Claims Examiner"
    } = body;

    // RBAC: Check header first, then body, default to CLAIMS_EXAMINER
    const headerRole = request.headers.get("x-claimshield-role") as Role | null;
    const role: Role = headerRole || bodyRole || "CLAIMS_EXAMINER";

    // 1. RBAC PERMISSION ENFORCEMENT
    let requiredPermission: Permission = "claims:adjudicate";

    if (action === "RELEASE_ESCROW") {
      // Releasing escrow requires both claims adjudication and escrow release permissions
      if (!hasPermission(role, "claims:adjudicate") || !hasPermission(role, "escrow:release")) {
        return NextResponse.json(
          {
            error: `RBAC Forbidden: Role '${role}' lacks authority to release escrow funds. Requires 'claims:adjudicate' and 'escrow:release'.`,
            code: "RBAC_UNAUTHORIZED",
            role
          },
          { status: 403 }
        );
      }
    } else if (action === "FREEZE_ESCROW") {
      if (!hasPermission(role, "escrow:freeze")) {
        return NextResponse.json(
          {
            error: `RBAC Forbidden: Role '${role}' lacks 'escrow:freeze' permission.`,
            code: "RBAC_UNAUTHORIZED",
            role
          },
          { status: 403 }
        );
      }
    } else {
      if (!hasPermission(role, requiredPermission)) {
        return NextResponse.json(
          {
            error: `RBAC Forbidden: Role '${role}' lacks '${requiredPermission}' permission.`,
            code: "RBAC_UNAUTHORIZED",
            role
          },
          { status: 403 }
        );
      }
    }

    // 2. DISPUTE / CLAIM RESOLUTION LOGIC
    let dispute: IdentityDispute | undefined;
    if (disputeId) {
      dispute = db.getDispute(disputeId);
    } else if (claimId) {
      const claim = db.getClaims().find(c => c.id === claimId);
      if (claim) {
        dispute = db.getDisputes().find(d => d.incumbentClaimantId === claim.claimantId);
      }
    }

    // Fallback: If no dispute found but we have seeded disputes, pick the first pending dispute
    if (!dispute) {
      dispute = db.getDisputes().find(d => d.status === "FROZEN_PENDING_STEP_UP");
    }

    if (!dispute && (action === "RELEASE_ESCROW" || action === "REQUEST_PROOF")) {
      return NextResponse.json(
        { error: "No target dispute found matching criteria." },
        { status: 404 }
      );
    }

    const incumbentId = dispute?.incumbentClaimantId;
    const incumbent = incumbentId ? db.getClaimantById(incumbentId) : undefined;
    const notes = examinerNotes || `Adjudicated by ${actorName} (${role})`;

    let resultMessage = "";
    let updatedDispute: IdentityDispute | undefined;
    const webhookDispatches = [];

    // 3. EXECUTE JUDICIAL ACTIONS
    switch (action) {
      case "RELEASE_ESCROW": {
        if (!dispute || !incumbent) {
          return NextResponse.json(
            { error: "Dispute or incumbent account missing for escrow release." },
            { status: 400 }
          );
        }

        // A. Blacklist the fraudster's burner payout address
        if (incumbent.lockedPayoutAddress) {
          db.addToBlacklist(incumbent.lockedPayoutAddress);
        }

        // B. Recompute verified payout hash for legitimate claimant
        const newPayoutHash = db.computePayoutHash("PAYPAL", dispute.appellantPayoutAddress);

        // C. Transfer account ownership to verified true claimant
        db.updateClaimant(incumbent.id, {
          legalFirstName: dispute.appellantFirstName,
          legalLastName: dispute.appellantLastName,
          dob: dispute.appellantDob,
          ssnLast4: dispute.appellantSsnLast4,
          kycStatus: "VERIFIED",
          lockedPayoutType: "PAYPAL",
          lockedPayoutAddress: dispute.appellantPayoutAddress,
          lockedPayoutHash: newPayoutHash,
          isBannedFraudster: false
        });

        // D. Bind genuine claimant email alias as verified
        db.addAlias({
          id: `alias-adjudicated-${Date.now()}`,
          claimantId: incumbent.id,
          aliasType: "EMAIL",
          aliasValue: dispute.appellantEmail,
          isVerified: true,
          verifiedAt: new Date().toISOString()
        });

        // E. Release escrow & unfreeze all settlement claims
        const claimantClaims = db.getClaimsForClaimant(incumbent.id);
        claimantClaims.forEach(c => {
          c.status = "VERIFIED_CLEAN";
          c.payoutAddress = dispute!.appellantPayoutAddress;
          c.riskScore = 0.05;
          c.flags = ["RESTORED_VIA_JUDICIAL_ADJUDICATION"];
        });

        // F. Update dispute status
        updatedDispute = {
          ...dispute,
          status: "RESOLVED_APPELLANT_WON",
          stepUpLivenessScore: dispute.stepUpLivenessScore || 0.998,
          stepUpProofType: dispute.stepUpProofType || "DYNAMIC_LIVENESS_VIDEO",
          fraudulentPayoutBlacklisted: incumbent.lockedPayoutAddress,
          resolvedAt: new Date().toISOString(),
          adjudicationNotes: `Escrow released and directed to true claimant '${dispute.appellantPayoutAddress}'. Imposter handle '${incumbent.lockedPayoutAddress}' blacklisted. ${notes}`
        };
        db.updateDispute(dispute.id, updatedDispute);

        // G. DISPATCH WEBHOOK EVENT: claim.dispute_resolved
        const dispatchLogs = await webhookDispatcher.dispatch(
          "claim.dispute_resolved",
          {
            disputeId: dispute.id,
            settlementId: dispute.settlementId || "sett-att-2024",
            trueClaimant: {
              name: `${dispute.appellantFirstName} ${dispute.appellantLastName}`,
              payoutAddress: dispute.appellantPayoutAddress,
              livenessScore: updatedDispute.stepUpLivenessScore,
              swornDeclaration: "28 U.S.C. 1746 Sworn Record Confirmed"
            },
            adverseImposter: {
              burnerPayout: incumbent.lockedPayoutAddress,
              quarantined: true,
              blacklisted: true
            },
            escrowReleasedAmount: dispute.escrowAmount || 45.0,
            adjudicatedBy: `${actorName} (${role})`,
            timestamp: new Date().toISOString()
          },
          { tenantId }
        );

        webhookDispatches.push(...dispatchLogs);
        resultMessage = `Escrow ($${dispute.escrowAmount || 45.0}) successfully released and directed to genuine claimant ${dispute.appellantFirstName} ${dispute.appellantLastName}. Imposter handle blacklisted.`;
        break;
      }

      case "DISQUALIFY_AND_BLACKLIST": {
        const payoutToBlacklist =
          incumbent?.lockedPayoutAddress ||
          dispute?.fraudulentPayoutBlacklisted ||
          "burner_payout_syndicate99@tempmail.io";

        // A. Add payout handle to global anti-sybil blacklist
        db.addToBlacklist(payoutToBlacklist);

        // B. Flag all associated claims as FLAGGED_BOT
        if (incumbentId) {
          db.updateClaimsStatusForClaimant(incumbentId, "FLAGGED_BOT");
        }

        // C. Update dispute record
        if (dispute) {
          updatedDispute = {
            ...dispute,
            status: "IMPOSTER_DISQUALIFIED",
            fraudulentPayoutBlacklisted: payoutToBlacklist,
            resolvedAt: new Date().toISOString(),
            adjudicationNotes: `Imposter disqualified. Burner payout '${payoutToBlacklist}' added to Global Anti-Sybil Blacklist under Rule 23. ${notes}`
          };
          db.updateDispute(dispute.id, updatedDispute);
        }

        // D. DISPATCH WEBHOOK EVENT: claim.sybil_quarantined
        const dispatchLogs = await webhookDispatcher.dispatch(
          "claim.sybil_quarantined",
          {
            disputeId: dispute?.id,
            blacklistedPayout: payoutToBlacklist,
            reason: "Examiner disqualified adverse claim after evidentiary collision review.",
            sybilQuarantineStatus: "CONFIRMED_FRAUD_SYNDICATE",
            examinerNotes: notes,
            adjudicatedBy: `${actorName} (${role})`,
            timestamp: new Date().toISOString()
          },
          { tenantId }
        );

        webhookDispatches.push(...dispatchLogs);
        resultMessage = `Imposter claim disqualified. Payout destination '${payoutToBlacklist}' added to Global Anti-Sybil Blacklist.`;
        break;
      }

      case "REQUEST_PROOF": {
        if (!dispute) {
          return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
        }

        updatedDispute = {
          ...dispute,
          status: "SUPPLEMENTARY_PROOF_REQUESTED",
          adjudicationNotes: `Supplementary proof requested by ${actorName}. Notice dispatched for certified notarized or NFC-authenticated record. ${notes}`
        };
        db.updateDispute(dispute.id, updatedDispute);

        resultMessage = `Supplementary proof request logged. Formal notice triggered to claimant for verified identity documentation.`;
        break;
      }

      case "FREEZE_ESCROW": {
        if (dispute) {
          db.updateDispute(dispute.id, { status: "FROZEN_PENDING_STEP_UP" });
        }
        if (incumbentId) {
          db.updateClaimsStatusForClaimant(incumbentId, "FROZEN_DISPUTE");
        }

        const dispatchLogs = await webhookDispatcher.dispatch(
          "claim.escrow_hold_placed",
          {
            disputeId: dispute?.id,
            reason: "Escrow hold placed by Claims Examiner / Class Counsel pending dispute review.",
            status: "ESCROW_LOCKED_IN_TRUST",
            adjudicatedBy: `${actorName} (${role})`,
            timestamp: new Date().toISOString()
          },
          { tenantId }
        );

        webhookDispatches.push(...dispatchLogs);
        resultMessage = `Escrow freeze hold executed. Settlement disbursements frozen pending adjudication.`;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
      action,
      role,
      dispute: updatedDispute || dispute,
      webhookDispatches
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Adjudication execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
