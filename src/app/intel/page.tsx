'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  ThumbsUp,
  ThumbsDown,
  Download,
  Plus,
  TrendingUp,
  Filter,
  ShieldAlert,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ThreatCategory, ThreatReport } from '@/lib/types';

export default function IntelPage() {
  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form state
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<ThreatCategory>('phishing');
  const [formDesc, setFormDesc] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/v1/intel/feed?category=${categoryFilter}&sort=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.items || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [categoryFilter, sortBy]);

  const handleVote = async (reportId: string, value: 1 | -1) => {
    try {
      const res = await fetch(`/api/v1/intel/reports/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports(prev =>
          prev.map(r =>
            r.id === reportId
              ? { ...r, upvotes: data.upvotes, downvotes: data.downvotes, status: data.status, userVoted: value }
              : r
          )
        );
      }
    } catch {
      //
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) return;

    try {
      const res = await fetch('/api/v1/intel/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl.trim(),
          category: formCategory,
          description: formDesc.trim(),
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
          setFormUrl('');
          setFormDesc('');
          fetchReports();
        }, 1500);
      }
    } catch {
      //
    }
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'phishing', label: 'Phishing' },
    { id: 'fake_payment', label: 'Payment / UPI' },
    { id: 'fake_recruitment', label: 'Fake Job Portal' },
    { id: 'impersonation', label: 'Impersonation' },
    { id: 'malware', label: 'Malware' },
  ];

  const topTargetedBrands = [
    { brand: 'PayPal', count: 184, delta: '+14%' },
    { brand: 'Apple ID', count: 142, delta: '+9%' },
    { brand: 'State Bank of India', count: 128, delta: '+22%' },
    { brand: 'Microsoft 365', count: 96, delta: '-3%' },
    { brand: 'Amazon Orders', count: 88, delta: '+5%' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="cream-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
            <Radio size={14} className="text-[#468D8B]" />
            <span>Crowdsourced & Verified Threat Data</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Collaborative Threat Intelligence
          </h2>
          <p className="mt-1 text-xs md:text-sm text-ink-60 max-w-xl">
            Community-driven threat warnings, indicators of compromise (IOCs), and peer-voted malicious domain classifications.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={18} />
          <span>Report a Website Threat</span>
        </button>
      </div>

      {/* Main Grid: Feed on left (8 cols), Trending & IOCs on right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar */}
          <div className="cream-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    categoryFilter === c.id
                      ? 'bg-[#468D8B] text-white'
                      : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-60">Sort:</span>
              <button
                onClick={() => setSortBy('new')}
                className={`px-2.5 py-1 rounded-full font-bold ${
                  sortBy === 'new' ? 'bg-[#213843] text-white' : 'text-ink'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`px-2.5 py-1 rounded-full font-bold ${
                  sortBy === 'top' ? 'bg-[#213843] text-white' : 'text-ink'
                }`}
              >
                Top Voted
              </button>
            </div>
          </div>

          {/* Feed List */}
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="cream-card p-5 transition-all hover:border-[#468D8B]/50 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#DA6D58]/20 text-[#DA6D58] border border-[#DA6D58]/30">
                        {report.category.replace('_', ' ')}
                      </span>
                      {report.status === 'verified' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#74B3A8]/25 text-[#468D8B] flex items-center gap-1">
                          <CheckCircle size={12} />
                          Community Verified
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm md:text-base font-bold text-ink font-mono truncate max-w-lg">
                      {report.domain}
                    </h4>
                  </div>

                  {/* Upvote / Downvote Buttons */}
                  <div className="flex items-center gap-1 bg-[#FBEBDA] rounded-full p-1 border border-[#E8C9AA]">
                    <button
                      onClick={() => handleVote(report.id, 1)}
                      className={`p-1.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                        report.userVoted === 1
                          ? 'bg-[#468D8B] text-white font-bold'
                          : 'text-ink hover:text-[#468D8B]'
                      }`}
                      title="Upvote Threat Report"
                    >
                      <ThumbsUp size={14} />
                      <span>{report.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(report.id, -1)}
                      className={`p-1.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                        report.userVoted === -1
                          ? 'bg-[#DA6D58] text-white font-bold'
                          : 'text-ink hover:text-[#DA6D58]'
                      }`}
                      title="Downvote"
                    >
                      <ThumbsDown size={14} />
                      <span>{report.downvotes}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-ink-60 leading-relaxed">
                  {report.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8C9AA]/50 text-[11px] text-ink-60 font-mono">
                  <span>URL: {report.url}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Trending Brands & IOC Export (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Targeted Brands */}
          <div className="cream-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-[#468D8B]" />
              <h3 className="text-base font-bold text-ink">Most Targeted Brands</h3>
            </div>
            <div className="space-y-3">
              {topTargetedBrands.map((b) => (
                <div
                  key={b.brand}
                  className="p-2.5 rounded-xl bg-[#FBEBDA] flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-ink">{b.brand}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink-60">{b.count} reports</span>
                    <span className="text-[10px] font-bold text-[#DA6D58]">{b.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IOC Export Card */}
          <div className="cream-card p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download size={18} className="text-[#468D8B]" />
                <h3 className="text-base font-bold text-ink">Export Threat IOCs</h3>
              </div>
              <p className="text-xs text-ink-60">
                Download structured threat indicators for firewalls, SIEM, or STIX threat sharing.
              </p>
            </div>

            <div className="space-y-2">
              <a
                href="/api/v1/intel/export?format=csv"
                download="trustify_threat_ioc.csv"
                className="w-full py-2.5 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] flex items-center justify-center gap-2 transition-all block text-center"
              >
                <span>Export as CSV</span>
              </a>
              <a
                href="/api/v1/intel/export?format=json"
                download="trustify_threat_ioc.json"
                className="w-full py-2.5 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] flex items-center justify-center gap-2 transition-all block text-center"
              >
                <span>Export as JSON</span>
              </a>
              <a
                href="/api/v1/intel/export?format=stix"
                download="trustify_stix21_bundle.json"
                className="w-full py-2.5 rounded-btn bg-[#213843] hover:bg-[#2d4a57] text-[#F6DAC0] font-semibold text-xs flex items-center justify-center gap-2 transition-all block text-center"
              >
                <span>Export STIX 2.1 Bundle</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Submit Threat Report */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="cream-card p-6 md:p-8 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-ink">Submit Community Threat Report</h3>
            <p className="text-xs text-ink-60">
              Provide the deceptive URL and threat category to alert fellow security analysts and update the automated reputation engine.
            </p>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">Target URL</label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://suspicious-portal.com/login"
                  className="w-full bg-[#FBEBDA] text-ink text-xs p-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Threat Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ThreatCategory)}
                  className="w-full bg-[#FBEBDA] text-ink text-xs p-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                >
                  <option value="phishing">Phishing & Credential Theft</option>
                  <option value="fake_payment">Fraudulent Payment / UPI QR</option>
                  <option value="fake_recruitment">Fake Recruitment / Job Portal</option>
                  <option value="impersonation">Brand / Executive Impersonation</option>
                  <option value="malware">Malware / Dropper</option>
                  <option value="other">Other Deceptive Tactic</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Observed Evidence / Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Received via WhatsApp claiming unpaid utility bill with immediate cutoff threat..."
                  className="w-full bg-[#FBEBDA] text-ink text-xs p-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                />
              </div>

              {submitSuccess ? (
                <div className="p-3 rounded-xl bg-[#74B3A8]/20 text-[#468D8B] text-xs font-bold text-center">
                  Report submitted and added to community feed!
                </div>
              ) : (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow"
                  >
                    Publish Report
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

