import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-white text-gray-900 border border-emerald-200',
    error: 'bg-white text-gray-900 border border-red-200',
    info: 'bg-white text-gray-900 border border-blue-200',
  };

  const iconWrapStyles = {
    success: 'bg-emerald-100 text-emerald-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    info: <AlertCircle className="w-6 h-6" />,
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div className={`${styles[type]} w-full max-w-[460px] px-5 py-4 rounded-2xl shadow-[0_20px_45px_rgba(15,23,42,0.22)] flex items-center gap-3 pointer-events-auto`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconWrapStyles[type]}`}>
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-6">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1 transition-colors pointer-events-auto"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
