import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, identifier, password } = body;
    const loginIdentifier = (identifier || username || email || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'User ID or Email and password are required' },
        { status: 400 }
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
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

