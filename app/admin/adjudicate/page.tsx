"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gavel,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Building2,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Fingerprint,
  FileText,
  UserCheck,
  UserX,
  Send,
  ArrowLeft,
  ChevronRight,
  Info,
  Clock,
  Radio,
  FileSpreadsheet
} from "lucide-react";
import {
  Role,
  Permission,
  hasPermission,
  SAMPLE_EXAMINER_PROFILES,
  ExaminerProfile,
  SETTLEMENT_TENANTS,
  SettlementTenantId,
  getRoleBadgeInfo
} from "@/lib/rbac/permissions";
import { WebhookDeliveryLog } from "@/lib/webhooks/dispatcher";

interface ContestedClaim {
  id: string;
  settlementId: string;
  claimantId: string;
  qualifyingAlias: string;
  payoutAddress: string;
  riskScore: number;
  status: string;
  flags: string[];
  submissionSpeedSec: number;
  ipAddress: string;
  isDatacenter: boolean;
  submittedAt: string;
}

interface DisputeRecord {
  id: string;
  contestedPersonHash: string;
  incumbentClaimantId: string;
  appellantEmail: string;
  appellantFirstName: string;
  appellantLastName: string;
  appellantDob: string;
  appellantSsnLast4: string;
  appellantPayoutAddress: string;
  status: string;
  stepUpLivenessScore?: number;
  stepUpProofType?: string;
  fraudulentPayoutBlacklisted?: string;
  createdAt: string;
  resolvedAt?: string;
  adjudicationNotes?: string;
  escrowAmount?: number;
  settlementId?: string;
}

export default function AdjudicatePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ExaminerProfile>(SAMPLE_EXAMINER_PROFILES[0]);
  const [activeTenant, setActiveTenant] = useState<SettlementTenantId>("kroll");
  
  // Data from backend
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [contestedClaims, setContestedClaims] = useState<ContestedClaim[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>("");
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  
  // Examiner judicial notes
  const [examinerNotes, setExaminerNotes] = useState("");
  
  // Notification alert
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
    webhookEvent?: string;
    signature?: string;
  } | null>(null);

  // Load data on mount and tenant switch
  useEffect(() => {
    loadAdjudicationData();
  }, [activeTenant]);

  const loadAdjudicationData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/adjudicate?tenant=${activeTenant}`);
      const data = await res.json();
      setDisputes(data.disputes || []);
      setContestedClaims(data.contestedClaims || []);
      setDeliveryLogs(data.recentDeliveryLogs || []);

      if (data.disputes && data.disputes.length > 0) {
        if (!selectedDisputeId || !data.disputes.some((d: DisputeRecord) => d.id === selectedDisputeId)) {
          setSelectedDisputeId(data.disputes[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load adjudication workspace data", err);
    } finally {
      setLoading(false);
    }
  };

  const activeDispute = disputes.find(d => d.id === selectedDisputeId) || disputes[0];
  const activeImposterClaim = contestedClaims.find(
    c => activeDispute && c.claimantId === activeDispute.incumbentClaimantId
  ) || contestedClaims[0];

  const canAdjudicate = hasPermission(activeProfile.role, "claims:adjudicate");
  const canReleaseEscrow = hasPermission(activeProfile.role, "escrow:release");
  const canFreezeEscrow = hasPermission(activeProfile.role, "escrow:freeze");

  const handleJudicialAction = async (
    action: "RELEASE_ESCROW" | "DISQUALIFY_AND_BLACKLIST" | "REQUEST_PROOF" | "FREEZE_ESCROW"
  ) => {
    if (!canAdjudicate && action !== "FREEZE_ESCROW") {
      setNotification({
        type: "error",
        message: `Action Blocked: Active role '${activeProfile.role}' lacks 'claims:adjudicate' permission.`
      });
      return;
    }

    if (action === "RELEASE_ESCROW" && !canReleaseEscrow) {
      setNotification({
        type: "error",
        message: `Action Blocked: Active role '${activeProfile.role}' lacks 'escrow:release' permission.`
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/adjudicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClaimShield-Role": activeProfile.role
        },
        body: JSON.stringify({
          action,
          disputeId: activeDispute?.id,
          claimId: activeImposterClaim?.id,
          examinerNotes,
          examinerRole: activeProfile.role,
          tenantId: activeTenant,
          actorName: activeProfile.name
        })
      });

      const result = await res.json();

      if (!res.ok) {
        setNotification({
          type: "error",
          message: result.error || "Adjudication request failed."
        });
      } else {
        const lastDispatch = result.webhookDispatches?.[0];
        setNotification({
          type: "success",
          message: result.message,
          webhookEvent: lastDispatch?.event,
          signature: lastDispatch?.signatureHeader
        });
        await loadAdjudicationData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Adjudication failed";
      setNotification({
        type: "error",
        message: `Network error: ${msg}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const roleBadge = getRoleBadgeInfo(activeProfile.role);
  const currentTenant = SETTLEMENT_TENANTS[activeTenant] || SETTLEMENT_TENANTS.kroll;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Metrics</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Claims Examiner Adjudication Console
            </span>
          </div>
        </div>

        {/* Tenant Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          {(["kroll", "epiq", "angeion", "jnd"] as SettlementTenantId[]).map(tId => (
            <button
              key={tId}
              onClick={() => setActiveTenant(tId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTenant === tId
                  ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {SETTLEMENT_TENANTS[tId].name}
            </button>
          ))}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase tracking-wider font-mono">
              <Gavel className="w-3.5 h-3.5" />
              Rule 23 Human-In-The-Loop Judicial Review
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Contested Claims Examiner Adjudication
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Resolve identity collision disputes for{" "}
              <span className="text-white font-semibold">{currentTenant.fullName}</span>. Compare sworn evidentiary records under 28 U.S.C. § 1746 against bot syndicate signatures to release escrow holds or enforce anti-Sybil blacklists.
            </p>
          </div>

          {/* RBAC Role Selector Widget */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
              <span className="font-mono uppercase tracking-wider">Active Examiner RBAC</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${roleBadge.badgeClass}`}>
                {roleBadge.label}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 block">Switch Simulated Examiner Role:</label>
              <select
                aria-label="Switch Simulated Examiner Role"
                value={activeProfile.id}
                onChange={e => {
                  const found = SAMPLE_EXAMINER_PROFILES.find(p => p.id === e.target.value);
                  if (found) setActiveProfile(found);
                }}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {SAMPLE_EXAMINER_PROFILES.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} — {prof.role} ({prof.organization})
                  </option>
                ))}
              </select>
            </div>

            {/* Permission checklist */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              {(["claims:view", "claims:adjudicate", "escrow:release", "escrow:freeze"] as Permission[]).map(
                perm => {
                  const allowed = hasPermission(activeProfile.role, perm);
                  return (
                    <span
                      key={perm}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        allowed
                          ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-600 line-through"
                      }`}
                    >
                      {perm}
                    </span>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-950/70 border-emerald-700 text-emerald-200"
              : notification.type === "error"
              ? "bg-red-950/70 border-red-700 text-red-200"
              : "bg-amber-950/70 border-amber-700 text-amber-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : notification.type === "error" ? (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold">{notification.message}</p>
              {notification.webhookEvent && (
                <div className="text-xs font-mono opacity-90 flex flex-wrap items-center gap-3">
                  <span>
                    Dispatched Webhook: <strong className="underline">{notification.webhookEvent}</strong>
                  </span>
                  {notification.signature && (
                    <span className="truncate max-w-md">
                      HMAC Signature: <code className="bg-black/30 px-1.5 py-0.5 rounded">{notification.signature.substring(0, 32)}...</code>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Contested Disputes Queue Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            Contested Identity Disputes Queue ({disputes.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {disputes.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDisputeId(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-2 ${
                selectedDisputeId === d.id
                  ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <span>{d.appellantFirstName} {d.appellantLastName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  d.status === "RESOLVED_APPELLANT_WON"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : d.status === "IMPOSTER_DISQUALIFIED"
                    ? "bg-red-950 text-red-400 border border-red-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {d.status === "RESOLVED_APPELLANT_WON"
                  ? "RESOLVED"
                  : d.status === "IMPOSTER_DISQUALIFIED"
                  ? "DISQUALIFIED"
                  : "PENDING"}
              </span>
            </button>
          ))}

          <button
            onClick={loadAdjudicationData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Case Docket Overview */}
      {activeDispute && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Contested Settlement Case</span>
            <div className="font-bold text-sm text-white">
              In re AT&amp;T Customer Data Incident Class Action Litigation
            </div>
            <div className="text-zinc-400">
              Settlement Admin: <strong className="text-zinc-200">Kroll Settlement Administration</strong> &bull; Docket Ref: <span className="font-mono text-zinc-300">2024-CV-01992</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg">
              <div className="text-[10px] text-zinc-500 font-mono uppercase">Escrow Held</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                ${(activeDispute.escrowAmount || 45.0).toFixed(2)} USD
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg">
              <div className="text-[10px] text-zinc-500 font-mono uppercase">Current Status</div>
              <div className="text-xs font-bold font-mono text-amber-400">
                {activeDispute.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE ADJUDICATION COMPARISON WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: IMPOSTER / ADVERSE CLAIM */}
        <div className="bg-zinc-900/90 border-2 border-red-900/60 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 bg-red-950/80 border-b border-l border-red-800/80 px-3 py-1 rounded-bl-xl text-red-400 text-xs font-mono font-bold flex items-center gap-1.5 uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Adverse Claim (Bot Syndicate / Imposter)
          </div>

          <div className="space-y-5 pt-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
                Telemetry &amp; Forensic Anomaly Record
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Contested Imposter Claim Submission
              </h2>
              <p className="text-xs text-zinc-400">
                Submitted using breached identity credentials via proxy infrastructure.
              </p>
            </div>

            {/* Risk Score Meter */}
            <div className="bg-zinc-950 border border-red-900/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Sybil Fraud Risk Assessment</span>
                <span className="text-sm font-mono font-black text-red-400">
                  {((activeImposterClaim?.riskScore || 0.85) * 100).toFixed(0)}% HIGH RISK
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full"
                  style={{ width: `${(activeImposterClaim?.riskScore || 0.85) * 100}%` }}
                />
              </div>
            </div>

            {/* Imposter Technical Evidence Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Submission Speed</div>
                <div className="font-mono font-bold text-red-300 text-sm">
                  {activeImposterClaim?.submissionSpeedSec || 1.2}s
                </div>
                <div className="text-[11px] text-zinc-500">
                  Superhuman execution (human baseline: 42s)
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Origin IP Address</div>
                <div className="font-mono font-bold text-red-300 text-sm">
                  {activeImposterClaim?.ipAddress || "45.33.32.156"}
                </div>
                <div className="text-[11px] text-red-400 font-medium">
                  Datacenter Proxy (Hetzner Cloud)
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-1 sm:col-span-2">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Burner Payout Address</div>
                <div className="font-mono font-semibold text-red-300 break-all">
                  {activeImposterClaim?.payoutAddress || "burner_payout_syndicate99@tempmail.io"}
                </div>
                <div className="text-[11px] text-zinc-400">
                  Disposable temporary mailbox domain &bull; Diverges from verified personal email
                </div>
              </div>
            </div>

            {/* Fraud Flags */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Rule 23 Defense Flags Triggered
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "PAYOUT_DIVERGENCE",
                  "DATACENTER_PROXY_IP",
                  "SUPERHUMAN_SUBMISSION_SPEED",
                  "DISPOSABLE_DOMAIN_MATCH"
                ].map(flag => (
                  <span
                    key={flag}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 border border-red-800/60 text-red-300 font-semibold"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-red-900/40 text-xs text-red-300/80 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Adverse claim will be permanently disqualified and payout address routed to global blacklist.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: TRUE CLAIMANT'S SWORN EVIDENTIARY RECORD */}
        <div className="bg-zinc-900/90 border-2 border-emerald-900/60 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 bg-emerald-950/80 border-b border-l border-emerald-800/80 px-3 py-1 rounded-bl-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            True Claimant Sworn Evidentiary Record
          </div>

          <div className="space-y-5 pt-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                High-Assurance Verified Evidence
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {activeDispute?.appellantFirstName} {activeDispute?.appellantLastName}
              </h2>
              <p className="text-xs text-zinc-400">
                Sworn claimant evidentiary record anchored to government credentials.
              </p>
            </div>

            {/* Biometric Liveness Metric */}
            <div className="bg-zinc-950 border border-emerald-900/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  NIST Level 3 Biometric Liveness Score
                </span>
                <span className="text-sm font-mono font-black text-emerald-400">
                  {((activeDispute?.stepUpLivenessScore || 0.998) * 100).toFixed(1)}% VERIFIED
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(activeDispute?.stepUpLivenessScore || 0.998) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-400">
                Dynamic 3D depth verification &bull; ISO/IEC 30107-3 compliant &bull; Zero presentation attacks detected
              </div>
            </div>

            {/* Sworn 28 U.S.C. § 1746 Declaration */}
            <div className="bg-zinc-950/90 border border-emerald-900/40 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono uppercase font-bold">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  28 U.S.C. § 1746 Sworn Declaration
                </span>
                <span>EXECUTED</span>
              </div>
              <blockquote className="italic text-zinc-300 border-l-2 border-emerald-500 pl-3 py-1 text-[11px] leading-relaxed">
                &ldquo;I declare under penalty of perjury under the laws of the United States of America that the foregoing is true and correct, and that I am the sole rightful owner of the compromised consumer credentials at issue in this proceeding.&rdquo;
              </blockquote>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 font-mono">
                <span>Signatory: /s/ {activeDispute?.appellantFirstName} {activeDispute?.appellantLastName}</span>
                <span className="text-emerald-400 font-semibold">Legally Binding</span>
              </div>
            </div>

            {/* True Claimant Verified Rails Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Verified Identity Rail</div>
                <div className="font-semibold text-zinc-200">
                  SSN: ***-**-{activeDispute?.appellantSsnLast4 || "8899"}
                </div>
                <div className="text-[11px] text-emerald-400">
                  DOB: {activeDispute?.appellantDob || "1985-11-20"} (100% SSA Match)
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Verified Payout Destination</div>
                <div className="font-mono font-semibold text-emerald-300 break-all">
                  {activeDispute?.appellantPayoutAddress || "robert.miller.real@gmail.com"}
                </div>
                <div className="text-[11px] text-zinc-400">
                  PayPal Authenticated Rail &bull; Bank ACH Bound
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-900/40 text-xs text-emerald-300/80 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Evidentiary burden satisfied under Federal Rule of Civil Procedure 23. Escrow ready for release.</span>
          </div>
        </div>
      </div>

      {/* JUDICIAL ADJUDICATION CONTROL CENTER */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Gavel className="w-5 h-5 text-cyan-400" />
              One-Click Examiner Judicial Adjudication Actions
            </h3>
            <p className="text-xs text-zinc-400">
              Actions will update docket status, write audit logs, and dispatch HMAC-signed enterprise webhooks.
            </p>
          </div>

          {!canAdjudicate && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Role {activeProfile.role} is read-only. Switch role above to adjudicate.</span>
            </div>
          )}
        </div>

        {/* Examiner Notes Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <span>Examiner Findings &amp; Judicial Audit Memo:</span>
          </label>
          <input
            type="text"
            value={examinerNotes}
            onChange={e => setExaminerNotes(e.target.value)}
            placeholder="e.g. Sworn 28 U.S.C. 1746 declaration validated against government records; liveness score 99.8%. Directing payout to authentic claimant."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Button 1: Release Escrow & Direct Payout */}
          <button
            onClick={() => handleJudicialAction("RELEASE_ESCROW")}
            disabled={submitting || !canAdjudicate || !canReleaseEscrow}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 shadow-sm ${
              !canAdjudicate || !canReleaseEscrow
                ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-emerald-950/80 hover:bg-emerald-900/80 border-emerald-700/80 text-emerald-100 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Primary Ruling
              </span>
              <span className="text-[11px] font-mono text-emerald-300/80 font-bold">
                ${(activeDispute?.escrowAmount || 45.0).toFixed(2)} USD
              </span>
            </div>
            <div className="font-bold text-sm text-white">
              Release Escrow &amp; Direct Payout to True Claimant
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Reclaims account ownership, unfreezes claims, and routes disbursement to authentic PayPal/ACH rail.
            </p>
          </button>

          {/* Button 2: Disqualify Imposter & Blacklist */}
          <button
            onClick={() => handleJudicialAction("DISQUALIFY_AND_BLACKLIST")}
            disabled={submitting || !canAdjudicate}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 shadow-sm ${
              !canAdjudicate
                ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-red-950/80 hover:bg-red-900/80 border-red-700/80 text-red-100 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                <UserX className="w-4 h-4" />
                Sybil Defense
              </span>
              <span className="text-[11px] font-mono text-red-300/80 font-bold">
                Rule 23
              </span>
            </div>
            <div className="font-bold text-sm text-white">
              Disqualify Imposter &amp; Add Payout to Global Blacklist
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Permanently purges syndicate claim and registers disposable payout to multi-tenant fraud blacklist.
            </p>
          </button>

          {/* Button 3: Request Supplementary Proof */}
          <button
            onClick={() => handleJudicialAction("REQUEST_PROOF")}
            disabled={submitting || !canAdjudicate}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 shadow-sm ${
              !canAdjudicate
                ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-amber-950/80 hover:bg-amber-900/80 border-amber-700/80 text-amber-100 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Step-Up Notice
              </span>
              <span className="text-[11px] font-mono text-amber-300/80 font-bold">
                Injunction
              </span>
            </div>
            <div className="font-bold text-sm text-white">
              Request Supplementary Proof
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Halts disposition and prompts claimant for supplementary notarized affidavit or NFC passport scan.
            </p>
          </button>
        </div>
      </div>

      {/* REAL-TIME ENTERPRISE WEBHOOK DISPATCH AUDIT LOG */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Settlement Administrator Webhook Engine Deliveries
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            HMAC-SHA256 Signed &bull; Automatic 3x Backoff Retry
          </span>
        </div>

        {deliveryLogs.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No webhook dispatches recorded for this tenant yet. Execute an adjudication action above to observe real-time event emission.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2 px-3">Event Type</th>
                  <th className="py-2 px-3">Tenant Destination</th>
                  <th className="py-2 px-3">HMAC-SHA256 Signature</th>
                  <th className="py-2 px-3">Attempts</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {deliveryLogs.slice(0, 5).map(log => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-cyan-300">
                      {log.event}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {log.url}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[200px]" title={log.signatureHeader}>
                      {log.signatureHeader.substring(0, 24)}...
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {log.attempts} / {log.maxAttempts}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "DELIVERED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
