import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    let milestoneId = resolvedParams?.id;

    if (!milestoneId) {
      try {
        const body = await req.json();
        milestoneId = body?.milestoneId;
      } catch (e) {}
    }

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Mark as PAYMENT_SUBMITTED pending seller confirmation
    await (prisma.milestone as any).update({
      where: { id: milestone.id },
      data: {
        status: 'PAYMENT_SUBMITTED',
      },
    });

    await prisma.auditLog.create({
      data: {
        contractId: milestone.contractId,
        event: 'CLIENT_PAYMENT_SUBMITTED',
        metadata: {
          milestoneId: milestone.id,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Payment submission failed' }, { status: 500 });
  }
}