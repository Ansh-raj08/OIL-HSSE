import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety Rules & Governance Reference (IOGP 459 / OISD-105)',
  description:
    'Complete statutory and regulatory reference for the 9 IOGP Report 459 Life-Saving Rules, 4-tier Upstream Hierarchy of Controls, and contextual negation-aware NLP logic engine.',
};

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
