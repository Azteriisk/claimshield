# HIPAA BUSINESS ASSOCIATE AGREEMENT (BAA)
### FOR HEALTHCARE CLASS ACTION SETTLEMENT ADMINISTRATION & CLAIMS VERIFICATION

This **HIPAA BUSINESS ASSOCIATE AGREEMENT** (this "Agreement" or "BAA") is entered into and made effective as of the \_\_\_\_ day of \_\_\_\_\_\_\_\_\_\_\_\_, 202\_ (the "Effective Date"), by and between:

1. **[COVERED ENTITY OR SETTLEMENT ADMINISTRATOR]**, in its capacity as a Covered Entity, Court-Appointed Settlement Administrator, or Business Associate under 45 C.F.R. § 160.103 (hereinafter referred to as "Covered Entity" or "Administrator"), having its principal place of business at [Address of Covered Entity/Administrator]; and

2. **CLAIMSHIELD TECHNOLOGIES, INC.**, a Delaware corporation, in its capacity as a Business Associate or Subcontractor Business Associate under 45 C.F.R. § 160.103 (hereinafter referred to as "Business Associate" or "ClaimShield"), having its principal place of business at [Address of ClaimShield].

Covered Entity/Administrator and ClaimShield are each individually referred to herein as a "Party" and collectively as the "Parties."

---

### RECITALS

WHEREAS, this Agreement is executed in connection with the administration, verification, audit, and distribution of class action settlement funds arising from healthcare-related multidistrict litigations, hospital ransomware attacks, pharmacy benefits disruptions, and health insurance data compromises (including, by way of example, actions resembling *In re Change Healthcare Data Breach Litigation* or health system breach class actions under Federal Rule of Civil Procedure 23);

WHEREAS, in connection with providing class action verification, anti-fraud screening, deduplication, identity conflict adjudication, and settlement notice facilitation (the "Services"), ClaimShield may receive, create, maintain, transmit, or have access to Protected Health Information ("PHI") and Electronic Protected Health Information ("ePHI") subject to federal privacy and security regulations;

WHEREAS, the Parties desire to comply with the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), the Health Information Technology for Economic and Clinical Health Act ("HITECH Act"), Title XIII of Division A and Title IV of Division B of the American Recovery and Reinvestment Act of 2009 (Public Law 111-5), and the implementing regulations issued by the U.S. Department of Health and Human Services ("HHS"), codified at 45 C.F.R. Part 160 and Part 164, Subparts A, C, D, and E (the "HIPAA Rules"); and

WHEREAS, 45 C.F.R. § 164.502(e) and § 164.504(e) require Covered Entities and Business Associates to enter into a written agreement governing the permissible uses, disclosures, and security safeguards applicable to PHI and ePHI;

NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

---

### 1. DEFINITIONS

Capitalized terms used but not otherwise defined in this Agreement shall have the same meanings as given to them under HIPAA, the HITECH Act, and the HIPAA Rules.

1.1 **"Breach"** shall have the same meaning as set forth in 45 C.F.R. § 164.402, and generally means the unauthorized acquisition, access, use, or disclosure of Protected Health Information in a manner not permitted under Subpart E of 45 C.F.R. Part 164 which compromises the security or privacy of the Protected Health Information.

1.2 **"Electronic Protected Health Information" (or "ePHI")** shall have the same meaning as set forth in 45 C.F.R. § 160.103, and is limited to Protected Health Information that is transmitted by electronic media or maintained in electronic media.

1.3 **"Individual"** shall have the same meaning as set forth in 45 C.F.R. § 160.103 and shall include a person who qualifies as a personal representative in accordance with 45 C.F.R. § 164.502(g), as well as any certified or putative Class Member under Fed. R. Civ. P. 23.

1.4 **"Protected Health Information" (or "PHI")** shall have the same meaning as set forth in 45 C.F.R. § 160.103, and is limited to information created or received by Business Associate from or on behalf of Covered Entity/Administrator, or created or received by Business Associate in connection with the Services.

1.5 **"Security Incident"** shall have the same meaning as set forth in 45 C.F.R. § 164.304, and means the attempted or successful unauthorized access, use, disclosure, modification, or destruction of information or interference with system operations in an information system.

1.6 **"Subcontractor"** shall have the same meaning as set forth in 45 C.F.R. § 160.103, and means a person or entity to whom a business associate delegates a function, activity, or service, other than in the capacity of a member of the workforce of such business associate.

1.7 **"Unsecured PHI"** shall have the same meaning as set forth in 45 C.F.R. § 164.402, and means PHI that is not rendered unusable, unreadable, or indecipherable to unauthorized persons through the use of a technology or methodology specified by the Secretary in guidance issued under section 13402(h)(2) of Public Law 111-5.

---

### 2. PERMITTED USES AND DISCLOSURES BY CLAIMSHIELD

2.1 **Scope of Services**:
   - Except as otherwise limited in this Agreement or by Court Qualified Protective Order, ClaimShield may use or disclose PHI only to the extent reasonably necessary to perform the Services, which include:
     a) Cross-referencing putative Class Member claims against court-approved Class Lists and compromised patient directories;
     b) Performing deterministic salted blind indexing and zero-knowledge deduplication to identify and disqualify fraudulent or duplicate healthcare claims;
     c) Adjudicating conflicting claims involving stolen patient identities through NIST SP 800-63A Level 3 step-up verification;
     d) Calculating eligible relief tiers based on confirmed medical, prescription, or therapeutic breach exposure; and
     e) Preparing certified, non-identifying distribution audit reports for submission to federal court pursuant to Fed. R. Civ. P. 23(e).

2.2 **Compliance with HIPAA and HITECH**:
   - Business Associate shall not use or further disclose PHI other than as permitted or required by this Agreement, the underlying Service Agreement, the Court's Qualified Protective Order, or as Required By Law.

2.3 **Data Minimization and Zero-Knowledge Processing**:
   - Business Associate shall comply with the Minimum Necessary standard set forth in 45 C.F.R. § 164.502(b).
   - In performing deduplication, Business Associate shall convert PHI identifiers (e.g., patient name, date of birth, insurance member ID) into irreversible salted cryptographic hashes (`unique_person_hash`) within isolated memory enclaves, avoiding the persistent storage of raw clinical narratives or medical diagnosis codes whenever feasible.

2.4 **Prohibition on Commercialization and Secondary Use**:
   - Under no circumstances shall Business Associate:
     a) Sell, rent, lease, or commercialize PHI (pursuant to 42 U.S.C. § 17935(d) and 45 C.F.R. § 164.502(a)(5)(ii));
     b) Use PHI for marketing, fundraising, or consumer behavioral targeting; or
     c) Attempt to de-anonymize or re-identify any de-identified health data outside the authorized judicial audit context.

---

### 3. OBLIGATIONS AND COVENANTS OF BUSINESS ASSOCIATE (CLAIMSHIELD)

3.1 **Implementation of Safeguards (Security Rule Compliance)**:
   - Pursuant to 45 C.F.R. §§ 164.308, 164.310, 164.312, and 164.316, Business Associate shall implement comprehensive administrative, physical, and technical safeguards that reasonably and appropriately protect the confidentiality, integrity, and availability of ePHI that it creates, receives, maintains, or transmits on behalf of Covered Entity/Administrator.
   - Specific technical controls shall include:
     a) **Encryption in Transit**: Strict enforcement of TLS 1.3 or higher across all web, API, and inter-service endpoints;
     b) **Encryption at Rest**: AES-256-GCM encryption of all persistent storage, backup snapshots, and database volumes containing PHI or related hashes;
     c) **Hardware Security Modules (HSM)**: Cryptographic signing keys and HMAC salts managed strictly within FIPS 140-3 validated HSMs;
     d) **Access Controls**: Role-based least-privilege access, biometric multi-factor authentication (MFA) for all engineering personnel, and immediate revocation upon role transfer; and
     e) **Audit Trails**: Immutable, tamper-evident logging of all read, query, export, or administrative modifications involving PHI.

3.2 **EXPEDITED BREACH NOTIFICATION PROTOCOL (< 72 HOURS)**:
   - **Accelerated Notification Window**: Notwithstanding the standard sixty (60) day statutory timeline under 45 C.F.R. § 164.410, Business Associate recognizes that class action judicial schedules and settlement administration impose heightened urgency. Accordingly, Business Associate covenants and agrees to notify Covered Entity/Administrator in writing **within seventy-two (72) hours of discovering** any confirmed Breach of Unsecured PHI or any confirmed Security Incident affecting systems maintaining PHI.
   - **Discovery Standard**: A Breach shall be treated as discovered by Business Associate as of the first day on which such Breach is known to Business Associate (including any person, other than the individual committing the breach, who is an employee, officer, or other agent of Business Associate), or, by exercising reasonable diligence, would have been known to Business Associate.
   - **Mandatory Forensic Content**: The notice shall contain, to the extent known at the time of reporting:
     a) A brief description of the incident, including the date of the incident and the date of discovery;
     b) The identification of each Individual / Class Member whose Unsecured PHI has been, or is reasonably believed to have been, accessed, acquired, used, or disclosed;
     c) A description of the categories of PHI involved (e.g., patient name, social security number, diagnostic codes, prescription numbers);
     d) The forensic IP addresses, attack vectors, or threat actors identified;
     e) An assessment of the probability that the PHI has been compromised; and
     f) A description of the remedial steps taken or being taken to mitigate harm, contain the incident, and prevent future recurrences.
   - **Mitigation and Cooperation**: Business Associate shall take prompt corrective action to cure the breach, mitigate its harmful effects, and fully cooperate with Covered Entity/Administrator in notifying affected Individuals, class action presiding judges, Class Counsel, and HHS Office for Civil Rights (OCR).

3.3 **Subcontractor Compliance (45 C.F.R. § 164.502(e)(1)(ii))**:
   - Business Associate shall ensure that any Subcontractor that creates, receives, maintains, or transmits PHI on behalf of Business Associate agrees in writing to the same restrictions, conditions, and security safeguards that apply to Business Associate with respect to such information.

3.4 **Access to Books and Records**:
   - Business Associate shall make its internal practices, books, and records relating to the use and disclosure of PHI available to the Secretary of Health and Human Services upon request for purposes of determining Covered Entity's or Business Associate's compliance with the HIPAA Rules.

3.5 **Assistance with Individual Rights**:
   - To the extent Business Associate maintains PHI in a Designated Record Set:
     a) **Access (45 C.F.R. § 164.524)**: Business Associate shall provide access to PHI to Covered Entity/Administrator within ten (10) calendar days of request to enable compliance with an Individual's right of access;
     b) **Amendment (45 C.F.R. § 164.526)**: Business Associate shall incorporate any amendments or corrections to PHI directed by Covered Entity/Administrator within ten (10) calendar days; and
     c) **Accounting of Disclosures (45 C.F.R. § 164.528)**: Business Associate shall maintain and provide a record of disclosures of PHI to permit Covered Entity/Administrator to respond to an Individual's request for an accounting.

---

### 4. OBLIGATIONS OF COVERED ENTITY / SETTLEMENT ADMINISTRATOR

4.1 **Notice of Limitations and Restrictions**:
   - Covered Entity/Administrator shall notify Business Associate of:
     a) Any limitations in its notice of privacy practices under 45 C.F.R. § 164.520, to the extent such limitation affects Business Associate's use or disclosure of PHI;
     b) Any changes in, or revocation of, permission by an Individual to use or disclose PHI; and
     c) Any restriction on the use or disclosure of PHI that Covered Entity has agreed to or is required to abide by under 45 C.F.R. § 164.522.

4.2 **Permissible Requests**:
   - Covered Entity/Administrator shall not request Business Associate to use or disclose PHI in any manner that would not be permissible under the HIPAA Rules if done directly by Covered Entity.

---

### 5. TERM, TERMINATION, AND CERTIFIED DESTRUCTION OF PHI

5.1 **Term**:
   - This Agreement shall take effect on the Effective Date and shall continue in full force and effect until all PHI provided by Covered Entity/Administrator, or created or received by Business Associate, is destroyed or returned to Covered Entity/Administrator in accordance with Section 5.3.

5.2 **Termination for Cause (45 C.F.R. § 164.504(e)(2)(iii))**:
   - Upon Covered Entity's/Administrator's knowledge of a material breach of this Agreement by Business Associate, Covered Entity/Administrator shall provide thirty (30) days written notice detailing the breach. If Business Associate fails to cure the breach within thirty (30) days, Covered Entity/Administrator may immediately terminate this Agreement and the underlying Service Agreement.
   - If Business Associate knows of a pattern of activity or practice of Covered Entity/Administrator that constitutes a material breach of this Agreement, Business Associate shall take reasonable steps to cure the breach or terminate the relationship if feasible.

5.3 **MANDATORY CERTIFIED DESTRUCTION OF PHI UPON SETTLEMENT COMPLETION**:
   - **Destruction Timeline**: Within thirty (30) calendar days following the completion of all settlement claims distributions, uncashed check void expirations, and final discharge of the Settlement Administrator by the presiding federal court:
     a) Business Associate shall securely destroy and sanitize all PHI, ePHI, patient lists, diagnostic exposure tables, and derived verification artifacts in its possession, custody, or control;
     b) All electronic records containing PHI shall be sanitized in strict accordance with **NIST Special Publication 800-88 Revision 1** (*Guidelines for Media Sanitization*), utilizing cryptographic erase, multipass digital overwrite, or physical media destruction protocols; and
     c) Business Associate shall deliver to Covered Entity/Administrator and file with the Court a formal **Officer's Sworn Certificate of Certified PHI Destruction**, executed under penalty of perjury pursuant to 28 U.S.C. § 1746, attesting that all PHI has been permanently destroyed and is unrecoverable.
   - **Infeasibility Exception**: If Business Associate determines that returning or destroying the PHI is physically or legally infeasible (such as immutable append-only court disaster recovery archives mandated by federal evidentiary retention orders), Business Associate shall notify Covered Entity/Administrator in writing of the conditions that make return or destruction infeasible. In such event, Business Associate shall extend the protections of this Agreement to such PHI, limit further uses and disclosures strictly to those purposes that make the return or destruction infeasible, and destroy the PHI immediately once such legal barriers expire.

---

### 6. INDEPENDENT CONTRACTOR STATUS & JUDICIAL HARMONY

6.1 **Independent Contractor**:
   - Business Associate is an independent contractor, and nothing in this Agreement shall be construed to create an agency, partnership, or joint venture relationship between the Parties.

6.2 **Harmony with Court Qualified Protective Orders**:
   - This Agreement is designed to operate concurrently with, and in furtherance of, any Qualified Protective Order entered by the presiding United States District Court pursuant to 45 C.F.R. § 164.512(e)(1). In the event of an unavoidable conflict between the terms of this Agreement and a specific directive in a Court Qualified Protective Order, the order of the Court shall govern, provided that under no circumstances shall PHI be handled in a manner that violates the substantive safeguards of the HIPAA Security Rule.

---

### 7. MISCELLANEOUS PROVISIONS

7.1 **Regulatory References**:
   - A reference in this Agreement to a section in the HIPAA Rules means the section as in effect or as amended.

7.2 **Amendment to Comply with Law**:
   - The Parties agree to take such action as is necessary to amend this Agreement from time to time as is necessary for compliance with the requirements of HIPAA, HITECH, and any other applicable data privacy laws.

7.3 **Governing Law**:
   - To the extent not preempted by federal law (HIPAA/HITECH), this Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without giving effect to its conflict-of-laws principles.

7.4 **Execution and Electronic Delivery**:
   - This Agreement may be executed in one or more counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Delivery of an executed counterpart via electronic signature (DocuSign or equivalent cryptographic signature) shall be as effective as delivery of a manually signed hard copy.

---

### IN WITNESS WHEREOF, the Parties have caused this HIPAA Business Associate Agreement to be executed by their duly authorized representatives as of the Effective Date.

| **COVERED ENTITY / SETTLEMENT ADMINISTRATOR** | **BUSINESS ASSOCIATE: CLAIMSHIELD TECHNOLOGIES, INC.** |
| :--- | :--- |
| By: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | By: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | Title: **Chief Compliance Officer & Legal Tech Counsel** |
| Entity: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | Entity: **ClaimShield Technologies, Inc.** |
| Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
