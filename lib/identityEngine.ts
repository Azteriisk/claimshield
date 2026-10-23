import { db, Claimant, SettlementClaim } from "./db";

export interface IdentityVerificationRequest {
  legalFirstName: string;
  legalLastName: string;
  dob: string;
  ssnLast4: string;
  payoutType: "PAYPAL" | "VENMO" | "ACH";
  payoutAddress: string;
  primaryEmail: string;
}

export interface VerificationResult {
  success: boolean;
  code: "VERIFIED" | "IDENTITY_COLLISION" | "PAYOUT_COLLISION" | "BLACKLISTED" | "INVALID_INPUT";
  message: string;
  claimant?: Claimant;
  existingClaimantId?: string;
  contestedPersonHash?: string;
}

export class IdentityEngine {
  /**
   * Enforces 1:1 Identity Anchoring
   * - Checks if this natural human has already registered (via HMAC-SHA256 of Name+DOB+SSN4).
   * - Checks if the payout destination is blacklisted or already tied to another person.
   */
  public static verifyAndRegister(input: IdentityVerificationRequest): VerificationResult {
    // 1. Basic formatting checks
    if (!input.legalFirstName || !input.legalLastName || !input.dob || !input.ssnLast4) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Legal first name, last name, DOB, and last 4 of SSN are required for identity anchoring."
      };
    }

    if (!input.payoutAddress) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "A locked payout destination (PayPal, Venmo, or ACH) is required."
      };
    }

    // 2. Blacklist check
    if (db.isBlacklisted(input.payoutAddress)) {
      return {
        success: false,
        code: "BLACKLISTED",
        message: "This payout address has been flagged and blacklisted due to confirmed fraudulent activity."
      };
    }

    // 3. Compute Deterministic Hashes
    const personHash = db.computePersonHash(
      input.legalFirstName,
      input.legalLastName,
      input.dob,
      input.ssnLast4
    );
    const payoutHash = db.computePayoutHash(input.payoutType, input.payoutAddress);

    // 4. IDENTITY COLLISION CHECK: Has this human already been registered?
    const existingPerson = db.getClaimantByPersonHash(personHash);
    if (existingPerson) {
      return {
        success: false,
        code: "IDENTITY_COLLISION",
        message: "An active account is already registered with this exact government identity. If this wasn't you, an impersonator may have hijacked your credentials.",
        existingClaimantId: existingPerson.id,
        contestedPersonHash: personHash
      };
    }

    // 5. PAYOUT COLLISION CHECK: Is this PayPal/ACH already bound to another user?
    const existingPayout = db.getClaimantByPayoutHash(payoutHash);
    if (existingPayout) {
      return {
        success: false,
        code: "PAYOUT_COLLISION",
        message: "This payout destination is already locked to another verified claimant account. Each payout rail can only be paired to 1 user."
      };
    }

    // 6. Create Verified Claimant Record
    const newClaimant: Claimant = {
      id: `claimant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      uniquePersonHash: personHash,
      legalFirstName: input.legalFirstName.trim(),
      legalLastName: input.legalLastName.trim(),
      dob: input.dob.trim(),
      ssnLast4: input.ssnLast4.trim(),
      kycStatus: "VERIFIED",
      lockedPayoutType: input.payoutType,
      lockedPayoutAddress: input.payoutAddress.trim(),
      lockedPayoutHash: payoutHash,
      createdAt: new Date().toISOString()
    };

    db.addClaimant(newClaimant);

    // Bind primary email alias
    db.addAlias({
      id: `alias-${Date.now()}`,
      claimantId: newClaimant.id,
      aliasType: "EMAIL",
      aliasValue: input.primaryEmail.trim(),
      isVerified: true,
      verifiedAt: new Date().toISOString()
    });

    return {
      success: true,
      code: "VERIFIED",
      message: "Identity verified. 1:1 Account Anchor successfully locked.",
      claimant: newClaimant
    };
  }

  /**
   * Evaluates Fraud & Sybil Risk on a Claim
   */
  public static scoreClaim(params: {
    claimant: Claimant;
    payoutAddress: string;
    aliasValue: string;
    submissionSpeedSec: number;
    ipAddress: string;
    isDatacenter: boolean;
  }): { riskScore: number; flags: string[]; status: SettlementClaim["status"] } {
    let score = 0.05; // Base confidence for verified account
    const flags: string[] = [];

    // Check payout divergence (if someone attempts to route payout away from their locked destination)
    if (params.payoutAddress.toLowerCase() !== params.claimant.lockedPayoutAddress.toLowerCase()) {
      score += 0.45;
      flags.push("PAYOUT_DESTINATION_MISMATCH");
    }

    // Check datacenter/proxy IP
    if (params.isDatacenter) {
      score += 0.25;
      flags.push("DATACENTER_PROXY_IP");
    }

    // Check inhuman submission speed (< 2 seconds indicates automated headless browser/bot)
    if (params.submissionSpeedSec < 2.5) {
      score += 0.30;
      flags.push("SUPERHUMAN_SUBMISSION_SPEED");
    }

    // Check if claimant is currently in a dispute freeze
    if (params.claimant.kycStatus === "FROZEN_DISPUTE") {
      score = 0.99;
      flags.push("ACCOUNT_FROZEN_UNDER_DISPUTE");
    }

    const finalScore = Math.min(Math.round(score * 100) / 100, 1.0);

    let status: SettlementClaim["status"] = "VERIFIED_CLEAN";
    if (params.claimant.kycStatus === "FROZEN_DISPUTE") {
      status = "FROZEN_DISPUTE";
    } else if (finalScore >= 0.6) {
      status = "FLAGGED_BOT";
    } else if (finalScore >= 0.35) {
      status = "HIJACK_SUSPECT";
    }

    return {
      riskScore: finalScore,
      flags,
      status
    };
  }
}
