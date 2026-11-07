import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Trustify — AI-Powered Web Threat Detection & Digital Trust Intelligence',
  description:
    'An intelligent platform that detects phishing and malicious websites by fusing threat analysis, web security assessment, certificate validation, and collaborative threat intelligence into an explainable trust score.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
