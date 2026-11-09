'use client';

import React, { useState } from 'react';
import { FullProjectData, UserSession, MilestoneData } from '@/lib/types';
import { SmtpManagement } from './SmtpManagement';
import { RequirementsMatrixSheet } from '../requirements/RequirementsMatrixSheet';
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
  FileSpreadsheet,
  FileText,
  Sliders,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Lock,
  UserCheck,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface AdminWorkspaceProps {
  project: FullProjectData;
  currentUser: UserSession;
  onUpdateMilestone: (milestoneId: string, updates: any) => Promise<void>;
  onPublishUpdate: (update: any) => Promise<void>;
  onReload: () => Promise<void>;
  availableUsers?: Array<{ id: string; name: string; email: string; role: string }>;
}

export function AdminWorkspace({
  project,
  currentUser,
  onUpdateMilestone,
  onPublishUpdate,
  onReload,
  availableUsers = [],
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'milestones' | 'smtp' | 'updates'>('overview');
  
  // Milestone Edit State
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [newBlockers, setNewBlockers] = useState('');
  const [newClientActionRequired, setNewClientActionRequired] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState(false);

  // Create Milestone Modal State
  const [createMilestoneModalOpen, setCreateMilestoneModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createPhase, setCreatePhase] = useState('Development');
  const [createDescription, setCreateDescription] = useState('');
  const [createTargetDate, setCreateTargetDate] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createStatus, setCreateStatus] = useState('SCHEDULED');
  const [createProgress, setCreateProgress] = useState(0);
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  // Onboard New Client Modal
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newCategory, setNewCategory] = useState('Custom Web & E-Commerce');
  const [newAssignedPmId, setNewAssignedPmId] = useState('');
  const [onboarding, setOnboarding] = useState(false);

  // New Update Form
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateType, setUpdateType] = useState('PROGRESS');
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Prototype & Staging Link State
  const [workspacePrototypeUrl, setWorkspacePrototypeUrl] = useState(project.prototypeUrl || '');
  const [savingUrl, setSavingUrl] = useState(false);

  const handleSavePrototypeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUrl(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prototypeUrl: workspacePrototypeUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update prototype URL');
      await onReload();
      alert('Prototype URL updated successfully! It is now live in the client portal.');
    } catch (err: any) {
      alert(err.message || 'Error updating prototype URL');
    } finally {
      setSavingUrl(false);
    }
  };

  const pendingRequirements = (project.requirements || []).filter(
    (r) => !r.clientInput?.trim() && r.status !== 'ACCEPTED'
  );
  const openUatIssues = project.uatIssues.filter((i) => i.status !== 'CLOSED' && i.status !== 'RESOLVED');

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const handleOpenMilestoneEdit = (m: MilestoneData) => {
    setEditingMilestone(m);
    setEditTitle(m.title);
    setEditPhase(m.phase);
    setEditDescription(m.description || '');
    setEditTargetDate(m.targetDate ? new Date(m.targetDate).toISOString().split('T')[0] : '');
    setEditStartDate(m.startDate ? new Date(m.startDate).toISOString().split('T')[0] : '');
    setNewStatus(m.status);
    setNewProgress(m.progress);
    setNewBlockers(m.blockers || '');
    setNewClientActionRequired(m.clientActionRequired);
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !editTitle.trim()) return;

    setSavingMilestone(true);
    try {
      await onUpdateMilestone(editingMilestone.id, {
        title: editTitle.trim(),
        phase: editPhase.trim() || editingMilestone.phase,
        description: editDescription.trim(),
        targetDate: editTargetDate ? new Date(editTargetDate).toISOString() : null,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
        status: newStatus,
        progress: Number(newProgress),
        blockers: newBlockers || null,
        clientActionRequired: newClientActionRequired,
      });
      setEditingMilestone(null);
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error updating milestone');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!editingMilestone) return;
    if (
      !confirm(
        `Are you sure you want to delete Milestone #${editingMilestone.sequence}: "${editingMilestone.title}"?\nThis cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingMilestone(true);
    try {
      const res = await fetch(`/api/milestones/${editingMilestone.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete milestone');
      setEditingMilestone(null);
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error deleting milestone');
    } finally {
      setDeletingMilestone(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    setCreatingMilestone(true);
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: createTitle.trim(),
          phase: createPhase.trim() || 'Execution',
          description: createDescription.trim(),
          targetDate: createTargetDate ? new Date(createTargetDate).toISOString() : null,
          startDate: createStartDate ? new Date(createStartDate).toISOString() : null,
          status: createStatus,
          progress: Number(createProgress) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create milestone');

      setCreateTitle('');
      setCreatePhase('Development');
      setCreateDescription('');
      setCreateTargetDate('');
      setCreateStartDate('');
      setCreateStatus('SCHEDULED');
      setCreateProgress(0);
      setCreateMilestoneModalOpen(false);
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error creating milestone');
    } finally {
      setCreatingMilestone(false);
    }
  };

  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateContent.trim()) return;

    setPublishing(true);
    try {
      await onPublishUpdate({
        projectId: project.id,
        title: updateTitle,
        content: updateContent,
        type: updateType,
        isInternalOnly,
      });
      setUpdateTitle('');
      setUpdateContent('');
      await onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newProjectName.trim()) return;

    setOnboarding(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newClientName,
          projectName: newProjectName,
          category: newCategory,
          assignedPmId: isSuperAdmin ? (newAssignedPmId || currentUser.id) : currentUser.id,
        }),
      });

      setNewClientName('');
      setNewProjectName('');
      setOnboardModalOpen(false);
      await onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setOnboarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope Access Badge / Banner */}
      <div
        className={`rounded-xl border p-3 flex items-center justify-between text-xs ${
          isSuperAdmin
            ? 'border-[#C9A56A]/30 bg-[#C9A56A]/10 text-white'
            : 'border-blue-500/30 bg-blue-500/10 text-blue-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <Shield className="h-4 w-4 text-[#C9A56A]" />
          ) : (
            <Lock className="h-4 w-4 text-blue-400" />
          )}
          <span>
            {isSuperAdmin ? (
              <strong>Studio Owner (Master Access): You have full visibility across all studio projects and clients.</strong>
            ) : (
              <strong>Scoped Access: You are logged in as Nitin. You only see projects explicitly assigned to you.</strong>
            )}
          </span>
        </div>

        <button
          onClick={() => setOnboardModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#C9A56A] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow"
        >
          <Plus className="h-3.5 w-3.5" /> Onboard New Client
        </button>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A] font-semibold">
              Client: {project.organization?.name || 'Enterprise Client'}
            </span>
            <span className="text-zinc-600">&middot;</span>
            <span className="text-xs text-zinc-400 font-mono">
              Status: <span className="text-[#C9A56A] font-medium">{project.status}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white tracking-tight">
            {project.organization?.name ? `${project.organization.name} — ${project.name}` : project.name}
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Category: {project.category} &middot; Target Go-Live: {project.targetDate ? new Date(project.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#171719] p-1 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-md px-3 py-1 font-medium transition ${
              activeTab === 'overview'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`rounded-md px-3 py-1 font-medium transition ${
              activeTab === 'milestones'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Milestone Operations
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              activeTab === 'matrix'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Content &amp; Requirements Sheet</span>
            {pendingRequirements.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 font-bold">
                {pendingRequirements.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`rounded-md px-3 py-1 font-medium transition ${
              activeTab === 'updates'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Publish Updates
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('smtp')}
              className={`rounded-md px-3 py-1 font-medium transition ${
                activeTab === 'smtp'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              SMTP Settings
            </button>
          )}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow-lg space-y-1">
              <div className="text-xs text-zinc-400">Current Phase</div>
              <div className="text-lg font-serif font-semibold text-white truncate">
                {project.currentPhase}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">Sprint Active</p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-lg space-y-1">
              <div className="text-xs text-amber-300">Client Blockers</div>
              <div className="text-2xl font-serif font-bold text-white">
                {pendingRequirements.length}
              </div>
              <p className="text-[11px] text-amber-200/80">Pending from client</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow-lg space-y-1">
              <div className="text-xs text-zinc-400">Open UAT Defects</div>
              <div className="text-2xl font-serif font-bold text-white">
                {openUatIssues.length}
              </div>
              <p className="text-[11px] text-zinc-500">Quality verification</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow-lg space-y-1">
              <div className="text-xs text-zinc-400">Delivery Progress</div>
              <div className="text-2xl font-serif font-bold text-emerald-400 font-mono">
                {project.overallProgress}%
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">Target: 30 Nov 2026</p>
            </div>
          </div>

          {/* Client Staging Prototype Link Card */}
          <div className="rounded-2xl border border-white/10 bg-[#171719] p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A]">
                  Client Interactive Environment
                </span>
                <h3 className="text-sm font-semibold text-white mt-0.5">
                  Client Prototype &amp; Staging Preview Link
                </h3>
                <p className="text-xs text-zinc-400">
                  This URL is embedded in the client's interactive Prototype Preview Studio and linked on their dashboard hero.
                </p>
              </div>

              {project.prototypeUrl && (
                <a
                  href={project.prototypeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A56A]/40 bg-[#C9A56A]/10 px-3 py-1.5 text-xs text-[#C9A56A] hover:bg-[#C9A56A] hover:text-black transition font-semibold"
                >
                  <span>Open Live Preview</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <form onSubmit={handleSavePrototypeUrl} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={workspacePrototypeUrl}
                onChange={(e) => setWorkspacePrototypeUrl(e.target.value)}
                placeholder="https://staging.clientdomain.com or https://kalajay.theluxestudio.in"
                className="flex-1 rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={savingUrl}
                className="rounded-lg bg-[#C9A56A] px-4 py-2 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow disabled:opacity-50 shrink-0"
              >
                {savingUrl ? 'Updating...' : 'Save Prototype URL'}
              </button>
            </form>
          </div>

          {/* Project Management Table */}
          <div className="rounded-2xl border border-white/10 bg-[#171719] p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Delivery Gates &amp; Status Controls
                </h3>
                <span className="text-xs text-zinc-400">
                  Customizable stages, timelines &amp; client milestones ({project.milestones.length} gates active)
                </span>
              </div>
              <button
                onClick={() => setCreateMilestoneModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#C9A56A] px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Milestone</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 font-mono">
                    <th className="py-2 px-3">Gate</th>
                    <th className="py-2 px-3">Milestone Title</th>
                    <th className="py-2 px-3">Phase</th>
                    <th className="py-2 px-3">Target Date</th>
                    <th className="py-2 px-3">Progress</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {project.milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition">
                      <td className="py-2.5 px-3 font-mono text-[#C9A56A]">#{m.sequence}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{m.title}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{m.phase}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">
                        {m.targetDate
                          ? new Date(m.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className="text-zinc-500 italic">TBD</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{m.progress}%</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : m.status === 'IN_PROGRESS'
                              ? 'bg-[#C9A56A]/20 text-[#C9A56A] border border-[#C9A56A]/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenMilestoneEdit(m)}
                          className="rounded-lg border border-white/10 bg-[#0B0B0D] px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:border-[#C9A56A]/50 transition"
                        >
                          Edit &amp; Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-serif font-semibold text-white">Project Milestone Gates</h3>
              <p className="text-xs text-zinc-400">Configure progression, stage titles, and deliverable targets.</p>
            </div>
            <button
              onClick={() => setCreateMilestoneModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#C9A56A] px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Milestone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {project.milestones.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-white/10 bg-[#171719] p-4 shadow space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#C9A56A]">Gate #{m.sequence}</span>
                    <span className="text-zinc-500">&middot;</span>
                    <span className="text-zinc-400 font-mono">{m.phase}</span>
                  </div>
                  <button
                    onClick={() => handleOpenMilestoneEdit(m)}
                    className="rounded-lg bg-[#C9A56A]/10 border border-[#C9A56A]/30 px-2.5 py-1 text-xs text-[#C9A56A] font-semibold hover:bg-[#C9A56A]/20"
                  >
                    Edit Stage
                  </button>
                </div>
                <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                <p className="text-zinc-400 text-xs">{m.description}</p>
                <div className="flex justify-between font-mono pt-2 border-t border-white/5 text-[11px] text-zinc-400">
                  <span>Target: {m.targetDate ? new Date(m.targetDate).toLocaleDateString('en-GB') : 'TBD'}</span>
                  <span>Progress: {m.progress}% ({m.status})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Updates Tab */}
      {activeTab === 'updates' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#171719] p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Publish Project Notice or Sprint Update
            </h3>

            <form onSubmit={handlePublishUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g. ERP Architecture Review Commenced"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Update Type</label>
                <select
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                >
                  <option value="PROGRESS">Sprint Progress</option>
                  <option value="MILESTONE_COMPLETE">Milestone Completed</option>
                  <option value="NOTICE">Client Action Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Content *</label>
                <textarea
                  required
                  rows={4}
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  placeholder="Detail the sprint accomplishments..."
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internalOnly"
                  checked={isInternalOnly}
                  onChange={(e) => setIsInternalOnly(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#C9A56A]"
                />
                <label htmlFor="internalOnly" className="text-zinc-300">
                  Internal Only (Do not show to Client)
                </label>
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="w-full rounded-xl bg-[#C9A56A] py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish Update'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">Recent Project Notices</h3>
            {project.updates.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-white/5 bg-[#171719] p-3 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{u.title}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <p className="text-zinc-300">{u.content}</p>
                <div className="text-[10px] text-[#C9A56A] pt-1">
                  By {u.authorName} {u.isInternalOnly && '(Internal Only)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content & Requirements Matrix Sheet */}
      {activeTab === 'matrix' && (
        <RequirementsMatrixSheet
          projectId={project.id}
          projectName={project.organization?.name ? `${project.organization.name} — ${project.name}` : project.name}
          requirements={project.requirements}
          currentUser={currentUser}
          isInternalUser={true}
          onReload={onReload}
        />
      )}

      {/* SMTP Tab (Super Admin Only) */}
      {activeTab === 'smtp' && isSuperAdmin && <SmtpManagement />}

      {/* Onboard Client Modal */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A56A]">
                  Client Onboarding Wizard
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Onboard New Client &amp; Project
                </h3>
              </div>
              <button
                onClick={() => setOnboardModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Client / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Zara Jewels"
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
                  placeholder="e.g. E-Commerce Redesign & Custom CMS"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

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
                  <option value="Brand Experience & UI/UX">Brand Experience &amp; UI/UX</option>
                  <option value="Custom Software Platform">Custom Software Platform</option>
                </select>
              </div>

              {/* Assigned PM Field */}
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
                    <option value={currentUser.id}>Keep Private to Studio Leadership (You Only)</option>
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
                    ? 'Only the assigned manager will have visibility into this project.'
                    : 'Any project you onboard is automatically assigned to your dashboard.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
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
                  className="rounded-lg bg-[#C9A56A] px-4 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {onboarding ? 'Creating...' : 'Confirm Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Edit Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A56A]">
                  Edit Milestone &middot; Gate #{editingMilestone.sequence}
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Update Stage Name, Phase &amp; Timeline
                </h3>
              </div>
              <button
                onClick={() => setEditingMilestone(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4 text-xs">
              {/* Milestone Title */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Milestone Name / Title <span className="text-[#C9A56A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Discovery & Design System Sign-off"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3.5 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none text-xs"
                />
              </div>

              {/* Phase & Timeline Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Phase</label>
                  <input
                    type="text"
                    value={editPhase}
                    onChange={(e) => setEditPhase(e.target.value)}
                    placeholder="e.g. Discovery"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Scope & Description */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Scope &amp; Deliverables Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Summary of deliverables, client feedback cycles, and sign-off criteria..."
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none text-xs resize-none"
                />
              </div>

              {/* Status & Progress Slider */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="AWAITING_CLIENT">Awaiting Client</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Progress ({newProgress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-[#C9A56A]"
                  />
                </div>
              </div>

              {/* Active Blocker Note */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Active Blocker Note (Optional)
                </label>
                <input
                  type="text"
                  value={newBlockers}
                  onChange={(e) => setNewBlockers(e.target.value)}
                  placeholder="e.g. Awaiting client DNS or ERP access..."
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              {/* Action Required Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clientActionReq"
                  checked={newClientActionRequired}
                  onChange={(e) => setNewClientActionRequired(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#C9A56A]"
                />
                <label htmlFor="clientActionReq" className="text-zinc-300">
                  Mark as "Action Required from Client"
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleDeleteMilestone}
                  disabled={deletingMilestone}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50 text-xs font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{deletingMilestone ? 'Deleting...' : 'Delete Gate'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMilestone(null)}
                    className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMilestone}
                    className="rounded-lg bg-[#C9A56A] px-4 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                  >
                    {savingMilestone ? 'Saving...' : 'Save & Propagate'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Milestone Modal */}
      {createMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A56A]">
                  New Gate #{project.milestones.length + 1}
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Create Custom Milestone
                </h3>
              </div>
              <button
                onClick={() => setCreateMilestoneModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Milestone Name / Stage Title <span className="text-[#C9A56A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. ERP & Payment Gateway Integration"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3.5 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Phase</label>
                  <input
                    type="text"
                    value={createPhase}
                    onChange={(e) => setCreatePhase(e.target.value)}
                    placeholder="e.g. Development"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={createTargetDate}
                    onChange={(e) => setCreateTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Scope &amp; Deliverables Description
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Detailed description of what will be produced, reviewed, and signed off in this stage..."
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Initial Status</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="AWAITING_CLIENT">Awaiting Client</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Initial Progress ({createProgress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={createProgress}
                    onChange={(e) => setCreateProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-[#C9A56A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateMilestoneModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingMilestone}
                  className="rounded-lg bg-[#C9A56A] px-5 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {creatingMilestone ? 'Creating Gate...' : '+ Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
