'use client';

import { AlertTriangle, LogOut } from 'lucide-react';

export type BrowserStyleConfirmDialogProps = {
  open: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Short heading above the message (toast-style). */
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` = red primary action (e.g. delete). `default` = emerald (e.g. sign out). */
  variant?: 'default' | 'danger';
  /** When variant is default, show a sign-out style icon instead of a generic mark. */
  intent?: 'default' | 'logout';
  overlayClassName?: string;
};

export default function BrowserStyleConfirmDialog({
  open,
  message,
  onCancel,
  onConfirm,
  title = 'Please confirm',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  variant = 'default',
  intent = 'default',
  overlayClassName,
}: BrowserStyleConfirmDialogProps) {
  if (!open) return null;

  const isDanger = variant === 'danger';
  const iconWrap = isDanger
    ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
    : intent === 'logout'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80';

  const confirmClasses = isDanger
    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/45 p-4 pb-[max(5.75rem,env(safe-area-inset-bottom,0px)+5rem)] backdrop-blur-sm sm:items-center sm:pb-4 ${overlayClassName ?? ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Dismiss"
        onClick={onCancel}
      />
      <div
        className="relative z-10 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/[0.04] sm:rounded-2xl">
          <div className="flex gap-4 p-5 sm:p-6">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}
              aria-hidden
            >
              {isDanger ? (
                <AlertTriangle className="h-6 w-6" strokeWidth={2} />
              ) : intent === 'logout' ? (
                <LogOut className="h-6 w-6" strokeWidth={2} />
              ) : (
                <AlertTriangle className="h-6 w-6 opacity-70" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="confirm-dialog-title" className="text-base font-semibold leading-tight text-gray-900">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{message}</p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/90 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto sm:px-5 sm:py-2.5"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm sm:w-auto sm:px-5 sm:py-2.5 ${confirmClasses}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
