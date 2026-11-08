'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchAlertsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/alerts');
      if (res.ok) {
        const data = await res.json();
        const total = data.total ?? (Array.isArray(data.items) ? data.items.length : 0);
        const unread = data.unread_count ?? 0;
        setAlertsCount(total);
        setUnreadCount(unread);
      }
    } catch {
      // fallback
    }
  }, []);

  // Refresh alert count when route changes
  useEffect(() => {
    fetchAlertsCount();
  }, [pathname, fetchAlertsCount]);

  // Refresh alert count on custom event and polling
  useEffect(() => {
    const handleUpdate = () => {
      fetchAlertsCount();
    };

    window.addEventListener('trustify_alerts_updated', handleUpdate);
    const interval = setInterval(fetchAlertsCount, 3000);

    return () => {
      window.removeEventListener('trustify_alerts_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchAlertsCount]);

  return (
    <div className="min-h-screen bg-[#182b34] text-[#213843] flex">
      {/* Fixed Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertsCount={alertsCount}
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

