'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Shared Accessible Modal Dialog Primitive
// Portal to document.body, focus trap & return, scroll lock with
// scrollbar compensation, ESC dismiss, and responsive sheet sizing.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  ariaLabelledBy?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  hideCloseButton?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  ariaLabelledBy,
  children,
  className,
  contentClassName,
  maxWidth = 'sm:max-w-[440px]',
  hideCloseButton = false,
}: DialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Focus preservation and restoration
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  // Focus trap inside modal
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent background scrolling while modal is open (with scrollbar compensation)
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [open]);

  if (!open || !isMounted) return null;

  const titleId = ariaLabelledBy || (title ? 'shared-dialog-title' : undefined);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop Click Dismiss */}
      <div
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full bg-app-surface text-app-primary border-t sm:border border-app-subtle',
          'rounded-t-[22px] sm:rounded-[20px] shadow-2xl flex flex-col',
          'max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden',
          'animate-dialog-open outline-none',
          maxWidth,
          className
        )}
      >
        {/* Optional Header */}
        {(title || !hideCloseButton) && (
          <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between border-b border-app-subtle">
            <div>
              {title && (
                <h2 id={titleId} className="text-base font-semibold tracking-tight text-app-primary font-sans">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-app-secondary mt-0.5 font-sans">
                  {description}
                </p>
              )}
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-app-muted hover:text-app-primary hover:bg-app-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:focus-visible:ring-[#2997FF]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div className={cn('flex-1 min-h-0 overflow-y-auto overscroll-contain p-6', contentClassName)}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Dialog;
