import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dataset Ingestion & Quality Governance Registry',
  description:
    'Operational CSV incident dataset management, OISD-105 schema verification, checksum validation, and ML model registry for Upper Assam basin installations.',
};

export default function DatasetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
