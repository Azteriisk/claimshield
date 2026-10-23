"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Lock, AlertTriangle, Building2, Sparkles } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Breach Scanner",
      href: "/",
      icon: ShieldCheck,
      badge: "Consumer"
    },
    {
      name: "Identity Vault",
      href: "/vault",
      icon: Lock,
      badge: "1:1 Protected"
    },
    {
      name: "Appeals & Recovery",
      href: "/dispute",
      icon: AlertTriangle,
      badge: "Circuit Breaker"
    },
    {
      name: "B2B Admin Suite",
      href: "/admin",
      icon: Building2,
      badge: "Enterprise"
    },
    {
      name: "Widget Demo",
      href: "/portal/demo-settlement",
      icon: Sparkles,
      badge: "SDK Live"
    }
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/20">
            CS
          </div>
          <div>
            <span className="text-white">Claim</span>
            <span className="text-emerald-400">Shield</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block -mt-1">Settlement Trust</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-800 text-emerald-400 border border-zinc-700/60 shadow-inner"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                <span className="hidden md:inline">{item.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase ${
                    isActive
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                  }`}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
