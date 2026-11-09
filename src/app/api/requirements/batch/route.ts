import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { syncRoadmapWithRequirements } from '@/lib/roadmap-sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Batch update exceeds maximum of 500 rows' }, { status: 400 });
    }

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

    const isInternal =
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'LUXE_PM' ||
      user?.role === 'INTERNAL_TEAM';

    let allowedOrgIds: string[] = [];
    if (!isInternal && user) {
      const userWithMemberships = await prisma.user.findUnique({
        where: { id: user.id },
        include: { memberships: true },
      });
      allowedOrgIds = [
        ...(user.activeOrgId ? [user.activeOrgId] : []),
        ...(userWithMemberships?.memberships?.map((m) => m.organizationId) || []),
      ].filter(Boolean);
    }

    const updatedRows = [];
    for (const r of rows) {
      if (!r.id) continue;

      if (!isInternal && user) {
        const reqItem = await prisma.requirement.findUnique({
          where: { id: r.id },
          include: { project: true },
        });
        if (!reqItem || !allowedOrgIds.includes(reqItem.project.organizationId)) {
          continue; // Security skip: row does not belong to client's organization
        }
      }
      
      const hasInput = !!(r.clientInput && r.clientInput.trim());
      const updated = await prisma.requirement.update({
        where: { id: r.id },
        data: {
          clientInput: r.clientInput !== undefined ? r.clientInput : undefined,
          value: r.clientInput !== undefined ? r.clientInput : undefined,
          assetUrl: r.assetUrl !== undefined ? r.assetUrl : undefined,
          fileUrl: r.assetUrl !== undefined ? r.assetUrl : undefined,
          pageRoute: r.pageRoute !== undefined ? r.pageRoute : undefined,
          sectionComponent: r.sectionComponent !== undefined ? r.sectionComponent : undefined,
          specificRequirement: r.specificRequirement !== undefined ? r.specificRequirement : undefined,
          currentDraft: r.currentDraft !== undefined ? r.currentDraft : undefined,
          guidelines: r.guidelines !== undefined ? r.guidelines : undefined,
          status: r.status || (hasInput ? 'SUBMITTED' : undefined),
          submittedAt: hasInput ? new Date() : undefined,
          submittedBy: hasInput ? (user?.name || 'Client') : undefined,
        },
      });
      updatedRows.push(updated);
    }

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'BATCH_UPDATE_REQUIREMENTS',
          entityType: 'Requirement',
          entityId: 'batch',
          details: `User ${user.name} saved ${updatedRows.length} matrix rows`,
        },
      });
    }

    if (updatedRows.length > 0 && updatedRows[0].projectId) {
      await syncRoadmapWithRequirements(updatedRows[0].projectId);
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedRows.length,
      rows: updatedRows,
    });
  } catch (error: any) {
    console.error('Error in batch requirements update:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

