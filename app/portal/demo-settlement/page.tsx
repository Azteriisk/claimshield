"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { 
  Building, 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Send,
  ExternalLink
} from "lucide-react";

interface Settlement {
  id: string;
  caseName: string;
  defendant: string;
  administratorName: string;
  claimDeadline: string;
  estimatedBasePayout: number;
}

function PortalContent() {
  const searchParams = useSearchParams();
  const settlementId = searchParams.get("id") || "sett-tm-2024";

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [formFields, setFormFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    payoutAddress: "",
    auditToken: ""
  });
  const [isPreCleared, setIsPreCleared] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/settlements`)
      .then(res => res.json())
      .then(data => {
        const matched = data.settlements?.find((s: Settlement) => s.id === settlementId);
        setSettlement(matched || data.settlements?.[0] || null);
      });

    // Listen to custom SDK event
    const handleSdkEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setFormFields({
          firstName: customEvent.detail.legalFirstName || "",
          lastName: customEvent.detail.legalLastName || "",
          email: customEvent.detail.email || "",
          payoutAddress: customEvent.detail.payoutAddress || "",
          auditToken: customEvent.detail.auditToken || ""
        });
        setIsPreCleared(true);
      }
    };

    window.addEventListener("claimshield:verified", handleSdkEvent);
    return () => window.removeEventListener("claimshield:verified", handleSdkEvent);
  }, [settlementId]);

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlement) return;

    try {
      const res = await fetch("/api/claims/evaluate-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId: settlement.id,
          claimantName: `${formFields.firstName} ${formFields.lastName}`,
          email: formFields.email,
          payoutAddress: formFields.payoutAddress,
          submissionSpeedSec: isPreCleared ? 28 : 2.1,
          isDatacenter: false
        })
      });
      const data = await res.json();
      setSubmittedSuccess(`Claim successfully accepted by ${settlement.administratorName}. Intake Verdict: ${data.verdict} (Risk: ${(data.riskScore * 100).toFixed(0)}%)`);
    } catch {
      setSubmittedSuccess("Claim transmission completed.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Load ClaimShield Drop-in SDK */}
      <Script src="/sdk.js" strategy="afterInteractive" data-settlement-id={settlement?.id || "sett-tm-2024"} />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Administrator Legal Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
              <Scale className="w-4 h-4 text-emerald-400" />
              Official Court-Approved Settlement Notice &amp; Claim Intake Portal
            </span>
            <span className="font-mono text-zinc-400">
              Administered by: <strong className="text-zinc-200">{settlement?.administratorName || "Epiq Systems Inc."}</strong>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
              United States District Court
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {settlement?.caseName || "In re Ticketmaster / Live Nation Customer Data Breach Litigation"}
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Filing Deadline: <strong className="text-zinc-200">{settlement?.claimDeadline}</strong> &bull; Estimated Base Relief: <strong className="text-emerald-400">~${settlement?.estimatedBasePayout.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* The Claim Form Container */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Top Fast-Track Integration Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-zinc-900 border border-emerald-500/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  Recommended: Instant Pre-Cleared Submission
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Have a ClaimShield Identity Vault?
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed mt-0.5">
                  Skip manual document filing and captcha queues. Fast-track with one click to lock your payout to your legal name.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Target Container where the SDK injects the button */}
            <div id="claimshield-fasttrack-btn" className="pt-2"></div>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-zinc-900 px-3 text-zinc-500 font-semibold">
                Or Complete Standard Court Form
              </span>
            </div>
          </div>

          {/* Submission Success Alert */}
          {submittedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {submittedSuccess}
              </div>
              <div className="pt-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 underline"
                >
                  View in Administrator Fraud &amp; Audit Suite &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* The Standard Form Inputs */}
          <form onSubmit={handleSubmitManual} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formFields.firstName}
                  onChange={(e) => setFormFields({ ...formFields, firstName: e.target.value })}
                  required
                  placeholder="Jane"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formFields.lastName}
                  onChange={(e) => setFormFields({ ...formFields, lastName: e.target.value })}
                  required
                  placeholder="Doe"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                Claimant Email Address (Where Notice Was Received)
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formFields.email}
                onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                required
                placeholder="janedoe.real@gmail.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                Digital Payout Method (PayPal Email)
              </label>
              <input
                type="email"
                name="payoutAddress"
                id="payoutAddress"
                value={formFields.payoutAddress}
                onChange={(e) => setFormFields({ ...formFields, payoutAddress: e.target.value })}
                required
                placeholder="janedoe.real@gmail.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Hidden Audit Token populated by ClaimShield */}
            <input type="hidden" name="auditToken" id="auditToken" value={formFields.auditToken} />

            {isPreCleared && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>ClaimShield Attached</strong> &bull; Token: <span className="font-mono text-[11px]">{formFields.auditToken}</span>
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Claim to Administrator
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DemoSettlementPortal() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-zinc-500">Loading Official Settlement Portal...</div>}>
      <PortalContent />
    </Suspense>
  );
}
