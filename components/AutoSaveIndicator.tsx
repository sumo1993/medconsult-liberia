'use client';

import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export default function AutoSaveIndicator({ isSaving, lastSaved, error }: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600 text-sm">
        <CloudOff size={16} />
        <span>Save failed: {error}</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center space-x-2 text-blue-600 text-sm">
        <Loader2 size={16} className="animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-2 text-emerald-600 text-sm">
        <Check size={16} />
        <span>Saved {formatTime(lastSaved)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-400 text-sm">
      <Cloud size={16} />
      <span>Auto-save enabled</span>
    </div>
  );
}
