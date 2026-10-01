import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const milestoneId = resolvedParams?.id;

    console.log('[MILESTONE_COMPLETE] Received request for ID:', milestoneId);

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // 1. Fetch the target milestone and all sibling milestones for this contract
    const currentMilestone = await prisma.milestone.findUnique({
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

    if (!currentMilestone) {
      console.error('[MILESTONE_COMPLETE] Milestone not found in DB:', milestoneId);
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const contractMilestones = currentMilestone.contract.milestones;
    const nextMilestone = contractMilestones.find(
      (m: any) => m.sortOrder > currentMilestone.sortOrder && String(m.status).toUpperCase() !== 'COMPLETED'
    );

    // 2. Perform updates
    // Update current milestone to COMPLETED
    await prisma.milestone.update({
      where: { id: currentMilestone.id },
      data: {
        status: 'COMPLETED' as any,
        completedAt: new Date(),
      },
    });

    // Update next milestone to IN_PROGRESS if exists
    if (nextMilestone) {
      await prisma.milestone.update({
        where: { id: nextMilestone.id },
        data: {
          status: 'IN_PROGRESS' as any,
        },
      });
    }

    // Check if all milestones are now COMPLETED
    const remainingIncomplete = contractMilestones.filter(
      (m: any) => m.id !== currentMilestone.id && String(m.status).toUpperCase() !== 'COMPLETED'
    );

    if (remainingIncomplete.length === 0) {
      await prisma.contract.update({
        where: { id: currentMilestone.contractId },
        data: {
          status: 'COMPLETED' as any,
        },
      });
    }

    // 3. Log Audit Entry (wrapped in try/catch so audit failure doesn't block the action)
    try {
      await prisma.auditLog.create({
        data: {
          contractId: currentMilestone.contractId,
          event: 'MILESTONE_COMPLETED',
          metadata: {
            milestoneId: currentMilestone.id,
            title: currentMilestone.title,
            completedAt: new Date().toISOString(),
          },
        },
      });
    } catch (auditErr) {
      console.warn('[MILESTONE_COMPLETE] Non-fatal audit log warning:', auditErr);
    }

    console.log('[MILESTONE_COMPLETE] Successfully completed milestone:', milestoneId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[MILESTONE_COMPLETE_ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete milestone' },
      { status: 500 }
    );
  }
}