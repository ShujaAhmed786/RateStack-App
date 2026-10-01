'use client';

import React, { useState } from 'react';
import { ExternalLink, FileDown, CheckCircle2, Clock } from 'lucide-react';

interface MilestonePayButtonProps {
  milestoneId: string;
  amount: number;
  currency: string;
  status: string;
  paymentLink?: string | null;
}

export default function MilestonePayButton({
  milestoneId,
  amount,
  currency,
  status,
  paymentLink,
}: MilestonePayButtonProps) {
  const [loading, setLoading] = useState(false);
  const statusUpper = (status || '').toUpperCase();
  const isPaid = statusUpper === 'PAID';
  const isPendingConfirmation = statusUpper === 'PAYMENT_SUBMITTED';

  const handlePay = async () => {
    setLoading(true);
    try {
      if (paymentLink) {
        window.open(paymentLink, '_blank', 'noopener,noreferrer');
      }

      const res = await fetch(`/api/milestones/${milestoneId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId }),
      });

      if (!res.ok) {
        alert('Could not submit payment notification.');
        return;
      }

      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Payment submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (isPaid) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Deposit Paid
        </span>
        <a
          href={`/api/milestones/${milestoneId}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
        >
          <FileDown className="w-3.5 h-3.5 text-emerald-400" /> Receipt (PDF)
        </a>
      </div>
    );
  }

  if (isPendingConfirmation) {
    return (
      <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
        <Clock className="w-3.5 h-3.5 animate-spin" /> Payment Sent — Awaiting Seller Confirmation
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handlePay}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {loading ? 'Submitting...' : `Pay Milestone (${currency} ${amount.toFixed(2)})`}
    </button>
  );
}