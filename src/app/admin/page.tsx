'use client';

import React, { useState, useEffect } from 'react';
import { FullProjectData, UserSession } from '@/lib/types';
import { Header } from '@/components/navigation/Header';
import { AdminWorkspace } from '@/components/admin/AdminWorkspace';
import { ProjectPortfolioHub } from '@/components/admin/ProjectPortfolioHub';
import { Loader2, LayoutGrid, Sliders } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('default');
  const [project, setProject] = useState<FullProjectData | null>(null);
  const [adminView, setAdminView] = useState<'portfolio' | 'workspace'>('portfolio');
  const [loading, setLoading] = useState(true);

  const fetchData = async (targetProjectId?: string) => {
    try {
      // 1. Fetch Auth Session
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.user) {
        if (
          authData.user.role === 'CLIENT_OWNER' ||
          authData.user.role === 'CLIENT_COLLABORATOR' ||
          authData.user.role === 'CLIENT_VIEWER'
        ) {
          router.push('/');
          return;
        }
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

      // 3. Determine Project to Load
      if (userProjects.length > 0) {
        let projId = targetProjectId || activeProjectId;
        const isValidProject = userProjects.some((p: any) => p.id === projId);
        if (!isValidProject) {
          projId = userProjects[0].id;
        }
        setActiveProjectId(projId);

        const projectRes = await fetch(`/api/projects/${projId}`);
        const projectData = await projectRes.json();
        if (!projectData.error) {
          setProject(projectData);
        }
      } else {
        setProject(null);
        setActiveProjectId('');
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
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

  const handleUpdateMilestone = async (milestoneId: string, updates: any) => {
    await fetch(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await fetchData();
  };

  const handlePublishUpdate = async (updateData: any) => {
    await fetch('/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    await fetchData();
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0D] text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A56A]/40 bg-[#171719] text-[#C9A56A] shadow-[0_0_20px_rgba(201,165,106,0.3)]">
            <span className="font-serif text-xl font-bold">L</span>
          </div>
          <div className="space-y-1">
            <h1 className="font-serif text-lg font-semibold tracking-wider">LUXEOS ADMIN</h1>
            <p className="text-xs text-zinc-400 font-mono">Authenticating operational workspace...</p>
          </div>
        </div>
        <Loader2 className="mt-6 h-5 w-5 animate-spin text-[#C9A56A]" />
      </div>
    );
  }

  const pendingCount = project ? project.requirements.filter((r) => r.status === 'PENDING').length : 0;

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F7F5F1] selection:bg-[#C9A56A]/30 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        activeSurface="admin"
        setActiveSurface={(surface) => {
          if (surface === 'client') {
            router.push('/');
          }
        }}
        pendingActionsCount={pendingCount}
        availableProjects={projects}
        activeProjectId={project?.id || ''}
        onSelectProject={handleSelectProject}
      />

      {/* Main Admin Surface */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* View Switcher Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminView('portfolio')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition ${
                adminView === 'portfolio'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Project Matrix &amp; Onboard Hub (Gist)</span>
            </button>

            <button
              onClick={() => setAdminView('workspace')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition ${
                adminView === 'workspace'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Milestone Gates &amp; SMTP ({project?.name || 'No Project Selected'})</span>
            </button>
          </div>
        </div>

        {adminView === 'portfolio' ? (
          <ProjectPortfolioHub
            currentUser={currentUser}
            projects={projects}
            availableUsers={availableUsers}
            onSelectProject={(projId) => {
              handleSelectProject(projId);
              setAdminView('workspace');
            }}
            onReload={fetchData}
          />
        ) : project ? (
          <AdminWorkspace
            project={project}
            currentUser={currentUser}
            onUpdateMilestone={handleUpdateMilestone}
            onPublishUpdate={handlePublishUpdate}
            onReload={fetchData}
            availableUsers={availableUsers}
          />
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-12 text-center">
            <h3 className="font-serif text-lg font-semibold text-white">No Project Selected</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Select an active project from the Project Matrix or onboard a new client to manage its milestones and workspace.
            </p>
            <button
              onClick={() => setAdminView('portfolio')}
              className="mt-4 rounded-xl bg-[#C9A56A] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-[#D4B57E]"
            >
              Open Project Matrix
            </button>
          </div>
        )}
      </main>

      {/* Brand Footer */}
      <footer className="mt-16 border-t border-white/[0.08] py-8 text-center text-xs text-zinc-500 font-mono">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-zinc-300">LUXEOS ADMIN</span>
            <span>&middot;</span>
            <span>Internal Studio Management</span>
          </div>
          <p className="text-[11px] text-zinc-600">
            LuxeStudio Operations &middot; <a href="https://theluxestudio.in" target="_blank" rel="noopener noreferrer" className="text-[#C9A56A] hover:underline">theluxestudio.in</a> &middot; Active Project: {project?.name || 'None Selected'}
          </p>
        </div>
      </footer>
    </div>
  );
}

