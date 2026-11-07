'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Lock,
  Radio,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  AlertCircle,
} from 'lucide-react';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const faqs = [
    {
      q: 'How does Trustify calculate the 0–100 Digital Trust Score?',
      a: 'Trustify uses a weighted multi-engine risk model: 40% Threat/Brand ML Analysis (lexical signals, brand lookalikes, homoglyphs, phishing keywords), 25% TLS Certificate Validation (expiration, chain integrity, key strength, eMudhra weak-key heuristics, CT logs), 20% Web Security Assessment (HSTS, CSP, cookie flags, HTTPS enforcement), and 15% Collaborative Threat Intelligence (community reports and verified threat feeds). The score is computed as 100 − weighted_risk. Scores ≥ 80 are rated Safe, 50–79 Suspicious, and < 50 Malicious.'
    },
    {
      q: 'What was the eMudhra TLS Certificate incident and how does Trustify detect it?',
      a: 'The recent eMudhra incident exposed severe algorithmic weaknesses in Certificate Authority (CA) key generation. Flaws during RSA key generation produced duplicate public keys across unrelated domains and weak moduli with small prime factors. This theoretically permitted adversaries to forge certificates for legitimate sites without detection by conventional browser locks. Trustify implements specific eMudhra defense checks: trial division on RSA moduli by small primes, cross-domain SPKI public key deduplication, ROCA fingerprint checking, and Certificate Transparency (CT) log anomaly monitoring.'
    },
    {
      q: 'Does Trustify perform any invasive port scanning or exploitation?',
      a: 'No. Trustify operates under strict ethical passive inspection guidelines. We do NOT run active exploit scripts, port scanners, brute-force attempts, or intrusive tests on scanned targets. We evaluate only publicly advertised DNS records, TLS certificates, HTTP response headers, and page content rendered to normal web browsers.'
    },
    {
      q: 'How does SSRF Protection keep the platform and internal networks secure?',
      a: 'Our SSRF guard validates every target URL against loopback (127.0.0.0/8), private (RFC1918), link-local cloud metadata (169.254.169.254), carrier-grade NAT, and IPv6 equivalents. DNS is resolved independently and connections are pinned to the verified public IP address to prevent DNS rebinding attacks.'
    },
    {
      q: 'How can external tools or AI agents connect to Trustify?',
      a: 'Trustify provides a lightweight public REST API at /api/v1/public/check?url=<target> and a native Model Context Protocol (MCP) server located in mcp/fraudguard_mcp/server.py. AI coding agents and browser extensions can execute real-time URL checks, certificate audits, and threat reports directly.'
    }
  ];

  const glossary = [
    { term: 'Brand Lookalike / Homoglyph', desc: 'A deceptive domain substituting visually identical characters (e.g. number 1 for letter l, or Cyrillic characters in Punycode) to mimic a legitimate organization.' },
    { term: 'Certificate Transparency (CT)', desc: 'An open framework of publicly auditable logs where CAs must record all issued certificates, preventing secret or fraudulent certificate issuance.' },
    { term: 'HSTS (Strict-Transport-Security)', desc: 'A security header instructing browsers to strictly communicate over HTTPS, preventing SSL-stripping man-in-the-middle attacks.' },
    { term: 'CSP (Content-Security-Policy)', desc: 'An HTTP header that restricts which scripts, stylesheets, and endpoints a page can execute, neutralizing Cross-Site Scripting (XSS).' },
    { term: 'SPKI (Subject Public Key Info)', desc: 'The cryptographic representation of a certificate’s public key. Detecting identical SPKIs across unrelated domains indicates compromised key generation.' },
  ];

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setTicketSent(false);
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="cream-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBDA] text-xs font-bold text-ink mb-2">
          <BookOpen size={14} className="text-[#468D8B]" />
          <span>Knowledge Base & Technical Architecture</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Trustify Educational Guide & Support
        </h2>
        <p className="mt-1 text-xs md:text-sm text-ink-60">
          Learn about our multi-engine trust scoring model, the cryptographic mechanics of the eMudhra CA incident, and digital threat terminology.
        </p>
      </div>

      {/* eMudhra Case Study Spotlight */}
      <div className="cream-card p-6 md:p-8 bg-gradient-to-br from-[#F6DAC0] via-[#FBEBDA] to-[#F6DAC0] border-2 border-[#468D8B]/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DA6D58]/20 text-[#DA6D58] font-bold text-xs mb-3">
          <AlertCircle size={14} />
          <span>Case Study in Digital Trust Infrastructure</span>
        </div>
        <h3 className="text-xl font-bold text-ink">
          The eMudhra CA Incident: Why Certificate Forensics Matter
        </h3>
        <p className="mt-2 text-xs md:text-sm text-ink-60 leading-relaxed max-w-3xl">
          Digital certificates and Certificate Authorities (CAs) serve as the bedrock of web security. However, when an authority’s cryptographic random number generator fails, catastrophic vulnerabilities arise. In the eMudhra case, flawed key generation produced duplicate RSA moduli and weak prime factors across disparate domains.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/70 border border-[#E8C9AA]">
            <span className="font-bold text-ink block mb-1">1. The Threat</span>
            <p className="text-ink-60 text-[11px]">Weak prime factors allow private keys to be factored and mathematically reverse-engineered in minutes.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/70 border border-[#E8C9AA]">
            <span className="font-bold text-ink block mb-1">2. Browser Lock Fallacy</span>
            <p className="text-ink-60 text-[11px]">Conventional browsers display a green padlock despite an impersonated, compromised certificate.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/70 border border-[#E8C9AA]">
            <span className="font-bold text-ink block mb-1">3. Trustify’s Solution</span>
            <p className="text-ink-60 text-[11px]">Trustify runs automated modulus trial division, SPKI cross-domain deduplication, and CT audits.</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="cream-card p-6 md:p-8 space-y-4">
        <h3 className="text-lg font-bold text-ink mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#FBEBDA] border border-[#E8C9AA] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs md:text-sm font-bold text-ink gap-3"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-ink-60 leading-relaxed border-t border-[#E8C9AA]/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Glossary */}
      <div className="cream-card p-6 md:p-8">
        <h3 className="text-lg font-bold text-ink mb-4">Security Concept Glossary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossary.map((item) => (
            <div key={item.term} className="p-4 rounded-xl bg-[#FBEBDA] border border-[#E8C9AA]">
              <span className="text-xs font-bold text-ink block mb-1 font-mono">{item.term}</span>
              <p className="text-xs text-ink-60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support / Domain Exclusion Form */}
      <div className="cream-card p-6 md:p-8 max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-[#468D8B]" />
          <h3 className="text-lg font-bold text-ink">Contact Analyst Support or Opt-Out</h3>
        </div>
        <p className="text-xs text-ink-60 mb-4">
          Website owners can request a manual review or domain scan exclusion in accordance with our responsible disclosure guidelines.
        </p>

        <form onSubmit={handleSendTicket} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-ink block mb-1">Subject</label>
            <input
              type="text"
              required
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="e.g. Domain review request for mysite.com"
              className="w-full bg-[#FBEBDA] text-ink p-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
            />
          </div>

          <div>
            <label className="font-bold text-ink block mb-1">Message</label>
            <textarea
              rows={3}
              required
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Provide domain details and nature of request..."
              className="w-full bg-[#FBEBDA] text-ink p-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
            />
          </div>

          {ticketSent ? (
            <div className="p-3 rounded-xl bg-[#74B3A8]/20 text-[#468D8B] font-bold text-center">
              Message submitted! A security analyst will review your ticket.
            </div>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>Submit Request</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
