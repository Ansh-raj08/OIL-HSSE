import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Apple-Inspired Interactive Button Component (SIH26165)
// ============================================================

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'pill'
  | 'outline'
  | 'ghost'
  | 'destructive'
  // Backwards compatibility mappings:
  | 'gold'
  | 'ghost-border'
  | 'critical'
  | 'safe'
  | 'amber';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0066CC] hover:bg-[#0077ED] text-white font-medium border border-transparent shadow-xs active:scale-[0.99]',
  secondary:
    'bg-app-surface hover:bg-app-hover text-app-primary border border-app-subtle font-medium active:scale-[0.99]',
  pill:
    'bg-[#0066CC] hover:bg-[#0077ED] text-white font-medium rounded-full px-5 py-2 shadow-xs active:scale-[0.99]',
  outline:
    'bg-transparent hover:bg-app-hover text-app-primary border border-app-strong font-medium',
  ghost:
    'bg-transparent hover:bg-app-hover text-app-secondary hover:text-app-primary border border-transparent',
  destructive:
    'bg-rose-600 hover:bg-rose-700 text-white font-medium border border-transparent shadow-xs',

  // Backwards-compatible mappings to clean Apple palette:
  gold:
    'bg-[#0066CC] hover:bg-[#0077ED] text-white font-medium border border-transparent shadow-xs active:scale-[0.99]',
  'ghost-border':
    'bg-app-surface hover:bg-app-hover text-app-primary border border-app-subtle font-medium',
  critical:
    'bg-rose-600 hover:bg-rose-700 text-white font-medium border border-transparent shadow-xs',
  safe:
    'bg-emerald-600 hover:bg-emerald-700 text-white font-medium border border-transparent shadow-xs',
  amber:
    'bg-amber-600 hover:bg-amber-700 text-white font-medium border border-transparent shadow-xs',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[32px] gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl min-h-[40px] gap-2',
  lg: 'px-6 py-2.5 text-base rounded-xl min-h-[48px] gap-2.5',
  icon: 'w-9 h-9 p-0 rounded-xl justify-center items-center',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.secondary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
