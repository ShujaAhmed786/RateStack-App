import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await context.params;
    const identifier = resolved?.id;

    if (!identifier) {
      return NextResponse.json({ error: 'Contract identifier is required' }, { status: 400 });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ id: identifier }, { publicToken: identifier }],
      },
      include: {
        client: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contractAny = contract as any;
    const isLegalOnly = contractAny.type === 'STANDARD_LEGAL' || !contract.milestones || contract.milestones.length === 0;
    const partyAName = contractAny.initiatorName || contractAny.initiatorSignature || contract.user?.name || contract.user?.email || 'Originator';
    const partyASignature = contractAny.initiatorSignature || partyAName;
    const partyASignedAt = contractAny.initiatorSignedAt ? new Date(contractAny.initiatorSignedAt).toUTCString() : new Date(contract.createdAt).toUTCString();

    const partyBName = contract.client ? `${contract.client.name}${contract.client.companyName ? ` (${contract.client.companyName})` : ''}` : 'Recipient Party';
    const partyBSignature = contract.acceptedBySignature;
    const partyBSignedAt = contract.acceptedAt ? new Date(contract.acceptedAt).toUTCString() : null;

    // Sanitize and format legal text
    const formattedContent = (contract.scopeDescription || '')
      .replace(/^#\s+/gm, '')
      .replace(/^###\s+/gm, '')
      .replace(/\*\*/g, '');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${contract.title} - Signed Agreement</title>
  <style>
    @page { 
      size: letter; 
      margin: 0.8in; 
    }
    * {
      box-sizing: border-box;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      color: #18181b; 
      line-height: 1.6; 
      margin: 0; 
      padding: 24px; 
      background: #ffffff;
    }
    .no-print { 
      margin-bottom: 24px; 
      display: flex; 
      justify-content: flex-end; 
    }
    .print-btn { 
      background: #10b981; 
      color: #000000; 
      border: none; 
      padding: 10px 20px; 
      border-radius: 8px; 
      font-weight: 700; 
      font-size: 13px; 
      cursor: pointer; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header { 
      border-bottom: 2px solid #e4e4e7; 
      padding-bottom: 16px; 
      margin-bottom: 24px; 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
    }
    .title { 
      font-size: 24px; 
      font-weight: 800; 
      color: #09090b; 
      margin: 0 0 6px 0; 
      letter-spacing: -0.5px;
    }
    .subtitle { 
      font-size: 12px; 
      color: #71717a; 
      font-family: monospace; 
      margin: 0; 
    }
    .badge { 
      font-size: 11px; 
      font-weight: 700; 
      text-transform: uppercase; 
      background: #ecfdf5; 
      color: #047857; 
      border: 1px solid #a7f3d0; 
      padding: 4px 12px; 
      border-radius: 9999px; 
    }
    .meta-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
      background: #f8fafc; 
      padding: 16px; 
      border-radius: 8px; 
      border: 1px solid #e2e8f0; 
      margin-bottom: 24px; 
    }
    .meta-item label { 
      font-size: 10px; 
      text-transform: uppercase; 
      font-weight: 700; 
      color: #64748b; 
      display: block; 
      margin-bottom: 3px; 
    }
    .meta-item span { 
      font-size: 13px; 
      color: #0f172a; 
      font-weight: 600; 
    }
    .content-box { 
      white-space: pre-wrap; 
      font-size: 13px; 
      color: #27272a; 
      line-height: 1.8; 
      margin-bottom: 32px; 
      padding: 4px 0;
    }
    .milestones-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 32px; 
    }
    .milestones-table th { 
      background: #f4f4f5; 
      text-align: left; 
      padding: 10px; 
      font-size: 11px; 
      text-transform: uppercase; 
      color: #52525b; 
      border-bottom: 1px solid #e4e4e7; 
    }
    .milestones-table td { 
      padding: 12px 10px; 
      border-bottom: 1px solid #f4f4f5; 
      font-size: 12px; 
    }
    .dual-sig-container { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-top: 36px; 
      page-break-inside: avoid; 
    }
    .sig-card { 
      border: 1px solid #cbd5e1; 
      background: #f8fafc; 
      border-radius: 8px; 
      padding: 18px; 
    }
    .sig-role { 
      font-size: 11px; 
      font-weight: 700; 
      text-transform: uppercase; 
      color: #475569; 
      margin-bottom: 8px; 
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .sig-name { 
      font-family: Georgia, "Times New Roman", serif; 
      font-style: italic; 
      font-size: 22px; 
      color: #0f172a; 
      margin-bottom: 6px; 
    }
    .sig-meta { 
      font-size: 10.5px; 
      color: #64748b; 
      line-height: 1.5; 
    }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      font-size: 11px; 
      color: #a1a1aa; 
      border-top: 1px solid #f4f4f5; 
      padding-top: 16px; 
      font-family: monospace;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">${contract.title}</h1>
      <p class="subtitle">AUDIT REF: ${contract.publicToken.toUpperCase()}</p>
    </div>
    <div>
      <span class="badge">${contract.status}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <label>Party A (Originator / Initiator)</label>
      <span>${partyAName}</span>
    </div>
    <div class="meta-item">
      <label>Party B (Recipient / Client)</label>
      <span>${partyBName}</span>
    </div>
    <div class="meta-item">
      <label>Agreement Date</label>
      <span>${new Date(contract.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="meta-item">
      <label>Contract Valuation</label>
      <span>${Number(contract.totalValue) > 0 ? `${contract.currency}${Number(contract.totalValue).toLocaleString()}` : 'Binding Legal Agreement'}</span>
    </div>
  </div>

  <div class="content-box">${formattedContent}</div>

  ${!isLegalOnly && contract.milestones && contract.milestones.length > 0 ? `
    <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #52525b; margin-bottom: 8px; letter-spacing: 0.5px;">
      Milestone Payment Schedule
    </h3>
    <table class="milestones-table">
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Deliverable Scope</th>
          <th>Allocation</th>
          <th>Amount (${contract.currency})</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${contract.milestones.map((m, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>
              <strong>${m.title}</strong>
              ${m.description ? `<br><span style="color: #71717a; font-size: 11px;">${m.description}</span>` : ''}
              ${m.dueDate ? `<br><span style="color: #94a3b8; font-size: 10px;">Target: ${new Date(m.dueDate).toLocaleDateString()}</span>` : ''}
            </td>
            <td>${Number(m.percentage)}%</td>
            <td><strong>${Number(m.amount).toLocaleString()}</strong></td>
            <td><span style="font-size: 10px; font-weight: 700; text-transform: uppercase;">${m.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <!-- Dual-Party Digital Execution Block -->
  <div class="dual-sig-container">
    <!-- Party A -->
    <div class="sig-card">
      <div class="sig-role">Party A: Initiator / Disclosing Party</div>
      <div class="sig-name">${partyASignature}</div>
      <div class="sig-meta">
        Digitally Executed: ${partyASignedAt}<br>
        Signatory: ${partyAName}<br>
        Status: <strong style="color: #047857;">VERIFIED & RECORDED</strong>
      </div>
    </div>

    <!-- Party B -->
    <div class="sig-card">
      <div class="sig-role">Party B: Counterparty / Client</div>
      ${partyBSignature ? `
        <div class="sig-name">${partyBSignature}</div>
        <div class="sig-meta">
          Digitally Signed: ${partyBSignedAt}<br>
          Signatory: ${partyBName}<br>
          Status: <strong style="color: #047857;">VERIFIED & ACCEPTED</strong>
        </div>
      ` : `
        <div style="font-size: 12px; color: #94a3b8; font-style: italic; padding: 14px 0;">
          Awaiting authorized counter-signature
        </div>
        <div class="sig-meta">
          Status: <span style="color: #b45309;">PENDING SIGN-OFF</span>
        </div>
      `}
    </div>
  </div>

  <div class="footer">
    Cryptographically sealed by RateStack Engine • Token: ${contract.publicToken}
  </div>

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = function() {
        window.print();
      };
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('PDF route error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to render PDF' }, { status: 500 });
  }
}