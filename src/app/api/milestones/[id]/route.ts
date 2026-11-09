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
    const {
      title,
      phase,
      description,
      targetDate,
      startDate,
      status,
      progress,
      sequence,
      responsibleTeam,
      blockers,
      clientActionRequired,
      taskId,
      taskCompleted,
    } = body;

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
        { error: 'Forbidden: Only studio staff can modify milestone progression' },
        { status: 403 }
      );
    }

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
    if (title !== undefined && title.trim()) dataToUpdate.title = title.trim();
    if (phase !== undefined && phase.trim()) dataToUpdate.phase = phase.trim();
    if (description !== undefined) dataToUpdate.description = description.trim();
    if (sequence !== undefined) dataToUpdate.sequence = Number(sequence);
    if (responsibleTeam !== undefined) dataToUpdate.responsibleTeam = responsibleTeam.trim();

    if (targetDate !== undefined) {
      dataToUpdate.targetDate = targetDate ? new Date(targetDate) : null;
    }
    if (startDate !== undefined) {
      dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    }

    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'COMPLETED') {
        dataToUpdate.progress = 100;
        dataToUpdate.completedDate = new Date();
        dataToUpdate.clientActionRequired = false;
      }
    }
    if (progress !== undefined) dataToUpdate.progress = Number(progress);
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
        details: `Updated milestone "${updated.title}" (Status: ${updated.status}, Progress: ${updated.progress}%, Target: ${updated.targetDate?.toISOString() || 'None'})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'Forbidden: Only studio staff can delete milestones' },
        { status: 403 }
      );
    }

    const milestone = await prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const projectId = milestone.projectId;

    // Delete milestone
    await prisma.milestone.delete({ where: { id } });

    // Re-index remaining milestones sequence
    const remaining = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { sequence: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].sequence !== i + 1) {
        await prisma.milestone.update({
          where: { id: remaining[i].id },
          data: { sequence: i + 1 },
        });
      }
    }

    // Recalculate project overallProgress
    const avgProgress = remaining.length > 0
      ? Math.round(remaining.reduce((acc, m) => acc + m.progress, 0) / remaining.length)
      : 0;

    await prisma.project.update({
      where: { id: projectId },
      data: { overallProgress: avgProgress },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email || 'admin@theluxestudio.in',
        action: 'DELETE_MILESTONE',
        entityType: 'Milestone',
        entityId: id,
        details: `Deleted milestone "${milestone.title}" from project ${projectId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Milestone "${milestone.title}" deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
