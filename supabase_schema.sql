-- ====================================================================
-- LuxeOS Production Database Schema & Initial Seed for Supabase (PostgreSQL)
-- Company: LuxeStudio (https://theluxestudio.in)
-- Platform: LuxeOS (https://os.theluxestudio.in)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Existing Tables (Optional - comment out for production update)
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "EmailQueue" CASCADE;
DROP TABLE IF EXISTS "SmtpConfig" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "MeetingDecision" CASCADE;
DROP TABLE IF EXISTS "ProjectUpdate" CASCADE;
DROP TABLE IF EXISTS "DiscussionMessage" CASCADE;
DROP TABLE IF EXISTS "DiscussionThread" CASCADE;
DROP TABLE IF EXISTS "MaintenanceRecord" CASCADE;
DROP TABLE IF EXISTS "UatIssue" CASCADE;
DROP TABLE IF EXISTS "ApprovalRequest" CASCADE;
DROP TABLE IF EXISTS "PrototypeFeedback" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Requirement" CASCADE;
DROP TABLE IF EXISTS "Deliverable" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Milestone" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "OrganizationMembership" CASCADE;
DROP TABLE IF EXISTS "Organization" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 3. Core Identity & Multi-Tenancy Tables
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT_COLLABORATOR',
    "avatar" TEXT,
    "activeOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Organization" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "brandColor" TEXT NOT NULL DEFAULT '#C9A56A',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OrganizationMembership" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMembership_unique_org_user" UNIQUE ("organizationId", "userId")
);

-- 4. Projects & Scoped PM Assignments
CREATE TABLE "Project" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'E-Commerce & Custom Software',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentPhase" TEXT NOT NULL DEFAULT 'Phase 2: ERP Review & Integration',
    "assignedPmId" TEXT,
    "assignedPmName" TEXT,
    "createdById" TEXT,
    "overallProgress" INTEGER NOT NULL DEFAULT 15,
    "targetDate" TIMESTAMP(3),
    "goLiveDate" TIMESTAMP(3),
    "hypercareDays" INTEGER NOT NULL DEFAULT 14,
    "prototypeUrl" TEXT,
    "stagingUrl" TEXT,
    "productionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Milestones, Tasks & Deliverables
CREATE TABLE "Milestone" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "deliverablesSummary" TEXT,
    "responsibleTeam" TEXT NOT NULL DEFAULT 'LuxeStudio Core Team',
    "blockers" TEXT,
    "clientActionRequired" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Task" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "milestoneId" TEXT NOT NULL REFERENCES "Milestone"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Deliverable" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT REFERENCES "Milestone"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Requirements, Documents & Prototypes
CREATE TABLE "Requirement" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT REFERENCES "Milestone"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "isMandatory" BOOLEAN NOT NULL DEFAULT TRUE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "value" TEXT,
    "fileUrl" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Document" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT REFERENCES "Milestone"("id"),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "fileUrl" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL DEFAULT '0 KB',
    "fileType" TEXT NOT NULL DEFAULT 'application/pdf',
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "isInternalOnly" BOOLEAN NOT NULL DEFAULT FALSE,
    "uploadedBy" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PrototypeFeedback" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "pageUrl" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'Prototype',
    "category" TEXT NOT NULL DEFAULT 'UI/UX',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "resolutionNotes" TEXT,
    "submittedBy" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ApprovalRequest" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT REFERENCES "Milestone"("id"),
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deliverableVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedFrom" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL DEFAULT 'CLIENT_OWNER',
    "deadline" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "decisionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. UAT, Maintenance, Updates & Discussions
CREATE TABLE "UatIssue" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT REFERENCES "Milestone"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'Staging',
    "pageUrl" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "submittedBy" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "verifiedBy" TEXT,
    "clientConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MaintenanceRecord" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL DEFAULT 'SUPPORT',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "effortHours" INTEGER,
    "proposedCost" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DiscussionThread" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "isInternalOnly" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DiscussionMessage" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "threadId" TEXT NOT NULL REFERENCES "DiscussionThread"("id") ON DELETE CASCADE,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProjectUpdate" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "milestoneId" TEXT REFERENCES "Milestone"("id"),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PROGRESS',
    "isInternalOnly" BOOLEAN NOT NULL DEFAULT FALSE,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MeetingDecision" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "subject" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "attendees" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "decisions" TEXT NOT NULL,
    "actionItems" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications, SMTP Configuration & Email Engine
CREATE TABLE "Notification" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SmtpConfig" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "host" TEXT NOT NULL DEFAULT 'smtp.mailprovider.com',
    "port" INTEGER NOT NULL DEFAULT 587,
    "encryption" TEXT NOT NULL DEFAULT 'STARTTLS',
    "username" TEXT NOT NULL DEFAULT 'notifications@theluxestudio.in',
    "passwordEncrypted" TEXT NOT NULL DEFAULT '',
    "fromEmail" TEXT NOT NULL DEFAULT 'notifications@theluxestudio.in',
    "fromName" TEXT NOT NULL DEFAULT 'LuxeStudio Operations',
    "replyTo" TEXT NOT NULL DEFAULT 'support@theluxestudio.in',
    "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailQueue" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3)
);

CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT REFERENCES "User"("id"),
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Performance Indexes
CREATE INDEX "idx_project_organization" ON "Project"("organizationId");
CREATE INDEX "idx_project_assigned_pm" ON "Project"("assignedPmId");
CREATE INDEX "idx_milestone_project" ON "Milestone"("projectId");
CREATE INDEX "idx_requirement_project" ON "Requirement"("projectId");
CREATE INDEX "idx_deliverable_project" ON "Deliverable"("projectId");
CREATE INDEX "idx_uat_project" ON "UatIssue"("projectId");
CREATE INDEX "idx_email_queue_status" ON "EmailQueue"("status");

-- 10. Initial Seed Data (Studio Owner, Nitin, Kalajay & Pilot Milestones)
INSERT INTO "Organization" ("id", "name", "slug", "brandColor")
VALUES 
    ('3a232c76-3bce-4a58-8777-59b905b415b8', 'LuxeStudio Internal', 'luxestudio', '#C9A56A'),
    ('6c28118d-3f64-4178-93bc-323298995e76', 'Kalajay', 'kalajay', '#C9A56A');

-- Default bcrypt password for Password123!
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "activeOrgId")
VALUES
    ('f00b0225-1014-4dbc-bc22-7557edab61bb', 'admin@theluxestudio.in', 'Studio Owner (You)', '$2a$10$wE7YyO3YpDqv5t7cQ3.V8ekj234oWvK8j.dFp07a2L30g97dFk4Oa', 'SUPER_ADMIN', '3a232c76-3bce-4a58-8777-59b905b415b8'),
    ('104b4389-210b-4028-a668-3640bb433c91', 'nitin@theluxestudio.in', 'Nitin', '$2a$10$wE7YyO3YpDqv5t7cQ3.V8ekj234oWvK8j.dFp07a2L30g97dFk4Oa', 'LUXE_PM', '3a232c76-3bce-4a58-8777-59b905b415b8'),
    ('221b0225-1014-4dbc-bc22-7557edab61cc', 'owner@kalajay.com', 'Rohan Jaikishan', '$2a$10$wE7YyO3YpDqv5t7cQ3.V8ekj234oWvK8j.dFp07a2L30g97dFk4Oa', 'CLIENT_OWNER', '6c28118d-3f64-4178-93bc-323298995e76');

INSERT INTO "Project" ("id", "organizationId", "name", "slug", "description", "category", "status", "currentPhase", "assignedPmId", "assignedPmName", "overallProgress", "targetDate", "prototypeUrl", "stagingUrl")
VALUES (
    '41c8f1a5-f61c-4c7f-9e00-70a960844bbd',
    '6c28118d-3f64-4178-93bc-323298995e76',
    'Kalajay E-Commerce & ERP Integration',
    'kalajay-ecommerce',
    'Develop and deploy the complete Kalajay e-commerce website based on the approved prototype, integrate existing ERP, and transfer deliverables.',
    'Custom E-Commerce & ERP Integration',
    'IN_PROGRESS',
    'Phase 2: ERP Review & Priority Integration',
    '104b4389-210b-4028-a668-3640bb433c91',
    'Nitin',
    18,
    '2026-11-30 00:00:00',
    'https://kalajay.theluxestudio.in/',
    'https://staging-kalajay.theluxestudio.in/'
);

-- Seed Milestones
INSERT INTO "Milestone" ("id", "projectId", "sequence", "title", "phase", "status", "progress", "targetDate", "description", "deliverablesSummary", "responsibleTeam", "clientActionRequired")
VALUES
    ('9bdf278-9524-4a55-ab19-81c146009186', '41c8f1a5-f61c-4c7f-9e00-70a960844bbd', 1, 'Website prototype', 'Design & Prototyping', 'COMPLETED', 100, '2026-11-05 00:00:00', 'Initial premium e-commerce prototype prepared and approved for further implementation.', 'Interactive high-fidelity Figma prototype & deployed web demonstration.', 'LuxeStudio Design Engineering', FALSE),
    ('853a3b09-14ec-4831-bc18-b88443e5188a', '41c8f1a5-f61c-4c7f-9e00-70a960844bbd', 2, 'ERP review and priority integration', 'Architecture & Integrations', 'IN_PROGRESS', 35, '2026-11-14 00:00:00', 'Obtain ERP source code, review architecture, inspect database schema, map product/order entities, and validate initial connectivity.', 'ERP API specification, schema mapping matrix, priority sync connector.', 'Nitin & Backend Team', TRUE),
    ('0acbe7d4-3bd4-4a99-8884-242042fc834b', '41c8f1a5-f61c-4c7f-9e00-70a960844bbd', 3, 'Full website functionality and service integrations', 'Full-Stack Development', 'SCHEDULED', 0, '2026-11-25 00:00:00', 'Complete e-commerce journeys, shopping bag, checkout flow, OTP authentication, payment gateway, and transactional notifications.', 'Functional storefront, checkout pipeline, integrated payment webhook handler.', 'Nitin & Team', FALSE);

-- Seed SMTP Default record
INSERT INTO "SmtpConfig" ("id", "host", "port", "encryption", "username", "fromEmail", "fromName", "replyTo", "isVerified")
VALUES ('default', 'smtp.mailprovider.com', 587, 'STARTTLS', 'notifications@theluxestudio.in', 'notifications@theluxestudio.in', 'LuxeStudio Operations', 'support@theluxestudio.in', FALSE)
ON CONFLICT ("id") DO NOTHING;
