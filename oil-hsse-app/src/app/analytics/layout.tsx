import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operational Analytics & SIF Trend Center',
  description:
    'Macro-level risk telemetry, India incident geospatial distribution, IOGP Life-Saving Rules violation rankings, and supervisory review velocities for OIL installations.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
