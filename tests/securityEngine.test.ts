import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { db } from "../lib/db";
import {
  PersonaAdapter,
  StripeIdentityAdapter
} from "../lib/kyc/identityProvider";
import {
  LocalHsmAdapter,
  CloudKmsAdapter
} from "../lib/kms/keyManager";
import {
  PayoutValidator,
  compareLegalNames,
  jaroWinklerDistance,
  tokenSetSimilarity,
  normalizeLegalName
} from "../lib/financialRails/payoutValidator";
import { EphemeralScrubber } from "../lib/kyc/ephemeralScrubber";

describe("ClaimShield Security & Identity Engine", () => {
  beforeEach(() => {
    db.resetSimulationFixtures();
  });

  // =========================================================================
  // 1. KYC IDENTITY PROVIDERS (Persona & Stripe Identity)
  // =========================================================================
  describe("1. Enterprise KYC Providers & NIST 800-63A Level 3 Verification", () => {
    describe("PersonaAdapter", () => {
      it("should create a sandbox verification session with valid metadata", async () => {
        const persona = new PersonaAdapter({ environment: "sandbox" });
        expect(persona.isSandbox).toBe(true);

        const session = await persona.createVerificationSession("claimant-1001", {
          returnUrl: "https://claimshield.org/callback",
          requireLiveness: true
        });

        expect(session.sessionId).toContain("inq_sandbox_");
        expect(session.claimantId).toBe("claimant-1001");
        expect(session.provider).toBe("PERSONA");
        expect(session.status).toBe("CREATED");
        expect(session.hostedUrl).toContain("withpersona.com/verify");
        expect(session.clientSecret).toBeDefined();
      });

      it("should reject session creation if claimant ID is missing", async () => {
        const persona = new PersonaAdapter();
        await expect(persona.createVerificationSession("")).rejects.toThrow(
          "Claimant ID is required"
        );
      });

      it("should retrieve NIST 800-63A Level 3 compliant scores and liveness proof token", async () => {
        const persona = new PersonaAdapter();
        const result = await persona.retrieveSessionResult("inq_sandbox_valid_claimant");

        expect(result.status).toBe("VERIFIED");
        expect(result.provider).toBe("PERSONA");
        expect(result.verificationScores.nistAssuranceLevel).toBe("IAL3");
        expect(result.verificationScores.livenessScore).toBeGreaterThanOrEqual(0.98);
        expect(result.verificationScores.documentAuthenticityScore).toBeGreaterThanOrEqual(0.98);
        expect(result.verificationScores.presentationAttackDetected).toBe(false);

        // Verify cryptographic structure of liveness proof token
        expect(result.livenessProofToken).toBeDefined();
        const [headerB64, sig] = result.livenessProofToken.split(".");
        expect(headerB64).toBeDefined();
        expect(sig).toBeDefined();
        const decoded = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf-8"));
        expect(decoded.nistLevel).toBe("IAL3");
        expect(decoded.padCompliant).toBe(true);
      });

      it("should report presentation attack failure on fraudulent inquiry session", async () => {
        const persona = new PersonaAdapter();
        const result = await persona.retrieveSessionResult("inq_sandbox_failed_liveness_check");

        expect(result.status).toBe("FAILED");
        expect(result.verificationScores.presentationAttackDetected).toBe(true);
        expect(result.verificationScores.livenessScore).toBeLessThan(0.5);
        expect(result.livenessProofToken).toBe("");
        expect(result.failureReason).toContain("Presentation attack detected");
      });

      it("should verify authentic Persona webhook signature", async () => {
        const secret = "test_persona_webhook_secret_key";
        const persona = new PersonaAdapter({ webhookSecret: secret });

        const body = JSON.stringify({ event: "inquiry.completed", id: "inq_123" });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const hmac = crypto
          .createHmac("sha256", secret)
          .update(`${timestamp}.${body}`)
          .digest("hex");

        const isValid = await persona.verifyWebhookSignature(
          { "persona-signature": `t=${timestamp},v1=${hmac}` },
          body
        );
        expect(isValid).toBe(true);
      });

      it("should reject tampered Persona webhook signatures", async () => {
        const secret = "test_persona_webhook_secret_key";
        const persona = new PersonaAdapter({ webhookSecret: secret });

        const body = JSON.stringify({ event: "inquiry.completed", id: "inq_123" });
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const isValid = await persona.verifyWebhookSignature(
          { "persona-signature": `t=${timestamp},v1=deadbeef00001111` },
          body
        );
        expect(isValid).toBe(false);
      });
    });

    describe("StripeIdentityAdapter", () => {
      it("should create a Stripe Identity session in sandbox mode", async () => {
        const stripe = new StripeIdentityAdapter({ environment: "sandbox" });
        expect(stripe.isSandbox).toBe(true);

        const session = await stripe.createVerificationSession("claimant-2002");
        expect(session.sessionId).toContain("vs_sandbox_");
        expect(session.claimantId).toBe("claimant-2002");
        expect(session.provider).toBe("STRIPE_IDENTITY");
        expect(session.hostedUrl).toContain("verify.stripe.com");
      });

      it("should retrieve NIST Level 3 verified scores from Stripe Identity session", async () => {
        const stripe = new StripeIdentityAdapter();
        const result = await stripe.retrieveSessionResult("vs_sandbox_pass_998");

        expect(result.status).toBe("VERIFIED");
        expect(result.verificationScores.nistAssuranceLevel).toBe("IAL3");
        expect(result.verificationScores.livenessScore).toBeGreaterThanOrEqual(0.98);
        expect(result.livenessProofToken.length).toBeGreaterThan(30);
      });

      it("should verify Stripe webhook signatures and reject tampered bodies", async () => {
        const secret = "whsec_stripe_test_secret_12345";
        const stripe = new StripeIdentityAdapter({ webhookSecret: secret });

        const body = JSON.stringify({ type: "identity.verification_session.verified" });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const sig = crypto
          .createHmac("sha256", secret)
          .update(`${timestamp}.${body}`)
          .digest("hex");

        const validResult = await stripe.verifyWebhookSignature(
          { "stripe-signature": `t=${timestamp},v1=${sig}` },
          body
        );
        expect(validResult).toBe(true);

        // Tamper body
        const tamperedResult = await stripe.verifyWebhookSignature(
          { "stripe-signature": `t=${timestamp},v1=${sig}` },
          body + "tampered"
        );
        expect(tamperedResult).toBe(false);
      });
    });
  });

  // =========================================================================
  // 2. KMS & HSM CRYPTOGRAPHIC ISOLATION
  // =========================================================================
  describe("2. Cryptographic Isolation & Deterministic Blind Indexing", () => {
    describe("LocalHsmAdapter", () => {
      it("should compute deterministic blind indices across casing and spaces", async () => {
        const hsm = new LocalHsmAdapter();
        const piiRaw1 = "John.Doe@Example.COM";
        const piiRaw2 = "  john.doe@example.com ";

        const index1 = await hsm.computeDeterministicBlindIndex(piiRaw1);
        const index2 = await hsm.computeDeterministicBlindIndex(piiRaw2);

        expect(index1).toHaveLength(64);
        expect(index1).toBe(index2);
      });

      it("should produce distinct blind indices for distinct PII values", async () => {
        const hsm = new LocalHsmAdapter();
        const indexA = await hsm.computeDeterministicBlindIndex("Alice.Smith@example.com");
        const indexB = await hsm.computeDeterministicBlindIndex("Bob.Jones@example.com");

        expect(indexA).not.toBe(indexB);
      });

      it("should sign and verify audit tokens", async () => {
        const hsm = new LocalHsmAdapter({ keyId: "hsm-claimshield-audit-1" });
        const auditPayload = {
          action: "PAYOUT_APPROVED",
          claimantId: "claimant-4001",
          amount: 1500.0,
          complianceLevel: "IAL3"
        };

        const token = await hsm.signAuditToken(auditPayload);
        expect(token.split(".")).toHaveLength(3);

        const verification = await hsm.verifyAuditToken(token);
        expect(verification.valid).toBe(true);
        expect(verification.payload?.action).toBe("PAYOUT_APPROVED");
        expect(verification.payload?.claimantId).toBe("claimant-4001");
      });

      it("should reject tampered audit tokens", async () => {
        const hsm = new LocalHsmAdapter();
        const token = await hsm.signAuditToken({ action: "VERIFY_KYC", status: "CLEAN" });

        const parts = token.split(".");
        // Modify payload part
        const tamperedPayload = Buffer.from(
          JSON.stringify({ action: "VERIFY_KYC", status: "MODIFIED_FRAUD" })
        ).toString("base64url");
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

        const result = await hsm.verifyAuditToken(tamperedToken);
        expect(result.valid).toBe(false);
      });

      it("should guarantee cryptographic isolation between blind indexing and audit signing subkeys", () => {
        const hsm = new LocalHsmAdapter();
        expect(hsm.verifyKeyIsolation()).toBe(true);
      });
    });

    describe("CloudKmsAdapter", () => {
      it("should support AWS KMS envelope encryption simulation and deterministic indexing", async () => {
        const awsKms = new CloudKmsAdapter({
          provider: "AWS_KMS",
          keyId: "arn:aws:kms:us-east-1:123456789012:key/claimshield-root-key",
          region: "us-east-1"
        });

        expect(awsKms.provider).toBe("AWS_KMS");
        expect(awsKms.verifyContextIsolation()).toBe(true);

        const index1 = await awsKms.computeDeterministicBlindIndex("SSN-999-00-1234");
        const index2 = await awsKms.computeDeterministicBlindIndex("ssn-999-00-1234");
        expect(index1).toHaveLength(64);
        expect(index1).toBe(index2);
      });

      it("should support GCP Cloud KMS envelope signing and verification", async () => {
        const gcpKms = new CloudKmsAdapter({
          provider: "GCP_KMS",
          keyId: "projects/claimshield/locations/global/keyRings/ring-1/cryptoKeys/key-sec",
          region: "global"
        });

        expect(gcpKms.provider).toBe("GCP_KMS");
        const token = await gcpKms.signAuditToken({
          event: "ENVELOPE_KEY_ROTATED",
          targetKms: "gcp"
        });

        const verified = await gcpKms.verifyAuditToken(token);
        expect(verified.valid).toBe(true);
        expect(verified.payload?.event).toBe("ENVELOPE_KEY_ROTATED");
      });
    });
  });

  // =========================================================================
  // 3. FINANCIAL RAIL LINKING & FUZZY NAME VERIFICATION
  // =========================================================================
  describe("3. Financial Rail Name Verification & Imposter Redirection Protection", () => {
    describe("Fuzzy Legal Name Algorithms", () => {
      it("should return 1.0 similarity on exact name matches", () => {
        const result = compareLegalNames("Jane Doe", "Jane Doe");
        expect(result.score).toBe(1.0);
        expect(result.decision).toBe("MATCH");
        expect(result.confidence).toBe("HIGH");
      });

      it("should match legal names with middle names and initials", () => {
        const result1 = compareLegalNames("Jane Marie Doe", "Jane Doe");
        expect(result1.score).toBeGreaterThanOrEqual(0.82);
        expect(result1.decision).toBe("MATCH");

        const result2 = compareLegalNames("Robert A. Miller", "Robert Andrew Miller");
        expect(result2.score).toBeGreaterThanOrEqual(0.82);
        expect(result2.decision).toBe("MATCH");
      });

      it("should recognize common legal nicknames (Robert -> Bob, William -> Bill)", () => {
        const bobResult = compareLegalNames("Bob Miller", "Robert Miller");
        expect(bobResult.isNicknameMatch).toBe(true);
        expect(bobResult.score).toBeGreaterThanOrEqual(0.82);
        expect(bobResult.decision).toBe("MATCH");

        const billResult = compareLegalNames("Bill Wilson", "William Wilson");
        expect(billResult.isNicknameMatch).toBe(true);
        expect(billResult.score).toBeGreaterThanOrEqual(0.82);
      });

      it("should handle inverted name representations (Last, First)", () => {
        const result = compareLegalNames("Smith Jane", "Jane Smith");
        expect(result.score).toBeGreaterThanOrEqual(0.82);
        expect(result.decision).toBe("MATCH");
      });

      it("should firmly reject imposter names with low scores", () => {
        const imposterResult = compareLegalNames("Vladimir Petrov", "Jane Doe");
        expect(imposterResult.score).toBeLessThan(0.4);
        expect(imposterResult.decision).toBe("MISMATCH_REJECTED");
        expect(imposterResult.confidence).toBe("LOW");
      });

      it("should strip common suffixes and titles", () => {
        expect(normalizeLegalName("Dr. Jane Doe, Jr.")).toBe("jane doe");
        expect(normalizeLegalName("Robert Miller III, Esq.")).toBe("robert miller");
      });
    });

    describe("PayPal Recipient Verification", () => {
      const validator = new PayoutValidator();

      it("should authorize verified PayPal recipient matching claimant legal name", async () => {
        const res = await validator.verifyPayPalRecipient("janedoe.real@gmail.com", "Jane Doe");
        expect(res.isAuthorized).toBe(true);
        expect(res.decision).toBe("MATCH");
        expect(res.matchScore).toBeGreaterThanOrEqual(0.82);
      });

      it("should reject and flag imposter PayPal payout redirection attempts", async () => {
        const res = await validator.verifyPayPalRecipient(
          "burner_imposter_drop99@tempmail.io",
          "Jane Doe"
        );
        expect(res.isAuthorized).toBe(false);
        expect(res.decision).toBe("MISMATCH_REJECTED");
        expect(res.flags).toContain("IMPOSTER_REDIRECTION_BLOCKED");
      });

      it("should immediately reject blacklisted PayPal addresses", async () => {
        db.addToBlacklist("fraudster_syndicate@burner.com");
        const res = await validator.verifyPayPalRecipient(
          "fraudster_syndicate@burner.com",
          "Jane Doe"
        );
        expect(res.isAuthorized).toBe(false);
        expect(res.flags).toContain("BLACKLISTED_PAYOUT_ADDRESS");
      });

      it("should reject invalid email formats", async () => {
        const res = await validator.verifyPayPalRecipient("not-an-email", "Jane Doe");
        expect(res.isAuthorized).toBe(false);
        expect(res.flags).toContain("INVALID_EMAIL_FORMAT");
      });
    });

    describe("Plaid Bank Account Verification", () => {
      const validator = new PayoutValidator();

      it("should authorize authentic bank account matching expected claimant name", async () => {
        const res = await validator.verifyPlaidAccount("public-sandbox-token-valid", "Jane Doe");
        expect(res.isAuthorized).toBe(true);
        expect(res.decision).toBe("MATCH");
        expect(res.institutionName).toBeDefined();
        expect(res.mask).toHaveLength(4);
      });

      it("should authorize bank account with middle name variation", async () => {
        const res = await validator.verifyPlaidAccount(
          "public-sandbox-middle_name-token",
          "Jane Doe"
        );
        expect(res.isAuthorized).toBe(true);
        expect(res.decision).toBe("MATCH");
      });

      it("should reject imposter bank account redirection attempt", async () => {
        const res = await validator.verifyPlaidAccount(
          "public-sandbox-imposter-redirect",
          "Jane Doe"
        );
        expect(res.isAuthorized).toBe(false);
        expect(res.decision).toBe("MISMATCH_REJECTED");
        expect(res.flags).toContain("IMPOSTER_REDIRECTION_BLOCKED");
      });

      it("should reject invalid public tokens", async () => {
        const res = await validator.verifyPlaidAccount("", "Jane Doe");
        expect(res.isAuthorized).toBe(false);
        expect(res.flags).toContain("INVALID_PUBLIC_TOKEN");
      });
    });
  });

  // =========================================================================
  // 4. EPHEMERAL SCRUBBER & ZERO-RETENTION ENFORCEMENT
  // =========================================================================
  describe("4. Ephemeral Scrubber & GDPR Art. 5(1)(e) Zero-Retention", () => {
    it("should process document in memory and completely zeroize buffer bytes", () => {
      // Create sensitive simulated identity document buffer
      const samplePdfHeader = Buffer.from("%PDF-1.7 ClaimShield Passport Verification Document 12345");
      const initialByteCopy = Buffer.from(samplePdfHeader);

      const scrubResult = EphemeralScrubber.processDocumentZeroRetention({
        documentBuffer: samplePdfHeader,
        claimantId: "claimant-zero-retention-1"
      });

      // Assert cryptographic HMAC was generated
      expect(scrubResult.documentHmac).toHaveLength(64);
      expect(scrubResult.detectedMimeType).toBe("application/pdf");
      expect(scrubResult.isValidDocument).toBe(true);
      expect(scrubResult.bytesZeroed).toBe(initialByteCopy.length);
      expect(scrubResult.memoryZeroized).toBe(true);

      // Confirm GDPR and CCPA compliance attributes
      expect(scrubResult.compliance.gdprArticle5_1_e).toBe(true);
      expect(scrubResult.compliance.ccpaStorageLimitation).toBe(true);
      expect(scrubResult.retentionPolicy).toBe("ZERO_RETENTION_EPHEMERAL_ONLY");

      // Verify the memory buffer was completely overwritten with 0x00 bytes in place
      expect(samplePdfHeader.every(byte => byte === 0)).toBe(true);
      expect(EphemeralScrubber.isZeroized(samplePdfHeader)).toBe(true);
    });

    it("should recognize PNG and JPEG magic bytes and zeroize them", () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
      ]);
      const res = EphemeralScrubber.processDocumentZeroRetention({
        documentBuffer: pngBuffer,
        claimantId: "claimant-png"
      });
      expect(res.detectedMimeType).toBe("image/png");
      expect(res.isValidDocument).toBe(true);
      expect(EphemeralScrubber.isZeroized(pngBuffer)).toBe(true);
    });

    it("should guarantee zeroization in executeWithEphemeralMemory even if handler throws", async () => {
      const sensitiveBuffer = Buffer.from("EXTREMELY_CONFIDENTIAL_SSN_999_88_7777");

      await expect(
        EphemeralScrubber.executeWithEphemeralMemory(sensitiveBuffer, buf => {
          expect(buf.toString("utf-8")).toContain("CONFIDENTIAL_SSN");
          throw new Error("Simulated processing crash inside secure enclave");
        })
      ).rejects.toThrow("Simulated processing crash inside secure enclave");

      // Buffer must still be zeroed despite exception
      expect(EphemeralScrubber.isZeroized(sensitiveBuffer)).toBe(true);
      expect(sensitiveBuffer.every(b => b === 0)).toBe(true);
    });
  });
});
