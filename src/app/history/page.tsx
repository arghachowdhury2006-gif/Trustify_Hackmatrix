'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { ScanResult, Verdict } from '@/lib/types';
import { VerdictBadge } from '@/components/ui/VerdictBadge';

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/v1/history?q=${encodeURIComponent(searchQuery)}&verdict=${verdictFilter}`);
      if (res.ok) {
        const data = await res.json();
        setScans(data.items || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [searchQuery, verdictFilter]);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your local scan history?')) return;
    try {
      await fetch('/api/v1/history', { method: 'DELETE' });
      setScans([]);
    } catch {
      //
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="cream-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
            <History size={14} className="text-[#468D8B]" />
            <span>Audit Trail & Records</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Security Scan History
          </h2>
          <p className="mt-1 text-xs md:text-sm text-ink-60">
            View all past website threat scans, verdicts, confidence intervals, and technical reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="/api/v1/history/export"
            download="trustify_scan_history.csv"
            className="px-4 py-2.5 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] transition-all flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
          <button
            onClick={handleClearHistory}
            className="px-4 py-2.5 rounded-btn bg-[#DA6D58]/15 hover:bg-[#DA6D58]/30 text-[#DA6D58] font-semibold text-xs border border-[#DA6D58]/40 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="cream-card p-6 md:p-8 space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by URL or domain..."
              className="w-full bg-[#FBEBDA] text-ink placeholder-ink-60 text-xs pl-9 pr-4 py-2.5 rounded-full border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
            />
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['all', 'safe', 'suspicious', 'malicious'].map((v) => (
              <button
                key={v}
                onClick={() => setVerdictFilter(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  verdictFilter === v
                    ? 'bg-[#468D8B] text-white shadow'
                    : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8C9AA] text-ink-60 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Target Domain & URL</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8C9AA]/40">
              {scans.length > 0 ? (
                scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-[#FBEBDA]/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-ink block font-mono">
                        {scan.domain.name}
                      </span>
                      <span className="text-[11px] text-ink-60 font-mono truncate max-w-xs block">
                        {scan.inputUrl}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <VerdictBadge verdict={scan.verdict} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-ink">
                      <span
                        className={
                          scan.score >= 80
                            ? 'text-[#468D8B]'
                            : scan.score >= 50
                            ? 'text-[#213843]'
                            : 'text-[#DA6D58]'
                        }
                      >
                        {scan.score} / 100
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-ink-60">
                      {scan.durationMs} ms
                    </td>
                    <td className="py-3 px-3 text-ink-60 font-mono text-[11px]">
                      {new Date(scan.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/scan?url=${encodeURIComponent(scan.inputUrl)}`}
                        className="inline-flex items-center gap-1 text-[#468D8B] font-bold hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-60">
                    No scan history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
