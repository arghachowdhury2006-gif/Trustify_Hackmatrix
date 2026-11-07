'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, Shield, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  onToggleSidebar?: () => void;
  unreadCount?: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  unreadCount = 2,
}) => {
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/scan?url=${encodeURIComponent(quickSearch.trim())}`);
  };

  return (
    <header className="h-20 bg-[#213843] border-b border-[#2d4a57] sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#F6DAC0] hover:bg-[#2d4a57] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Global Quick Scan Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-64 md:w-96">
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Scan website (e.g. paypa1.com or domain)..."
            className="w-full bg-[#182b34] text-[#F6DAC0] placeholder-[#F6DAC0]/50 text-xs md:text-sm pl-10 pr-4 py-2.5 rounded-full border border-[#2d4a57] focus:outline-none focus:border-[#468D8B] focus:ring-1 focus:ring-[#468D8B] transition-all"
          />
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74B3A8]"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Live Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#182b34] border border-[#2d4a57] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#74B3A8] animate-pulse" />
          <span className="text-[#F6DAC0]/90 font-medium">All 4 Engines Active</span>
        </div>

        {/* Alerts Bell Link */}
        <Link
          href="/alerts"
          className="relative p-2.5 rounded-full bg-[#182b34] text-[#F6DAC0] hover:bg-[#2d4a57] border border-[#2d4a57] transition-all"
          title="View Alerts"
        >
          <Bell size={18} className="text-[#74B3A8]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DA6D58] rounded-full ring-2 ring-[#213843]" />
          )}
        </Link>

        {/* User Pill / Demo Session */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded-full bg-[#468D8B] flex items-center justify-center text-[#213843] font-bold text-sm shadow">
            JD
          </div>
          <div className="hidden sm:block text-left text-xs leading-tight">
            <span className="font-semibold text-[#F6DAC0] block">Security Analyst</span>
            <span className="text-[10px] text-[#74B3A8]">Analyst Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
};

