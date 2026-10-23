# ClaimShield: Architecture, Statutory Framework & Operating Models

---

## 1. Executive Problem Statement: The Class Action Fraud Crisis

Over \$1.4B in cash distributions are approved annually across federal consumer class action settlements (e.g., *Ticketmaster*, *AT&T*, *T-Mobile*, *23andMe*). However, the settlement administration ecosystem currently faces an existential operational crisis:

1. **The Bot-Farming Dilemma**: On open digital settlement portals, automated bot rings use dark web breach dumps (names, leaked emails, addresses, SSNs) to mass-submit fraudulent claims, routing payouts to disposable burner PayPals, Venmo handles, and prepaid Mastercards.
2. **Pot Dilution**: Most consumer settlements are **fixed-pot, pro-rata** distributions. Every fraudulent claim paid directly reduces the cash check received by legitimate victims.
3. **The Identity Hijacking Vector**: Victims frequently discover that when they attempt to submit a legitimate claim, an imposter has already claimed their Notice ID and pocketed their relief.
4. **The Judicial Scrutiny Trap**: Federal judges are increasingly refusing to sign off on distributions under **Federal Rule of Civil Procedure (FRCP) 23(e)** until administrators provide empirical proof of anti-bot diligence.

---

## 2. Model 1: The "Zero-Access" Baseline (Operating Day 1)

**Crucial Operating Premise**: In the initial phase, ClaimShield assumes **zero privileged access** to claims administrators' internal databases. Epiq, Kroll, and JND do not provide private APIs to outside startups, and court protective orders legally prohibit them from sharing claimant lists with uncontracted third parties.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 1: ZERO-ACCESS ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     PUBLIC LEGAL SOURCES      │               │     USER-AUTHORIZED DATA      │
│  - PACER / CourtListener      │               │  - Verified primary email     │
│  - State AG Breach Logs       │               │  - Linked historic aliases    │
│  - Long-Form Settlement PDFs  │               │  - Pre-emptive proof timestamp│
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │      CLAIMSHIELD CLIENT       │
                        │  1. Breach-to-Docket Matching │
                        │  2. Assisted Form Pre-Filling │
                        │  3. Rejection / Conflict Kit  │
                        │  4. 28 U.S.C. § 1746 Affidavit│
                        └───────────────────────────────┘
```

### A. What Data is Ingested Publicly & Legally
1. **Federal Court Dockets (PACER / CourtListener / RECAP)**:
   * Nature of Suit (NOS) 890 & 370 filings.
   * Preliminary Approval Motions under FRCP Rule 23(e).
   * Settlement Agreements, Class Definitions, and Claim Deadlines.
2. **State AG Breach Repositories**:
   * Machine-readable breach disclosure logs published by law (California, Texas, Maine, Massachusetts AG portals).
3. **Public Exposure Feeds**:
   * Compromised domain indices and leaked credential categories (e.g. HIBP Enterprise).

### B. Consumer Capabilities in Zero-Access Mode
1. **Breach-to-Docket Matching**: Matches a user's verified email and phone number against open class definitions, identifying money they are legally owed.
2. **Client-Side Form Pre-Filling**: Acts as an intelligent client-side assistant that fills official settlement web forms with verified data, saving the user 15 minutes of manual legal form navigation.
3. **Pre-Emptive Proof of Claim**: By registering on ClaimShield before a court deadline, the user creates a cryptographically signed, timestamped record proving ownership of their identity.
4. **The "Rejection / Conflict" Dispute Kit**:
   * If a user tries to file on the official site and gets rejected with *"Notice ID already claimed"* or *"Duplicate submission on file"*:
   * ClaimShield generates a formal **Declaration of Identity Theft & Conflicting Claim Under Penalty of Perjury (28 U.S.C. § 1746)**.
   * Attaches the user's **NIST 800-63A Level 3 Biometric Liveness Proof**.
   * Formats the demand for immediate transmission to the claims administrator's fraud hotline.

---

## 3. Model 2: The "Authorized Collaboration" Horizon (Enterprise B2B)

When a settlement administrator chooses to partner with ClaimShield, the platform transitions from an outside consumer tool into the **official anti-fraud intake clearinghouse**.

```
┌────────────────────────────────────────────────────────────────────────┐
│               PHASE 2: AUTHORIZED COLLABORATION ARCHITECTURE           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     SETTLEMENT ADMINISTRATOR  │               │       CLAIMSHIELD CORE        │
│  - Receives Court Appointment │               │  - Pre-verified class members │
│  - Holds Hashed Class List    │               │  - Biometric liveness engine  │
│  - Escrow Disbursement Rails  │               │  - Real-time bot risk scoring │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │      COLLABORATION RESULTS    │
                        │  1. 40%+ Claims Rate (1-Click)│
                        │  2. 70%+ Bot Claims Rejected  │
                        │  3. Dispute Labor: $150 -> $2 │
                        │  4. Zero Paper / Lost Checks  │
                        │  5. Rule 23 Court Declaration │
                        └───────────────────────────────┘
```

### A. The Statutory Framework for Collaboration
Administrators do not violate privacy laws by partnering with ClaimShield:
* **Qualified Protective Orders (QPOs)**: Federal courts routinely authorize administrators to share class member data with sub-contracted verification vendors (e.g. LexisNexis, Experian, Hyperwallet). ClaimShield operates under this exact vendor order.
* **FRCP Rule 23(c)(2)**: Requires the "best notice practicable under the circumstances."
* **FRCP Rule 23(e)(2)**: Obligates courts to verify that distributions are "fair, reasonable, and adequate."

### B. The 5 Massive ROIs for Administrators

| Metric | Legacy Administration | With ClaimShield Collaboration | Impact |
| :--- | :--- | :--- | :--- |
| **Claim Rate** | 2% – 5% (postcards ignored) | **40% – 60%+** (1-click push to pre-verified class members) | Fixes the broken class action notice system. |
| **Fraudulent Bot Volume** | Up to 70% of digital submissions | **< 1%** (screened at ingestion via `/evaluate-risk` API) | Escrow pot preserved for genuine victims. |
| **Dispute Resolution Cost** | **\$75 – \$250 per dispute** (manual affidavit reviews) | **\$2.00 per dispute** (3-minute digital biometric step-up) | **90%+ reduction in administrative labor.** |
| **Check Escheatment** | Millions lost to uncashed paper checks | **Zero lost checks** (direct KYC-matched digital wallet rails) | Eliminates state treasury reporting overhead. |
| **Court Scrutiny Defense** | Challenged by defense counsel / judges | **Certified Rule 23 Audit Affidavits** signed under oath | Wins administrators competitive settlement RFPs. |

---

## 4. Technical Security & Cryptographic Specifications

### A. 1:1 Identity Anchoring & Sybil Resistance
* **Deterministic Blind Indexing**:
  $$\text{unique\_person\_hash} = \text{HMAC-SHA256}(K_{\text{HSM}}, \text{Normalize}(\text{LegalName}) \parallel \text{DOB} \parallel \text{SSN4})$$
* **Database Invariant**: A hardware-level `UNIQUE` index in PostgreSQL prevents any individual from creating multiple accounts or claiming multiple distributions across aliases.

### B. Financial Rail Locking
* **1:1 Payout Invariant**: A destination payment handle (PayPal email, ACH hash, Venmo tag) can only be bound to **one legal identity anchor** on the entire platform.
* **AML/KYC Name Cross-Check**: Destination payment account holder legal name must match the verified claimant identity.

### C. NIST 800-63A Level 3 Step-Up Verification
* Dynamic 3D face liveness challenges detect screen replays, masks, and generative deepfakes.
* Optional NFC chip read of physical e-Passports or RealIDs reads government-signed public keys directly from the physical document.

---

## 5. Strategic Roadmap: From Zero-Access to Enterprise Lock-In

1. **Phase 1 (Consumer Network Acquisition)**:
   * Launch the zero-access platform as a free breach tracker, assisted filing assistant, and sworn dispute generator.
   * Scale to 100,000+ verified users who want their class action settlement rights protected.
2. **Phase 2 (Enterprise Leverage & Administrator Licensing)**:
   * Approach Epiq, Kroll, Angeion, and JND with a pre-verified claimant base.
   * License the ClaimShield B2B Pre-Clearance API and embeddable SDK (`public/sdk.js`) under court-approved vendor orders.
3. **Phase 3 (The Settlement Clearinghouse Standard)**:
   * Become the standard "Sign in with Apple / ID.me" for all federal class action digital payouts.
