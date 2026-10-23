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
  RefreshCw,
  Mail,
  Shield,
  Layers,
  ChevronRight
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

  // Active Tab: 'claims' | 'identity' | 'aliases'
  const [activeTab, setActiveTab] = useState<"claims" | "identity" | "aliases">(
    preSelectedSettlementId ? "claims" : "claims"
  );

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

  // Claim feedback
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

      const jane = cData.claimants?.find((c: Claimant) => c.legalFirstName === "Jane");
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
      console.error("Failed to switch persona", err);
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
        const cRes = await fetch("/api/claimants");
        const cData = await cRes.json();
        setClaimantsList(cData.claimants || []);
        if (data.claimant) {
          switchClaimant(data.claimant.id);
          setActiveTab("claims");
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
          message: data.message || data.error || "Claim failed"
        });
      } else {
        setClaimFeedback({
          id: settlementId,
          success: true,
          message: "Claim lodged with zero fraud flags!"
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
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-sm">Loading Identity Vault...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 pb-28 md:pb-12">
      {/* Top Profile Summary Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/20 shrink-0">
              {activeClaimant ? `${activeClaimant.legalFirstName[0]}${activeClaimant.legalLastName[0]}` : "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {activeClaimant ? `${activeClaimant.legalFirstName} ${activeClaimant.legalLastName}` : "Unregistered Identity"}
                </h1>
                {activeClaimant?.kycStatus === "VERIFIED" && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                    1:1 Locked
                  </span>
                )}
                {activeClaimant?.kycStatus === "FROZEN_DISPUTE" && (
                  <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                    Escrow Frozen
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {activeClaimant 
                  ? `Payout Locked: ${activeClaimant.lockedPayoutAddress}`
                  : "Anchor your government identity below"}
              </p>
            </div>
          </div>

          {/* Persona Switcher Dropdown / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-2 sm:pt-0">
            {claimantsList.map(c => (
              <button
                key={c.id}
                onClick={() => switchClaimant(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  activeClaimant?.id === c.id
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {c.legalFirstName} {c.legalLastName}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveClaimant(null);
                setActiveTab("identity");
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                activeClaimant === null
                  ? "bg-cyan-500 text-slate-950 border-cyan-400"
                  : "bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800"
              }`}
            >
              + New Test
            </button>
          </div>
        </div>

        {/* Frozen Dispute Warning */}
        {activeClaimant?.kycStatus === "FROZEN_DISPUTE" && (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-200 font-bold block">Account Contested &bull; Payouts Frozen</strong>
                <span className="text-[11px] text-slate-300">
                  An appeal was lodged contesting this account. All settlement disbursements are quarantined in escrow.
                </span>
              </div>
            </div>
            <Link
              href="/dispute"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[11px] shrink-0"
            >
              Verify Step-Up &rarr;
            </Link>
          </div>
        )}

        {/* Mobile & Desktop Segmented Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("claims")}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "claims"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payouts ({settlements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("identity")}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "identity"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Identity Lock</span>
          </button>
          <button
            onClick={() => setActiveTab("aliases")}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "aliases"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Aliases ({aliases.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ELIGIBLE SETTLEMENTS & 1-CLICK FILING */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Your Eligible Settlement Payouts</h2>
              <p className="text-xs text-slate-400">Strictly 1 claim per settlement enforced automatically.</p>
            </div>
            <button
              onClick={loadInitialData}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {settlements.map(s => {
              const existingClaim = claims.find(c => c.settlementId === s.id);
              const isPreSelected = preSelectedSettlementId === s.id;

              return (
                <div
                  key={s.id}
                  className={`glass-card rounded-2xl p-5 transition space-y-3 ${
                    isPreSelected ? "border-emerald-500/60 glow-emerald" : "border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{s.caseName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Admin: {s.administratorName}</p>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-right shrink-0">
                      <div className="text-emerald-400 font-bold text-base flex items-center justify-end">
                        <DollarSign className="w-4 h-4 -mr-1" />
                        <span>{s.estimatedBasePayout.toFixed(2)}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono uppercase block">Base Cash</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Deadline: <strong className="text-slate-200">{s.claimDeadline}</strong>
                    </span>

                    {existingClaim ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Claim Lodged ({existingClaim.status})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSubmitClaim(s.id)}
                        disabled={!activeClaimant || activeClaimant.kycStatus === "FROZEN_DISPUTE"}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>1-Click File Claim</span>
                      </button>
                    )}
                  </div>

                  {claimFeedback?.id === s.id && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        claimFeedback.success
                          ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                          : "bg-red-950/40 border border-red-500/40 text-red-300"
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
      )}

      {/* TAB 2: IDENTITY LOCK & REGISTRATION */}
      {activeTab === "identity" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">1:1 Cryptographic Identity Lock</h2>
            <p className="text-xs text-slate-400">Strictly 1 account per human. Test collision rejection below.</p>
          </div>

          {/* Conflict Alert Box if Collision Triggered */}
          {regError?.code === "IDENTITY_COLLISION" && (
            <div className="p-5 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                IDENTITY COLLISION DETECTED
              </div>
              <p className="leading-relaxed">
                An active account is already registered with this exact government identity. If this wasn&apos;t you, an impersonator has hijacked your credentials to claim settlement money.
              </p>
              <Link
                href={`/dispute?hash=${regError.personHash}&name=${encodeURIComponent(
                  `${regForm.legalFirstName} ${regForm.legalLastName}`
                )}`}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/50"
              >
                ⚡ Contest &amp; Freeze Payouts (Trip Circuit Breaker)
              </Link>
            </div>
          )}

          {regSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-sm">
              {activeClaimant ? "Anchored Legal Identity Details" : "Anchor New Government Identity"}
            </h3>

            {activeClaimant ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/70 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Legal Name:</span>
                    <strong className="text-white text-sm">
                      {activeClaimant.legalFirstName} {activeClaimant.legalLastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">DOB / SSN:</span>
                    <span className="text-slate-300 font-mono">
                      {activeClaimant.dob} (***-**-{activeClaimant.ssnLast4})
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Locked Payout Handle:</span>
                  <div className="font-mono text-emerald-400 text-sm font-bold">
                    {activeClaimant.lockedPayoutType}: {activeClaimant.lockedPayoutAddress}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Settlement distributions automatically transfer strictly to this address.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Legal First Name</label>
                    <input
                      type="text"
                      value={regForm.legalFirstName}
                      onChange={(e) => setRegForm({ ...regForm, legalFirstName: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Legal Last Name</label>
                    <input
                      type="text"
                      value={regForm.legalLastName}
                      onChange={(e) => setRegForm({ ...regForm, legalLastName: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">SSN (Last 4)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={regForm.ssnLast4}
                      onChange={(e) => setRegForm({ ...regForm, ssnLast4: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Locked Payout PayPal Address</label>
                  <input
                    type="email"
                    value={regForm.payoutAddress}
                    onChange={(e) => setRegForm({ ...regForm, payoutAddress: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Verify &amp; Anchor Identity Lock
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BREACHED EMAIL & PHONE ALIASES */}
      {activeTab === "aliases" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Linked Breached Aliases</h2>
            <p className="text-xs text-slate-400">
              Bind old work or college emails to capture all settlements matching your history under your legal anchor.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="space-y-2">
              {aliases.map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-slate-200">{a.aliasValue}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Verified OTP</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddAlias} className="space-y-3 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-semibold text-slate-300 block">Add Breached Email or Mobile</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. old.work@company.com"
                  value={newAliasValue}
                  onChange={(e) => setNewAliasValue(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition shrink-0"
                >
                  Add &amp; OTP
                </button>
              </div>
              {aliasError && <p className="text-[11px] text-red-400 font-semibold">{aliasError}</p>}
              {aliasSuccess && <p className="text-[11px] text-emerald-400 font-semibold">{aliasSuccess}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-slate-500">Loading Claimant Identity Vault...</div>}>
      <VaultContent />
    </Suspense>
  );
}
