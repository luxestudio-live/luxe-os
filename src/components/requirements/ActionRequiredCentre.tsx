'use client';

import React, { useState } from 'react';
import { RequirementData } from '@/lib/types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  KeyRound,
  ExternalLink,
  Upload,
  Lock,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ActionRequiredCentreProps {
  requirements: RequirementData[];
  onRequirementSubmit: (id: string, value: string, fileUrl?: string) => Promise<void>;
  onRequirementReview?: (id: string, status: 'ACCEPTED' | 'NEEDS_REVISION', reason?: string) => Promise<void>;
  isInternalUser?: boolean;
}

export function ActionRequiredCentre({
  requirements,
  onRequirementSubmit,
  onRequirementReview,
  isInternalUser,
}: ActionRequiredCentreProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'ACCEPTED'>('PENDING');
  const [selectedReq, setSelectedReq] = useState<RequirementData | null>(null);
  const [submitValue, setSubmitValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review modal state for admin
  const [reviewReq, setReviewReq] = useState<RequirementData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequirements = requirements.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const pendingCount = requirements.filter((r) => r.status === 'PENDING').length;
  const submittedCount = requirements.filter((r) => r.status === 'SUBMITTED').length;
  const acceptedCount = requirements.filter((r) => r.status === 'ACCEPTED').length;

  const handleOpenSubmit = (req: RequirementData) => {
    setSelectedReq(req);
    setSubmitValue(req.value || '');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setIsSubmitting(true);
    try {
      await onRequirementSubmit(selectedReq.id, submitValue);
      setSelectedReq(null);
      setSubmitValue('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminReview = async (status: 'ACCEPTED' | 'NEEDS_REVISION') => {
    if (!reviewReq || !onRequirementReview) return;
    setIsSubmitting(true);
    try {
      await onRequirementReview(reviewReq.id, status, rejectionReason);
      setReviewReq(null);
      setRejectionReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDENTIALS_DELEGATION':
        return <KeyRound className="h-4 w-4 text-[#C9A56A]" />;
      case 'FILE':
        return <Upload className="h-4 w-4 text-emerald-400" />;
      default:
        return <FileText className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Client Onboarding &amp; Deliverable Dependencies
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-400 border border-amber-500/30 animate-pulse">
                {pendingCount} Awaiting Input
              </span>
            )}
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Action Required Centre
          </h2>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center rounded-lg border border-white/10 bg-[#171719] p-1">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'PENDING'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('SUBMITTED')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'SUBMITTED'
                ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Under Review ({submittedCount})
          </button>
          <button
            onClick={() => setActiveTab('ACCEPTED')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'ACCEPTED'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Verified ({acceptedCount})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'ALL'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All (12)
          </button>
        </div>
      </div>

      {/* Security Banner regarding Credentials */}
      <div className="rounded-xl border border-[#C9A56A]/20 bg-[#C9A56A]/5 p-4 flex items-start gap-3 text-xs">
        <Lock className="h-4 w-4 text-[#C9A56A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white font-semibold">
            Secure Credential &amp; Delegated Access Policy:
          </strong>
          <p className="text-zinc-300 leading-relaxed">
            For ERP, hosting, and DNS platforms, LuxeStudio strictly recommends inviting our technical team via delegated access invitations (e.g. GitHub/GitLab collaborator invite, AWS IAM role, Cloudflare member) rather than transmitting plaintext production master credentials.
          </p>
        </div>
      </div>

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredRequirements.map((req, idx) => (
          <div
            key={req.id}
            className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
              req.status === 'PENDING'
                ? 'border-amber-500/30 bg-[#171719] hover:border-amber-500/60 shadow-[0_0_20px_-10px_rgba(245,158,11,0.15)]'
                : req.status === 'ACCEPTED'
                ? 'border-emerald-500/20 bg-[#171719]/60'
                : 'border-blue-500/20 bg-[#171719]/80'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#0B0B0D] border border-white/5">
                    {getTypeIcon(req.type)}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#C9A56A]">
                    {req.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {req.isMandatory && (
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-mono text-rose-400 border border-rose-500/20">
                      Mandatory
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      req.status === 'ACCEPTED'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                        : req.status === 'SUBMITTED'
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white pt-1">
                {idx + 1}. {req.title}
              </h3>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {req.description}
              </p>

              {req.value && (
                <div className="mt-2 rounded-lg border border-white/5 bg-[#0B0B0D] p-2.5 text-xs">
                  <div className="text-[10px] text-zinc-500 font-mono">Submitted Value:</div>
                  <div className="text-zinc-200 font-mono mt-0.5 truncate">{req.value}</div>
                </div>
              )}

              {req.rejectionReason && (
                <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-xs text-rose-300">
                  <strong className="text-rose-400">Needs Revision: </strong>
                  {req.rejectionReason}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">
                Due: 14 Nov 2026 (Milestone 2)
              </span>

              <div className="flex items-center gap-2">
                {isInternalUser && req.status === 'SUBMITTED' && (
                  <button
                    onClick={() => setReviewReq(req)}
                    className="rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-600/30 transition"
                  >
                    Review Submission
                  </button>
                )}

                <button
                  onClick={() => handleOpenSubmit(req)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1 ${
                    req.status === 'PENDING'
                      ? 'bg-[#C9A56A] text-black hover:bg-[#B89355]'
                      : 'border border-white/10 bg-[#0B0B0D] text-zinc-300 hover:text-white'
                  }`}
                >
                  {req.status === 'PENDING' ? 'Submit Now' : 'Edit Response'}
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A56A]">
                  Requirement Submission
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  {selectedReq.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {selectedReq.description}
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  {selectedReq.type === 'CREDENTIALS_DELEGATION'
                    ? 'Delegated Invite Confirmation / Secure Access Instructions *'
                    : selectedReq.type === 'FILE'
                    ? 'Storage Reference / File URL or Sanitized Export Summary *'
                    : 'Information / Details *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={submitValue}
                  onChange={(e) => setSubmitValue(e.target.value)}
                  placeholder={
                    selectedReq.type === 'CREDENTIALS_DELEGATION'
                      ? 'e.g. Sent Git collaborator invitation to dev@theluxestudio.in with Read permissions...'
                      : 'Provide details or direct access link...'
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#C9A56A] px-4 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Review Modal */}
      {reviewReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">
                Review Client Submission: {reviewReq.title}
              </h3>
              <button
                onClick={() => setReviewReq(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg border border-white/5 bg-[#0B0B0D] p-3 text-xs space-y-1">
              <div className="text-zinc-500">Submitted Content:</div>
              <div className="text-white font-mono">{reviewReq.value || 'No value recorded'}</div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-zinc-400 font-medium">
                Revision Notes (Required if requesting changes)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Clarify what is missing or requires modification..."
                className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReviewReq(null)}
                className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-xs text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAdminReview('NEEDS_REVISION')}
                className="rounded-lg bg-rose-600/20 border border-rose-500/40 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-600/30"
              >
                Request Revision
              </button>
              <button
                type="button"
                onClick={() => handleAdminReview('ACCEPTED')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Accept &amp; Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

