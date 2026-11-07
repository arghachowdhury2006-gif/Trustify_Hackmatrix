'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/');
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-[24px] overflow-hidden border border-[#2d4a57] shadow-card">
        {/* Left: Ink Panel */}
        <div className="hero-gradient p-8 md:p-12 text-[#F6DAC0] flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#468D8B] to-[#74B3A8] flex items-center justify-center text-[#213843] mb-6 shadow-md">
              <ShieldCheck size={28} className="stroke-[2.5]" />
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Join Trustify Collaborative Defense
            </h2>
            <p className="mt-2 text-xs md:text-sm text-[#F6DAC0]/80 leading-relaxed">
              Empower your organisation with instant phishing verdicts, certificate transparency alerts, and community-verified threat intelligence.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#182b34]/80 border border-[#2d4a57] text-xs">
            <span className="text-[#74B3A8] font-bold block mb-1">Standard Analyst Privileges:</span>
            <ul className="space-y-1 text-[#F6DAC0]/80 text-[11px] list-disc list-inside">
              <li>60 automated deep scans per hour</li>
              <li>Continuous certificate monitoring watchlist</li>
              <li>Verified community threat reporting</li>
            </ul>
          </div>
        </div>

        {/* Right: Cream Form Card */}
        <div className="cream-card p-8 md:p-12 flex flex-col justify-between rounded-none border-0">
          <div>
            <h3 className="text-2xl font-black text-ink tracking-tight">Create Account</h3>
            <p className="text-xs text-ink-60 mt-1 mb-6">
              Register as an analyst to access forensic threat data.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-[#FBEBDA] text-ink text-xs pl-10 pr-3 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@organization.com"
                    className="w-full bg-[#FBEBDA] text-ink text-xs pl-10 pr-3 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Password (min 10 characters)</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FBEBDA] text-ink text-xs pl-10 pr-3 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-[#E8C9AA] text-center">
            <p className="text-[11px] text-ink-60">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#468D8B] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
