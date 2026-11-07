import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = request.headers.get('x-user-id') || cookieStore.get('luxe_user_id')?.value;

    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let whereClause: any = {};

    if (user.role === 'SUPER_ADMIN') {
      // Super Admin sees ALL projects across the entire studio
      whereClause = {};
    } else if (user.role === 'LUXE_PM' || user.role === 'INTERNAL_TEAM') {
      // Subordinate PM (Nitin) sees ONLY projects tagged to him
      whereClause = {
        OR: [
          { assignedPmId: user.id },
          { createdById: user.id },
        ],
      };
    } else {
      // Client sees only their organization's projects
      whereClause = {
        organizationId: user.activeOrgId || undefined,
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        organization: true,
        milestones: {
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      projects,
      totalCount: projects.length, // Scoped count! Nitin only sees count of his projects
    });
  } catch (error: any) {
    console.error('Error fetching scoped projects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeUserId = request.headers.get('x-user-id') || cookieStore.get('luxe_user_id')?.value;

    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      projectName,
      category,
      description,
      targetDate,
      prototypeUrl,
      assignedPmId, // Only respected if user is SUPER_ADMIN
    } = body;

    if (!clientName || !projectName) {
      return NextResponse.json({ error: 'Client Name and Project Name required' }, { status: 400 });
    }

    // Determine assigned PM:
    // If Nitin is onboarding, it is ALWAYS automatically tagged to Nitin.
    // If Super Admin is onboarding, Super Admin can choose Nitin or Self.
    let finalAssignedPmId = user.id;
    let finalAssignedPmName = user.name;

    if (user.role === 'SUPER_ADMIN') {
      if (assignedPmId && assignedPmId !== user.id) {
        const targetPm = await prisma.user.findUnique({ where: { id: assignedPmId } });
        if (targetPm) {
          finalAssignedPmId = targetPm.id;
          finalAssignedPmName = targetPm.name;
        }
      }
    } else {
      // Subordinate PM (Nitin) - always auto-tagged to himself
      finalAssignedPmId = user.id;
      finalAssignedPmName = user.name;
    }

    // Create client organization
    const slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const org = await prisma.organization.create({
      data: {
        name: clientName,
        slug,
      },
    });

    // Create Project
    const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name: projectName,
        slug: projectSlug,
        category: category || 'Custom Digital Product',
        description: description || 'New client project onboarded via LuxeOS.',
        status: 'IN_PROGRESS',
        currentPhase: 'Phase 1: Discovery & Architecture',
        overallProgress: 5,
        targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        prototypeUrl,
        assignedPmId: finalAssignedPmId,
        assignedPmName: finalAssignedPmName,
        createdById: user.id,
      },
    });

    // Seed default standard milestones for the new project
    await prisma.milestone.createMany({
      data: [
        {
          projectId: project.id,
          sequence: 1,
          title: 'Project Discovery & Design System',
          phase: 'Discovery',
          status: 'IN_PROGRESS',
          progress: 25,
          description: 'Establish visual direction, requirements, and design tokens.',
        },
        {
          projectId: project.id,
          sequence: 2,
          title: 'Core Development & Integrations',
          phase: 'Development',
          status: 'SCHEDULED',
          progress: 0,
          description: 'Build components, databases, and third-party integrations.',
        },
        {
          projectId: project.id,
          sequence: 3,
          title: 'UAT & Final Delivery',
          phase: 'Handover',
          status: 'SCHEDULED',
          progress: 0,
          description: 'Quality verification, deployment, and 14-day hypercare support.',
        },
      ],
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'ONBOARD_PROJECT',
        entityType: 'Project',
        entityId: project.id,
        details: `Created project "${project.name}" for "${org.name}", assigned to ${finalAssignedPmName}`,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Error onboarding project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
