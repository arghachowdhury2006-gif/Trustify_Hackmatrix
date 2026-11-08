'use client';

import React, { useState } from 'react';
import {
  Lock,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  Key,
  Calendar,
  Layers,
  History,
  Info,
  CheckCircle,
  XCircle,
  Play,
  FileCheck,
  Server,
  Clock,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { CertificateSummary, ForensicSecurityTest, ForensicTestStatus } from '@/lib/types';
import { CertificateChainGraphic } from '@/components/ui/CertificateChainGraphic';

export default function CertificatePage() {
  const [hostInput, setHostInput] = useState('expired.badssl.com');
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState<CertificateSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [runningAllTests, setRunningAllTests] = useState(false);
  const [runningSingleTest, setRunningSingleTest] = useState<string | null>(null);

  const handleInspect = async (hostToInspect?: string) => {
    const target = hostToInspect || hostInput;
    if (!target.trim()) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/certificates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: target.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Certificate inspection failed');
      }

      setCertData(json.summary || json);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('trustify_alerts_updated'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while verifying certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    const target = hostInput.trim();
    if (!target || runningAllTests || loading) return;

    setRunningAllTests(true);
    try {
      const res = await fetch('/api/v1/certificates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: target }),
      });

      const json = await res.json();
      if (res.ok && json.summary) {
        setCertData(json.summary);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('trustify_alerts_updated'));
        }
      }
    } catch {
      //
    } finally {
      setRunningAllTests(false);
    }
  };

  const handleRunSingleTest = async (testId: string) => {
    const target = hostInput.trim();
    if (!target || runningSingleTest || loading) return;

    setRunningSingleTest(testId);
    try {
      const res = await fetch('/api/v1/certificates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: target, testId }),
      });

      const json = await res.json();
      if (res.ok && json.summary) {
        setCertData(json.summary);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('trustify_alerts_updated'));
        }
      }
    } catch {
      //
    } finally {
      setRunningSingleTest(null);
    }
  };

  const presetHosts = [
    { label: 'Expired Test', host: 'expired.badssl.com' },
    { label: 'Self-Signed Test', host: 'self-signed.badssl.com' },
    { label: 'Wrong Host Test', host: 'wrong.host.badssl.com' },
    { label: 'Google (Valid)', host: 'google.com' },
  ];

  function getStatusStyle(status: ForensicTestStatus) {
    switch (status) {
      case 'PASS':
        return {
          bg: 'bg-[#74B3A8]/20',
          text: 'text-[#468D8B]',
          border: 'border-[#468D8B]/40',
          badgeBg: 'bg-[#468D8B] text-white',
          icon: CheckCircle,
          label: 'PASS',
        };
      case 'FAIL':
        return {
          bg: 'bg-[#DA6D58]/20',
          text: 'text-[#DA6D58]',
          border: 'border-[#DA6D58]/50',
          badgeBg: 'bg-[#DA6D58] text-white',
          icon: XCircle,
          label: 'FAIL',
        };
      case 'WARNING':
        return {
          bg: 'bg-[#FEAF76]/25',
          text: 'text-[#D97706]',
          border: 'border-[#FEAF76]/50',
          badgeBg: 'bg-[#FEAF76] text-[#213843]',
          icon: AlertTriangle,
          label: 'WARNING',
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'bg-[#E8C9AA]/40',
          text: 'text-ink-60',
          border: 'border-[#E8C9AA]',
          badgeBg: 'bg-[#E8C9AA] text-ink',
          icon: HelpCircle,
          label: 'UNKNOWN',
        };
    }
  }

  const testsList = certData?.securityAudit ? [
    {
      key: 'self_signed',
      test: certData.securityAudit.tests.selfSigned,
      icon: ShieldAlert,
    },
    {
      key: 'untrusted_ca',
      test: certData.securityAudit.tests.untrustedCa,
      icon: Layers,
    },
    {
      key: 'weak_rsa_key',
      test: certData.securityAudit.tests.weakRsaKey,
      icon: Key,
    },
    {
      key: 'invalid_signature',
      test: certData.securityAudit.tests.invalidSignature,
      icon: FileCheck,
    },
    {
      key: 'chain_validation',
      test: certData.securityAudit.tests.chainValidation,
      icon: ShieldCheck,
    },
    {
      key: 'revocation_check',
      test: certData.securityAudit.tests.revocationCheck,
      icon: RotateCw,
    },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="cream-card p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
            <Lock size={14} className="text-[#468D8B]" />
            <span>Cryptographic Forensics & CT Audit</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Digital Certificate & Trust Chain Verification
          </h2>
          <p className="mt-2 text-xs md:text-sm text-ink-60">
            Inspired by the eMudhra CA key-generation incident: detect compromised Certificate Authorities, weak RSA key moduli, duplicate SPKI public keys, and unauthorized CT log issuances.
          </p>
        </div>

        {/* Input Bar */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInspect();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={hostInput}
                onChange={(e) => setHostInput(e.target.value)}
                placeholder="Domain name (e.g. expired.badssl.com or github.com)..."
                className="w-full bg-[#FBEBDA] text-ink placeholder-ink-60 text-sm pl-11 pr-4 py-3.5 rounded-full border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B] focus:ring-2 focus:ring-[#468D8B]/30 font-mono transition-all"
                disabled={loading}
              />
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#468D8B]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !hostInput.trim()}
              className="px-8 py-3.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0"
            >
              {loading ? (
                <>
                  <RotateCw size={18} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Check Certificate</span>
                </>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-ink-60 font-medium">Verify test targets:</span>
            {presetHosts.map((preset) => (
              <button
                key={preset.host}
                onClick={() => {
                  setHostInput(preset.host);
                  handleInspect(preset.host);
                }}
                className="px-2.5 py-1 rounded-full bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink text-xs font-semibold border border-[#E8C9AA] transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-[#DA6D58]/15 border border-[#DA6D58]/40 text-[#DA6D58] text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results View */}
      {certData && !loading && (
        <div className="space-y-6">
          {/* Top Status & eMudhra Alert Card */}
          <div className="cream-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-[#E8C9AA]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-60 block">
                  Certificate Analysis Target
                </span>
                <h3 className="text-2xl font-black text-ink font-mono mt-1">
                  {certData.subject}
                </h3>
                <p className="text-xs text-ink-60 mt-1">
                  Issued by: <span className="font-semibold text-ink">{certData.issuer}</span>
                </p>
              </div>

              <div>
                {certData.valid ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-[#74B3A8]/20 border border-[#468D8B]/40 text-[#213843] font-bold text-sm">
                    <CheckCircle size={18} className="text-[#468D8B]" />
                    Valid Certificate Chain
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-[#DA6D58]/20 border border-[#DA6D58]/50 text-[#DA6D58] font-bold text-sm">
                    <XCircle size={18} className="text-[#DA6D58]" />
                    Certificate Anomaly Flagged
                  </span>
                )}
              </div>
            </div>

            {/* eMudhra Weak-Key Analysis Box */}
            {certData.weakKeyAnalysis && (
              <div className="mt-6 p-5 rounded-2xl bg-[#FBEBDA] border border-[#E8C9AA] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#468D8B]/20 flex items-center justify-center text-[#468D8B]">
                      <Key size={16} />
                    </div>
                    <span className="text-sm font-bold text-ink">
                      eMudhra CA Weak-Key Heuristics & Modulus Verification
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-ink border border-[#E8C9AA]">
                    Trial Division: {certData.weakKeyAnalysis.smallFactorTest.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-ink-60 leading-relaxed">
                  {certData.weakKeyAnalysis.riskSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#E8C9AA]/60">
                    <span className="text-[10px] text-ink-60 block">SMALL PRIME FACTOR TEST</span>
                    <span className="font-bold text-ink">
                      {certData.weakKeyAnalysis.smallFactorTest === 'pass' ? 'PASS (No small factors)' : 'FAIL (Compromised)'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#E8C9AA]/60">
                    <span className="text-[10px] text-ink-60 block">SHARED SPKI PUBLIC KEY</span>
                    <span className="font-bold text-ink">
                      {certData.weakKeyAnalysis.sharedWithDomains.length > 0 ? 'DUPLICATE KEY FOUND' : 'UNIQUE (Safe)'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#E8C9AA]/60">
                    <span className="text-[10px] text-ink-60 block">ROCA FINGERPRINT TEST</span>
                    <span className="font-bold text-ink">
                      {certData.weakKeyAnalysis.rocaVulnerable ? 'VULNERABLE' : 'CLEAN'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Attributes Grid */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                <span className="text-[10px] text-ink-60 uppercase font-bold block">Key Size & Alg</span>
                <span className="text-sm font-bold text-ink font-mono block mt-1">
                  {certData.keyType} {certData.keyBits}-bit
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                <span className="text-[10px] text-ink-60 uppercase font-bold block">Signature Alg</span>
                <span className="text-sm font-bold text-ink font-mono block mt-1 truncate">
                  {certData.sigAlg}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                <span className="text-[10px] text-ink-60 uppercase font-bold block">Validity Window</span>
                <span className="text-sm font-bold text-ink block mt-1">
                  {certData.expiresInDays > 0 ? `${certData.expiresInDays} days left` : `Expired ${Math.abs(certData.expiresInDays)}d ago`}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
                <span className="text-[10px] text-ink-60 uppercase font-bold block">SCT Proofs</span>
                <span className="text-sm font-bold text-ink block mt-1">
                  {certData.sctCount} Log Proofs Embedded
                </span>
              </div>
            </div>

            {/* Risk Flags List */}
            {certData.flags && certData.flags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#E8C9AA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-60 mb-3">
                  Flagged Certificate Vulnerabilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {certData.flags.map((flag) => (
                    <span
                      key={flag}
                      className="px-3 py-1.5 rounded-full bg-[#DA6D58]/20 text-[#DA6D58] border border-[#DA6D58]/40 text-xs font-bold font-mono"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* NEW SECTION: Automated Certificate Security Test Suite (6 Forensic Checks) */}
          {certData.securityAudit && (
            <div className="cream-card p-6 md:p-8 space-y-6">
              {/* Test Suite Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E8C9AA]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={20} className="text-[#468D8B]" />
                    <h3 className="text-xl font-black text-ink tracking-tight">
                      Automated Certificate Security Test Suite
                    </h3>
                  </div>
                  <p className="text-xs text-ink-60 max-w-xl">
                    6 in-depth forensic checks verifying self-signed origin, Root CA trust anchors, RSA key length, cryptographic signature integrity, full hierarchy chain, and revocation status.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Overall Status Badge */}
                  <div className="flex items-center gap-2">
                    {certData.securityAudit.overallStatus === 'CRITICAL' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DA6D58]/20 border border-[#DA6D58]/50 text-[#DA6D58] text-xs font-bold font-mono">
                        <XCircle size={14} />
                        CRITICAL VULNERABILITY
                      </span>
                    ) : certData.securityAudit.overallStatus === 'AT_RISK' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEAF76]/25 border border-[#FEAF76]/50 text-[#D97706] text-xs font-bold font-mono">
                        <AlertTriangle size={14} />
                        AT RISK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#74B3A8]/20 border border-[#468D8B]/40 text-[#468D8B] text-xs font-bold font-mono">
                        <CheckCircle size={14} />
                        SECURE & COMPLIANT
                      </span>
                    )}
                  </div>

                  {/* Run All Tests Button */}
                  <button
                    onClick={handleRunAllTests}
                    disabled={runningAllTests || loading}
                    className="px-5 py-2.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <RotateCw size={14} className={runningAllTests ? 'animate-spin' : ''} />
                    <span>{runningAllTests ? 'Executing All Tests...' : 'Run All Tests'}</span>
                  </button>
                </div>
              </div>

              {/* Tally Metrics & Timestamp Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FBEBDA] p-3 rounded-xl border border-[#E8C9AA]">
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="font-bold text-ink-60 text-[11px] uppercase tracking-wider mr-1">
                    Test Results:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#74B3A8]/25 text-[#468D8B] font-bold border border-[#468D8B]/30">
                    {certData.securityAudit.passedCount} PASS
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#DA6D58]/20 text-[#DA6D58] font-bold border border-[#DA6D58]/30">
                    {certData.securityAudit.failedCount} FAIL
                  </span>
                  {certData.securityAudit.warningCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FEAF76]/25 text-[#D97706] font-bold border border-[#FEAF76]/40">
                      {certData.securityAudit.warningCount} WARNING
                    </span>
                  )}
                  {certData.securityAudit.unknownCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8C9AA]/40 text-ink-60 font-bold border border-[#E8C9AA]">
                      {certData.securityAudit.unknownCount} UNKNOWN
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-ink-60 font-mono">
                  <Clock size={12} />
                  <span>Audit timestamp: {new Date(certData.securityAudit.testedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* 6 Forensic Test Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {testsList.map(({ key, test, icon: IconComponent }) => {
                  const style = getStatusStyle(test.status);
                  const isRunningThis = runningSingleTest === key;

                  return (
                    <div
                      key={key}
                      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all bg-[#FBEBDA] ${
                        test.status === 'FAIL'
                          ? 'border-[#DA6D58]/40 hover:border-[#DA6D58]'
                          : test.status === 'WARNING'
                          ? 'border-[#FEAF76]/60 hover:border-[#FEAF76]'
                          : test.status === 'PASS'
                          ? 'border-[#74B3A8]/40 hover:border-[#468D8B]'
                          : 'border-[#E8C9AA]'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Card Top: Category & Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-60 bg-[#E8C9AA]/40 px-2 py-0.5 rounded">
                            {test.category}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            <style.icon size={13} />
                            <span>{test.status}</span>
                          </span>
                        </div>

                        {/* Card Title & Icon */}
                        <div className="flex items-center gap-2 pt-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                            <IconComponent size={16} />
                          </div>
                          <h4 className="text-sm font-bold text-ink leading-tight">
                            {test.title}
                          </h4>
                        </div>

                        {/* Headline Summary */}
                        <p className="text-xs font-semibold text-ink leading-relaxed">
                          {test.summary}
                        </p>

                        {/* Technical Details Box */}
                        <div className="p-3 rounded-xl bg-white/80 border border-[#E8C9AA] text-[11px] font-mono text-ink-80 space-y-1.5 overflow-hidden">
                          <div className="flex items-center justify-between text-[10px] text-ink-60 uppercase font-bold border-b border-[#E8C9AA]/40 pb-1">
                            <span>Forensic Findings</span>
                            {test.actualKeySize && <span>{test.actualKeySize} BITS</span>}
                          </div>
                          <p className="leading-relaxed break-words whitespace-pre-wrap">
                            {test.technicalDetails}
                          </p>
                        </div>

                        {/* Recommendation (if applicable) */}
                        {test.recommendation && (
                          <div className="p-2.5 rounded-lg bg-[#FEAF76]/15 border border-[#FEAF76]/30 text-[11px] text-[#213843]">
                            <span className="font-bold text-[#D97706] block mb-0.5">Remediation:</span>
                            <span>{test.recommendation}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Timestamp & Run Test Button */}
                      <div className="pt-4 mt-4 border-t border-[#E8C9AA]/60 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-ink-60 flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(test.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>

                        <button
                          onClick={() => handleRunSingleTest(key)}
                          disabled={isRunningThis || runningAllTests || loading}
                          className="px-3 py-1.5 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink text-xs font-semibold border border-[#E8C9AA] transition-all disabled:opacity-50 flex items-center gap-1.5"
                          title={`Run ${test.title}`}
                        >
                          <Play size={11} className={isRunningThis ? 'animate-spin' : ''} />
                          <span>{isRunningThis ? 'Running...' : 'Run Test'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Trust Chain Graphic */}
          <div className="cream-card p-6 md:p-8">
            <h3 className="text-lg font-bold text-ink text-center mb-6">
              Verified TLS Certificate Trust Hierarchy
            </h3>
            <CertificateChainGraphic chain={certData.chain} valid={certData.valid} />
          </div>

          {/* Certificate Transparency (CT) Timeline */}
          {certData.ct && (
            <div className="cream-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    Certificate Transparency (CT) Log Timeline
                  </h3>
                  <p className="text-xs text-ink-60">
                    Public crt.sh audit trail of all certificates issued for this domain.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-ink bg-[#FBEBDA] px-3 py-1 rounded-full border border-[#E8C9AA]">
                  {certData.ct.total} Total Entries
                </span>
              </div>

              <div className="space-y-3">
                {certData.ct.entries && certData.ct.entries.length > 0 ? (
                  certData.ct.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
                        entry.isAnomalous
                          ? 'bg-[#DA6D58]/15 border-[#DA6D58]/40'
                          : 'bg-[#FBEBDA] border-[#E8C9AA]'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-ink block">{entry.commonName}</span>
                        <span className="text-[11px] text-ink-60">Issuer: {entry.issuerName}</span>
                      </div>
                      <div className="text-right sm:text-right text-[11px] text-ink-60">
                        <span>Logged: {new Date(entry.loggedAt).toLocaleDateString()}</span>
                        {entry.isAnomalous && (
                          <span className="text-[#DA6D58] font-bold block">
                            ANOMALOUS ISSUER FLAGGED
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-60 text-center py-4">
                    No historical CT log records observed.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
