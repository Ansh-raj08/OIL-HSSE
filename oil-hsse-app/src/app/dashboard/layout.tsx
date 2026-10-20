import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIF Priority Triage Stream & Surveillance Register',
  description:
    'Real-time deterministic SIF precursor risk intelligence, IOGP Life-Saving Rules violation tracking, and human-in-the-loop triage stream for Oil India Limited upstream operations.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
