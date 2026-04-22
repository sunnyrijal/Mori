
import React, { useState, useMemo } from 'react';
import { AppState, InventoryItem, InventoryCategory, InterestLevel } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { PlusCircleIcon, Trash2Icon, EditIcon, SearchIcon, LoaderIcon } from '@/components/icons/Icons';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { BulkInventoryModal } from '@/components/BulkInventoryModal';
import { EditInventoryItemModal } from '@/components/EditInventoryItemModal';

type JourneyScreenProps = {
    state: AppState;
    actions: ReturnType<typeof useAppStore>['actions'];
}

export const JourneyScreen: React.FC<JourneyScreenProps> = ({ state, actions }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'All'>('All');
    const [isBulkAddOpen, setBulkAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const filteredInventory = useMemo(() => {
        return state.inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [state.inventory, searchQuery, selectedCategory]);

    const interestColor = {
        [InterestLevel.High]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        [InterestLevel.Medium]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        [InterestLevel.Low]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
        <div className="space-y-6 pb-24 min-h-screen animate-fade-in px-1">
            <header className="flex flex-col gap-0.5">
                <p className="text-ios-muted text-[9px] font-bold uppercase tracking-[0.2em]">Collection</p>
                <h1 className="text-3xl font-serif italic text-ios-text dark:text-white leading-tight">My Inventory</h1>
                <p className="text-xs text-ios-muted dark:text-gray-400">Curate your items for better suggestions.</p>
            </header>

            {/* Search & Actions */}
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-4 w-4 h-4 text-ios-muted" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search collection..." 
                        className="w-full pl-12 pr-4 py-4 bg-ios-card dark:bg-gray-800 border border-ios-border dark:border-gray-700 rounded-2xl text-ios-text dark:text-white focus:ring-1 focus:ring-ios-accent outline-none shadow-sm transition-all"
                    />
                </div>
                <button 
                    onClick={() => setBulkAddOpen(true)}
                    className="w-full py-4 bg-ios-accent hover:bg-black/80 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-sm transition-all"
                >
                    <PlusCircleIcon className="w-4 h-4" />
                    Add Items
                </button>
            </div>

            {/* Filter Chips */}
            <div className="overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-3">
                    <button 
                        onClick={() => setSelectedCategory('All')}
                        className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-ios-accent text-white' : 'bg-ios-card dark:bg-gray-800 text-ios-muted border border-ios-border dark:border-gray-700'}`}
                    >
                        All
                    </button>
                    {Object.values(InventoryCategory).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-ios-accent text-white' : 'bg-ios-card dark:bg-gray-800 text-ios-muted border border-ios-border dark:border-gray-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory List */}
            <div className="grid gap-4">
                {state.isLoading && state.inventory.length === 0 ? (
                    <div className="text-center py-20">
                        <LoaderIcon className="w-8 h-8 text-ios-accent mx-auto animate-spin" />
                        <p className="text-ios-muted text-[10px] uppercase tracking-widest mt-4">Loading collection</p>
                    </div>
                ) : filteredInventory.length > 0 ? (
                    filteredInventory.map(item => (
                        <div key={item.id} className="bg-ios-card dark:bg-gray-800 p-6 rounded-2xl border border-ios-border dark:border-gray-700 shadow-sm flex justify-between items-start group transition-all hover:shadow-md">
                            <div className="flex-1 pr-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-serif italic text-ios-text dark:text-white leading-tight">{item.name}</h3>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest font-bold ${interestColor[item.interest]}`}>
                                        {item.interest}
                                    </span>
                                </div>
                                <p className="text-sm text-ios-muted dark:text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                                <p className="text-[10px] text-ios-accent dark:text-blue-400 mt-3 font-bold uppercase tracking-widest">{item.category}</p>
                            </div>
                            <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingItem(item)} className="p-2 bg-ios-bg dark:bg-gray-700 rounded-full text-ios-muted hover:text-ios-accent transition-colors">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => setItemToDelete(item)} className="p-2 bg-ios-bg dark:bg-gray-700 rounded-full text-ios-muted hover:text-red-600 transition-colors">
                                    <Trash2Icon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-ios-card dark:bg-gray-800 rounded-2xl border border-dashed border-ios-border dark:border-gray-700">
                        <p className="text-ios-muted text-xs uppercase tracking-widest">No items found</p>
                        <button onClick={() => setBulkAddOpen(true)} className="text-ios-accent dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest mt-4 hover:underline">Add some items</button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <BulkInventoryModal 
                isOpen={isBulkAddOpen} 
                onClose={() => setBulkAddOpen(false)} 
                onConfirm={actions.processBulkInventory} 
                isLoading={state.isLoading} 
            />
            <EditInventoryItemModal 
                isOpen={!!editingItem} 
                onClose={() => setEditingItem(null)} 
                onSave={actions.updateInventoryItem} 
                item={editingItem} 
            />
            <ConfirmationDialog 
                isOpen={!!itemToDelete} 
                onClose={() => setItemToDelete(null)} 
                onConfirm={() => { if(itemToDelete) actions.deleteInventoryItem(itemToDelete.id); setItemToDelete(null); }} 
                title="Delete Item" 
                message={`Are you sure you want to delete "${itemToDelete?.name}" from your inventory?`} 
                confirmText="Delete"
            />
        </div>
    );
};
