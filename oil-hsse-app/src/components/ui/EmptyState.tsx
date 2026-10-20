'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Shared EmptyState Component (Prompt v2.2 - Item 1)
// Clean industrial empty state using Lucide SVG icons (zero emoji)
// ============================================================

import React from 'react';
import { LucideIcon, Inbox, UploadCloud } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={`w-full min-h-[160px] flex-1 flex flex-col items-center justify-center p-4 text-center rounded-xl border border-dashed border-app-subtle bg-app-elevated/40 ${className}`}
      >
        <div className="w-8 h-8 rounded-full bg-app-surface border border-app-subtle flex items-center justify-center text-app-muted mb-2">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-sans font-semibold text-app-primary">{title}</p>
        {description && (
          <p className="text-[11px] font-sans text-app-muted mt-0.5 max-w-xs">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-app-subtle bg-app-surface/60 backdrop-blur-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-app-elevated border border-app-subtle flex items-center justify-center text-amber-600 dark:text-[#D4AF37] mb-3 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-sans font-semibold text-app-primary tracking-wide">{title}</h3>

      {description && (
        <p className="text-xs font-sans text-app-muted mt-1 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] dark:bg-[#0071E3] active:scale-95 transition-all shadow-xs cursor-pointer font-sans"
        >
          {action.icon ? (
            <action.icon className="w-4 h-4" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
