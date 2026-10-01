'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  Layers, 
  Check, 
  FileDown, 
  DollarSign, 
  CheckCheck,
  RotateCw,
  LogOut,
  User as UserIcon,
  Copy,
  FileText
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  percentage: number;
  amount: number;
  status: string;
  dueDate: string | null;
  sortOrder: number;
}

interface Contract {
  id: string;
  title: string;
  type?: string;
  templateCategory?: string | null;
  totalValue: number;
  currency: string;
  status: string;
  publicToken: string;
  createdAt: string;
  client: {
    name: string;
    companyName: string | null;
    email: string;
  };
  milestones: Milestone[];
}

export default function ContractsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [completingId, setCompletingId] = useState<string | null>(null);

  // 1. Kick unauthenticated users back to login immediately
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const loadContracts = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/contracts', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.contracts) {
        setContracts(data.contracts);
      }
    } catch (e) {
      console.error('Failed to load contracts:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 2. Poll only when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      loadContracts();

      const interval = setInterval(() => {
        loadContracts(true);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const handleCompleteMilestone = async (milestoneId: string) => {
    setCompletingId(milestoneId);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to mark milestone complete');
      } else {
        await loadContracts(true);
      }
    } catch (e: any) {
      console.error('Error completing milestone:', e);
      alert(e.message || 'Network error');
    } finally {
      setCompletingId(null);
    }
  };

  const handleConfirmPaid = async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/pay`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to confirm payment');
      } else {
        await loadContracts(true);
      }
    } catch (e: any) {
      console.error('Error updating milestone:', e);
      alert(e.message || 'Network error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Verifying authorization...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const filteredContracts = contracts.filter((c) => {
    const isCompleted = c.status?.toUpperCase() === 'COMPLETED';
    if (filter === 'ACTIVE') return !isCompleted;
    if (filter === 'COMPLETED') return isCompleted;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-extrabold flex items-center justify-center">
              RS
            </div>
            <span className="font-bold text-base tracking-tight text-white">RateStack</span>
          </Link>
          
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/contracts/new"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Milestone Contract
            </Link>

            <Link
              href="/dashboard/contracts/legal"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> Fast Legal Doc
            </Link>

            {session?.user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <span className="text-xs text-zinc-400 hidden sm:inline-block">
                  {session.user.name || session.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-rose-400 text-zinc-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-medium px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Title, Actions & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Contracts & Legal Documents</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage milestone escrow schedules, NDAs, and signable legal agreements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadContracts(false)}
              className="p-2 rounded-xl border border-zinc-800 bg-[#121218] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh Contracts"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <div className="flex items-center gap-1 bg-[#121218] p-1 rounded-xl border border-zinc-800">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === tab
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center font-mono text-xs text-zinc-500">
            Loading agreements and documents...
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredContracts.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-[#0f0f13] border border-zinc-800/80 space-y-4">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No agreements found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Launch a milestone contract with escrow payment tracking, or quickly create an NDA or employment agreement.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/contracts/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> New Milestone Contract
              </Link>
              <Link
                href="/dashboard/contracts/legal"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                <FileText className="w-3.5 h-3.5" /> Instant Legal Agreement
              </Link>
            </div>
          </div>
        )}

        {/* Contracts List */}
        <div className="space-y-6">
          {filteredContracts.map((contract) => {
            const isLegalOnly = contract.type === 'STANDARD_LEGAL' || !contract.milestones || contract.milestones.length === 0;
            const totalMilestones = contract.milestones?.length || 0;
            const completedMilestones = (contract.milestones || []).filter(
              (m) =>
                String(m.status).toUpperCase() === 'COMPLETED' ||
                String(m.status).toUpperCase() === 'PAID'
            ).length;
            const progressPercent =
              totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            const activeMilestone = (contract.milestones || []).find(
              (m) =>
                String(m.status).toUpperCase() !== 'COMPLETED' &&
                String(m.status).toUpperCase() !== 'PAID'
            );

            return (
              <div
                key={contract.id}
                className="bg-[#0f0f13] border border-zinc-800/90 rounded-2xl p-6 space-y-6 shadow-xl"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/60 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-white tracking-tight">{contract.title}</h2>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          String(contract.status).toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            : String(contract.status).toUpperCase() === 'ACCEPTED'
                            ? 'bg-blue-950/40 text-blue-400 border-blue-500/30'
                            : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {contract.status}
                      </span>
                      {isLegalOnly && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400">
                          Legal Document
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Client: <strong className="text-zinc-200">{contract.client?.name || 'Unassigned'}</strong>
                      {contract.client?.companyName ? ` (${contract.client.companyName})` : ''} • {contract.client?.email}
                    </p>
                  </div>

                  {/* Actions & Value */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {!isLegalOnly && Number(contract.totalValue) > 0 && (
                      <div className="text-right mr-1">
                        <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Value</p>
                        <p className="text-lg font-mono font-bold text-emerald-400">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency }).format(
                            Number(contract.totalValue)
                          )}
                        </p>
                      </div>
                    )}

                    {/* Reuse Contract Action */}
                    <Link
                      href={`/dashboard/contracts/new?template=${contract.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                      title="Duplicate & Reuse Template"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Reuse</span>
                    </Link>

                    {/* Public Contract Link */}
                    <Link
                      href={`/c/${contract.publicToken}`}
                      target="_blank"
                      className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors"
                      title="Open Public Agreement"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Conditional Rendering: Milestone Roadmap vs Legal Document View */}
                {!isLegalOnly ? (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-400">
                          Progress: {completedMilestones} of {totalMilestones} Completed
                        </span>
                        <span className={progressPercent === 100 ? 'text-emerald-400' : 'text-zinc-300'}>
                          {progressPercent}% Complete
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            progressPercent === 100 ? 'bg-emerald-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestone List */}
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Milestone Roadmap
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {contract.milestones.map((milestone, idx) => {
                          const statusUpper = String(milestone.status).toUpperCase();
                          const isPaid = statusUpper === 'PAID';
                          const isCompleted = statusUpper === 'COMPLETED' || isPaid;
                          const isPaymentSubmitted = statusUpper === 'PAYMENT_SUBMITTED';
                          const isCurrent = activeMilestone?.id === milestone.id;

                          return (
                            <div
                              key={milestone.id}
                              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isCompleted
                                  ? 'bg-zinc-950/40 border-zinc-800/50 opacity-80'
                                  : isCurrent
                                  ? 'bg-emerald-950/15 border-emerald-500/40 ring-1 ring-emerald-500/20'
                                  : 'bg-zinc-950/20 border-zinc-800/40'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                    isPaid
                                      ? 'bg-emerald-400 text-black'
                                      : isCompleted
                                      ? 'bg-emerald-500 text-black'
                                      : isCurrent
                                      ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                                      : 'bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className={`text-sm font-semibold ${
                                        isCompleted ? 'text-zinc-400' : 'text-zinc-200'
                                      }`}
                                    >
                                      {milestone.title}
                                    </h4>
                                    {isCurrent && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  {milestone.description && (
                                    <p className="text-xs text-zinc-400 mt-0.5">{milestone.description}</p>
                                  )}
                                  {milestone.dueDate && (
                                    <p className="text-[11px] text-zinc-500 mt-0.5">
                                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pl-9 sm:pl-0 flex-wrap">
                                <div className="text-left sm:text-right mr-1">
                                  <p className="text-xs font-mono font-bold text-zinc-200">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: contract.currency,
                                    }).format(Number(milestone.amount))}
                                  </p>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    ({Number(milestone.percentage)}%)
                                  </span>
                                </div>

                                {isCurrent && (
                                  <button
                                    type="button"
                                    disabled={completingId === milestone.id}
                                    onClick={() => handleCompleteMilestone(milestone.id)}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                                  >
                                    {completingId === milestone.id ? (
                                      'Marking...'
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                                      </>
                                    )}
                                  </button>
                                )}

                                {isPaymentSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmPaid(milestone.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/20 animate-pulse"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" /> Confirm Payment Received
                                  </button>
                                )}

                                {statusUpper === 'COMPLETED' && !isPaymentSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmPaid(milestone.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" /> Mark as Paid
                                  </button>
                                )}

                                {isPaid && (
                                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                                    <Check className="w-3.5 h-3.5" /> Paid
                                  </span>
                                )}

                                {isCompleted && (
                                  <a
                                    href={`/api/milestones/${milestone.id}/invoice`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
                                    title="Download PDF Invoice"
                                  >
                                    <FileDown className="w-3.5 h-3.5 text-emerald-400" /> Invoice
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Standard Legal Document View */
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">
                          {contract.templateCategory ? `${contract.templateCategory.toUpperCase()} Agreement` : 'Standard Agreement'}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          {contract.status === 'ACCEPTED'
                            ? 'Executed & digitally signed by recipient'
                            : 'Awaiting client electronic sign-off'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/c/${contract.publicToken}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View & Sign Link
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}