'use client';

import React, { useState, useEffect } from 'react';
import { FullProjectData, UserSession } from '@/lib/types';
import { Header } from '@/components/navigation/Header';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { ProjectTimeline } from '@/components/timeline/ProjectTimeline';
import { PrototypePreviewStudio } from '@/components/preview/PrototypePreviewStudio';
import { ActionRequiredCentre } from '@/components/requirements/ActionRequiredCentre';
import { DocumentCentre } from '@/components/documents/DocumentCentre';
import { UatIssueTracker } from '@/components/uat/UatIssueTracker';
import { HypercareTracker } from '@/components/hypercare/HypercareTracker';
import { AdminWorkspace } from '@/components/admin/AdminWorkspace';
import {
  Compass,
  Layers,
  ExternalLink,
  AlertTriangle,
  FileText,
  Shield,
  Clock,
  ChevronDown,
  Loader2,
} from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('default');
  const [project, setProject] = useState<FullProjectData | null>(null);
  const [activeSurface, setActiveSurface] = useState<'client' | 'admin'>('client');
  const [clientTab, setClientTab] = useState<'overview' | 'timeline' | 'preview' | 'actions' | 'documents' | 'uat' | 'hypercare'>('overview');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async (targetProjectId?: string) => {
    try {
      // 1. Fetch Auth Session
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.user) {
        setCurrentUser(authData.user);
        setAvailableUsers(authData.availableUsers || []);
      } else {
        window.location.href = '/login';
        return;
      }

      // 2. Fetch Scoped Projects
      const listRes = await fetch('/api/projects');
      const listData = await listRes.json();
      const userProjects = listData.projects || [];
      setProjects(userProjects);

      // 3. Determine which project to load
      let projId = targetProjectId || activeProjectId;
      const isValidProject = userProjects.some((p: any) => p.id === projId);
      if (!isValidProject && userProjects.length > 0) {
        projId = userProjects[0].id;
      } else if (!isValidProject) {
        projId = 'default';
      }
      setActiveProjectId(projId);

      const projectRes = await fetch(`/api/projects/${projId}`);
      const projectData = await projectRes.json();
      if (!projectData.error) {
        setProject(projectData);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectProject = async (projectId: string) => {
    try {
      setLoading(true);
      setActiveProjectId(projectId);
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (!data.error) {
        setProject(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSwitch = async (userId: string) => {
    try {
      setLoading(true);
      await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      await fetchData('default');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Requirement handlers
  const handleRequirementSubmit = async (id: string, value: string, fileUrl?: string) => {
    await fetch(`/api/requirements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', value, fileUrl }),
    });
    await fetchData();
  };

  const handleRequirementReview = async (id: string, status: 'ACCEPTED' | 'NEEDS_REVISION', reason?: string) => {
    await fetch(`/api/requirements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'review', status, rejectionReason: reason }),
    });
    await fetchData();
  };

  // Milestone handler
  const handleUpdateMilestone = async (milestoneId: string, updates: any) => {
    await fetch(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await fetchData();
  };

  // Feedback handlers
  const handleFeedbackSubmit = async (feedbackData: any) => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    await fetchData();
  };

  const handleFeedbackResolve = async (id: string, resolutionNotes: string) => {
    await fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'RESOLVED', resolutionNotes }),
    });
    await fetchData();
  };

  // UAT handlers
  const handleIssueCreate = async (issueData: any) => {
    await fetch('/api/uat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData),
    });
    await fetchData();
  };

  const handleIssueUpdate = async (id: string, updates: any) => {
    await fetch('/api/uat', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchData();
  };

  // Update publishing
  const handlePublishUpdate = async (updateData: any) => {
    await fetch('/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    await fetchData();
  };

  if (loading || !project || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0D] text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A56A] text-black font-serif font-bold text-sm">
            L
          </div>
          <div className="space-y-0.5">
            <h1 className="font-serif text-base font-semibold tracking-wider">LUXEOS</h1>
            <p className="text-xs text-zinc-400 font-mono">Loading project workspace...</p>
          </div>
        </div>
        <Loader2 className="mt-5 h-4 w-4 animate-spin text-[#C9A56A]" />
      </div>
    );
  }

  const isInternal =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'LUXE_PM' ||
    currentUser.role === 'INTERNAL_TEAM';

  const pendingCount = project.requirements.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F7F5F1] selection:bg-[#C9A56A]/30 selection:text-white">
      {/* Top Main Navigation */}
      <Header
        currentUser={currentUser}
        availableUsers={availableUsers}
        activeSurface={activeSurface}
        setActiveSurface={setActiveSurface}
        onUserSwitch={handleUserSwitch}
        pendingActionsCount={pendingCount}
        availableProjects={projects}
        activeProjectId={project.id}
        onSelectProject={handleSelectProject}
      />

      {/* Surface View Container */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {activeSurface === 'client' ? (
          <div className="space-y-6">
            {/* Simplified 4-Tab Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setClientTab('overview')}
                  className={`rounded-lg px-3.5 py-1.5 font-medium transition ${
                    clientTab === 'overview'
                      ? 'bg-[#C9A56A] text-black font-semibold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Overview
                </button>

                <button
                  onClick={() => setClientTab('timeline')}
                  className={`rounded-lg px-3.5 py-1.5 font-medium transition ${
                    clientTab === 'timeline'
                      ? 'bg-[#C9A56A] text-black font-semibold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Roadmap
                </button>

                <button
                  onClick={() => setClientTab('actions')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition ${
                    clientTab === 'actions'
                      ? 'bg-[#C9A56A] text-black font-semibold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Action Required</span>
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-300 font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setClientTab('preview')}
                  className={`rounded-lg px-3.5 py-1.5 font-medium transition ${
                    clientTab === 'preview'
                      ? 'bg-[#C9A56A] text-black font-semibold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Prototype
                </button>
              </div>

              {/* More Resources Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium border border-white/10 transition ${
                    ['documents', 'uat', 'hypercare'].includes(clientTab)
                      ? 'bg-zinc-800 text-[#C9A56A] border-[#C9A56A]/30'
                      : 'bg-[#171719] text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>
                    {clientTab === 'documents'
                      ? 'Documents'
                      : clientTab === 'uat'
                      ? 'UAT Issues'
                      : clientTab === 'hypercare'
                      ? 'Hypercare'
                      : 'More'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#171719] p-1.5 shadow-2xl z-40 text-xs">
                    <button
                      onClick={() => {
                        setClientTab('documents');
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-400" />
                      Documents &amp; Agreements
                    </button>
                    <button
                      onClick={() => {
                        setClientTab('uat');
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      UAT Defect Tracker
                    </button>
                    <button
                      onClick={() => {
                        setClientTab('hypercare');
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                      <Clock className="h-3.5 w-3.5 text-[#C9A56A]" />
                      Hypercare &amp; SLA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Tab Content */}
            {clientTab === 'overview' && (
              <ClientDashboard
                project={project}
                currentUser={currentUser}
                onNavigateTab={(tab) => setClientTab(tab as any)}
              />
            )}

            {clientTab === 'timeline' && (
              <ProjectTimeline
                milestones={project.milestones}
                onUpdateMilestone={handleUpdateMilestone}
                isInternalUser={isInternal}
              />
            )}

            {clientTab === 'preview' && (
              <PrototypePreviewStudio
                prototypeUrl={project.prototypeUrl || 'https://kalajay.theluxestudio.in/'}
                projectId={project.id}
                feedbacks={project.feedbacks}
                onFeedbackSubmit={handleFeedbackSubmit}
                onFeedbackResolve={handleFeedbackResolve}
                isInternalUser={isInternal}
              />
            )}

            {clientTab === 'actions' && (
              <ActionRequiredCentre
                requirements={project.requirements}
                onRequirementSubmit={handleRequirementSubmit}
                onRequirementReview={handleRequirementReview}
                isInternalUser={isInternal}
              />
            )}

            {clientTab === 'documents' && (
              <DocumentCentre
                documents={project.documents}
                isInternalUser={isInternal}
              />
            )}

            {clientTab === 'uat' && (
              <UatIssueTracker
                projectId={project.id}
                issues={project.uatIssues}
                onIssueCreate={handleIssueCreate}
                onIssueUpdate={handleIssueUpdate}
                isInternalUser={isInternal}
              />
            )}

            {clientTab === 'hypercare' && (
              <HypercareTracker project={project} />
            )}
          </div>
        ) : (
          /* Admin Workspace Surface */
          <AdminWorkspace
            project={project}
            currentUser={currentUser}
            onUpdateMilestone={handleUpdateMilestone}
            onPublishUpdate={handlePublishUpdate}
            onReload={fetchData}
            availableUsers={availableUsers}
          />
        )}
      </main>

      {/* Brand Footer */}
      <footer className="mt-16 border-t border-white/[0.06] py-6 text-center text-[11px] text-zinc-500 font-mono">
        <p>
          LUXEOS &middot; LuxeStudio Operations Engine &middot; Active Project: {project.name}
        </p>
      </footer>
    </div>
  );
}
