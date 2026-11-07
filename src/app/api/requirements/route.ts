import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      milestoneId,
      pageRoute = '/',
      sectionComponent,
      specificRequirement,
      currentDraft,
      clientInput,
      assetUrl,
      guidelines,
    } = body;

    if (!projectId || !sectionComponent) {
      return NextResponse.json(
        { error: 'projectId and sectionComponent are required' },
        { status: 400 }
      );
    }

    const lastRow = await prisma.requirement.findFirst({
      where: { projectId },
      orderBy: { sequence: 'desc' },
    });
    const seq = (lastRow?.sequence || 0) + 1;

    let targetMilestoneId = milestoneId;
    if (!targetMilestoneId) {
      const activeMilestone = await prisma.milestone.findFirst({
        where: { projectId, status: 'IN_PROGRESS' },
      }) || await prisma.milestone.findFirst({
        where: { projectId },
      });
      targetMilestoneId = activeMilestone?.id || null;
    }

    const created = await prisma.requirement.create({
      data: {
        projectId,
        milestoneId: targetMilestoneId,
        sequence: seq,
        pageRoute,
        sectionComponent,
        specificRequirement: specificRequirement || '',
        currentDraft: currentDraft || '',
        clientInput: clientInput || null,
        assetUrl: assetUrl || null,
        guidelines: guidelines || null,
        title: `${pageRoute} · ${sectionComponent}`,
        description: specificRequirement || sectionComponent,
        status: clientInput ? 'SUBMITTED' : 'PENDING',
        value: clientInput || null,
        fileUrl: assetUrl || null,
        isMandatory: true,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating requirement row:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(requirements);
  } catch (error: any) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

