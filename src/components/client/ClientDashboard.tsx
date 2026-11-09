'use client';

import React, { useState } from 'react';
import { FullProjectData, UserSession } from '@/lib/types';
import {
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Mail,
  ChevronRight,
  Sparkles,
  Zap,
  KeyRound,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';

interface ClientDashboardProps {
  project: FullProjectData;
  currentUser: UserSession;
  onNavigateTab: (tab: 'timeline' | 'preview' | 'actions' | 'documents' | 'uat' | 'hypercare') => void;
}

export function ClientDashboard({
  project,
  currentUser,
  onNavigateTab,
}: ClientDashboardProps) {
  const pendingRequirements = project.requirements.filter(
    (r) => !r.clientInput?.trim() && r.status !== 'ACCEPTED'
  );
  const activeMilestone = project.milestones.find((m) => m.status === 'IN_PROGRESS') || project.milestones[0];
  const isHypercare = project.status === 'HYPERCARE';

  // First Login Password Change State
  const [mustChangePassword, setMustChangePassword] = useState(currentUser.mustChangePassword || false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword.length < 8) {
      setPassError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setPassSuccess(true);
      setTimeout(() => {
        setMustChangePassword(false);
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Error updating password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 0. First Login Password Change Security Modal */}
      {mustChangePassword && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1c1811] to-[#121214] p-6 shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Welcome to LuxeOS &mdash; Set Your Private Password
                </h3>
                <p className="text-xs text-zinc-400">
                  You are currently using a temporary access password. Please set a secure permanent password to protect your project workspace.
                </p>
              </div>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold uppercase">
              Action Required
            </span>
          </div>

          {passError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              {passError}
            </div>
          )}

          {passSuccess ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Password successfully updated! Your session is now secure.</span>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    New Permanent Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3.5 py-2 text-xs text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Confirm Permanent Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3.5 py-2 text-xs text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="rounded-xl bg-[#C9A56A] px-5 py-2 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow"
                >
                  {changingPass ? 'Saving New Password...' : 'Save & Secure Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 1. Hypercare Active Spotlight (If in Hypercare) */}
      {isHypercare && (
        <div
          onClick={() => onNavigateTab('hypercare')}
          className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#171719] to-amber-950/20 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/70 transition"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">
                  ● Hypercare Window Active
                </span>
                <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                  Went Live: {project.goLiveDate ? new Date(project.goLiveDate).toLocaleDateString('en-GB') : 'Today'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Your digital product is live in production. Dedicated daily monitoring, critical SLA coverage, and stabilization taskforce are running.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition shadow">
              Open Hypercare SLA Tracker &rarr;
            </span>
          </div>
        </div>
      )}

      {/* 2. Calm Editorial Hero Card */}
      <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C9A56A] shadow-[0_0_8px_#C9A56A]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#C9A56A]">
                Current Phase: {project.currentPhase}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white tracking-tight">
              {project.name}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Target Go-Live Date:{' '}
              <strong className="text-zinc-200">
                {project.targetDate ? new Date(project.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 November 2026'}
              </strong>
              . Deliverables and integrations conclude at launch, followed by{' '}
              <strong className="text-zinc-200">{project.hypercareDays || 14} days of complimentary post-launch hypercare support</strong>
              {' '}(extending through{' '}
              <strong className="text-[#C9A56A]">
                {(() => {
                  const base = project.goLiveDate ? new Date(project.goLiveDate) : (project.targetDate ? new Date(project.targetDate) : new Date('2026-11-30'));
                  const end = new Date(base.getTime() + (project.hypercareDays || 14) * 24 * 60 * 60 * 1000);
                  return end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                })()}
              </strong>
              ) before transitioning into standard maintenance.
            </p>

            {/* Clean Progress Meter */}
            <div className="pt-2 space-y-1.5 max-w-md">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Overall Progress</span>
                <span className="text-[#C9A56A] font-semibold">{project.overallProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="bg-[#C9A56A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.overallProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <a
              href={project.prototypeUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#C9A56A] px-5 py-3 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow-md"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Staging Prototype
            </a>

            {pendingRequirements.length > 0 && (
              <button
                onClick={() => onNavigateTab('actions')}
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition shadow-sm"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Fill Content Matrix ({pendingRequirements.length} Pending)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Content Matrix Callout (If pending) */}
      {pendingRequirements.length > 0 && (
        <div
          onClick={() => onNavigateTab('actions')}
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/60 transition cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-white">
                Website Content &amp; Requirements Matrix &mdash; Action Required
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fill in your approved brand copy under <strong className="text-[#C9A56A]">Client Actual Data / Input (Fill Here)</strong> and attach Google Drive asset links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 shrink-0">
            <span>Open Interactive Sheet</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      )}

      {/* 4. Clean Project Journey (Milestones At-a-Glance) */}
      <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Project Delivery Gates
            </h3>
            <p className="text-xs text-zinc-400">
              Clear progression from approved prototype to public launch &amp; hypercare.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('timeline')}
            className="text-xs text-[#C9A56A] hover:underline flex items-center gap-1"
          >
            Detailed View &rarr;
          </button>
        </div>

        {/* Simplified Milestones Step List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {project.milestones.slice(0, 6).map((m) => {
            const isCompleted = m.status === 'COMPLETED';
            const isActive = m.status === 'IN_PROGRESS';

            return (
              <div
                key={m.id}
                onClick={() => onNavigateTab('timeline')}
                className={`rounded-xl border p-3.5 transition cursor-pointer space-y-2 ${
                  isActive
                    ? 'border-[#C9A56A]/60 bg-[#C9A56A]/5'
                    : isCompleted
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-white/5 bg-[#0B0B0D]/40 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Gate {m.sequence}</span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[9px] font-medium ${
                      isCompleted
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : isActive
                        ? 'text-[#C9A56A] bg-[#C9A56A]/20 font-bold'
                        : 'text-zinc-500'
                    }`}
                  >
                    {isCompleted ? 'Done ✓' : isActive ? 'Active Now' : 'Scheduled'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white truncate">
                  {m.title}
                </div>

                <div className="text-[10px] text-zinc-400 flex justify-between font-mono">
                  <span>
                    {m.targetDate
                      ? new Date(m.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : 'Post-UAT'}
                  </span>
                  <span>{m.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Contact & Recent Update in One Calm Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Studio Operations & Direct Delivery Desk */}
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0D] border border-[#C9A56A]/40 text-[#C9A56A] font-serif font-bold text-sm">
              LS
            </div>
            <div>
              <div className="text-xs font-semibold text-white">LuxeStudio Core Team</div>
              <div className="text-[11px] text-zinc-400">Operations &amp; Delivery Desk</div>
              <div className="text-[11px] font-mono text-[#C9A56A]">hello@theluxestudio.in</div>
            </div>
          </div>
          <a
            href="mailto:hello@theluxestudio.in?subject=Project%20Delivery%20Inquiry"
            className="rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-1.5 text-xs text-white hover:border-[#C9A56A]/50 transition flex items-center gap-1.5"
          >
            <Mail className="h-3 w-3 text-[#C9A56A]" /> Contact Studio
          </a>
        </div>

        {/* Latest Notice */}
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
              <span className="text-[#C9A56A]">Latest Verified Update</span>
              <span>{project.updates[0] ? new Date(project.updates[0].createdAt).toLocaleDateString('en-GB') : ''}</span>
            </div>
            <div className="text-xs font-semibold text-white truncate">
              {project.updates[0]?.title || 'Sprint Initialized'}
            </div>
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
              {project.updates[0]?.content || 'Milestones configured and awaiting initial assets.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
