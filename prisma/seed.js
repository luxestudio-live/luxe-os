const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LuxeOS database with multi-project & scoped PM permissions...');

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

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Organizations
  const luxeOrg = await prisma.organization.create({
    data: {
      name: 'LuxeStudio Internal',
      slug: 'luxestudio',
      brandColor: '#C9A56A',
    },
  });

  const kalajayOrg = await prisma.organization.create({
    data: {
      name: 'Kalajay',
      slug: 'kalajay',
      brandColor: '#C9A56A',
      logoUrl: 'https://kalajay.theluxestudio.in/favicon.ico',
    },
  });

  const aurumOrg = await prisma.organization.create({
    data: {
      name: 'Aurum Haute Horlogerie',
      slug: 'aurum-watches',
      brandColor: '#D4AF37',
    },
  });

  // 2. Users (You as Studio Owner + Nitin as Scoped PM + Client)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@theluxestudio.in',
      name: 'Studio Owner (You)',
      passwordHash: defaultPasswordHash,
      role: 'SUPER_ADMIN',
      activeOrgId: luxeOrg.id,
    },
  });

  const nitinUser = await prisma.user.create({
    data: {
      email: 'nitin@theluxestudio.in',
      name: 'Nitin',
      passwordHash: defaultPasswordHash,
      role: 'LUXE_PM',
      activeOrgId: luxeOrg.id,
    },
  });

  const clientOwner = await prisma.user.create({
    data: {
      email: 'owner@kalajay.com',
      name: 'Rohan Jaikishan',
      passwordHash: defaultPasswordHash,
      role: 'CLIENT_OWNER',
      activeOrgId: kalajayOrg.id,
    },
  });

  // Memberships
  await prisma.organizationMembership.createMany({
    data: [
      { organizationId: luxeOrg.id, userId: superAdmin.id, role: 'OWNER' },
      { organizationId: luxeOrg.id, userId: nitinUser.id, role: 'COLLABORATOR' },
      { organizationId: kalajayOrg.id, userId: clientOwner.id, role: 'OWNER' },
    ],
  });

  // 3. Project 1: Kalajay (TAGGED TO NITIN - both You and Nitin see this)
  const kalajayProject = await prisma.project.create({
    data: {
      organizationId: kalajayOrg.id,
      name: 'Kalajay E-Commerce & ERP Integration',
      slug: 'kalajay-ecommerce',
      category: 'Custom E-Commerce & ERP Integration',
      status: 'IN_PROGRESS',
      currentPhase: 'Phase 2: ERP Review & Priority Integration',
      overallProgress: 18,
      targetDate: new Date('2026-11-30T00:00:00Z'),
      hypercareDays: 14,
      prototypeUrl: 'https://kalajay.theluxestudio.in/',
      stagingUrl: 'https://staging-kalajay.theluxestudio.in/',
      assignedPmId: nitinUser.id,
      assignedPmName: 'Nitin',
      createdById: superAdmin.id,
      description:
        'Develop and deploy the complete Kalajay e-commerce website based on the approved prototype, integrate the existing ERP, migrate relevant data where required, configure necessary connected services, complete testing, deploy to production and transfer the agreed website deliverables.',
    },
  });

  // 4. Project 2: Aurum (TAGGED TO YOU ONLY - Nitin CANNOT see this!)
  const aurumProject = await prisma.project.create({
    data: {
      organizationId: aurumOrg.id,
      name: 'Aurum Haute Horlogerie — Private Platform',
      slug: 'aurum-private',
      category: 'Luxury Brand & Custom WebGL',
      status: 'IN_PROGRESS',
      currentPhase: 'Phase 1: Concept & Design System',
      overallProgress: 45,
      targetDate: new Date('2026-12-15T00:00:00Z'),
      hypercareDays: 14,
      assignedPmId: superAdmin.id,
      assignedPmName: 'Studio Owner (You)',
      createdById: superAdmin.id,
      description: 'Exclusive private client project handled directly by Studio Leadership.',
    },
  });

  // 5. Kalajay Milestones
  const m1 = await prisma.milestone.create({
    data: {
      projectId: kalajayProject.id,
      sequence: 1,
      title: 'Website prototype',
      phase: 'Design & Prototyping',
      status: 'COMPLETED',
      progress: 100,
      completedDate: new Date('2026-11-05T00:00:00Z'),
      startDate: new Date('2026-10-20T00:00:00Z'),
      targetDate: new Date('2026-11-05T00:00:00Z'),
      description: 'Initial premium e-commerce prototype prepared and approved for further implementation.',
      deliverablesSummary: 'Interactive high-fidelity Figma prototype & deployed web demonstration.',
      responsibleTeam: 'LuxeStudio Design Engineering',
      clientActionRequired: false,
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      projectId: kalajayProject.id,
      sequence: 2,
      title: 'ERP review and priority integration',
      phase: 'Architecture & Integrations',
      status: 'IN_PROGRESS',
      progress: 35,
      startDate: new Date('2026-11-06T00:00:00Z'),
      targetDate: new Date('2026-11-14T00:00:00Z'),
      description: 'Obtain ERP source code, review architecture, inspect database schema, map product/order entities, and validate initial connectivity.',
      deliverablesSummary: 'ERP API specification, schema mapping matrix, priority sync connector.',
      responsibleTeam: 'Nitin & Backend Team',
      blockers: 'Awaiting client provision of ERP repository access & database export.',
      clientActionRequired: true,
    },
  });

  const m3 = await prisma.milestone.create({
    data: {
      projectId: kalajayProject.id,
      sequence: 3,
      title: 'Full website functionality and service integrations',
      phase: 'Full-Stack Development',
      status: 'SCHEDULED',
      progress: 0,
      startDate: new Date('2026-11-15T00:00:00Z'),
      targetDate: new Date('2026-11-25T00:00:00Z'),
      description: 'Complete e-commerce journeys, shopping bag, checkout flow, OTP authentication, payment gateway, and transactional notifications.',
      deliverablesSummary: 'Functional storefront, checkout pipeline, integrated payment webhook handler.',
      responsibleTeam: 'Nitin & Team',
      clientActionRequired: false,
    },
  });

  // 6. Kalajay Requirements (12 items)
  const reqTitles = [
    { title: 'ERP repository/source-code access', type: 'CREDENTIALS_DELEGATION', mandatory: true, desc: 'Provide repository read access or archived source export for the current ERP system.' },
    { title: 'ERP documentation and technical contact details', type: 'TEXT', mandatory: true, desc: 'API specifications, database architecture notes, and contact email/phone for the ERP technical team.' },
    { title: 'Current hosting/platform access', type: 'CREDENTIALS_DELEGATION', mandatory: true, desc: 'Delegated credentials or access invite for server hosting, VPS, or cloud platform.' },
    { title: 'Database schema and approved access/export', type: 'FILE', mandatory: true, desc: 'Sanitized database dump (SQL/Postgres/MySQL) or data dictionary for product/catalog tables.' },
    { title: 'Existing website and integration information', type: 'LONG_TEXT', mandatory: true, desc: 'Overview of any legacy third-party plugins, cron scripts, or webhook dependencies.' },
    { title: 'Domain registrar/DNS administrator details', type: 'TEXT', mandatory: true, desc: 'Registrar credentials or designated DNS technician contact to facilitate SSL and live cutover.' },
    { title: 'Product catalogue and operational business rules', type: 'FILE', mandatory: true, desc: 'SKU rules, tax slabs, inventory management guidelines, and shipping zone classifications.' },
    { title: 'Payment gateway provider information, where applicable', type: 'TEXT', mandatory: false, desc: 'Merchant ID and API key credentials for payment processor (Razorpay/Stripe/etc).' },
    { title: 'OTP provider details, where applicable', type: 'TEXT', mandatory: false, desc: 'SMS/WhatsApp gateway details (MSG91/Twilio) and approved DLT registration templates.' },
    { title: 'Existing business email service information, where migration is required', type: 'TEXT', mandatory: false, desc: 'Google Workspace or Microsoft 365 MX/SPF/DKIM records if email migration is needed.' },
    { title: 'Shipping/logistics integration details, where applicable', type: 'TEXT', mandatory: false, desc: 'Carrier partner API details (Shiprocket, Delhivery, Bluedart) for automated waybill generation.' },
    { title: 'Authorised client representative for UAT approvals', type: 'TEXT', mandatory: true, desc: 'Name, official email, and phone number of the primary sign-off authority for UAT milestones.' },
  ];

  for (let i = 0; i < reqTitles.length; i++) {
    const r = reqTitles[i];
    await prisma.requirement.create({
      data: {
        projectId: kalajayProject.id,
        milestoneId: i < 5 ? m2.id : m3.id,
        title: r.title,
        description: r.desc,
        type: r.type,
        isMandatory: r.mandatory,
        status: 'PENDING',
        dueDate: new Date('2026-11-12T00:00:00Z'),
      },
    });
  }

  // 7. Updates for Kalajay
  await prisma.projectUpdate.create({
    data: {
      projectId: kalajayProject.id,
      milestoneId: m1.id,
      title: 'Milestone 1 Prototype Approved by Kalajay Team',
      content: 'The initial e-commerce web prototype hosted at https://kalajay.theluxestudio.in/ has been reviewed and formally signed off. We have now transitioned into Milestone 2 (ERP Review & Integration).',
      type: 'MILESTONE_COMPLETE',
      isInternalOnly: false,
      authorName: 'Nitin',
    },
  });

  // 8. SMTP Config
  await prisma.smtpConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      host: 'smtp.theluxestudio.in',
      port: 587,
      encryption: 'STARTTLS',
      username: 'notifications@theluxestudio.in',
      fromEmail: 'notifications@theluxestudio.in',
      fromName: 'LuxeStudio Operations',
      replyTo: 'support@theluxestudio.in',
      isVerified: true,
      lastTestedAt: new Date(),
      testStatus: 'SUCCESS',
    },
  });

  console.log('Seeded multi-client permission isolation successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
