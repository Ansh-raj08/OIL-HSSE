import type { Metadata } from 'next';
import './globals.css';
import { SafetyProvider } from '@/context/SafetyContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TimeFormatProvider } from '@/context/TimeFormatContext';
import { ToastProvider } from '@/context/ToastContext';
import PerformanceTelemetry from '@/components/PerformanceTelemetry';

export const metadata: Metadata = {
  title: {
    default: 'OIL INDIA LIMITED | SIF-Precursor AI Decision-Support Platform',
    template: '%s | OIL HSSE Enterprise',
  },
  description:
    'Enterprise HSSE Supervisory Intelligence Dashboard for Oil India Limited Upstream Directorate. AI/NLP detection of Serious Injury & Fatality (SIF) Precursors, deterministic risk scoring, Explainable AI triggers, and Human-in-the-Loop triage validation.',
  keywords: [
    'Oil India Limited',
    'OIL HSSE',
    'SIF Precursors',
    'Upstream E&P',
    'Smart India Hackathon 2026',
    'SIH26165',
    'THΞ ΛRPΛNΞT',
    'Explainable AI',
    'Life-Saving Rules',
    'IOGP',
    'OISD',
    'DGMS',
  ],
  authors: [{ name: 'THΞ ΛRPΛNΞT' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // 1. Theme initialization (storage -> OS preference -> dark default)
                var storedTheme = localStorage.getItem('oil_hsse_theme');
                var isDark;
                if (storedTheme === 'dark' || storedTheme === 'light') {
                  isDark = storedTheme === 'dark';
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  isDark = true;
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                  isDark = false;
                } else {
                  isDark = true;
                }

                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }

                // 2. Sidebar width initialization before first paint (avoids layout jump)
                var storedCollapsed = localStorage.getItem('oil_sidebar_collapsed');
                var storedWidth = localStorage.getItem('oil_sidebar_width');
                if (storedCollapsed === 'true') {
                  document.documentElement.style.setProperty('--sidebar-w', '68px');
                } else if (storedWidth) {
                  var parsedW = parseInt(storedWidth, 10);
                  if (!isNaN(parsedW) && parsedW >= 180 && parsedW <= 400) {
                    document.documentElement.style.setProperty('--sidebar-w', parsedW + 'px');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-app-page text-app-primary antialiased selection:bg-[#0066CC]/20 selection:text-[#0066CC] dark:selection:text-[#2997FF] overflow-x-clip">
        <AuthProvider>
          <ThemeProvider>
            <TimeFormatProvider>
              <ToastProvider>
                <SafetyProvider>
                  <PerformanceTelemetry />
                  {children}
                </SafetyProvider>
              </ToastProvider>
            </TimeFormatProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
