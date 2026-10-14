import React, { useState } from 'react';
import { XIcon, LoaderIcon } from './icons/Icons';

interface HobbyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hobby: string, details: string) => void;
  hobby: string;
  isLoading: boolean;
}

const hobbyPrompts: Record<string, string> = {
    reading: "What are some of your favorite books or genres? e.g., 'The Lord of the Rings, sci-fi, mystery novels'",
    cooking: "What are some dishes you enjoy cooking? e.g., 'Pasta carbonara, chicken stir-fry, baking sourdough'",
    gaming: "What specific games do you play? e.g., 'Elden Ring, Baldur's Gate 3, Stardew Valley'",
    movies: "What kind of movies or directors do you like? e.g., 'Christopher Nolan films, classic horror, animated movies'",
    music: "Who are some of your favorite artists or genres? e.g., 'Taylor Swift, classic rock, indie pop'",
    exercise: "What kind of exercises do you do? e.g., 'Running, yoga, weightlifting, cycling'",
};

export const HobbyDetailModal: React.FC<HobbyDetailModalProps> = ({ isOpen, onClose, onConfirm, hobby, isLoading }) => {
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (details.trim()) {
      onConfirm(hobby, details);
    }
  };

  const placeholder = hobbyPrompts[hobby.toLowerCase()] || "e.g., specific items, artists, games, etc.";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-ios-card  shadow-2xl w-full max-w-lg p-8 relative border border-ios-border  rounded-[2rem] animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-ios-muted hover:text-ios-text transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="space-y-3 mb-6">
            <h2 className="text-2xl font-serif italic text-ios-text  leading-tight">Tell us more about "{hobby}"</h2>
            <p className="text-xs text-ios-muted leading-relaxed">
              Providing more details helps us give you much better suggestions.
            </p>
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="w-full bg-ios-bg  border border-ios-border  p-4 focus:outline-none focus:ring-1 focus:ring-ios-accent text-ios-text  rounded-2xl resize-none text-sm placeholder-ios-muted/50 shadow-inner"
          placeholder={placeholder}
        />
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={handleConfirm}
            disabled={isLoading || !details.trim()}
            className="w-full py-4 bg-ios-accent text-white font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all rounded-2xl shadow-lg shadow-ios-accent/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : null}
            Add Details
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-ios-bg  text-ios-muted font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-ios-border :bg-gray-700 transition-all rounded-2xl"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};