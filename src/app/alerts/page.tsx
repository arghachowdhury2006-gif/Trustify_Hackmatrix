'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react';
import { Alert } from '@/lib/types';
import { SeverityPill } from '@/components/ui/SeverityPill';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'medium'>('all');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/v1/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.items || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const handleUpdate = () => {
      fetchAlerts();
    };
    window.addEventListener('trustify_alerts_updated', handleUpdate);
    return () => {
      window.removeEventListener('trustify_alerts_updated', handleUpdate);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/v1/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, isRead: true } : a)));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('trustify_alerts_updated'));
      }
    } catch {
      //
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/v1/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDismissed: true }),
      });
      setAlerts(prev => prev.filter(a => a.id !== id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('trustify_alerts_updated'));
      }
    } catch {
      //
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/alerts', { method: 'POST' });
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('trustify_alerts_updated'));
      }
    } catch {
      //
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'high') return a.severity === 'high' || a.severity === 'critical';
    if (filter === 'medium') return a.severity === 'medium';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="cream-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
            <Bell size={14} className="text-[#DA6D58]" />
            <span>Threat Monitoring & Incident Triage</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Security Incident Alerts
          </h2>
          <p className="mt-1 text-xs md:text-sm text-ink-60">
            Automated alerts triggered by malicious brand lookalikes, expired certificates, and anomalous CT entries.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2.5 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Check size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs & Content */}
      <div className="cream-card p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E8C9AA] pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            Unread ({alerts.filter(a => !a.isRead).length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'high'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            High Severity
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'medium'
                ? 'bg-[#468D8B] text-white shadow'
                : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
            }`}
          >
            Medium Severity
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.isRead
                    ? 'bg-[#FBEBDA]/60 border-[#E8C9AA]'
                    : 'bg-[#FBEBDA] border-[#468D8B]/60 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {!alert.isRead ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#DA6D58] block" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-transparent block" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-ink">{alert.title}</h4>
                      <SeverityPill severity={alert.severity} />
                    </div>
                    <p className="text-xs text-ink-60 leading-relaxed max-w-2xl">
                      {alert.detail}
                    </p>
                    {alert.url && (
                      <span className="text-[11px] font-mono text-[#468D8B] block">
                        {alert.url}
                      </span>
                    )}
                    <span className="text-[10px] text-ink-60 block font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  {alert.url && (
                    <Link
                      href={`/scan?url=${encodeURIComponent(alert.url)}`}
                      className="px-3 py-1.5 rounded-btn bg-[#213843] hover:bg-[#2d4a57] text-[#F6DAC0] text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <span>Investigate</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="p-2 rounded-full hover:bg-[#E8C9AA] text-ink-60 transition-all"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-2 rounded-full hover:bg-[#DA6D58]/20 text-[#DA6D58] transition-all"
                    title="Dismiss alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#468D8B]/15 flex items-center justify-center text-[#468D8B]">
                <Bell size={22} />
              </div>
              <p className="text-sm font-bold text-ink">No Security Alerts Triggered</p>
              <p className="text-xs text-ink-60 max-w-md leading-relaxed">
                Security alerts will automatically appear here when you run a URL scan or Certificate Forensics test that encounters threats, expired certificates, brand impersonation, or cryptographic weaknesses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

