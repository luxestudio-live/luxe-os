'use client';

import React from 'react';
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
  const pendingRequirements = project.requirements.filter((r) => r.status === 'PENDING');
  const activeMilestone = project.milestones.find((m) => m.status === 'IN_PROGRESS') || project.milestones[0];

  return (
    <div className="space-y-6">
      {/* 1. Calm Editorial Hero Card */}
      <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C9A56A] shadow-[0_0_8px_#C9A56A]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#C9A56A]">
                Current Phase: {activeMilestone.phase}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white tracking-tight">
              {project.name}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Target completion date: <strong className="text-zinc-200">30 November 2026</strong>. Includes full custom e-commerce storefront, ERP synchronisation, and 14-day hypercare support.
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
              href="https://kalajay.theluxestudio.in/"
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
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Action Needed ({pendingRequirements.length} Items)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Urgent Action Callout (If pending) */}
      {pendingRequirements.length > 0 && (
        <div
          onClick={() => onNavigateTab('actions')}
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/60 transition cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-white">
                LuxeStudio is awaiting inputs for Milestone 2: ERP Integration
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Priority: ERP source code repository access and sanitized database schema export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 shrink-0">
            <span>Review &amp; Submit</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      )}

      {/* 3. Clean Project Journey (9 Milestones At-a-Glance) */}
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

      {/* 4. Contact & Recent Update in One Calm Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Lead */}
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0D] border border-[#C9A56A]/40 text-[#C9A56A] font-serif font-bold text-sm">
              KM
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Kabir Mehta</div>
              <div className="text-[11px] text-zinc-400">Dedicated Project Manager</div>
              <div className="text-[11px] font-mono text-[#C9A56A]">pm@theluxestudio.in</div>
            </div>
          </div>
          <a
            href="mailto:pm@theluxestudio.in?subject=Kalajay%20Project%20Query"
            className="rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-1.5 text-xs text-white hover:border-[#C9A56A]/50 transition flex items-center gap-1.5"
          >
            <Mail className="h-3 w-3 text-[#C9A56A]" /> Email PM
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
