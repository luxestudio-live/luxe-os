import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = (forwardedFor ? forwardedFor.split(',')[0] : realIp || '127.0.0.1').trim();

    const body = await request.json();
    const { email, username, identifier, password } = body;
    const loginIdentifier = (identifier || username || email || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'User ID or Email and password are required' },
        { status: 400 }
      );
    }

    // Brute-force rate limiting: 5 attempts per 15 minutes per IP + user combination
    const rateLimitKey = `login:${clientIp}:${loginIdentifier}`;
    const rateCheck = checkRateLimit(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please wait ${Math.ceil(rateCheck.resetInSeconds / 60)} minutes before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
          },
        }
      );
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier },
        ],
      },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user && (
      loginIdentifier === 'admin' ||
      loginIdentifier === 'rahul' ||
      loginIdentifier === 'admin@theluxestudio.in' || 
      loginIdentifier === 'rahul@theluxestudio.in' || 
      loginIdentifier === 'rahul.kushwaha@theluxestudio.in'
    )) {
      user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });
    }

    if (!user && (
      loginIdentifier === 'nitin' ||
      loginIdentifier === 'nitin@theluxestudio.in' || 
      loginIdentifier === 'nitin.chandnani@theluxestudio.in'
    )) {
      user = await prisma.user.findFirst({
        where: { role: 'LUXE_PM' },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid User ID or password' },
        { status: 401 }
      );
    }

    // Compare bcrypt password hash securely
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid User ID or password' },
        { status: 401 }
      );
    }

    // Clear rate limit on successful authentication
    resetRateLimit(rateLimitKey);

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set('luxe_user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Determine default redirect surface based on role
    const isStudioStaff =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'LUXE_PM' ||
      user.role === 'INTERNAL_TEAM';

    const redirectUrl = isStudioStaff ? '/admin' : '/';

    return NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    const safeError =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected authentication error occurred. Please try again.'
        : error.message;
    return NextResponse.json({ error: safeError }, { status: 500 });
  }
}

