'use client';

import { useEffect, useState } from 'react';

export type BrowserStyleConfirmDialogProps = {
  open: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Shown in small header line, e.g. "example.com says" */
  originLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** e.g. "md:hidden" for mobile-only dialogs */
  /** Tailwind classes for the overlay root (e.g. z-index, responsive visibility). */
  overlayClassName?: string;
};

export default function BrowserStyleConfirmDialog({
  open,
  message,
  onCancel,
  onConfirm,
  originLabel,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  overlayClassName,
}: BrowserStyleConfirmDialogProps) {
  const [host, setHost] = useState('medconsultliberia.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.hostname || 'medconsultliberia.com');
    }
  }, []);

  if (!open) return null;

  const origin = originLabel ?? `${host} says`;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm ${overlayClassName ?? 'z-[100]'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="browser-style-confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Dismiss"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-[#3d2620] bg-[#2a1814] shadow-2xl">
        <div className="px-4 pb-2 pt-4">
          <p className="text-xs leading-snug text-white/90">{origin}</p>
          <p id="browser-style-confirm-title" className="mt-3 text-[15px] leading-snug text-white">
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-[#5c322a] px-5 py-2 text-sm font-medium text-white hover:bg-[#6e3d33]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#f0c4b2] px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-[#ffd4c4]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
