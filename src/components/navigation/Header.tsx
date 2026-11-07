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
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserSession;
  availableUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    organizationName: string;
  }>;
  activeSurface: 'client' | 'admin';
  setActiveSurface: (surface: 'client' | 'admin') => void;
  onUserSwitch: (userId: string) => Promise<void>;
  pendingActionsCount: number;
  availableProjects?: Array<{
    id: string;
    name: string;
    slug: string;
    assignedPmName?: string | null;
  }>;
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export function Header({
  currentUser,
  availableUsers,
  activeSurface,
  setActiveSurface,
  onUserSwitch,
  pendingActionsCount,
  availableProjects = [],
  activeProjectId,
  onSelectProject,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const roleLabelMap: Record<UserRole, string> = {
    SUPER_ADMIN: 'Studio Owner (All Access)',
    LUXE_PM: 'Assigned PM (Scoped)',
    INTERNAL_TEAM: 'Team Member',
    CLIENT_OWNER: 'Client Owner',
    CLIENT_COLLABORATOR: 'Collaborator',
    CLIENT_VIEWER: 'Viewer',
  };

  const currentProject = availableProjects.find((p) => p.id === activeProjectId) || availableProjects[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0B0B0D]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Project Selector */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C9A56A] text-black font-serif font-bold text-sm shadow-[0_0_12px_rgba(201,165,106,0.3)]">
            L
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold tracking-wider text-white">
              LUXEOS
            </span>
            <span className="text-zinc-600">&middot;</span>

            {/* Scoped Project Switcher */}
            <div className="relative">
              <button
                onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#171719] px-2.5 py-1 text-xs text-white hover:border-[#C9A56A]/40 transition"
              >
                <span className="font-medium truncate max-w-[150px] sm:max-w-[220px]">
                  {currentProject?.name || 'Kalajay'}
                </span>
                {availableProjects.length > 1 && (
                  <span className="rounded bg-[#C9A56A]/20 px-1 py-0.2 text-[9px] font-mono text-[#C9A56A]">
                    {availableProjects.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {projectMenuOpen && availableProjects.length > 0 && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#171719] p-2 shadow-2xl z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-mono flex justify-between">
                    <span>Your Scoped Projects</span>
                    <span>{currentUser.role === 'SUPER_ADMIN' ? 'All Access' : 'Assigned Only'}</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {availableProjects.map((p) => (
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
                          <div className="font-medium text-white truncate">{p.name}</div>
                          {p.assignedPmName && (
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Manager: {p.assignedPmName}
                            </div>
                          )}
                        </div>
                        {p.id === currentProject?.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Simplified Surface Switcher */}
        <div className="flex items-center rounded-full border border-white/10 bg-[#171719] p-0.5 text-xs">
          <button
            onClick={() => setActiveSurface('client')}
            className={`rounded-full px-3 py-1 font-medium transition ${
              activeSurface === 'client'
                ? 'bg-[#C9A56A] text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Client Portal
          </button>
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
        </div>

        {/* Right: Clean User Switcher with Scope Label */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-[#171719] px-2.5 py-1 text-xs text-zinc-300 hover:border-white/20 transition"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A56A]/20 text-[#C9A56A] text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden sm:inline font-medium text-white">{currentUser.name}</span>
            <span className="text-[10px] text-[#C9A56A]">
              ({currentUser.role === 'SUPER_ADMIN' ? 'Owner' : currentUser.role === 'LUXE_PM' ? 'Nitin' : 'Client'})
            </span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#171719] p-2 shadow-2xl z-50 text-xs">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                Test Multi-Role Permissions
              </div>
              <div className="mt-1 space-y-0.5">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      await onUserSwitch(u.id);
                      setUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2 py-2 text-left transition ${
                      u.id === currentUser.id
                        ? 'bg-[#C9A56A]/15 text-[#C9A56A] font-semibold'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-[10px] text-zinc-400">{roleLabelMap[u.role] || u.role}</div>
                    </div>
                    {u.id === currentUser.id && <Check className="h-3.5 w-3.5 text-[#C9A56A]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
