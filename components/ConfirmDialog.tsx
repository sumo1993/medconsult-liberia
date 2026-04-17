'use client';

import { useState } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  requireText?: string;
  requireTextLabel?: string;
  loadingText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  requireText,
  requireTextLabel = 'Type to confirm',
  loadingText = 'Processing...',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [confirmInput, setConfirmInput] = useState('');

  if (!open) return null;
  const needsTypedConfirm = !!requireText;
  const typedConfirmReady = !needsTypedConfirm || confirmInput.trim() === requireText;
  const confirmDisabled = loading || !typedConfirmReady;

  const handleCancel = () => {
    setConfirmInput('');
    onCancel();
  };

  const handleConfirm = () => {
    if (!typedConfirmReady || loading) return;
    setConfirmInput('');
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {needsTypedConfirm && (
          <label className="mt-4 grid gap-1">
            <span className="text-xs font-medium text-gray-700">
              {requireTextLabel}: <span className="font-semibold">{requireText}</span>
            </span>
            <input
              type="text"
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={`Type ${requireText}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
