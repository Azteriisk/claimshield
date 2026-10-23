"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  DollarSign, 
  Calendar,
  Building,
  UserCheck,
  Send,
  RefreshCw
} from "lucide-react";

interface Settlement {
  id: string;
  caseName: string;
  defendant: string;
  administratorName: string;
  claimDeadline: string;
  estimatedBasePayout: number;
}

interface Claimant {
  id: string;
  uniquePersonHash: string;
  legalFirstName: string;
  legalLastName: string;
  dob: string;
  ssnLast4: string;
  kycStatus: "VERIFIED" | "PENDING" | "FROZEN_DISPUTE";
  lockedPayoutType: string;
  lockedPayoutAddress: string;
}

interface Alias {
  id: string;
  aliasType: "EMAIL" | "PHONE";
  aliasValue: string;
  isVerified: boolean;
}

interface Claim {
  id: string;
  settlementId: string;
  qualifyingAlias: string;
  payoutAddress: string;
  riskScore: number;
  status: string;
  submittedAt: string;
}

function VaultContent() {
  const searchParams = useSearchParams();
  const preSelectedSettlementId = searchParams.get("settlementId");

  // State
  const [claimantsList, setClaimantsList] = useState<Claimant[]>([]);
  const [activeClaimant, setActiveClaimant] = useState<Claimant | null>(null);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  // New Registration Form
  const [regForm, setRegForm] = useState({
    legalFirstName: "Robert",
    legalLastName: "Miller",
    dob: "1985-11-20",
    ssnLast4: "8899",
    payoutType: "PAYPAL",
    payoutAddress: "robert.miller.real@gmail.com",
    primaryEmail: "robert.miller.real@gmail.com"
  });
  const [regError, setRegError] = useState<{ message: string; code?: string; personHash?: string } | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Alias Form
  const [newAliasValue, setNewAliasValue] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [aliasSuccess, setAliasSuccess] = useState<string | null>(null);

  // Claim status message
  const [claimFeedback, setClaimFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [settlementsRes, claimantsRes] = await Promise.all([
        fetch("/api/settlements"),
        fetch("/api/claimants")
      ]);
      const sData = await settlementsRes.json();
      const cData = await claimantsRes.json();

      setSettlements(sData.settlements || []);
      setClaimantsList(cData.claimants || []);

      // Default to Jane Doe demo if available
      const jane = cData.claimants.find((c: Claimant) => c.legalFirstName === "Jane");
      if (jane) {
        await switchClaimant(jane.id);
      }
    } catch (err) {
      console.error("Failed to load vault data", err);
    } finally {
      setLoading(false);
    }
  };

  const switchClaimant = async (id: string) => {
    try {
      const res = await fetch(`/api/claimants?id=${id}`);
      const data = await res.json();
      setActiveClaimant(data.claimant);
      setAliases(data.aliases || []);
      setClaims(data.claims || []);
      setClaimFeedback(null);
      setRegError(null);
      setRegSuccess(null);
    } catch (err) {
      console.error("Failed to fetch claimant details", err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    try {
      const res = await fetch("/api/claimants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setRegError({
          message: data.message || "Registration failed",
          code: data.code,
          personHash: data.contestedPersonHash
        });
      } else {
        setRegSuccess("Identity successfully anchored and verified!");
        // Refresh claimants list
        const cRes = await fetch("/api/claimants");
        const cData = await cRes.json();
        setClaimantsList(cData.claimants);
        if (data.claimant) {
          switchClaimant(data.claimant.id);
        }
      }
    } catch {
      setRegError({ message: "Network error during identity verification" });
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaimant || !newAliasValue.trim()) return;

    setAliasError(null);
    setAliasSuccess(null);

    try {
      const res = await fetch("/api/claimants/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimantId: activeClaimant.id,
          aliasType: newAliasValue.includes("@") ? "EMAIL" : "PHONE",
          aliasValue: newAliasValue.trim()
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setAliasError(data.error || "Failed to bind alias");
      } else {
        setAliasSuccess(data.message);
        setNewAliasValue("");
        setAliases(prev => [...prev, data.alias]);
      }
    } catch {
      setAliasError("Failed to bind alias");
    }
  };

  const handleSubmitClaim = async (settlementId: string) => {
    if (!activeClaimant) return;
    setClaimFeedback(null);

    try {
      const res = await fetch("/api/claims/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId,
          claimantId: activeClaimant.id,
          qualifyingAlias: aliases[0]?.aliasValue || activeClaimant.lockedPayoutAddress,
          payoutAddress: activeClaimant.lockedPayoutAddress
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setClaimFeedback({
          id: settlementId,
          success: false,
          message: data.message || data.error || "Claim submission failed"
        });
      } else {
        setClaimFeedback({
          id: settlementId,
          success: true,
          message: "Claim lodged and pre-cleared with zero fraud flags!"
        });
        setClaims(prev => [data.claim, ...prev]);
      }
    } catch {
      setClaimFeedback({
        id: settlementId,
        success: false,
        message: "Network error submitting claim"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-zinc-500">Loading Claimant Identity Vault...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Demo Persona Switcher Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold block">
            Demo Persona Switcher
          </span>
          <p className="text-zinc-200 text-xs mt-0.5">
            Test the strict 1:1 identity protocol as a clean user, an impersonated victim, or register a new identity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {claimantsList.map(c => (
            <button
              key={c.id}
              onClick={() => switchClaimant(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeClaimant?.id === c.id
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {c.legalFirstName} {c.legalLastName}
              {c.kycStatus === "FROZEN_DISPUTE" && (
                <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.2 rounded border border-red-800">
                  FROZEN
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => {
              setActiveClaimant(null);
              setRegError(null);
              setRegSuccess(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeClaimant === null
                ? "bg-cyan-500 text-zinc-950"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + New Identity Test
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Identity Anchor & Locked Payout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {activeClaimant ? (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[11px] font-mono uppercase font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    1:1 Cryptographic Anchor Active
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">
                    {activeClaimant.legalFirstName} {activeClaimant.legalLastName}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    SSN: ***-**-{activeClaimant.ssnLast4} &bull; DOB: {activeClaimant.dob}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Status Warning if Frozen */}
              {activeClaimant.kycStatus === "FROZEN_DISPUTE" && (
                <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    ⚡ ACCOUNT FROZEN (DISPUTE IN PROGRESS)
                  </div>
                  <p className="leading-relaxed">
                    An appeal was filed contesting ownership of this identity. All settlement payouts are currently held in escrow.
                  </p>
                  <Link
                    href="/dispute"
                    className="inline-flex items-center gap-1 font-semibold text-red-300 underline hover:text-red-100"
                  >
                    View Appeal &amp; Step-Up Verification &rarr;
                  </Link>
                </div>
              )}

              {/* Locked Payout Card */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Locked Payout Destination:</span>
                  <span className="font-mono text-[10px] text-emerald-400 uppercase">
                    KYC Matched &bull; Anti-Hijack
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-sm text-zinc-100">
                  <span>{activeClaimant.lockedPayoutType}:</span>
                  <strong className="text-emerald-400">{activeClaimant.lockedPayoutAddress}</strong>
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  No other account can bind this payout handle. Claims automatically route exclusively to this address.
                </p>
              </div>

              {/* Multi-Alias Manager */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    Breached Email / Phone Aliases
                  </h4>
                  <span className="text-[11px] text-zinc-500">{aliases.length} Verified</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Link secondary emails (college, work, legacy accounts) to capture all settlements matching your history under your single legal anchor.
                </p>

                <div className="space-y-2">
                  {aliases.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-zinc-200 font-mono">{a.aliasValue}</span>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase">Verified</span>
                    </div>
                  ))}
                </div>

                {/* Add Alias Form */}
                <form onSubmit={handleAddAlias} className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add secondary email (e.g. work@corp.com)..."
                      value={newAliasValue}
                      onChange={(e) => setNewAliasValue(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add &amp; OTP
                    </button>
                  </div>
                  {aliasError && <p className="text-[11px] text-red-400 font-semibold">{aliasError}</p>}
                  {aliasSuccess && <p className="text-[11px] text-emerald-400 font-semibold">{aliasSuccess}</p>}
                </form>
              </div>
            </div>
          ) : (
            /* New Identity Registration & Conflict Test Form */
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white">1:1 Identity Anchoring</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enforces Sybil-resistance: Exactly 1 account per human. Test collision detection below!
                </p>
              </div>

              {/* Conflict Alert Box if Collision Triggered */}
              {regError?.code === "IDENTITY_COLLISION" && (
                <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    IDENTITY COLLISION DETECTED
                  </div>
                  <p className="leading-relaxed">
                    {regError.message}
                  </p>
                  <Link
                    href={`/dispute?hash=${regError.personHash}&name=${encodeURIComponent(
                      `${regForm.legalFirstName} ${regForm.legalLastName}`
                    )}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-md shadow-red-900/50"
                  >
                    ⚡ Contest &amp; File Identity Appeal (Trip Circuit Breaker)
                  </Link>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Legal First Name</label>
                    <input
                      type="text"
                      value={regForm.legalFirstName}
                      onChange={(e) => setRegForm({ ...regForm, legalFirstName: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Legal Last Name</label>
                    <input
                      type="text"
                      value={regForm.legalLastName}
                      onChange={(e) => setRegForm({ ...regForm, legalLastName: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">SSN (Last 4 Only)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={regForm.ssnLast4}
                      onChange={(e) => setRegForm({ ...regForm, ssnLast4: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Locked Payout Destination (PayPal Email)</label>
                  <input
                    type="email"
                    value={regForm.payoutAddress}
                    onChange={(e) => setRegForm({ ...regForm, payoutAddress: e.target.value })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Must match KYC legal name. Locked to 1 account permanently.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                  Verify &amp; Anchor Identity
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Active Settlements & 1-Click Filing (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Your Eligible Settlements</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pre-matched to your verified aliases. Guaranteed strictly 1 claim per settlement.
              </p>
            </div>
            <button
              onClick={loadInitialData}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {settlements.map(s => {
              const existingClaim = claims.find(c => c.settlementId === s.id);
              const isPreSelected = preSelectedSettlementId === s.id;

              return (
                <div
                  key={s.id}
                  className={`bg-zinc-900/70 border rounded-2xl p-5 space-y-4 transition ${
                    isPreSelected
                      ? "border-emerald-500/70 shadow-lg shadow-emerald-500/10"
                      : "border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{s.caseName}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Defendant: {s.defendant}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-emerald-400 font-bold text-base flex items-center justify-end">
                        <DollarSign className="w-4 h-4 -mr-1" />
                        ~{s.estimatedBasePayout.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">Est. Base Cash</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        Deadline: <strong className="text-zinc-200">{s.claimDeadline}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-zinc-500" />
                        Admin: {s.administratorName}
                      </span>
                    </div>

                    {existingClaim ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Claim Lodged ({existingClaim.status})
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubmitClaim(s.id)}
                        disabled={!activeClaimant || activeClaimant.kycStatus === "FROZEN_DISPUTE"}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                      >
                        <Send className="w-3.5 h-3.5" />
                        1-Click File Claim
                      </button>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {claimFeedback?.id === s.id && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        claimFeedback.success
                          ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                          : "bg-red-950/80 border border-red-800 text-red-300"
                      }`}
                    >
                      {claimFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{claimFeedback.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-zinc-500">Loading Claimant Identity Vault...</div>}>
      <VaultContent />
    </Suspense>
  );
}
