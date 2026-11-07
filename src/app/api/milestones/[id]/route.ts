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
    const { status, progress, blockers, clientActionRequired, taskId, taskCompleted } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    const milestone = await prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Toggle specific task if requested
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          isCompleted: taskCompleted,
          completedAt: taskCompleted ? new Date() : null,
        },
      });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'COMPLETED') {
        dataToUpdate.progress = 100;
        dataToUpdate.completedDate = new Date();
        dataToUpdate.clientActionRequired = false;
      }
    }
    if (progress !== undefined) dataToUpdate.progress = progress;
    if (blockers !== undefined) dataToUpdate.blockers = blockers;
    if (clientActionRequired !== undefined) dataToUpdate.clientActionRequired = clientActionRequired;

    const updated = await prisma.milestone.update({
      where: { id },
      data: dataToUpdate,
    });

    // Recalculate project overallProgress
    const allMilestones = await prisma.milestone.findMany({
      where: { projectId: milestone.projectId },
    });
    const avgProgress = Math.round(
      allMilestones.reduce((acc, m) => acc + m.progress, 0) / (allMilestones.length || 1)
    );

    await prisma.project.update({
      where: { id: milestone.projectId },
      data: { overallProgress: avgProgress },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userEmail: user?.email || 'admin@theluxestudio.in',
        action: 'UPDATE_MILESTONE',
        entityType: 'Milestone',
        entityId: id,
        details: `Updated milestone "${milestone.title}" (Status: ${updated.status}, Progress: ${updated.progress}%)`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

