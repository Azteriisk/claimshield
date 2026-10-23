"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Fingerprint, 
  Camera, 
  Radio, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  UserX,
  FileCheck2,
  RefreshCw
} from "lucide-react";

interface Dispute {
  id: string;
  contestedPersonHash: string;
  incumbentClaimantId: string;
  appellantEmail: string;
  appellantFirstName: string;
  appellantLastName: string;
  appellantPayoutAddress: string;
  status: string;
  stepUpLivenessScore?: number;
  fraudulentPayoutBlacklisted?: string;
  createdAt: string;
  adjudicationNotes?: string;
}

function DisputeContent() {
  const searchParams = useSearchParams();
  const initialHash = searchParams.get("hash") || "";
  const initialName = searchParams.get("name") || "Robert Miller";

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  // Appeal initiation form
  const [appealForm, setAppealForm] = useState({
    contestedPersonHash: initialHash,
    appellantFirstName: "Robert",
    appellantLastName: "Miller",
    appellantDob: "1985-11-20",
    appellantSsnLast4: "8899",
    appellantEmail: "robert.miller.real@gmail.com",
    appellantPayoutAddress: "robert.miller.real@gmail.com"
  });

  const [circuitTripped, setCircuitTripped] = useState(false);
  const [stepUpInProgress, setStepUpInProgress] = useState(false);
  const [stepUpComplete, setStepUpComplete] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      setDisputes(data.disputes || []);
      if (data.disputes?.length > 0) {
        setActiveDispute(data.disputes[0]);
      }
    } catch (err) {
      console.error("Failed to load disputes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTripCircuitBreaker = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appealForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to trigger appeal circuit breaker");
      } else {
        setCircuitTripped(true);
        setActiveDispute(data.dispute);
        setDisputes(prev => [data.dispute, ...prev]);
      }
    } catch {
      setErrorMessage("Network error initiating appeal");
    }
  };

  const handleRunStepUpVerification = async (proofType: "DYNAMIC_LIVENESS_VIDEO" | "NFC_PASSPORT") => {
    if (!activeDispute) return;
    setStepUpInProgress(true);
    setErrorMessage(null);

    // Simulate 1.5s biometric scan animation
    setTimeout(async () => {
      try {
        const res = await fetch("/api/disputes/step-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disputeId: activeDispute.id,
            proofType
          })
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || "Step-up verification failed");
        } else {
          setStepUpComplete(true);
          setActiveDispute(data.dispute);
          setResolutionMessage(data.message);
          // Refresh list
          loadDisputes();
        }
      } catch {
        setErrorMessage("Network error completing step-up verification");
      } finally {
        setStepUpInProgress(false);
      }
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-28 md:pb-12">
      {/* Page Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-semibold tracking-wide uppercase font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          NIST 800-63A Level 3 &bull; Account Contestation &amp; Recovery
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Identity Contestation &amp; Payout Recovery
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          If someone registered an account using your leaked PII, our automated Circuit Breaker immediately halts all pending payouts to prevent funds from being stolen while you complete Step-Up Verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form / Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {!circuitTripped && !activeDispute ? (
            /* Appeal Submission Form */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Initiate Identity Appeal &amp; Freeze Payouts
              </div>
              <p className="text-xs text-zinc-400">
                Submitting this appeal will immediately lock the incumbent account, notify settlement administrators, and freeze all outbound digital payouts.
              </p>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleTripCircuitBreaker} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">First Name</label>
                    <input
                      type="text"
                      value={appealForm.appellantFirstName}
                      onChange={(e) => setAppealForm({ ...appealForm, appellantFirstName: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={appealForm.appellantLastName}
                      onChange={(e) => setAppealForm({ ...appealForm, appellantLastName: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">DOB</label>
                    <input
                      type="date"
                      value={appealForm.appellantDob}
                      onChange={(e) => setAppealForm({ ...appealForm, appellantDob: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">SSN Last 4</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={appealForm.appellantSsnLast4}
                      onChange={(e) => setAppealForm({ ...appealForm, appellantSsnLast4: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Your Real Email</label>
                  <input
                    type="email"
                    value={appealForm.appellantEmail}
                    onChange={(e) => setAppealForm({ ...appealForm, appellantEmail: e.target.value })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Your Verified Payout Destination</label>
                  <input
                    type="email"
                    value={appealForm.appellantPayoutAddress}
                    onChange={(e) => setAppealForm({ ...appealForm, appellantPayoutAddress: e.target.value })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Once verified, all settlement funds will be transferred exclusively to this address.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Trip Circuit Breaker &amp; Freeze Payouts
                </button>
              </form>
            </div>
          ) : (
            /* Circuit Breaker Active / Step-Up Challenge Card */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-950 border border-red-800 text-red-300 text-[11px] font-mono font-bold uppercase">
                    ⚡ Circuit Breaker Engaged
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">Payout Quarantine Active</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Dispute ID: <span className="font-mono text-zinc-200">{activeDispute?.id}</span>
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-950/70 text-red-400 border border-red-800/80">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400 font-semibold">
                  <span>Current Escrow Status:</span>
                  <span className="text-red-400 font-mono uppercase font-bold">ALL PAYOUTS FROZEN</span>
                </div>
                <p className="text-zinc-500 leading-relaxed text-[11px]">
                  The claims administrator has placed a judicial hold on Claim #claim-bot-robert-1. The imposter cannot withdraw or receive funds.
                </p>
              </div>

              {/* Step-Up Challenge Actions */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Step 2: Complete High-Assurance Proof
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Prove authentic physical ownership to evict the fraudster and unlock your payout funds.
                </p>

                {resolutionMessage ? (
                  <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      {resolutionMessage}
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/vault"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Go to Your Reclaimed Vault &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleRunStepUpVerification("DYNAMIC_LIVENESS_VIDEO")}
                      disabled={stepUpInProgress}
                      className="w-full p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition">
                            Dynamic 3D Biometric Liveness
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Records active micro-expressions and dynamic phrase (NIST 800-63A Level 3)
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                    </button>

                    <button
                      onClick={() => handleRunStepUpVerification("NFC_PASSPORT")}
                      disabled={stepUpInProgress}
                      className="w-full p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-200 group-hover:text-cyan-400 transition">
                            NFC RealID / e-Passport Scan
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Reads government cryptographic signature embedded in physical chip
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                    </button>

                    {stepUpInProgress && (
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        Verifying biometric markers and nonces...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Forensic Evidence Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Forensic Identity Audit</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Side-by-side comparison between the flagged imposter and the authentic appellant.
              </p>
            </div>
            <button
              onClick={loadDisputes}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Forensic Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Imposter / Fraudulent Record */}
            <div className="bg-red-950/20 border border-red-900/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
                <span className="text-[11px] font-mono text-red-400 font-bold uppercase flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />
                  Flagged Imposter (Party A)
                </span>
                <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-700">
                  EVICTION TARGET
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px] block">Claimed Identity:</span>
                  <strong className="text-zinc-200">Robert Miller</strong>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Destination Payout (Burner PayPal):</span>
                  <strong className="text-red-400 font-mono break-all">
                    burner_payout_syndicate99@tempmail.io
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Network &amp; Device Footprint:</span>
                  <span className="text-zinc-300 font-mono text-[11px]">45.33.32.156 (Linode Cloud Datacenter)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Submission Duration:</span>
                  <span className="text-red-400 font-mono text-[11px]">1.2s (Headless Browser / Bot)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Sybil Verdict:</span>
                  <span className="text-red-400 font-semibold">SYNTHETIC HIJACK DETECTED</span>
                </div>
              </div>
            </div>

            {/* Authentic Appellant */}
            <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authentic Appellant (Party B)
                </span>
                <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                  GENUINE VICTIM
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px] block">Verified Legal Name:</span>
                  <strong className="text-zinc-200">Robert Miller</strong>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Verified Payout (Legitimate PayPal):</span>
                  <strong className="text-emerald-400 font-mono break-all">
                    robert.miller.real@gmail.com
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Network &amp; Device Footprint:</span>
                  <span className="text-zinc-300 font-mono text-[11px]">Residential Comcast Cable (San Jose, CA)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Biometric Liveness Proof:</span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    {activeDispute?.stepUpLivenessScore
                      ? `${(activeDispute.stepUpLivenessScore * 100).toFixed(1)}% Confidence (PASSED)`
                      : "Pending Step-Up Verification"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">Resolution Status:</span>
                  <span className="text-emerald-400 font-semibold">
                    {activeDispute?.status === "RESOLVED_APPELLANT_WON"
                      ? "OWNERSHIP RESTORED & BLACKLIST APPLIED"
                      : "HELD IN ESCROW (CIRCUIT BREAKER)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Adjudication Notes & Court Affidavit */}
          {activeDispute?.adjudicationNotes && (
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-zinc-200">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                FRCP Rule 23 Court Defense Record
              </div>
              <p className="text-zinc-400 leading-relaxed font-mono text-[11px]">
                {activeDispute.adjudicationNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DisputePage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-zinc-500">Loading Appeal Center...</div>}>
      <DisputeContent />
    </Suspense>
  );
}
