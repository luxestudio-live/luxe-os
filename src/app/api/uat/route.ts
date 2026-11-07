import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, title, description, environment, pageUrl, severity } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    if (!projectId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    if (!id) {
      return NextResponse.json({ error: 'Missing issue ID' }, { status: 400 });
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

