import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET: Contract details (by UUID id or publicToken)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const identifier = resolvedParams?.id;

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const session = await auth();

    let contract = await prisma.contract.findFirst({
      where: {
        OR: [{ id: identifier }, { publicToken: identifier }],
      },
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
        client: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.id === identifier && session?.user?.id && contract.userId && contract.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error('Fetch contract error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch contract' }, { status: 500 });
  }
}

// POST: Public Client Signing
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const identifier = resolvedParams?.id;
    const body = await req.json();
    const { signatureName } = body;

    if (!signatureName || !signatureName.trim()) {
      return NextResponse.json({ error: 'Signature name is required' }, { status: 400 });
    }

    // Find contract by publicToken or id
    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ publicToken: identifier }, { id: identifier }],
      },
      include: { milestones: true },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Update contract status to ACCEPTED
    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: 'ACCEPTED',
        acceptedBySignature: signatureName.trim(),
        acceptedAt: new Date(),
      },
    });

    // Create an audit entry
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
    console.error('Sign contract error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to sign contract' }, { status: 500 });
  }
}