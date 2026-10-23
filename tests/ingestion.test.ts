import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import {
  CourtListenerClient,
  normalizeCourtListenerDocket,
  COURT_LISTENER_OFFLINE_FIXTURES
} from "../lib/ingestion/courtListener";
import {
  classifyCompromisedCategories,
  parseCaliforniaAgNotice,
  parseMaineAgEntry,
  parseTexasAgRecord,
  scrapeStateAgBreaches,
  CALIFORNIA_AG_FIXTURES,
  MAINE_AG_FIXTURES,
  TEXAS_AG_FIXTURES
} from "../lib/ingestion/stateAgScraper";
import {
  hashAliasForKAnonymity,
  assertPrivacySafety,
  parseRangeResponse,
  PwnedClient,
  pwnedClient
} from "../lib/ingestion/pwnedClient";
import { GET, POST } from "../app/api/ingest/dockets/route";

describe("ClaimShield Docket & Breach Ingestion Engine Suite", () => {
  beforeEach(() => {
    db.resetSimulationFixtures();
  });

  // ==========================================
  // 1. COURTLISTENER DOCKET NORMALIZATION
  // ==========================================
  describe("1. CourtListener / RECAP Docket Normalization & Client", () => {
    it("should normalize an MDL docket entry with complete settlement metadata", () => {
      const fixture = COURT_LISTENER_OFFLINE_FIXTURES[0]; // CDK Global
      const settlement = normalizeCourtListenerDocket(fixture);

      expect(settlement.id).toBe("sett-court-mdl-no-3125");
      expect(settlement.caseName).toBe("In re CDK Global Dealer Services Cyber Breach Litigation");
      expect(settlement.defendant).toBe("CDK Global LLC");
      expect(settlement.courtDistrict).toBe("N.D. Ill.");
      expect(settlement.mdlNumber).toBe("MDL No. 3125");
      expect(settlement.administratorName).toBe("Angeion Group");
      expect(settlement.claimDeadline).toBe("2026-12-01");
      expect(settlement.estimatedBasePayout).toBe(50.0);
      expect(settlement.maxDocumentedLoss).toBe(5000);
      expect(settlement.status).toBe("OPEN");
      expect(settlement.eligibleDomains).toContain("cdkglobal.com");
      expect(settlement.source).toBe("courtlistener_recap");
    });

    it("should normalize Final Approval dockets and set status to FINAL_APPROVAL_PENDING", () => {
      const fixture = COURT_LISTENER_OFFLINE_FIXTURES[1]; // National Public Data
      const settlement = normalizeCourtListenerDocket(fixture);

      expect(settlement.id).toBe("sett-court-mdl-no-3131");
      expect(settlement.caseName).toContain("National Public Data");
      expect(settlement.courtDistrict).toBe("S.D. Fla.");
      expect(settlement.approvalStage).toBe("FINAL");
      expect(settlement.status).toBe("FINAL_APPROVAL_PENDING");
      expect(settlement.claimDeadline).toBe("2026-11-20");
      expect(settlement.estimatedBasePayout).toBe(75.0);
      expect(settlement.maxDocumentedLoss).toBe(10000);
    });

    it("should operate in offline fixture mode when no API token is provided", async () => {
      const client = new CourtListenerClient({ offlineMode: true });
      expect(client.isOffline()).toBe(true);

      const dockets = await client.searchDockets();
      expect(dockets.results.length).toBeGreaterThanOrEqual(4);
      expect(dockets.results[0].docket_number).toBeDefined();

      const settlements = await client.fetchSettlementOrders();
      expect(settlements.length).toBe(dockets.results.length);
      expect(settlements[0].estimatedBasePayout).toBeGreaterThan(0);
    });

    it("should filter offline dockets by query and court district", async () => {
      const client = new CourtListenerClient({ offlineMode: true });

      const filtered = await client.searchDockets("Snowflake", { court: "nysd" });
      expect(filtered.results.length).toBe(1);
      expect(filtered.results[0].case_name).toContain("Snowflake");
      expect(filtered.results[0].court).toBe("nysd");
    });

    it("should support live REST initialization with fallback resilience", async () => {
      const liveClient = new CourtListenerClient({
        apiKey: "test_cl_token_mock_123",
        baseUrl: "https://invalid-subdomain-unreachable.courtlistener.com/api/rest/v4"
      });

      expect(liveClient.isOffline()).toBe(false);

      // Resilient fallback to offline fixtures upon network error
      const orders = await liveClient.fetchSettlementOrders();
      expect(orders.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 2. STATE AG DATA BREACH NOTIFICATION PARSING
  // ==========================================
  describe("2. State AG Breach Notification Scrapers & Classifiers", () => {
    it("should accurately classify SSN, financial, biometric, and health categories", () => {
      const mixedNotice = [
        "Social Security Number (SSN)",
        "Credit Card / PIN",
        "Facial Recognition Biometric Template",
        "Clinical Medical Diagnoses"
      ];

      const breakdown = classifyCompromisedCategories(mixedNotice);

      expect(breakdown.hasSSN).toBe(true);
      expect(breakdown.hasFinancial).toBe(true);
      expect(breakdown.hasBiometric).toBe(true);
      expect(breakdown.hasHealth).toBe(true);
      expect(breakdown.categories).toContain("SSN");
      expect(breakdown.categories).toContain("financial");
      expect(breakdown.categories).toContain("biometric");
      expect(breakdown.categories).toContain("health");
    });

    it("should parse California AG breach filing into BreachRecord", () => {
      const fixture = CALIFORNIA_AG_FIXTURES[0]; // Advance Auto Parts
      const record = parseCaliforniaAgNotice(fixture);

      expect(record.id).toBe("breach-ca-advance-auto-parts-inc");
      expect(record.entityName).toBe("Advance Auto Parts, Inc.");
      expect(record.domain).toBe("advanceautoparts.com");
      expect(record.breachDate).toBe("2024-05-23");
      expect(record.stateSource).toBe("CA");
      expect(record.affectedRecords).toBe(35000000);
      expect(record.dataCategories?.hasSSN).toBe(true);
      expect(record.dataCategories?.hasFinancial).toBe(true);
    });

    it("should parse California AG biometric breach filing", () => {
      const fixture = CALIFORNIA_AG_FIXTURES[1]; // Columbia Sportswear
      const record = parseCaliforniaAgNotice(fixture);

      expect(record.domain).toBe("columbia.com");
      expect(record.dataCategories?.hasBiometric).toBe(true);
      expect(record.affectedRecords).toBe(1200000);
    });

    it("should parse Maine AG breach notice with nationwide and state volume estimates", () => {
      const fixture = MAINE_AG_FIXTURES[0]; // Omni Hotels
      const record = parseMaineAgEntry(fixture);

      expect(record.id).toBe("breach-me-omni-hotels-management-corporation");
      expect(record.domain).toBe("omnihotels.com");
      expect(record.affectedRecords).toBe(3526450);
      expect(record.description).toContain("3,526,450 nationwide");
      expect(record.stateSource).toBe("ME");
      expect(record.dataCategories?.hasFinancial).toBe(true);
    });

    it("should parse Texas AG breach filing with health data categories", () => {
      const fixture = TEXAS_AG_FIXTURES[0]; // Ascension Health
      const record = parseTexasAgRecord(fixture);

      expect(record.id).toBe("breach-tx-ascension-health-alliance");
      expect(record.domain).toBe("ascension.org");
      expect(record.stateSource).toBe("TX");
      expect(record.dataCategories?.hasHealth).toBe(true);
      expect(record.dataCategories?.hasSSN).toBe(true);
      expect(record.affectedRecords).toBe(5200000);
    });

    it("should scrape all State AG portals aggregating multi-state records", async () => {
      const allRecords = await scrapeStateAgBreaches({ state: "ALL" });
      expect(allRecords.length).toBeGreaterThanOrEqual(6);

      const states = new Set(allRecords.map(r => r.stateSource));
      expect(states.has("CA")).toBe(true);
      expect(states.has("ME")).toBe(true);
      expect(states.has("TX")).toBe(true);
    });
  });

  // ==========================================
  // 3. K-ANONYMITY BREACH HASHING & PRIVACY
  // ==========================================
  describe("3. SHA-1 K-Anonymity Privacy Verification", () => {
    it("should deterministically generate 5-char prefix and 35-char suffix", () => {
      const email = "janedoe.real@gmail.com";
      const hashData = hashAliasForKAnonymity(email);

      expect(hashData.sha1).toHaveLength(40);
      expect(hashData.prefix).toHaveLength(5);
      expect(hashData.suffix).toHaveLength(35);
      expect(hashData.prefix + hashData.suffix).toBe(hashData.sha1);

      // Verify case normalization
      const upperData = hashAliasForKAnonymity("  JaneDoe.Real@GMAIL.COM  ");
      expect(upperData.sha1).toBe(hashData.sha1);
      expect(upperData.prefix).toBe(hashData.prefix);
    });

    it("should enforce privacy safety invariant and block plaintext leaks", () => {
      const email = "consumer@example.com";
      const safeUrl = "https://api.pwnedpasswords.com/range/A1B2C";

      // Safe URL should not throw
      expect(() => assertPrivacySafety(email, safeUrl)).not.toThrow();

      // Leaked plaintext email in URL must throw
      const leakedUrl = `https://api.pwnedpasswords.com/check?email=${encodeURIComponent(email)}`;
      expect(() => assertPrivacySafety(email, leakedUrl)).toThrow(/CRITICAL PRIVACY VIOLATION/);

      // Leaked full SHA-1 in URL must throw
      const { sha1 } = hashAliasForKAnonymity(email);
      const leakedHashUrl = `https://api.pwnedpasswords.com/hash/${sha1}`;
      expect(() => assertPrivacySafety(email, leakedHashUrl)).toThrow(/CRITICAL PRIVACY VIOLATION/);
    });

    it("should parse range response format into suffix map", () => {
      const mockResponse = "0018A45C4D1DEF81644B54AB7F969B88D65:12\r\n00D4F6E800CC0F93BE80457C671F50F4D0B:4\r\n";
      const map = parseRangeResponse(mockResponse);

      expect(map.size).toBe(2);
      expect(map.get("0018A45C4D1DEF81644B54AB7F969B88D65")).toBe(12);
      expect(map.get("00D4F6E800CC0F93BE80457C671F50F4D0B")).toBe(4);
    });

    it("should verify compromised aliases locally without sending email over network", async () => {
      const knownBreachedEmail = "janedoe.real@gmail.com";
      const result = await pwnedClient.checkAliasBreached(knownBreachedEmail, { forceOffline: true });

      expect(result.alias).toBe(knownBreachedEmail);
      expect(result.isBreached).toBe(true);
      expect(result.breachCount).toBeGreaterThan(0);
      expect(result.verifiedLocally).toBe(true);

      // Network URL must only include 5-char prefix
      expect(result.queriedRangeUrl).toMatch(/\/range\/[A-F0-9]{5}$/);
      expect(result.queriedRangeUrl).not.toContain(knownBreachedEmail);
    });

    it("should return isBreached: false for clean unexposed aliases", async () => {
      const cleanEmail = "completely.unbreached.vault.address.999@secure-domain.org";
      const result = await pwnedClient.checkAliasBreached(cleanEmail, { forceOffline: true });

      expect(result.alias).toBe(cleanEmail);
      expect(result.isBreached).toBe(false);
      expect(result.breachCount).toBe(0);
    });

    it("should support batch alias verification preserving k-anonymity", async () => {
      const batch = [
        "janedoe.real@gmail.com",
        "robert.miller.breached@att.net",
        "clean-user@securemail.org"
      ];

      const results = await pwnedClient.checkBatchAliases(batch, { forceOffline: true });

      expect(results).toHaveLength(3);
      expect(results[0].isBreached).toBe(true);
      expect(results[1].isBreached).toBe(true);
      expect(results[2].isBreached).toBe(false);
    });
  });

  // ==========================================
  // 4. DOCKET SYNC API ENDPOINT
  // ==========================================
  describe("4. Ingestion Sync API Route (/api/ingest/dockets)", () => {
    it("should execute GET sync and return ingestion metrics", async () => {
      const initialCount = db.getSettlements().length;
      const req = new Request("http://localhost:3000/api/ingest/dockets?source=courtlistener");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.scannedDockets).toBeGreaterThan(0);
      expect(data.metrics.newSettlementsDiscovered).toBeGreaterThan(0);
      expect(data.metrics.totalActiveSettlements).toBe(initialCount + data.metrics.newSettlementsDiscovered);
    });

    it("should execute POST sync and handle idempotent re-runs", async () => {
      // First ingestion
      const postReq1 = new Request("http://localhost:3000/api/ingest/dockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "courtlistener" })
      });
      const res1 = await POST(postReq1);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.metrics.newSettlementsDiscovered).toBeGreaterThan(0);

      // Second ingestion without change: newSettlementsDiscovered should be 0
      const postReq2 = new Request("http://localhost:3000/api/ingest/dockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "courtlistener" })
      });
      const res2 = await POST(postReq2);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.metrics.newSettlementsDiscovered).toBe(0);
      expect(data2.metrics.updatedDeadlines).toBe(0);
    });

    it("should detect and report updated claim deadlines on existing settlements", async () => {
      // First ingest dockets
      const postReq = new Request("http://localhost:3000/api/ingest/dockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "courtlistener" })
      });
      await POST(postReq);

      // Artificially change the deadline of one existing settlement in db
      const cdkSettlement = db.getSettlementByDocket("MDL No. 3125");
      expect(cdkSettlement).toBeDefined();

      if (cdkSettlement) {
        db.upsertSettlement({
          ...cdkSettlement,
          claimDeadline: "2026-10-01" // modified old deadline
        });
      }

      // Re-run sync with official docket which has deadline "2026-12-01"
      const resyncReq = new Request("http://localhost:3000/api/ingest/dockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "courtlistener" })
      });
      const res = await POST(resyncReq);
      const data = await res.json();

      expect(data.metrics.updatedDeadlines).toBeGreaterThanOrEqual(1);

      // Verify the deadline in db is updated back to 2026-12-01
      const updated = db.getSettlementByDocket("MDL No. 3125");
      expect(updated?.claimDeadline).toBe("2026-12-01");
    });

    it("should support syncing both dockets and state AG breaches simultaneously", async () => {
      const req = new Request("http://localhost:3000/api/ingest/dockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "all" })
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.metrics.scannedDockets).toBeGreaterThan(0);
      expect(data.metrics.scannedBreaches).toBeGreaterThan(0);
      expect(data.metrics.newBreachesDiscovered).toBeGreaterThan(0);
      expect(data.ingestedBreaches.length).toBeGreaterThanOrEqual(6);
    });
  });
});
