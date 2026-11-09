import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, milestoneId, title, content, type, isInternalOnly } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: activeUserId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStudioStaff =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'LUXE_PM' ||
      user.role === 'INTERNAL_TEAM';

    if (!isStudioStaff) {
      return NextResponse.json(
        { error: 'Forbidden: Only studio staff can publish updates' },
        { status: 403 }
      );
    }

    if (!projectId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        milestoneId,
        title,
        content,
        type: type || 'PROGRESS',
        isInternalOnly: Boolean(isInternalOnly),
        authorName: user?.name || 'LuxeStudio Core Team',
      },
    });

    return NextResponse.json(update);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

