import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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

    const isStudioStaff =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'LUXE_PM' ||
      user.role === 'INTERNAL_TEAM';

    if (!isStudioStaff) {
      return NextResponse.json(
        { error: 'Forbidden: Only studio staff can create project milestones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      projectId,
      title,
      phase,
      description,
      targetDate,
      startDate,
      status = 'SCHEDULED',
      progress = 0,
      sequence,
      responsibleTeam = 'LuxeStudio Core Team',
    } = body;

    if (!projectId || !title?.trim()) {
      return NextResponse.json(
        { error: 'Project ID and Milestone Title are required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Determine sequence
    let finalSequence = sequence ? Number(sequence) : 0;
    if (!finalSequence) {
      const highestMilestone = await prisma.milestone.findFirst({
        where: { projectId },
        orderBy: { sequence: 'desc' },
      });
      finalSequence = (highestMilestone?.sequence || 0) + 1;
    }

    const newMilestone = await prisma.milestone.create({
      data: {
        projectId,
        sequence: finalSequence,
        title: title.trim(),
        phase: phase?.trim() || 'Execution',
        description: description?.trim() || `${title.trim()} phase deliverables & review gates.`,
        targetDate: targetDate ? new Date(targetDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        status,
        progress: Number(progress) || 0,
        responsibleTeam: responsibleTeam?.trim() || 'LuxeStudio Core Team',
      },
      include: {
        tasks: true,
      },
    });

    // Recalculate project overallProgress
    const allMilestones = await prisma.milestone.findMany({
      where: { projectId },
    });
    const avgProgress = Math.round(
      allMilestones.reduce((acc, m) => acc + m.progress, 0) / (allMilestones.length || 1)
    );

    await prisma.project.update({
      where: { id: projectId },
      data: { overallProgress: avgProgress },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email || 'admin@theluxestudio.in',
        action: 'CREATE_MILESTONE',
        entityType: 'Milestone',
        entityId: newMilestone.id,
        details: `Created new milestone "${newMilestone.title}" (Gate #${newMilestone.sequence}, Phase: ${newMilestone.phase})`,
      },
    });

    return NextResponse.json(newMilestone, { status: 201 });
  } catch (error: any) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
