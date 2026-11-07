import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, value, fileUrl, status, rejectionReason } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    const requirement = await prisma.requirement.findUnique({ where: { id } });
    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    let updated;
    if (action === 'submit') {
      // Client submits requirement response
      updated = await prisma.requirement.update({
        where: { id },
        data: {
          value: value !== undefined ? value : requirement.value,
          fileUrl: fileUrl !== undefined ? fileUrl : requirement.fileUrl,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          submittedBy: user?.name || 'Client Collaborator',
        },
      });

      // Log activity
      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          userEmail: user?.email || 'client@org.com',
          action: 'SUBMIT_REQUIREMENT',
          entityType: 'Requirement',
          entityId: id,
          details: `Client submitted requirement: "${requirement.title}"`,
        },
      });
    } else if (action === 'review') {
      // Admin reviews submission
      const newStatus = status === 'ACCEPTED' ? 'ACCEPTED' : 'NEEDS_REVISION';
      updated = await prisma.requirement.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: user?.name || 'LuxeStudio PM',
          rejectionReason: newStatus === 'NEEDS_REVISION' ? rejectionReason : null,
        },
      });

      // Log activity
      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          userEmail: user?.email || 'admin@theluxestudio.in',
          action: 'REVIEW_REQUIREMENT',
          entityType: 'Requirement',
          entityId: id,
          details: `LuxeStudio reviewed requirement "${requirement.title}" -> ${newStatus}`,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating requirement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

