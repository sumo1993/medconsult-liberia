'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun size={20} className="text-yellow-400" />
      )}
    </button>
  );
}

// Compact version for mobile
export function ThemeToggleCompact() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <Moon size={18} className="text-gray-700 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={18} className="text-yellow-400" />
          <span className="text-sm text-gray-300">Light Mode</span>
        </>
      )}
    </button>
  );
}
