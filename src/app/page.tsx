'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Lock,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  ChevronRight,
  Share2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardSummary } from '@/lib/types';
import { SeverityPill } from '@/components/ui/SeverityPill';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/v1/dashboard/summary');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // fallback handled gracefully
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();

    // Listen to real-time events from URL scans and certificate audits
    window.addEventListener('trustify_history_updated', loadDashboard);
    window.addEventListener('trustify_alerts_updated', loadDashboard);
    return () => {
      window.removeEventListener('trustify_history_updated', loadDashboard);
      window.removeEventListener('trustify_alerts_updated', loadDashboard);
    };
  }, []);

  const totalScans = data?.kpis.totalScans.value ?? 0;
  const hasScans = totalScans > 0;

  const donutData = hasScans && data
    ? [
        { name: 'Safe', value: data.overview.safePct, color: '#468D8B' },
        { name: 'Suspicious', value: data.overview.suspiciousPct, color: '#FEAF76' },
        { name: 'Malicious', value: data.overview.maliciousPct, color: '#DA6D58' },
      ]
    : [{ name: 'No Scans Yet', value: 1, color: '#E8C9AA' }];

  const trendData = data?.overview?.trend || [];
  const threatTypes = data?.threatTypes || [];

  return (
    <div className="space-y-8">
      {/* Hero Banner with Mountain / Sun motif */}
      <div className="relative overflow-hidden rounded-[24px] hero-gradient p-8 md:p-12 border border-[#2d4a57] shadow-card text-[#F6DAC0]">
        {/* Mountain & Sun SVG Motif in background */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 w-80 md:w-96 h-full flex items-end justify-end">
          <svg viewBox="0 0 400 300" className="w-full h-auto" fill="none">
            {/* Sun */}
            <circle cx="280" cy="110" r="50" fill="#FEAF76" opacity="0.6" />
            {/* Mountains */}
            <path
              d="M100 300L220 160L340 300Z"
              fill="#74B3A8"
              opacity="0.5"
            />
            <path
              d="M200 300L310 180L420 300Z"
              fill="#468D8B"
              opacity="0.8"
            />
            <path
              d="M0 300L140 190L280 300Z"
              fill="#213843"
              opacity="0.9"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#F6DAC0] leading-tight">
            AI-Powered Web Threat Detection & Digital Trust Intelligence
          </h1>

          <p className="mt-4 text-sm md:text-base text-[#F6DAC0]/85 leading-relaxed font-normal">
            Detect phishing websites, fraudulent payment portals, and Certificate Authority key vulnerabilities before they compromise users. Unified 0–100 trust scoring in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/scan"
              className="px-6 py-3.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-[#F6DAC0] font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Search size={18} />
              <span>Scan a Website Now</span>
            </Link>

            <Link
              href="/intel"
              className="px-6 py-3.5 rounded-btn bg-transparent hover:bg-[#2d4a57]/50 text-[#F6DAC0] border border-[#74B3A8]/60 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Radio size={18} className="text-[#74B3A8]" />
              <span>Explore Threat Intel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="cream-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-60">
            <span className="text-xs font-bold uppercase tracking-wider">Total Scans</span>
            <div className="w-8 h-8 rounded-full bg-[#468D8B]/15 flex items-center justify-center text-[#468D8B]">
              <Search size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-ink tracking-tight">
              {data ? data.kpis.totalScans.value.toLocaleString() : '0'}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#468D8B] font-semibold">
              <TrendingUp size={14} />
              <span>
                {data?.kpis.totalScans.deltaPct !== undefined && data.kpis.totalScans.deltaPct !== 0
                  ? `${data.kpis.totalScans.deltaPct > 0 ? `+${data.kpis.totalScans.deltaPct}%` : `${data.kpis.totalScans.deltaPct}%`} this week`
                  : 'Live database count'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="cream-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-60">
            <span className="text-xs font-bold uppercase tracking-wider">Safe Websites</span>
            <div className="w-8 h-8 rounded-full bg-[#74B3A8]/20 flex items-center justify-center text-[#468D8B]">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#468D8B] tracking-tight">
              {data ? data.kpis.safe.value.toLocaleString() : '0'}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#468D8B] font-semibold">
              <span>
                {data && data.kpis.totalScans.value > 0
                  ? `${((data.kpis.safe.value / data.kpis.totalScans.value) * 100).toFixed(1)}% verification rate`
                  : '0% verification rate'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="cream-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-60">
            <span className="text-xs font-bold uppercase tracking-wider">Threats Blocked</span>
            <div className="w-8 h-8 rounded-full bg-[#DA6D58]/20 flex items-center justify-center text-[#DA6D58]">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#DA6D58] tracking-tight">
              {data ? data.kpis.threats.value.toLocaleString() : '0'}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#DA6D58] font-semibold">
              <AlertTriangle size={14} />
              <span>
                {data && data.kpis.totalScans.value > 0
                  ? `${((data.kpis.threats.value / data.kpis.totalScans.value) * 100).toFixed(1)}% flagged malicious`
                  : '0% flagged malicious'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="cream-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-60">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
            <div className="w-8 h-8 rounded-full bg-[#FEAF76]/25 flex items-center justify-center text-[#213843]">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-ink tracking-tight">
              {data ? data.kpis.avgResponseMs.value : 0} ms
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#468D8B] font-semibold">
              <span>
                {data?.kpis.avgResponseMs.deltaPct !== undefined && data.kpis.avgResponseMs.deltaPct !== 0
                  ? `${data.kpis.avgResponseMs.deltaPct > 0 ? `+${data.kpis.avgResponseMs.deltaPct}%` : `${data.kpis.avgResponseMs.deltaPct}%`} latency delta`
                  : 'Real-time telemetry'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: 7 / 5 split (Security Overview Donut & Trend | Recent Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Security Overview (7 cols) */}
        <div className="lg:col-span-7 cream-card p-6 md:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-ink tracking-tight">
                Security Overview & 7-Day Trust Score Trend
              </h3>
              <p className="text-xs text-ink-60">
                Aggregated distribution across threat analysis, TLS certificates, and web security.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FBEBDA] border border-[#E8C9AA] text-ink">
              Live Feed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Donut Chart */}
            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-ink">
                  {hasScans && data ? `${data.overview.safePct}%` : '0%'}
                </span>
                <span className="text-[10px] uppercase font-bold text-ink-60">
                  {hasScans ? 'Safe Ratio' : 'No Data'}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#468D8B]" />
                  <span className="font-medium text-ink">Safe Websites</span>
                </div>
                <span className="font-bold text-ink">
                  {hasScans && data ? data.overview.safePct : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FEAF76]" />
                  <span className="font-medium text-ink">Suspicious Anomaly</span>
                </div>
                <span className="font-bold text-ink">
                  {hasScans && data ? data.overview.suspiciousPct : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#DA6D58]" />
                  <span className="font-medium text-ink">Malicious / Phishing</span>
                </div>
                <span className="font-bold text-ink">
                  {hasScans && data ? data.overview.maliciousPct : 0}%
                </span>
              </div>

              <div className="pt-3 border-t border-[#E8C9AA] text-[11px] text-ink-60">
                Calculated dynamically via weighted fusion: 40% Threat/ML, 25% TLS/CT, 20% WebSec, 15% Intel.
              </div>
            </div>
          </div>

          {/* 7-Day Trend Line Chart */}
          <div className="mt-6 pt-6 border-t border-[#E8C9AA]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-60">
                Daily Average Trust Score (Past 7 Days)
              </h4>
              <span className="text-[11px] text-[#468D8B] font-semibold">
                {trendData.reduce((acc, t) => acc + (t.scans || 0), 0)} scans logged
              </span>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="day" stroke="#4b6671" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#4b6671" fontSize={11} tickLine={false} width={28} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                          <div className="bg-[#FBEBDA] border border-[#E8C9AA] rounded-xl p-2.5 shadow-sm text-xs">
                            <div className="font-bold text-ink mb-1">
                              {p.day} ({p.scans} {p.scans === 1 ? 'scan' : 'scans'})
                            </div>
                            <div className="text-[#468D8B] font-semibold">
                              Avg Score: {p.scans > 0 ? `${p.scoreAvg} / 100` : 'No Scans'}
                            </div>
                            {p.scans > 0 && (
                              <div className="text-[10px] text-ink-60 mt-1 flex gap-2">
                                <span>Safe: {p.safe || 0}</span>
                                <span>Suspicious: {p.suspicious || 0}</span>
                                <span>Malicious: {p.malicious || 0}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scoreAvg"
                    stroke="#468D8B"
                    strokeWidth={3}
                    dot={{ fill: '#468D8B', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Recent Alerts (5 cols) */}
        <div className="lg:col-span-5 cream-card p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink tracking-tight">Recent Threat Alerts</h3>
              <Link
                href="/alerts"
                className="text-xs text-[#468D8B] font-bold hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentAlerts && data.recentAlerts.length > 0 ? (
                data.recentAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl bg-[#FBEBDA] border border-[#E8C9AA] transition-all hover:border-[#468D8B]/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-ink block truncate">
                          {alert.title}
                        </span>
                        <p className="text-[11px] text-ink-60 mt-1 line-clamp-2">
                          {alert.detail}
                        </p>
                        {alert.url && (
                          <span className="text-[10px] text-[#468D8B] font-mono mt-1 block truncate">
                            {alert.url}
                          </span>
                        )}
                      </div>
                      <SeverityPill severity={alert.severity} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-ink-60">
                  No active threat alerts. System running safely.
                </div>
              )}
            </div>
          </div>

          <Link
            href="/scan"
            className="mt-6 w-full py-3 rounded-btn bg-[#213843] hover:bg-[#2d4a57] text-[#F6DAC0] font-bold text-xs text-center block transition-all shadow"
          >
            Run New Security Scan
          </Link>
        </div>
      </div>

      {/* Bottom Grid: 4 / 4 / 4 (Threat Types | Quick Tools | Community CTA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Threat Types Breakdown */}
        <div className="cream-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink mb-1">Threat Classification</h3>
            <p className="text-xs text-ink-60 mb-4">Breakdown of flagged incidents.</p>

            <div className="space-y-3">
              {threatTypes.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-ink">{item.label}</span>
                    <span className="font-bold text-ink">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-[#E8C9AA]/40 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.type === 'phishing'
                          ? 'bg-[#DA6D58]'
                          : item.type === 'malware'
                          ? 'bg-[#FEAF76]'
                          : 'bg-[#468D8B]'
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8C9AA] text-[11px] text-ink-60 flex justify-between items-center">
            <span>Model: Heuristic + XGBoost</span>
            <span className="text-[#468D8B] font-semibold">91.4% Precision</span>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="cream-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink mb-1">Quick Tools</h3>
            <p className="text-xs text-ink-60 mb-4">Direct forensic security utilities.</p>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/scan"
                className="p-3 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] hover:border-[#468D8B] transition-all flex flex-col items-center text-center gap-1.5"
              >
                <Search size={20} className="text-[#468D8B]" />
                <span className="text-xs font-bold text-ink">URL Scan</span>
                <span className="text-[10px] text-ink-60">Full 4-Engine</span>
              </Link>

              <Link
                href="/certificate"
                className="p-3 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] hover:border-[#468D8B] transition-all flex flex-col items-center text-center gap-1.5"
              >
                <Lock size={20} className="text-[#468D8B]" />
                <span className="text-xs font-bold text-ink">TLS & CT Check</span>
                <span className="text-[10px] text-ink-60">eMudhra Audit</span>
              </Link>

              <Link
                href="/intel"
                className="p-3 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] hover:border-[#468D8B] transition-all flex flex-col items-center text-center gap-1.5"
              >
                <Radio size={20} className="text-[#468D8B]" />
                <span className="text-xs font-bold text-ink">Threat Feed</span>
                <span className="text-[10px] text-ink-60">Community Intel</span>
              </Link>

              <Link
                href="/history"
                className="p-3 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] hover:border-[#468D8B] transition-all flex flex-col items-center text-center gap-1.5"
              >
                <FileText size={20} className="text-[#468D8B]" />
                <span className="text-xs font-bold text-ink">Export CSV</span>
                <span className="text-[10px] text-ink-60">Scan History</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8C9AA] text-center">
            <Link
              href="/settings"
              className="text-xs text-[#468D8B] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage API Keys & Extensions</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Community Threat Intelligence CTA */}
        <div className="cream-card p-6 flex flex-col justify-between bg-gradient-to-br from-[#F6DAC0] to-[#FBEBDA]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DA6D58] uppercase tracking-wider mb-2">
              <Radio size={14} />
              <span>Collaborative Defense</span>
            </div>
            <h3 className="text-lg font-bold text-ink tracking-tight">
              Build a Safer Internet Together
            </h3>
            <p className="mt-2 text-xs text-ink-60 leading-relaxed">
              Encountered a suspicious payment link or fake recruitment portal? Report it to the Trustify community feed to protect thousands of other internet users.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <Link
              href="/intel"
              className="w-full py-3 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-[#F6DAC0] font-bold text-xs text-center block transition-all shadow"
            >
              Report a Suspicious Website
            </Link>
            <Link
              href="/help"
              className="w-full py-2.5 rounded-btn bg-transparent hover:bg-[#213843]/10 text-ink font-semibold text-xs text-center block transition-all"
            >
              How Trust Scoring Works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

