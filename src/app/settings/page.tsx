'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Eye,
  Shield,
  Bell,
  Trash2,
  Copy,
  Plus,
  Check,
  CheckCircle,
} from 'lucide-react';
import { ApiKeyRecord, WatchlistDomain } from '@/lib/types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'watchlist' | 'notifs'>('api');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [keyName, setKeyName] = useState('');
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistDomain[]>([
    {
      id: 'watch-01',
      domain: 'trustify-portal.io',
      addedAt: '2026-10-24T00:00:00Z',
      status: 'healthy',
      expiresInDays: 85,
      certIssuer: "Let's Encrypt Authority R3",
    },
    {
      id: 'watch-02',
      domain: 'api.trustify-demo.org',
      addedAt: '2026-10-18T00:00:00Z',
      status: 'warning',
      expiresInDays: 11,
      certIssuer: 'DigiCert Global Root G2',
    },
  ]);
  const [newDomain, setNewDomain] = useState('');

  // Notifications state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/v1/users/me/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.items || []);
      }
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await fetch('/api/v1/users/me/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyGenerated(data.key || null);
        setKeyName('');
        fetchKeys();
      }
    } catch {
      //
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await fetch(`/api/v1/users/me/api-keys?id=${id}`, { method: 'DELETE' });
      setApiKeys(prev => prev.filter(k => k.id !== id));
    } catch {
      //
    }
  };

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    const item: WatchlistDomain = {
      id: 'watch-' + Date.now(),
      domain: newDomain.trim().toLowerCase(),
      addedAt: new Date().toISOString(),
      status: 'healthy',
      expiresInDays: 90,
      certIssuer: 'DigiCert Global CA',
    };
    setWatchlist([item, ...watchlist]);
    setNewDomain('');
  };

  const handleCopyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="cream-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
          <Settings size={14} className="text-[#468D8B]" />
          <span>Platform Settings & API Integration</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Settings & Developer Tools
        </h2>
        <p className="mt-1 text-xs md:text-sm text-ink-60">
          Manage your analyst profile, generate API keys for browser extensions and AI agents, configure domain watchlists, and adjust alert preferences.
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-[#E8C9AA]">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'api'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            API Keys & Public API
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            Domain Watchlist ({watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            Analyst Profile
          </button>
          <button
            onClick={() => setActiveTab('notifs')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'notifs'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            Notification Rules
          </button>
        </div>
      </div>

      {/* Tab 1: API Keys & Integrations */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* Key Generation Card */}
          <div className="cream-card p-6 md:p-8">
            <h3 className="text-base font-bold text-ink mb-1">Generate API Key</h3>
            <p className="text-xs text-ink-60 mb-4">
              API keys allow programmatic threat scanning from browser extensions, SIEM automation pipelines, and MCP agents.
            </p>

            <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key label (e.g. Chrome Extension or Cloudflare Worker)"
                className="flex-1 bg-[#FBEBDA] text-ink text-xs p-3 rounded-full border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                <span>Create Key</span>
              </button>
            </form>

            {/* Generated Secret Box */}
            {newKeyGenerated && (
              <div className="mt-4 p-4 rounded-2xl bg-[#74B3A8]/20 border border-[#468D8B]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">
                    New API Key Generated (Copy now, this secret is not shown again)
                  </span>
                  <button
                    onClick={() => handleCopyKey(newKeyGenerated)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#468D8B] hover:underline"
                  >
                    <Copy size={14} />
                    <span>{copied ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white/80 rounded-xl font-mono text-xs text-ink select-all break-all border border-[#E8C9AA]">
                  {newKeyGenerated}
                </div>
              </div>
            )}
          </div>

          {/* Active Keys List */}
          <div className="cream-card p-6 md:p-8">
            <h3 className="text-base font-bold text-ink mb-4">Active API Keys</h3>
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink block">{key.name}</span>
                    <span className="font-mono text-ink-60 text-[11px]">
                      Prefix: {key.prefix}••••••••••••
                    </span>
                    <span className="text-[10px] text-ink-60 block mt-0.5">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="p-2 rounded-full hover:bg-[#DA6D58]/20 text-[#DA6D58] transition-all"
                    title="Revoke Key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Developer Documentation Box */}
            <div className="mt-6 pt-6 border-t border-[#E8C9AA] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-60">
                Public REST API Endpoint
              </h4>
              <p className="text-xs text-ink-60">
                Check any website from your extension or script in under 300 ms:
              </p>
              <div className="p-3 rounded-xl bg-[#182b34] text-[#F6DAC0] font-mono text-xs">
                GET https://trustify.local/api/v1/public/check?url=https://example.com
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Domain Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          <div className="cream-card p-6 md:p-8">
            <h3 className="text-base font-bold text-ink mb-1">Add Domain to Continuous Watchlist</h3>
            <p className="text-xs text-ink-60 mb-4">
              Watch your own domains for unexpected Certificate Authority issuance, expiring certificates, or CT anomalies.
            </p>

            <form onSubmit={handleAddWatchlist} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="text"
                required
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="domain.com (e.g. mycompany.com)"
                className="flex-1 bg-[#FBEBDA] text-ink text-xs p-3 rounded-full border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                <span>Add to Watchlist</span>
              </button>
            </form>
          </div>

          <div className="cream-card p-6 md:p-8">
            <h3 className="text-base font-bold text-ink mb-4">Monitored Domains</h3>
            <div className="space-y-3">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink text-sm block font-mono">{item.domain}</span>
                    <span className="text-ink-60 text-[11px]">Issuer: {item.certIssuer}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                        item.status === 'healthy'
                          ? 'bg-[#74B3A8]/25 text-[#468D8B]'
                          : 'bg-[#FEAF76]/30 text-[#DA6D58]'
                      }`}
                    >
                      {item.expiresInDays} days left
                    </span>
                    <button
                      onClick={() => setWatchlist(watchlist.filter(w => w.id !== item.id))}
                      className="text-[#DA6D58] hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Profile */}
      {activeTab === 'profile' && (
        <div className="cream-card p-6 md:p-8 space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-ink">Security Analyst Profile</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-ink block mb-1">Display Name</label>
              <input
                type="text"
                defaultValue="Security Analyst"
                className="w-full bg-[#FBEBDA] text-ink p-3 rounded-xl border border-[#E8C9AA]"
              />
            </div>
            <div>
              <label className="font-bold text-ink block mb-1">Email Address</label>
              <input
                type="email"
                defaultValue="analyst@trustify.local"
                className="w-full bg-[#FBEBDA] text-ink p-3 rounded-xl border border-[#E8C9AA]"
              />
            </div>
            <div>
              <label className="font-bold text-ink block mb-1">Role & Permissions</label>
              <input
                type="text"
                disabled
                defaultValue="Threat Analyst (Tier 2 · Report Moderation Enabled)"
                className="w-full bg-[#E8C9AA]/30 text-ink-60 p-3 rounded-xl border border-[#E8C9AA]"
              />
            </div>
            <div>
              <label className="font-bold text-ink block mb-1">Community Reputation Score</label>
              <div className="p-3 bg-[#FBEBDA] rounded-xl font-bold text-[#468D8B] text-sm">
                92 / 100 · High Trust Contributor
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifs' && (
        <div className="cream-card p-6 md:p-8 space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-ink mb-2">Notification Preferences</h3>
          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FBEBDA] cursor-pointer">
              <span>Email notifications for malicious site scans</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="accent-[#468D8B] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FBEBDA] cursor-pointer">
              <span>In-app security incident popups</span>
              <input
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
                className="accent-[#468D8B] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FBEBDA] cursor-pointer">
              <span>Only trigger for Critical / High severity incidents</span>
              <input
                type="checkbox"
                checked={criticalOnly}
                onChange={(e) => setCriticalOnly(e.target.checked)}
                className="accent-[#468D8B] w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
