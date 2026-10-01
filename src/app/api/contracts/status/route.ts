import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ publicToken: token }, { id: token }],
      },
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: contract.status,
      milestones: contract.milestones,
    });
  } catch (error: any) {
    console.error('Fetch status error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}