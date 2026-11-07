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
} from 'lucide-react';
import { CertificateSummary } from '@/lib/types';
import { CertificateChainGraphic } from '@/components/ui/CertificateChainGraphic';

export default function CertificatePage() {
  const [hostInput, setHostInput] = useState('expired.badssl.com');
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState<CertificateSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInspect = async (hostToInspect?: string) => {
    const target = hostToInspect || hostInput;
    if (!target.trim()) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/certificates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: target }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Certificate inspection failed');
      }

      setCertData(json.summary || json);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while verifying certificate');
    } finally {
      setLoading(false);
    }
  };

  const presetHosts = [
    { label: 'Expired Test', host: 'expired.badssl.com' },
    { label: 'Self-Signed Test', host: 'self-signed.badssl.com' },
    { label: 'Wrong Host Test', host: 'wrong.host.badssl.com' },
    { label: 'Google (Valid)', host: 'google.com' },
    { label: 'GitHub (Valid)', host: 'github.com' },
  ];

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
