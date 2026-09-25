import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  statusCode?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 backdrop-blur-md ${
                isSuccess
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                  : isError
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                  : 'bg-zinc-900/90 border-zinc-700/60 text-zinc-100'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{toast.title}</span>
                  {toast.statusCode && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                        toast.statusCode < 300
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : toast.statusCode < 500
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {toast.statusCode}
                    </span>
                  )}
                </div>
                {toast.description && (
                  <p className="text-xs opacity-80 mt-1 break-words">{toast.description}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
