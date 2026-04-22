
import React, { useEffect, useRef, useState } from 'react';
import { AppState, SocialContext, Suggestion, TimeAvailability } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { ProgressCard } from '@/components/ProgressCard';
import { MoodDropdown } from '@/components/MoodDropdown';
import { BookOpenIcon, HeartIcon, LightbulbIcon, LoaderIcon, MapPinIcon, PodcastIcon, YoutubeIcon, SpotifyIcon, ChevronDownIcon, CheckCircleIcon, GamepadIcon } from '@/components/icons/Icons';
import { WeeklySurveyModal } from '@/components/WeeklySurveyModal';

type TodayScreenProps = {
    state: AppState;
    actions: ReturnType<typeof useAppStore>['actions'];
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const FREE_DAILY_LIMIT = 3;

export const TodayScreen: React.FC<TodayScreenProps> = ({ state, actions }) => {
    const { userProfile, currentMood, socialContext, currentTimeAvailability, isDateNightMode, inventorySuggestions, externalContentSuggestions, musicSuggestions, localActivitySuggestions, miniGameSuggestions, dailyRefresh, isLoading, isSurveyDue, currentWeeklySurvey } = state;
    const { setMood, setSocialContext, setTimeAvailability, toggleDateNightMode, fetchSuggestions, fetchDailyRefresh, completeDailyRefresh, fetchWeeklySurvey, submitWeeklySurvey, dismissWeeklySurvey } = actions;

    const today = new Date().toDateString();
    const isFree = userProfile.subscriptionTier === 'Free';
    const dailyFetchCount = state.dailyFetchCountDate === today ? (state.dailyFetchCount || 0) : 0;
    const isRefreshLimitReached = isFree && dailyFetchCount >= FREE_DAILY_LIMIT;

    const [refreshAnswer, setRefreshAnswer] = useState('');
    const [showRefreshResult, setShowRefreshResult] = useState(false);
    const [isDailyRefreshOpen, setIsDailyRefreshOpen] = useState(true);
    const contextSectionRef = useRef<HTMLDivElement>(null);

    const scrollToContext = () => {
        if (!contextSectionRef.current) return;
        const el = contextSectionRef.current;
        const top = el.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    useEffect(() => {
        if (!dailyRefresh) fetchDailyRefresh();
    }, [dailyRefresh, fetchDailyRefresh]);

    useEffect(() => {
        if (currentMood && socialContext && currentTimeAvailability) {
            fetchSuggestions();
        }
    }, [currentMood, socialContext, currentTimeAvailability, isDateNightMode, fetchSuggestions]);

    const handleRefreshSubmit = () => {
        setShowRefreshResult(true);
        completeDailyRefresh();
    };

    return (
        <div className="space-y-6 pb-24 animate-fade-in px-1">
            <header className="flex justify-between items-center">
                <div className="flex flex-col">
                    <p className="text-ios-muted text-[8px] font-bold uppercase tracking-[0.2em]">{getGreeting()}</p>
                    <h1 className="text-2xl font-serif italic text-ios-text dark:text-white leading-tight">{userProfile.username}</h1>
                </div>
                <div className="w-8 h-8 rounded-full bg-ios-accent/10 border border-ios-accent/20 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                </div>
            </header>

            {isSurveyDue && !isFree && (
                <div className="bg-ios-accent dark:bg-blue-700 rounded-2xl p-4 text-white shadow-sm flex justify-between items-center">
                    <div>
                        <h3 className="font-serif italic text-xl">Weekly Check-in</h3>
                        <p className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">Reflect on your progress</p>
                    </div>
                    <button onClick={fetchWeeklySurvey} className="bg-white text-ios-accent px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-ios-bg transition-colors">
                        Start
                    </button>
                </div>
            )}

            <ProgressCard profile={userProfile} />

            {dailyRefresh && (
                <div className="bg-ios-card dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-ios-border dark:border-gray-700">
                    <button 
                        onClick={() => setIsDailyRefreshOpen(!isDailyRefreshOpen)}
                        className="w-full p-6 flex items-center justify-between hover:bg-ios-bg/50 transition-colors"
                    >
                         <div className="flex items-center gap-4">
                            <div className="bg-ios-bg dark:bg-gray-700 p-3 rounded-full text-ios-accent dark:text-yellow-400">
                                <LightbulbIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-ios-muted">Daily Refresh</h3>
                                {!isDailyRefreshOpen && <p className="text-lg font-serif italic text-ios-text dark:text-white line-clamp-1">{dailyRefresh.question}</p>}
                            </div>
                         </div>
                         <ChevronDownIcon className={`w-5 h-5 text-ios-muted transition-transform duration-300 ${isDailyRefreshOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDailyRefreshOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 pt-0 border-t border-ios-border/50 dark:border-gray-700 mt-2">
                            <p className="text-xl font-serif italic text-ios-text dark:text-gray-300 my-4">{dailyRefresh.question}</p>
                            {!showRefreshResult ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={refreshAnswer}
                                        onChange={(e) => setRefreshAnswer(e.target.value)}
                                        placeholder="Your answer..."
                                        className="flex-1 bg-ios-bg dark:bg-gray-900 border border-ios-border dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ios-accent text-ios-text dark:text-white"
                                    />
                                    <button
                                        onClick={handleRefreshSubmit}
                                        disabled={!refreshAnswer.trim()}
                                        className="bg-ios-accent hover:bg-black/80 disabled:bg-ios-muted/20 disabled:text-ios-muted text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Submit
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-ios-bg dark:bg-gray-900 rounded-xl p-4 border border-ios-border dark:border-gray-700">
                                    <p className="text-xs uppercase tracking-widest text-ios-muted mb-2">Your answer: <span className="text-ios-text dark:text-white font-bold">{refreshAnswer}</span></p>
                                    <p className="text-lg font-serif italic text-green-600 dark:text-green-400">Correct: {dailyRefresh.answer}</p>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-ios-accent dark:text-blue-400 mt-3 font-bold">+25 XP Claimed</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div ref={contextSectionRef} className="space-y-6 scroll-mt-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ios-muted">Current Context</h2>
                
                <MoodDropdown selectedMood={currentMood} onSelectMood={setMood} onOpen={scrollToContext} />

                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={socialContext || ''}
                        onChange={(e) => setSocialContext(e.target.value as SocialContext)}
                        onFocus={scrollToContext}
                        className="bg-ios-card dark:bg-gray-800 border border-ios-border dark:border-gray-700 text-ios-text dark:text-white rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-ios-accent appearance-none shadow-sm"
                    >
                        <option value="" disabled>Social Context</option>
                        {Object.values(SocialContext).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        value={currentTimeAvailability || ''}
                        onChange={(e) => setTimeAvailability(e.target.value as TimeAvailability)}
                        onFocus={scrollToContext}
                        className="bg-ios-card dark:bg-gray-800 border border-ios-border dark:border-gray-700 text-ios-text dark:text-white rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-ios-accent appearance-none shadow-sm"
                    >
                        <option value="" disabled>Time Available</option>
                        {Object.values(TimeAvailability).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                
                {socialContext === SocialContext.MyPartner && (
                     <button 
                        onClick={toggleDateNightMode}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all border ${isDateNightMode ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm' : 'bg-ios-card dark:bg-gray-800 border-ios-border dark:border-gray-700 text-ios-muted hover:bg-ios-bg'}`}
                     >
                        <HeartIcon className={`w-4 h-4 ${isDateNightMode ? 'fill-pink-600' : ''}`} />
                        {isDateNightMode ? "Date Night Active" : "Plan Date Night"}
                     </button>
                )}
            </div>

            {isLoading ? (
                 <div className="py-20 flex flex-col items-center justify-center text-ios-muted">
                    <LoaderIcon className="w-8 h-8 mb-4 animate-spin text-ios-accent" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Curating your experience</p>
                </div>
            ) : isRefreshLimitReached ? (
                <div className="bg-white border border-[#E4E0D8] rounded-3xl p-6 text-center shadow-sm animate-fade-in">
                    <img src="/logo.svg" alt="mascot" className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <h3 className="text-lg font-serif italic text-[#1A1815] mb-1">You've used your 3 free refreshes today</h3>
                    <p className="text-xs text-[#8A8580] mb-5 leading-relaxed">Upgrade to Premium for unlimited daily suggestions, mood-matched music picks, local activity discovery, and more.</p>
                    <button
                        onClick={() => actions.setActiveScreen('Profile')}
                        className="w-full bg-[#1A1815] text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-black/80 transition-colors"
                    >
                        Upgrade to Premium →
                    </button>
                    <p className="text-[9px] text-[#8A8580] mt-3">Resets at midnight · Free refreshes: {dailyFetchCount}/{FREE_DAILY_LIMIT} used</p>
                </div>
            ) : (currentMood && socialContext && currentTimeAvailability) ? (
                <div className="space-y-12 animate-slide-up">
                    
                    {miniGameSuggestions.length > 0 && (
                        <SuggestionSection 
                            title="Mindfulness" 
                            icon={<GamepadIcon className="w-4 h-4" />}
                            items={miniGameSuggestions}
                        />
                    )}

                    {inventorySuggestions.length > 0 && (
                        <SuggestionSection 
                            title="From Your Inventory" 
                            icon={<CheckCircleIcon className="w-4 h-4" />}
                            items={inventorySuggestions}
                        />
                    )}

                    {musicSuggestions.length > 0 && (
                        <SuggestionSection
                            title="Music for Your Mood"
                            icon={<SpotifyIcon className="w-4 h-4" />}
                            items={musicSuggestions}
                        />
                    )}
                    
                    {externalContentSuggestions.length > 0 && (
                        <SuggestionSection 
                            title="Discovery" 
                            icon={<BookOpenIcon className="w-4 h-4" />}
                            items={externalContentSuggestions}
                        />
                    )}

                    {localActivitySuggestions.length > 0 && (
                        <SuggestionSection 
                            title="Get Out There" 
                            icon={<MapPinIcon className="w-4 h-4" />}
                            items={localActivitySuggestions}
                        />
                    )}
                </div>
            ) : (
                <div className="py-20 text-center border border-dashed border-ios-border rounded-2xl">
                    <p className="text-ios-muted text-xs uppercase tracking-widest">Set your context to see suggestions</p>
                </div>
            )}

            <WeeklySurveyModal 
                isOpen={!!currentWeeklySurvey} 
                onClose={dismissWeeklySurvey} 
                onSubmit={submitWeeklySurvey} 
                survey={currentWeeklySurvey} 
                isLoading={isLoading} 
            />
        </div>
    );
};

const SuggestionSection: React.FC<{ title: string, icon: React.ReactNode, items: Suggestion[] }> = ({ title, icon, items }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
            <div className="text-ios-accent">{icon}</div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ios-muted">{title}</h3>
        </div>
        <div className="grid gap-4">
            {items.map((item, idx) => (
                <SuggestionCard key={idx} suggestion={item} />
            ))}
        </div>
    </div>
);

type PlatformConfig = {
    label: string;
    icon: React.ReactNode;
    bgClass: string;
    textClass: string;
    borderClass: string;
};

function getPlatformConfig(icon: Suggestion['icon']): PlatformConfig | null {
    switch (icon) {
        case 'Spotify':
            return {
                label: 'Open in Spotify',
                icon: <SpotifyIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-[#1DB954]/10 hover:bg-[#1DB954]/20',
                textClass: 'text-[#1DB954]',
                borderClass: 'border-[#1DB954]/30',
            };
        case 'YouTube':
            return {
                label: 'Watch on YouTube',
                icon: <YoutubeIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
                textClass: 'text-red-600 dark:text-red-400',
                borderClass: 'border-red-200 dark:border-red-800',
            };
        case 'Podcast':
            return {
                label: 'Listen to Podcast',
                icon: <PodcastIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100',
                textClass: 'text-purple-600 dark:text-purple-400',
                borderClass: 'border-purple-200 dark:border-purple-800',
            };
        case 'Book':
            return {
                label: 'Find This Book',
                icon: <BookOpenIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100',
                textClass: 'text-amber-700 dark:text-amber-400',
                borderClass: 'border-amber-200 dark:border-amber-800',
            };
        case 'Game':
            return {
                label: 'Play Now',
                icon: <GamepadIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-ios-accent/10 hover:bg-ios-accent/20',
                textClass: 'text-ios-accent dark:text-blue-400',
                borderClass: 'border-ios-accent/30',
            };
        case 'Local':
            return {
                label: 'Get Directions',
                icon: <MapPinIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100',
                textClass: 'text-green-700 dark:text-green-400',
                borderClass: 'border-green-200 dark:border-green-800',
            };
        default:
            return null;
    }
}

const SuggestionCard: React.FC<{ suggestion: Suggestion }> = ({ suggestion }) => {
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

    const platform = getPlatformConfig(suggestion.icon);
    const hasLink = !!suggestion.link;

    const cardContent = (
        <div className="p-4 bg-ios-card dark:bg-gray-800 rounded-2xl border border-ios-border dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 bg-ios-bg dark:bg-gray-900 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="text-lg font-serif italic text-ios-text dark:text-white group-hover:text-ios-accent transition-colors leading-tight">{suggestion.title}</h4>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-ios-muted bg-ios-bg dark:bg-gray-700 px-2 py-1 rounded-md flex-shrink-0">{suggestion.category}</span>
                    </div>
                    <p className="text-xs text-ios-muted dark:text-gray-400 mt-1 leading-relaxed">{suggestion.description}</p>
                    
                    {hasLink && platform && (
                        <div className="mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${platform.bgClass} ${platform.textClass} ${platform.borderClass}`}>
                                {platform.icon}
                                {platform.label}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (hasLink) {
        return (
            <a href={suggestion.link} target="_blank" rel="noopener noreferrer" className="block">
                {cardContent}
            </a>
        );
    }

    return <div>{cardContent}</div>;
};
