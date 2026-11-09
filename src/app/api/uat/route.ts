import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, title, description, environment, pageUrl, severity } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: activeUserId },
      include: { memberships: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!projectId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify project authorization
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isStudioStaff =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'LUXE_PM' ||
      user.role === 'INTERNAL_TEAM';

    const belongsToOrg = user.memberships.some((m) => m.organizationId === project.organizationId);

    if (!isStudioStaff && !belongsToOrg) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const issue = await prisma.uatIssue.create({
      data: {
        projectId,
        title,
        description,
        environment: environment || 'Staging',
        pageUrl,
        severity: severity || 'MEDIUM',
        status: 'NEW',
        submittedBy: user?.name || 'Client Tester',
      },
    });

    return NextResponse.json(issue);
  } catch (error: any) {
    console.error('Error creating UAT issue:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolutionNotes, clientConfirmed } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: activeUserId },
      include: { memberships: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing issue ID' }, { status: 400 });
    }

    const issue = await prisma.uatIssue.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const isStudioStaff =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'LUXE_PM' ||
      user.role === 'INTERNAL_TEAM';

    const belongsToOrg = user.memberships.some(
      (m) => m.organizationId === issue.project.organizationId
    );

    if (!isStudioStaff && !belongsToOrg) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (resolutionNotes !== undefined) dataToUpdate.resolutionNotes = resolutionNotes;
    if (clientConfirmed !== undefined) {
      dataToUpdate.clientConfirmed = clientConfirmed;
      if (clientConfirmed) {
        dataToUpdate.status = 'CLOSED';
        dataToUpdate.verifiedBy = user?.name || 'Client Verifier';
      }
    }

    const updated = await prisma.uatIssue.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating UAT issue:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

