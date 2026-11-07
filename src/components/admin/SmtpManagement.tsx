'use client';

import React, { useState, useEffect } from 'react';
import { SmtpConfigData, EmailQueueData } from '@/lib/types';
import {
  Mail,
  ShieldCheck,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Server,
  Lock,
  RotateCw,
} from 'lucide-react';

export function SmtpManagement() {
  const [config, setConfig] = useState<SmtpConfigData | null>(null);
  const [queue, setQueue] = useState<EmailQueueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [encryption, setEncryption] = useState<'NONE' | 'SSL_TLS' | 'STARTTLS'>('STARTTLS');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [testRecipient, setTestRecipient] = useState('');

  const fetchSmtpData = async () => {
    try {
      const res = await fetch('/api/smtp');
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setHost(data.config.host || '');
        setPort(data.config.port || 587);
        setEncryption(data.config.encryption || 'STARTTLS');
        setUsername(data.config.username || '');
        setFromEmail(data.config.fromEmail || '');
        setFromName(data.config.fromName || '');
        setReplyTo(data.config.replyTo || '');
      }
      if (data.queue) {
        setQueue(data.queue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmtpData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/smtp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          encryption,
          username,
          password: password || undefined,
          fromEmail,
          fromName,
          replyTo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'SMTP Settings successfully updated and encrypted at rest.' });
        setPassword('');
        await fetchSmtpData();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyConnection = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: data.message });
        await fetchSmtpData();
      } else {
        setStatusMsg({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      setStatusMsg({ type: 'error', text: 'Enter test recipient email address.' });
      return;
    }
    setSendingTest(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-test', recipientEmail: testRecipient }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: data.message });
        await fetchSmtpData();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Test transmission failed.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const handleProcessQueue = async () => {
    try {
      await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-queue' }),
      });
      await fetchSmtpData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C9A56A]">
              Super Admin Infrastructure
            </span>
            <span className="rounded bg-[#C9A56A]/10 px-2 py-0.5 text-[10px] text-[#C9A56A] font-mono border border-[#C9A56A]/20">
              Direct SMTP &middot; Zero Third-Party Cloud Lock-in
            </span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-tight mt-1">
            Built-in SMTP Email Management
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSmtpData}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#171719] px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Status
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center gap-3 ${
            statusMsg.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: Settings on Left, Test & Queue on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Settings Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-semibold text-white">
                SMTP Server Configuration
              </h3>
              <p className="text-xs text-zinc-400">
                Credentials are encrypted at rest with AES-256 outside of database storage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono border ${
                  config?.isVerified
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                    : 'bg-amber-950/60 text-amber-400 border-amber-800'
                }`}
              >
                {config?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-zinc-400 font-medium mb-1">
                  SMTP Hostname *
                </label>
                <input
                  type="text"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.theluxestudio.in"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Port *
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Encryption Mode *
                </label>
                <select
                  value={encryption}
                  onChange={(e) => setEncryption(e.target.value as any)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white focus:border-[#C9A56A] focus:outline-none"
                >
                  <option value="STARTTLS">STARTTLS (Port 587)</option>
                  <option value="SSL_TLS">SSL / TLS (Port 465)</option>
                  <option value="NONE">None / Plain (Port 25)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  SMTP Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="notifications@theluxestudio.in"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                SMTP Password (Encrypted at Rest)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={config?.isVerified ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter SMTP password...'}
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
                <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  From Email *
                </label>
                <input
                  type="email"
                  required
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="notifications@theluxestudio.in"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  From Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="LuxeStudio Operations"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Reply-To Address *
                </label>
                <input
                  type="email"
                  required
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="hello@theluxestudio.in"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={handleVerifyConnection}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-lg border border-[#C9A56A]/50 bg-[#C9A56A]/10 px-4 py-2 text-xs font-semibold text-[#C9A56A] hover:bg-[#C9A56A]/20 transition disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {testing ? 'Testing Handshake...' : 'Verify Connection'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#C9A56A] px-5 py-2 text-xs font-semibold text-black hover:bg-[#B89355] transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Test Transmission & Delivery Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Test Dispatch Card */}
          <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-white">
              Dispatch Diagnostic Test Email
            </h3>
            <p className="text-xs text-zinc-400">
              Sends an authenticated branded test payload through the Nodemailer pipeline and records the transmission attempt in the database.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="admin@theluxestudio.in"
                  className="w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-white placeholder-zinc-600 focus:border-[#C9A56A] focus:outline-none"
                />
              </div>

              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 py-2.5 font-semibold text-white hover:bg-white/20 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-[#C9A56A]" />
                {sendingTest ? 'Dispatching Test...' : 'Send Live Test Email'}
              </button>
            </div>
          </div>

          {/* Delivery Queue & Attempt Logs */}
          <div className="rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Persistent Email Queue ({queue.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Transaction logs &amp; retry attempts.
                </p>
              </div>
              <button
                onClick={handleProcessQueue}
                className="text-[11px] text-[#C9A56A] hover:underline flex items-center gap-1"
              >
                <RotateCw className="h-3 w-3" /> Process Queue
              </button>
            </div>

            <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-1">
              {queue.length > 0 ? (
                queue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-white/5 bg-[#0B0B0D]/50 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[140px]">
                        {item.toEmail}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-mono ${
                          item.status === 'SENT'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : item.status === 'FAILED'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-zinc-200 text-xs font-medium truncate">
                      {item.subject}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                      <span>Event: {item.eventType}</span>
                      <span>Attempts: {item.attempts}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 italic text-center py-4">
                  No queued messages yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

