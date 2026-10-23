import crypto from "crypto";
import fs from "fs";
import path from "path";

// ==========================================
// CORE TYPES
// ==========================================

export interface Settlement {
  id: string;
  caseName: string;
  defendant: string;
  administratorName: string;
  incidentYear: number;
  claimDeadline: string; // ISO Date
  status: "OPEN" | "FINAL_APPROVAL_PENDING" | "DISTRIBUTION";
  estimatedBasePayout: number;
  maxDocumentedLoss: number;
  officialClaimUrl: string;
  eligibleDomains: string[];
  description: string;
  docketNumber?: string;
  courtDistrict?: string;
  mdlNumber?: string;
  approvalStage?: "PRELIMINARY" | "FINAL" | "UNKNOWN";
  source?: string;
}

export interface Claimant {
  id: string;
  uniquePersonHash: string; // HMAC-SHA256(Name + DOB + SSN4)
  legalFirstName: string;
  legalLastName: string;
  dob: string;
  ssnLast4: string;
  kycStatus: "VERIFIED" | "PENDING" | "FROZEN_DISPUTE";
  lockedPayoutType: "PAYPAL" | "VENMO" | "ACH";
  lockedPayoutAddress: string;
  lockedPayoutHash: string;
  isBannedFraudster?: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export interface ClaimantAlias {
  id: string;
  claimantId: string;
  aliasType: "EMAIL" | "PHONE";
  aliasValue: string;
  isVerified: boolean;
  verifiedAt: string;
}

export interface SettlementClaim {
  id: string;
  settlementId: string;
  claimantId: string;
  qualifyingAlias: string;
  payoutAddress: string;
  riskScore: number;
  status: "VERIFIED_CLEAN" | "FLAGGED_BOT" | "HIJACK_SUSPECT" | "FROZEN_DISPUTE";
  flags: string[];
  submissionSpeedSec: number;
  ipAddress: string;
  isDatacenter: boolean;
  isDemo?: boolean;
  submittedAt: string;
}

export interface IdentityDispute {
  id: string;
  contestedPersonHash: string;
  incumbentClaimantId: string;
  appellantEmail: string;
  appellantFirstName: string;
  appellantLastName: string;
  appellantDob: string;
  appellantSsnLast4: string;
  appellantPayoutAddress: string;
  status: "FROZEN_PENDING_STEP_UP" | "RESOLVED_APPELLANT_WON" | "REJECTED" | "SUPPLEMENTARY_PROOF_REQUESTED" | "IMPOSTER_DISQUALIFIED";
  stepUpLivenessScore?: number;
  stepUpProofType?: "NFC_PASSPORT" | "DYNAMIC_LIVENESS_VIDEO";
  fraudulentPayoutBlacklisted?: string;
  createdAt: string;
  resolvedAt?: string;
  adjudicationNotes?: string;
  escrowAmount?: number;
  settlementId?: string;
}

export interface BreachRecord {
  id: string;
  entityName: string;
  domain: string;
  breachDate: string;
  exposedData: string[];
  description: string;
  matchingSettlementId?: string;
  stateSource?: "CA" | "ME" | "TX" | "MULTI_STATE";
  affectedRecords?: number;
  dataCategories?: {
    hasSSN: boolean;
    hasFinancial: boolean;
    hasBiometric: boolean;
    hasHealth: boolean;
  };
}

// ==========================================
// EXPANDED REAL-WORLD ACTIVE SETTLEMENTS (2024 - 2026)
// ==========================================

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: "sett-tm-2024",
    caseName: "In re Ticketmaster / Live Nation Customer Data Breach Litigation",
    defendant: "Live Nation Entertainment / Ticketmaster LLC",
    administratorName: "Epiq Systems Inc.",
    incidentYear: 2024,
    claimDeadline: "2026-12-15",
    status: "OPEN",
    estimatedBasePayout: 37.50,
    maxDocumentedLoss: 2500,
    officialClaimUrl: "/portal/demo-settlement?id=sett-tm-2024",
    eligibleDomains: ["ticketmaster.com", "livenation.com"],
    description: "Compromised barcodes, payment details, names, and purchase histories affecting 560M accounts globally."
  },
  {
    id: "sett-att-2024",
    caseName: "AT&T Customer Data Incident Class Action Settlement",
    defendant: "AT&T Inc.",
    administratorName: "Kroll Settlement Administration",
    incidentYear: 2024,
    claimDeadline: "2026-11-30",
    status: "OPEN",
    estimatedBasePayout: 45.00,
    maxDocumentedLoss: 5000,
    officialClaimUrl: "/portal/demo-settlement?id=sett-att-2024",
    eligibleDomains: ["att.com", "att.net", "sbcglobal.net"],
    description: "Exposure of 73M current and former account records including SSNs, call records, and customer security PINs."
  },
  {
    id: "sett-23andme-2023",
    caseName: "23andMe Genetic Data Security Breach Litigation",
    defendant: "23andMe Holding Co.",
    administratorName: "Angeion Group",
    incidentYear: 2023,
    claimDeadline: "2026-10-31",
    status: "OPEN",
    estimatedBasePayout: 100.00,
    maxDocumentedLoss: 10000,
    officialClaimUrl: "/portal/demo-settlement?id=sett-23andme-2023",
    eligibleDomains: ["23andme.com"],
    description: "Credential stuffing attack leaking genetic ancestry trees, health relationship tags, and sensitive family heritage."
  },
  {
    id: "sett-change-2024",
    caseName: "Change Healthcare / UnitedHealth Ransomware Settlement",
    defendant: "UnitedHealth Group / Change Healthcare",
    administratorName: "JND Legal Administration",
    incidentYear: 2024,
    claimDeadline: "2027-01-15",
    status: "OPEN",
    estimatedBasePayout: 50.00,
    maxDocumentedLoss: 7500,
    officialClaimUrl: "/portal/demo-settlement?id=sett-change-2024",
    eligibleDomains: ["changehealthcare.com", "optum.com"],
    description: "Massive medical claims clearinghouse cyberattack exposing diagnoses, prescriptions, and insurance IDs."
  },
  {
    id: "sett-roku-2024",
    caseName: "Roku Customer Account Security Breach Litigation",
    defendant: "Roku Inc.",
    administratorName: "Simpluris Inc.",
    incidentYear: 2024,
    claimDeadline: "2026-11-15",
    status: "OPEN",
    estimatedBasePayout: 25.00,
    maxDocumentedLoss: 1500,
    officialClaimUrl: "/portal/demo-settlement?id=sett-roku-2024",
    eligibleDomains: ["roku.com"],
    description: "Credential stuffing compromising 591,000 accounts with unauthorized subscription purchases."
  },
  {
    id: "sett-moveit-2023",
    caseName: "In re MoveIT Transfer Customer Data Security Incident",
    defendant: "Progress Software Corporation",
    administratorName: "Epiq Systems Inc.",
    incidentYear: 2023,
    claimDeadline: "2026-12-31",
    status: "OPEN",
    estimatedBasePayout: 65.00,
    maxDocumentedLoss: 8000,
    officialClaimUrl: "/portal/demo-settlement?id=sett-moveit-2023",
    eligibleDomains: ["progress.com", "moveit.com"],
    description: "CL0P ransomware SQL injection affecting corporate and pension systems across 60M individuals."
  },
  {
    id: "sett-dell-2024",
    caseName: "Dell Customer Portal Data Incident Settlement",
    defendant: "Dell Technologies Inc.",
    administratorName: "Kroll Settlement Administration",
    incidentYear: 2024,
    claimDeadline: "2027-02-28",
    status: "OPEN",
    estimatedBasePayout: 30.00,
    maxDocumentedLoss: 2000,
    officialClaimUrl: "/portal/demo-settlement?id=sett-dell-2024",
    eligibleDomains: ["dell.com"],
    description: "Scraped API database containing physical addresses, purchase orders, and customer service tags."
  },
  {
    id: "sett-tmobile-2023",
    caseName: "T-Mobile Customer Data Incident Class Action Settlement",
    defendant: "T-Mobile US Inc.",
    administratorName: "Kroll Settlement Administration",
    incidentYear: 2023,
    claimDeadline: "2026-10-30",
    status: "OPEN",
    estimatedBasePayout: 35.00,
    maxDocumentedLoss: 3000,
    officialClaimUrl: "/portal/demo-settlement?id=sett-tmobile-2023",
    eligibleDomains: ["t-mobile.com", "sprint.com"],
    description: "API exploit accessing names, billing addresses, phone numbers, and account line features."
  }
];

export const INITIAL_BREACH_RECORDS: BreachRecord[] = [
  {
    id: "breach-tm-2024",
    entityName: "Ticketmaster / Live Nation",
    domain: "ticketmaster.com",
    breachDate: "May 2024",
    exposedData: ["Full Name", "Email", "Phone", "Order Details", "Partial Credit Card"],
    description: "Database dump hosted on ShinyHunters forum compromising 560M customer records.",
    matchingSettlementId: "sett-tm-2024"
  },
  {
    id: "breach-att-2024",
    entityName: "AT&T Customer Records",
    domain: "att.com",
    breachDate: "March 2024",
    exposedData: ["Full Name", "Social Security Number (SSN)", "Passcode/PIN", "Mailing Address"],
    description: "Historical data leak spanning 73M customer records posted to breach forums.",
    matchingSettlementId: "sett-att-2024"
  },
  {
    id: "breach-23andme-2023",
    entityName: "23andMe DNA & Heritage",
    domain: "23andme.com",
    breachDate: "October 2023",
    exposedData: ["Genetic Ancestry", "Health Profile", "Full Name", "Family Relationships"],
    description: "Targeted credential stuffing accessing user profiles and DNA Relatives network.",
    matchingSettlementId: "sett-23andme-2023"
  },
  {
    id: "breach-change-2024",
    entityName: "Change Healthcare",
    domain: "changehealthcare.com",
    breachDate: "February 2024",
    exposedData: ["Medical Diagnoses", "Insurance Policy #", "SSN", "Billing Info"],
    description: "BlackCat/ALPHV ransomware exfiltration of US nationwide health data.",
    matchingSettlementId: "sett-change-2024"
  },
  {
    id: "breach-roku-2024",
    entityName: "Roku Streaming Accounts",
    domain: "roku.com",
    breachDate: "April 2024",
    exposedData: ["Payment Method", "Account Credentials", "Viewing History", "Name"],
    description: "Credential stuffing compromising 591,000 active customer profiles.",
    matchingSettlementId: "sett-roku-2024"
  },
  {
    id: "breach-moveit-2023",
    entityName: "MoveIT Transfer / Progress Software",
    domain: "progress.com",
    breachDate: "June 2023",
    exposedData: ["Corporate Records", "SSN", "Payroll Data", "Banking Info"],
    description: "Zero-day vulnerability exploit exfiltrating government and financial data.",
    matchingSettlementId: "sett-moveit-2023"
  },
  {
    id: "breach-dell-2024",
    entityName: "Dell Customer Portal",
    domain: "dell.com",
    breachDate: "May 2024",
    exposedData: ["Customer Name", "Shipping Address", "Hardware Specs", "Order Dates"],
    description: "Unauthorized API exfiltration compromising 49 million purchase records.",
    matchingSettlementId: "sett-dell-2024"
  },
  {
    id: "breach-tmobile-2023",
    entityName: "T-Mobile Telecom",
    domain: "t-mobile.com",
    breachDate: "January 2023",
    exposedData: ["Phone Number", "Billing Address", "Account #", "Rate Plans"],
    description: "Malicious API activity exfiltrating data on 37 million prepaid and postpaid accounts.",
    matchingSettlementId: "sett-tmobile-2023"
  }
];

// ==========================================
// PERSISTENT DATA STORE (WITH DEMO RESET)
// ==========================================

const STORAGE_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(STORAGE_DIR, "store.json");

class DataStore {
  private settlements: Settlement[] = [...INITIAL_SETTLEMENTS];
  private breaches: BreachRecord[] = [...INITIAL_BREACH_RECORDS];
  private claimants: Claimant[] = [];
  private aliases: ClaimantAlias[] = [];
  private claims: SettlementClaim[] = [];
  private disputes: IdentityDispute[] = [];
  private blacklist: Set<string> = new Set();

  constructor() {
    this.loadFromDisk();
    if (this.claimants.length === 0) {
      this.seedDemoClaimantAndBots();
      this.saveToDisk();
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.claimants) this.claimants = parsed.claimants;
        if (parsed.aliases) this.aliases = parsed.aliases;
        if (parsed.claims) this.claims = parsed.claims;
        if (parsed.disputes) this.disputes = parsed.disputes;
        if (parsed.blacklist) this.blacklist = new Set(parsed.blacklist);
        if (parsed.settlements && Array.isArray(parsed.settlements)) {
          const loadedIds = new Set(parsed.settlements.map((s: Settlement) => s.id));
          const unmentioned = INITIAL_SETTLEMENTS.filter(s => !loadedIds.has(s.id));
          this.settlements = [...parsed.settlements, ...unmentioned];
        }
        if (parsed.breaches && Array.isArray(parsed.breaches)) {
          const loadedIds = new Set(parsed.breaches.map((b: BreachRecord) => b.id));
          const unmentioned = INITIAL_BREACH_RECORDS.filter(b => !loadedIds.has(b.id));
          this.breaches = [...parsed.breaches, ...unmentioned];
        }
      }
    } catch (e) {
      console.warn("Could not load store from disk, initializing fresh", e);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      const state = {
        claimants: this.claimants,
        aliases: this.aliases,
        claims: this.claims,
        disputes: this.disputes,
        blacklist: Array.from(this.blacklist),
        settlements: this.settlements,
        breaches: this.breaches
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save store to disk", e);
    }
  }

  public seedDemoClaimantAndBots() {
    // 1. Legitimate anchor for demo user "Jane Doe"
    const janeHash = this.computePersonHash("Jane", "Doe", "1990-05-14", "4321");
    const janePayoutHash = this.computePayoutHash("PAYPAL", "janedoe.real@gmail.com");

    const jane: Claimant = {
      id: "claimant-jane-demo",
      uniquePersonHash: janeHash,
      legalFirstName: "Jane",
      legalLastName: "Doe",
      dob: "1990-05-14",
      ssnLast4: "4321",
      kycStatus: "VERIFIED",
      lockedPayoutType: "PAYPAL",
      lockedPayoutAddress: "janedoe.real@gmail.com",
      lockedPayoutHash: janePayoutHash,
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    };
    this.claimants.push(jane);

    this.aliases.push({
      id: "alias-jane-1",
      claimantId: jane.id,
      aliasType: "EMAIL",
      aliasValue: "janedoe.real@gmail.com",
      isVerified: true,
      verifiedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    });

    // 2. Demonstration victim: "Robert Miller"
    const robertHash = this.computePersonHash("Robert", "Miller", "1985-11-20", "8899");
    const fraudPayoutHash = this.computePayoutHash("PAYPAL", "burner_payout_syndicate99@tempmail.io");

    const robertFake: Claimant = {
      id: "claimant-robert-hijacked",
      uniquePersonHash: robertHash,
      legalFirstName: "Robert",
      legalLastName: "Miller",
      dob: "1985-11-20",
      ssnLast4: "8899",
      kycStatus: "VERIFIED",
      lockedPayoutType: "PAYPAL",
      lockedPayoutAddress: "burner_payout_syndicate99@tempmail.io",
      lockedPayoutHash: fraudPayoutHash,
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    };
    this.claimants.push(robertFake);

    this.aliases.push({
      id: "alias-robert-fake",
      claimantId: robertFake.id,
      aliasType: "EMAIL",
      aliasValue: "robert.miller.breached@att.net",
      isVerified: false,
      verifiedAt: ""
    });

    // Robert's conflicting claim filed on AT&T Settlement
    this.claims.push({
      id: "claim-bot-robert-1",
      settlementId: "sett-att-2024",
      claimantId: robertFake.id,
      qualifyingAlias: "robert.miller.breached@att.net",
      payoutAddress: "burner_payout_syndicate99@tempmail.io",
      riskScore: 0.85,
      status: "HIJACK_SUSPECT",
      flags: ["PAYOUT_DIVERGENCE", "DATACENTER_PROXY_IP", "SUPERHUMAN_SUBMISSION_SPEED"],
      submissionSpeedSec: 1.2,
      ipAddress: "45.33.32.156",
      isDatacenter: true,
      isDemo: true,
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    });

    // Clean claim by Jane on Ticketmaster
    this.claims.push({
      id: "claim-jane-clean-1",
      settlementId: "sett-tm-2024",
      claimantId: jane.id,
      qualifyingAlias: "janedoe.real@gmail.com",
      payoutAddress: "janedoe.real@gmail.com",
      riskScore: 0.05,
      status: "VERIFIED_CLEAN",
      flags: [],
      submissionSpeedSec: 42.5,
      ipAddress: "98.210.14.88",
      isDatacenter: false,
      isDemo: true,
      submittedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    });

    // Seeded Contested Dispute: Robert Miller vs Syndicate Imposter
    this.disputes.push({
      id: "disp-robert-att-2024",
      contestedPersonHash: robertHash,
      incumbentClaimantId: robertFake.id,
      appellantEmail: "robert.miller.real@gmail.com",
      appellantFirstName: "Robert",
      appellantLastName: "Miller",
      appellantDob: "1985-11-20",
      appellantSsnLast4: "8899",
      appellantPayoutAddress: "robert.miller.real@gmail.com",
      status: "FROZEN_PENDING_STEP_UP",
      stepUpLivenessScore: 0.998,
      stepUpProofType: "DYNAMIC_LIVENESS_VIDEO",
      settlementId: "sett-att-2024",
      escrowAmount: 45.0,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      adjudicationNotes: "Contested claim submitted with sworn 28 U.S.C. 1746 declaration and NIST Level 3 biometric liveness verification."
    });
  }

  public resetSimulationFixtures() {
    this.settlements = [...INITIAL_SETTLEMENTS];
    this.breaches = [...INITIAL_BREACH_RECORDS];
    this.claimants = [];
    this.aliases = [];
    this.claims = [];
    this.disputes = [];
    this.blacklist.clear();
    this.seedDemoClaimantAndBots();
    this.saveToDisk();
  }

  public simulateBotAttackWave(count: number = 20): SettlementClaim[] {
    const botDomains = [
      "burnermail.io", 
      "dispostable.com", 
      "tempmail.ninja", 
      "guerrillamail.com", 
      "sharklasers.com", 
      "throwawaymail.org"
    ];
    const ips = [
      "185.220.101.4", "45.33.32.12", "198.51.100.22", "162.247.74.200", "194.26.29.112",
      "104.244.76.13", "185.220.102.8", "192.42.116.16", "23.129.64.210", "176.10.99.200"
    ];
    const settlements = this.settlements;
    const generated: SettlementClaim[] = [];

    for (let i = 0; i < count; i++) {
      const sett = settlements[i % settlements.length];
      const botDomain = botDomains[i % botDomains.length];
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const botAlias = `harvester_bot_${randNum}@${botDomain}`;
      const payoutDrop = `burner_drop_${randNum + 5000}@${botDomain}`;
      const ip = ips[i % ips.length];
      const speed = Number((0.2 + Math.random() * 1.1).toFixed(2));
      const riskScore = Number((0.86 + Math.random() * 0.13).toFixed(2));

      const newClaim: SettlementClaim = {
        id: `claim-bot-sybil-${Date.now()}-${i}`,
        settlementId: sett.id,
        claimantId: `bot-actor-${randNum}`,
        qualifyingAlias: botAlias,
        payoutAddress: payoutDrop,
        riskScore,
        status: "FLAGGED_BOT",
        flags: [
          "SUPERHUMAN_SUBMISSION_SPEED",
          "DATACENTER_PROXY_IP",
          "DISPOSABLE_DOMAIN",
          "BURST_RATE_ANOMALY"
        ],
        submissionSpeedSec: speed,
        ipAddress: ip,
        isDatacenter: true,
        isDemo: true,
        submittedAt: new Date(Date.now() - i * 12000).toISOString()
      };

      generated.push(newClaim);
      this.claims.unshift(newClaim);
    }

    this.saveToDisk();
    return generated;
  }

  // Cryptographic identity hashing
  public computePersonHash(firstName: string, lastName: string, dob: string, ssnLast4: string): string {
    const raw = `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}|${dob.trim()}|${ssnLast4.trim()}`;
    return crypto.createHmac("sha256", "claimshield_salt_pepper_2026").update(raw).digest("hex");
  }

  public computePayoutHash(type: string, address: string): string {
    const raw = `${type.toUpperCase()}:${address.trim().toLowerCase()}`;
    return crypto.createHmac("sha256", "claimshield_payout_salt").update(raw).digest("hex");
  }

  // Getters & Operations
  public getSettlements(): Settlement[] {
    return this.settlements;
  }

  public getSettlement(id: string): Settlement | undefined {
    return this.settlements.find(s => s.id === id);
  }

  public getSettlementByDocket(docketNumber: string): Settlement | undefined {
    return this.settlements.find(
      s => s.docketNumber?.toLowerCase() === docketNumber.toLowerCase()
    );
  }

  public upsertSettlement(settlement: Settlement): { settlement: Settlement; isNew: boolean; updatedDeadline: boolean } {
    const existingIdx = this.settlements.findIndex(
      s => s.id === settlement.id || (settlement.docketNumber && s.docketNumber && s.docketNumber.toLowerCase() === settlement.docketNumber.toLowerCase())
    );

    if (existingIdx !== -1) {
      const existing = this.settlements[existingIdx];
      const updatedDeadline = existing.claimDeadline !== settlement.claimDeadline;
      const updated: Settlement = {
        ...existing,
        ...settlement,
        id: existing.id // Preserve canonical settlement ID
      };
      this.settlements[existingIdx] = updated;
      this.saveToDisk();
      return { settlement: updated, isNew: false, updatedDeadline };
    } else {
      this.settlements.unshift(settlement);
      this.saveToDisk();
      return { settlement, isNew: true, updatedDeadline: false };
    }
  }

  public getBreaches(): BreachRecord[] {
    return this.breaches;
  }

  public upsertBreach(breach: BreachRecord): { breach: BreachRecord; isNew: boolean } {
    const existingIdx = this.breaches.findIndex(
      b => b.id === breach.id || (b.entityName.toLowerCase() === breach.entityName.toLowerCase() && b.domain.toLowerCase() === breach.domain.toLowerCase())
    );

    if (existingIdx !== -1) {
      const updated: BreachRecord = {
        ...this.breaches[existingIdx],
        ...breach,
        id: this.breaches[existingIdx].id
      };
      this.breaches[existingIdx] = updated;
      this.saveToDisk();
      return { breach: updated, isNew: false };
    } else {
      this.breaches.unshift(breach);
      this.saveToDisk();
      return { breach, isNew: true };
    }
  }

  public getClaimants(): Claimant[] {
    return this.claimants;
  }

  public getClaimantById(id: string): Claimant | undefined {
    return this.claimants.find(c => c.id === id);
  }

  public getClaimantByPersonHash(hash: string): Claimant | undefined {
    return this.claimants.find(c => c.uniquePersonHash === hash);
  }

  public getClaimantByPayoutHash(hash: string): Claimant | undefined {
    return this.claimants.find(c => c.lockedPayoutHash === hash);
  }

  public addClaimant(claimant: Claimant): void {
    this.claimants.push(claimant);
    this.saveToDisk();
  }

  public updateClaimant(id: string, updates: Partial<Claimant>): void {
    const idx = this.claimants.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.claimants[idx] = { ...this.claimants[idx], ...updates };
      this.saveToDisk();
    }
  }

  public getAliasesForClaimant(claimantId: string): ClaimantAlias[] {
    return this.aliases.filter(a => a.claimantId === claimantId);
  }

  public getAliasByValue(type: "EMAIL" | "PHONE", value: string): ClaimantAlias | undefined {
    return this.aliases.find(a => a.aliasType === type && a.aliasValue.toLowerCase() === value.toLowerCase());
  }

  public addAlias(alias: ClaimantAlias): void {
    this.aliases.push(alias);
    this.saveToDisk();
  }

  public getClaims(): SettlementClaim[] {
    return this.claims;
  }

  public getClaimsForClaimant(claimantId: string): SettlementClaim[] {
    return this.claims.filter(c => c.claimantId === claimantId);
  }

  public hasClaimedSettlement(claimantId: string, settlementId: string): boolean {
    return this.claims.some(c => c.claimantId === claimantId && c.settlementId === settlementId);
  }

  public addClaim(claim: SettlementClaim): void {
    this.claims.unshift(claim);
    this.saveToDisk();
  }

  public updateClaimsStatusForClaimant(claimantId: string, status: SettlementClaim["status"]): void {
    this.claims.forEach(c => {
      if (c.claimantId === claimantId) {
        c.status = status;
      }
    });
    this.saveToDisk();
  }

  public getDisputes(): IdentityDispute[] {
    return this.disputes;
  }

  public getDispute(id: string): IdentityDispute | undefined {
    return this.disputes.find(d => d.id === id);
  }

  public addDispute(dispute: IdentityDispute): void {
    this.disputes.unshift(dispute);
    this.saveToDisk();
  }

  public updateDispute(id: string, updates: Partial<IdentityDispute>): void {
    const idx = this.disputes.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.disputes[idx] = { ...this.disputes[idx], ...updates };
      this.saveToDisk();
    }
  }

  public addToBlacklist(identifier: string): void {
    this.blacklist.add(identifier.toLowerCase());
    this.saveToDisk();
  }

  public isBlacklisted(identifier: string): boolean {
    return this.blacklist.has(identifier.toLowerCase());
  }
}

const globalForDb = global as unknown as { __dataStoreInstance?: DataStore };
export const db = globalForDb.__dataStoreInstance ?? new DataStore();
if (process.env.NODE_ENV !== "production") globalForDb.__dataStoreInstance = db;
