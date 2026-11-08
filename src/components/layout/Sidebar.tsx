'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Search,
  Lock,
  Radio,
  Bell,
  History,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  alertsCount?: number;
  unreadAlertsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  alertsCount,
  unreadAlertsCount,
  isOpen = false,
  onClose,
}) => {
  const pathname = usePathname();
  const displayBadge = alertsCount !== undefined ? alertsCount : unreadAlertsCount;

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scan', label: 'URL Scanner', icon: Search },
    { href: '/certificate', label: 'Certificate Forensics', icon: Lock },
    { href: '/intel', label: 'Threat Intelligence', icon: Radio },
    { href: '/alerts', label: 'Security Alerts', icon: Bell, badge: displayBadge },
    { href: '/history', label: 'Scan History', icon: History },
    { href: '/settings', label: 'Settings & API', icon: Settings },
    { href: '/help', label: 'Help & Knowledge Base', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#213843] text-[#F6DAC0] flex flex-col z-50 transition-transform duration-300 ease-in-out border-r border-[#2d4a57] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#2d4a57] gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-[#468D8B]/40 flex-shrink-0 bg-[#FBEBDA] flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Trustify Logo"
              className="w-full h-full object-cover scale-105"
            />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-[#F6DAC0] block leading-none">
              Trustify
            </span>
            <span className="text-[10px] text-[#74B3A8] uppercase tracking-wider font-semibold">
              Digital Trust Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#468D8B] text-[#213843] font-bold shadow-sm'
                    : 'text-[#F6DAC0]/85 hover:bg-[#2d4a57] hover:text-[#F6DAC0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? 'text-[#213843]' : 'text-[#74B3A8]'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#DA6D58] text-white'
                        : 'bg-[#DA6D58] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Educational Card */}
        <div className="p-4 border-t border-[#2d4a57]">
          <div className="bg-[#182b34] rounded-2xl p-4 border border-[#2d4a57] text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[#74B3A8] tracking-wider">
                eMudhra CA Defense
              </span>
              <span className="w-2 h-2 rounded-full bg-[#468D8B] animate-pulse" />
            </div>
            <p className="text-[#F6DAC0]/80 leading-relaxed text-[11px]">
              Continuous CT log monitoring and weak RSA key generation detection active.
            </p>
            <Link
              href="/help"
              className="mt-2.5 flex items-center gap-1 text-[#74B3A8] hover:text-[#F6DAC0] font-semibold text-[11px]"
            >
              <span>Learn about CA flaws</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

