# PRODUCT.md — LuxeOS Product Context & Truth

## Product Overview
- **Name**: LuxeOS
- **Brand / Organization**: LuxeStudio (`https://theluxestudio.in`)
- **Target URL**: `https://os.theluxestudio.in`
- **Initial Pilot Client**: Kalajay (`https://kalajay.theluxestudio.in/`)
- **Category**: Exclusive multi-client project experience and operations platform.
- **Positioning**: A bespoke digital ecosystem combining an ultra-refined, transparent Client Portal with a commanding, structured Admin Workspace for LuxeStudio. Unlike generic SaaS task trackers, LuxeOS serves as the single source of truth for the entire client lifecycle—from onboarding and prototype approvals to UAT, 14-day hypercare, and ongoing maintenance.

---

## Users & Roles

### 1. Super Admin (LuxeStudio Leadership)
- **Job**: Total platform governance, security, direct SMTP email configuration, global audit logs, and team permissions across all client organizations.

### 2. LuxeStudio Admin / Project Manager
- **Job**: Create and manage client projects, schedule milestones, publish progress updates, review and verify client requirement submissions, orchestrate UAT, manage change requests, and communicate with client stakeholders.

### 3. Internal Team Member (LuxeStudio Engineers & Designers)
- **Job**: Track assigned tasks, record internal technical progress/blockers, review prototype feedback, and submit issue fixes. Restricted from sensitive platform settings and unassigned client data.

### 4. Client Owner (e.g., Kalajay Executive / Sponsor)
- **Job**: Review real-time delivery milestones, explore staging prototypes, approve critical deliverables (scope, design, UAT, production launch), manage colleague access, and review maintenance/support status.

### 5. Client Collaborator (e.g., Kalajay Technical / Operations Lead)
- **Job**: Submit technical requirements (ERP access, DNS, credentials), participate in discussion threads, log UAT feedback, and upload project assets.

### 6. Client Viewer (e.g., Stakeholder / Observer)
- **Job**: Read-only visibility into permitted project timelines, progress updates, and meeting notes.

---

## Operating Modes & Primary Surfaces

### Surface A: LuxeOS Client Portal
- **Dashboard**: High-context overview with delivery phase, progress indicator, next milestone, items awaiting client action, latest prototype link, and PM contact.
- **Signature Project Journey Timeline**: Connected milestone roadmap displaying planned/actual dates, dependencies, deliverables, client sign-offs, and progress indicators.
- **Prototype Preview Studio**: Device-framed viewport switcher, direct external launch, and structured feedback capture (URL, annotation, category, priority).
- **Action Required Centre**: Prioritized repository of pending client inputs with deadlines and upload controls.
- **Documents & File Management**: Categorized file storage with version history and secure downloads.
- **UAT & Issue Reporting**: Defect submission, environment tagging, severity classification, and resolution verification.
- **Hypercare & Maintenance Hub**: 14-day post-launch hypercare tracker and long-term maintenance request logging.

### Surface B: LuxeStudio Admin Workspace
- **Executive Operations Dashboard**: Cross-project health, milestone deadlines, open blockers, client turnaround times, and delivery metrics.
- **Client & Organization Directory**: Organization profiles, contact lists, and invitation management.
- **Project Creation & Milestone Manager**: Project wizard, template instantiation, milestone dependency linking, and stage updates.
- **Requirement Verification Hub**: Review, accept, or request revisions on client-submitted assets and credentials.
- **Direct SMTP Email Engine & Queue**: In-app SMTP configuration (host, port, encryption, credentials), connection testing, delivery queue worker, and transmission attempt logs.
- **Audit & Security**: Transactional event logs, role-based access control, and tenant isolation.

---

## Platform & Technical Architecture

- **Platform**: Web (`web`), responsive across desktop, tablet, and mobile viewports.
- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide icons, Framer Motion transitions.
- **Backend**: Next.js Server Components, Server Actions, Route Handlers, Zod validation.
- **Database & ORM**: Prisma ORM with SQLite file-based persistence for seamless zero-dependency operation, fully portable to PostgreSQL in production.
- **Storage**: Local secure file storage (`/storage/uploads`) served through authenticated streaming route handlers with strict tenant authorization.
- **Email Delivery**: Server-side Nodemailer engine connecting to admin-configured SMTP, with database-backed queueing, retry mechanisms, and delivery logs.
- **Authentication**: Session-based authentication with single-use invitation tokens, paired with an interactive Demo Role Switcher for rapid multi-role evaluation.

---

## Confirmed Pilot Project Truth: Kalajay

- **Project**: Custom e-commerce website development and ERP integration.
- **Prototype**: `https://kalajay.theluxestudio.in/`
- **Initial Milestones**:
  1. *Website prototype* — Completed (Initial e-commerce prototype prepared and approved).
  2. *ERP review and priority integration* — Planned (Target: 14 Nov 2026; code review, product/order mapping, connectivity).
  3. *Full website functionality and service integrations* — Period: 15–25 Nov 2026 (Cart, checkout, OTP, payment gateway, data migration).
  4. *Implementation progress checkpoint* — Target: 25 Nov 2026 (Target: ~80% completion; UAT kick-off).
  5. *UAT and stabilisation* — Period: 25–28 Nov 2026 (Customer journeys, payment verification, defect logging).
  6. *Final readiness and handover preparation* — Target: 28–30 Nov 2026 (Blocking issues resolved, documentation, ownership transfer).
  7. *Production go-live* — To be confirmed post-UAT sign-off.
  8. *Hypercare* — 14 calendar days from actual production go-live.
  9. *Ongoing basic maintenance* — Transition following hypercare.
- **Initial Client Requirements (12 items)**:
  1. ERP repository/source-code access
  2. ERP documentation & technical contact details
  3. Current hosting/platform access
  4. Database schema & approved export
  5. Existing website & integration information
  6. Domain registrar/DNS administrator details
  7. Product catalogue & operational business rules
  8. Payment gateway provider information
  9. OTP provider details
  10. Existing business email service information
  11. Shipping/logistics integration details
  12. Authorised client representative for UAT approvals

---

## Core Non-Negotiable Constraints
1. **Tenant Isolation**: No client organization may ever access or discover another organization's records, files, or messages.
2. **True State Integrity**: All updates must persist to the database; progress percentages and milestone states must reflect actual data, never arbitrary hardcoded numbers.
3. **Data Security**: Secrets and credentials must never be exposed to browser JavaScript or unprivileged APIs.
4. **Accessibility Quality Floor**: Meet WCAG 2.2 AA standards with keyboard navigability, clear focus rings, touch targets ≥ 44px, and `prefers-reduced-motion` compliance.

