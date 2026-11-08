'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@trustify.ai');
  const [password, setPassword] = useState('Demo@12345');
  const [showPassword, setShowPassword] = useState(false);
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
        {/* Left: Ink Panel with Mountain Illustration */}
        <div className="hero-gradient p-8 md:p-12 text-[#F6DAC0] flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-[#468D8B]/40 mb-6 bg-[#FBEBDA] flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Trustify Logo"
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Trustify Security Intelligence
            </h2>
            <p className="mt-2 text-xs md:text-sm text-[#F6DAC0]/80 leading-relaxed">
              Detect · Analyze · Stay Safe
            </p>
          </div>

          <div className="relative z-10 pt-8">
            <div className="p-4 rounded-xl bg-[#182b34]/80 border border-[#2d4a57] text-xs">
              <span className="text-[#74B3A8] font-bold block mb-1">Analyst Demo Credentials:</span>
              <span className="font-mono text-[#F6DAC0] block">demo@trustify.ai</span>
              <span className="font-mono text-[#F6DAC0]/70 block">Demo@12345</span>
            </div>
          </div>
        </div>

        {/* Right: Cream Form Card */}
        <div className="cream-card p-8 md:p-12 flex flex-col justify-between rounded-none border-0">
          <div>
            <h3 className="text-2xl font-black text-ink tracking-tight">Sign In</h3>
            <p className="text-xs text-ink-60 mt-1 mb-6">
              Enter your analyst credentials to access advanced forensic reports.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FBEBDA] text-ink text-xs pl-10 pr-3 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FBEBDA] text-ink text-xs pl-10 pr-10 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B]"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-60 hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Analyst'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-[#E8C9AA] text-center space-y-2">
            <Link
              href="/"
              className="text-xs font-bold text-[#468D8B] hover:underline block"
            >
              Continue as Guest (Rate-limited to 10 scans/hr)
            </Link>
            <p className="text-[11px] text-ink-60">
              Need an account?{' '}
              <Link href="/register" className="font-semibold text-ink hover:underline">
                Register analyst account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

