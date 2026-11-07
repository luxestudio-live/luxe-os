import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;

    let user = null;
    if (activeUserId) {
      user = await prisma.user.findUnique({
        where: { id: activeUserId },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });
    }

    if (!user) {
      // In development fallback if no cookie is set yet
      if (process.env.NODE_ENV !== 'production') {
        user = await prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN' },
          include: {
            memberships: {
              include: { organization: true },
            },
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ user: null, error: 'Unauthorized' }, { status: 401 });
    }

    const availableUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberships: {
          include: { organization: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const activeOrg = user.memberships[0]?.organization || null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        activeOrgId: activeOrg?.id,
        mustChangePassword: user.mustChangePassword,
        organization: activeOrg,
      },
      availableUsers: availableUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        organizationName: u.memberships[0]?.organization?.name || 'LuxeStudio',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching auth session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set('luxe_user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error switching user session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

