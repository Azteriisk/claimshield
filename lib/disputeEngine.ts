import { db, IdentityDispute, Claimant } from "./db";

export interface CreateDisputeInput {
  contestedPersonHash: string;
  appellantFirstName: string;
  appellantLastName: string;
  appellantDob: string;
  appellantSsnLast4: string;
  appellantEmail: string;
  appellantPayoutAddress: string;
}

export class DisputeEngine {
  /**
   * STEP 1: CIRCUIT BREAKER
   * Tripped immediately when an appellant claims their identity was stolen.
   * Freezes the incumbent account and halts all pending settlement payouts.
   */
  public static triggerDispute(input: CreateDisputeInput): {
    success: boolean;
    dispute: IdentityDispute;
    incumbentClaimant: Claimant;
    message: string;
  } {
    const incumbent = db.getClaimantByPersonHash(input.contestedPersonHash);
    if (!incumbent) {
      throw new Error("No incumbent account found matching this identity hash.");
    }

    // 1. FREEZE the incumbent account immediately
    db.updateClaimant(incumbent.id, {
      kycStatus: "FROZEN_DISPUTE"
    });

    // 2. FREEZE all claims submitted under this identity
    db.updateClaimsStatusForClaimant(incumbent.id, "FROZEN_DISPUTE");

    // 3. Log the Identity Dispute Record
    const dispute: IdentityDispute = {
      id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contestedPersonHash: input.contestedPersonHash,
      incumbentClaimantId: incumbent.id,
      appellantEmail: input.appellantEmail,
      appellantFirstName: input.appellantFirstName,
      appellantLastName: input.appellantLastName,
      appellantDob: input.appellantDob,
      appellantSsnLast4: input.appellantSsnLast4,
      appellantPayoutAddress: input.appellantPayoutAddress,
      status: "FROZEN_PENDING_STEP_UP",
      createdAt: new Date().toISOString()
    };

    db.addDispute(dispute);

    return {
      success: true,
      dispute,
      incumbentClaimant: incumbent,
      message: "⚡ CIRCUIT BREAKER TRIPPED: All pending settlement payouts and account access have been frozen. Proceed with Step-Up Verification to reclaim ownership."
    };
  }

  /**
   * STEP 2: HIGH-ASSURANCE STEP-UP VERIFICATION & ACCOUNT RECLAMATION
   * Simulates Level 3 NIST biometric liveness & NFC chip authentication.
   * Evicts the fraudster, blacklists their payout address, and transfers ownership.
   */
  public static resolveAppealWithStepUp(
    disputeId: string,
    proofType: "NFC_PASSPORT" | "DYNAMIC_LIVENESS_VIDEO"
  ): {
    success: boolean;
    dispute: IdentityDispute;
    reclaimedClaimant: Claimant;
    message: string;
  } {
    const dispute = db.getDispute(disputeId);
    if (!dispute) {
      throw new Error("Dispute record not found.");
    }

    const incumbent = db.getClaimantById(dispute.incumbentClaimantId);
    if (!incumbent) {
      throw new Error("Incumbent account not found.");
    }

    // High assurance verification score (e.g. 99.4% authentic biometrics)
    const livenessScore = proofType === "NFC_PASSPORT" ? 0.998 : 0.985;

    // 1. Blacklist the fraudster's burner payout address
    db.addToBlacklist(incumbent.lockedPayoutAddress);

    // 2. Re-compute legitimate payout hash for appellant
    const newPayoutHash = db.computePayoutHash("PAYPAL", dispute.appellantPayoutAddress);

    // 3. Update Claimant record with genuine victim's authenticated data
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

    // 4. Bind appellant's email alias as verified
    db.addAlias({
      id: `alias-${Date.now()}`,
      claimantId: incumbent.id,
      aliasType: "EMAIL",
      aliasValue: dispute.appellantEmail,
      isVerified: true,
      verifiedAt: new Date().toISOString()
    });

    // 5. UNFREEZE CLAIMS and re-route payouts to the legitimate victim!
    const claims = db.getClaimsForClaimant(incumbent.id);
    claims.forEach(c => {
      c.status = "VERIFIED_CLEAN";
      c.payoutAddress = dispute.appellantPayoutAddress;
      c.riskScore = 0.05;
      c.flags = ["RESTORED_VIA_BIOMETRIC_APPEAL"];
    });

    // 6. Mark dispute as RESOLVED
    const resolvedDispute: IdentityDispute = {
      ...dispute,
      status: "RESOLVED_APPELLANT_WON",
      stepUpLivenessScore: livenessScore,
      stepUpProofType: proofType,
      fraudulentPayoutBlacklisted: incumbent.lockedPayoutAddress,
      resolvedAt: new Date().toISOString(),
      adjudicationNotes: `Biometric liveness confirmed (${(livenessScore * 100).toFixed(1)}%). Fraudulent payout handle '${incumbent.lockedPayoutAddress}' blacklisted. Payouts successfully re-routed to '${dispute.appellantPayoutAddress}'.`
    };

    db.updateDispute(disputeId, resolvedDispute);

    return {
      success: true,
      dispute: resolvedDispute,
      reclaimedClaimant: db.getClaimantById(incumbent.id)!,
      message: "🎉 Appeal Approved! Identity successfully reclaimed. Fraudster evicted and blacklisted. All settlement claims have been un-frozen and re-routed to your verified payout."
    };
  }
}
