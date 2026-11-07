'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  useEffect(() => {
    // Poll unread alerts count
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/v1/alerts');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count ?? 0);
        }
      } catch {
        // fallback
      }
    };
    fetchUnread();
  }, []);

  return (
    <div className="min-h-screen bg-[#182b34] text-[#213843] flex">
      {/* Fixed Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadAlertsCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="px-6 py-6 border-t border-[#2d4a57] text-center text-xs text-[#F6DAC0]/60">
          <p>
            Trustify Platform · AI-Powered Web Threat Detection & Digital Trust Intelligence
          </p>
          <p className="mt-1 text-[11px] text-[#74B3A8]/80">
            Passive Non-Intrusive Security Assessment · Zero Exploits · Certificate Transparency Forensics
          </p>
        </footer>
      </div>
    </div>
  );
};

