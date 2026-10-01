'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Calendar, 
  Percent, 
  Building, 
  Mail, 
  User, 
  Layers, 
  Sparkles, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useMilestoneCalculator } from '@/hooks/useMilestoneCalculator';

interface ClientItem {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
}

function ContractWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  // Multi-step tracking: 1 = Client & Scope, 2 = Budget & Milestones, 3 = Review & Submit, 4 = Published
  const [currentStep, setCurrentStep] = useState(1);

  // Clients
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // New Client Form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Contract Details
  const [title, setTitle] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const [totalValue, setTotalValue] = useState<number>(1000);
  const [currency, setCurrency] = useState('USD');
  const [paymentLink, setPaymentLink] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedToken, setPublishedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Milestone Calculations
  const {
    milestones,
    setMilestones,
    addMilestone,
    removeMilestone,
    updateMilestoneField,
    totalPercentage,
    allocatedAmount,
    rebalanceEvenly,
  } = useMilestoneCalculator(totalValue);

  // 1. Fetch Clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (res.ok && data.clients) {
          setClients(data.clients);
          if (data.clients.length > 0 && !selectedClientId) {
            setSelectedClientId(data.clients[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load clients', err);
      } finally {
        setIsLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  // 2. Clone from template if query param exists
  useEffect(() => {
    if (!templateId) return;

    async function loadTemplate() {
      try {
        const res = await fetch(`/api/contracts/${templateId}`);
        const data = await res.json();
        if (res.ok && data.contract) {
          const c = data.contract;
          setTitle(`${c.title} (Copy)`);
          setScopeDescription(c.scopeDescription || '');
          setTotalValue(Number(c.totalValue) || 1000);
          setCurrency(c.currency || 'USD');
          setPaymentLink(c.paymentLink || '');
          if (c.clientId) setSelectedClientId(c.clientId);

          if (c.milestones && c.milestones.length > 0) {
            setMilestones(
              c.milestones.map((m: any, idx: number) => ({
                id: `ms-${Date.now()}-${idx}`,
                title: m.title,
                description: m.description || '',
                percentage: Number(m.percentage),
                amount: Number(m.amount),
                dueDate: m.dueDate ? m.dueDate.split('T')[0] : '',
              }))
            );
          }
        }
      } catch (e) {
        console.error('Failed to fetch template:', e);
      }
    }
    loadTemplate();
  }, [templateId, setMilestones]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) return;

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName.trim(),
          companyName: newClientCompany.trim() || null,
          email: newClientEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      setClients((prev) => [data.client, ...prev]);
      setSelectedClientId(data.client.id);
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientCompany('');
      setNewClientEmail('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating client');
    }
  };

  const handlePublishContract = async () => {
    if (!selectedClientId) {
      setErrorMessage('Please select or add a client.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Contract title is required.');
      return;
    }
    if (Math.round(totalPercentage) !== 100) {
      setErrorMessage('Milestone percentages must equal exactly 100%. Click "Rebalance Evenly" if needed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          title: title.trim(),
          scopeDescription,
          totalValue,
          currency,
          paymentLink: paymentLink.trim() || null,
          type: 'MILESTONE',
          milestones: milestones.map((m) => ({
            title: m.title,
            description: m.description || null,
            percentage: m.percentage,
            amount: m.amount,
            dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create contract');

      setPublishedToken(data.contract.publicToken);
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPublicUrl = () => {
    if (!publishedToken) return;
    const url = `${window.location.origin}/c/${publishedToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation Bar with Clickable RateStack Home Link */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-extrabold flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  RateStack
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Milestone Contract Orchestrator</p>
            </div>
          </Link>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === step
                    ? 'bg-emerald-500 text-black ring-2 ring-emerald-500/30'
                    : currentStep > step
                    ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
                }`}
              >
                {currentStep > step ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Client & Scope */}
        {currentStep === 1 && (
          <div className="bg-[#0f0f13] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800/80 pb-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Step 1: Client & Deliverable Scope</h2>
              <p className="text-xs text-zinc-400 mt-1">Specify who this agreement is for and the core goals of the engagement.</p>
            </div>

            {/* Client Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Target Client
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showNewClientForm ? 'Select Existing Client' : '+ New Client'}
                </button>
              </div>

              {showNewClientForm ? (
                <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Contact Name *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={newClientCompany}
                      onChange={(e) => setNewClientCompany(e.target.value)}
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleCreateClient}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all"
                    >
                      Save Client
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {isLoadingClients ? (
                    <option>Loading clients...</option>
                  ) : clients.length === 0 ? (
                    <option value="">No clients found — add one above</option>
                  ) : (
                    clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.email}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Contract Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Contract Title *
              </label>
              <input
                type="text"
                placeholder="e.g. RateStack Full-Stack SaaS Infrastructure & CI/CD Deployment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {/* Scope Statement */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Scope of Work & Acceptance Criteria
              </label>
              <textarea
                rows={5}
                placeholder="Detail deliverables, communication schedule, technical specifications, and revision policies..."
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    setErrorMessage('Please enter a contract title.');
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                Next: Budget & Milestones <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Budget & Milestones */}
        {currentStep === 2 && (
          <div className="bg-[#0f0f13] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Step 2: Budget & Auto-Balancing Milestones</h2>
                <p className="text-xs text-zinc-400 mt-1">Configure staged payouts that automatically sync with deliverables.</p>
              </div>
              <button
                type="button"
                onClick={rebalanceEvenly}
                className="self-start sm:self-auto px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Rebalance Evenly
              </button>
            </div>

            {/* Currency & Total Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (₨)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Total Project Value
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalValue}
                  onChange={(e) => setTotalValue(Number(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-bold"
                />
              </div>
            </div>

            {/* Milestone List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Deliverable Milestones
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
              </div>

              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Milestone ${idx + 1} Title`}
                      value={m.title}
                      onChange={(e) => updateMilestoneField(m.id, 'title', e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(m.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-semibold uppercase mb-1">
                        Percentage Split (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.percentage}
                        onChange={(e) => updateMilestoneField(m.id, 'percentage', Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-semibold uppercase mb-1">
                        Calculated Amount ({currency})
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={m.amount}
                        className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-semibold uppercase mb-1">
                        Target Due Date
                      </label>
                      <input
                        type="date"
                        value={m.dueDate}
                        onChange={(e) => updateMilestoneField(m.id, 'dueDate', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Allocation Meter */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Total Allocation:</span>
              <span className={Math.round(totalPercentage) === 100 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {Math.round(totalPercentage)}% ({currency} {allocatedAmount.toLocaleString()})
              </span>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Scope
              </button>
              <button
                type="button"
                onClick={() => {
                  if (Math.round(totalPercentage) !== 100) {
                    setErrorMessage('Milestone percentages must equal 100% to proceed.');
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep(3);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                Next: Payment & Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Publish */}
        {currentStep === 3 && (
          <div className="bg-[#0f0f13] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800/80 pb-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Step 3: Review & Publish Agreement</h2>
              <p className="text-xs text-zinc-400 mt-1">Add optional payment gateway details and finalize contract generation.</p>
            </div>

            {/* Optional Payout Link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Escrow / Payment Gateway Link (Optional)
              </label>
              <input
                type="url"
                placeholder="e.g. Stripe Payment Link, Nayapay / Sadapay handle, or Wise payout URL"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Clients will be routed to this payment destination when unlocking completed milestones.
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Agreement Summary</h4>
              <p className="text-zinc-400">Title: <strong className="text-white">{title}</strong></p>
              <p className="text-zinc-400">Total Value: <strong className="text-emerald-400 font-mono">{currency} {totalValue.toLocaleString()}</strong></p>
              <p className="text-zinc-400">Milestone Count: <strong className="text-zinc-200">{milestones.length} staged deliverables</strong></p>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Milestones
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishContract}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" /> Publish & Generate Sign Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Contract Published */}
        {currentStep === 4 && publishedToken && (
          <div className="bg-[#0f0f13] border border-emerald-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Contract Published</h2>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
                Your contract is cryptographically registered and awaiting client sign-off.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg mx-auto space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block text-left">
                Public Client Sign URL
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/c/${publishedToken}`}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-400 select-all focus:outline-none"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={copyPublicUrl}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <Link
                    href={`/c/${publishedToken}`}
                    target="_blank"
                    className="flex-1 sm:flex-initial px-4 py-2 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/dashboard/contracts"
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Go to Contracts Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ContractWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading RateStack Studio...
      </div>
    }>
      <ContractWizardContent />
    </Suspense>
  );
}