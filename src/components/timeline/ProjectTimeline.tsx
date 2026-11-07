'use client';

import React, { useState } from 'react';
import { MilestoneData } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface ProjectTimelineProps {
  milestones: MilestoneData[];
  onUpdateMilestone?: (milestoneId: string, updates: any) => Promise<void>;
  isInternalUser?: boolean;
}

export function ProjectTimeline({
  milestones,
  onUpdateMilestone,
  isInternalUser,
}: ProjectTimelineProps) {
  const [activeView, setActiveView] = useState<'journey' | 'gantt'>('journey');
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneData | null>(
    milestones.find((m) => m.status === 'IN_PROGRESS') || milestones[0] || null
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Completed',
          badge: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60',
          dot: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
          icon: CheckCircle2,
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          badge: 'bg-[#C9A56A]/20 text-[#C9A56A] border-[#C9A56A]/50 font-semibold',
          dot: 'bg-[#C9A56A] active-milestone-pulse shadow-[0_0_16px_rgba(201,165,106,0.8)]',
          icon: Clock,
        };
      case 'BLOCKED':
        return {
          label: 'Blocked',
          badge: 'bg-rose-950/50 text-rose-400 border-rose-800/60',
          dot: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
          icon: AlertCircle,
        };
      case 'AWAITING_CLIENT':
        return {
          label: 'Awaiting Client',
          badge: 'bg-amber-950/50 text-amber-400 border-amber-800/60',
          dot: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'Scheduled',
          badge: 'bg-zinc-900 text-zinc-400 border-zinc-800',
          dot: 'bg-zinc-700',
          icon: Calendar,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Architecture &amp; Delivery Roadmap
            </span>
            <span className="rounded-full bg-[#C9A56A]/10 px-2 py-0.5 text-[10px] text-[#C9A56A] border border-[#C9A56A]/20">
              9 Milestones
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Project Journey Timeline
          </h2>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-white/10 bg-[#171719] p-1">
          <button
            onClick={() => setActiveView('journey')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeView === 'journey'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Journey Roadmap
          </button>
          <button
            onClick={() => setActiveView('gantt')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeView === 'gantt'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Calendar &amp; Schedule
          </button>
        </div>
      </div>

      {/* Main Timeline Body */}
      {activeView === 'journey' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Milestone List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-[#C9A56A] before:to-zinc-800">
              {milestones.map((m, idx) => {
                const config = getStatusConfig(m.status);
                const isSelected = selectedMilestone?.id === m.id;
                const isCurrent = m.status === 'IN_PROGRESS';

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMilestone(m)}
                    className={`group relative mb-6 cursor-pointer rounded-xl border p-5 transition-all ${
                      isSelected
                        ? 'border-[#C9A56A]/60 bg-[#171719] shadow-[0_0_30px_-5px_rgba(201,165,106,0.15)] ring-1 ring-[#C9A56A]/40'
                        : 'border-white/[0.08] bg-[#171719]/70 hover:border-white/20 hover:bg-[#171719]'
                    }`}
                  >
                    {/* Node Dot on vertical connector */}
                    <div
                      className={`absolute -left-[27px] sm:-left-[35px] top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0B0B0D] ${config.dot}`}
                    >
                      {m.status === 'COMPLETED' ? (
                        <Check className="h-3 w-3 text-black stroke-[3]" />
                      ) : (
                        <span className="text-[10px] font-bold text-black font-mono">
                          {m.sequence}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-[#C9A56A] uppercase tracking-wider">
                            Phase {m.sequence} &middot; {m.phase}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${config.badge}`}
                          >
                            {config.label}
                          </span>
                          {m.clientActionRequired && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="h-3 w-3" /> Action Required
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-white group-hover:text-[#E6D0A5] transition">
                          {m.title}
                        </h3>

                        <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                          {m.description}
                        </p>
                      </div>

                      {/* Right Meta (Target & Progress) */}
                      <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0 text-right gap-1 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                        <div className="text-[11px] font-mono text-zinc-400">
                          {m.targetDate ? (
                            <span>Target: {new Date(m.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          ) : (
                            <span className="text-zinc-500">Target: TBD</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#C9A56A] h-full rounded-full transition-all duration-500"
                              style={{ width: `${m.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium text-white">
                            {m.progress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Blockers Alert if any */}
                    {m.blockers && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs text-rose-300">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-rose-200">Current Dependency: </strong>
                          {m.blockers}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Details Drawer (4 cols) */}
          <div className="lg:col-span-4">
            {selectedMilestone ? (
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A56A]">
                      Milestone {selectedMilestone.sequence} Details
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        getStatusConfig(selectedMilestone.status).badge
                      }`}
                    >
                      {getStatusConfig(selectedMilestone.status).label}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-white mt-1">
                    {selectedMilestone.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedMilestone.phase}
                  </p>
                </div>

                {/* Progress Card */}
                <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Milestone Progress</span>
                    <span className="font-mono text-[#C9A56A] font-semibold">
                      {selectedMilestone.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#E6D0A5] to-[#C9A56A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedMilestone.progress}%` }}
                    />
                  </div>
                </div>

                {/* Dates & Governance */}
                <div className="space-y-3 text-xs border-y border-white/5 py-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Responsible Team</span>
                    <span className="text-zinc-200 font-medium">
                      {selectedMilestone.responsibleTeam}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Planned Start</span>
                    <span className="font-mono text-zinc-300">
                      {selectedMilestone.startDate
                        ? new Date(selectedMilestone.startDate).toLocaleDateString('en-GB')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Target Completion</span>
                    <span className="font-mono text-zinc-300">
                      {selectedMilestone.targetDate
                        ? new Date(selectedMilestone.targetDate).toLocaleDateString('en-GB')
                        : 'TBD post-UAT'}
                    </span>
                  </div>
                  {selectedMilestone.completedDate && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Actual Sign-off</span>
                      <span className="font-mono">
                        {new Date(selectedMilestone.completedDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tasks checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Work Breakdown &amp; Tasks ({selectedMilestone.tasks?.length || 0})
                  </h4>
                  {selectedMilestone.tasks && selectedMilestone.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMilestone.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0B0B0D]/30 p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                                task.isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'border border-zinc-700 text-zinc-500'
                              }`}
                            >
                              {task.isCompleted ? '✓' : ''}
                            </span>
                            <span
                              className={task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-200'}
                            >
                              {task.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Detailed task breakdown scheduled during sprint planning.
                    </p>
                  )}
                </div>

                {/* Deliverables summary */}
                {selectedMilestone.deliverablesSummary && (
                  <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A]">
                      Deliverables Checklist
                    </span>
                    <p className="text-xs text-zinc-300">
                      {selectedMilestone.deliverablesSummary}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* View B: Calendar & Gantt Roadmap */
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Project Schedule Timeline (Q4 2026)
              </h3>
              <p className="text-xs text-zinc-400">
                Visualizing planned vs actual progress across November delivery gates.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C9A56A]" /> Active Sprint
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-600" /> Scheduled
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px] space-y-3 py-2">
              {milestones.map((m) => {
                const config = getStatusConfig(m.status);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMilestone(m);
                      setActiveView('journey');
                    }}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0B0B0D]/40 p-3 hover:border-[#C9A56A]/40 transition cursor-pointer"
                  >
                    <div className="w-48 shrink-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {m.sequence}. {m.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {m.targetDate
                          ? new Date(m.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : 'Date TBD'}
                      </div>
                    </div>

                    <div className="relative flex-1 bg-zinc-900 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : m.status === 'IN_PROGRESS'
                            ? 'bg-gradient-to-r from-[#E6D0A5] to-[#C9A56A]'
                            : 'bg-zinc-700'
                        }`}
                        style={{ width: `${Math.max(m.progress, 5)}%` }}
                      />
                    </div>

                    <div className="w-14 text-right font-mono text-xs font-medium text-white">
                      {m.progress}%
                    </div>

                    <span
                      className={`w-28 text-center rounded-full py-0.5 text-[10px] font-mono border ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

