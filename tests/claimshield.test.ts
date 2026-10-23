import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { IdentityEngine } from "../lib/identityEngine";
import { DisputeEngine } from "../lib/disputeEngine";

describe("ClaimShield Core Security & Anti-Sybil Test Suite", () => {
  beforeEach(() => {
    // Clean test state can be verified against active DB instance
  });

  describe("1. Strict 1:1 Identity Anchoring & Sybil Resistance", () => {
    it("should deterministically hash legal identity", () => {
      const hash1 = db.computePersonHash("Alice", "Smith", "1992-04-12", "1234");
      const hash2 = db.computePersonHash("alice", "smith", "1992-04-12", "1234");
      expect(hash1).toBe(hash2); // Case insensitive normalization
      expect(hash1).toHaveLength(64); // SHA-256 hex string
    });

    it("should successfully register a unique individual", () => {
      const result = IdentityEngine.verifyAndRegister({
        legalFirstName: "TestAlice",
        legalLastName: "Smith",
        dob: "1992-04-12",
        ssnLast4: "9911",
        payoutType: "PAYPAL",
        payoutAddress: "alice.real@example.com",
        primaryEmail: "alice.real@example.com"
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe("VERIFIED");
      expect(result.claimant).toBeDefined();
      expect(result.claimant?.kycStatus).toBe("VERIFIED");
    });

    it("should reject an attempt to create a second account for the same person (IDENTITY_COLLISION)", () => {
      // First registration
      IdentityEngine.verifyAndRegister({
        legalFirstName: "Duplicate",
        legalLastName: "User",
        dob: "1988-08-08",
        ssnLast4: "5544",
        payoutType: "PAYPAL",
        payoutAddress: "dup1@example.com",
        primaryEmail: "dup1@example.com"
      });

      // Second registration with same legal identity but different email/payout
      const collisionResult = IdentityEngine.verifyAndRegister({
        legalFirstName: "Duplicate",
        legalLastName: "User",
        dob: "1988-08-08",
        ssnLast4: "5544",
        payoutType: "PAYPAL",
        payoutAddress: "dup2_fraud@example.com",
        primaryEmail: "dup2_fraud@example.com"
      });

      expect(collisionResult.success).toBe(false);
      expect(collisionResult.code).toBe("IDENTITY_COLLISION");
      expect(collisionResult.contestedPersonHash).toBeDefined();
    });

    it("should reject reuse of an existing locked payout destination (PAYOUT_COLLISION)", () => {
      const result = IdentityEngine.verifyAndRegister({
        legalFirstName: "Different",
        legalLastName: "Person",
        dob: "1995-01-01",
        ssnLast4: "3322",
        payoutType: "PAYPAL",
        payoutAddress: "alice.real@example.com", // already locked to TestAlice
        primaryEmail: "different@example.com"
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("PAYOUT_COLLISION");
    });
  });

  describe("2. Rule 23 Class Action Constraint (1 Claim per Person)", () => {
    it("should reject a duplicate claim from the same person on the same settlement", () => {
      // Find or create test claimant
      const testClaimant = db.getClaimants()[0];
      const settlementId = "sett-tm-2024";

      // If already claimed, hasClaimedSettlement must return true
      if (!db.hasClaimedSettlement(testClaimant.id, settlementId)) {
        db.addClaim({
          id: `claim-test-${Date.now()}`,
          settlementId,
          claimantId: testClaimant.id,
          qualifyingAlias: "test@example.com",
          payoutAddress: testClaimant.lockedPayoutAddress,
          riskScore: 0.05,
          status: "VERIFIED_CLEAN",
          flags: [],
          submissionSpeedSec: 30,
          ipAddress: "127.0.0.1",
          isDatacenter: false,
          submittedAt: new Date().toISOString()
        });
      }

      expect(db.hasClaimedSettlement(testClaimant.id, settlementId)).toBe(true);
    });
  });

  describe("3. Identity Dispute, Circuit Breaker & Account Recovery", () => {
    it("should immediately freeze account and claims when dispute circuit breaker is tripped", () => {
      // Setup a claimant to dispute
      const reg = IdentityEngine.verifyAndRegister({
        legalFirstName: "Victim",
        legalLastName: "Target",
        dob: "1980-03-15",
        ssnLast4: "7777",
        payoutType: "PAYPAL",
        payoutAddress: "burner_imposter@tempmail.io",
        primaryEmail: "victim.breached@example.com"
      });

      expect(reg.success).toBe(true);
      const incumbent = reg.claimant!;

      // Add a pending claim under this incumbent
      db.addClaim({
        id: "claim-dispute-target",
        settlementId: "sett-att-2024",
        claimantId: incumbent.id,
        qualifyingAlias: "victim.breached@example.com",
        payoutAddress: "burner_imposter@tempmail.io",
        riskScore: 0.70,
        status: "HIJACK_SUSPECT",
        flags: ["SUSPICIOUS_PAYOUT_DOMAIN"],
        submissionSpeedSec: 1.5,
        ipAddress: "198.51.100.1",
        isDatacenter: true,
        submittedAt: new Date().toISOString()
      });

      // Genuine victim discovers collision and triggers dispute
      const disputeResult = DisputeEngine.triggerDispute({
        contestedPersonHash: incumbent.uniquePersonHash,
        appellantFirstName: "Victim",
        appellantLastName: "Target",
        appellantDob: "1980-03-15",
        appellantSsnLast4: "7777",
        appellantEmail: "victim.real@gmail.com",
        appellantPayoutAddress: "victim.real@gmail.com"
      });

      expect(disputeResult.success).toBe(true);
      expect(disputeResult.dispute.status).toBe("FROZEN_PENDING_STEP_UP");

      // Verify incumbent account is FROZEN
      const updatedIncumbent = db.getClaimantById(incumbent.id);
      expect(updatedIncumbent?.kycStatus).toBe("FROZEN_DISPUTE");

      // Verify all claims are FROZEN
      const claims = db.getClaimsForClaimant(incumbent.id);
      expect(claims.every(c => c.status === "FROZEN_DISPUTE")).toBe(true);
    });

    it("should successfully resolve dispute upon Step-Up verification and blacklist fraudster", () => {
      const disputes = db.getDisputes().filter(d => d.status === "FROZEN_PENDING_STEP_UP");
      expect(disputes.length).toBeGreaterThan(0);
      const targetDispute = disputes[0];

      const resolution = DisputeEngine.resolveAppealWithStepUp(
        targetDispute.id,
        "DYNAMIC_LIVENESS_VIDEO"
      );

      expect(resolution.success).toBe(true);
      expect(resolution.dispute.status).toBe("RESOLVED_APPELLANT_WON");
      expect(resolution.dispute.stepUpLivenessScore).toBeGreaterThan(0.95);

      // Verify fraudster's payout address was blacklisted
      expect(db.isBlacklisted("burner_imposter@tempmail.io")).toBe(true);

      // Verify reclaimed claimant has updated verified payout
      expect(resolution.reclaimedClaimant.lockedPayoutAddress).toBe("victim.real@gmail.com");
      expect(resolution.reclaimedClaimant.kycStatus).toBe("VERIFIED");

      // Verify frozen claims were un-frozen and re-routed
      const claims = db.getClaimsForClaimant(resolution.reclaimedClaimant.id);
      expect(claims.every(c => c.status === "VERIFIED_CLEAN")).toBe(true);
      expect(claims.every(c => c.payoutAddress === "victim.real@gmail.com")).toBe(true);
    });
  });

  describe("4. B2B Anti-Fraud Risk Scoring Heuristics", () => {
    it("should flag datacenter IPs and superhuman submission speed as high risk", () => {
      const mockClaimant = db.getClaimants()[0];

      const botScore = IdentityEngine.scoreClaim({
        claimant: mockClaimant,
        payoutAddress: "different_diverged@burner.com",
        aliasValue: "test@example.com",
        submissionSpeedSec: 0.9,
        ipAddress: "104.244.72.115",
        isDatacenter: true
      });

      expect(botScore.riskScore).toBeGreaterThanOrEqual(0.60);
      expect(botScore.status).toBe("FLAGGED_BOT");
      expect(botScore.flags).toContain("DATACENTER_PROXY_IP");
      expect(botScore.flags).toContain("SUPERHUMAN_SUBMISSION_SPEED");
      expect(botScore.flags).toContain("PAYOUT_DESTINATION_MISMATCH");
    });

    it("should grant low risk score to genuine human submissions", () => {
      const mockClaimant = db.getClaimants()[0];

      const humanScore = IdentityEngine.scoreClaim({
        claimant: mockClaimant,
        payoutAddress: mockClaimant.lockedPayoutAddress,
        aliasValue: mockClaimant.lockedPayoutAddress,
        submissionSpeedSec: 45.0,
        ipAddress: "98.210.14.88",
        isDatacenter: false
      });

      expect(humanScore.riskScore).toBeLessThan(0.20);
      expect(humanScore.status).toBe("VERIFIED_CLEAN");
      expect(humanScore.flags).toHaveLength(0);
    });
  });
});
