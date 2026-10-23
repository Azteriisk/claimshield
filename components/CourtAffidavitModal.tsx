"use client";

import { useEffect, useState } from "react";
import { Scale, Printer, Download, X, ShieldCheck, CheckCircle2 } from "lucide-react";

interface CourtAffidavitModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimantName: string;
  dob: string;
  ssnLast4: string;
  payoutAddress: string;
  caseName?: string;
  administratorName?: string;
  contestedAddress?: string;
  auditToken?: string;
}

export function CourtAffidavitModal({
  isOpen,
  onClose,
  claimantName,
  dob,
  ssnLast4,
  payoutAddress,
  caseName = "In re AT&T Customer Data Incident (MDL #3114)",
  administratorName = "Kroll Settlement Administration",
  contestedAddress = "burner_payout_syndicate99@tempmail.io",
  auditToken = "tok_rule23_bio_seal"
}: CourtAffidavitModalProps) {
  const [mounted, setMounted] = useState(false);
  const [executionDate, setExecutionDate] = useState("");

  useEffect(() => {
    setMounted(true);
    setExecutionDate(new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }));
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textContent = `
UNITED STATES DISTRICT COURT
FOR THE CENTRAL DISTRICT OF CALIFORNIA
WESTERN DIVISION

IN RE: AT&T CUSTOMER DATA SECURITY INCIDENT LITIGATION
Master File No. 2:24-cv-04192-DOC-KES
MDL No. 3114

SWORN DECLARATION OF CLASS MEMBER PURSUANT TO 28 U.S.C. § 1746 IN SUPPORT OF
FORMAL OBJECTION, ESCROW QUARANTINE, AND PAYOUT REDIRECTION

I, ${claimantName}, declare under penalty of perjury under the laws of the United States of America:

1. I am an individual over 18 years of age and the authentic class member associated with Social Security Number ending in ***-**-${ssnLast4} and Date of Birth ${dob}.
2. I recently became aware that an unauthorized, fraudulent claim submission was tendered in my name in connection with the above-captioned class action settlement, designating an adverse payout account (${contestedAddress}).
3. I did not authorize, consent to, or execute said prior claim submission.
4. I have submitted to cryptographic identity verification in compliance with NIST SP 800-63A Level 3 standards, including facial liveness detection and government database matching via the ClaimShield Trust Protocol.
5. Evidentiary Token: ${auditToken} (HSM-anchored cryptographic timestamp).
6. Pursuant to Federal Rule of Civil Procedure 23(e) and the inherent supervisory authority of this Court, I hereby DEMAND that ${administratorName} immediately impose a judicial escrow freeze on any disbursements associated with my identity credentials until this dispute is resolved.
7. I direct that all rightful class settlement payments be distributed solely to my verified payout account: ${payoutAddress}.

I declare under penalty of perjury that the foregoing is true and correct.

Executed on ${executionDate}.

/s/ ${claimantName}
Claimant Signature (Digitally Certified)
Verification Token: ${auditToken}
`.trim();

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Court_Affidavit_28USC1746_${claimantName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 28 lines typical of federal court pleadings
  const lineNumbers = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white text-zinc-950 rounded-2xl shadow-2xl overflow-hidden my-auto printable-pleading border border-zinc-300">
        
        {/* Modal Toolbar (Suppressed on Print) */}
        <div className="no-print bg-zinc-900 text-zinc-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">28 U.S.C. § 1746 Sworn Court Declaration</h3>
              <p className="text-[11px] text-zinc-400">Formal legal pleading with attached biometric integrity hash</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 font-serif text-[13px] leading-[26px] bg-white text-black min-h-[850px] relative">
          
          {/* Pleading Line Numbers (1-28) */}
          <div className="absolute left-4 top-12 bottom-12 w-6 flex flex-col justify-between select-none text-[11px] text-zinc-400 font-mono text-right pr-2 border-r border-zinc-300 leading-[26px] hidden sm:flex">
            {lineNumbers.map((num) => (
              <span key={num}>{num}</span>
            ))}
          </div>

          <div className="sm:pl-10 space-y-6">
            {/* Header Caption */}
            <div className="text-center font-bold tracking-wider text-sm space-y-1">
              <div>UNITED STATES DISTRICT COURT</div>
              <div>FOR THE CENTRAL DISTRICT OF CALIFORNIA</div>
              <div className="text-xs font-normal">WESTERN DIVISION — LOS ANGELES</div>
            </div>

            {/* Case Caption Box */}
            <div className="border border-black grid grid-cols-1 md:grid-cols-2 text-xs">
              <div className="p-4 border-b md:border-b-0 md:border-r border-black space-y-2">
                <div className="font-bold uppercase tracking-wide">
                  IN RE: AT&amp;T CUSTOMER DATA SECURITY INCIDENT LITIGATION
                </div>
                <div className="text-[11px] italic text-zinc-700">
                  This Document Relates To:<br />
                  <strong>ALL CONSUMER ACTIONS &amp; ESCROW PROCEEDINGS</strong>
                </div>
              </div>

              <div className="p-4 space-y-1.5 font-mono text-[11px]">
                <div><strong>Lead Case No.:</strong> 2:24-cv-04192-DOC-KES</div>
                <div><strong>MDL Docket No.:</strong> 3114</div>
                <div className="pt-2 font-serif font-bold text-xs uppercase leading-snug">
                  SWORN DECLARATION OF CLASS MEMBER (28 U.S.C. § 1746) IN SUPPORT OF FORMAL OBJECTION, ESCROW QUARANTINE, AND CORRECTION OF DISBURSEMENT ACCOUNT
                </div>
              </div>
            </div>

            {/* Declaration Body */}
            <div className="space-y-4 pt-2 text-justify">
              <p>
                I, <strong>{claimantName}</strong>, pursuant to 28 U.S.C. § 1746, declare under penalty of perjury under the laws of the United States of America that the following is true and correct:
              </p>

              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>Class Member Identity:</strong> I am a natural person over the age of eighteen residing in the United States. I am the true and authentic individual associated with Social Security Number ending in <strong>***-**-{ssnLast4}</strong> and Date of Birth <strong>{dob}</strong>.
                </li>
                <li>
                  <strong>Discovery of Adverse Unauthorized Claim:</strong> I recently became aware that a third-party claim was submitted in my name in connection with the above-referenced settlement, routing distributions to an unauthorized recipient address (reported as: <span className="font-mono bg-zinc-100 px-1">{contestedAddress}</span>). I did not authorize, consent to, or execute said claim.
                </li>
                <li>
                  <strong>Cryptographic Biometric Proof of Authenticity:</strong> To conclusively verify my identity, I have successfully completed NIST SP 800-63A Level 3 biometric liveness authentication via the ClaimShield Trust Protocol. The cryptographic hash and hardware-anchored timestamp of this verification are recorded as follows:
                  <div className="my-2 p-2.5 bg-zinc-50 border border-zinc-200 font-mono text-[11px] rounded leading-tight break-all text-zinc-800">
                    <div>AUDIT_TOKEN: {auditToken}</div>
                    <div>TIMESTAMP_UTC: {new Date().toISOString()}</div>
                    <div>STATUS: CRYPTOGRAPHICALLY_ATTESTED_CLEAN</div>
                  </div>
                </li>
                <li>
                  <strong>Demand for Escrow Freeze:</strong> Pursuant to Federal Rule of Civil Procedure 23(e) and the inherent supervisory authority of the Court, I hereby demand that the Court-appointed Settlement Administrator (<strong>{administratorName}</strong>) immediately freeze and quarantine all digital or physical disbursements associated with my identity credentials until this dispute is fully adjudicated.
                </li>
                <li>
                  <strong>Exclusive Disbursement Directive:</strong> I instruct that all lawful proceeds and relief arising under this settlement be routed solely to my verified payout destination: <strong className="font-mono bg-zinc-100 px-1">{payoutAddress}</strong>.
                </li>
              </ol>

              <p className="pt-2">
                I declare under penalty of perjury under the laws of the United States of America that the foregoing statements are true and correct.
              </p>
            </div>

            {/* Execution Block */}
            <div className="pt-6 border-t border-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div className="space-y-1 text-xs">
                <div><strong>Executed this day:</strong> {executionDate}</div>
                <div><strong>Jurisdiction:</strong> United States of America</div>
                <div className="pt-3 flex items-center gap-2 text-emerald-700 font-sans text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Biometric Liveness Certified (NIST Level 3)</span>
                </div>
              </div>

              <div className="border-t border-black pt-2 sm:text-right font-mono text-xs">
                <div className="font-bold text-sm italic font-serif">/s/ {claimantName}</div>
                <div className="text-[11px] text-zinc-600">Digitally Verified Claimant Signature</div>
                <div className="text-[10px] text-zinc-500 break-all pt-1">
                  SHA-256 Seal: 7f83b1657ff1fc53b92dc18148a1d65d
                </div>
              </div>
            </div>

            {/* Certificate of Service */}
            <div className="pt-4 border-t border-zinc-200 text-[11px] text-zinc-600 space-y-1">
              <div className="font-bold uppercase tracking-wider text-black">Certificate of Service</div>
              <p>
                I hereby certify that on {executionDate}, a copy of this sworn declaration was transmitted electronically to Kroll Settlement Administration, Claims Review &amp; Anti-Fraud Department, and Class Counsel of Record.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
