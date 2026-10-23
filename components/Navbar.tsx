"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  Building2, 
  Sparkles,
  ArrowLeft
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const isConsumerFlow = pathname === "/";

  return (
    <header className="border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-xl sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-base tracking-tight">
              <span className="text-white">Claim</span>
              <span className="text-emerald-400">Shield</span>
            </div>
            <span className="text-[10px] tracking-wider text-slate-400 block -mt-1 font-mono uppercase">
              Settlement Trust
            </span>
          </div>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2">
          {!isConsumerFlow && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Consumer Flow</span>
            </Link>
          )}

          <Link
            href="/portal/demo-settlement"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">SDK Widget</span>
            <span>Demo</span>
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition border ${
              pathname === "/admin"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10"
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${pathname === "/admin" ? "text-slate-950" : "text-cyan-400"}`} />
            <span className="hidden sm:inline">B2B Admin Suite</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
