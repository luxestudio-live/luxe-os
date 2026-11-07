export type UserRole =
  | 'SUPER_ADMIN'
  | 'LUXE_PM'
  | 'INTERNAL_TEAM'
  | 'CLIENT_OWNER'
  | 'CLIENT_COLLABORATOR'
  | 'CLIENT_VIEWER';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  activeOrgId?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    brandColor: string;
  };
}

export interface MilestoneData {
  id: string;
  projectId: string;
  sequence: number;
  title: string;
  phase: string;
  status:
    | 'NOT_STARTED'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'AWAITING_CLIENT'
    | 'UNDER_REVIEW'
    | 'BLOCKED'
    | 'COMPLETED'
    | 'DELAYED'
    | 'CANCELLED';
  progress: number;
  startDate?: string | null;
  targetDate?: string | null;
  completedDate?: string | null;
  description: string;
  deliverablesSummary?: string | null;
  responsibleTeam: string;
  blockers?: string | null;
  clientActionRequired: boolean;
  tasks: TaskData[];
  requirements?: RequirementData[];
}

export interface TaskData {
  id: string;
  milestoneId: string;
  title: string;
  isCompleted: boolean;
  assignedTo?: string | null;
  dueDate?: string | null;
}

export interface RequirementData {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description: string;
  type: 'TEXT' | 'LONG_TEXT' | 'FILE' | 'CREDENTIALS_DELEGATION' | 'URL' | 'CONFIRMATION';
  isMandatory: boolean;
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'NEEDS_REVISION';
  dueDate?: string | null;
  value?: string | null;
  fileUrl?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

export interface DeliverableData {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileUrl?: string | null;
  version: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface DocumentData {
  id: string;
  projectId: string;
  name: string;
  category: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
  version: string;
  isInternalOnly: boolean;
  uploadedBy: string;
  createdAt: string;
}

export interface PrototypeFeedbackData {
  id: string;
  projectId: string;
  pageUrl: string;
  environment: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  screenshotUrl?: string | null;
  status: 'NEW' | 'TRIAGED' | 'ACCEPTED' | 'RESOLVED' | 'REJECTED';
  resolutionNotes?: string | null;
  submittedBy: string;
  resolvedBy?: string | null;
  createdAt: string;
}

export interface UatIssueData {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description: string;
  environment: string;
  pageUrl?: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'AWAITING_INFO' | 'READY_FOR_RETEST' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string | null;
  submittedBy: string;
  resolutionNotes?: string | null;
  verifiedBy?: string | null;
  clientConfirmed: boolean;
  createdAt: string;
}

export interface ProjectUpdateData {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  content: string;
  type: string;
  isInternalOnly: boolean;
  authorName: string;
  createdAt: string;
}

export interface SmtpConfigData {
  id: string;
  host: string;
  port: number;
  encryption: 'NONE' | 'SSL_TLS' | 'STARTTLS';
  username: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  isVerified: boolean;
  lastTestedAt?: string | null;
  testStatus?: string | null;
}

export interface EmailQueueData {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  eventType: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  lastError?: string | null;
  queuedAt: string;
  sentAt?: string | null;
}

export interface FullProjectData {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  currentPhase: string;
  overallProgress: number;
  targetDate?: string | null;
  goLiveDate?: string | null;
  hypercareDays: number;
  prototypeUrl?: string | null;
  stagingUrl?: string | null;
  productionUrl?: string | null;
  assignedPmId?: string | null;
  assignedPmName?: string | null;
  createdById?: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    brandColor: string;
    logoUrl?: string | null;
  };
  milestones: MilestoneData[];
  requirements: RequirementData[];
  deliverables: DeliverableData[];
  documents: DocumentData[];
  feedbacks: PrototypeFeedbackData[];
  uatIssues: UatIssueData[];
  updates: ProjectUpdateData[];
}

