import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, pageUrl, category, priority, description, screenshotUrl } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    if (!projectId || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feedback = await prisma.prototypeFeedback.create({
      data: {
        projectId,
        pageUrl: pageUrl || 'https://kalajay.theluxestudio.in/',
        environment: 'Prototype',
        category: category || 'UI/UX',
        priority: priority || 'MEDIUM',
        description,
        screenshotUrl,
        submittedBy: user?.name || 'Client Reviewer',
        status: 'NEW',
      },
    });

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolutionNotes } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    if (!id) {
      return NextResponse.json({ error: 'Missing feedback ID' }, { status: 400 });
    }

    const updated = await prisma.prototypeFeedback.update({
      where: { id },
      data: {
        status,
        resolutionNotes,
        resolvedBy: user?.name || 'LuxeStudio PM',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

