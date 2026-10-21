import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Console & Authentication Portal',
  description:
    'Secure supervisory login, role-based access authorization, and zero-trust identity verification for Oil India Limited upstream safety officers and authorized personnel.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
