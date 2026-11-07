'use client';

import React, { useState } from 'react';
import { UatIssueData } from '@/lib/types';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Plus,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

interface UatIssueTrackerProps {
  projectId: string;
  issues: UatIssueData[];
  onIssueCreate: (issue: any) => Promise<void>;
  onIssueUpdate: (id: string, updates: any) => Promise<void>;
  isInternalUser?: boolean;
}

export function UatIssueTracker({
  projectId,
  issues,
  onIssueCreate,
  onIssueUpdate,
  isInternalUser,
}: UatIssueTrackerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('Staging');
  const [pageUrl, setPageUrl] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await onIssueCreate({
        projectId,
        title,
        description,
        environment,
        pageUrl: pageUrl.trim() || null,
        severity,
      });
      setTitle('');
      setDescription('');
      setPageUrl('');
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmFixed = async (id: string) => {
    try {
      await onIssueUpdate(id, { clientConfirmed: true });
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950/60 text-rose-400 border-rose-800 font-bold';
      case 'HIGH':
        return 'bg-amber-950/60 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-950/60 text-blue-400 border-blue-800';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Quality Assurance &amp; Defect Registry
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
              Milestone 5 Gate
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            UAT &amp; Issue Tracking
          </h2>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#C9A56A] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow-md"
        >
          <Plus className="h-4 w-4" /> Log New Defect / Issue
        </button>
      </div>

      {/* Issues Table */}
      <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-white">
          Active Defect Queue ({issues.length})
        </h3>

        {issues.length > 0 ? (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-white/5 bg-[#0B0B0D]/50 p-4 space-y-2 hover:border-white/10 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono border ${getSeverityBadge(
                        issue.severity
                      )}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {issue.environment}
                    </span>
                    <span className="text-xs font-semibold text-white">{issue.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                        issue.status === 'CLOSED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : issue.status === 'RESOLVED'
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{issue.description}</p>

                {issue.resolutionNotes && (
                  <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-xs text-emerald-200">
                    <strong className="text-emerald-400">Triage Resolution: </strong>
                    {issue.resolutionNotes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
                  <span>Logged by {issue.submittedBy} &middot; {new Date(issue.createdAt).toLocaleDateString('en-GB')}</span>

                  {issue.status === 'RESOLVED' && !issue.clientConfirmed && (
                    <button
                      onClick={() => handleConfirmFixed(issue.id)}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                    >
                      Verify &amp; Close Defect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic py-4 text-center">
            No defects logged in this sprint. Click "Log New Defect" to register an observation during UAT.
          </p>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">Log Defect / UAT Issue</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ERP order sync timeout on duplicate SKU checkout"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Severity *</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical (Launch Blocker)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Environment *</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="Staging">Staging</option>
                    <option value="Prototype">Prototype</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Steps &amp; Observations *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Steps to reproduce, expected result, actual result..."
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#C9A56A] px-4 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Register Defect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

