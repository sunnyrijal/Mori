import React from 'react';
import { XIcon } from './icons/Icons';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-ios-card  shadow-2xl w-full max-w-sm p-8 relative border border-ios-border  rounded-[2rem] animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-ios-muted hover:text-ios-text transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="text-center space-y-3">
            <h2 className="text-2xl font-serif italic text-ios-text  leading-tight">{title}</h2>
            <p className="text-xs text-ios-muted leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col gap-2 mt-8">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 bg-red-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-600 transition-all rounded-2xl shadow-lg shadow-red-500/20"
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-ios-bg  text-ios-muted text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-ios-border :bg-gray-700 transition-all rounded-2xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};