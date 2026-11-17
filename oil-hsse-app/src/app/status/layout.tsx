import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status & Deployment Diagnostics',
  description: 'Admin-only deployment health diagnostics for Supabase, API backend, and environment configuration.',
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
