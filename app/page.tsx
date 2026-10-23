"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShieldAlert, ArrowRight, DollarSign, Calendar, Lock, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface Breach {
  id: string;
  entityName: string;
  domain: string;
  breachDate: string;
  exposedData: string[];
  description: string;
  settlement?: {
    id: string;
    caseName: string;
    defendant: string;
    claimDeadline: string;
    estimatedBasePayout: number;
    maxDocumentedLoss: number;
    administratorName: string;
    status: string;
    officialClaimUrl?: string;
  };
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreaches("");
  }, []);

  const fetchBreaches = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/breaches?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setBreaches(data.breaches || []);
    } catch (err) {
      console.error("Failed to load breaches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBreaches(searchQuery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
          <ShieldAlert className="w-3.5 h-3.5" />
          The Anti-Hijack Settlement Network
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Your Data Was Breached. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Don&apos;t Let Fraudsters Claim Your Payout.
          </span>
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg">
          Cybercrime rings use leaked PII to file class action claims and route payouts to burner PayPals.
          ClaimShield matches your exposures to active settlements and locks your identity to guarantee only you get paid.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto pt-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search your email or company (e.g. ticketmaster, att, 23andme)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            Scan Now
          </button>
        </form>
      </div>

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
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Data Breach Settlements</h2>
            <p className="text-zinc-400 text-sm">Monetize your exposure losses before official court deadlines close.</p>
          </div>
          <Link
            href="/vault"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
          >
            Manage Your Vault
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Scanning breach intelligence repositories...</div>
        ) : breaches.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl text-zinc-400">
            No active breaches found matching &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;ticketmaster&rdquo; or &ldquo;att&rdquo;.
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
                      <a
                        href={item.settlement.officialClaimUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
                        title="Official Court Notice"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
