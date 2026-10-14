import React from 'react';
import { SavedCure, Suggestion } from '@/types';
import { HeartIcon, BookOpenIcon, PodcastIcon, YoutubeIcon, SpotifyIcon, MapPinIcon, CheckCircleIcon, GamepadIcon, TrashIcon } from '@/components/icons/Icons';

type SavedCuresListProps = {
    cures: SavedCure[];
    onArchive: (id: string) => void;
};

export const SavedCuresList: React.FC<SavedCuresListProps> = ({ cures, onArchive }) => {
    const activeCures = cures.filter(c => !c.isArchived);

    if (activeCures.length === 0) {
        return (
            <div className="text-center py-8">
                <HeartIcon className="w-8 h-8 text-ios-muted mx-auto mb-3 opacity-50" />
                <p className="text-sm text-ios-muted font-serif italic">No saved cures yet.</p>
                <p className="text-[10px] text-ios-muted/70 mt-1 uppercase tracking-widest">Save suggestions you love</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activeCures.map(cure => (
                <SavedCureCard key={cure.id} cure={cure} onArchive={() => onArchive(cure.id)} />
            ))}
        </div>
    );
};

const SavedCureCard: React.FC<{ cure: any; onArchive: () => void }> = ({ cure, onArchive }) => {
    const suggestion = cure.suggestion || cure;

    const getIcon = () => {
        switch(suggestion.icon) {
            case 'Podcast': return <PodcastIcon className="w-4 h-4 text-purple-500" />;
            case 'Book': return <BookOpenIcon className="w-4 h-4 text-amber-600" />;
            case 'YouTube': return <YoutubeIcon className="w-4 h-4 text-red-500" />;
            case 'Local': return <MapPinIcon className="w-4 h-4 text-green-600" />;
            case 'Spotify': return <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />;
            case 'DateNight': return <HeartIcon className="w-4 h-4 text-pink-500" />;
            case 'Game': return <GamepadIcon className="w-4 h-4 text-ios-accent" />;
            default: return <CheckCircleIcon className="w-4 h-4 text-ios-accent" />;
        }
    };

    const cardContent = (
        <div className="p-4 bg-ios-card  rounded-2xl border border-ios-border  shadow-sm hover:shadow-md transition-all duration-300 group relative">
            <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 bg-ios-bg  rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="text-lg font-serif italic text-ios-text  group-hover:text-ios-accent transition-colors leading-tight">{suggestion.title}</h4>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-ios-muted bg-ios-bg  px-2 py-1 rounded-md flex-shrink-0">{suggestion.category}</span>
                    </div>
                    <p className="text-xs text-ios-muted  mt-1 leading-relaxed">{suggestion.description}</p>
                    <p className="text-[9px] text-ios-muted/60 mt-3 uppercase tracking-wider">
                        Saved {cure.savedAt ? new Date(cure.savedAt).toLocaleDateString() : 'Recently'}
                    </p>
                </div>
            </div>
            <button 
                onClick={(e) => { e.preventDefault(); onArchive(); }} 
                className="absolute top-4 right-4 text-ios-muted hover:text-red-500 transition-colors"
                title="Archive"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );

    if (suggestion.link) {
        return (
            <a href={suggestion.link} target="_blank" rel="noopener noreferrer" className="block">
                {cardContent}
            </a>
        );
    }

    return <div>{cardContent}</div>;
};
