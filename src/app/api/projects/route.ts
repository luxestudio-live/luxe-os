import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

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
      clientEmail,
      clientContactName,
      customPassword,
      hypercareDays = 14,
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
        hypercareDays: Number(hypercareDays) || 14,
        prototypeUrl,
        assignedPmId: finalAssignedPmId,
        assignedPmName: finalAssignedPmName,
        createdById: user.id,
      },
    });

    // Generate or use credentials for client user
    const finalClientEmail = (clientEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`).trim().toLowerCase();
    const temporaryPassword = customPassword || `Luxe-${Math.floor(1000 + Math.random() * 9000)}!`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    let clientUser = await prisma.user.findUnique({ where: { email: finalClientEmail } });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: finalClientEmail,
          name: clientContactName || `${clientName} Representative`,
          passwordHash,
          role: 'CLIENT_OWNER',
          activeOrgId: org.id,
          mustChangePassword: true,
        },
      });
    }

    // Create organization membership
    await prisma.organizationMembership.create({
      data: {
        organizationId: org.id,
        userId: clientUser.id,
        role: 'OWNER',
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
          description: `Quality verification, deployment, and ${project.hypercareDays}-day hypercare support.`,
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
        details: `Created project "${project.name}" for "${org.name}", assigned to ${finalAssignedPmName}. Client credentials generated for ${finalClientEmail}`,
      },
    });

    return NextResponse.json({
      success: true,
      project,
      credentials: {
        email: finalClientEmail,
        temporaryPassword,
        name: clientUser.name,
        portalUrl: `${process.env.APP_URL || 'https://os.theluxestudio.in'}/login`,
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    console.error('Error onboarding project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
