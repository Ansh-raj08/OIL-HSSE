'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Runtime Deployment Configuration Guard
// Displays a full-page diagnostic screen listing missing/invalid
// public variable NAMES (never values) instead of "service unavailable".
// ============================================================

import React from 'react';
import { getPublicEnvStatus } from '@/config/env';
import { FULL_VERSION_STRING } from '@/config/version';
import { AlertTriangle, Wrench } from 'lucide-react';

export default function DeploymentConfigGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = getPublicEnvStatus();

  if (status.isValid) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl rounded-2xl border border-rose-500/30 bg-[#0E1424] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 bg-rose-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              This deployment is misconfigured
            </h1>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Required public environment variables are missing or invalid in this build.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
              Variables Requiring Attention
            </h2>
            <ul className="space-y-2.5" aria-label="Missing or invalid environment variables">
              {status.allIssues.map((issue) => (
                <li
                  key={issue.name}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                >
                  <div>
                    <code className="font-mono text-xs sm:text-sm font-semibold text-amber-300">
                      {issue.name}
                    </code>
                    <p className="text-xs text-neutral-400 mt-1">{issue.description}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {issue.reason === 'missing' ? 'Missing' : 'Invalid'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-neutral-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>How to resolve on Vercel</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-neutral-400 leading-relaxed">
              <li>
                Open your Vercel frontend project &rarr; <strong className="text-neutral-200">Settings</strong> &rarr;{' '}
                <strong className="text-neutral-200">Environment Variables</strong>.
              </li>
              <li>
                Add the variable names listed above for <strong className="text-neutral-200">Production</strong> and{' '}
                <strong className="text-neutral-200">Preview</strong> (use <code className="font-mono text-neutral-200">https://</code> URLs in production).
              </li>
              <li>
                Open <strong className="text-neutral-200">Deployments</strong> &rarr; <strong className="text-neutral-200">Redeploy</strong> with the build cache turned <strong className="text-neutral-200">off</strong>.
              </li>
            </ol>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-500">
            <span>Reference: deployment_misconfigured</span>
            <span>{FULL_VERSION_STRING}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
