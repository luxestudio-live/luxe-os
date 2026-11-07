'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RequirementData, UserSession } from '@/lib/types';
import {
  FileSpreadsheet,
  Save,
  Upload,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  FileText,
  Edit2,
  RefreshCw,
  FolderOpen,
  LayoutGrid,
  Table2,
} from 'lucide-react';

interface RequirementsMatrixSheetProps {
  projectId: string;
  projectName?: string;
  requirements: RequirementData[];
  currentUser?: UserSession;
  isInternalUser?: boolean;
  onReload: () => Promise<void>;
}

export function RequirementsMatrixSheet({
  projectId,
  projectName = 'Website',
  requirements = [],
  currentUser,
  isInternalUser = false,
  onReload,
}: RequirementsMatrixSheetProps) {
  // Local state copy of requirements for fast, fluid spreadsheet editing
  const [rows, setRows] = useState<RequirementData[]>(requirements);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters, Search & View Modes
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [workbookTab, setWorkbookTab] = useState<'ALL' | 'TAB1' | 'TAB2' | 'TAB3' | 'TAB4'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');

  // Admin Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addRowModalOpen, setAddRowModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [pastedData, setPastedData] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New Row Form State
  const [newRow, setNewRow] = useState({
    pageRoute: '/',
    sectionComponent: '',
    specificRequirement: '',
    currentDraft: '',
    guidelines: '',
    clientInput: '',
    assetUrl: '',
  });

  // Sync rows whenever upstream requirements change (unless there are unsaved local edits)
  useEffect(() => {
    if (modifiedIds.size === 0) {
      setRows(requirements);
    }
  }, [requirements, modifiedIds.size]);

  // Unique routes for filter dropdown
  const uniqueRoutes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.pageRoute) set.add(r.pageRoute);
    });
    return Array.from(set).sort();
  }, [rows]);

  // Metrics
  const totalRows = rows.length;
  const completedRows = rows.filter(
    (r) => (r.clientInput && r.clientInput.trim().length > 0) || r.status === 'ACCEPTED'
  ).length;
  const verifiedRows = rows.filter((r) => r.status === 'ACCEPTED').length;
  const progressPercent = totalRows > 0 ? Math.round((completedRows / totalRows) * 100) : 0;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Workbook Tab Filter
      if (workbookTab === 'TAB1') {
        const match =
          (r.sequence !== undefined && r.sequence <= 14) ||
          (r.pageRoute && (r.pageRoute.includes('Home') || r.pageRoute.includes('Story')));
        if (!match) return false;
      } else if (workbookTab === 'TAB2') {
        const match =
          (r.sequence !== undefined && r.sequence >= 15 && r.sequence <= 23) ||
          (r.pageRoute && (r.pageRoute.includes('Craft') || r.pageRoute.includes('Customise') || r.pageRoute.includes('atelier')));
        if (!match) return false;
      } else if (workbookTab === 'TAB3') {
        const match =
          (r.sequence !== undefined && r.sequence >= 24 && r.sequence <= 33) ||
          (r.pageRoute && (r.pageRoute.includes('Gifting') || r.pageRoute.includes('Contact')));
        if (!match) return false;
      } else if (workbookTab === 'TAB4') {
        const match =
          (r.sequence !== undefined && r.sequence >= 34 && r.sequence <= 43) ||
          (r.pageRoute && (r.pageRoute.includes('Shipping') || r.pageRoute.includes('FAQ') || r.pageRoute.includes('Terms') || r.pageRoute.includes('Account')));
        if (!match) return false;
      }

      // 2. Route Filter
      if (selectedRoute !== 'ALL' && (r.pageRoute || '/') !== selectedRoute) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'PENDING' && (r.clientInput?.trim() || r.status === 'ACCEPTED')) return false;
        if (selectedStatus === 'FILLED' && !r.clientInput?.trim() && r.status !== 'ACCEPTED') return false;
        if (selectedStatus === 'ACCEPTED' && r.status !== 'ACCEPTED') return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (r.pageRoute && r.pageRoute.toLowerCase().includes(q)) ||
          (r.sectionComponent && r.sectionComponent.toLowerCase().includes(q)) ||
          (r.specificRequirement && r.specificRequirement.toLowerCase().includes(q)) ||
          (r.currentDraft && r.currentDraft.toLowerCase().includes(q)) ||
          (r.clientInput && r.clientInput.toLowerCase().includes(q)) ||
          (r.guidelines && r.guidelines.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [rows, workbookTab, selectedRoute, selectedStatus, searchQuery]);

  // Handle cell edits
  const handleCellChange = (id: string, field: keyof RequirementData, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // If editing client input, mark as submitted if it has value
          if (field === 'clientInput') {
            if (value.trim()) {
              if (updated.status !== 'ACCEPTED') updated.status = 'SUBMITTED';
            }
          }
          return updated;
        }
        return r;
      })
    );
    setModifiedIds((prev) => new Set(prev).add(id));
    setSaveSuccess(false);
  };

  // Save all modified rows to server
  const handleBatchSave = async () => {
    if (modifiedIds.size === 0) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const rowsToSave = rows
        .filter((r) => modifiedIds.has(r.id))
        .map((r) => ({
          id: r.id,
          pageRoute: r.pageRoute,
          sectionComponent: r.sectionComponent,
          specificRequirement: r.specificRequirement,
          currentDraft: r.currentDraft,
          clientInput: r.clientInput,
          assetUrl: r.assetUrl,
          guidelines: r.guidelines,
          status: r.status,
        }));

      const res = await fetch('/api/requirements/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToSave }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save matrix rows');
      }

      setModifiedIds(new Set());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      await onReload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Quick Approve Draft on an individual row (saves & updates roadmap in runtime)
  const handleQuickApproveDraft = async (id: string) => {
    handleCellChange(id, 'clientInput', 'APPROVED');
    try {
      const res = await fetch(`/api/requirements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientInput: 'APPROVED', status: 'SUBMITTED' }),
      });
      if (res.ok) {
        setModifiedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await onReload();
      }
    } catch (e) {
      console.error('Error approving draft:', e);
    }
  };

  // 1-Click Approve All Drafts in active tab (saves all & automatically advances roadmap in runtime)
  const handleApproveAllInTab = async () => {
    const unapproved = filteredRows.filter((r) => r.clientInput !== 'APPROVED');
    if (unapproved.length === 0) {
      alert('All sections in this view are already approved!');
      return;
    }

    if (!confirm(`Mark all ${unapproved.length} sections in this view as APPROVED and update the roadmap?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const rowsToSave = unapproved.map((r) => ({
        id: r.id,
        clientInput: 'APPROVED',
        status: 'SUBMITTED',
      }));

      const res = await fetch('/api/requirements/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToSave }),
      });

      if (!res.ok) throw new Error('Failed to update drafts');

      setRows((prev) =>
        prev.map((r) => {
          if (unapproved.some((u) => u.id === r.id)) {
            return { ...r, clientInput: 'APPROVED', status: 'SUBMITTED' };
          }
          return r;
        })
      );

      setModifiedIds((prev) => {
        const next = new Set(prev);
        unapproved.forEach((u) => next.delete(u.id));
        return next;
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      await onReload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating drafts');
    } finally {
      setIsSaving(false);
    }
  };

  // Admin: Delete a row
  const handleDeleteRow = async (id: string) => {
    if (!confirm('Are you sure you want to remove this section row from the requirements matrix?')) {
      return;
    }

    try {
      const res = await fetch(`/api/requirements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete row');

      setRows((prev) => prev.filter((r) => r.id !== id));
      setModifiedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error deleting row');
    }
  };

  // Admin: Quick verify/accept
  const handleToggleVerified = async (row: RequirementData) => {
    const nextStatus = row.status === 'ACCEPTED' ? 'SUBMITTED' : 'ACCEPTED';
    handleCellChange(row.id, 'status', nextStatus);
  };

  // Admin: Add a single row
  const handleAddSingleRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRow.sectionComponent.trim()) {
      alert('Section / Component name is required.');
      return;
    }

    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          pageRoute: newRow.pageRoute,
          sectionComponent: newRow.sectionComponent,
          specificRequirement: newRow.specificRequirement,
          currentDraft: newRow.currentDraft,
          guidelines: newRow.guidelines,
          clientInput: newRow.clientInput,
          assetUrl: newRow.assetUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to add section row');

      setNewRow({
        pageRoute: '/',
        sectionComponent: '',
        specificRequirement: '',
        currentDraft: '',
        guidelines: '',
        clientInput: '',
        assetUrl: '',
      });
      setAddRowModalOpen(false);
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error adding row');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Page / Route',
      'Section / Component',
      'Specific Requirement',
      'Current Draft on Website',
      'Client Actual Data / Input (Fill Here)',
      'Asset / Media Link (Google Drive / Cloud)',
      'Notes & Guidelines',
      'Status',
    ];

    const csvRows = [headers.join(',')];

    rows.forEach((r) => {
      const escape = (val?: string | null) => {
        if (!val) return '""';
        return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      };

      csvRows.push(
        [
          escape(r.pageRoute || '/'),
          escape(r.sectionComponent || ''),
          escape(r.specificRequirement || ''),
          escape(r.currentDraft || ''),
          escape(r.clientInput || ''),
          escape(r.assetUrl || ''),
          escape(r.guidelines || ''),
          escape(r.status || 'PENDING'),
        ].join(',')
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LuxeOS_${projectName.replace(/\s+/g, '_')}_Content_Matrix.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const templateContent = `Page / Route,Section / Component,Specific Requirement,Current Draft on Website,Client Actual Data / Input (Fill Here),Asset / Media Link (Google Drive / Cloud),Notes & Guidelines
/,Hero Section,Hero Headline & Subtitle,Bespoke Luxury Living — Handcrafted with Pride,"","","Keep headline under 10 words. 4K WebP imagery."
/,Brand Story,Founder Quote & Craft Philosophy,"Centuries of artisanal tradition refined for modern architecture.","","","Include founding year and master quotes."
/collections,Signature Showcase,Collection Title & Lookbook PDF,"The Royal Heritage Anthology — Certified Emeralds & Gold.","","https://drive.google.com/sample-drive-link","High-res lookbook under 25MB."
/bespoke,VIP Concierge,Private Atelier Consultation Form,"Schedule a private salon appointment in Mumbai.","","","Provide concierge WhatsApp contact."
/checkout,Transit & Insurance,Armored Courier Logistics Policy,"Every shipment dispatched in tamper-evident security vault cases.","","","Specify carrier SLA (Sequel / BVC Logistics)."`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LuxeOS_Content_Matrix_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV / TSV text from file or paste
  const parseSheetData = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('File or pasted text has fewer than 2 lines.');

    // Detect separator (tab or comma)
    const firstLine = lines[0];
    const isTab = firstLine.includes('\t');
    const splitRegex = isTab ? /\t/ : /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    const rawHeaders = firstLine.split(splitRegex).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());

    const resultRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(splitRegex).map((c) => c.replace(/^"|"$/g, '').trim());

      const getCol = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const idx = rawHeaders.findIndex((h) => h.includes(name));
          if (idx !== -1 && cols[idx] !== undefined) return cols[idx];
        }
        return '';
      };

      const pageRoute = getCol(['page', 'route']) || '/';
      const sectionComponent = getCol(['section', 'component']) || `Section ${i}`;
      const specificRequirement = getCol(['specific', 'requirement', 'req']) || '';
      const currentDraft = getCol(['current draft', 'draft', 'website']) || '';
      const clientInput = getCol(['client actual', 'fill here', 'input', 'actual']) || '';
      const assetUrl = getCol(['asset', 'media', 'drive', 'cloud', 'link']) || '';
      const guidelines = getCol(['notes', 'guidelines', 'rules']) || '';

      resultRows.push({
        pageRoute,
        sectionComponent,
        specificRequirement,
        currentDraft,
        clientInput,
        assetUrl,
        guidelines,
      });
    }

    return resultRows;
  };

  // Admin: Process Sheet Upload / Paste
  const handleUploadSubmit = async () => {
    if (!pastedData.trim()) {
      alert('Please paste spreadsheet data or upload a CSV file.');
      return;
    }

    setIsUploading(true);
    try {
      const parsed = parseSheetData(pastedData);
      if (parsed.length === 0) throw new Error('No valid rows found in sheet data.');

      const res = await fetch('/api/requirements/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mode: uploadMode,
          rows: parsed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import sheet rows');

      alert(`Successfully imported ${data.importedCount} section rows!`);
      setPastedData('');
      setUploadModalOpen(false);
      await onReload();
    } catch (err: any) {
      alert(err.message || 'Error processing sheet data');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle local CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Progress & Action Hub */}
      <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 shadow-2xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C9A56A]/20 text-[#C9A56A]">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A56A] font-semibold">
                Content &amp; Requirements Matrix &middot; Interactive Sheet
              </span>
              <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-white/10">
                {totalRows} Rows
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white tracking-tight">
              Website Copy, Assets &amp; Deliverable Specifications
            </h2>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Fill in your verified copy under <strong className="text-[#C9A56A]">Client Actual Data / Input</strong> and paste Google Drive or Cloud links. All edits remain synchronized between your team and LuxeStudio.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick 1-Click Approve All Drafts in this Tab */}
            <button
              onClick={handleApproveAllInTab}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition shadow-sm"
              title="Click to approve all live drafts in this tab and advance the roadmap in runtime"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Approve All in This Tab</span>
            </button>

            {/* Save Button (Gold glowing) */}
            <button
              onClick={handleBatchSave}
              disabled={isSaving || modifiedIds.size === 0}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition shadow-lg ${
                modifiedIds.size > 0
                  ? 'bg-[#C9A56A] text-black hover:bg-[#B89355] shadow-[#C9A56A]/30 ring-2 ring-[#C9A56A]/50 animate-pulse'
                  : 'bg-white/10 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    {modifiedIds.size > 0
                      ? `Save Changes (${modifiedIds.size} Modified)`
                      : 'All Changes Saved'}
                  </span>
                </>
              )}
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#171719] px-3.5 py-2.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition"
              title="Download sheet as CSV"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>

            {/* Admin Upload / Add Row */}
            {isInternalUser && (
              <>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#C9A56A]/30 bg-[#C9A56A]/10 px-3.5 py-2.5 text-xs font-medium text-[#C9A56A] hover:bg-[#C9A56A]/20 transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload via Sheet</span>
                </button>

                <button
                  onClick={() => setAddRowModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#171719] px-3.5 py-2.5 text-xs text-white hover:border-[#C9A56A]/50 transition"
                >
                  <Plus className="h-3.5 w-3.5 text-[#C9A56A]" />
                  <span>+ Add Section</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress & Notification Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">Completion:</span>
            <div className="h-2 w-32 sm:w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#C9A56A] to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-white font-bold">{progressPercent}%</span>
            <span className="text-zinc-500 text-[11px]">
              ({completedRows} of {totalRows} sections filled)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>All modifications saved to project database</span>
              </span>
            )}

            {errorMessage && (
              <span className="flex items-center gap-1.5 text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </span>
            )}

            {modifiedIds.size > 0 && !saveSuccess && (
              <span className="flex items-center gap-1.5 text-amber-400 text-xs animate-pulse">
                <Clock className="h-3.5 w-3.5" />
                <span>{modifiedIds.size} unsaved edits. Click Save Changes above.</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scope Notice: Non-Product Brand Requirements */}
      <div className="rounded-2xl border border-white/10 bg-[#171719]/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A] font-bold">
              Kalajay Non-Product Intake Scope
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
              ERP Automated: SKUs, Inventory, Prices &amp; Catalogue Photos
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed text-[11px]">
            Since your ERP system directly provides all product data, this workbook gathers <strong>only</strong> the non-product brand storytelling, artisan profiles, gifting rules, operational timelines, and policy assets. If any current draft on the website is already 100% accurate, simply click <strong className="text-[#C9A56A]">Approve Draft</strong>.
          </p>
        </div>
        <a
          href="https://kalajay.theluxestudio.in"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 rounded-xl border border-[#C9A56A]/40 bg-[#C9A56A]/10 px-4 py-2 text-xs font-semibold text-[#C9A56A] hover:bg-[#C9A56A]/20 transition shadow"
        >
          <span>Open Live Prototype</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* 4 Workbook Tab Switchers (Matching The Luxe Studio Intake Workbook) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-3 text-xs">
        <button
          onClick={() => setWorkbookTab('ALL')}
          className={`rounded-xl px-3.5 py-2 font-medium transition ${
            workbookTab === 'ALL'
              ? 'bg-[#C9A56A] text-black font-semibold shadow'
              : 'bg-[#171719] text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Sections ({rows.length})
        </button>

        <button
          onClick={() => setWorkbookTab('TAB1')}
          className={`rounded-xl px-3.5 py-2 font-medium transition ${
            workbookTab === 'TAB1'
              ? 'bg-[#C9A56A] text-black font-semibold shadow'
              : 'bg-[#171719] text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Tab 1: Home Page &amp; Story (14)
        </button>

        <button
          onClick={() => setWorkbookTab('TAB2')}
          className={`rounded-xl px-3.5 py-2 font-medium transition ${
            workbookTab === 'TAB2'
              ? 'bg-[#C9A56A] text-black font-semibold shadow'
              : 'bg-[#171719] text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Tab 2: Craft House &amp; Bespoke (9)
        </button>

        <button
          onClick={() => setWorkbookTab('TAB3')}
          className={`rounded-xl px-3.5 py-2 font-medium transition ${
            workbookTab === 'TAB3'
              ? 'bg-[#C9A56A] text-black font-semibold shadow'
              : 'bg-[#171719] text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Tab 3: Gifting &amp; Contact (10)
        </button>

        <button
          onClick={() => setWorkbookTab('TAB4')}
          className={`rounded-xl px-3.5 py-2 font-medium transition ${
            workbookTab === 'TAB4'
              ? 'bg-[#C9A56A] text-black font-semibold shadow'
              : 'bg-[#171719] text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Tab 4: Logistics, Legal &amp; Circle (10)
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Route Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#171719] px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs font-mono"
            >
              <option value="ALL" className="bg-[#171719] text-white">All Pages / Routes ({rows.length})</option>
              {uniqueRoutes.map((rt) => (
                <option key={rt} value={rt} className="bg-[#171719] text-white">
                  {rt} ({rows.filter((r) => (r.pageRoute || '/') === rt).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#171719] p-0.5">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedStatus === 'ALL'
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedStatus === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pending ({rows.filter((r) => !r.clientInput?.trim() && r.status !== 'ACCEPTED').length})
            </button>
            <button
              onClick={() => setSelectedStatus('FILLED')}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedStatus === 'FILLED'
                  ? 'bg-blue-500/20 text-blue-300 font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Client Filled ({rows.filter((r) => r.clientInput?.trim() && r.status !== 'ACCEPTED').length})
            </button>
            <button
              onClick={() => setSelectedStatus('ACCEPTED')}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedStatus === 'ACCEPTED'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Verified ({verifiedRows})
            </button>
          </div>
        </div>

        {/* Search & Layout Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#171719] p-0.5">
            <button
              onClick={() => setLayoutMode('cards')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                layoutMode === 'cards'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Spacious Card View (Executive & Easy to Read)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Spacious Cards</span>
            </button>
            <button
              onClick={() => setLayoutMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                layoutMode === 'table'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Wide Spreadsheet Grid"
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>Spreadsheet Grid</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search section or copy..."
              className="w-full rounded-xl border border-white/10 bg-[#171719] px-3 py-1.5 pl-8 text-xs text-white placeholder-zinc-500 focus:border-[#C9A56A] focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* VIEW 1: SPACIOUS STUDIO CARDS (De-congested, Roomy & Executive) */}
      {layoutMode === 'cards' && (
        <div className="space-y-4">
          {filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#121215] py-16 text-center text-zinc-500">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-300">No matching section rows found.</p>
              <p className="text-xs text-zinc-500 mt-1">Try resetting your tab or search filters.</p>
            </div>
          ) : (
            filteredRows.map((r, idx) => {
              const isModified = modifiedIds.has(r.id);
              const hasClientInput = !!(r.clientInput && r.clientInput.trim().length > 0);
              const isAccepted = r.status === 'ACCEPTED';
              const isDraftApproved = r.clientInput === 'APPROVED';

              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-5 sm:p-6 shadow-xl transition-all space-y-4 ${
                    isModified
                      ? 'border-[#C9A56A]/60 bg-[#17171c] ring-1 ring-[#C9A56A]/30'
                      : 'border-white/10 bg-[#121215] hover:border-white/20'
                  }`}
                >
                  {/* Card Header: Sequence, Route Badge, Section Name, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 font-mono text-xs text-zinc-400">
                        #{r.sequence || idx + 1}
                      </span>
                      <span className="rounded-lg bg-[#C9A56A]/10 border border-[#C9A56A]/30 px-2.5 py-1 text-xs font-mono font-medium text-[#C9A56A]">
                        {r.pageRoute || '/'}
                      </span>
                      <h3 className="text-base sm:text-lg font-serif font-semibold text-white tracking-wide">
                        {r.sectionComponent}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                          isAccepted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isDraftApproved
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            : hasClientInput
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isAccepted
                          ? 'Verified by Studio'
                          : isDraftApproved
                          ? 'Draft Approved'
                          : hasClientInput
                          ? 'Input Submitted'
                          : 'Awaiting Input'}
                      </span>

                      {/* Admin Delete Action */}
                      {isInternalUser && (
                        <button
                          onClick={() => handleDeleteRow(r.id)}
                          title="Delete row"
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Split: Context & Draft (Left) vs Client Input Studio (Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column (5 of 12 cols): Requirements, Current Draft & Guidelines */}
                    <div className="lg:col-span-5 space-y-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">
                          Specific Requirement
                        </span>
                        <p className="text-xs font-medium text-zinc-200 mt-0.5 leading-relaxed">
                          {r.specificRequirement}
                        </p>
                      </div>

                      {/* Current Draft Quote Box */}
                      <div className="rounded-xl border border-white/5 bg-[#0B0B0D] p-3.5 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>Current Draft on Staging Website</span>
                          <span className="text-[#C9A56A] italic">Live Reference</span>
                        </div>
                        <p className="text-xs text-zinc-300 italic leading-relaxed whitespace-pre-line">
                          {r.currentDraft ? `"${r.currentDraft}"` : 'No draft specified on staging yet.'}
                        </p>
                      </div>

                      {/* Notes & Guidelines */}
                      {r.guidelines && (
                        <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                          <HelpCircle className="h-3.5 w-3.5 text-[#C9A56A] shrink-0 mt-0.5" />
                          <span>{r.guidelines}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Column (7 of 12 cols): Spacious Client Input Studio */}
                    <div className="lg:col-span-7 rounded-xl border border-[#C9A56A]/30 bg-[#8C6D3F]/5 p-4 sm:p-5 space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-[#FFF3D6] flex items-center gap-1.5">
                          <Edit2 className="h-3.5 w-3.5 text-[#C9A56A]" />
                          <span>Client Actual Data / Input (Fill Here)</span>
                        </label>

                        {/* 1-Click Approve Draft Button */}
                        {isDraftApproved ? (
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 font-mono text-emerald-300 font-bold text-[10px] flex items-center gap-1.5 border border-emerald-500/30">
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>Draft 100% Approved</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCellChange(r.id, 'clientInput', '')}
                              className="text-[10px] text-zinc-400 hover:text-white underline font-mono"
                            >
                              Edit Custom
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickApproveDraft(r.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#C9A56A]/50 bg-[#C9A56A]/20 px-3 py-1 text-xs font-semibold text-[#FFF3D6] hover:bg-[#C9A56A] hover:text-black transition shadow"
                          >
                            <Check className="h-3 w-3 text-[#C9A56A]" />
                            <span>Approve Current Draft</span>
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={3}
                        value={r.clientInput || ''}
                        onChange={(e) => handleCellChange(r.id, 'clientInput', e.target.value)}
                        placeholder="Type real brand copy, contact details, policy wording, or click Approve Current Draft above..."
                        className="w-full rounded-xl border border-[#C9A56A]/30 bg-[#0B0B0D] p-3 text-xs text-white placeholder-zinc-500 focus:border-[#C9A56A] focus:ring-1 focus:ring-[#C9A56A] focus:outline-none transition leading-relaxed shadow-inner"
                      />

                      {/* Asset / Media Cloud Link */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                          <span>Asset / Media Link (Google Drive, Cloud Storage, or PDF Lookbook URL)</span>
                          {r.assetUrl && (
                            <a
                              href={r.assetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#C9A56A] hover:underline flex items-center gap-1"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={r.assetUrl || ''}
                            onChange={(e) => handleCellChange(r.id, 'assetUrl', e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: WIDE SPREADSHEET TABLE (Spacious, Fixed Column Widths, No Wrapping) */}
      {layoutMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B0B0D] shadow-2xl">
          <table className="w-full border-collapse text-left text-xs font-sans min-w-[1750px]">
            {/* Table Header matching user's exact uploaded image layout */}
            <thead>
              <tr className="border-b border-white/10 bg-[#121215] text-[11px] font-semibold text-zinc-200">
                <th className="py-3 px-3 w-12 text-center text-zinc-500 font-mono">#</th>
                <th className="py-3 px-4 min-w-[150px] border-r border-white/5 whitespace-nowrap">Page / Route</th>
                <th className="py-3 px-4 min-w-[180px] border-r border-white/5 whitespace-nowrap">Section / Component</th>
                <th className="py-3 px-4 min-w-[220px] border-r border-white/5 whitespace-nowrap">Specific Requirement</th>
                <th className="py-3 px-4 min-w-[320px] border-r border-white/5 bg-white/[0.02] whitespace-nowrap">
                  Current Draft on Website
                </th>

                {/* HIGHLIGHTED GOLD/BRONZE CLIENT INPUT HEADER */}
                <th className="py-3 px-4 min-w-[360px] bg-[#8C6D3F]/80 text-[#FFF3D6] font-bold border-r border-[#A37B3E] shadow-inner whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Edit2 className="h-3 w-3 text-white" />
                    <span>Client Actual Data / Input (Fill Here)</span>
                  </div>
                </th>

                {/* HIGHLIGHTED ASSET / MEDIA LINK HEADER (Wide, No Vertical Header Wrapping) */}
                <th className="py-3 px-4 min-w-[260px] bg-[#70552D]/80 text-[#FFF3D6] font-semibold border-r border-[#8C6D3F]/50 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3 text-white" />
                    <span>Asset / Media Link (Google Drive / Cloud)</span>
                  </div>
                </th>

                <th className="py-3 px-4 min-w-[240px] border-r border-white/5 whitespace-nowrap">Notes &amp; Guidelines</th>
                <th className="py-3 px-3 min-w-[120px] text-center whitespace-nowrap">Status &amp; Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <FileSpreadsheet className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    <p className="text-sm font-medium text-zinc-400">No matching section rows found.</p>
                    <p className="text-xs text-zinc-600 mt-1">Try resetting your filters or add a new section row.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const isModified = modifiedIds.has(r.id);
                  const hasClientInput = !!(r.clientInput && r.clientInput.trim().length > 0);
                  const isAccepted = r.status === 'ACCEPTED';
                  const isDraftApproved = r.clientInput === 'APPROVED';

                  return (
                    <tr
                      key={r.id}
                      className={`transition group ${
                        isModified
                          ? 'bg-amber-500/[0.04]'
                          : idx % 2 === 0
                          ? 'bg-[#121215]/40'
                          : 'bg-transparent'
                      } hover:bg-white/[0.02]`}
                    >
                      {/* Index Sequence */}
                      <td className="py-4 px-3 text-center text-zinc-500 font-mono text-[10px]">
                        {r.sequence || idx + 1}
                      </td>

                      {/* Page / Route */}
                      <td className="py-4 px-4 border-r border-white/5 font-mono text-zinc-300">
                        {isInternalUser ? (
                          <input
                            type="text"
                            value={r.pageRoute || '/'}
                            onChange={(e) => handleCellChange(r.id, 'pageRoute', e.target.value)}
                            className="w-full bg-transparent text-zinc-200 focus:bg-[#171719] focus:outline-none rounded px-1.5 py-1"
                          />
                        ) : (
                          <span className="inline-block rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[#C9A56A] font-semibold text-[11px]">
                            {r.pageRoute || '/'}
                          </span>
                        )}
                      </td>

                      {/* Section / Component */}
                      <td className="py-4 px-4 border-r border-white/5 font-medium text-white">
                        {isInternalUser ? (
                          <input
                            type="text"
                            value={r.sectionComponent || ''}
                            onChange={(e) => handleCellChange(r.id, 'sectionComponent', e.target.value)}
                            className="w-full bg-transparent text-white font-medium focus:bg-[#171719] focus:outline-none rounded px-1.5 py-1"
                          />
                        ) : (
                          <span className="text-sm font-semibold">{r.sectionComponent}</span>
                        )}
                      </td>

                      {/* Specific Requirement */}
                      <td className="py-4 px-4 border-r border-white/5 text-zinc-400 leading-relaxed text-xs">
                        {isInternalUser ? (
                          <textarea
                            rows={3}
                            value={r.specificRequirement || ''}
                            onChange={(e) => handleCellChange(r.id, 'specificRequirement', e.target.value)}
                            className="w-full bg-transparent text-zinc-300 resize-none focus:bg-[#171719] focus:outline-none rounded p-1.5"
                          />
                        ) : (
                          <span>{r.specificRequirement}</span>
                        )}
                      </td>

                      {/* Current Draft on Website */}
                      <td className="py-4 px-4 border-r border-white/5 text-zinc-300 bg-white/[0.01] leading-relaxed text-xs">
                        {isInternalUser ? (
                          <textarea
                            rows={3}
                            value={r.currentDraft || ''}
                            onChange={(e) => handleCellChange(r.id, 'currentDraft', e.target.value)}
                            placeholder="Draft on prototype..."
                            className="w-full bg-transparent text-zinc-300 resize-none focus:bg-[#171719] focus:outline-none rounded p-1.5"
                          />
                        ) : (
                          <div className="rounded-lg bg-[#0B0B0D] border border-white/5 p-2.5 text-zinc-300 italic">
                            {r.currentDraft || '—'}
                          </div>
                        )}
                      </td>

                      {/* CLIENT ACTUAL DATA / INPUT (FILL HERE) — GOLDEN ACCENT CELL */}
                      <td className="py-3 px-4 border-r border-[#A37B3E]/40 bg-[#8C6D3F]/10">
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={r.clientInput || ''}
                            onChange={(e) => handleCellChange(r.id, 'clientInput', e.target.value)}
                            placeholder="Type real copy, policies, or click Approve Draft below..."
                            className="w-full rounded-xl border border-[#C9A56A]/40 bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#C9A56A] focus:ring-1 focus:ring-[#C9A56A] focus:outline-none transition leading-relaxed shadow-inner"
                          />

                          {/* 1-Click Approve Draft or Status Flag */}
                          <div className="flex items-center justify-between text-[10px]">
                            {isDraftApproved ? (
                              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                                <span>Draft 100% Approved</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickApproveDraft(r.id)}
                                className="text-[#C9A56A] hover:text-white hover:underline flex items-center gap-1 font-mono transition py-0.5"
                                title="If current draft on website is 100% accurate, click to approve directly"
                              >
                                <Check className="h-2.5 w-2.5" />
                                <span>Approve Draft</span>
                              </button>
                            )}

                            {r.clientInput && !isDraftApproved && (
                              <span className="rounded bg-blue-500/20 px-1.5 py-0.2 font-mono text-blue-300 text-[9px]">
                                Custom Input
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ASSET / MEDIA LINK (GOOGLE DRIVE / CLOUD) */}
                      <td className="py-3 px-4 border-r border-[#8C6D3F]/30 bg-[#70552D]/10">
                        <div className="space-y-1.5">
                          <input
                            type="url"
                            value={r.assetUrl || ''}
                            onChange={(e) => handleCellChange(r.id, 'assetUrl', e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none font-mono"
                          />
                          {r.assetUrl && (
                            <a
                              href={r.assetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#C9A56A] hover:underline font-mono"
                            >
                              <span>Open Cloud Link</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Notes & Guidelines */}
                      <td className="py-4 px-4 border-r border-white/5 text-xs text-zinc-400 leading-relaxed">
                        {isInternalUser ? (
                          <textarea
                            rows={3}
                            value={r.guidelines || ''}
                            onChange={(e) => handleCellChange(r.id, 'guidelines', e.target.value)}
                            placeholder="Guidelines, word count, specs..."
                            className="w-full bg-transparent text-zinc-400 resize-none focus:bg-[#171719] focus:outline-none rounded p-1.5"
                          />
                        ) : (
                          <span>{r.guidelines || '—'}</span>
                        )}
                      </td>

                      {/* Status & Actions */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-mono font-medium ${
                              isAccepted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isDraftApproved
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                : hasClientInput
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isAccepted ? 'Verified' : isDraftApproved ? 'Approved' : hasClientInput ? 'Submitted' : 'Pending'}
                          </span>

                          {/* Admin Action Quick Toggles */}
                          {isInternalUser && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleToggleVerified(r)}
                                title={isAccepted ? 'Mark as Needs Revision' : 'Verify & Approve'}
                                className={`p-1.5 rounded text-[11px] transition ${
                                  isAccepted
                                    ? 'text-emerald-400 hover:bg-emerald-500/20'
                                    : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/10'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(r.id)}
                                title="Delete this row"
                                className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Save Reminder when scrolled down */}
      {modifiedIds.size > 0 && (
        <div className="fixed bottom-6 right-8 z-40 flex items-center gap-3 rounded-2xl border border-[#C9A56A]/50 bg-[#171719]/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="text-xs">
            <span className="font-semibold text-white">Unsaved Matrix Edits</span>
            <span className="text-zinc-400 block text-[11px]">
              You have modified {modifiedIds.size} row{modifiedIds.size > 1 ? 's' : ''}.
            </span>
          </div>
          <button
            onClick={handleBatchSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#C9A56A] px-4 py-2 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow-lg shadow-[#C9A56A]/20"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Now</span>
          </button>
        </div>
      )}

      {/* Modal: Upload via Sheet (CSV / Excel / Paste) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A56A]/20 text-[#C9A56A]">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Upload Website Requirements Sheet
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Import rows from CSV, Excel, or Google Sheets into this project matrix.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0B0B0D] p-3 text-xs">
              <div>
                <span className="font-medium text-white block">Need the exact CSV format?</span>
                <span className="text-zinc-500 text-[11px]">
                  Includes the exact columns matching your sheet.
                </span>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#171719] px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>

            {/* Import Mode */}
            <div className="space-y-1 text-xs">
              <label className="block text-zinc-300 font-medium">Import Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  onClick={() => setUploadMode('append')}
                  className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                    uploadMode === 'append'
                      ? 'border-[#C9A56A] bg-[#C9A56A]/10 text-white'
                      : 'border-white/10 bg-[#0B0B0D] text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={uploadMode === 'append'}
                    onChange={() => setUploadMode('append')}
                    className="accent-[#C9A56A]"
                  />
                  <div>
                    <span className="font-semibold block">Append to Existing</span>
                    <span className="text-[10px] text-zinc-500">Adds rows below current items</span>
                  </div>
                </label>

                <label
                  onClick={() => setUploadMode('replace')}
                  className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                    uploadMode === 'replace'
                      ? 'border-rose-500 bg-rose-500/10 text-white'
                      : 'border-white/10 bg-[#0B0B0D] text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={uploadMode === 'replace'}
                    onChange={() => setUploadMode('replace')}
                    className="accent-rose-500"
                  />
                  <div>
                    <span className="font-semibold block">Replace Entire Sheet</span>
                    <span className="text-[10px] text-zinc-500">Clears current rows and overwrites</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Option A: File Upload */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-zinc-300 font-medium">Option 1: Upload .CSV File</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#C9A56A] file:text-black hover:file:bg-[#B89355]"
              />
            </div>

            {/* Option B: Direct Copy & Paste from Google Sheets / Excel */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-zinc-300 font-medium">
                Option 2: Copy &amp; Paste Table Directly from Google Sheets or Excel
              </label>
              <p className="text-[11px] text-zinc-500">
                Select your rows and columns in Google Sheets / Excel, press Ctrl+C, and paste below:
              </p>
              <textarea
                rows={6}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Page / Route [tab] Section / Component [tab] Specific Requirement [tab] Current Draft on Website [tab] Client Actual Data / Input [tab] Asset / Media Link [tab] Notes & Guidelines..."
                className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] p-3 text-xs text-white placeholder-zinc-600 font-mono focus:border-[#C9A56A] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl border border-white/10 bg-[#0B0B0D] px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading || !pastedData.trim()}
                className="flex items-center gap-2 rounded-xl bg-[#C9A56A] px-5 py-2 text-xs font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
              >
                {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>Import &amp; Process Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Single Section Row */}
      {addRowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Add New Section to Content Matrix
                </h3>
                <p className="text-xs text-zinc-400">
                  Append a new page section or deliverable requirement row.
                </p>
              </div>
              <button
                onClick={() => setAddRowModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSingleRow} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Page / Route *</label>
                  <input
                    type="text"
                    required
                    value={newRow.pageRoute}
                    onChange={(e) => setNewRow({ ...newRow, pageRoute: e.target.value })}
                    placeholder="e.g. /, /about, /collections"
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Section / Component *</label>
                  <input
                    type="text"
                    required
                    value={newRow.sectionComponent}
                    onChange={(e) => setNewRow({ ...newRow, sectionComponent: e.target.value })}
                    placeholder="e.g. Hero Section, Footer"
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Specific Requirement</label>
                <input
                  type="text"
                  value={newRow.specificRequirement}
                  onChange={(e) => setNewRow({ ...newRow, specificRequirement: e.target.value })}
                  placeholder="e.g. Hero Headline, Subtitle, and Primary CTA Button Copy"
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Current Draft on Website</label>
                <textarea
                  rows={2}
                  value={newRow.currentDraft}
                  onChange={(e) => setNewRow({ ...newRow, currentDraft: e.target.value })}
                  placeholder="Current prototype draft copy..."
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Notes &amp; Guidelines</label>
                <input
                  type="text"
                  value={newRow.guidelines}
                  onChange={(e) => setNewRow({ ...newRow, guidelines: e.target.value })}
                  placeholder="Word counts, character limits, resolution rules..."
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddRowModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-[#0B0B0D] px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#C9A56A] px-5 py-2 font-semibold text-black hover:bg-[#B89355] transition"
                >
                  Add Row to Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

