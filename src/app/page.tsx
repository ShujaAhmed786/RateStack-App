'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  ArrowRight, 
  Layers, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-extrabold flex items-center justify-center shadow-md shadow-emerald-500/20">
              RS
            </div>
            <span className="font-bold text-base tracking-tight text-white">RateStack</span>
          </div>

          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <span className="text-xs font-mono text-zinc-500">Checking auth...</span>
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 hidden sm:inline-block">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/dashboard/contracts"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all shadow-sm"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold px-3.5 py-2 rounded-xl text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-md shadow-emerald-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-20 flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Freelance & Agency Agreement Engine
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Lock contract scope, milestones, and signatures.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Create client agreements with auto-balancing milestones, verifiable audit trails, 
          or generate instant e-signable legal documents without escrow friction.
        </p>

        {/* Dual Primary Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-4 w-full sm:w-auto">
          {/* Milestone Contract Builder */}
          <Link
            href="/dashboard/contracts/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02]"
          >
            <Layers className="w-4 h-4 stroke-[2.5]" />
            New Milestone Contract
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Instant Legal Document Builder */}
          <Link
            href="/dashboard/contracts/legal"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] shadow-lg"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Instant Legal Document
          </Link>

          {/* View Dashboard / Contracts */}
          <Link
            href="/dashboard/contracts"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium text-sm rounded-xl transition-colors"
          >
            View Dashboard
          </Link>
        </div>

        {/* Quick Legal Template Pills */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl text-xs text-zinc-500">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400 mr-1">
            Quick Generator:
          </span>
          <Link
            href="/dashboard/contracts/legal"
            className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
          >
            Mutual NDA
          </Link>
          <Link
            href="/dashboard/contracts/legal"
            className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
          >
            Employment Agreement
          </Link>
          <Link
            href="/dashboard/contracts/legal"
            className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
          >
            Service Retainer
          </Link>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 max-w-4xl text-left">
          <div className="p-5 rounded-2xl bg-[#0f0f13] border border-zinc-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Auto-Balancing Milestones</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Define budgets in PKR, USD, EUR, or GBP. Milestone percentages dynamically rebalance to exactly 100%.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f0f13] border border-zinc-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Instant Legal Documents</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generate NDAs, Employment, and Service contracts with full clause editing and no payment friction.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f0f13] border border-zinc-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">E-Sign & PDF Export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cryptographically verified signatures with instant download for both buyer and seller.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        RateStack Engine • Powered by Next.js, Prisma & PostgreSQL
      </footer>
    </div>
  );
}