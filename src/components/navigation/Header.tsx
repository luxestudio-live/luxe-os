'use client';

import React, { useState } from 'react';
import { UserSession, UserRole } from '@/lib/types';
import {
  ChevronDown,
  Layers,
  Shield,
  Check,
  FolderKanban,
  Sparkles,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserSession;
  activeSurface: 'client' | 'admin';
  setActiveSurface: (surface: 'client' | 'admin') => void;
  pendingActionsCount: number;
  availableProjects?: Array<{
    id: string;
    name: string;
    slug: string;
    assignedPmName?: string | null;
    organization?: {
      id?: string;
      name: string;
      slug?: string;
      brandColor?: string;
      logoUrl?: string | null;
    };
  }>;
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export function Header({
  currentUser,
  activeSurface,
  setActiveSurface,
  pendingActionsCount,
  availableProjects = [],
  activeProjectId,
  onSelectProject,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isPM = currentUser.role === 'LUXE_PM';
  const isStudioStaff = isSuperAdmin || isPM || currentUser.role === 'INTERNAL_TEAM';

  const roleLabelMap: Record<UserRole, string> = {
    SUPER_ADMIN: 'Studio Owner & Master Admin',
    LUXE_PM: 'Project Manager (Scoped)',
    INTERNAL_TEAM: 'Technical Team Member',
    CLIENT_OWNER: 'Client Organization Owner',
    CLIENT_COLLABORATOR: 'Client Collaborator',
    CLIENT_VIEWER: 'Client Viewer',
  };

  const currentProject = availableProjects.find((p) => p.id === activeProjectId) || availableProjects[0];

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0B0B0D]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Project Selector */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C9A56A] text-black font-serif font-bold text-sm shadow-[0_0_12px_rgba(201,165,106,0.35)]">
            L
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold tracking-wider text-white">
              LUXEOS
            </span>
            <span className="text-zinc-600">&middot;</span>

            {/* Project Switcher for Studio Staff */}
            {isStudioStaff && availableProjects.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#171719] px-2.5 py-1 text-xs text-white hover:border-[#C9A56A]/50 transition"
                >
                  <span className="font-medium truncate max-w-[160px] sm:max-w-[240px]">
                    {currentProject ? (
                      currentProject.organization?.name ? (
                        <>
                          <span className="text-[#C9A56A] font-semibold">{currentProject.organization.name}</span>
                          <span className="text-zinc-500 mx-1">&middot;</span>
                          <span>{currentProject.name}</span>
                        </>
                      ) : (
                        currentProject.name
                      )
                    ) : availableProjects.length === 0 ? (
                      'No Projects Yet'
                    ) : (
                      'Select Project'
                    )}
                  </span>
                  {availableProjects.length > 1 && (
                    <span className="rounded bg-[#C9A56A]/20 px-1 py-0.2 text-[9px] font-mono text-[#C9A56A]">
                      {availableProjects.length}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>

                {projectMenuOpen && (
                  <div className="absolute left-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#171719] p-2 shadow-2xl z-50 text-xs">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-mono flex justify-between">
                      <span>Client &amp; Project</span>
                      <span>{isSuperAdmin ? 'Full Access' : 'Assigned Only'}</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {availableProjects.length === 0 ? (
                        <div className="p-3 text-center text-[11px] text-zinc-400 font-mono">
                          No active projects yet.
                        </div>
                      ) : (
                        availableProjects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (onSelectProject) onSelectProject(p.id);
                              setProjectMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                              p.id === currentProject?.id
                                ? 'bg-[#C9A56A]/15 text-[#C9A56A] font-semibold'
                                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="truncate pr-2">
                              {p.organization?.name && (
                                <div className="text-[10px] font-mono uppercase tracking-wider text-[#C9A56A] truncate">
                                  {p.organization.name}
                                </div>
                              )}
                              <div className="font-medium text-white truncate">{p.name}</div>
                            </div>
                            {p.id === currentProject?.id && <Check className="h-3.5 w-3.5 shrink-0 text-[#C9A56A]" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Client View Title */}
            {!isStudioStaff && (
              <span className="text-xs text-zinc-300 font-mono">
                {currentProject ? (
                  currentProject.organization?.name
                    ? `${currentProject.organization.name} · ${currentProject.name}`
                    : currentProject.name
                ) : (
                  'Client Workspace'
                )}
              </span>
            )}
          </div>
        </div>

        {/* Center: Surface Switcher (Only visible to internal studio staff) */}
        {isStudioStaff && (
          <div className="flex items-center rounded-full border border-white/10 bg-[#171719] p-0.5 text-xs">
            <button
              onClick={() => setActiveSurface('admin')}
              className={`rounded-full px-3 py-1 font-medium transition ${
                activeSurface === 'admin'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Studio Admin
            </button>
            <button
              onClick={() => setActiveSurface('client')}
              className={`rounded-full px-3 py-1 font-medium transition ${
                activeSurface === 'client'
                  ? 'bg-[#C9A56A] text-black font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Client View
            </button>
          </div>
        )}

        {/* Right: Real Production User Profile (No Dev Switcher) */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-[#171719] px-2.5 py-1 text-xs text-zinc-300 hover:border-white/20 transition"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A56A]/20 text-[#C9A56A] text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <span className="font-medium text-white">{currentUser.name}</span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#171719] p-3 shadow-2xl z-50 text-xs space-y-3">
              {/* User Identity Details */}
              <div className="space-y-1 border-b border-white/10 pb-2.5">
                <div className="font-semibold text-white text-sm">{currentUser.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono">{currentUser.email}</div>
                <div className="mt-1">
                  <span className="inline-block rounded bg-[#C9A56A]/20 px-2 py-0.5 text-[10px] font-mono text-[#C9A56A]">
                    {roleLabelMap[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>

              {/* Account Options */}
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider px-1">
                  Active Organization
                </div>
                <div className="text-zinc-300 px-1 py-0.5 font-medium">
                  {currentUser.organization?.name || (isStudioStaff ? 'LuxeStudio Internal' : 'Client Organization')}
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-white/10 pt-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-xs font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
