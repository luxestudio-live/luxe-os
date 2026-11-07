const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LuxeOS database — Clean Studio Slate...');

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.emailQueue.deleteMany({});
  await prisma.meetingDecision.deleteMany({});
  await prisma.projectUpdate.deleteMany({});
  await prisma.discussionMessage.deleteMany({});
  await prisma.discussionThread.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.uatIssue.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.prototypeFeedback.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.requirement.deleteMany({});
  await prisma.deliverable.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.organizationMembership.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.smtpConfig.deleteMany({});

  const studioPassword = process.env.INITIAL_STUDIO_PASSWORD || 'LuxeStudio#SecurePass!';
  const defaultPasswordHash = await bcrypt.hash(studioPassword, 10);

  // 1. Studio Organization
  const luxeOrg = await prisma.organization.create({
    data: {
      name: 'LuxeStudio',
      slug: 'luxestudio',
      brandColor: '#C9A56A',
    },
  });

  // 2. Studio Leadership Users (Rahul Kushwaha & Nitin Chandnani)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'rahul.kushwaha@theluxestudio.in',
      username: 'rahul',
      name: 'Rahul Kushwaha',
      passwordHash: defaultPasswordHash,
      role: 'SUPER_ADMIN',
      activeOrgId: luxeOrg.id,
      mustChangePassword: false,
    },
  });

  const nitinUser = await prisma.user.create({
    data: {
      email: 'nitin.chandnani@theluxestudio.in',
      username: 'nitin',
      name: 'Nitin Chandnani',
      passwordHash: defaultPasswordHash,
      role: 'LUXE_PM',
      activeOrgId: luxeOrg.id,
      mustChangePassword: false,
    },
  });

  // 3. Organization Memberships
  await prisma.organizationMembership.createMany({
    data: [
      { organizationId: luxeOrg.id, userId: superAdmin.id, role: 'OWNER' },
      { organizationId: luxeOrg.id, userId: nitinUser.id, role: 'COLLABORATOR' },
    ],
  });

  console.log('Clean slate seeded successfully with Rahul (Super Admin) & Nitin (Scoped PM).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
