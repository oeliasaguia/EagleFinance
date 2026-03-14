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
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-card bg-white w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
            variant === 'danger' ? "bg-rose-50 text-rose-500" : 
            variant === 'warning' ? "bg-amber-50 text-amber-500" : 
            "bg-blue-50 text-blue-500"
          )}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-dark transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-brand-dark">{title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "w-full py-3 rounded-xl font-bold transition-all shadow-lg",
              variant === 'danger' ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20" :
              variant === 'warning' ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20" :
              "bg-brand-dark text-white hover:bg-brand-dark/90 shadow-brand-dark/20"
            )}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
