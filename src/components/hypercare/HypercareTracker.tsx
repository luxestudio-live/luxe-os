'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Zap,
} from 'lucide-react';

interface HypercareTrackerProps {
  project: FullProjectData;
}

export function HypercareTracker({ project }: HypercareTrackerProps) {
  const isHypercare = project.status === 'HYPERCARE';
  const isLive = project.status === 'LIVE' || project.status === 'HYPERCARE';
  const hasGoLive = !!project.goLiveDate;
  const goLiveDateObj = project.goLiveDate ? new Date(project.goLiveDate) : null;
  const hypercareDays = project.hypercareDays || 14;

  const hypercareEndDate = goLiveDateObj
    ? new Date(goLiveDateObj.getTime() + hypercareDays * 24 * 60 * 60 * 1000)
    : null;

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    percentElapsed: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    percentElapsed: 0,
  });

  useEffect(() => {
    if (!hypercareEndDate || !goLiveDateObj) return;

    const calculate = () => {
      const now = new Date().getTime();
      const end = hypercareEndDate.getTime();
      const start = goLiveDateObj.getTime();
      const totalDuration = end - start;
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          percentElapsed: 100,
        });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const elapsed = Math.max(0, Math.min(100, Math.round(((now - start) / totalDuration) * 100)));
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false, percentElapsed: elapsed });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [project.goLiveDate, project.hypercareDays]);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
              {hypercareDays}-Day Active Hypercare Window
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Hypercare &amp; Maintenance Management
          </h2>
        </div>

        {isHypercare && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 font-mono">
            <Zap className="h-4 w-4 animate-pulse text-amber-400" />
            <span>CRITICAL SLA: &lt; 2 Hr Response Active</span>
          </div>
        )}
      </div>

      {/* Hypercare Status Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#171719] to-[#0B0B0D] p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A]">
              Milestone 8 SLA Commitment
            </span>
            <h3 className="text-lg font-serif font-semibold text-white mt-0.5">
              {hypercareDays}-Day Production Stabilization Window
            </h3>
            <p className="text-xs text-zinc-400">
              {isHypercare
                ? `Production go-live executed on ${formatDate(goLiveDateObj)}. Dedicated triage team on standby.`
                : 'Commences automatically upon production cutover following formal UAT acceptance.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-mono border ${
                isHypercare
                  ? 'bg-amber-950/60 text-amber-300 border-amber-600 animate-pulse'
                  : isLive
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {isHypercare ? '● ACTIVE HYPERCARE' : isLive ? 'PRODUCTION LIVE' : 'PRE-LAUNCH (SCHEDULED)'}
            </span>
          </div>
        </div>

        {/* Live Countdown Display (if Hypercare is active) */}
        {isHypercare && goLiveDateObj && (
          <div className="rounded-xl border border-[#C9A56A]/30 bg-[#C9A56A]/5 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[#C9A56A] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Live Hypercare Countdown
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">
                Expires on: {formatDate(hypercareEndDate)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="rounded-lg border border-white/10 bg-[#0B0B0D] p-3">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {timeLeft.days}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase mt-1">Days</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0B0B0D] p-3">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase mt-1">Hours</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0B0B0D] p-3">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase mt-1">Minutes</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0B0B0D] p-3">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-[#C9A56A]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-[#C9A56A] font-mono uppercase mt-1">Seconds</div>
              </div>
            </div>

            {/* Elapsed Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>Stabilization Window Elapsed</span>
                <span>{timeLeft.percentElapsed}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A56A] to-amber-400 transition-all duration-500"
                  style={{ width: `${timeLeft.percentElapsed}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-1">
            <span className="text-zinc-500 font-mono flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#C9A56A]" />
              Go-Live Date
            </span>
            <div className="text-base font-semibold text-white font-mono">
              {formatDate(project.goLiveDate || project.targetDate)}
            </div>
            <p className="text-[11px] text-zinc-500">
              {hasGoLive ? 'Formal production launch verified' : 'Estimated target launch date'}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-1">
            <span className="text-zinc-500 font-mono flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Hypercare Commitment
            </span>
            <div className="text-base font-semibold text-[#C9A56A] font-mono">
              {hypercareDays} Calendar Days
            </div>
            <p className="text-[11px] text-zinc-500">Complimentary 24/7 critical coverage</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-1">
            <span className="text-zinc-500 font-mono flex items-center gap-1.5">
              <LifeBuoy className="h-3.5 w-3.5 text-blue-400" />
              Post-Hypercare SLA
            </span>
            <div className="text-base font-semibold text-white font-mono">
              {hypercareEndDate ? formatDate(hypercareEndDate) : 'Post Stabilization'}
            </div>
            <p className="text-[11px] text-emerald-400">Transitions to ongoing maintenance SLA</p>
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
