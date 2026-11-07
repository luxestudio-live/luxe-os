import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { syncRoadmapWithRequirements } from '@/lib/roadmap-sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, milestoneId, mode = 'replace', rows } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided to import' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const activeUserId = cookieStore.get('luxe_user_id')?.value;
    const user = activeUserId
      ? await prisma.user.findUnique({ where: { id: activeUserId } })
      : null;

    // Check project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Determine target milestone
    let targetMilestoneId = milestoneId;
    if (!targetMilestoneId) {
      const activeMilestone = await prisma.milestone.findFirst({
        where: { projectId, status: 'IN_PROGRESS' },
      }) || await prisma.milestone.findFirst({
        where: { projectId },
      });
      targetMilestoneId = activeMilestone?.id || null;
    }

    // If replace mode, clear existing rows
    if (mode === 'replace') {
      await prisma.requirement.deleteMany({
        where: { projectId },
      });
    }

    // Determine starting sequence
    let currentSeq = 0;
    if (mode === 'append') {
      const lastRow = await prisma.requirement.findFirst({
        where: { projectId },
        orderBy: { sequence: 'desc' },
      });
      currentSeq = lastRow?.sequence || 0;
    }

    const createdRows = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const seq = currentSeq + i + 1;
      const pageRoute = r.pageRoute || r['Page / Route'] || '/';
      const sectionComponent = r.sectionComponent || r['Section / Component'] || `Section ${seq}`;
      const specificRequirement = r.specificRequirement || r['Specific Requirement'] || '';
      const currentDraft = r.currentDraft || r['Current Draft on Website'] || '';
      const clientInput = r.clientInput || r['Client Actual Data / Input (Fill Here)'] || '';
      const assetUrl = r.assetUrl || r['Asset / Media Link (Google Drive / Cloud)'] || '';
      const guidelines = r.guidelines || r['Notes & Guidelines'] || '';

      const hasClientInput = !!(clientInput && clientInput.trim());
      const status = hasClientInput ? 'SUBMITTED' : 'PENDING';

      const created = await prisma.requirement.create({
        data: {
          projectId,
          milestoneId: targetMilestoneId,
          sequence: seq,
          pageRoute,
          sectionComponent,
          specificRequirement,
          currentDraft,
          clientInput: clientInput || null,
          assetUrl: assetUrl || null,
          guidelines: guidelines || null,
          title: `${pageRoute} · ${sectionComponent}`,
          description: specificRequirement || sectionComponent,
          status,
          value: clientInput || null,
          fileUrl: assetUrl || null,
          isMandatory: true,
          submittedAt: hasClientInput ? new Date() : null,
          submittedBy: hasClientInput ? (user?.name || 'Client') : null,
        },
      });
      createdRows.push(created);
    }

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'UPLOAD_REQUIREMENTS_SHEET',
          entityType: 'Requirement',
          entityId: projectId,
          details: `Imported ${createdRows.length} matrix rows into project "${project.name}" (mode: ${mode})`,
        },
      });
    }

    await syncRoadmapWithRequirements(projectId);

    return NextResponse.json({
      success: true,
      importedCount: createdRows.length,
      rows: createdRows,
    });
  } catch (error: any) {
    console.error('Error uploading requirements sheet:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

