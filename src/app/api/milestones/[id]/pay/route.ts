import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const milestoneId = resolvedParams?.id;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            milestones: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Generate reference invoice number if not already assigned
    const year = new Date().getFullYear();
    const invoiceNumber =
      milestone.invoiceNumber ||
      `INV-${year}-${milestone.id.slice(0, 8).toUpperCase()}`;

    // 1. Mark this milestone as PAID
    const updated = await (prisma.milestone as any).update({
      where: { id: milestone.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        invoiceNumber,
      },
    });

    // 2. Unlock the next milestone to IN_PROGRESS if pending
    const siblingMilestones = milestone.contract.milestones;
    const nextMilestone = siblingMilestones.find(
      (m: any) =>
        m.sortOrder > milestone.sortOrder &&
        String(m.status).toUpperCase() !== 'PAID' &&
        String(m.status).toUpperCase() !== 'COMPLETED'
    );

    if (nextMilestone) {
      await (prisma.milestone as any).update({
        where: { id: nextMilestone.id },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    }

    // 3. Check if all milestones are now paid
    const remainingUnpaid = siblingMilestones.filter(
      (m: any) => m.id !== milestone.id && String(m.status).toUpperCase() !== 'PAID'
    );

    if (remainingUnpaid.length === 0) {
      await prisma.contract.update({
        where: { id: milestone.contractId },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // 4. Log the payment confirmation in AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          contractId: milestone.contractId,
          event: 'MILESTONE_PAYMENT_CONFIRMED',
          metadata: {
            milestoneId: milestone.id,
            amount: Number(milestone.amount),
            invoiceNumber,
            confirmedAt: new Date().toISOString(),
          },
        },
      });
    } catch (auditErr) {
      console.warn('Audit log creation warning:', auditErr);
    }

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment confirmation failed' },
      { status: 500 }
    );
  }
}