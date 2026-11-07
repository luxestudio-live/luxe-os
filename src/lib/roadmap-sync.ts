import { prisma } from './prisma';

/**
 * Automatically synchronizes milestone gates, roadmap progress, blockers,
 * and project phase whenever requirements are answered or updated.
 */
export async function syncRoadmapWithRequirements(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: {
          orderBy: { sequence: 'asc' },
          include: {
            requirements: true,
          },
        },
        requirements: true,
      },
    });

    if (!project || project.milestones.length === 0) return null;

    for (const milestone of project.milestones) {
      let milestoneReqs = milestone.requirements;
      if (milestoneReqs.length === 0 && milestone.status === 'IN_PROGRESS') {
        milestoneReqs = project.requirements.filter(
          (r) => !r.milestoneId || r.milestoneId === milestone.id
        );
      }

      if (milestoneReqs.length > 0) {
        const totalReqs = milestoneReqs.length;
        const answeredReqs = milestoneReqs.filter(
          (r) =>
            (r.clientInput && r.clientInput.trim().length > 0) ||
            r.status === 'ACCEPTED' ||
            r.status === 'SUBMITTED'
        ).length;

        const allAnswered = answeredReqs === totalReqs;
        const progressPercent = Math.round((answeredReqs / totalReqs) * 100);

        if (allAnswered) {
          // All requirements answered: Milestone gate is completed!
          await prisma.milestone.update({
            where: { id: milestone.id },
            data: {
              progress: 100,
              status: 'COMPLETED',
              clientActionRequired: false,
              blockers: null,
              completedDate: new Date(),
            },
          });

          // Automatically advance next milestone to IN_PROGRESS
          const nextMilestone = project.milestones.find(
            (m) => m.sequence === milestone.sequence + 1
          );

          if (nextMilestone && nextMilestone.status !== 'COMPLETED') {
            await prisma.milestone.update({
              where: { id: nextMilestone.id },
              data: {
                status: 'IN_PROGRESS',
                startDate: new Date(),
              },
            });

            await prisma.project.update({
              where: { id: projectId },
              data: {
                currentPhase: `Phase ${nextMilestone.sequence}: ${nextMilestone.title}`,
              },
            });
          }
        } else {
          // Still in progress
          const remainingCount = totalReqs - answeredReqs;
          await prisma.milestone.update({
            where: { id: milestone.id },
            data: {
              progress: progressPercent,
              status: 'IN_PROGRESS',
              clientActionRequired: true,
              blockers: `${remainingCount} requirement${remainingCount > 1 ? 's' : ''} awaiting input`,
            },
          });
        }
      }
    }

    // Recalculate overall project progress across all milestones
    const updatedMilestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { sequence: 'asc' },
    });

    const totalProgress = updatedMilestones.reduce((acc, m) => acc + m.progress, 0);
    const newOverallProgress = Math.round(totalProgress / updatedMilestones.length);
    const allMilestonesComplete = updatedMilestones.every((m) => m.status === 'COMPLETED');

    const activeMilestone =
      updatedMilestones.find((m) => m.status === 'IN_PROGRESS') ||
      updatedMilestones[updatedMilestones.length - 1];

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        overallProgress: newOverallProgress,
        status: allMilestonesComplete ? 'HYPERCARE' : project.status,
        currentPhase: allMilestonesComplete
          ? 'Hypercare & Launch Assurance'
          : `Phase ${activeMilestone.sequence}: ${activeMilestone.title}`,
        goLiveDate: allMilestonesComplete && !project.goLiveDate ? new Date() : project.goLiveDate,
      },
    });

    return { project: updatedProject, milestones: updatedMilestones };
  } catch (err) {
    console.error('Error syncing roadmap with requirements:', err);
    return null;
  }
}

