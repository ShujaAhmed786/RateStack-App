import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, signatureName } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!signatureName || !signatureName.trim()) {
      return NextResponse.json({ error: 'Legal signature name is required' }, { status: 400 });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ publicToken: token }, { id: token }],
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: 'ACCEPTED',
        acceptedBySignature: signatureName.trim(),
        acceptedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        contractId: contract.id,
        event: 'CONTRACT_ACCEPTED',
        metadata: {
          signedBy: signatureName.trim(),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, contract: updatedContract });
  } catch (error: any) {
    console.error('Signing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sign contract' },
      { status: 500 }
    );
  }
}