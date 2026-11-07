'use client';

import React, { useState } from 'react';
import { UserSession, UserRole } from '@/lib/types';
import {
  Shield,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Mail,
  Send,
  FileText,
  Sliders,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Lock,
  UserCheck,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Search,
  Filter,
  Users,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface ProjectSummary {
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
  assignedPmId?: string | null;
  assignedPmName?: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    brandColor: string;
  };
  milestones?: Array<{
    id: string;
    sequence: number;
    title: string;
    status: string;
    progress: number;
    targetDate?: string | null;
    clientActionRequired: boolean;
  }>;
}

interface ProjectPortfolioHubProps {
  currentUser: UserSession;
  projects: ProjectSummary[];
  availableUsers: Array<{ id: string; name: string; email: string; role: string }>;
  onSelectProject?: (projectId: string) => void;
  onReload: () => Promise<void>;
}

export function ProjectPortfolioHub({
  currentUser,
  projects,
  availableUsers,
  onSelectProject,
  onReload,
}: ProjectPortfolioHubProps) {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_PROGRESS' | 'HYPERCARE' | 'LIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Onboard Client Modal & Form State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newCategory, setNewCategory] = useState('Custom Web & E-Commerce');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientContactName, setNewClientContactName] = useState('');
  const [newCustomPassword, setNewCustomPassword] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('2026-12-15');
  const [newHypercareDays, setNewHypercareDays] = useState(14);
  const [newAssignedPmId, setNewAssignedPmId] = useState('');
  const [onboarding, setOnboarding] = useState(false);

  // Success Credentials Handover Modal
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    clientName: string;
    projectName: string;
    email: string;
    temporaryPassword: string;
    portalUrl: string;
    copied: boolean;
  } | null>(null);

  // Runtime Timeline & Hypercare Editor Modal
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [editStatus, setEditStatus] = useState('IN_PROGRESS');
  const [editPhase, setEditPhase] = useState('');
  const [editProgress, setEditProgress] = useState(15);
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editGoLiveDate, setEditGoLiveDate] = useState('');
  const [editHypercareDays, setEditHypercareDays] = useState(14);
  const [editAssignedPmId, setEditAssignedPmId] = useState('');
  const [savingTimeline, setSavingTimeline] = useState(false);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'HYPERCARE'
        ? p.status === 'HYPERCARE'
        : filterStatus === 'LIVE'
        ? p.status === 'LIVE'
        : p.status === 'IN_PROGRESS' || p.status === 'UAT' || p.status === 'DISCOVERY';

    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.assignedPmName && p.assignedPmName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Calculate High-Level Gist Metrics
  const totalProjects = projects.length;
  const inHypercareCount = projects.filter((p) => p.status === 'HYPERCARE').length;
  const inProgressCount = projects.filter((p) => p.status !== 'LIVE' && p.status !== 'HYPERCARE').length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.overallProgress, 0) / totalProjects)
      : 0;

  // Format dates
  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Open Runtime Timeline Editor
  const handleOpenTimelineEditor = (p: ProjectSummary) => {
    setEditingProject(p);
    setEditStatus(p.status);
    setEditPhase(p.currentPhase);
    setEditProgress(p.overallProgress);
    setEditTargetDate(p.targetDate ? p.targetDate.split('T')[0] : '');
    setEditGoLiveDate(
      p.goLiveDate
        ? p.goLiveDate.split('T')[0]
        : p.status === 'HYPERCARE'
        ? new Date().toISOString().split('T')[0]
        : ''
    );
    setEditHypercareDays(p.hypercareDays || 14);
    setEditAssignedPmId(p.assignedPmId || '');
  };

  // Save Runtime Timeline & Hypercare Changes
  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setSavingTimeline(true);
    try {
      await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          currentPhase: editPhase,
          overallProgress: editProgress,
          targetDate: editTargetDate || null,
          goLiveDate: editStatus === 'HYPERCARE' && !editGoLiveDate ? new Date() : editGoLiveDate || null,
          hypercareDays: editHypercareDays,
          assignedPmId: isSuperAdmin ? editAssignedPmId : undefined,
        }),
      });

      setEditingProject(null);
      await onReload();
    } catch (err) {
      console.error('Error saving timeline in runtime:', err);
    } finally {
      setSavingTimeline(false);
    }
  };

  // Handle Client Onboard Submit
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newProjectName.trim()) return;

    setOnboarding(true);
    try {
      const generatedPass = newCustomPassword.trim() || `Luxe-${Math.floor(1000 + Math.random() * 9000)}!`;
      const clientEmail = (newClientEmail.trim() || `${newClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com`);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newClientName,
          projectName: newProjectName,
          category: newCategory,
          clientEmail,
          clientContactName: newClientContactName || `${newClientName} Contact`,
          customPassword: generatedPass,
          targetDate: newTargetDate,
          hypercareDays: newHypercareDays,
          assignedPmId: isSuperAdmin ? (newAssignedPmId || currentUser.id) : currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard client');

      // Pop credentials handover kit modal
      setCredentialsModal({
        isOpen: true,
        clientName: newClientName,
        projectName: newProjectName,
        email: clientEmail,
        temporaryPassword: generatedPass,
        portalUrl: `${window.location.origin}/login`,
        copied: false,
      });

      // Reset form
      setNewClientName('');
      setNewProjectName('');
      setNewClientEmail('');
      setNewClientContactName('');
      setNewCustomPassword('');
      setOnboardModalOpen(false);
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error onboarding client');
    } finally {
      setOnboarding(false);
    }
  };

  // Copy Handover Kit
  const handleCopyCredentials = () => {
    if (!credentialsModal) return;
    const text = `LUXEOS CLIENT ACCESS DETAILS\n\nClient: ${credentialsModal.clientName}\nProject: ${credentialsModal.projectName}\nPortal URL: ${credentialsModal.portalUrl}\nEmail / Username: ${credentialsModal.email}\nTemporary Password: ${credentialsModal.temporaryPassword}\n\n*Important: You will be asked to choose a permanent private password on your first login.*`;

    navigator.clipboard.writeText(text);
    setCredentialsModal({ ...credentialsModal, copied: true });
    setTimeout(() => {
      setCredentialsModal((prev) => (prev ? { ...prev, copied: false } : null));
    }, 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A56A]">
              Operational Intelligence
            </span>
            <span className="rounded bg-[#C9A56A]/10 px-2 py-0.5 text-[10px] text-[#C9A56A] font-mono border border-[#C9A56A]/20">
              {isSuperAdmin ? 'Master Studio View' : 'Assigned Accounts Only'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white tracking-tight mt-1">
            Client Onboarding &amp; Project Health Matrix
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time delivery progress, milestone health, runtime timeline controls, and hypercare countdowns.
          </p>
        </div>

        <button
          onClick={() => setOnboardModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#C9A56A] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow-lg shadow-[#C9A56A]/20"
        >
          <Plus className="h-4 w-4" />
          <span>+ Onboard New Client</span>
        </button>
      </div>

      {/* "Where We Are In A Gist" — 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono">
            <span>Scoped Projects</span>
            <Briefcase className="h-3.5 w-3.5 text-[#C9A56A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalProjects}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {isSuperAdmin ? 'Full Studio Registry' : 'Assigned to Nitin'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono">
            <span>In Active Sprints</span>
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-blue-300 font-mono">Discovery to UAT</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono">
            <span>Hypercare Window</span>
            <Zap className="h-3.5 w-3.5 animate-pulse text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {inHypercareCount}
          </div>
          <div className="text-[11px] text-amber-400 font-mono">Live SLA Guarantee</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono">
            <span>Avg Studio Progress</span>
            <Sparkles className="h-3.5 w-3.5 text-[#C9A56A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#C9A56A] mt-1">
            {avgProgress}%
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">Weighted Deliverables</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              filterStatus === 'ALL'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'bg-[#171719] text-zinc-400 hover:text-white'
            }`}
          >
            All Accounts ({totalProjects})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'bg-[#171719] text-zinc-400 hover:text-white'
            }`}
          >
            In Delivery ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('HYPERCARE')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
              filterStatus === 'HYPERCARE'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'bg-[#171719] text-amber-300 hover:text-white'
            }`}
          >
            <span>● Hypercare</span>
            {inHypercareCount > 0 && (
              <span className="rounded-full bg-black/20 px-1 py-0.2 text-[9px] font-mono">
                {inHypercareCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client, project, PM..."
            className="w-full rounded-xl border border-white/10 bg-[#171719] px-3 py-1.5 pl-8 text-xs text-white placeholder-zinc-500 focus:border-[#C9A56A] focus:outline-none"
          />
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
        </div>
      </div>

      {/* Project Matrix / Cards (Where We Are In A Gist) */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#171719] p-8 text-center text-xs text-zinc-400 space-y-2">
            <p>No projects match your current filter.</p>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setSearchQuery('');
              }}
              className="text-[#C9A56A] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const isHypercare = p.status === 'HYPERCARE';
            const goLive = p.goLiveDate ? new Date(p.goLiveDate) : null;
            const hyperDays = p.hypercareDays || 14;
            const hypercareEndDate = goLive
              ? new Date(goLive.getTime() + hyperDays * 24 * 60 * 60 * 1000)
              : null;

            // Compute remaining days
            let remainingDays = 0;
            let percentElapsed = 0;
            if (isHypercare && goLive && hypercareEndDate) {
              const now = new Date().getTime();
              const diff = hypercareEndDate.getTime() - now;
              remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
              const total = hypercareEndDate.getTime() - goLive.getTime();
              percentElapsed = Math.min(100, Math.max(0, Math.round(((now - goLive.getTime()) / total) * 100)));
            }

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 transition-all shadow-xl space-y-4 ${
                  isHypercare
                    ? 'border-amber-500/40 bg-gradient-to-br from-[#1c1811] to-[#121214]'
                    : 'border-white/10 bg-[#171719] hover:border-white/20'
                }`}
              >
                {/* Project Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-base">
                        {p.organization.name}
                      </span>
                      <span className="text-zinc-600">&middot;</span>
                      <span className="text-zinc-300 text-sm font-medium">
                        {p.name}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
                        {p.category}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
                      <span>Phase: <strong className="text-zinc-200">{p.currentPhase}</strong></span>
                      <span>&middot;</span>
                      <span>Manager: <strong className="text-[#C9A56A]">{p.assignedPmName || 'Studio Leadership'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-mono border ${
                        isHypercare
                          ? 'bg-amber-950/60 text-amber-300 border-amber-600 animate-pulse'
                          : p.status === 'LIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {isHypercare ? '● HYPERCARE ACTIVE' : p.status}
                    </span>

                    <button
                      onClick={() => handleOpenTimelineEditor(p)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0B0D] px-2.5 py-1.5 text-xs text-zinc-300 hover:border-[#C9A56A] hover:text-[#C9A56A] transition font-medium"
                      title="Edit timeline and hypercare in runtime"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit Timeline</span>
                    </button>

                    {onSelectProject && (
                      <button
                        onClick={() => onSelectProject(p.id)}
                        className="rounded-lg bg-[#C9A56A]/15 border border-[#C9A56A]/30 px-2.5 py-1.5 text-xs text-[#C9A56A] hover:bg-[#C9A56A] hover:text-black transition font-semibold"
                      >
                        Open Workspace &rarr;
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Stage Indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Total Completion</span>
                    <span className="text-white font-bold">{p.overallProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isHypercare
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                          : 'bg-gradient-to-r from-[#C9A56A] to-amber-300'
                      }`}
                      style={{ width: `${p.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Hypercare Active Banner (If In Hypercare) */}
                {isHypercare && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold font-mono">
                        <Zap className="h-4 w-4 animate-pulse text-amber-400" />
                        <span>Hypercare SLA Active &middot; {remainingDays} Days Remaining</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Went Live: <strong className="text-white">{formatDate(p.goLiveDate)}</strong> &middot; Windows Closes: <strong className="text-white">{formatDate(hypercareEndDate)}</strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>Stabilization Window</span>
                        <span>{percentElapsed}% Elapsed</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${percentElapsed}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="rounded-lg bg-[#0B0B0D]/50 border border-white/5 p-2.5">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono block">Target Cutover</span>
                    <span className="font-mono text-zinc-200 font-medium">{formatDate(p.targetDate)}</span>
                  </div>

                  <div className="rounded-lg bg-[#0B0B0D]/50 border border-white/5 p-2.5">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono block">Hypercare SLA</span>
                    <span className="font-mono text-[#C9A56A] font-medium">{p.hypercareDays || 14} Calendar Days</span>
                  </div>

                  <div className="rounded-lg bg-[#0B0B0D]/50 border border-white/5 p-2.5">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono block">Staging Preview</span>
                    <span className="font-mono text-zinc-300 truncate block">
                      {p.stagingUrl || p.prototypeUrl ? (
                        <a
                          href={p.stagingUrl || p.prototypeUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C9A56A] hover:underline flex items-center gap-1"
                        >
                          <span>Open Prototype</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        'None configured'
                      )}
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#0B0B0D]/50 border border-white/5 p-2.5">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono block">Active Gate</span>
                    <span className="font-mono text-zinc-200 truncate block">
                      {p.milestones && p.milestones.length > 0
                        ? p.milestones.find((m) => m.status === 'IN_PROGRESS')?.title || 'All Milestones Complete'
                        : 'Gate in discovery'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Onboard New Client */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A]">
                  New Client Workspace
                </span>
                <h3 className="text-lg font-serif font-semibold text-white mt-0.5">
                  Onboard Enterprise Client
                </h3>
              </div>
              <button
                onClick={() => setOnboardModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              {/* Client & Project Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Client Organization / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Kalajay or Aurum"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Custom E-Commerce & ERP"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="Custom Web & E-Commerce">Custom Web &amp; E-Commerce</option>
                    <option value="ERP Integration & Automation">ERP Integration &amp; Automation</option>
                    <option value="Luxury Brand Experience">Luxury Brand Experience</option>
                    <option value="Custom Software Platform">Custom Software Platform</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Target Go-Live Date
                  </label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Client Owner Login Credentials Setup */}
              <div className="rounded-xl border border-white/10 bg-[#0B0B0D] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#C9A56A] uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Client Owner Access Credentials
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Will be prompted to change on first login
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">
                      Client Contact Name
                    </label>
                    <input
                      type="text"
                      value={newClientContactName}
                      onChange={(e) => setNewClientContactName(e.target.value)}
                      placeholder="e.g. Rohan Jaikishan"
                      className="w-full rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">
                      Client Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="e.g. owner@kalajay.com"
                      className="w-full rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Temporary Password (Optional — auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={newCustomPassword}
                    onChange={(e) => setNewCustomPassword(e.target.value)}
                    placeholder="Leave blank for secure auto-generated password"
                    className="w-full rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-white placeholder-zinc-600 font-mono focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Hypercare & Assigned PM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Hypercare Window Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={newHypercareDays}
                    onChange={(e) => setNewHypercareDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Default: 14 days complimentary</p>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Assigned Project Manager
                  </label>
                  {isSuperAdmin ? (
                    <select
                      value={newAssignedPmId}
                      onChange={(e) => setNewAssignedPmId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                    >
                      <option value={currentUser.id}>Private to Studio Leadership (You)</option>
                      {availableUsers
                        .filter((u) => u.role === 'LUXE_PM')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            Assign to {u.name} (Subordinate PM)
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="rounded-lg border border-white/5 bg-[#0B0B0D] p-2.5 text-zinc-300 font-mono flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#C9A56A]" />
                      <span>Automatically Tagged to Nitin (You)</span>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {isSuperAdmin
                      ? 'Nitin only sees projects explicitly assigned to him.'
                      : 'Any project you onboard is automatically assigned to your dashboard.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboarding}
                  className="rounded-lg bg-[#C9A56A] px-5 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {onboarding ? 'Onboarding...' : 'Confirm Onboard & Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Credentials Handover Kit (Immediate Display upon onboarding) */}
      {credentialsModal && credentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#C9A56A]/40 bg-[#171719] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-semibold text-white">
                    Client Onboarded Successfully
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Workspace created for <strong className="text-white">{credentialsModal.clientName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredentialsModal(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0B0B0D] p-4 space-y-3 font-mono text-xs">
              <div className="text-[10px] uppercase text-[#C9A56A] font-bold tracking-wider">
                Client Access Handover Kit
              </div>

              <div className="space-y-1.5 text-zinc-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Portal URL:</span>
                  <span className="text-white select-all">{credentialsModal.portalUrl}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Client Email:</span>
                  <span className="text-white select-all">{credentialsModal.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Temporary Password:</span>
                  <span className="text-[#C9A56A] font-bold select-all">{credentialsModal.temporaryPassword}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Security Rule:</span>
                  <span className="text-amber-300">Prompted to change on first login</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
              Share these credentials with your client via Email or WhatsApp. Their account is configured to require a password reset upon their first successful sign-in.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleCopyCredentials}
                className="flex items-center gap-2 rounded-lg bg-[#C9A56A] px-5 py-2.5 font-semibold text-black hover:bg-[#B89355] transition text-xs shadow-lg"
              >
                {credentialsModal.copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Client Invitation Kit</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setCredentialsModal(null)}
                className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Runtime Timeline & Hypercare Editor */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A56A]">
                  Runtime Delivery Governance
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Edit Timeline &amp; Hypercare: {editingProject.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTimeline} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Project Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      setEditStatus(e.target.value);
                      if (e.target.value === 'HYPERCARE' && !editGoLiveDate) {
                        setEditGoLiveDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="DISCOVERY">Discovery</option>
                    <option value="IN_PROGRESS">In Progress (Delivery)</option>
                    <option value="UAT">UAT &amp; Stabilisation</option>
                    <option value="HYPERCARE">● HYPERCARE (Active Countdown)</option>
                    <option value="LIVE">Live &amp; Operational</option>
                    <option value="MAINTENANCE">Maintenance SLA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Overall Progress ({editProgress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-[#C9A56A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Current Delivery Phase</label>
                <input
                  type="text"
                  value={editPhase}
                  onChange={(e) => setEditPhase(e.target.value)}
                  placeholder="e.g. Phase 2: ERP Review & Integration"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              {/* Hypercare Settings in Runtime */}
              <div className="rounded-xl border border-white/10 bg-[#0B0B0D] p-3.5 space-y-3">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                  <span className="text-[#C9A56A] font-semibold">Hypercare Runtime Settings</span>
                  <span>Auto-calculates countdown</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">
                      Go-Live Date {editStatus === 'HYPERCARE' && '(Required for countdown)'}
                    </label>
                    <input
                      type="date"
                      value={editGoLiveDate}
                      onChange={(e) => setEditGoLiveDate(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">
                      Hypercare Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={editHypercareDays}
                      onChange={(e) => setEditHypercareDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
              </div>

              {/* PM Reassignment (Owner only) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Assigned Project Manager</label>
                  <select
                    value={editAssignedPmId}
                    onChange={(e) => setEditAssignedPmId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value={currentUser.id}>Studio Leadership (Private)</option>
                    {availableUsers
                      .filter((u) => u.role === 'LUXE_PM')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          Assign to {u.name} (Subordinate PM)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTimeline}
                  className="rounded-lg bg-[#C9A56A] px-4 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {savingTimeline ? 'Updating in Runtime...' : 'Apply Timeline Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
