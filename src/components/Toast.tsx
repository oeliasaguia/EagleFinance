import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';
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
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border min-w-[300px] animate-in slide-in-from-right-full duration-300",
              toast.type === 'success' ? "bg-white border-emerald-100 text-emerald-600" :
              toast.type === 'error' ? "bg-white border-rose-100 text-rose-600" :
              "bg-white border-blue-100 text-blue-600"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl",
              toast.type === 'success' ? "bg-emerald-50" :
              toast.type === 'error' ? "bg-rose-50" :
              "bg-blue-50"
            )}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> :
               toast.type === 'error' ? <AlertCircle size={20} /> :
               <AlertCircle size={20} />}
            </div>
            <p className="flex-1 font-bold text-sm">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
