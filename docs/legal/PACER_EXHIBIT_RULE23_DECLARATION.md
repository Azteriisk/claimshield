# UNITED STATES DISTRICT COURT
# NORTHERN DISTRICT OF CALIFORNIA
# SAN FRANCISCO DIVISION

| | |
| :--- | :--- |
| **IN RE: CONSUMER DATA SECURITY BREACH LITIGATION** | **Master Docket No. 3:24-md-03102-WHO** |
| | **CLASS ACTION** |
| This Document Relates To: | |
| **ALL ACTIONS** | **EXHIBIT [B] TO PLAINTIFFS' MOTION FOR FINAL APPROVAL OF CLASS ACTION SETTLEMENT AND PLAN OF ALLOCATION** |
| | |

---

### DECLARATION OF [NAME], SENIOR DIRECTOR OF CRYPTOGRAPHIC AUDITING AT CLAIMSHIELD TECHNOLOGIES, INC., REGARDING IMPLEMENTATION OF ANTI-FRAUD VERIFICATION, SYBIL BOT DISQUALIFICATION, AND ZERO-KNOWLEDGE DEDUPLICATION PROTOCOLS PURSUANT TO FED. R. CIV. P. 23(e)

I, **[Declarant Name]**, declare under penalty of perjury pursuant to **28 U.S.C. § 1746** as follows:

---

### 1. INTRODUCTION AND PROFESSIONAL BACKGROUND

1. I am over eighteen years of age and competent to testify to the matters stated herein. I make this declaration in my capacity as Senior Director of Cryptographic Auditing and Lead Technical Compliance Officer at **ClaimShield Technologies, Inc.** ("ClaimShield"), located at [Address of ClaimShield].

2. I hold advanced degrees in Computer Science and Cybersecurity from [University], specializing in applied cryptography, zero-knowledge proofs, and automated distributed threat intelligence. Over the past fifteen years, I have served as a cryptographic systems architect and independent fraud auditor for high-volume financial transaction networks, digital identity verifiers, and federal administrative claims facilities. I have authored peer-reviewed publications on Sybil defense in decentralized systems and deterministic blind indexing.

3. Pursuant to the Court's Preliminary Approval Order entered on [Date] (ECF No. [XXX]) and the Stipulated Qualified Protective Order entered on [Date] (ECF No. [YYY]), ClaimShield was retained by Lead Class Counsel and the Court-appointed Settlement Administrator, [Name of Settlement Administrator] (the "Settlement Administrator"), to serve as the independent **Class Action Verification & Anti-Sybil Clearinghouse** for the proposed \$120,000,000.00 Net Settlement Fund established in this Action.

4. The factual statements set forth in this Declaration are based upon my personal knowledge, my direct supervision of ClaimShield's technical infrastructure, and my forensic review of the claims data, audit logs, and cryptographic verification receipts generated during the official claims submission period (from [Date] through [Date]).

---

### 2. THE MODERN SETTLEMENT FRAUD LANDSCAPE & THE SYBIL EPIDEMIC

5. Modern digital class action settlements face an existential crisis arising from coordinated cybercriminal bot-farming networks. In traditional paper-based claims administration, the physical friction of printing, signing, and mailing claim forms provided a natural barrier against industrial-scale fraud. However, the modern shift toward open digital portals—while vastly improving accessibility for legitimate consumers—has exposed settlement funds to automated credential stuffing, synthetic identity generation, and syndicated bot assaults.

6. Syndicated fraud operations ingest mass dark web breach files containing hundreds of millions of compromised consumer records (including names, street addresses, dates of birth, and leaked email addresses). These rings deploy automated headless browser scripts (e.g., custom Puppeteer, Playwright, or Selenium routines) routed through residential proxy networks (such as BrightData or Oxylabs) to submit tens of thousands of fabricated claims per hour.

7. The economic harm inflicted by these automated rings in a **fixed-pot, pro-rata** settlement is severe. Because every approved claim increases the denominator against which the fixed settlement fund is divided, unmitigated bot invasions severely dilute the recovery received by authentic, living class members, often reducing potential recoveries from hundreds of dollars to a few cents. Furthermore, when legitimate victims eventually attempt to submit their claims, they are frequently confronted with an error stating that their unique Notice ID or email has already been redeemed by an imposter.

8. In recognition of this epidemic, the Judicial Conference Advisory Committee on Civil Rules amended Federal Rule of Civil Procedure 23(e)(2)(C)(ii) in 2018 to mandate that federal courts examine the "effectiveness of any proposed method of distributing relief to the class, including the method of processing class-member claims." ClaimShield was deployed in this Action specifically to satisfy this Rule 23(e) mandate by providing an impenetrable, cryptographic defense against bot siphoning while ensuring friction-free access for legitimate class members.

---

### 3. THE CLAIMSHIELD CRYPTOGRAPHIC ANTI-FRAUD METHODOLOGY

9. To detect and eliminate fraudulent submissions without violating class member privacy or storing unencrypted sensitive government identifiers, ClaimShield deployed a multi-layered verification architecture:

10. **Layer 1: Deterministic Salted Blind Indexing (`unique_person_hash`)**:
    - Under Section 4 of the Court's Qualified Protective Order, ClaimShield implemented a zero-knowledge deduplication protocol conforming to FIPS 180-4 and FIPS 198-1:
      $$\text{unique\_person\_hash} = \text{HMAC-SHA256}(K_{\text{HSM}}, \text{Normalize}(\text{LegalName}) \parallel \text{DOB} \parallel \text{SSN4})$$
    - The cryptographic secret key ($K_{\text{HSM}}$) was managed within a dedicated FIPS 140-3 Level 3 Hardware Security Module.
    - Each claimant's normalized identity attributes were hashed in an isolated, ephemeral memory enclave. A database-level `UNIQUE` index strictly prevented any individual from establishing multiple claims under varying email aliases, misspelled names, or manipulated address strings.

11. **Layer 2: 1:1 Financial Rail Binding Invariant**:
    - A primary signature of syndicated bot farms is the concentration of digital payouts: fraud rings submit thousands of distinct victim identities but route the proceeds to a consolidated pool of burner digital wallets (PayPal accounts, Venmo handles, or prepaid debit cards).
    - ClaimShield enforced a platform-wide **1:1 Financial Rail Binding Invariant**. Each verified `unique_person_hash` was cryptographically bound to a single salted hash of the destination payout rail. Any attempt to route multiple approved claims to an identical bank account or digital payment handle triggered an automated block and immediate referral to the audit quarantine.

12. **Layer 3: Real-Time Ingestion Telemetry & Machine Learning Risk Scoring**:
    - Every digital submission received across the official web claims portal was evaluated via ClaimShield's `/evaluate-risk` API engine within an average response latency of 142 milliseconds.
    - The engine evaluated forty-two (42) distinct behavioral and network telemetry vectors, including:
      a) Headless browser execution artifacts (overridden `navigator.webdriver` flags, Chrome DevTools Protocol fingerprints);
      b) Biometric human interaction anomalies (robotic, linear mouse movements, instant keystroke paste injections);
      c) Network infrastructure anomalies (known residential proxy exits, bulletproof hosting Autonomous System Numbers [ASNs], Tor exit nodes); and
      d) IP subnet velocity spikes (e.g., hundreds of claims originating from a single /24 CIDR block within minutes).
    - Submissions scoring above an empirical fraud threshold ($\text{Risk Score} \ge 0.85$) were automatically tagged as automated Sybil intrusions.

13. **Layer 4: Circuit-Breaker Judicial Escrow Freeze & NIST 800-63A Level 3 Adjudication**:
    - Where a legitimate claimant encountered an `IDENTITY_COLLISION` (i.e., an imposter or bot had previously filed using their identity), ClaimShield's circuit breaker placed the associated payout into a **Judicial Escrow Freeze** pursuant to Section 6 of the Qualified Protective Order.
    - The authentic claimant was offered an instantaneous, secure digital step-up verification conforming to **NIST Special Publication 800-63A Level 3**. Claimants completed dynamic 3D facial liveness challenges (ruling out screen replays, paper masks, and generative deepfakes) and/or an NFC chip read of their physical RealID or passport.
    - Upon successful liveness verification, the authentic claimant was awarded the claim, the imposter submission was permanently disqualified, and the imposter's digital footprint was added to ClaimShield's Global Settlement Fraud Blacklist.

---

### 4. EMPIRICAL CLAIMS AUDIT FINDINGS

14. During the court-approved claims window, the settlement administration system recorded a total of **1,842,910 gross digital claim submissions**.

15. Following the comprehensive application of ClaimShield's cryptographic verification, telemetry analysis, and duplicate elimination protocols, the gross submissions were audited and categorized as set forth in Table 1 below:

#### TABLE 1: COMPREHENSIVE CLAIMS VERIFICATION & FRAUD AUDIT AUDIT BREAKDOWN

| Category / Submission Classification | Total Claims | Percentage of Gross | Disposition / Action Taken |
| :--- | :--- | :--- | :--- |
| **Gross Electronic Claims Received** | **1,842,910** | **100.00%** | Ingested via digital portal |
| *Automated Sybil Bot Submissions Disqualified* | *846,720* | *45.94%* | Rejected via `/evaluate-risk` telemetry |
| *Duplicate Identity Submissions Blocked* | *164,380* | *8.92%* | Blocked by `unique_person_hash` invariant |
| *Financial Rail Collisions Intercepted* | *53,190* | *2.89%* | Blocked by 1:1 Payout Rail Invariant |
| *Unverified Conflicted Claims (Failed Liveness)* | *8,410* | *0.46%* | Disqualified following escrow freeze expiry |
| **Total Fraudulent / Illegitimate Claims Excluded** | **1,072,700** | **58.21%** | **Formally disqualified from distribution** |
| **Legitimate Class Member Claims Approved** | **770,210** | **41.79%** | **Certified for pro-rata cash distribution** |

16. As demonstrated in Table 1, **1,072,700 claims—representing 58.21% of all gross submissions—were determined to be fraudulent, automated, duplicate, or unverified collisions**.

17. **Dispute Adjudication Results**:
    - During the claims period, ClaimShield initiated **9,840 Judicial Escrow Freezes** arising from identity collisions.
    - Of those, **8,920 claimants completed NIST 800-63A Level 3 step-up verification**. In 8,495 of these cases (95.2%), the authentic living human claimant successfully validated their identity, resulting in the disqualification of the prior imposter claim. The average time required for a consumer to complete this step-up verification was 2 minutes and 48 seconds.
    - The remaining 920 cases represented unverified claims where neither claimant completed step-up verification prior to the court-mandated deadline; these funds were preserved in the settlement pool.

---

### 5. FINANCIAL IMPACT ANALYSIS: PRESERVATION OF COMMON SETTLEMENT FUND

18. The proposed Settlement establishes a fixed Net Common Settlement Fund of **\$120,000,000.00** available for cash distribution to eligible Class Members after court-approved deductions for attorneys' fees, litigation expenses, and service awards.

19. Under the court-approved Plan of Allocation, the cash distribution is structured on a pro-rata basis among all approved, verified claims.

20. Table 2 illustrates the direct financial benefit delivered to legitimate Class Members as a result of ClaimShield's cryptographic screening:

#### TABLE 2: PRO-RATA POT PRESERVATION AND CLASS RECOVERY ANALYSIS

| Distribution Scenario | Total Claims Paid | Net Fund Available | Average Cash Payout Per Class Member | Net Fund Diverted to Fraud Rings |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline Without Anti-Fraud Clearinghouse** *(All Gross Claims Paid Unchecked)* | 1,842,910 | \$120,000,000.00 | **\$65.11** | **\$69,843,497.00** *(58.21% siphoned by bots)* |
| **Actual Distribution With ClaimShield Defense** *(Only Verified Authentic Class Members Paid)* | 770,210 | \$120,000,000.00 | **\$155.80** | **\$0.00** *(Zero dollars lost to bot rings)* |
| **NET BENEFIT DELIVERED TO CLASS** | **- 1,072,700 Fraudulent Claims** | **\$120,000,000.00 Full Pot Intact** | **+ \$90.69 (+ 139.3%) Per Class Member** | **\$69,843,497.00 PRESERVED FOR CLASS** |

21. As established in Table 2, absent ClaimShield's anti-fraud clearinghouse protocols, approximately **\$69,843,497.00 of the \$120,000,000.00 settlement fund would have been siphoned directly by automated bot operators and criminal syndicates**.

22. By disqualifying 1,072,700 fraudulent and duplicate filings, ClaimShield increased the net cash recovery delivered to each verified, authentic Class Member from **\$65.11 to \$155.80—an absolute increase of \$90.69 per class member, or a 139.3% increase in recovery**.

---

### 6. COMPLIANCE WITH FED. R. CIV. P. 23(e)(2) MANDATES

23. Under Rule 23(e)(2)(C)(ii), this Court must find that the settlement is "fair, reasonable, and adequate" after considering "the effectiveness of any proposed method of distributing relief to the class, including the method of processing class-member claims."

24. The Advisory Committee Notes to the 2018 Amendments state that courts must look to whether claim processing methods are designed to "deter or detect unjustified claims" without imposing "undue demands on claimants."

25. ClaimShield's cryptographic architecture directly satisfies these core judicial principles:
    a) **Robust Deterrence & Detection**: Over one million unjustified, automated, and duplicate claims were systematically detected and disqualified using objective, mathematical, and cryptographic standards;
    b) **Absence of Undue Burden**: Authentic class members experienced a streamlined, rapid digital filing experience, while biometric step-up friction was reserved strictly for cases with documented identity collisions;
    c) **Complete Auditability**: Every deduplication and disqualification decision is permanently anchored in cryptographic audit ledgers available for judicial inspection; and
    d) **Data Privacy**: No unencrypted Social Security Numbers, full government identity scans, or unnecessary PII were permanently retained or exposed during the audit process, in strict compliance with the Qualified Protective Order.

---

### 7. JUDICIAL ESCROW RECONCILIATION & POST-DISTRIBUTION SANITIZATION

26. All approved claims listed in ClaimShield's Final Certified Distribution Roll have been reconciled against the Settlement Administrator's distribution escrow accounts. Payout destination rails have been validated 1:1, ensuring that no single payment handle will receive multiple disbursements.

27. In accordance with Section 8 of the Qualified Protective Order, ClaimShield will maintain these cryptographic verification records until the completion of distribution, the expiration of check-cashing periods, and the entry of an order discharging the Settlement Administrator.

28. Within ninety (90) days of such final discharge, ClaimShield will execute a complete cryptographic purge and media sanitization of all verification tables in accordance with NIST SP 800-88 Rev. 1, and will file a Sworn Certificate of Certified Data Destruction on this docket.

---

### 8. CONCLUSION

29. Based upon my forensic analysis, technical oversight, and professional judgment, the claims verification and anti-fraud protocols executed by ClaimShield have successfully protected the Integrity of the Settlement Fund, prevented the unlawful diversion of nearly \$70 million to automated cybercriminal syndicates, and maximized the direct financial recovery delivered to genuine, living Class Members in full compliance with Federal Rule of Civil Procedure 23(e).

I declare under penalty of perjury under the laws of the United States of America pursuant to **28 U.S.C. § 1746** that the foregoing is true and correct.

Executed this \_\_\_\_ day of \_\_\_\_\_\_\_\_\_\_\_\_, 202\_, at San Francisco, California.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**[DECLARANT NAME]**  
Senior Director of Cryptographic Auditing & Technical Compliance  
**ClaimShield Technologies, Inc.**
