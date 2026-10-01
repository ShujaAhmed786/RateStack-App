import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    const sessionUserId = session?.user?.id;
    const sessionEmail = session?.user?.email;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ clients: [] }, { status: 401 });
    }

    // Verify the user exists in the database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          sessionUserId ? { id: sessionUserId } : {},
          sessionEmail ? { email: sessionEmail.toLowerCase() } : {},
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ clients: [] }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: { userId: user.id } as any,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUserId = session?.user?.id;
    const sessionEmail = session?.user?.email;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Look up the actual user in the DB to ensure foreign key validity
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          sessionUserId ? { id: sessionUserId } : {},
          sessionEmail ? { email: sessionEmail.toLowerCase() } : {},
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Session expired or user not found. Please log in again.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, companyName, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        userId: user.id, // Confirmed valid foreign key
        name,
        companyName: companyName || null,
        email,
      } as any,
    });

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('Failed to create client:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}