import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, code } = body;

    console.log(`[REGISTER ATTEMPT] Email: ${email}, Code Submitted: ${code}`);

    // 1. Require all fields including the verification code
    if (!email || !password || !code) {
      return NextResponse.json(
        { error: 'Email, password, and verification code are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();

    // 2. Strict OTP lookup in database
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
      },
    });

    console.log('[TOKEN LOOKUP RESULT]:', tokenRecord);

    // If code does NOT exist in the database -> REJECT IMMEDIATELY
    if (!tokenRecord) {
      console.log('[VERIFICATION FAILED]: Code does not match database record.');
      return NextResponse.json(
        { error: 'Incorrect verification code. Please check your email.' },
        { status: 400 }
      );
    }

    // If code is expired -> REJECT
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      console.log('[VERIFICATION FAILED]: Code has expired.');
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // 4. Hash password and create verified user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || '',
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    // 5. Delete the token so it cannot ever be reused
    await prisma.verificationToken.deleteMany({
      where: { email: cleanEmail },
    });

    console.log(`[VERIFICATION SUCCESS] User created: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    console.error('Registration verification error:', error);
    return NextResponse.json(
      { error: error?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}