import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-4 p-4 rounded-2xl shadow-2xl bg-white border min-w-[320px] animate-in slide-in-from-right-full duration-500",
              toast.type === 'success' ? "border-emerald-100" :
              toast.type === 'error' ? "border-rose-100" :
              "border-accent-soft"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-xl",
              toast.type === 'success' ? "bg-emerald-50 text-emerald-600" :
              toast.type === 'error' ? "bg-rose-50 text-rose-600" :
              "bg-accent-soft text-accent"
            )}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> :
               toast.type === 'error' ? <AlertCircle size={20} /> :
               <Info size={20} />}
            </div>
            <p className="flex-1 font-bold text-sm text-slate-900">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
