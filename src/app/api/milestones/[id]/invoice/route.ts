import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { MilestoneInvoiceDoc } from '@/lib/pdf/invoiceTemplate';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const milestoneId = resolvedParams?.id;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    const milestone: any = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Auto-generate invoice number if missing
    let invoiceNumber = milestone.invoiceNumber;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      invoiceNumber = `INV-${year}-${milestone.id.slice(0, 8).toUpperCase()}`;
      try {
        await (prisma.milestone as any).update({
          where: { id: milestone.id },
          data: { invoiceNumber },
        });
      } catch (e) {
        console.warn('Could not persist invoiceNumber to DB:', e);
      }
    }

    const element = React.createElement(MilestoneInvoiceDoc as any, {
      invoiceNumber,
      issueDate: (milestone.paidAt || milestone.completedAt || new Date()).toLocaleDateString(),
      client: milestone.contract.client,
      contractTitle: milestone.contract.title,
      milestoneTitle: milestone.title,
      milestoneDescription: milestone.description,
      amount: Number(milestone.amount),
      currency: milestone.contract.currency,
      paidAt: milestone.paidAt ? new Date(milestone.paidAt).toLocaleDateString() : null,
    });

    const pdfBuffer = await renderToBuffer(element as any);

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF invoice generation error:', error);
    return NextResponse.json({ error: error.message || 'Invoice error' }, { status: 500 });
  }
}