"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  DollarSign, 
  Download, 
  RefreshCw, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Activity, 
  Server,
  Lock,
  Bot,
  Scale
} from "lucide-react";

interface Metrics {
  totalClaims: number;
  verifiedCleanClaims: number;
  flaggedBots: number;
  frozenDisputes: number;
  botRejectionRate: string;
  estimatedFraudPrevented: string;
  activeSettlementsCount: number;
  registeredClaimantsCount: number;
}

interface Claim {
  id: string;
  settlementId: string;
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

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Simulator Form for Administrator API Testing
  const [simForm, setSimForm] = useState({
    settlementId: "sett-tm-2024",
    claimantName: "Anonymous Bot Syndicate",
    email: "bot_harvest42@darkwebdump.net",
    payoutAddress: "burner_wire_drop99@tempmail.io",
    ipAddress: "198.51.100.22",
    isDatacenter: true,
    submissionSpeedSec: 1.1
  });
  const [simResult, setSimResult] = useState<{
    riskScore: number;
    verdict: string;
    flags: string[];
    antiSybilPassed: boolean;
    auditToken: string;
  } | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [botWaveLoading, setBotWaveLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      const data = await res.json();
      setMetrics(data.metrics);
      setClaims(data.recentClaims || []);
    } catch (err) {
      console.error("Failed to load admin metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateBotWave = async () => {
    setBotWaveLoading(true);
    try {
      await fetch("/api/admin/simulate-bot-wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 20 })
      });
      await loadMetrics();
    } catch (err) {
      console.error("Bot wave simulation failed", err);
    } finally {
      setBotWaveLoading(false);
    }
  };

  const handleSimulateInboundClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);

    try {
      const res = await fetch("/api/claims/evaluate-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simForm)
      });
      const data = await res.json();
      setSimResult(data);
      // Reload metrics to reflect updated state if relevant
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleDownloadRule23Csv = () => {
    if (claims.length === 0) return;

    const headers = [
      "Claim ID",
      "Settlement ID",
      "Qualifying Alias",
      "Payout Address",
      "Risk Score",
      "Audit Status",
      "Speed (sec)",
      "Datacenter IP",
      "Flags",
      "Timestamp"
    ];

    const rows = claims.map(c => [
      c.id,
      c.settlementId,
      c.qualifyingAlias,
      c.payoutAddress,
      c.riskScore.toFixed(2),
      c.status,
      c.submissionSpeedSec.toFixed(1),
      c.isDatacenter ? "YES" : "NO",
      `"${c.flags.join(", ")}"`,
      c.submittedAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rule23_Fraud_Defense_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center py-24 text-zinc-500">Loading Enterprise Trust Suite...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-28 md:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold tracking-wide uppercase font-mono">
            <Building2 className="w-3.5 h-3.5" />
            Class Action Settlement Administration Portal
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-2">
            Settlement Trust &amp; Anti-Fraud Suite
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Real-time Sybil detection, bot eradication, and court-admissible Rule 23 verification for claims administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateBotWave}
            disabled={botWaveLoading}
            className="px-3.5 py-2.5 bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Injects 20 synthetic Sybil bot claims across federal dockets to showcase real-time Rule 23 quarantine."
          >
            <Bot className={`w-3.5 h-3.5 ${botWaveLoading ? "animate-spin" : "text-red-400"}`} />
            <span>{botWaveLoading ? "Injecting Attack..." : "Simulate 20-Claim Bot Wave"}</span>
          </button>

          <Link
            href="/admin/adjudicate"
            className="px-3.5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/80 text-cyan-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Adjudication Console</span>
          </Link>
          <button
            onClick={loadMetrics}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Feeds</span>
          </button>
          <button
            onClick={handleDownloadRule23Csv}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export Rule 23 Audit (CSV)
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Claims Screened</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{metrics?.totalClaims || 0}</div>
          <div className="text-[11px] text-zinc-500">Across 4 active federal dockets</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Bot Rejection Rate</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400">{metrics?.botRejectionRate || "0%"}</div>
          <div className="text-[11px] text-zinc-500">{metrics?.flaggedBots || 0} synthetic filings blocked</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Fraud Dilution Prevented</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{metrics?.estimatedFraudPrevented || "$0"}</div>
          <div className="text-[11px] text-zinc-500">Preserved in settlement escrow</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Frozen in Dispute</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{metrics?.frozenDisputes || 0}</div>
          <div className="text-[11px] text-zinc-500">Judicial holds under circuit breaker</div>
        </div>
      </div>

      {/* Main Grid: Interactive API Sandbox & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Claim Stream Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Live Claim Intake &amp; Verification Stream
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Real-time audit log</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Qualifying Alias</th>
                    <th className="px-4 py-3">Payout Destination</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {claims.map(c => {
                    let badge = (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    );
                    if (c.status === "FLAGGED_BOT" || c.status === "HIJACK_SUSPECT") {
                      badge = (
                        <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800 font-semibold text-[10px]">
                          <ShieldAlert className="w-3 h-3" /> BOT BLOCKED
                        </span>
                      );
                    } else if (c.status === "FROZEN_DISPUTE") {
                      badge = (
                        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 font-semibold text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> ESCROW FROZEN
                        </span>
                      );
                    }

                    return (
                      <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                        <td className="px-4 py-3">{badge}</td>
                        <td className="px-4 py-3 font-mono text-zinc-300 max-w-[150px] truncate">
                          {c.qualifyingAlias}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-300 max-w-[150px] truncate">
                          {c.payoutAddress}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span
                            className={
                              c.riskScore >= 0.6
                                ? "text-red-400 font-bold"
                                : c.riskScore >= 0.35
                                ? "text-amber-400 font-bold"
                                : "text-emerald-400 font-bold"
                            }
                          >
                            {(c.riskScore * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-400">
                          {c.submissionSpeedSec.toFixed(1)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Interactive Administrator API Sandbox (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              API Sandbox: Test Inbound Claim Scoring
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
              POST /v1/claims/evaluate-risk
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Simulate an administrator web portal receiving a claim. Watch ClaimShield detect headless browser speed, datacenter proxies, and payout divergences in real time.
            </p>

            <form onSubmit={handleSimulateInboundClaim} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                  Claimant Name Input
                </label>
                <input
                  type="text"
                  value={simForm.claimantName}
                  onChange={(e) => setSimForm({ ...simForm, claimantName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                  Breached Email Entered
                </label>
                <input
                  type="email"
                  value={simForm.email}
                  onChange={(e) => setSimForm({ ...simForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                  Requested Payout Handle (PayPal)
                </label>
                <input
                  type="text"
                  value={simForm.payoutAddress}
                  onChange={(e) => setSimForm({ ...simForm, payoutAddress: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                    Form Speed (Sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={simForm.submissionSpeedSec}
                    onChange={(e) => setSimForm({ ...simForm, submissionSpeedSec: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                    IP Source
                  </label>
                  <select
                    value={simForm.isDatacenter ? "datacenter" : "residential"}
                    onChange={(e) => setSimForm({ ...simForm, isDatacenter: e.target.value === "datacenter" })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                  >
                    <option value="datacenter">AWS / Proxy Datacenter</option>
                    <option value="residential">Residential Comcast IP</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                Run Pre-Clearance Heuristics
              </button>
            </form>

            {/* Simulation Result Payload */}
            {simResult && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Verdict:</span>
                  <span
                    className={`font-mono font-bold uppercase ${
                      simResult.verdict === "REJECT_BOT" ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {simResult.verdict}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-zinc-500">Calculated Risk Score:</span>
                  <span className="text-white font-bold">{(simResult.riskScore * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Triggered Heuristics:</span>
                  <div className="flex flex-wrap gap-1">
                    {simResult.flags.length > 0 ? (
                      simResult.flags.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-red-950/80 text-red-300 border border-red-800 px-1.5 py-0.5 rounded font-mono"
                        >
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono">None (Clean Human Submission)</span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono truncate">
                  Audit Token: {simResult.auditToken}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
