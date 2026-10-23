"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Sparkles, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Bot, 
  ExternalLink, 
  RotateCcw, 
  Check, 
  Layers,
  ChevronUp,
  ChevronDown,
  ArrowRight
} from "lucide-react";

export function ShowcaseDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTriggeringBot, setIsTriggeringBot] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleRunRobertDispute = () => {
    showStatus("Loading Robert Miller settlement hijack dispute scenario...");
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("claimshield:load-scenario", { 
        detail: { scenario: "robert" } 
      }));
    } else {
      router.push("/?scenario=robert");
    }
    setIsOpen(false);
  };

  const handleRunCleanClaimant = () => {
    showStatus("Loading clean consumer intake scenario (Sarah Jenkins)...");
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("claimshield:load-scenario", { 
        detail: { scenario: "clean" } 
      }));
    } else {
      router.push("/?scenario=clean");
    }
    setIsOpen(false);
  };

  const handleSimulateBotWave = async () => {
    setIsTriggeringBot(true);
    try {
      const res = await fetch("/api/admin/simulate-bot-wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 20 })
      });
      const data = await res.json();
      showStatus(`Injected 20 Sybil bot claims. Opening B2B Admin Console...`);
      if (pathname === "/admin") {
        window.location.reload();
      } else {
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      showStatus("Failed to simulate bot wave");
    } finally {
      setIsTriggeringBot(false);
      setIsOpen(false);
    }
  };

  const handleOpenSdkDemo = () => {
    showStatus("Navigating to Court Settlement Portal with embedded SDK...");
    router.push("/portal/demo-settlement");
    setIsOpen(false);
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/admin/reset", { method: "POST" });
      showStatus("Data store reset to baseline fixtures.");
      if (pathname === "/") {
        window.location.href = "/";
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      showStatus("Failed to reset store");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Pill (Bottom-Right) */}
      <div className="fixed bottom-4 right-4 z-40 no-print">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-100 shadow-2xl backdrop-blur-md transition-all duration-200 group active:scale-95"
          aria-label="Toggle Walkthrough Scenarios"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Walkthrough Showcase
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 border border-zinc-700">
            4 Scenarios
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
        </button>
      </div>

      {/* Floating Status Toast */}
      {statusMessage && (
        <div className="fixed bottom-16 right-4 z-50 bg-emerald-950 border border-emerald-700/80 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Slide-over Showcase Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs no-print">
          <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                  <Layers className="w-3 h-3" />
                  Institutional Evaluation Dock
                </div>
                <h2 className="text-base font-bold text-white">Live Walkthrough Scenarios</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pre-configured data flows demonstrating zero-access defense and B2B anti-fraud.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scenarios List */}
            <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
              
              {/* Scenario 1 */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/30 hover:border-amber-500/60 transition group space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Scenario 1 • Consumer Defense
                  </span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Settlement Hijack &amp; Court Dispute</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Robert Miller discovers a fraud syndicate filed in his name with a burner PayPal. Generates a sworn 28 U.S.C. § 1746 affidavit and triggers an escrow freeze.
                  </p>
                </div>
                <button
                  onClick={handleRunRobertDispute}
                  className="w-full mt-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <span>Launch Hijack Dispute Flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scenario 2 */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-emerald-500/30 hover:border-emerald-500/60 transition group space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Scenario 2 • Clean Intake
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Clean 1-Click Consumer Filing</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Sarah Jenkins matches 3 active data breaches ($215.00 total), anchors her identity to a verified PayPal, and completes assisted filing.
                  </p>
                </div>
                <button
                  onClick={handleRunCleanClaimant}
                  className="w-full mt-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <span>Launch Clean Claimant Flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scenario 3 */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-cyan-500/30 hover:border-cyan-500/60 transition group space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    Scenario 3 • Administrator B2B
                  </span>
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">20-Claim Sybil Bot Wave Influx</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Fires 20 automated bot claims from datacenter IPs. Displays real-time blocking, risk scoring, and FRCP Rule 23 CSV export.
                  </p>
                </div>
                <button
                  onClick={handleSimulateBotWave}
                  disabled={isTriggeringBot}
                  className="w-full mt-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-zinc-800 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/40 transition flex items-center justify-center gap-1.5"
                >
                  {isTriggeringBot ? "Injecting Attack..." : "Inject 20 Bot Claims & Open Admin"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scenario 4 */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-700 hover:border-zinc-500 transition group space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    Scenario 4 • Partner SDK
                  </span>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Drop-In Court Portal Embed</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Simulates an official court notice portal (e.g. Epiq or Kroll) with the ClaimShield Fast-Track 1-click verification button injected.
                  </p>
                </div>
                <button
                  onClick={handleOpenSdkDemo}
                  className="w-full mt-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center justify-center gap-1.5"
                >
                  <span>Open Simulated Court Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Footer Utilities */}
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/80 space-y-2.5">
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                <span>{isResetting ? "Resetting Store..." : "Reset Data to Clean Baseline"}</span>
              </button>
              
              <div className="text-[10px] text-zinc-500 font-mono text-center">
                ClaimShield Enterprise Architecture v2.0
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
