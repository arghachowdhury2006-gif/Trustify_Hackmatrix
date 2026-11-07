'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  Shield,
  User,
  ExternalLink,
  Edit3,
  X,
  Check,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  onToggleSidebar?: () => void;
  unreadCount?: number;
}

function getInitials(name: string): string {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  unreadCount = 2,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const [quickSearch, setQuickSearch] = useState('');

  // Profile state
  const [profileName, setProfileName] = useState('Security Analyst');
  const [profileEmail, setProfileEmail] = useState('analyst@trustify.local');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Edit form state inside modal
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load profile on mount
  useEffect(() => {
    // 1. Check local storage first
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('trustify_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) setProfileName(parsed.name);
          if (parsed.email) setProfileEmail(parsed.email);
        }
      } catch {
        // ignore JSON parse error
      }
    }

    // 2. Fetch from backend
    fetch('/api/v1/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.name) setProfileName(data.name);
          if (data.email) setProfileEmail(data.email);
        }
      })
      .catch(() => {});

    // Listen to custom profile update event
    const handleProfileUpdate = () => {
      try {
        const cached = localStorage.getItem('trustify_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) setProfileName(parsed.name);
          if (parsed.email) setProfileEmail(parsed.email);
        }
      } catch {}
    };

    window.addEventListener('trustify_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('trustify_profile_updated', handleProfileUpdate);
    };
  }, []);

  const handleOpenEditProfile = () => {
    setEditName(profileName);
    setEditEmail(profileEmail);
    setSaveSuccess(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
        }),
      });

      const updated = res.ok ? await res.json() : { name: editName.trim(), email: editEmail.trim() };

      setProfileName(updated.name);
      setProfileEmail(updated.email);

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'trustify_user_profile',
          JSON.stringify({ name: updated.name, email: updated.email })
        );
        window.dispatchEvent(new Event('trustify_profile_updated'));
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setSaveSuccess(false);
      }, 1200);
    } catch {
      // Fallback local save
      setProfileName(editName.trim());
      setProfileEmail(editEmail.trim());
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'trustify_user_profile',
          JSON.stringify({ name: editName.trim(), email: editEmail.trim() })
        );
        window.dispatchEvent(new Event('trustify_profile_updated'));
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setSaveSuccess(false);
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/scan?url=${encodeURIComponent(quickSearch.trim())}`);
  };

  const initials = getInitials(profileName);

  return (
    <>
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

          {/* On Dashboard: AI Trust Architecture badge; on other pages: Global Quick Scan Bar */}
          {isDashboard ? (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#182b34] border border-[#468D8B]/50 text-xs md:text-sm font-semibold text-[#74B3A8] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74B3A8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#468D8B]"></span>
              </span>
              <span className="text-[#F6DAC0] font-medium tracking-wide">
                AI Trust Architecture · 4-Engine Fusion
              </span>
            </div>
          ) : (
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
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
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

          {/* Clickable User Profile Pill */}
          <button
            onClick={handleOpenEditProfile}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#2d4a57] transition-all border border-transparent hover:border-[#468D8B]/40 group text-left cursor-pointer"
            title="Click to edit profile"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#468D8B] to-[#74B3A8] flex items-center justify-center text-[#213843] font-bold text-sm shadow group-hover:scale-105 transition-transform flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <span className="font-semibold text-[#F6DAC0] block truncate max-w-[140px]">
                {profileName}
              </span>
              <span className="text-[10px] text-[#74B3A8] flex items-center gap-1 group-hover:text-[#F6DAC0] transition-colors">
                <span>Analyst Mode</span>
                <Edit3 size={10} className="opacity-70 group-hover:opacity-100" />
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="cream-card p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#E8C9AA] text-ink-60 hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#468D8B] to-[#74B3A8] flex items-center justify-center text-[#213843] font-black text-lg shadow">
                {getInitials(editName || profileName)}
              </div>
              <div>
                <h3 className="text-lg font-black text-ink tracking-tight">Edit Analyst Profile</h3>
                <p className="text-xs text-ink-60">Update your display name and email address</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Argha Banerjee or Security Analyst"
                    className="w-full bg-[#FBEBDA] text-ink placeholder-ink-60 text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B] font-medium transition-all"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. analyst@organization.com"
                    className="w-full bg-[#FBEBDA] text-ink placeholder-ink-60 text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E8C9AA] focus:outline-none focus:border-[#468D8B] font-medium transition-all"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-60" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FBEBDA]/70 border border-[#E8C9AA]/60 text-xs text-ink-60 flex items-center justify-between">
                <span>Role Permission Level</span>
                <span className="font-bold text-[#468D8B] bg-[#74B3A8]/20 px-2 py-0.5 rounded-full text-[11px]">
                  Threat Analyst · Tier 2
                </span>
              </div>

              {saveSuccess ? (
                <div className="p-3 rounded-xl bg-[#74B3A8]/20 border border-[#468D8B]/40 text-[#468D8B] text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <Check size={16} />
                  <span>Profile updated successfully!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2.5 rounded-btn bg-[#FBEBDA] hover:bg-[#E8C9AA] text-ink font-semibold text-xs border border-[#E8C9AA] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !editName.trim()}
                    className="px-6 py-2.5 rounded-btn bg-[#468D8B] hover:bg-[#3a7a78] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};
