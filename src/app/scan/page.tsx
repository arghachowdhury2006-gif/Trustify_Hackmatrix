'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Globe,
  Radio,
  Share2,
  Download,
  RotateCw,
  AlertTriangle,
  FileCode,
  CheckCircle,
  XCircle,
  Info,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Reason, ScanResult } from '@/lib/types';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { VerdictBadge } from '@/components/ui/VerdictBadge';
import { SeverityPill } from '@/components/ui/SeverityPill';
import { CertificateChainGraphic } from '@/components/ui/CertificateChainGraphic';
import { ProgressTimeline, ScanStage } from '@/components/ui/ProgressTimeline';

function ScanContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || '';

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<ScanStage[]>([
    { id: 'dns', label: 'DNS & Host Resolution', state: 'pending' },
    { id: 'tls', label: 'TLS Certificate Validation', state: 'pending' },
    { id: 'websec', label: 'Web Security Assessment', state: 'pending' },
    { id: 'threat', label: 'Threat & Brand Intelligence', state: 'pending' },
    { id: 'scoring', label: 'Unified Trust Scoring', state: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'threat' | 'cert' | 'websec' | 'intel' | 'raw'>('threat');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportingOpen, setReportingOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (initialUrl && !scanResult) {
      handleRunScan(initialUrl);
    }
  }, [initialUrl]);

  const handleRunScan = async (targetToScan?: string) => {
    const rawTarget = targetToScan || urlInput;
    if (!rawTarget.trim()) return;

    setErrorMsg(null);
    setLoading(true);
    setProgress(0.1);
    setScanResult(null);

    // Initial stage: running DNS
    setStages([
      { id: 'dns', label: 'DNS & Host Resolution', state: 'running' },
      { id: 'tls', label: 'TLS Certificate Validation', state: 'pending' },
      { id: 'websec', label: 'Web Security Assessment', state: 'pending' },
      { id: 'threat', label: 'Threat & Brand Intelligence', state: 'pending' },
      { id: 'scoring', label: 'Unified Trust Scoring', state: 'pending' },
    ]);

    // Stage progression timer simulation
    const t1 = setTimeout(() => {
      setProgress(0.35);
      setStages(prev =>
        prev.map(s =>
          s.id === 'dns'
            ? { ...s, state: 'completed' }
            : s.id === 'tls'
            ? { ...s, state: 'running' }
            : s
        )
      );
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(0.65);
      setStages(prev =>
        prev.map(s =>
          s.id === 'tls'
            ? { ...s, state: 'completed' }
            : s.id === 'websec'
            ? { ...s, state: 'running' }
            : s
        )
      );
    }, 800);

    const t3 = setTimeout(() => {
      setProgress(0.85);
      setStages(prev =>
        prev.map(s =>
          s.id === 'websec'
            ? { ...s, state: 'completed' }
            : s.id === 'threat'
            ? { ...s, state: 'running' }
            : s
        )
      );
    }, 1200);

    try {
      const res = await fetch('/api/v1/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawTarget }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Scan failed to complete');
      }

      setProgress(1.0);
      setStages(prev => prev.map(s => ({ ...s, state: 'completed' })));
      setScanResult(data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('trustify_alerts_updated'));
        window.dispatchEvent(new Event('trustify_history_updated'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during scanning.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJson = () => {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustify_scan_${scanResult.domain.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const submitThreatReport = async () => {
    if (!scanResult) return;
    try {
      await fetch('/api/v1/intel/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: scanResult.inputUrl,
          category: scanResult.verdict === 'malicious' ? 'phishing' : 'other',
          description: `User-reported threat: ${scanResult.explanation}`,
        }),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportingOpen(false);
        setReportSuccess(false);
      }, 2000);
    } catch {
      //
    }
  };

  const presetUrls = [
    { label: 'PayPal Lookalike', url: 'https://paypa1-secure-login.com/auth/verify', type: 'phishing' },
    { label: 'Expired SSL', url: 'https://expired.badssl.com', type: 'cert' },
    { label: 'Self-Signed SSL', url: 'https://self-signed.badssl.com', type: 'cert' },
    { label: 'Safe Example', url: 'https://example.com', type: 'safe' },
  ];

  return (
    <div className="space-y-8">
      {/* Header and Input Section */}
      <div className="cream-card p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
            <Search size={14} className="text-[#468D8B]" />
            <span>Interactive Security Scanner</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Analyze Website Security & Phishing Risk
          </h2>
          <p className="mt-2 text-xs md:text-sm text-ink-60">
            Enter any URL or domain name to trigger real-time SSRF-safe resolution, TLS certificate forensics, web security audit, and brand impersonation detection.
          </p>
        </div>

        {/* Input Bar */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunScan();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com or suspicious URL..."
                className="w-full bg-[#FBEBDA] text-ink placeholder-ink-60 text-sm pl-11 pr-4 py-3.5 rounded-full border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B] focus:ring-2 focus:ring-[#468D8B]/30 font-mono transition-all"
                disabled={loading}
              />
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#468D8B]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="px-8 py-3.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0"
            >
              {loading ? (
                <>
                  <RotateCw size={18} className="animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Scan Website</span>
                </>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-ink-60 font-medium">Try test targets:</span>
            {presetUrls.map((preset) => (
              <button
                key={preset.url}
                onClick={() => {
                  setUrlInput(preset.url);
                  handleRunScan(preset.url);
                }}
                className="px-2.5 py-1 rounded-full bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink text-xs font-semibold border border-[#E8C9AA] transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-[#DA6D58]/15 border border-[#DA6D58]/40 text-[#DA6D58] text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Staged Progress Animation (while scanning) */}
      {loading && (
        <div className="cream-card p-8">
          <div className="text-center mb-4">
            <h3 className="text-base font-bold text-ink">Analyzing Target in Real-Time</h3>
            <p className="text-xs text-ink-60">Executing passive inspection across security engines...</p>
          </div>
          <ProgressTimeline stages={stages} currentProgress={progress} />
        </div>
      )}

      {/* Scan Results Display */}
      {scanResult && !loading && (
        <div className="space-y-6">
          {/* Verdict Hero Card */}
          <div className="cream-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              {/* Score Gauge & Verdict */}
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <ScoreRing score={scanResult.score} size={130} />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <VerdictBadge verdict={scanResult.verdict} size="lg" />
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#FBEBDA] text-ink border border-[#E8C9AA]">
                      {scanResult.domain.ip || 'Resolved Host'}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-ink tracking-tight font-mono break-all">
                    {scanResult.domain.name}
                  </h3>

                  <p className="text-xs md:text-sm text-ink-60 max-w-xl leading-relaxed">
                    {scanResult.explanation}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleRunScan(scanResult.inputUrl)}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCw size={14} />
                  <span>Re-scan</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 size={14} />
                  <span>{copied ? 'Link Copied!' : 'Share'}</span>
                </button>
                <button
                  onClick={handleExportJson}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] transition-all flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => setReportingOpen(true)}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-btn bg-[#DA6D58] hover:bg-[#c95b46] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={14} />
                  <span>Report Threat</span>
                </button>
              </div>
            </div>

            {/* Recommendation Callout */}
            <div
              className={`mt-6 p-4 rounded-2xl flex items-start gap-3 border ${
                scanResult.verdict === 'malicious'
                  ? 'bg-[#DA6D58]/15 border-[#DA6D58]/40 text-ink'
                  : scanResult.verdict === 'suspicious'
                  ? 'bg-[#FEAF76]/25 border-[#FEAF76]/50 text-ink'
                  : 'bg-[#74B3A8]/20 border-[#74B3A8]/40 text-ink'
              }`}
            >
              <Info size={20} className="flex-shrink-0 mt-0.5 text-[#213843]" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block mb-0.5">
                  Recommended Action
                </span>
                <p className="text-xs md:text-sm font-medium leading-relaxed">
                  {scanResult.recommendation}
                </p>
              </div>
            </div>

            {/* Top Reasons Breakdown */}
            {scanResult.reasons.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#E8C9AA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-60 mb-3">
                  Why this verdict was assigned ({scanResult.reasons.length} Findings)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scanResult.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-ink">{reason.title}</span>
                        <SeverityPill severity={reason.severity} />
                      </div>
                      <p className="text-[11px] text-ink-60 leading-relaxed">
                        {reason.detail}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-ink-60 font-mono pt-1 border-t border-[#E8C9AA]/40">
                        <span>Engine: {reason.engine.toUpperCase()}</span>
                        <span>Risk Weight: +{reason.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Forensic Tabs Shell */}
          <div className="cream-card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E8C9AA] pb-4 mb-6">
              <button
                onClick={() => setActiveTab('threat')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'threat'
                    ? 'bg-[#468D8B] text-white shadow'
                    : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                }`}
              >
                Threat & Brand Analysis
              </button>
              <button
                onClick={() => setActiveTab('cert')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'cert'
                    ? 'bg-[#468D8B] text-white shadow'
                    : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                }`}
              >
                TLS Certificate Forensics
              </button>
              <button
                onClick={() => setActiveTab('websec')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'websec'
                    ? 'bg-[#468D8B] text-white shadow'
                    : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                }`}
              >
                Web Security Assessment
              </button>
              <button
                onClick={() => setActiveTab('intel')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'intel'
                    ? 'bg-[#468D8B] text-white shadow'
                    : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                }`}
              >
                Community Intel & Feeds
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'raw'
                    ? 'bg-[#468D8B] text-white shadow'
                    : 'bg-[#FBEBDA] text-ink hover:bg-[#E8C9AA]'
                }`}
              >
                Raw JSON Inspector
              </button>
            </div>

            {/* Tab 1: Threat Analysis */}
            {activeTab === 'threat' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                    <span className="text-[10px] uppercase font-bold text-ink-60 block">Engine Risk</span>
                    <span className="text-2xl font-black text-ink">{scanResult.risk.threat} / 100</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                    <span className="text-[10px] uppercase font-bold text-ink-60 block">Domain Age</span>
                    <span className="text-2xl font-black text-ink">
                      {scanResult.domain.ageDays !== undefined ? `${scanResult.domain.ageDays} d` : 'Unknown'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                    <span className="text-[10px] uppercase font-bold text-ink-60 block">Redirect Hops</span>
                    <span className="text-2xl font-black text-ink">
                      {scanResult.redirectChain.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                    <span className="text-[10px] uppercase font-bold text-ink-60 block">Confidence Level</span>
                    <span className="text-2xl font-black text-[#468D8B]">
                      {Math.round(scanResult.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-60">
                    Host & Autonomous System (ASN)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-ink-60 block text-[10px]">RESOLVED IP</span>
                      <span className="text-ink font-semibold">{scanResult.domain.ip}</span>
                    </div>
                    <div>
                      <span className="text-ink-60 block text-[10px]">NETWORK ASN</span>
                      <span className="text-ink font-semibold">{scanResult.domain.asn || 'AS13335'}</span>
                    </div>
                    <div>
                      <span className="text-ink-60 block text-[10px]">COUNTRY</span>
                      <span className="text-ink font-semibold">{scanResult.domain.country || 'US'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Certificate Forensics */}
            {activeTab === 'cert' && (
              <div className="space-y-6">
                {scanResult.certificateSummary ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                        <span className="text-[10px] uppercase font-bold text-ink-60 block">Certificate Status</span>
                        <div className="flex items-center gap-2 mt-1">
                          {scanResult.certificateSummary.valid ? (
                            <span className="text-sm font-bold text-[#468D8B] flex items-center gap-1">
                              <CheckCircle size={16} /> Valid & Trusted
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-[#DA6D58] flex items-center gap-1">
                              <XCircle size={16} /> Security Problem
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                        <span className="text-[10px] uppercase font-bold text-ink-60 block">Expiry Window</span>
                        <span className="text-base font-bold text-ink mt-1 block">
                          {scanResult.certificateSummary.expiresInDays > 0
                            ? `Expires in ${scanResult.certificateSummary.expiresInDays} days`
                            : `Expired ${Math.abs(scanResult.certificateSummary.expiresInDays)} days ago`}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                        <span className="text-[10px] uppercase font-bold text-ink-60 block">Cryptographic Key</span>
                        <span className="text-base font-bold text-ink mt-1 block font-mono">
                          {scanResult.certificateSummary.keyType} {scanResult.certificateSummary.keyBits}-bit
                        </span>
                      </div>
                    </div>

                    {/* eMudhra Weak Key Forensics Box */}
                    {scanResult.certificateSummary.weakKeyAnalysis && (
                      <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <Lock size={14} className="text-[#468D8B]" />
                            eMudhra CA Weak-Key & Prime Factor Audit
                          </span>
                          <span className="text-[10px] font-mono text-ink-60">
                            Factor Test: {scanResult.certificateSummary.weakKeyAnalysis.smallFactorTest.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-ink-60 leading-relaxed">
                          {scanResult.certificateSummary.weakKeyAnalysis.riskSummary}
                        </p>
                      </div>
                    )}

                    {/* Visual Chain Graphic */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-60 mb-3 text-center">
                        Verified TLS Trust Hierarchy
                      </h4>
                      <CertificateChainGraphic
                        chain={scanResult.certificateSummary.chain}
                        valid={scanResult.certificateSummary.valid}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-ink-60">No TLS certificate observed.</p>
                )}
              </div>
            )}

            {/* Tab 3: Web Security */}
            {activeTab === 'websec' && (
              <div className="space-y-6">
                {scanResult.websecSummary ? (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-ink-60 block">Security Grade</span>
                        <span className="text-3xl font-black text-ink">{scanResult.websecSummary.grade}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-ink-60 block">Protocol</span>
                        <span className="text-sm font-bold text-ink">
                          {scanResult.websecSummary.httpsEnforced ? 'HTTPS Enforced' : 'Plain HTTP'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(scanResult.websecSummary.headers).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-3 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] flex items-center justify-between"
                        >
                          <span className="text-xs font-medium text-ink uppercase tracking-wide">
                            {key}
                          </span>
                          {val ? (
                            <span className="text-xs text-[#468D8B] font-bold flex items-center gap-1">
                              <CheckCircle size={14} /> Present
                            </span>
                          ) : (
                            <span className="text-xs text-[#DA6D58] font-bold flex items-center gap-1">
                              <XCircle size={14} /> Missing
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-ink-60">Web security assessment not available.</p>
                )}
              </div>
            )}

            {/* Tab 4: Community Intel */}
            {activeTab === 'intel' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-ink block">Community Threat Reputation</span>
                    <span className="text-[11px] text-ink-60">
                      Crowdsourced validation from independent security researchers and users.
                    </span>
                  </div>
                  <span className="text-lg font-black text-ink">{scanResult.risk.intel} / 100 Risk</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA] text-xs space-y-2">
                  <span className="text-[10px] uppercase font-bold text-ink-60 block">Threat Feeds</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-md bg-[#468D8B]/20 text-[#213843] font-semibold">
                      OpenPhish: Checked
                    </span>
                    <span className="px-2 py-1 rounded-md bg-[#468D8B]/20 text-[#213843] font-semibold">
                      URLhaus: Checked
                    </span>
                    <span className="px-2 py-1 rounded-md bg-[#468D8B]/20 text-[#213843] font-semibold">
                      CT Transparency: Monitored
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Raw JSON */}
            {activeTab === 'raw' && (
              <div>
                <pre className="p-4 rounded-xl bg-[#182b34] text-[#F6DAC0] text-xs font-mono overflow-x-auto max-h-96">
                  {JSON.stringify(scanResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Report Threat */}
      {reportingOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="cream-card p-6 md:p-8 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-ink">Submit Community Threat Report</h3>
            <p className="text-xs text-ink-60">
              Reporting this website helps protect other users and updates our global collaborative threat intelligence blocklist.
            </p>

            <div className="p-3 rounded-xl bg-[#FBEBDA] text-xs font-mono text-ink truncate border border-[#E8C9AA]">
              {scanResult?.inputUrl}
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-[#74B3A8]/20 text-[#468D8B] text-xs font-bold text-center">
                Report submitted successfully! Thank you for protecting the community.
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setReportingOpen(false)}
                  className="px-4 py-2 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={submitThreatReport}
                  className="px-5 py-2 rounded-btn bg-[#DA6D58] hover:bg-[#c95b46] text-white font-bold text-xs shadow"
                >
                  Confirm & Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-ink-60 text-sm">Loading security scanner...</div>}>
      <ScanContent />
    </Suspense>
  );
}
