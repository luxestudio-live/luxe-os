import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { syncRoadmapWithRequirements } from '@/lib/roadmap-sync';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      action,
      value,
      fileUrl,
      clientInput,
      assetUrl,
      pageRoute,
      sectionComponent,
      specificRequirement,
      currentDraft,
      guidelines,
      status,
      rejectionReason,
    } = body;

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    const requirement = await prisma.requirement.findUnique({ where: { id } });
    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    const isInternal =
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'LUXE_PM' ||
      user?.role === 'INTERNAL_TEAM';

    // Strict Client Isolation
    if (!isInternal && user) {
      const userWithMemberships = await prisma.user.findUnique({
        where: { id: user.id },
        include: { memberships: true },
      });
      const orgIds = [
        ...(user.activeOrgId ? [user.activeOrgId] : []),
        ...(userWithMemberships?.memberships?.map((m) => m.organizationId) || []),
      ].filter(Boolean);

      const reqProject = await prisma.project.findUnique({
        where: { id: requirement.projectId },
      });

      if (!reqProject || !orgIds.includes(reqProject.organizationId)) {
        return NextResponse.json(
          { error: 'Access Denied: You do not have permission to edit this requirement.' },
          { status: 403 }
        );
      }
    }

    let updated;
    if (action === 'review') {
      if (!isInternal) {
        return NextResponse.json(
          { error: 'Access Denied: Only studio staff can review requirements.' },
          { status: 403 }
        );
      }
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

      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          userEmail: user?.email || 'admin@theluxestudio.in',
          action: 'REVIEW_REQUIREMENT',
          entityType: 'Requirement',
          entityId: id,
          details: `LuxeStudio reviewed requirement "${requirement.title || requirement.sectionComponent}" -> ${newStatus}`,
        },
      });
    } else {
      // General update / Client submit or Admin edit
      const finalClientInput = clientInput !== undefined ? clientInput : (value !== undefined ? value : requirement.clientInput);
      const finalAssetUrl = assetUrl !== undefined ? assetUrl : (fileUrl !== undefined ? fileUrl : requirement.assetUrl);
      const hasInput = !!(finalClientInput && finalClientInput.trim());

      const nextStatus = status || (hasInput ? 'SUBMITTED' : (requirement.status || 'PENDING'));

      updated = await prisma.requirement.update({
        where: { id },
        data: {
          clientInput: finalClientInput,
          value: finalClientInput,
          assetUrl: finalAssetUrl,
          fileUrl: finalAssetUrl,
          pageRoute: pageRoute !== undefined ? pageRoute : requirement.pageRoute,
          sectionComponent: sectionComponent !== undefined ? sectionComponent : requirement.sectionComponent,
          specificRequirement: specificRequirement !== undefined ? specificRequirement : requirement.specificRequirement,
          currentDraft: currentDraft !== undefined ? currentDraft : requirement.currentDraft,
          guidelines: guidelines !== undefined ? guidelines : requirement.guidelines,
          status: nextStatus,
          submittedAt: hasInput ? new Date() : requirement.submittedAt,
          submittedBy: hasInput ? (user?.name || 'Client Collaborator') : requirement.submittedBy,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          userEmail: user?.email || 'user@theluxestudio.in',
          action: 'UPDATE_REQUIREMENT',
          entityType: 'Requirement',
          entityId: id,
          details: `Updated requirement row "${requirement.sectionComponent || requirement.title}"`,
        },
      });
    }

    if (requirement.projectId) {
      await syncRoadmapWithRequirements(requirement.projectId);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating requirement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.requirement.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting requirement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
