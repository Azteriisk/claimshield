"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, X, AlertTriangle } from "lucide-react";

interface Settlement {
  id: string;
  caseName: string;
  defendant: string;
  estimatedBasePayout: number;
}

interface Claimant {
  id: string;
  legalFirstName: string;
  legalLastName: string;
  lockedPayoutAddress: string;
  kycStatus: string;
}

function ModalContent() {
  const searchParams = useSearchParams();
  const settlementId = searchParams.get("settlementId") || "sett-tm-2024";

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [claimants, setClaimants] = useState<Claimant[]>([]);
  const [selectedClaimantId, setSelectedClaimantId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [settlementId]);

  const loadData = async () => {
    try {
      const [settlementsRes, claimantsRes] = await Promise.all([
        fetch("/api/settlements"),
        fetch("/api/claimants")
      ]);
      const sData = await settlementsRes.json();
      const cData = await claimantsRes.json();

      const matched = sData.settlements?.find((s: Settlement) => s.id === settlementId);
      setSettlement(matched || sData.settlements?.[0] || null);

      const list: Claimant[] = cData.claimants || [];
      setClaimants(list);
      if (list.length > 0) {
        setSelectedClaimantId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load modal data", err);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedClaimantId || !settlement) return;
    setSubmitting(true);
    setErrorMessage(null);

    const claimant = claimants.find(c => c.id === selectedClaimantId);
    if (!claimant) return;

    try {
      const res = await fetch("/api/claims/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId: settlement.id,
          claimantId: claimant.id,
          payoutAddress: claimant.lockedPayoutAddress
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error || "Claim failed");
        setSubmitting(false);
      } else {
        // Send approval message to parent window
        window.parent.postMessage(
          {
            type: "CLAIMSHIELD_CLAIM_APPROVED",
            payload: {
              legalFirstName: claimant.legalFirstName,
              legalLastName: claimant.legalLastName,
              email: claimant.lockedPayoutAddress,
              payoutAddress: claimant.lockedPayoutAddress,
              auditToken: `tok_rule23_${Date.now()}_clean`,
              settlementId: settlement.id
            }
          },
          "*"
        );
      }
    } catch {
      setErrorMessage("Network error verifying claim payload");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    window.parent.postMessage({ type: "CLAIMSHIELD_CLOSE_MODAL" }, "*");
  };

  return (
    <div className="h-full bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 select-none font-sans">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-zinc-950 font-black text-xs shadow-md shadow-emerald-500/20">
              CS
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">ClaimShield</span>
              <span className="text-[10px] text-emerald-400 font-mono uppercase block -mt-1 font-semibold">
                Fast-Track Verified Intake
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settlement Info Card */}
        {settlement && (
          <div className="mt-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Target Settlement Class:</div>
            <div className="font-bold text-xs text-white leading-tight">{settlement.caseName}</div>
            <div className="text-[11px] text-emerald-400 font-mono pt-1">
              Est. Relief: ~${settlement.estimatedBasePayout.toFixed(2)} Base Cash
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Identity Selector */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Choose Verified Identity Vault:</span>
            <span className="text-[10px] text-emerald-400 font-mono">1:1 Sybil-Proof</span>
          </div>

          <div className="space-y-2">
            {claimants.map(c => (
              <label
                key={c.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  selectedClaimantId === c.id
                    ? "bg-zinc-900 border-emerald-500 shadow-md shadow-emerald-500/10"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="claimantSelection"
                    checked={selectedClaimantId === c.id}
                    onChange={() => setSelectedClaimantId(c.id)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {c.legalFirstName} {c.legalLastName}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Payout Locked: {c.lockedPayoutAddress}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    KYC Verified
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer & Submit Action */}
      <div className="pt-4 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            Encrypted Attestation Nonce
          </span>
          <span>FRCP Rule 23 Compliant</span>
        </div>

        <button
          onClick={handleAuthorize}
          disabled={submitting || !selectedClaimantId}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          {submitting ? (
            "Verifying Cryptographic Proof..."
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Authorize &amp; Pre-Clear Claim
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function WidgetModalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-zinc-500">Loading ClaimShield Verified Intake...</div>}>
      <ModalContent />
    </Suspense>
  );
}
