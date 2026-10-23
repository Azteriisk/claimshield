"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  ShieldAlert, 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

interface Settlement {
  id: string;
  caseName: string;
  defendant: string;
  claimDeadline: string;
  estimatedBasePayout: number;
  maxDocumentedLoss: number;
  administratorName: string;
  status: string;
  officialClaimUrl?: string;
}

interface Breach {
  id: string;
  entityName: string;
  domain: string;
  breachDate: string;
  exposedData: string[];
  description: string;
  settlement?: Settlement | null;
}

interface ScanReport {
  query: string;
  count: number;
  isClean: boolean;
  totalEstimatedPayout: number;
  hasHighRiskPii: boolean;
  scannedAt: string;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    // Initial load of national active settlements
    fetchBreachesDirect("", false);
  }, []);

  const fetchBreachesDirect = async (queryText: string, isUserScan: boolean) => {
    if (isUserScan) {
      setIsScanning(true);
      setScanStep("Querying dark web breach repositories...");

      // Step-by-step scanner animation for authentic feedback
      await new Promise(r => setTimeout(r, 400));
      setScanStep("Cross-referencing active federal court settlement dockets...");
      await new Promise(r => setTimeout(r, 450));
      setScanStep("Analyzing identity hijack vulnerability & unclaimed relief...");
      await new Promise(r => setTimeout(r, 350));
    }

    try {
      const res = await fetch(`/api/breaches?query=${encodeURIComponent(queryText)}`);
      const data = await res.json();
      setBreaches(data.breaches || []);

      if (isUserScan) {
        setScanReport({
          query: queryText,
          count: data.count,
          isClean: data.isClean,
          totalEstimatedPayout: data.totalEstimatedPayout || 0,
          hasHighRiskPii: data.hasHighRiskPii || false,
          scannedAt: data.scannedAt || new Date().toISOString()
        });
        setHasScanned(true);
      }
    } catch (err) {
      console.error("Failed to execute scan", err);
    } finally {
      setIsScanning(false);
      setScanStep("");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchBreachesDirect(searchQuery.trim(), true);
  };

  const runQuickTest = (sampleQuery: string) => {
    setSearchQuery(sampleQuery);
    fetchBreachesDirect(sampleQuery, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold tracking-wide uppercase font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          Real-Time Breach &amp; Settlement Exposure Engine
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Your Data Was Breached. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Don&apos;t Let Fraudsters Claim Your Payout.
          </span>
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg">
          Cybercrime rings use leaked PII to file class action claims and route payouts to burner PayPals.
          Scan your email to find court-approved money you are owed and lock your identity against theft.
        </p>

        {/* Interactive Search Bar */}
        <div className="max-w-xl mx-auto pt-2 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter email or breached entity (e.g. att, ticketmaster, 23andme)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Scan Now
                </>
              )}
            </button>
          </form>

          {/* Quick-Test Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400">
            <span className="text-[11px] text-zinc-500">Quick Test:</span>
            <button
              type="button"
              onClick={() => runQuickTest("robert.miller.breached@att.net")}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition"
            >
              robert.miller@att.net
            </button>
            <button
              type="button"
              onClick={() => runQuickTest("fan@ticketmaster-buyer.com")}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition"
            >
              fan@ticketmaster.com
            </button>
            <button
              type="button"
              onClick={() => runQuickTest("clean.user@secure.com")}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 font-mono text-[11px] transition"
            >
              clean.user@secure.com
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Scanning Progress Banner */}
      {isScanning && (
        <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 shadow-xl shadow-emerald-500/5 space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              INTELLIGENCE SCAN IN PROGRESS
            </span>
            <span>Target: {searchQuery}</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-3/4 animate-pulse rounded-full"></div>
          </div>
          <p className="text-xs text-zinc-300 font-mono text-center">{scanStep}</p>
        </div>
      )}

      {/* Scan Results Summary Card */}
      {!isScanning && hasScanned && scanReport && (
        <div className="max-w-3xl mx-auto transition-all duration-300">
          {scanReport.isClean ? (
            /* Clean Report */
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-emerald-500/50 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No Compromised Records Found</h3>
                  <p className="text-xs text-zinc-400 font-mono">Scanned Identifier: {scanReport.query}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Good news! We found 0 active data breaches or unclaimed class action funds tied to this email. You can still set up your 1:1 Identity Vault to protect your credentials from future settlement hijacking.
              </p>
              <div className="pt-2">
                <Link
                  href="/vault"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Anchor Your Identity in the Vault &rarr;
                </Link>
              </div>
            </div>
          ) : (
            /* Breaches & Payouts Found */
            <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/90 border border-emerald-500/70 shadow-2xl shadow-emerald-500/10 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Scan Completed &bull; Exposures Confirmed
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      Found {scanReport.count} Compromised Incidents
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Target: <span className="text-zinc-200">{scanReport.query}</span>
                    </p>
                  </div>
                </div>

                <div className="sm:text-right bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 shrink-0">
                  <div className="text-2xl font-black text-emerald-400 flex items-center sm:justify-end">
                    <DollarSign className="w-5 h-5 -mr-1" />
                    {scanReport.totalEstimatedPayout.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">
                    Unclaimed Base Relief
                  </span>
                </div>
              </div>

              {/* Risk Warning Box */}
              {scanReport.hasHighRiskPii ? (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-900/70 text-red-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-300 font-bold block">Critical Identity Hijack Risk Detected</strong>
                    <span className="text-[11px] text-zinc-300 leading-relaxed block mt-0.5">
                      Social Security numbers or sensitive financial data were exposed in these breaches. Fraud rings can use this info to claim these exact settlement payouts before you do.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eligible for direct cash distribution with zero proof-of-purchase required.</span>
                </div>
              )}

              {/* Immediate Vault Action CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-400">
                  Lock your legal name and payout destination to claim these funds safely:
                </span>
                <Link
                  href="/vault"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Lock className="w-4 h-4" />
                  Lock &amp; Claim in Vault
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust & Fraud Explainer Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 text-sm">
        <div className="flex gap-3 items-start">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/50 text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200">The Settlement Hijack Problem</h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              When companies settle, bot rings use dark web breach data to mass-submit claims using victims&apos; names and burner accounts.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200">1:1 Cryptographic Lock</h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              We anchor exactly one verified account per real human. Your payout is bound to your legal name so no imposter can divert it.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200">Court-Admissible Trust</h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Settlement administrators trust ClaimShield because every claim is verified authentic, preventing pot dilution for genuine victims.
            </p>
          </div>
        </div>
      </div>

      {/* Active Settlements & Breaches Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {hasScanned ? "Your Matched Settlements" : "Active Data Breach Settlements"}
            </h2>
            <p className="text-zinc-400 text-sm">
              {hasScanned
                ? `Showing incidents matching "${searchQuery}" with active claim windows.`
                : "Monetize your exposure losses before official court deadlines close."}
            </p>
          </div>
          <Link
            href="/vault"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
          >
            Manage Your Vault
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {breaches.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl text-zinc-400">
            No active breaches found matching &ldquo;{searchQuery}&rdquo;. Try clicking one of the Quick Test suggestions above!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {breaches.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 transition flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                        {item.domain}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2">{item.entityName}</h3>
                      <p className="text-xs text-zinc-400 mt-1">Incident Disclosed: {item.breachDate}</p>
                    </div>
                    {item.settlement && (
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 text-emerald-400 font-bold text-lg">
                          <DollarSign className="w-4 h-4 -mr-1" />
                          <span>~{item.settlement.estimatedBasePayout.toFixed(2)}</span>
                        </div>
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                          Est. Base Cash
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-zinc-300 text-xs mt-3 leading-relaxed">{item.description}</p>

                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">Compromised PII:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.exposedData.map((d, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700/50"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {item.settlement ? (
                  <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Deadline: <strong className="text-zinc-200">{item.settlement.claimDeadline}</strong></span>
                      </div>
                      <span className="text-[11px] text-zinc-500">Admin: {item.settlement.administratorName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vault?settlementId=${item.settlement.id}`}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Lock &amp; File Claim in Vault
                      </Link>
                      <Link
                        href={item.settlement.officialClaimUrl || `/portal/demo-settlement?id=${item.settlement.id}`}
                        className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
                        title="Simulate Court Claim Portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 flex items-center justify-between">
                    <span>Investigation active. Class action pending filing.</span>
                    <Link href="/vault" className="text-emerald-400 hover:underline">
                      Add to Watchlist
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
