'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Route to user's assigned surface
      router.push(data.redirectUrl || '/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0B0B0D] text-[#F7F5F1]">
      {/* Left Column: LuxeStudio Brand Identity & Milestone Graphic */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/[0.08] bg-[#0E0E11] p-12 lg:flex overflow-hidden">
        {/* Subtle Ambient Background Gradient */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#C9A56A]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#C9A56A]/5 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A56A] font-serif text-lg font-bold text-black shadow-[0_0_20px_rgba(201,165,106,0.35)]">
            L
          </div>
          <div>
            <span className="font-serif text-base font-semibold tracking-widest text-white">
              LUXEOS
            </span>
            <span className="block text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
              Operations Engine
            </span>
          </div>
        </div>

        {/* Center: Hero Statement & Signature Milestone Journey */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A56A]/30 bg-[#C9A56A]/10 px-3 py-1 text-[11px] font-medium text-[#C9A56A]">
              <Sparkles className="h-3.5 w-3.5" />
              Production Workspace &middot; v2.4
            </span>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-white xl:text-4xl leading-tight">
              A bespoke digital operations and client experience platform.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Purpose-built for LuxeStudio leadership, project managers, and enterprise clients to track deliveries, verify milestones, and review staging prototypes in real time.
            </p>
          </div>

          {/* Connected Operations Delivery Lifecycle Visualizer */}
          <div className="rounded-2xl border border-white/10 bg-[#171719]/80 p-5 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs">
              <span className="font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                Operations Engine &middot; Delivery Lifecycle
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                Governed Delivery
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  ✓
                </div>
                <div className="text-xs">
                  <div className="font-medium text-white">Stage 1: Architecture &amp; Staging Prototypes</div>
                  <div className="text-[11px] text-zinc-500">Interactive UI prototypes reviewed &amp; signed off</div>
                </div>
              </div>

              <div className="ml-3 h-4 w-px bg-white/10" />

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A56A]/20 text-[#C9A56A] text-xs font-bold border border-[#C9A56A]">
                  2
                </div>
                <div className="text-xs">
                  <div className="font-medium text-white">Stage 2: Requirements &amp; Assets Matrix</div>
                  <div className="text-[11px] text-[#C9A56A] font-mono">Live client input &amp; runtime roadmap sync</div>
                </div>
              </div>

              <div className="ml-3 h-4 w-px bg-white/10" />

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-500 text-xs">
                  3
                </div>
                <div className="text-xs text-zinc-500">
                  <div>Stage 3: UAT Sign-off &amp; Hypercare Governance</div>
                  <div className="text-[10px] font-mono">Real-time SLA countdown &amp; post-launch warranty</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500">
          <span>&copy; 2026 LuxeStudio</span>
          <a
            href="https://theluxestudio.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#C9A56A] transition"
          >
            theluxestudio.in &rarr;
          </a>
        </div>
      </div>

      {/* Right Column: Secure Authentication Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm space-y-8">
          {/* Mobile Brand Monogram */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A56A] font-serif font-bold text-black text-sm">
              L
            </div>
            <span className="font-serif text-sm font-semibold tracking-wider text-white">
              LUXEOS
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Welcome back
            </h2>
            <p className="text-xs text-zinc-400">
              Sign in with your LuxeStudio credentials to access your client portal or operational dashboard.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                User ID or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. luxe_kalajay or name@theluxestudio.in"
                  className="w-full rounded-xl border border-white/10 bg-[#171719] px-3.5 py-2.5 pl-10 text-xs text-white placeholder-zinc-500 focus:border-[#C9A56A] focus:outline-none transition shadow-inner"
                />
                <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('For security, password reset tokens are sent via encrypted internal email. Please contact LuxeStudio Super Admin.');
                  }}
                  className="text-[11px] text-[#C9A56A] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/10 bg-[#171719] px-3.5 py-2.5 pl-10 pr-10 text-xs text-white placeholder-zinc-500 focus:border-[#C9A56A] focus:outline-none transition shadow-inner"
                />
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#C9A56A] accent-[#C9A56A]"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C9A56A] py-3 text-xs font-semibold text-black hover:bg-[#B89355] transition shadow-lg shadow-[#C9A56A]/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to LuxeOS</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-zinc-500">
            Protected by LuxeStudio AES-256 and cryptographic session handling.
          </div>
        </div>
      </div>
    </div>
  );
}
