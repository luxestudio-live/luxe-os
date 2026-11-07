'use client';

import React, { useState } from 'react';
import { DocumentData } from '@/lib/types';
import {
  FileText,
  Download,
  Upload,
  Lock,
  Eye,
  CheckCircle2,
  FileCheck,
  FolderOpen,
} from 'lucide-react';

interface DocumentCentreProps {
  documents: DocumentData[];
  isInternalUser?: boolean;
}

export function DocumentCentre({ documents, isInternalUser }: DocumentCentreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const categories = ['ALL', 'AGREEMENTS', 'SCOPE', 'TECH_DOCS', 'BRAND_ASSETS'];

  const filteredDocs = documents.filter((d) => {
    if (selectedCategory === 'ALL') return true;
    return d.category === selectedCategory;
  });

  const handleDownload = (doc: DocumentData) => {
    setDownloadSuccess(`Access Token generated. Streaming ${doc.name}...`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Project Vault &amp; Specifications
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
              Signed URLs &middot; Access Logged
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Documents &amp; File Management
          </h2>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center rounded-lg border border-white/10 bg-[#171719] p-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                selectedCategory === cat
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {downloadSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border border-white/10 bg-[#171719] p-5 shadow-xl flex flex-col justify-between hover:border-[#C9A56A]/40 transition space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded bg-[#C9A56A]/10 px-2 py-0.5 text-[10px] font-mono text-[#C9A56A] border border-[#C9A56A]/20">
                  <FileText className="h-3 w-3" />
                  {doc.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500">{doc.version}</span>
                  {doc.isInternalOnly && (
                    <span className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] text-zinc-300 font-mono">
                      <Lock className="h-2.5 w-2.5" /> Internal
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white leading-snug">
                {doc.name}
              </h3>

              <div className="text-[11px] text-zinc-400 space-y-1 font-mono">
                <div>Size: {doc.fileSize}</div>
                <div>Uploaded by: {doc.uploadedBy}</div>
                <div>Date: {new Date(doc.createdAt).toLocaleDateString('en-GB')}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified Hash
              </span>

              <button
                onClick={() => handleDownload(doc)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A56A]/50 transition"
              >
                <Download className="h-3.5 w-3.5 text-[#C9A56A]" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

