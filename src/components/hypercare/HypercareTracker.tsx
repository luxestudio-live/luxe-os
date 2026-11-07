'use client';

import React from 'react';
import { FullProjectData } from '@/lib/types';
import {
  Clock,
  ShieldCheck,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface HypercareTrackerProps {
  project: FullProjectData;
}

export function HypercareTracker({ project }: HypercareTrackerProps) {
  const isLive = project.status === 'LIVE' || project.status === 'HYPERCARE';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Post-Launch Operations &amp; Longevity
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-mono border border-emerald-500/20">
              14-Day Complimentary Hypercare Window
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Hypercare &amp; Maintenance Management
          </h2>
        </div>
      </div>

      {/* Hypercare Status Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#171719] to-[#0B0B0D] p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A]">
              Milestone 8 SLA Commitment
            </span>
            <h3 className="text-lg font-serif font-semibold text-white mt-0.5">
              Two-Week Post-Launch Hypercare Window
            </h3>
            <p className="text-xs text-zinc-400">
              Commences on actual production cutover date following formal UAT acceptance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-mono border ${
                isLive
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {isLive ? 'ACTIVE HYPERCARE' : 'PRE-LAUNCH (SCHEDULED)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-1">
            <span className="text-zinc-500 font-mono">Estimated Start</span>
            <div className="text-base font-semibold text-white font-mono">
              30 Nov 2026
            </div>
            <p className="text-[11px] text-zinc-500">Dependent on Gate 6 &amp; 7 sign-off</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-1">
            <span className="text-zinc-500 font-mono">Hypercare Duration</span>
            <div className="text-base font-semibold text-[#C9A56A] font-mono">
              14 Calendar Days
            </div>
            <p className="text-[11px] text-zinc-500">Dedicated daily triage taskforce</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-1">
            <span className="text-zinc-500 font-mono">Transition to Maintenance</span>
            <div className="text-base font-semibold text-white font-mono">
              Mid-December 2026
            </div>
            <p className="text-[11px] text-emerald-400">Complimentary ongoing routine SLA</p>
          </div>
        </div>
      </div>

      {/* Maintenance Policy & Change Requests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Included Maintenance Scope */}
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C9A56A]" />
            Included Basic Maintenance Scope
          </h3>
          <p className="text-xs text-zinc-400">
            Covered under LuxeStudio's core delivery obligations at no additional maintenance fee:
          </p>

          <ul className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Critical bug fixes for delivered custom codebase and ERP connectors</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Routine framework dependency patches &amp; security maintenance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Monthly database vacuuming, storage monitoring &amp; uptime inspection</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>SSL certificate auto-renewal oversight and DNS health validation</span>
            </li>
          </ul>
        </div>

        {/* Change Request Procedures */}
        <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#C9A56A]" />
            Separately Scoped Enhancements (CRs)
          </h3>
          <p className="text-xs text-zinc-400">
            New features beyond approved Milestone 1 scope follow structured change governance:
          </p>

          <div className="space-y-2 text-xs text-zinc-300">
            <div className="rounded-lg border border-white/5 bg-[#0B0B0D]/50 p-3">
              <strong className="text-white">1. Formal Proposal: </strong>
              LuxeStudio prepares business justification, technical design, and timeline impact.
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0B0B0D]/50 p-3">
              <strong className="text-white">2. Commercial Agreement: </strong>
              Estimated engineering hours and commercial quotation agreed prior to sprint kickoff.
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0B0B0D]/50 p-3">
              <strong className="text-white">3. Zero Disruption: </strong>
              Deployed to isolated feature branches without jeopardizing active storefront SLA.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

