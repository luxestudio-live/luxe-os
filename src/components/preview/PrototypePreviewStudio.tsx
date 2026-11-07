'use client';

import React, { useState } from 'react';
import { PrototypeFeedbackData } from '@/lib/types';
import {
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Eye,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface PrototypePreviewStudioProps {
  prototypeUrl: string;
  projectId: string;
  projectName?: string;
  feedbacks: PrototypeFeedbackData[];
  onFeedbackSubmit: (feedback: any) => Promise<void>;
  onFeedbackResolve?: (id: string, notes: string) => Promise<void>;
  isInternalUser?: boolean;
}

export function PrototypePreviewStudio({
  prototypeUrl,
  projectId,
  projectName = 'Staging',
  feedbacks,
  onFeedbackSubmit,
  onFeedbackResolve,
  isInternalUser,
}: PrototypePreviewStudioProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Feedback form state
  const [pageUrl, setPageUrl] = useState(prototypeUrl);
  const [category, setCategory] = useState('UI/UX');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(prototypeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await onFeedbackSubmit({
        projectId,
        pageUrl,
        category,
        priority,
        description,
        screenshotUrl: screenshotUrl.trim() || null,
      });
      setDescription('');
      setScreenshotUrl('');
      setFeedbackModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getViewportWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[390px] h-[640px]';
      case 'tablet':
        return 'max-w-[768px] h-[720px]';
      default:
        return 'w-full h-[720px]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Live Staging &amp; Design Review
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
              Approved Prototype v1.0
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Prototype Preview Studio
          </h2>
        </div>

        {/* Viewport switchers & Actions */}
        <div className="flex items-center gap-2">
          {/* Responsive Viewport Switcher */}
          <div className="flex items-center rounded-lg border border-white/10 bg-[#171719] p-1">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md transition ${
                deviceMode === 'desktop' ? 'bg-[#C9A56A] text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Laptop className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded-md transition ${
                deviceMode === 'tablet' ? 'bg-[#C9A56A] text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md transition ${
                deviceMode === 'mobile' ? 'bg-[#C9A56A] text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Mobile View (390px)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Copy URL */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-[#C9A56A]/50 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>

          {/* Open in new tab */}
          <a
            href={prototypeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#C9A56A]/40 bg-[#171719] px-3.5 py-2 text-xs font-medium text-[#C9A56A] hover:bg-[#C9A56A]/10 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Website
          </a>

          {/* Submit Feedback Button */}
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#C9A56A] px-3.5 py-2 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow-md"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Submit Feedback
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="rounded-2xl border border-white/10 bg-[#171719] p-3 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Browser Frame Header */}
        <div className="w-full flex items-center justify-between border-b border-white/5 pb-2.5 px-3 mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-zinc-500 ml-2 font-mono text-[11px] truncate max-w-sm">
              {prototypeUrl}
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
            <span>Mode: {deviceMode.toUpperCase()}</span>
            <span className="text-zinc-600">&middot;</span>
            <span className="text-[#C9A56A]">Security: Sandbox Protected</span>
          </div>
        </div>

        {/* Device Frame Wrapper */}
        <div
          className={`relative transition-all duration-300 rounded-xl overflow-hidden border border-white/10 bg-[#0B0B0D] ${getViewportWidth()} shadow-inner`}
        >
          {/* Iframe with fallback overlay if X-Frame-Options prevents loading */}
          <iframe
            src={prototypeUrl}
            className="w-full h-full border-0 bg-[#0B0B0D]"
            title={`${projectName} Prototype Preview`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />

          {/* Floating Fallback Launch Card at bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#171719]/90 px-4 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs">
            <span className="text-zinc-300">Viewing {projectName} Staging Prototype</span>
            <a
              href={prototypeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A56A] font-semibold flex items-center gap-1 hover:underline"
            >
              Open Fullscreen <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Structured Feedback Feed */}
      <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Design &amp; Prototype Feedback Log ({feedbacks.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Track decisions, refinements, and UX review points between {projectName} and LuxeStudio.
            </p>
          </div>
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="text-xs text-[#C9A56A] hover:underline flex items-center gap-1"
          >
            + Add New Review Item
          </button>
        </div>

        {feedbacks.length > 0 ? (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="rounded-xl border border-white/5 bg-[#0B0B0D]/40 p-4 space-y-2 hover:border-white/10 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#C9A56A]/10 px-2 py-0.5 text-[10px] font-mono text-[#C9A56A] border border-[#C9A56A]/20">
                      {fb.category}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                        fb.priority === 'CRITICAL'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                          : fb.priority === 'HIGH'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {fb.priority}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(fb.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                        fb.status === 'RESOLVED' || fb.status === 'ACCEPTED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed">{fb.description}</p>

                {fb.pageUrl && (
                  <p className="text-[11px] text-zinc-500 font-mono truncate">
                    Target Route: {fb.pageUrl}
                  </p>
                )}

                {fb.resolutionNotes && (
                  <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-emerald-200">
                    <strong className="text-emerald-400">LuxeStudio Action: </strong>
                    {fb.resolutionNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-4 text-center italic">
            No feedback entries logged yet. Click "Submit Feedback" to add design notes.
          </p>
        )}
      </div>

      {/* Feedback Submission Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">
                Submit Prototype Review Feedback
              </h3>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Page / Screen URL</label>
                <input
                  type="text"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                  placeholder="https://staging.theluxestudio.in/products/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Feedback Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="UI/UX">UI / Visual Polish</option>
                    <option value="FUNCTIONALITY">Functionality &amp; Flow</option>
                    <option value="CONTENT">Copy &amp; Product Data</option>
                    <option value="RESPONSIVE">Mobile / Responsive</option>
                    <option value="PERFORMANCE">Interaction Speed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  >
                    <option value="LOW">Low — Minor Consideration</option>
                    <option value="MEDIUM">Medium — Standard Request</option>
                    <option value="HIGH">High — Important for Next Gate</option>
                    <option value="CRITICAL">Critical — Launch Blocking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Description &amp; Suggested Improvement *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you observed, what you expected, and any specific styling or flow refinements..."
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#C9A56A] px-4 py-2 font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

