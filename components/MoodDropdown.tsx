import React, { useState } from 'react';
import { Mood } from '@/types';
import { MOODS } from '@/constants';

interface MoodDropdownProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
  onOpen?: () => void;
}

export const MoodDropdown: React.FC<MoodDropdownProps> = ({ selectedMood, onSelectMood, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!isOpen && onOpen) onOpen();
    setIsOpen(!isOpen);
  };

  const handleSelect = (mood: Mood) => {
    onSelectMood(mood);
    setIsOpen(false);
  };

  const selectedMoodData = MOODS.find(m => m.name === selectedMood);

  return (
    <div className="relative w-full">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between bg-ios-card  border border-ios-border  p-3 text-left focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-2xl text-ios-text  shadow-sm transition-all"
      >
        {selectedMoodData ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedMoodData.icon}</span>
            <span className="text-base font-serif italic text-ios-text ">{selectedMoodData.name}</span>
          </div>
        ) : (
          <span className="text-ios-muted  text-xs">How are you feeling?</span>
        )}
        <svg className={`w-4 h-4 text-ios-muted transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full bg-ios-card  border border-ios-border  shadow-xl max-h-64 overflow-y-auto rounded-2xl animate-fade-in">
          {MOODS.map(mood => (
            <div
              key={mood.name}
              onClick={() => handleSelect(mood.name)}
              className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-ios-bg :bg-gray-700 text-ios-text  transition-colors border-b border-ios-border/30 last:border-0"
            >
              <span className="text-xl">{mood.icon}</span>
              <span className="text-base font-serif italic">{mood.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};