import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../lib/db";
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  WebhookDispatcher,
  WebhookEventType,
  DEFAULT_WEBHOOK_SUBSCRIPTIONS
} from "../lib/webhooks/dispatcher";
import {
  Role,
  Permission,
  hasPermission,
  getPermissionsForRole,
  hasTenantAccess,
  canExaminerPerform,
  ROLE_PERMISSIONS,
  SAMPLE_EXAMINER_PROFILES
} from "../lib/rbac/permissions";
import { POST as adjudicateRouteHandler } from "../app/api/admin/adjudicate/route";

describe("ClaimShield B2B Enterprise Engine Test Suite", () => {
  beforeEach(() => {
    db.resetSimulationFixtures();
  });

  // ==========================================
  // 1. WEBHOOK HMAC-SHA256 SIGNATURE ENGINE
  // ==========================================
  describe("1. Enterprise Webhook Engine & HMAC-SHA256 Cryptography", () => {
    const testSecret = "sec_test_enterprise_classaction_2026";
    const testPayload = {
      event: "claim.evaluated_risk" as WebhookEventType,
      claimId: "claim-att-test-01",
      riskScore: 0.88,
      verdict: "REJECT_BOT",
      tenantId: "kroll"
    };

    it("should generate valid HMAC-SHA256 signatures with sha256= prefix", () => {
      const timestamp = 1774000000000;
      const { signature, header, timestamp: tsStr } = generateWebhookSignature(
        testPayload,
        testSecret,
        timestamp
      );

      expect(signature).toHaveLength(64); // 256 bits = 64 hex chars
      expect(header).toBe(`sha256=${signature}`);
      expect(tsStr).toBe(String(timestamp));
    });

    it("should successfully verify authentic webhook signatures", () => {
      const timestamp = Date.now().toString();
      const { header } = generateWebhookSignature(testPayload, testSecret, timestamp);

      const isValid = verifyWebhookSignature({
        payload: testPayload,
        signature: header,
        secret: testSecret,
        timestamp
      });

      expect(isValid).toBe(true);
    });

    it("should reject tampered payload data", () => {
      const timestamp = Date.now().toString();
      const { header } = generateWebhookSignature(testPayload, testSecret, timestamp);

      const tamperedPayload = { ...testPayload, riskScore: 0.05 }; // Altered risk score

      const isValid = verifyWebhookSignature({
        payload: tamperedPayload,
        signature: header,
        secret: testSecret,
        timestamp
      });

      expect(isValid).toBe(false);
    });

    it("should reject signatures signed with incorrect secret", () => {
      const timestamp = Date.now().toString();
      const { header } = generateWebhookSignature(testPayload, "wrong_secret_key", timestamp);

      const isValid = verifyWebhookSignature({
        payload: testPayload,
        signature: header,
        secret: testSecret,
        timestamp
      });

      expect(isValid).toBe(false);
    });

    it("should reject expired timestamps when tolerance is enforced", () => {
      const staleTimestamp = Date.now() - 600000; // 10 minutes ago
      const { header } = generateWebhookSignature(testPayload, testSecret, staleTimestamp);

      const isValid = verifyWebhookSignature({
        payload: testPayload,
        signature: header,
        secret: testSecret,
        timestamp: staleTimestamp,
        toleranceSeconds: 300 // 5 minute max drift
      });

      expect(isValid).toBe(false);
    });
  });

  // ==========================================
  // 2. WEBHOOK DISPATCH & EXPONENTIAL BACKOFF RETRY
  // ==========================================
  describe("2. Webhook Dispatch Queue & Retry Logic", () => {
    it("should dispatch typed events to matching tenant subscriptions", async () => {
      const dispatcher = new WebhookDispatcher();
      dispatcher.clearDeliveryLogs();

      const eventsToTest: WebhookEventType[] = [
        "claim.evaluated_risk",
        "claim.escrow_hold_placed",
        "claim.dispute_resolved",
        "claim.sybil_quarantined"
      ];

      for (const event of eventsToTest) {
        const logs = await dispatcher.dispatch(
          event,
          { claimDocket: "2024-CV-1992", amount: 45.0 },
          { tenantId: "kroll" }
        );

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].event).toBe(event);
        expect(logs[0].status).toBe("DELIVERED");
        expect(logs[0].signatureHeader).toMatch(/^sha256=[a-f0-9]{64}$/);
      }
    });

    it("should execute automatic exponential backoff retry up to 3 attempts on transient failure", async () => {
      const dispatcher = new WebhookDispatcher();
      let callCount = 0;

      // Mock fetch that fails twice with 500 then succeeds on 3rd attempt
      const mockFailingThenSucceedingFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return { status: 500, ok: false } as Response;
        }
        return { status: 200, ok: true } as Response;
      });

      const logs = await dispatcher.dispatch(
        "claim.sybil_quarantined",
        { actor: "bot-syndicate-42" },
        {
          directUrl: "https://api.kroll.com/v1/settlements/webhooks",
          secret: "sec_retry_test",
          customFetch: mockFailingThenSucceedingFetch,
          baseBackoffMs: 5 // fast for testing
        }
      );

      expect(callCount).toBe(3);
      expect(logs[0].attempts).toBe(3);
      expect(logs[0].status).toBe("DELIVERED");
      expect(logs[0].attemptLogs).toHaveLength(3);
      expect(logs[0].attemptLogs[0].statusCode).toBe(500);
      expect(logs[0].attemptLogs[1].statusCode).toBe(500);
      expect(logs[0].attemptLogs[2].statusCode).toBe(200);
    });

    it("should mark delivery as FAILED when max 3 retry attempts are exhausted", async () => {
      const dispatcher = new WebhookDispatcher();
      let callCount = 0;

      // Mock fetch that always throws an error
      const mockPermanentFailFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        throw new Error("Connection refused: 503 Service Unavailable");
      });

      const logs = await dispatcher.dispatch(
        "claim.escrow_hold_placed",
        { claimId: "claim-fail-001" },
        {
          directUrl: "https://offline-admin.example.com/webhook",
          secret: "sec_fail_test",
          customFetch: mockPermanentFailFetch,
          baseBackoffMs: 5
        }
      );

      expect(callCount).toBe(3);
      expect(logs[0].attempts).toBe(3);
      expect(logs[0].status).toBe("FAILED");
      expect(logs[0].error).toContain("Exhausted 3 attempts");
    });
  });

  // ==========================================
  // 3. MULTI-TENANT ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  describe("3. Multi-Tenant Role-Based Access Control (RBAC)", () => {
    it("should grant CLAIMS_EXAMINER adjudication and escrow permissions, but restrict webhook configuration", () => {
      const role: Role = "CLAIMS_EXAMINER";
      expect(hasPermission(role, "claims:view")).toBe(true);
      expect(hasPermission(role, "claims:adjudicate")).toBe(true);
      expect(hasPermission(role, "escrow:freeze")).toBe(true);
      expect(hasPermission(role, "escrow:release")).toBe(true);
      expect(hasPermission(role, "webhooks:configure")).toBe(false);
      expect(hasPermission(role, "audit:export_rule23")).toBe(false);
    });

    it("should restrict COMPLIANCE_AUDITOR to read-only inspection and Rule 23 exports", () => {
      const role: Role = "COMPLIANCE_AUDITOR";
      expect(hasPermission(role, "claims:view")).toBe(true);
      expect(hasPermission(role, "audit:export_rule23")).toBe(true);
      expect(hasPermission(role, "claims:adjudicate")).toBe(false);
      expect(hasPermission(role, "escrow:release")).toBe(false);
      expect(hasPermission(role, "escrow:freeze")).toBe(false);
      expect(hasPermission(role, "webhooks:configure")).toBe(false);
    });

    it("should grant SETTLEMENT_ADMIN full enterprise permissions", () => {
      const role: Role = "SETTLEMENT_ADMIN";
      const allPermissions: Permission[] = [
        "claims:view",
        "claims:adjudicate",
        "escrow:freeze",
        "escrow:release",
        "audit:export_rule23",
        "webhooks:configure"
      ];

      for (const perm of allPermissions) {
        expect(hasPermission(role, perm)).toBe(true);
      }
    });

    it("should grant CLASS_COUNSEL emergency freeze and audit export powers, but not direct adjudication", () => {
      const role: Role = "CLASS_COUNSEL";
      expect(hasPermission(role, "claims:view")).toBe(true);
      expect(hasPermission(role, "escrow:freeze")).toBe(true);
      expect(hasPermission(role, "audit:export_rule23")).toBe(true);
      expect(hasPermission(role, "claims:adjudicate")).toBe(false);
      expect(hasPermission(role, "escrow:release")).toBe(false);
    });

    it("should enforce multi-tenant administrative boundaries", () => {
      // Kroll examiner accessing Kroll docket
      expect(hasTenantAccess("kroll", "kroll")).toBe(true);
      // Kroll examiner accessing Epiq docket
      expect(hasTenantAccess("kroll", "epiq")).toBe(false);
      // Global monitor accessing any tenant
      expect(hasTenantAccess("global", "angeion")).toBe(true);
      expect(hasTenantAccess("global", "jnd")).toBe(true);
    });

    it("should evaluate examiner profile context permissions and tenancy", () => {
      const krollExaminer = SAMPLE_EXAMINER_PROFILES.find(p => p.role === "CLAIMS_EXAMINER")!;
      const angeionAuditor = SAMPLE_EXAMINER_PROFILES.find(p => p.role === "COMPLIANCE_AUDITOR")!;

      // Kroll examiner adjudicating Kroll claim -> ALLOWED
      const allowedCheck = canExaminerPerform(krollExaminer, "claims:adjudicate", "kroll");
      expect(allowedCheck.allowed).toBe(true);

      // Kroll examiner attempting to configure webhooks -> REJECTED
      const roleBlocked = canExaminerPerform(krollExaminer, "webhooks:configure", "kroll");
      expect(roleBlocked.allowed).toBe(false);
      expect(roleBlocked.reason).toContain("lacks required permission");

      // Angeion auditor attempting to adjudicate -> REJECTED
      const auditorBlocked = canExaminerPerform(angeionAuditor, "claims:adjudicate", "angeion");
      expect(auditorBlocked.allowed).toBe(false);

      // Kroll examiner attempting to access Angeion tenant resources -> REJECTED
      const crossTenantBlocked = canExaminerPerform(krollExaminer, "claims:adjudicate", "angeion");
      expect(crossTenantBlocked.allowed).toBe(false);
      expect(crossTenantBlocked.reason).toContain("is restricted from accessing");
    });
  });

  // ==========================================
  // 4. JUDICIAL ADJUDICATION STATUS TRANSITIONS
  // ==========================================
  describe("4. Claims Examiner Judicial Adjudication & Escrow Status Transitions", () => {
    it("should release escrow, re-route payout to true claimant, and blacklist imposter burner handle", async () => {
      const disputes = db.getDisputes();
      const seededDispute = disputes.find(d => d.appellantFirstName === "Robert")!;
      expect(seededDispute).toBeDefined();

      const req = new Request("http://localhost:3000/api/admin/adjudicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClaimShield-Role": "CLAIMS_EXAMINER"
        },
        body: JSON.stringify({
          action: "RELEASE_ESCROW",
          disputeId: seededDispute.id,
          examinerNotes: "Sworn 28 U.S.C. 1746 declaration verified with NIST Level 3 biometric liveness.",
          actorName: "Eleanor Vance, Esq."
        })
      });

      const res = await adjudicateRouteHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dispute.status).toBe("RESOLVED_APPELLANT_WON");

      // Verify fraudster's burner payout was blacklisted
      expect(db.isBlacklisted("burner_payout_syndicate99@tempmail.io")).toBe(true);

      // Verify claimant ownership transferred to legitimate claimant
      const incumbent = db.getClaimantById(seededDispute.incumbentClaimantId)!;
      expect(incumbent.legalFirstName).toBe("Robert");
      expect(incumbent.legalLastName).toBe("Miller");
      expect(incumbent.lockedPayoutAddress).toBe("robert.miller.real@gmail.com");
      expect(incumbent.kycStatus).toBe("VERIFIED");

      // Verify claims un-frozen and re-routed
      const claims = db.getClaimsForClaimant(incumbent.id);
      expect(claims.length).toBeGreaterThan(0);
      for (const claim of claims) {
        expect(claim.status).toBe("VERIFIED_CLEAN");
        expect(claim.payoutAddress).toBe("robert.miller.real@gmail.com");
        expect(claim.flags).toContain("RESTORED_VIA_JUDICIAL_ADJUDICATION");
      }

      // Verify webhook emission
      expect(json.webhookDispatches).toBeDefined();
      expect(json.webhookDispatches.length).toBeGreaterThan(0);
      expect(json.webhookDispatches[0].event).toBe("claim.dispute_resolved");
      expect(json.webhookDispatches[0].signatureHeader).toMatch(/^sha256=/);
    });

    it("should disqualify imposter claim and add payout handle to Global Anti-Sybil Blacklist", async () => {
      const disputes = db.getDisputes();
      const dispute = disputes[0];

      const req = new Request("http://localhost:3000/api/admin/adjudicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClaimShield-Role": "CLAIMS_EXAMINER"
        },
        body: JSON.stringify({
          action: "DISQUALIFY_AND_BLACKLIST",
          disputeId: dispute.id,
          examinerNotes: "Syndicate disposable drop identified."
        })
      });

      const res = await adjudicateRouteHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dispute.status).toBe("IMPOSTER_DISQUALIFIED");

      // Check blacklist
      expect(db.isBlacklisted("burner_payout_syndicate99@tempmail.io")).toBe(true);

      // Verify webhook emission
      expect(json.webhookDispatches[0].event).toBe("claim.sybil_quarantined");
    });

    it("should transition dispute to SUPPLEMENTARY_PROOF_REQUESTED when proof requested", async () => {
      const disputes = db.getDisputes();
      const dispute = disputes[0];

      const req = new Request("http://localhost:3000/api/admin/adjudicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClaimShield-Role": "CLAIMS_EXAMINER"
        },
        body: JSON.stringify({
          action: "REQUEST_PROOF",
          disputeId: dispute.id,
          examinerNotes: "Notarized affidavit requested."
        })
      });

      const res = await adjudicateRouteHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dispute.status).toBe("SUPPLEMENTARY_PROOF_REQUESTED");
    });

    it("should enforce RBAC gating and reject unauthorized examiner roles with 403 Forbidden", async () => {
      const disputes = db.getDisputes();
      const dispute = disputes[0];

      // COMPLIANCE_AUDITOR lacks claims:adjudicate and escrow:release
      const req = new Request("http://localhost:3000/api/admin/adjudicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClaimShield-Role": "COMPLIANCE_AUDITOR"
        },
        body: JSON.stringify({
          action: "RELEASE_ESCROW",
          disputeId: dispute.id
        })
      });

      const res = await adjudicateRouteHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.code).toBe("RBAC_UNAUTHORIZED");
      expect(json.error).toContain("COMPLIANCE_AUDITOR");
    });
  });
});
