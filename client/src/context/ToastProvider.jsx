import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container floating at bottom right */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
        aria-label="Notification alerts"
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200',
            error: 'bg-rose-950/95 border-rose-500/60 text-rose-200',
            warning: 'bg-amber-950/95 border-amber-500/60 text-amber-200',
            info: 'bg-blue-950/95 border-blue-500/60 text-blue-200',
          }[toast.type] || 'bg-slate-900/95 border-slate-700 text-slate-200';

          const icon = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
          }[toast.type] || 'ℹ';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in ${typeStyles}`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <span className="text-base select-none" aria-hidden="true">{icon}</span>
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs opacity-70 hover:opacity-100 px-1 py-0.5 rounded transition-opacity cursor-pointer"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
