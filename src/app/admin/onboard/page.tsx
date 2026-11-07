'use client';

import React, { useState, useEffect } from 'react';
import { UserSession } from '@/lib/types';
import { Header } from '@/components/navigation/Header';
import { ProjectPortfolioHub } from '@/components/admin/ProjectPortfolioHub';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardAndGistPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Fetch Session
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

      // 2. Fetch All Scoped Projects
      const projRes = await fetch('/api/projects');
      const projData = await projRes.json();
      setProjects(projData.projects || []);
    } catch (err) {
      console.error('Error loading onboarding hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUserSwitch = async (userId: string) => {
    try {
      setLoading(true);
      await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    router.push(`/admin`);
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0D] text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A56A] text-black font-serif font-bold text-sm shadow-[0_0_20px_rgba(201,165,106,0.3)]">
            L
          </div>
          <div className="space-y-0.5">
            <h1 className="font-serif text-base font-semibold tracking-wider">LUXEOS OPERATIONS</h1>
            <p className="text-xs text-zinc-400 font-mono">Loading onboarding &amp; portfolio hub...</p>
          </div>
        </div>
        <Loader2 className="mt-5 h-4 w-4 animate-spin text-[#C9A56A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F7F5F1] selection:bg-[#C9A56A]/30 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        availableUsers={availableUsers}
        activeSurface="admin"
        setActiveSurface={(surface) => {
          if (surface === 'client') {
            router.push('/');
          }
        }}
        onUserSwitch={handleUserSwitch}
        pendingActionsCount={0}
        availableProjects={projects}
        activeProjectId={projects[0]?.id}
        onSelectProject={handleSelectProject}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ProjectPortfolioHub
          currentUser={currentUser}
          projects={projects}
          availableUsers={availableUsers}
          onSelectProject={handleSelectProject}
          onReload={fetchData}
        />
      </main>

      {/* Brand Footer */}
      <footer className="mt-16 border-t border-white/[0.06] py-6 text-center text-[11px] text-zinc-500 font-mono">
        <p>
          LUXEOS &middot; LuxeStudio Operations Engine &middot; Active Accounts: {projects.length}
        </p>
      </footer>
    </div>
  );
}
