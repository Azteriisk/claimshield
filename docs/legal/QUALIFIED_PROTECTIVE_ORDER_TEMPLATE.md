# UNITED STATES DISTRICT COURT
# [DISTRICT OF COURT]
# [DIVISION]

| | |
| :--- | :--- |
| **IN RE: [NAME OF LITIGATION / MASTER DOCKET]** | **Master Docket No. [X:XX-md-XXXXX-XXX]** |
| | **CLASS ACTION** |
| This Document Relates To: | |
| **ALL ACTIONS** | **[PROPOSED] QUALIFIED PROTECTIVE ORDER AUTHORIZING CLASS ACTION VERIFICATION & ANTI-SYBIL CLEARINGHOUSE PROTOCOLS PURSUANT TO FED. R. CIV. P. 23(d), FED. R. CIV. P. 26(c), AND APPLICABLE PRIVACY STATUTES** |
| | |

---

### [PROPOSED] STIPULATED QUALIFIED PROTECTIVE ORDER GOVERNING CLASS CLAIMS VERIFICATION, ANTI-SYBIL FRAUD DETECTION, AND ZERO-KNOWLEDGE AUDITING

WHEREAS, Plaintiffs and Class Representatives, on behalf of themselves and all others similarly situated, by and through Class Counsel, and Defendant(s), by and through their counsel of record (collectively, the "Parties"), have agreed to the entry of this Qualified Protective Order (this "Order") to govern the intake, processing, deduplication, and anti-fraud verification of claims submitted in connection with the proposed Settlement of this Action;

WHEREAS, Federal Rule of Civil Procedure 23(d)(1) authorizes the Court to make appropriate orders to "determine the course of proceedings or prescribe measures to prevent undue repetition or complication in presenting evidence or argument" and "protect class members and fairly conduct the action";

WHEREAS, Federal Rule of Civil Procedure 23(e)(2)(C)(ii) and the 2018 Amendments to the Federal Rules of Civil Procedure obligate the Court to rigorously scrutinize the "effectiveness of any proposed method of distributing relief to the class, including the method of processing class-member claims," to ensure that settlement funds are disbursed solely to authentic, eligible Class Members and are not diluted or siphoned by automated fraud networks, synthetic identities, or duplicate filings;

WHEREAS, the settlement administration of large-scale consumer, data breach, and privacy litigations faces unprecedented challenges from distributed automated bot rings, credential-stuffing exploits, and identity-theft syndicates that submit tens of thousands of illicit claims utilizing compromised personally identifiable information ("PII") harvested from public and dark web data repositories;

WHEREAS, the Parties have agreed to engage **ClaimShield Technologies, Inc.** ("ClaimShield") as the Court-authorized Class Action Verification and Anti-Sybil Clearinghouse and Independent Cryptographic Claims Auditor, to operate in coordination with the Court-appointed Settlement Administrator ([Name of Settlement Administrator], the "Settlement Administrator");

WHEREAS, the verification and deduplication of class member claims necessitates the cross-referencing of Class Member data against public court dockets, statutory breach logs, and claimant-provided identity verifications, which implicates protected personal, financial, and/or health information subject to federal and state privacy statutes, including:
1. The **Gramm-Leach-Bliley Act (GLBA)**, 15 U.S.C. §§ 6801–6809, and its implementing regulations, specifically 15 U.S.C. § 6802(e)(8) (authorizing disclosure to comply with judicial orders and prevent actual or potential fraud);
2. The **Health Insurance Portability and Accountability Act of 1996 (HIPAA)**, 42 U.S.C. § 1320d et seq., and the HIPAA Privacy Rule, specifically 45 C.F.R. § 164.512(e)(1)(ii)(B) and 45 C.F.R. § 164.512(e)(1)(v) (governing Qualified Protective Orders);
3. The **California Consumer Privacy Act of 2018 (CCPA)** and California Privacy Rights Act (CPRA), Cal. Civ. Code § 1798.100 et seq., specifically Cal. Civ. Code § 1798.145(a)(1) (exempting processing required to comply with court orders, legal proceedings, and fraud prevention); and
4. The **Fair Credit Reporting Act (FCRA)**, 15 U.S.C. § 1681 et seq., specifically 15 U.S.C. § 1681b(a)(1) (authorizing consumer reporting disclosures in response to the order of a court having jurisdiction to issue such an order);

NOW, THEREFORE, IT IS HEREBY ORDERED, ADJUDGED, AND DECREED pursuant to Fed. R. Civ. P. 23(d), Fed. R. Civ. P. 26(c), 45 C.F.R. § 164.512(e)(1), and the inherent supervisory equitable powers of this Court, as follows:

---

### 1. DEFINITIONS

1.1 **"Class Action Verification & Anti-Sybil Clearinghouse"** means ClaimShield Technologies, Inc. ("ClaimShield"), acting in its capacity as the independent, court-designated cryptographic verification, bot mitigation, and audit utility for the Settlement.

1.2 **"Confidential Claimant Identifying Information" (or "CCII")** means any information submitted by or on behalf of a putative Class Member, or transmitted by the Settlement Administrator or Defendant(s), that identifies, relates to, describes, or is reasonably capable of being associated with a particular individual. CCII encompasses names, residential addresses, electronic mail addresses, telephone numbers, dates of birth, Social Security Numbers (or partial digits thereof), driver's license numbers, taxpayer identification numbers, bank account numbers, digital payment handles, Protected Health Information ("PHI"), and biometric verification artifacts.

1.3 **"Cryptographic Blind Index"** means a mathematically irreversible, deterministic, salted hash value generated pursuant to Federal Information Processing Standards (FIPS 180-4 / FIPS 198-1), specifically computed using an HMAC-SHA256 algorithm keyed with an ephemeral or dedicated Hardware Security Module ("HSM") key (`unique_person_hash`), designed to uniquely identify a single individual without exposing underlying plaintext identifiers.

1.4 **"Zero-Knowledge Deduplication Protocol"** means the cryptographic procedure whereby ClaimShield evaluates claims for duplicate identity anchors, multiple Notice ID usage, or automated script submission without storing, decrypting, or exposing unencrypted CCII outside of secure, isolated, ephemeral memory enclaves.

1.5 **"Sybil Attack"** means any automated, scripted, coordinated, or synthetic generation of multiple false or unauthorized claims submitted by or through a common actor, botnet, proxy infrastructure, automated headless browser array, or credential dump.

1.6 **"Judicial Escrow Freeze"** means the mandatory administrative quarantine and holding in escrow of any settlement distribution payout associated with a claim flagged for identity collision, duplicate registration, proxy manipulation, or unresolved fraudulent credentials, pending verified dispute adjudication.

---

### 2. DESIGNATION AND JURISDICTION OVER CLAIMSHIELD

2.1 **Appointment as Court-Authorized Verification Agent**: ClaimShield is hereby formally designated and approved as the authorized Class Action Verification & Anti-Sybil Clearinghouse and Independent Cryptographic Claims Auditor for this Settlement.

2.2 **Submission to Jurisdiction**: ClaimShield expressly submits to the ongoing personal and subject-matter jurisdiction of this Court for all matters relating to the interpretation, enforcement, and administration of this Order, the handling of CCII, and the execution of its claims verification protocols.

2.3 **Agent of the Court**: For purposes of federal and state privacy statutes, ClaimShield shall operate under the direct authority and supervisory oversight of the Court and the Settlement Administrator, and shall perform its duties solely to execute the Court-mandated Plan of Allocation and Claims Administration Process pursuant to Fed. R. Civ. P. 23.

---

### 3. STATUTORY COMPLIANCE & PRIVACY SAFEGUARDS

3.1 **HIPAA Qualified Protective Order Compliance (45 C.F.R. § 164.512(e)(1))**:
   - To the extent that any claims in this Action involve medical records, health insurance enrollment, pharmacy claims, or other Protected Health Information ("PHI"):
     a) The Parties, the Settlement Administrator, and ClaimShield are expressly authorized to receive, transmit, and process PHI necessary to verify class membership and calculate statutory or common fund relief;
     b) The Parties, the Settlement Administrator, and ClaimShield are strictly prohibited from using or disclosing PHI for any purpose other than the administration, verification, audit, and distribution of the Settlement in this Action; and
     c) Pursuant to 45 C.F.R. § 164.512(e)(1)(v), all PHI, including any copies, summaries, extracts, or derived data, shall be returned to the providing entity or destroyed in accordance with Section 8 of this Order upon the conclusion of this litigation.

3.2 **Gramm-Leach-Bliley Act Compliance (15 U.S.C. § 6802(e)(8))**:
   - The disclosure and transmission of nonpublic personal financial information (including bank routing and account numbers, payment handle verifications, and credit/debit card exposure records) to ClaimShield for the sole purpose of validating lawful payout destinations and preventing fraudulent misdirection of settlement funds is an authorized disclosure pursuant to 15 U.S.C. § 6802(e)(3)(B) (fraud prevention) and 15 U.S.C. § 6802(e)(8) (compliance with judicial process).

3.3 **California Consumer Privacy Act & State Privacy Statutes**:
   - The exchange and cryptographic hashing of CCII pursuant to this Order constitutes an authorized processing activity under Cal. Civ. Code § 1798.145(a)(1) and analogous state data privacy statutes. ClaimShield shall act as a "Service Provider" and "Contractor" under the CCPA/CPRA, and is strictly prohibited from "selling" or "sharing" (as those terms are statutorily defined) any CCII.

---

### 4. ZERO-KNOWLEDGE VERIFICATION & ANTI-SYBIL PROTOCOLS

4.1 **Data Minimization and Ephemeral Enclaves**:
   - ClaimShield shall implement strict data minimization principles conforming to NIST Special Publication 800-53 Rev. 5 and NIST Special Publication 800-63A.
   - Any raw government identity documents, driver's licenses, passports, or full Social Security Numbers ingested for identity dispute resolution shall be evaluated in isolated, ephemeral memory environments solely for identity verification and biometric liveness confirmation. Under no circumstances shall raw identity documents or unencrypted full Social Security Numbers be committed to persistent disk storage by ClaimShield.

4.2 **Cryptographic Blind Indexing Architecture**:
   - For duplicate prevention, ClaimShield shall normalize claimant attributes and generate an irreversible salted blind index:
     $$\text{unique\_person\_hash} = \text{HMAC-SHA256}(K_{\text{HSM}}, \text{Normalize}(\text{LegalName}) \parallel \text{DOB} \parallel \text{SSN4})$$
   - ClaimShield shall enforce a strict unique constraint across all ingested claims. In the event two or more claim submissions yield an identical `unique_person_hash`, ClaimShield shall flag the submission as an `IDENTITY_COLLISION` and invoke the quarantine procedures outlined in Section 6.

4.3 **1:1 Financial Rail Binding Invariant**:
   - To eliminate the routing of multiple settlement checks or digital transfers to syndicated bot-farming rings, ClaimShield shall bind each validated `unique_person_hash` to a single cryptographic hash of the destination financial account (e.g., hashed PayPal identifier, hashed ACH routing/account string, or hashed Venmo handle).
   - Any attempt to route settlement disbursements from multiple claimant identities to a shared or duplicate financial destination shall be categorized as a high-confidence Sybil attack, resulting in an automatic block and immediate referral to the Settlement Administrator.

4.4 **Real-Time Automated Risk Scoring**:
   - ClaimShield is authorized to deploy automated telemetry, residential proxy detection, headless browser fingerprinting, and device reputation scoring on all electronic claim intake portals.
   - Any claim submission exhibiting risk telemetry indicative of automated script execution (e.g., headless Chrome execution, synthetic mouse trajectory anomalies, impossible geographic velocity, or high-velocity IP subnet clustering) shall be tagged with a risk score exceeding threshold limits and flagged for administrative rejection or step-up verification.

---

### 5. ABSOLUTE PROHIBITION AGAINST COMMERCIAL EXPLOITATION AND RE-IDENTIFICATION

5.1 **Restricted Use Solely for Settlement Administration**:
   - ClaimShield, the Settlement Administrator, and their respective officers, directors, employees, and subcontractors shall use CCII and derived cryptographic hashes **strictly and exclusively** for verifying eligibility, preventing fraudulent or duplicate submissions, resolving conflicting claims, and facilitating disbursement in this Action.

5.2 **Absolute Prohibition on Commercial Exploitation**:
   - Under no circumstances shall CCII, cryptographic hashes, or claimant metadata be:
     a) Sold, rented, leased, licensed, or monetized in any manner;
     b) Used for marketing, advertising, cross-selling, consumer profiling, commercial solicitation, or lead generation;
     c) Disclosed to any third party not expressly authorized by this Order or subsequent order of the Court; or
     d) Used to train public artificial intelligence models, commercial data products, or commercial credit reporting tools.

5.3 **Prohibition Against Reverse Engineering & Re-Identification**:
   - Any attempt by any party, vendor, or outside entity to reverse-engineer, de-hash, rainbow-table, or re-identify pseudonymous cryptographic blind indices generated under this Order is strictly prohibited and shall constitute criminal contempt of this Court, subjecting the violating entity to statutory sanctions, injunctive remedies, and civil damages.

---

### 6. JUDICIAL ESCROW FREEZE & DISPUTE ARBITRATION AUTHORITY

6.1 **Automated Circuit-Breaker Freeze**:
   - Pursuant to the Court's equitable authority under Fed. R. Civ. P. 23(d)(1), ClaimShield and the Settlement Administrator are expressly empowered and directed to institute an immediate **Judicial Escrow Freeze** upon any settlement disbursement in the event of:
     a) An `IDENTITY_COLLISION` where two or more claimants file under the identical legal identity anchor;
     b) A duplicate claim utilizing an identical Notice ID or Class Member Registration Code;
     c) A collision on destination financial payment rails; or
     d) High-confidence automated bot-farming detection.

6.2 **Notice of Freeze & Step-Up Verification Protocol**:
   - Within five (5) business days of instituting a Judicial Escrow Freeze, the Settlement Administrator or ClaimShield shall transmit a formal Notice of Conflicting Claim to the affected claimant(s).
   - The affected claimant shall be provided a reasonable opportunity (not less than thirty (30) calendar days) to resolve the conflict through a secure, digital step-up verification conforming to NIST SP 800-63A Level 3 standards, which shall include:
     a) Dynamic 3D biometric liveness detection to verify the physical presence of a living human and rule out deepfakes, video injection, or mask presentations; and/or
     b) Cryptographic verification of a government-issued physical identification card (RealID or e-Passport).

6.3 **Disposition of Quarantined Escrow**:
   - If an authentic Class Member successfully satisfies NIST 800-63A Level 3 verification, the Judicial Escrow Freeze shall be released, and the valid claim approved for distribution.
   - The colliding, fraudulent, or unverified submission shall be formally disqualified, and its associated payout funds shall remain in the Net Settlement Fund for pro-rata distribution to authentic Class Members pursuant to the Plan of Allocation.
   - Any party aggrieved by a final disqualification under this Section may petition the Court or Court-appointed Special Master within fourteen (14) days of notice for summary judicial review.

---

### 7. INFORMATION SECURITY SAFEGUARDS & INDEPENDENT AUDIT RIGHTS

7.1 **Technical and Operational Security Standards**:
   - ClaimShield and the Settlement Administrator shall maintain an information security program meeting or exceeding:
     a) SOC 2 Type II certification standards across Security, Confidentiality, and Availability trust services criteria;
     b) ISO/IEC 27001 certification; and
     c) NIST SP 800-53 Rev. 5 moderate-impact baseline controls.

7.2 **Encryption Mandates**:
   - All CCII and associated data shall be encrypted in transit using Transport Layer Security (TLS) version 1.3 or higher with modern, authenticated cipher suites.
   - All persistent storage containing verification metadata shall be encrypted at rest using AES-256-GCM or equivalent FIPS 140-3 validated cryptographic modules. Cryptographic signing and HMAC keys shall reside strictly within hardware security modules (HSMs).

7.3 **Court and Counsel Audit Rights**:
   - Class Counsel, Defense Counsel, and the Court's designee shall have the right, upon reasonable written notice, to inspect and audit ClaimShield's verification methodology, deduplication rates, and security posture.
   - ClaimShield shall maintain comprehensive, tamper-evident audit logs documenting every transaction, risk scoring evaluation, deduplication determination, and escrow freeze.

---

### 8. POST-DISTRIBUTION DATA RETENTION & MANDATORY DESTRUCTION

8.1 **Ephemeral Data Lifecycle**:
   - Except as strictly necessary to complete tax reporting obligations (e.g., IRS Form 1099 issuances), maintain judicial distribution accounting, or defend against distribution appeals, ClaimShield and the Settlement Administrator shall not retain CCII beyond the operational lifecycle of the settlement distribution.

8.2 **Mandatory Certified Sanitization**:
   - Within ninety (90) calendar days following the completion of all settlement distributions, uncashed check void periods, and final discharge of the Settlement Administrator by the Court:
     a) ClaimShield and the Settlement Administrator shall securely sanitize, purge, and destroy all CCII, lookup tables, and verification artifacts in accordance with NIST SP 800-88 Rev. 1 (*Guidelines for Media Sanitization*); and
     b) ClaimShield shall execute and file on the Court's master docket a formal Sworn Certificate of Certified Data Destruction pursuant to 28 U.S.C. § 1746, attesting under penalty of perjury that all CCII in its possession or control has been permanently eradicated.

---

### 9. GENERAL PROVISIONS

9.1 **Modification and Severability**:
   - This Order may be modified or amended by written stipulation of the Parties approved by the Court, or upon motion by any Party or ClaimShield for good cause shown. If any provision of this Order is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

9.2 **Enforcement and Contempt**:
   - The provisions of this Order constitute an injunction issued by this Court. Any unauthorized access, disclosure, commercialization, or re-identification of CCII in violation of this Order shall be punishable by civil and/or criminal contempt proceedings, statutory damages, and all other remedies available at law or in equity.

9.3 **Survival of Order**:
   - The obligations of confidentiality, restricted use, and data protection set forth in this Order shall survive the termination of this Action and the final discharge of the Settlement Administrator and ClaimShield.

---

### IT IS SO ORDERED.

DATED: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ , 202\_

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**THE HONORABLE [NAME OF DISTRICT JUDGE]**  
**UNITED STATES DISTRICT JUDGE**

---

### STIPULATED AND AGREED TO:

| | |
| :--- | :--- |
| **Dated:** \_\_\_\_\_\_\_\_\_\_\_\_, 202\_ | **Dated:** \_\_\_\_\_\_\_\_\_\_\_\_, 202\_ |
| | |
| \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| **[Lead Class Counsel Name]** | **[Defense Liaison Counsel Name]** |
| [Law Firm Name] | [Law Firm Name] |
| [Street Address] | [Street Address] |
| [City, State, Zip] | [City, State, Zip] |
| *Lead Counsel for Plaintiffs and the Proposed Class* | *Counsel for Defendant(s)* |
| | |
| **Dated:** \_\_\_\_\_\_\_\_\_\_\_\_, 202\_ | |
| | |
| \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | |
| **[Authorized Officer Name]** | |
| ClaimShield Technologies, Inc. | |
| *Court-Approved Verification & Anti-Sybil Clearinghouse* | |
