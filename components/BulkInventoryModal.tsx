import React, { useState } from 'react';
import { XIcon, LoaderIcon } from './icons/Icons';

interface BulkInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  isLoading: boolean;
}

export const BulkInventoryModal: React.FC<BulkInventoryModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if(text.trim()){
      onConfirm(text);
      setText('');
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-ios-card dark:bg-gray-900 shadow-2xl w-full max-w-lg p-8 relative border border-ios-border dark:border-gray-800 rounded-[2rem] animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-ios-muted hover:text-ios-text transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="space-y-3 mb-6">
            <h2 className="text-2xl font-serif italic text-ios-text dark:text-white leading-tight">Bulk Import</h2>
            <p className="text-xs text-ios-muted leading-relaxed">
              Enter a list of items, hobbies, or subscriptions. Our AI will automatically categorize them for you.
            </p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full bg-ios-bg dark:bg-gray-800 border border-ios-border dark:border-gray-700 p-4 focus:outline-none focus:ring-1 focus:ring-ios-accent text-ios-text dark:text-white rounded-2xl resize-none text-sm placeholder-ios-muted/50 shadow-inner"
          placeholder="e.g. Netflix, running shoes, a book about dragons, my dog, coffee subscription..."
        />
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={handleConfirm}
            disabled={isLoading || !text.trim()}
            className="w-full py-4 bg-ios-accent text-white font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all rounded-2xl shadow-lg shadow-ios-accent/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : null}
            Process Items
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-ios-bg dark:bg-gray-800 text-ios-muted font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-ios-border dark:hover:bg-gray-700 transition-all rounded-2xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};