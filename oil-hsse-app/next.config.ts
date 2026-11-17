import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { assertValidProductionEnv } from './src/config/env';

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertValidProductionEnv({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    });
  }

  return {
    async redirects() {
      return [
        {
          source: '/getstared',
          destination: '/',
          permanent: false, // 307 Temporary Redirect
        },
        {
          source: '/getstarted',
          destination: '/',
          permanent: false, // 307 Temporary Redirect
        },
      ];
    },
  };
}
