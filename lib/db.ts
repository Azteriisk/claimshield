import crypto from "crypto";

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
  eligibleDomains: string[]; // e.g. ['ticketmaster.com', 'livenation.com']
  description: string;
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
  riskScore: number; // 0.00 to 1.00
  status: "VERIFIED_CLEAN" | "FLAGGED_BOT" | "HIJACK_SUSPECT" | "FROZEN_DISPUTE";
  flags: string[];
  submissionSpeedSec: number;
  ipAddress: string;
  isDatacenter: boolean;
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
  status: "FROZEN_PENDING_STEP_UP" | "RESOLVED_APPELLANT_WON" | "REJECTED";
  stepUpLivenessScore?: number;
  stepUpProofType?: "NFC_PASSPORT" | "DYNAMIC_LIVENESS_VIDEO";
  fraudulentPayoutBlacklisted?: string;
  createdAt: string;
  resolvedAt?: string;
  adjudicationNotes?: string;
}

export interface BreachRecord {
  id: string;
  entityName: string;
  domain: string;
  breachDate: string;
  exposedData: string[];
  description: string;
  matchingSettlementId?: string;
}

// ==========================================
// SEED DATA
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
  }
];

// ==========================================
// IN-MEMORY / PERSISTED DATABASE SINGLETON
// ==========================================

class DataStore {
  private settlements: Settlement[] = [...INITIAL_SETTLEMENTS];
  private breaches: BreachRecord[] = [...INITIAL_BREACH_RECORDS];
  private claimants: Claimant[] = [];
  private aliases: ClaimantAlias[] = [];
  private claims: SettlementClaim[] = [];
  private disputes: IdentityDispute[] = [];
  private blacklist: Set<string> = new Set(); // blacklisted payout hashes / emails

  constructor() {
    this.seedDemoClaimantAndBots();
  }

  // Pre-seed an impersonator demo case so the user can test the dispute/appeal immediately!
  private seedDemoClaimantAndBots() {
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
    this.aliases.push({
      id: "alias-jane-2",
      claimantId: jane.id,
      aliasType: "EMAIL",
      aliasValue: "j.doe@college.alumni.edu",
      isVerified: true,
      verifiedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    });

    // 2. Pre-seed an impersonated victim: "Robert Miller"
    // An identity theft bot created this account using Robert's leaked info and routed to a burner PayPal!
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

    // Robert's fake claim filed by the bot on AT&T Settlement
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
      submittedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    });
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

  public getBreaches(): BreachRecord[] {
    return this.breaches;
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
  }

  public updateClaimant(id: string, updates: Partial<Claimant>): void {
    const idx = this.claimants.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.claimants[idx] = { ...this.claimants[idx], ...updates };
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
  }

  public updateClaimsStatusForClaimant(claimantId: string, status: SettlementClaim["status"]): void {
    this.claims.forEach(c => {
      if (c.claimantId === claimantId) {
        c.status = status;
      }
    });
  }

  public getDisputes(): IdentityDispute[] {
    return this.disputes;
  }

  public getDispute(id: string): IdentityDispute | undefined {
    return this.disputes.find(d => d.id === id);
  }

  public addDispute(dispute: IdentityDispute): void {
    this.disputes.unshift(dispute);
  }

  public updateDispute(id: string, updates: Partial<IdentityDispute>): void {
    const idx = this.disputes.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.disputes[idx] = { ...this.disputes[idx], ...updates };
    }
  }

  public addToBlacklist(identifier: string): void {
    this.blacklist.add(identifier.toLowerCase());
  }

  public isBlacklisted(identifier: string): boolean {
    return this.blacklist.has(identifier.toLowerCase());
  }
}

// Global singleton across hot reloads in Next.js dev
const globalForDb = global as unknown as { __dataStoreInstance?: DataStore };
export const db = globalForDb.__dataStoreInstance ?? new DataStore();
if (process.env.NODE_ENV !== "production") globalForDb.__dataStoreInstance = db;
