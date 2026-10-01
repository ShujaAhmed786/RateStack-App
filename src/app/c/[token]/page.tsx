import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SigningCard from './SigningCard';
import ContractAutoRefresh from './ContractAutoRefresh';
import MilestonePayButton from './MilestonePayButton';
import { 
  Shield, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  Building, 
  UserCheck, 
  Calendar 
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }> | { token: string };
}

export default async function PublicContractPage({ params }: PageProps) {
  const resolved = await params;
  const token = resolved?.token;

  if (!token) notFound();

  const contract = await prisma.contract.findFirst({
    where: {
      OR: [{ publicToken: token }, { id: token }],
    },
    include: {
      client: true,
      milestones: { orderBy: { sortOrder: 'asc' } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!contract) notFound();

  const contractAny = contract as any;
  const isAccepted = contract.status === 'ACCEPTED' || contract.status === 'COMPLETED';
  const isLegalOnly = 
    contractAny.type === 'STANDARD_LEGAL' || 
    !contract.milestones || 
    contract.milestones.length === 0;

  const partyAName = 
    contractAny.initiatorName || 
    contractAny.initiatorSignature || 
    contract.user?.name || 
    contract.user?.email || 
    'Originator';

  const partyASignature = contractAny.initiatorSignature || partyAName;
  const partyASignedAt = contractAny.initiatorSignedAt 
    ? new Date(contractAny.initiatorSignedAt) 
    : new Date(contract.createdAt);

  const partyBName = contract.client 
    ? `${contract.client.name}${contract.client.companyName ? ` (${contract.client.companyName})` : ''}` 
    : 'Recipient Client';

  // Sanitize Markdown artifacts for clean display
  const cleanedDescription = (contract.scopeDescription || '')
    .replace(/^#\s+/gm, '')
    .replace(/^###\s+/gm, '')
    .replace(/\*\*/g, '');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-emerald-500 selection:text-black py-10 px-4 sm:px-6">
      <ContractAutoRefresh
        token={token}
        initialStatus={contract.status}
        initialMilestones={contract.milestones.map((m) => ({ id: m.id, status: m.status }))}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Verification & Download Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>RateStack Cryptographically Sealed Agreement</span>
            <span className="font-mono text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
              {contract.publicToken.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Download Signed PDF Button */}
          {isAccepted && (
            <a
              href={`/api/contracts/${contract.publicToken}/pdf?print=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" /> Download Signed PDF
            </a>
          )}
        </div>

        {/* Accepted Confirmation Notice */}
        {isAccepted && (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Agreement Fully Executed & Locked</p>
                <p className="text-[11px] text-zinc-400">
                  Signed by <strong className="text-emerald-300">{contract.acceptedBySignature}</strong> on{' '}
                  {contract.acceptedAt ? new Date(contract.acceptedAt).toUTCString() : ''}
                </p>
              </div>
            </div>
            <a
              href={`/api/contracts/${contract.publicToken}/pdf?print=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              Get Official PDF &rarr;
            </a>
          </div>
        )}

        {/* Main Document Container */}
        <div className="bg-[#0f0f13] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {isLegalOnly ? (contractAny.templateCategory?.toUpperCase() || 'LEGAL AGREEMENT') : 'MILESTONE CONTRACT'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  {contract.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {contract.title}
              </h1>
              <p className="text-xs text-zinc-400 mt-2">
                Created: {new Date(contract.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Total Contract Value (Only shown if positive value) */}
            {Number(contract.totalValue) > 0 && (
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-0.5">
                  Total Contract Value
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: contract.currency || 'USD',
                  }).format(Number(contract.totalValue))}
                </span>
              </div>
            )}
          </div>

          {/* Party Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Party A (Initiator / Originator)
              </span>
              <p className="text-sm font-semibold text-zinc-200">{partyAName}</p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{contract.user?.email}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Party B (Recipient Client)
              </span>
              <p className="text-sm font-semibold text-zinc-200">{partyBName}</p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{contract.client?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Agreement Terms / Statement of Work */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              {isLegalOnly ? 'Agreement Terms & Covenants' : 'Statement of Work & Acceptance Criteria'}
            </h3>
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {cleanedDescription}
            </div>
          </div>

          {/* Milestone Schedule (Only displayed for Milestone Escrow contracts) */}
          {!isLegalOnly && contract.milestones.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-zinc-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Milestone Schedule & Payment Allocations
              </h3>

              <div className="space-y-3">
                {contract.milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                      </div>
                      {m.description && <p className="text-xs text-zinc-400 mt-1 pl-7">{m.description}</p>}
                      {m.dueDate && (
                        <p className="text-[11px] text-zinc-500 mt-1 pl-7 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {new Date(m.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: contract.currency || 'USD',
                        }).format(Number(m.amount))}
                      </span>
                      <MilestonePayButton
                        milestoneId={m.id}
                        status={m.status}
                        amount={Number(m.amount)}
                        currency={contract.currency}
                        paymentLink={contract.paymentLink}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dual Signature Audit Block */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Signatures & Legal Execution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Party A Execution Card */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Party A (Initiator)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Signed & Verified
                  </span>
                </div>
                <div className="font-serif italic text-lg text-white">
                  {partyASignature}
                </div>
                <p className="text-[10.5px] text-zinc-500 font-mono">
                  Executed on {partyASignedAt.toLocaleDateString()}
                </p>
              </div>

              {/* Party B Execution Card */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Party B (Recipient)
                  </span>
                  {isAccepted ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      Signed & Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                      Pending Signature
                    </span>
                  )}
                </div>
                <div className="font-serif italic text-lg text-white">
                  {contract.acceptedBySignature || 'Pending Counter-Signature'}
                </div>
                <p className="text-[10.5px] text-zinc-500 font-mono">
                  {contract.acceptedAt ? `Signed on ${new Date(contract.acceptedAt).toLocaleDateString()}` : 'Awaiting client sign-off'}
                </p>
              </div>
            </div>
          </div>

          {/* E-Signature Input Card (Rendered for recipient if still pending) */}
          <div className="pt-2">
            <SigningCard
              token={token}
              isAccepted={isAccepted}
              signerName={contract.acceptedBySignature}
              acceptedAt={contract.acceptedAt ? new Date(contract.acceptedAt).toISOString() : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}