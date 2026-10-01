'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LEGAL_TEMPLATES, LegalTemplateConfig } from '@/lib/legalTemplates';
import { 
  FileText, 
  CheckCircle, 
  ChevronLeft, 
  Loader2, 
  UserCheck, 
  UserPlus, 
  X, 
  Building, 
  Mail, 
  User, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Edit3
} from 'lucide-react';

interface ClientItem {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
}

export default function FastLegalContractPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Parties & State
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [initiatorName, setInitiatorName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('service');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [agreementTitle, setAgreementTitle] = useState('');
  
  // Custom clause & contract text editor
  const [contractBody, setContractBody] = useState<string>('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  // New Client Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Submission & Link Generation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTemplate: LegalTemplateConfig = LEGAL_TEMPLATES[selectedTemplateKey];

  useEffect(() => {
    if (session?.user?.name) {
      setInitiatorName(session.user.name);
    }
  }, [session]);

  const fetchClients = async () => {
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
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Set defaults when template changes
  useEffect(() => {
    const initialFields: Record<string, string> = {};
    activeTemplate.fields.forEach((f) => {
      if (f.defaultValue) initialFields[f.id] = f.defaultValue;
    });
    setFieldValues(initialFields);
    setAgreementTitle(activeTemplate.name);
    setIsCustomEdited(false);
  }, [selectedTemplateKey]);

  // Sync contract body text
  useEffect(() => {
    if (isCustomEdited) return;

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    const clientDisplay = selectedClient 
      ? `${selectedClient.name}${selectedClient.companyName ? ` (${selectedClient.companyName})` : ''}` 
      : 'Counterparty / Client';

    const compiled = activeTemplate.generateText(
      fieldValues,
      initiatorName.trim() || 'Originator',
      clientDisplay,
      currency
    );
    setContractBody(compiled);
  }, [fieldValues, selectedTemplateKey, initiatorName, selectedClientId, clients, currency, isCustomEdited]);

  const handleFieldChange = (id: string, val: string) => {
    setFieldValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setIsSavingClient(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          companyName: newClientCompany,
          email: newClientEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save client');

      setClients((prev) => [data.client, ...prev]);
      setSelectedClientId(data.client.id);
      setShowAddClientModal(false);
      setNewClientName('');
      setNewClientCompany('');
      setNewClientEmail('');
    } catch (err: any) {
      setClientError(err.message);
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Please select or add a recipient client first.');
      return;
    }
    if (!initiatorName.trim()) {
      setError('Please provide your name or organization as the Initiator.');
      return;
    }
    if (!contractBody.trim()) {
      setError('Contract terms cannot be blank.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        clientId: selectedClientId,
        initiatorName: initiatorName.trim(),
        title: agreementTitle || activeTemplate.name,
        scopeDescription: contractBody,
        totalValue: 0,
        currency,
        type: 'STANDARD_LEGAL',
        templateCategory: activeTemplate.id,
        milestones: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate contract');

      const fullUrl = `${window.location.origin}/c/${data.contract.publicToken}`;
      setGeneratedLink(fullUrl);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 sm:p-10 selection:bg-emerald-500 selection:text-black">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/dashboard/contracts')}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Instant Legal Document Generator</h1>
            <p className="text-xs text-zinc-400">Configure, customize clauses, and generate a client signing link.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Link Generated Success Card */}
        {generatedLink ? (
          <div className="bg-[#0f0f13] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Legal Agreement Ready for Signing</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Send this link to your client. Both parties can digitally sign and download the official PDF.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Public Sign URL
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 select-all focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setGeneratedLink(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                &larr; Create another agreement
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/contracts')}
                className="text-xs font-semibold px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0f0f13] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Party A: Initiator */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Initiator / Disclosing Party (Your Name or Firm) *
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={initiatorName}
                  onChange={(e) => setInitiatorName(e.target.value)}
                  placeholder="e.g. Shuja Ahmed or Dev-Cops Studio"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* Party B: Recipient Client with Modal Trigger */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Recipient Party / Receiving Client *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(true)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Add Client
                </button>
              </div>

              {clients.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(true)}
                  className="w-full py-4 border border-dashed border-zinc-700 hover:border-blue-500/50 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm flex items-center justify-center gap-2 transition-all bg-zinc-950/40"
                >
                  <UserPlus className="w-4 h-4 text-blue-400" /> No clients found. Click to add your client.
                </button>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 text-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Template & Currency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Select Legal Template
                </label>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 text-white"
                >
                  {Object.values(LEGAL_TEMPLATES).map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 text-white font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (₨)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Agreement Title
              </label>
              <input
                type="text"
                value={agreementTitle}
                onChange={(e) => setAgreementTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 text-white"
              />
            </div>

            {/* Dynamic Template Fields with HTML5 Datepicker Support */}
            <div className="border-t border-zinc-800/80 pt-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Template Fields</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTemplate.fields.map((field) => (
                  <div key={field.id} className="sm:col-span-1">
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">{field.label}</label>
                    <input
                      type={field.type === 'date' ? 'date' : 'text'}
                      placeholder={field.placeholder}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:ring-2 focus:ring-blue-500/40 placeholder:text-zinc-600 [color-scheme:dark]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Terms & Clauses Area */}
            <div className="border-t border-zinc-800/80 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  Contract Clauses & Legal Terms (Editable)
                </label>
                <span className="text-[11px] text-zinc-500">
                  {isCustomEdited ? 'Custom edits active' : 'Auto-updating from fields'}
                </span>
              </div>
              <textarea
                rows={12}
                value={contractBody}
                onChange={(e) => {
                  setContractBody(e.target.value);
                  setIsCustomEdited(true);
                }}
                className="w-full font-mono text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y text-zinc-300 leading-relaxed"
                placeholder="The formal agreement text will generate here..."
              />
              <p className="text-[11px] text-zinc-500">
                You can freely add, delete, or rewrite any clauses directly above before generating the signable link.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Public Agreement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Create Public Sign Link
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Inline Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f0f13] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" /> Add Recipient Client
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {clientError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300">
                {clientError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Full Name / Contact Person *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="e.g. Acme Innovations"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@acme.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-blue-500/20"
                >
                  {isSavingClient ? 'Saving...' : 'Save & Select Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}