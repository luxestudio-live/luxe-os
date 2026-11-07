# LuxeOS &mdash; Premium Multi-Client Experience &amp; Project Operations Platform

**Product:** LuxeOS  
**Company:** LuxeStudio (`https://theluxestudio.in`)  
**Proposed Application URL:** `https://os.theluxestudio.in`  
**Initial Pilot Client:** Kalajay (`https://kalajay.theluxestudio.in/`)

---

## 1. Project Overview & Philosophy

**LuxeOS** is an exclusive, production-grade project operations and client experience platform engineered for LuxeStudio. It unifies client transparency with studio operational control into a bespoke digital ecosystem.

Unlike generic project management software or static templates, LuxeOS operates on persistent relational data where all updates made by authorized administrators immediately reflect in client-facing views without duplication.

### Two Integrated Surfaces:
1. **LuxeOS Client Portal**: A refined, high-context client surface displaying real-time delivery phases, signature roadmap, interactive prototype staging, pending requirement submission, UAT defect logging, and hypercare tracking.
2. **LuxeOS Admin Workspace**: Internal command center for LuxeStudio team members to manage delivery gates, advance milestone statuses, review client requirements, publish progress updates, and control direct SMTP email delivery.

---

## 2. Architecture & Technology Stack

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript, Tailwind CSS, Lucide icons, Framer Motion.
- **Backend**: Next.js Server Components, Server Actions & REST API Route Handlers.
- **Database & ORM**: Prisma ORM with SQLite file-based persistence for seamless zero-dependency deployment (`file:./dev.db`), completely portable to PostgreSQL in production.
- **Storage**: Local secure file storage (`/storage/uploads`) served via authenticated streaming route handlers.
- **Email Delivery**: Direct Nodemailer engine with AES-256 encrypted SMTP credential storage, transactional email queueing, retry mechanisms, and delivery logs. Zero third-party cloud lock-in.

---

## 3. Brand & Design Tokens

Refined luxury design system derived from LuxeStudio's brand identity:

- **Deep Black (`#0B0B0D`)**: Background foundation.
- **Charcoal (`#171719`)**: Elevated cards, sidebar, and container surfaces.
- **Charcoal Light (`#222226`)**: Active hover states and form inputs.
- **Rich Gold (`#C9A56A`)**: Primary brand accent, active milestone highlights, key callouts.
- **Muted Champagne (`#E6D0A5`)**: Secondary gold tone, status badges.
- **Warm Ivory (`#F7F5F1`)**: Primary high-contrast typography.
- **Restrained Emerald (`#10B981`)**: Completed gates and verified submissions.
- **Sophisticated Amber (`#F59E0B`)**: Action Required blockers and warnings.
- **Muted Crimson (`#EF4444`)**: Critical defects and launch blockers.

---

## 4. Initial Pilot Client: Kalajay

LuxeOS is pre-seeded with real initial project data for **Kalajay**:
- **Project Type**: Custom E-Commerce Website Development & ERP Integration
- **Staging Prototype**: `https://kalajay.theluxestudio.in/`
- **Delivery Gates**:
  1. *Website prototype* &mdash; Completed (Approved prototype hosted on staging).
  2. *ERP review and priority integration* &mdash; In Progress (Target: 14 Nov 2026).
  3. *Full website functionality and service integrations* &mdash; Period: 15–25 Nov 2026.
  4. *Implementation progress checkpoint (~80%)* &mdash; Target: 25 Nov 2026.
  5. *UAT and stabilisation* &mdash; Period: 25–28 Nov 2026.
  6. *Final readiness and handover preparation* &mdash; Target: 28–30 Nov 2026.
  7. *Production go-live* &mdash; TBD following formal UAT acceptance.
  8. *Hypercare* &mdash; 14 calendar days from actual go-live date.
  9. *Ongoing basic maintenance* &mdash; Complimentary long-term routine maintenance.
- **12 Client Requirements**: Seeded in the Action Required Centre across credentials delegation, schema exports, and domain details.

---

## 5. Demo Roles & Instant Switcher

LuxeOS includes an interactive role switcher in the top navigation to evaluate the platform from every user perspective:

| User | Email | Role | Scope |
|---|---|---|---|
| **Aria Vance** | `superadmin@theluxestudio.in` | Super Admin | Full governance, SMTP setup, audit logs |
| **Kabir Mehta** | `pm@theluxestudio.in` | Luxe PM | Milestone management, requirement review, updates |
| **Dev Sharma** | `dev@theluxestudio.in` | Internal Team | Task tracking, technical progress, UAT triage |
| **Rohan Jaikishan** | `owner@kalajay.com` | Client Owner | Milestones, prototype sign-off, approvals |
| **Priya Sen** | `tech@kalajay.com` | Client Collaborator | Requirements submission, defect logging |
| **Anand Verma** | `finance@kalajay.com` | Client Viewer | Read-only visibility into roadmap & updates |

*All accounts are pre-configured with default demo password: `Password123!`*

---

## 6. Quick Start & Local Execution

### Prerequisites
- Node.js 20+ / 22+
- npm 10+

### Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Push database schema & generate Prisma Client
npx prisma db push

# 3. Seed database with Kalajay project data
node prisma/seed.js

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view LuxeOS.

---

## 7. Operational Workflows Implemented

- **Workflow A (Requirements)**: Client submits ERP credentials / schema &rarr; LuxeStudio PM reviews &rarr; marks Accepted or returns with revisions &rarr; unblocks milestone.
- **Workflow B (Milestones)**: Admin updates gate status or progress &rarr; dynamically updates project overall progress &rarr; reflected on Client Dashboard.
- **Workflow C (Prototype Review)**: Client tests staging prototype in responsive frame &rarr; logs structured feedback &rarr; PM resolves feedback.
- **Workflow D (UAT & Defects)**: Client logs bug &rarr; team resolves &rarr; client verifies and closes.
- **Workflow E (Direct SMTP)**: Super Admin inputs SMTP host, port, credentials &rarr; tests handshake &rarr; dispatches live test email &rarr; monitors queue.
