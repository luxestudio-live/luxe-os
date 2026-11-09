import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;

    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isInternal =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'LUXE_PM' ||
      user.role === 'INTERNAL_TEAM';

    let project;

    if (id === 'default') {
      if (user.role === 'SUPER_ADMIN') {
        // Default to Kalajay or first available project
        project = await prisma.project.findFirst({
          where: {
            OR: [
              { slug: 'kalajay-ecommerce' },
              { name: { contains: 'Kalajay', mode: 'insensitive' } },
            ],
          },
          include: getProjectIncludes(isInternal),
        });
        if (!project) {
          project = await prisma.project.findFirst({
            orderBy: { createdAt: 'desc' },
            include: getProjectIncludes(isInternal),
          });
        }
      } else if (user.role === 'LUXE_PM' || user.role === 'INTERNAL_TEAM') {
        // Nitin gets project assigned to him or created by him
        project = await prisma.project.findFirst({
          where: {
            OR: [
              { assignedPmId: user.id },
              { createdById: user.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: getProjectIncludes(isInternal),
        });
        if (!project) {
          project = await prisma.project.findFirst({
            orderBy: { createdAt: 'desc' },
            include: getProjectIncludes(isInternal),
          });
        }
      } else {
        // Client gets ONLY their own organization project
        const userWithMemberships = await prisma.user.findUnique({
          where: { id: user.id },
          include: { memberships: true },
        });
        const orgIds = [
          ...(user.activeOrgId ? [user.activeOrgId] : []),
          ...(userWithMemberships?.memberships?.map((m) => m.organizationId) || []),
        ].filter(Boolean);

        if (orgIds.length === 0) {
          return NextResponse.json({ error: 'No project assigned to your account' }, { status: 404 });
        }

        project = await prisma.project.findFirst({
          where: { organizationId: { in: orgIds } },
          orderBy: { createdAt: 'desc' },
          include: getProjectIncludes(isInternal),
        });
      }
    } else {
      // Direct project ID lookup
      project = await prisma.project.findUnique({
        where: { id },
        include: getProjectIncludes(isInternal),
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Strict Access Enforcement for Subordinate PM (Nitin):
      if (
        user.role === 'LUXE_PM' &&
        project.assignedPmId !== user.id &&
        project.createdById !== user.id
      ) {
        return NextResponse.json(
          { error: 'Access Denied: You do not have permission to view this project.' },
          { status: 403 }
        );
      }

      // Strict Access Enforcement for Client Stakeholders:
      // A client CANNOT access or view any project belonging to a different organization
      if (!isInternal) {
        const userWithMemberships = await prisma.user.findUnique({
          where: { id: user.id },
          include: { memberships: true },
        });
        const orgIds = [
          ...(user.activeOrgId ? [user.activeOrgId] : []),
          ...(userWithMemberships?.memberships?.map((m) => m.organizationId) || []),
        ].filter(Boolean);

        if (!orgIds.includes(project.organizationId)) {
          return NextResponse.json(
            { error: 'Access Denied: You do not have permission to view this project.' },
            { status: 403 }
          );
        }
      }
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const activeUserId = request.headers.get('x-user-id') || cookieStore.get('luxe_user_id')?.value;

    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Role verification: Clients cannot mutate project settings
    if (
      user.role === 'CLIENT_OWNER' ||
      user.role === 'CLIENT_COLLABORATOR' ||
      user.role === 'CLIENT_VIEWER'
    ) {
      return NextResponse.json(
        { error: 'Access Denied: Only studio administration can modify project settings.' },
        { status: 403 }
      );
    }

    // Role verification: Nitin can only mutate assigned projects
    if (
      user.role === 'LUXE_PM' &&
      existingProject.assignedPmId !== user.id &&
      existingProject.createdById !== user.id
    ) {
      return NextResponse.json(
        { error: 'Access Denied: You cannot update this project.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body.action === 'reset_client_password') {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: existingProject.organizationId,
          role: 'OWNER',
        },
        include: { user: true },
      });

      if (!membership || !membership.user) {
        return NextResponse.json({ error: 'Client user not found for this project' }, { status: 404 });
      }

      const newPass = body.customPassword?.trim() || `Luxe-${Math.floor(1000 + Math.random() * 9000)}!`;
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(newPass, 10);

      await prisma.user.update({
        where: { id: membership.user.id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      return NextResponse.json({
        success: true,
        credentials: {
          clientName: existingProject.name,
          userId: membership.user.username || membership.user.email,
          email: membership.user.email,
          temporaryPassword: newPass,
          portalUrl: `${process.env.APP_URL || 'https://client.theluxestudio.in'}/login`,
        },
      });
    }

    const {
      status,
      currentPhase,
      targetDate,
      goLiveDate,
      hypercareDays,
      overallProgress,
      prototypeUrl,
      stagingUrl,
      productionUrl,
      assignedPmId,
    } = body;

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      // If moving to HYPERCARE and goLiveDate is not set, auto-set to current date
      if (status === 'HYPERCARE' && !existingProject.goLiveDate && !goLiveDate) {
        updateData.goLiveDate = new Date();
      }
    }

    if (currentPhase !== undefined) updateData.currentPhase = currentPhase;
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
    if (goLiveDate !== undefined) updateData.goLiveDate = goLiveDate ? new Date(goLiveDate) : null;
    if (hypercareDays !== undefined) updateData.hypercareDays = Number(hypercareDays);
    if (overallProgress !== undefined) updateData.overallProgress = Number(overallProgress);
    if (prototypeUrl !== undefined) updateData.prototypeUrl = prototypeUrl;
    if (stagingUrl !== undefined) updateData.stagingUrl = stagingUrl;
    if (productionUrl !== undefined) updateData.productionUrl = productionUrl;

    if (user.role === 'SUPER_ADMIN' && assignedPmId !== undefined) {
      const pm = await prisma.user.findUnique({ where: { id: assignedPmId } });
      if (pm) {
        updateData.assignedPmId = pm.id;
        updateData.assignedPmName = pm.name;
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'UPDATE_PROJECT_TIMELINE',
        entityType: 'Project',
        entityId: id,
        details: `Updated timeline/status to ${updatedProject.status}, Hypercare: ${updatedProject.hypercareDays} days, Go-Live: ${updatedProject.goLiveDate}`,
      },
    });

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    console.error('Error updating project:', error);
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
    const activeUserId = request.headers.get('x-user-id') || cookieStore.get('luxe_user_id')?.value;

    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can delete projects' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete associated items
    await prisma.milestone.deleteMany({ where: { projectId: id } });
    await prisma.requirement.deleteMany({ where: { projectId: id } });
    await prisma.deliverable.deleteMany({ where: { projectId: id } });
    await prisma.document.deleteMany({ where: { projectId: id } });
    await prisma.prototypeFeedback.deleteMany({ where: { projectId: id } });
    await prisma.approvalRequest.deleteMany({ where: { projectId: id } });
    await prisma.uatIssue.deleteMany({ where: { projectId: id } });
    await prisma.maintenanceRecord.deleteMany({ where: { projectId: id } });
    await prisma.discussionThread.deleteMany({ where: { projectId: id } });
    await prisma.projectUpdate.deleteMany({ where: { projectId: id } });
    await prisma.meetingDecision.deleteMany({ where: { projectId: id } });

    await prisma.project.delete({ where: { id } });

    // Clean up client organization & users if no other projects remain
    const otherProjects = await prisma.project.count({
      where: { organizationId: project.organizationId },
    });

    if (otherProjects === 0 && project.organization.slug !== 'luxestudio') {
      const memberships = await prisma.organizationMembership.findMany({
        where: { organizationId: project.organizationId },
      });
      for (const m of memberships) {
        await prisma.user.deleteMany({
          where: {
            id: m.userId,
            role: { in: ['CLIENT_OWNER', 'CLIENT_COLLABORATOR', 'CLIENT_VIEWER'] },
          },
        });
      }
      await prisma.organization.delete({
        where: { id: project.organizationId },
      });
    }

    return NextResponse.json({ success: true, message: 'Project successfully deleted' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getProjectIncludes(isInternal: boolean) {
  return {
    organization: true,
    milestones: {
      orderBy: { sequence: 'asc' as const },
      include: {
        tasks: { orderBy: { createdAt: 'asc' as const } },
        requirements: true,
      },
    },
    requirements: {
      orderBy: [{ sequence: 'asc' as const }, { createdAt: 'asc' as const }],
    },
    deliverables: {
      orderBy: { createdAt: 'asc' as const },
    },
    documents: {
      where: isInternal ? {} : { isInternalOnly: false },
      orderBy: { createdAt: 'desc' as const },
    },
    feedbacks: {
      orderBy: { createdAt: 'desc' as const },
    },
    uatIssues: {
      orderBy: { createdAt: 'desc' as const },
    },
    updates: {
      where: isInternal ? {} : { isInternalOnly: false },
      orderBy: { createdAt: 'desc' as const },
    },
  };
}
