import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: activeUserId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

