import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ publicToken: token }, { id: token }],
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Log the view in audit logs
    await prisma.auditLog.create({
      data: {
        contractId: contract.id,
        event: 'CONTRACT_VIEWED',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('View tracking error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record view' },
      { status: 500 }
    );
  }
}