
import React, { useState, useMemo } from 'react';
import { AppState, InventoryItem, InventoryCategory, InterestLevel } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { PlusCircleIcon, Trash2Icon, EditIcon, SearchIcon, LoaderIcon, LockIcon, GlobeIcon } from '@/components/icons/Icons';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { BulkInventoryModal } from '@/components/BulkInventoryModal';
import { EditInventoryItemModal } from '@/components/EditInventoryItemModal';

const getItemEmoji = (item: InventoryItem): string => {
    const name = item.name.toLowerCase();
    
    // Exact or keyword matching
    if (name.includes('soccer') || name.includes('football') || name.includes('ball')) return '⚽';
    if (name.includes('yoga') || name.includes('mat') || name.includes('meditat') || name.includes('stretch')) return '🧘';
    if (name.includes('cook') || name.includes('pan') || name.includes('pot') || name.includes('chef') || name.includes('baking') || name.includes('kitchen') || name.includes('knife')) return '🍳';
    if (name.includes('coffee') || name.includes('espresso') || name.includes('cappuccino') || name.includes('latte')) return '☕';
    if (name.includes('tea') || name.includes('matcha')) return '🍵';
    if (name.includes('wine') || name.includes('grape')) return '🍷';
    if (name.includes('beer') || name.includes('brew')) return '🍺';
    if (name.includes('cocktail') || name.includes('drink')) return '🍹';
    if (name.includes('book') || name.includes('read') || name.includes('novel') || name.includes('library')) return '📖';
    if (name.includes('game') || name.includes('nintendo') || name.includes('switch') || name.includes('xbox') || name.includes('playstation') || name.includes('ps5') || name.includes('controller') || name.includes('gaming')) return '🎮';
    if (name.includes('paint') || name.includes('art') || name.includes('canvas') || name.includes('drawing') || name.includes('sketch') || name.includes('craft')) return '🎨';
    if (name.includes('guitar') || name.includes('music') || name.includes('piano') || name.includes('song') || name.includes('instrument')) return '🎸';
    if (name.includes('headphone') || name.includes('earbud') || name.includes('podcast')) return '🎧';
    if (name.includes('laptop') || name.includes('computer') || name.includes('keyboard') || name.includes('coding') || name.includes('code')) return '💻';
    if (name.includes('run') || name.includes('shoe') || name.includes('sneaker') || name.includes('jog')) return '👟';
    if (name.includes('bike') || name.includes('bicycle') || name.includes('cycling')) return '🚲';
    if (name.includes('gym') || name.includes('dumbbell') || name.includes('weight') || name.includes('workout') || name.includes('exercise')) return '🏋️';
    if (name.includes('hike') || name.includes('hiking') || name.includes('backpack') || name.includes('trail')) return '🎒';
    if (name.includes('camp') || name.includes('tent') || name.includes('outdoors')) return '⛺';
    if (name.includes('plant') || name.includes('garden') || name.includes('flower') || name.includes('tree') || name.includes('potting')) return '🌱';
    if (name.includes('board game') || name.includes('chess') || name.includes('card') || name.includes('monopoly') || name.includes('dice')) return '🎲';
    if (name.includes('camera') || name.includes('photo') || name.includes('shoot') || name.includes('video')) return '📷';
    if (name.includes('movie') || name.includes('cinema') || name.includes('tv') || name.includes('film') || name.includes('netflix')) return '🍿';
    if (name.includes('ticket') || name.includes('concert') || name.includes('theater') || name.includes('show')) return '🎟️';
    if (name.includes('swim') || name.includes('pool') || name.includes('beach')) return '🏊';
    if (name.includes('basketball')) return '🏀';
    if (name.includes('tennis')) return '🎾';
    if (name.includes('golf')) return '⛳';
    if (name.includes('badminton')) return '🏸';
    if (name.includes('surf')) return '🏄';
    
    // Category-based fallback
    switch (item.category) {
        case InventoryCategory.FoodAndCooking:
            return '🍳';
        case InventoryCategory.Beverages:
            return '☕';
        case InventoryCategory.HobbiesAndCrafts:
            return '🎨';
        case InventoryCategory.Entertainment:
            return '🍿';
        case InventoryCategory.HealthAndFitness:
            return '💪';
        case InventoryCategory.WorkAndProductivity:
            return '💼';
        case InventoryCategory.SocialActivities:
            return '🎉';
        case InventoryCategory.ShoppingAndErrands:
            return '🛍️';
        default:
            return '📦';
    }
};

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
                <div className="flex gap-2">
                    <button 
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${selectedCategory === 'All' ? 'bg-ios-accent text-white' : 'bg-ios-card dark:bg-gray-800 text-ios-muted border border-ios-border dark:border-gray-700'}`}
                    >
                        All
                    </button>
                    {Object.values(InventoryCategory).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-ios-accent text-white' : 'bg-ios-card dark:bg-gray-800 text-ios-muted border border-ios-border dark:border-gray-700'}`}
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
                        <div key={item.id} className="bg-ios-card dark:bg-gray-800 p-4 rounded-2xl border border-ios-border dark:border-gray-700 shadow-sm flex gap-4 items-center group transition-all hover:shadow-md">
                            <div className="w-14 h-14 bg-ios-bg dark:bg-gray-900 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                {getItemEmoji(item)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-base font-serif italic text-ios-text dark:text-white leading-tight truncate">{item.name}</h3>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${interestColor[item.interest]}`}>
                                        {item.interest}
                                    </span>
                                    {item.shareWithFriends === false && (
                                        <span className="text-[8px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                            <LockIcon className="w-2.5 h-2.5" />
                                            Private
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-ios-muted dark:text-gray-400 line-clamp-2 leading-snug mb-1">{item.description}</p>
                                <p className="text-[8px] text-ios-accent dark:text-blue-400 font-bold uppercase tracking-[0.1em]">{item.category}</p>
                            </div>
                            <div className="flex flex-col gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button 
                                    onClick={() => actions.updateInventoryItem({ ...item, shareWithFriends: item.shareWithFriends === false })}
                                    className={`p-1.5 rounded-full transition-colors ${item.shareWithFriends === false ? 'bg-red-50 dark:bg-red-900/30 text-red-500 hover:text-red-600' : 'bg-ios-bg dark:bg-gray-700 text-ios-muted hover:text-ios-accent'}`}
                                    title={item.shareWithFriends === false ? "Private (click to share)" : "Shared with friends (click to make private)"}
                                >
                                    {item.shareWithFriends === false ? <LockIcon className="w-3.5 h-3.5" /> : <GlobeIcon className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => setEditingItem(item)} className="p-1.5 bg-ios-bg dark:bg-gray-700 rounded-full text-ios-muted hover:text-ios-accent transition-colors">
                                    <EditIcon className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setItemToDelete(item)} className="p-1.5 bg-ios-bg dark:bg-gray-700 rounded-full text-ios-muted hover:text-red-600 transition-colors">
                                    <Trash2Icon className="w-3.5 h-3.5" />
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
