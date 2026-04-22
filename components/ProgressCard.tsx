import React from 'react';
import { UserProfile } from '@/types';
import { XP_PER_LEVEL } from '@/constants';
import { StarIcon } from './icons/Icons';

interface ProgressCardProps {
  profile: UserProfile;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ profile }) => {
  const progressPercentage = (profile.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="bg-ios-card dark:bg-gray-800 p-3.5 border border-ios-border dark:border-gray-700 shadow-sm rounded-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
             <div className="flex flex-col items-start">
                <p className="text-[8px] font-bold text-ios-muted uppercase tracking-[0.2em] mb-0.5">Level</p>
                <p className="text-2xl font-serif italic text-ios-text dark:text-white leading-none">{profile.level}</p>
             </div>
             
             <div className="flex flex-col justify-center flex-1">
                <div className="flex justify-between items-center mb-1">
                     <p className="text-[8px] font-bold text-ios-muted uppercase tracking-widest">Experience</p>
                     <p className="text-[8px] text-ios-muted font-bold tracking-widest">{profile.xp} / {XP_PER_LEVEL}</p>
                </div>
                <div className="w-full bg-ios-bg dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                    <div
                        className="bg-ios-accent dark:bg-blue-500 h-full transition-all duration-700 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
             </div>
        </div>
        
        <div className="pl-3 ml-3 border-l border-ios-border dark:border-gray-700">
             <div className="flex flex-col items-center">
                 <p className="text-[8px] font-bold text-ios-muted uppercase tracking-[0.2em] mb-0.5">Gold</p>
                 <div className="flex items-center gap-1">
                    <StarIcon className="w-2.5 h-2.5 text-ios-accent dark:text-yellow-400" />
                    <p className="text-base font-serif italic text-ios-text dark:text-white">{profile.gold}</p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};