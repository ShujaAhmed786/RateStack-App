import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contracts = await prisma.contract.findMany({
      where: { userId: session.user.id },
      include: {
        client: true,
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contracts });
  } catch (error: any) {
    console.error('Fetch contracts error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId,
      title,
      scopeDescription,
      totalValue,
      currency = 'USD',
      paymentLink,
      type = 'MILESTONE',
      templateCategory,
      milestones = [],
    } = body;

    // Baseline validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Contract title is required' }, { status: 400 });
    }

    const isLegalContract = type === 'STANDARD_LEGAL';

    // Milestones are ONLY mandatory for MILESTONE contracts
    if (!isLegalContract && (!milestones || milestones.length === 0)) {
      return NextResponse.json({ error: 'Milestone contracts require at least one milestone.' }, { status: 400 });
    }

    // Create the contract in Prisma
    const contract = await prisma.contract.create({
      data: {
        userId: session.user.id,
        clientId: clientId || null,
        title: title.trim(),
        scopeDescription: scopeDescription || '',
        totalValue: Number(totalValue) || 0,
        currency,
        paymentLink: paymentLink || null,
        type: isLegalContract ? 'STANDARD_LEGAL' : 'MILESTONE',
        templateCategory: templateCategory || null,
        status: 'SENT',

        // Record Initiator (Party A) signature at creation
        initiatorName: body.initiatorName?.trim() || session.user.name || 'Originator',
        initiatorSignature: body.initiatorName?.trim() || session.user.name || 'Originator',
        initiatorSignedAt: new Date(),

        milestones: {
          create: isLegalContract
            ? []
            : milestones.map((m: any, idx: number) => ({
                title: m.title || `Milestone ${idx + 1}`,
                description: m.description || null,
                percentage: Number(m.percentage) || 0,
                amount: Number(m.amount) || 0,
                dueDate: m.dueDate ? new Date(m.dueDate) : null,
                sortOrder: idx,
                status: 'PENDING',
              })),
        },
      },
      include: {
        client: true,
        milestones: true,
      },
    });

    return NextResponse.json({
      success: true,
      contract,
      shareUrl: `/c/${contract.publicToken}`,
    });
  } catch (error: any) {
    console.error('Contract creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create contract' },
      { status: 500 }
    );
  }
}