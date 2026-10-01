'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export interface SigningCardProps {
  token: string;
  isAccepted: boolean;
  signerName?: string | null;
  acceptedSignature?: string | null; // Accepts legacy alias to satisfy page.tsx
  acceptedAt?: string | null;
}

export default function SigningCard({
  token,
  isAccepted: initialAccepted,
  signerName: initialSigner,
  acceptedSignature,
  acceptedAt: initialDate,
}: SigningCardProps) {
  const router = useRouter();

  const effectiveSigner = initialSigner || acceptedSignature || '';

  const [isAccepted, setIsAccepted] = useState<boolean>(initialAccepted);
  const [signerName, setSignerName] = useState<string>(effectiveSigner);
  const [acceptedDate, setAcceptedDate] = useState<string>(initialDate || '');

  const [typedName, setTypedName] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if server component refreshes in the background
  useEffect(() => {
    setIsAccepted(initialAccepted);
    if (effectiveSigner) setSignerName(effectiveSigner);
    if (initialDate) setAcceptedDate(initialDate);
  }, [initialAccepted, effectiveSigner, initialDate]);

  // Track contract view once on initial public load
  useEffect(() => {
    if (!initialAccepted && token) {
      fetch('/api/contracts/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch((err) => console.error('Failed to log view:', err));
    }
  }, [token, initialAccepted]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !typedName.trim()) return;

    setIsSigning(true);
    setError(null);

    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signatureName: typedName.trim(),
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign the agreement.');
      }

      setIsAccepted(true);
      setSignerName(typedName.trim());
      setAcceptedDate(new Date().toISOString());
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while signing.');
    } finally {
      setIsSigning(false);
    }
  };

  if (isAccepted) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Agreement Legally Signed</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          This contract was digitally signed and accepted by{' '}
          <strong className="text-emerald-400 font-serif italic text-sm">{signerName || 'Authorized Signer'}</strong>
          {acceptedDate && (
            <span>
              {' '}on {new Date(acceptedDate).toLocaleDateString()} at{' '}
              {new Date(acceptedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSign} className="space-y-5">
        <label className="flex items-start gap-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className="text-xs text-zinc-300 leading-relaxed select-none">
            I formally confirm that I have reviewed the deliverables, timeline, and milestone payment schedules. I agree that approving this contract binds my organization to the terms detailed above.
          </span>
        </label>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Typed Authorized Legal Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Jane Doe"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm font-serif italic focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white placeholder:text-zinc-600"
          />
        </div>

        <button
          type="submit"
          disabled={!agreed || !typedName.trim() || isSigning}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {isSigning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Signing Contract...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" /> Accept & Legally Sign Contract
            </>
          )}
        </button>
      </form>
    </div>
  );
}