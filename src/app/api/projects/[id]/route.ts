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
        // Default to Kalajay or first project
        project = await prisma.project.findFirst({
          where: { slug: 'kalajay-ecommerce' },
          include: getProjectIncludes(isInternal),
        });
      } else if (user.role === 'LUXE_PM' || user.role === 'INTERNAL_TEAM') {
        // Nitin only gets the first project assigned to him
        project = await prisma.project.findFirst({
          where: { assignedPmId: user.id },
          include: getProjectIncludes(isInternal),
        });
      } else {
        // Client gets their own organization project
        project = await prisma.project.findFirst({
          where: { organizationId: user.activeOrgId || undefined },
          include: getProjectIncludes(isInternal),
        });
      }
    } else {
      // Direct project ID lookup
      project = await prisma.project.findUnique({
        where: { id },
        include: getProjectIncludes(isInternal),
      });

      // Strict Access Enforcement:
      // If Subordinate PM (Nitin) attempts to load a project not assigned to him, reject!
      if (
        user.role === 'LUXE_PM' &&
        project &&
        project.assignedPmId !== user.id &&
        project.createdById !== user.id
      ) {
        return NextResponse.json(
          { error: 'Access Denied: You do not have permission to view this project.' },
          { status: 403 }
        );
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
      orderBy: { createdAt: 'asc' as const },
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
