import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { email: cleanEmail },
    });

    await prisma.verificationToken.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    // Send email to ANY address
    await transporter.sendMail({
      from: `"RateStack" <${process.env.EMAIL_SERVER_USER}>`,
      to: cleanEmail,
      subject: `Your RateStack Code: ${code}`,
      html: `
        <div style="font-family: sans-serif; background-color: #09090b; color: #fafafa; padding: 32px; border-radius: 12px; max-width: 460px; margin: auto;">
          <h2 style="color: #10b981; margin: 0 0 12px 0;">Verify Your Email</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">Use the verification code below to complete your registration for RateStack:</p>
          <div style="background-color: #18181b; padding: 18px; border-radius: 10px; text-align: center; border: 1px solid #27272a; margin-bottom: 20px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #71717a; font-size: 12px; margin: 0;">This code expires in 10 minutes. If you did not request this, please disregard this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
}