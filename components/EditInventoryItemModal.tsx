import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryCategory, InterestLevel } from '@/types';
import { XIcon } from './icons/Icons';

interface EditInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  item: InventoryItem | null;
}

export const EditInventoryItemModal: React.FC<EditInventoryItemModalProps> = ({ isOpen, onClose, onSave, item }) => {
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(item);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  if (!isOpen || !editedItem) return null;

  const handleSave = () => {
    if (editedItem) {
      onSave(editedItem);
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-ios-card dark:bg-gray-900 shadow-2xl w-full max-w-lg p-8 relative border border-ios-border dark:border-gray-800 rounded-[2rem] animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-ios-muted hover:text-ios-text transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-serif italic text-ios-text dark:text-white leading-tight">Edit Item</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ios-muted">Refine your sanctuary</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-ios-muted ml-1">Name</label>
            <input
              type="text"
              name="name"
              value={editedItem.name}
              onChange={handleChange}
              className="w-full bg-ios-bg dark:bg-gray-800 border border-ios-border dark:border-gray-700 p-3.5 rounded-2xl text-sm text-ios-text dark:text-white placeholder-ios-muted/50 focus:outline-none focus:ring-1 focus:ring-ios-accent transition-all shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-ios-muted ml-1">Description</label>
            <textarea
              name="description"
              value={editedItem.description}
              onChange={handleChange}
              rows={2}
              className="w-full bg-ios-bg dark:bg-gray-800 border border-ios-border dark:border-gray-700 p-3.5 rounded-2xl text-sm text-ios-text dark:text-white placeholder-ios-muted/50 focus:outline-none focus:ring-1 focus:ring-ios-accent transition-all resize-none shadow-inner"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-ios-muted ml-1">Category</label>
                <select 
                    name="category" 
                    value={editedItem.category} 
                    onChange={handleChange} 
                    className="w-full bg-ios-bg dark:bg-gray-800 border border-ios-border dark:border-gray-700 p-3.5 rounded-2xl text-sm text-ios-text dark:text-white focus:outline-none focus:ring-1 focus:ring-ios-accent transition-all shadow-inner appearance-none"
                >
                {Object.values(InventoryCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-ios-muted ml-1">Interest</label>
                <select 
                    name="interest" 
                    value={editedItem.interest} 
                    onChange={handleChange} 
                    className="w-full bg-ios-bg dark:bg-gray-800 border border-ios-border dark:border-gray-700 p-3.5 rounded-2xl text-sm text-ios-text dark:text-white focus:outline-none focus:ring-1 focus:ring-ios-accent transition-all shadow-inner appearance-none"
                >
                {Object.values(InterestLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-ios-bg dark:bg-gray-800 border border-ios-border dark:border-gray-700 rounded-2xl mt-2">
            <span className="text-sm font-medium text-ios-text dark:text-white">Share with Friends & Partner</span>
            <button
              type="button"
              onClick={() => setEditedItem(prev => prev ? { ...prev, shareWithFriends: prev.shareWithFriends === false ? true : false } : null)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${editedItem.shareWithFriends !== false ? 'bg-ios-accent' : 'bg-ios-muted/30'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${editedItem.shareWithFriends !== false ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-8">
          <button 
            onClick={handleSave} 
            className="w-full py-4 bg-ios-accent text-white font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all rounded-2xl shadow-lg shadow-ios-accent/20"
          >
            Save Changes
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