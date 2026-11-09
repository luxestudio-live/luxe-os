import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const approvals = await prisma.approvalRequest.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { createdAt: 'desc' },
      include: { milestone: true },
    });

    return NextResponse.json(approvals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, milestoneId, subject, description, deliverableVersion, requestedFrom } = body;

    const approval = await prisma.approvalRequest.create({
      data: {
        projectId,
        milestoneId,
        subject,
        description,
        deliverableVersion: deliverableVersion || 'v1.0',
        requestedFrom: requestedFrom || 'Client Executive Stakeholder',
        requestedRole: 'CLIENT_OWNER',
        status: 'PENDING',
      },
    });

    return NextResponse.json(approval);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: activeUserId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, decisionNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status, // APPROVED or CHANGES_REQUESTED
        decisionNotes,
        decidedAt: new Date(),
        decidedBy: user.name || 'Client Stakeholder',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

