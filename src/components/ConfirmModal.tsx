import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="modern-card w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            variant === 'danger' ? "bg-rose-50 text-rose-500" : 
            variant === 'warning' ? "bg-amber-50 text-amber-500" : 
            "bg-accent-soft text-accent"
          )}>
            <AlertTriangle size={20} />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">{message}</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "w-full py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm",
              variant === 'danger' ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20" :
              variant === 'warning' ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20" :
              "bg-accent text-white hover:bg-accent/90 shadow-accent/20"
            )}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary w-full py-2.5 text-sm"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
