
import React, { useEffect, useRef, useState } from 'react';
import { AppState, SocialContext, Suggestion, TimeAvailability } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { ProgressCard } from '@/components/ProgressCard';
import { MoodDropdown } from '@/components/MoodDropdown';
import { BookOpenIcon, HeartIcon, LightbulbIcon, LoaderIcon, MapPinIcon, PodcastIcon, YoutubeIcon, SpotifyIcon, ChevronDownIcon, CheckCircleIcon, GamepadIcon, SendIcon } from '@/components/icons/Icons';
import { WeeklySurveyModal } from '@/components/WeeklySurveyModal';
import { ActivityMap } from '@/components/ActivityMap';
import { WelcomeTour } from '@/components/WelcomeTour';
import { PartnerSessionModal } from '@/components/PartnerSessionModal';
import { UpgradeModal } from '@/components/UpgradeModal';

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
    const { userProfile, currentMood, socialContext, currentTimeAvailability, isDateNightMode, inventorySuggestions, externalContentSuggestions, musicSuggestions, localActivitySuggestions, miniGameSuggestions, trendingSuggestions, dailyRefresh, isLoading, isSurveyDue, currentWeeklySurvey, friendInventoryContext, dateNightContext, hasSeenFirstSuggestion } = state;
    const { setMood, setSocialContext, setTimeAvailability, toggleDateNightMode, fetchSuggestions, fetchDailyRefresh, completeDailyRefresh, fetchWeeklySurvey, submitWeeklySurvey, dismissWeeklySurvey, setFriendInventoryContext, setDateNightContext, setHasSeenFirstSuggestion, saveCure, completeSuggestion } = actions;

    const today = new Date().toDateString();
    const isFree = userProfile.subscriptionTier === 'Free';
    const dailyFetchCount = state.dailyFetchCountDate === today ? (state.dailyFetchCount || 0) : 0;
    const isRefreshLimitReached = isFree && dailyFetchCount >= FREE_DAILY_LIMIT;
    const remainingFetches = Math.max(0, FREE_DAILY_LIMIT - dailyFetchCount);

    const todayKey = `dr-${new Date().toDateString()}`;
    const [refreshAnswer, setRefreshAnswer] = useState(() => {
        return localStorage.getItem(`daily_refresh_answer_${todayKey}`) || '';
    });
    const [showRefreshResult, setShowRefreshResult] = useState(() => {
        return localStorage.getItem(`daily_refresh_completed_${todayKey}`) === 'true';
    });
    const [isDailyRefreshOpen, setIsDailyRefreshOpen] = useState(() => {
        return localStorage.getItem(`daily_refresh_completed_${todayKey}`) !== 'true';
    });
    const contextSectionRef = useRef<HTMLDivElement>(null);
    const [isTourActive, setIsTourActive] = useState(false);

    const [isPartnerSessionModalOpen, setIsPartnerSessionModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [activeActionSuggestion, setActiveActionSuggestion] = useState<Suggestion | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [mapCoords, setMapCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [fetchingCoords, setFetchingCoords] = useState(false);

    const handleMapToggle = () => {
        if (!showMap && !mapCoords) {
            setFetchingCoords(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCoords({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setShowMap(true);
                    setFetchingCoords(false);
                },
                (err) => {
                    console.warn("Failed to get geolocation for map, using default coordinates (Mankato, MN)", err);
                    setMapCoords({
                        latitude: 44.1636,
                        longitude: -93.9994
                    });
                    setShowMap(true);
                    setFetchingCoords(false);
                },
                { timeout: 7000 }
            );
        } else {
            setShowMap(!showMap);
        }
    };

    const scrollToContext = () => {
        if (!contextSectionRef.current) return;
        const el = contextSectionRef.current;
        const top = el.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    const prevContextRef = useRef({ currentMood, socialContext, currentTimeAvailability });

    useEffect(() => {
        const key = `dr-${new Date().toDateString()}`;
        const isCompleted = localStorage.getItem(`daily_refresh_completed_${key}`) === 'true';
        
        if (!dailyRefresh) {
            fetchDailyRefresh(currentMood, socialContext, currentTimeAvailability);
        } else if (!isCompleted) {
            const contextChanged = 
                prevContextRef.current.currentMood !== currentMood ||
                prevContextRef.current.socialContext !== socialContext ||
                prevContextRef.current.currentTimeAvailability !== currentTimeAvailability;
            
            if (contextChanged) {
                fetchDailyRefresh(currentMood, socialContext, currentTimeAvailability, true);
            }
        }
        prevContextRef.current = { currentMood, socialContext, currentTimeAvailability };
    }, [currentMood, socialContext, currentTimeAvailability, dailyRefresh, fetchDailyRefresh]);

    useEffect(() => {
        const tourKey = `gozi_tour_completed_${userProfile.username || 'user'}`;
        const completed = localStorage.getItem(tourKey) === 'true';
        if (!completed) {
            setIsTourActive(true);
        }
    }, [userProfile.username]);

    const handleTourComplete = () => {
        const tourKey = `gozi_tour_completed_${userProfile.username || 'user'}`;
        localStorage.setItem(tourKey, 'true');
        setIsTourActive(false);
    };

    useEffect(() => {
        if (currentMood && socialContext && currentTimeAvailability) {
            fetchSuggestions();
        }
    }, [currentMood, socialContext, currentTimeAvailability, isDateNightMode, fetchSuggestions]);

    const prevIsLoadingRef = useRef(isLoading);
    useEffect(() => {
        if (prevIsLoadingRef.current && !isLoading) {
            const hasSuggestions = 
                localActivitySuggestions.length > 0 ||
                miniGameSuggestions.length > 0 ||
                inventorySuggestions.length > 0 ||
                musicSuggestions.length > 0 ||
                externalContentSuggestions.length > 0;
            if (hasSuggestions) {
                setShowMap(false);
            }
        }
        prevIsLoadingRef.current = isLoading;
    }, [isLoading, localActivitySuggestions, miniGameSuggestions, inventorySuggestions, musicSuggestions, externalContentSuggestions]);

    const handleRefreshSubmit = () => {
        setShowRefreshResult(true);
        completeDailyRefresh(refreshAnswer);
        localStorage.setItem(`daily_refresh_completed_${todayKey}`, 'true');
        localStorage.setItem(`daily_refresh_answer_${todayKey}`, refreshAnswer);
        setTimeout(() => {
            setIsDailyRefreshOpen(false);
        }, 3000);
    };

    return (
        <div className="space-y-6 pb-24 animate-fade-in px-1">
            <header className="flex justify-between items-center">
                <div className="flex flex-col">
                    <p className="text-ios-muted text-[8px] font-bold uppercase tracking-[0.2em]">{getGreeting()}</p>
                    <h1 className="text-2xl font-serif italic text-ios-text  leading-tight">{userProfile.username}</h1>
                </div>
                <button
                    onClick={() => actions.setActiveScreen('Profile')}
                    className="w-8 h-8 rounded-full bg-ios-accent/10 border border-ios-accent/20 flex items-center justify-center hover:bg-ios-accent/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-ios-accent"
                    aria-label="Go to Profile"
                >
                    <span className="text-sm">👤</span>
                </button>
            </header>

            {isSurveyDue && (
                <div className="bg-ios-accent  rounded-2xl p-4 text-white shadow-sm flex justify-between items-center">
                    <div>
                        <h3 className="font-serif italic text-xl">Weekly Check-in</h3>
                        <p className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">Reflect on your progress</p>
                    </div>
                    <button onClick={fetchWeeklySurvey} className="bg-white text-ios-accent px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-ios-bg transition-colors">
                        Start
                    </button>
                </div>
            )}


            {isFree && state.suggestionsFetchCount > 0 && hasSeenFirstSuggestion && (
                <div className="bg-[#1A1815] rounded-2xl p-4 text-white shadow-sm flex justify-between items-center mt-4">
                    <div>
                        <h3 className="font-serif italic text-sm">Free Tier</h3>
                        <p className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">{remainingFetches} suggestion refreshes remaining today</p>
                    </div>
                    <button onClick={() => actions.upgradeSubscription('Best')} className="bg-[#4A7B5C] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#3D6A4E] transition-colors">
                        Upgrade
                    </button>
                </div>
            )}

            <ProgressCard profile={userProfile} />

            {dailyRefresh && (
                <div className="bg-ios-card  rounded-2xl overflow-hidden shadow-sm border border-ios-border ">
                    <button 
                        onClick={() => setIsDailyRefreshOpen(!isDailyRefreshOpen)}
                        className="w-full p-6 flex items-center justify-between hover:bg-ios-bg/50 transition-colors"
                    >
                         <div className="flex items-center gap-4">
                            <div className="bg-ios-bg  p-3 rounded-full text-ios-accent ">
                                <LightbulbIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-ios-muted">Daily Refresh</h3>
                                {!isDailyRefreshOpen && <p className="text-lg font-serif italic text-ios-text  line-clamp-1">{dailyRefresh.question}</p>}
                            </div>
                         </div>
                         <ChevronDownIcon className={`w-5 h-5 text-ios-muted transition-transform duration-300 ${isDailyRefreshOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDailyRefreshOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 pt-0 border-t border-ios-border/50  mt-2">
                            <p className="text-xl font-serif italic text-ios-text  my-4">{dailyRefresh.question}</p>
                            {!showRefreshResult ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={refreshAnswer}
                                        onChange={(e) => setRefreshAnswer(e.target.value)}
                                        placeholder="Your answer..."
                                        className="flex-1 bg-ios-bg  border border-ios-border  rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ios-accent text-ios-text "
                                    />
                                    <button
                                        onClick={handleRefreshSubmit}
                                        disabled={!refreshAnswer.trim()}
                                        className="flex-shrink-0 bg-ios-accent hover:bg-black/80 disabled:bg-ios-muted/20 disabled:text-ios-muted text-white w-11 h-11 rounded-xl transition-colors flex items-center justify-center"
                                        aria-label="Submit answer"
                                    >
                                        <SendIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-ios-bg  rounded-xl p-4 border border-ios-border ">
                                    <p className="text-xs uppercase tracking-widest text-ios-muted mb-2">Your answer: <span className="text-ios-text  font-bold">{refreshAnswer}</span></p>
                                    <p className="text-lg font-serif italic text-green-600 ">Correct: {dailyRefresh.answer}</p>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-ios-accent  mt-3 font-bold">+25 XP Claimed</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div ref={contextSectionRef} id="current-context-section" className="space-y-6 scroll-mt-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ios-muted">Current Context</h2>
                
                <MoodDropdown selectedMood={currentMood} onSelectMood={setMood} onOpen={scrollToContext} />

                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={socialContext || ''}
                        onChange={(e) => {
                            const selected = e.target.value;
                            if (selected === SocialContext.WithFamily) {
                                const isPro = userProfile.subscriptionTier === 'Better' || userProfile.subscriptionTier === 'Best';
                                if (!isPro) {
                                    setIsUpgradeModalOpen(true);
                                    return;
                                }
                            }
                            setSocialContext(selected);
                        }}
                        onFocus={scrollToContext}
                        className="bg-ios-card  border border-ios-border  text-ios-text  rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-ios-accent appearance-none shadow-sm"
                    >
                        <option value="" disabled>Social Context</option>
                        {Object.values(SocialContext).map(c => <option key={c} value={c}>{c === SocialContext.WithFamily ? 'With Family 🔒' : c}</option>)}
                        {userProfile.friendUsernames && userProfile.friendUsernames.map(f => (
                            <option key={f} value={f}>With {f}</option>
                        ))}
                    </select>
                    <select
                        value={currentTimeAvailability || ''}
                        onChange={(e) => setTimeAvailability(e.target.value as TimeAvailability)}
                        onFocus={scrollToContext}
                        className="bg-ios-card  border border-ios-border  text-ios-text  rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-ios-accent appearance-none shadow-sm"
                    >
                        <option value="" disabled>Time Available</option>
                        {Object.values(TimeAvailability).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {userProfile.friendUsernames?.includes(socialContext as string) && (
                    <div className="bg-ios-card  border border-ios-border  rounded-2xl p-4 space-y-3 shadow-sm animate-fade-in">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-ios-muted">Location &amp; suggestions mode</p>
                            <h4 className="text-xs font-semibold text-ios-text ">Whose stuff should we suggest activities around?</h4>
                        </div>
                        <div className="flex bg-ios-bg  p-1 rounded-xl gap-1 border border-ios-border/30 ">
                            {[
                                { id: 'my', label: 'At My Place' },
                                { id: 'their', label: `At ${socialContext}'s` },
                                { id: 'both', label: 'Both Combined' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFriendInventoryContext(opt.id as 'my' | 'their' | 'both')}
                                    className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${friendInventoryContext === opt.id ? 'bg-white  text-ios-text  shadow-sm border border-ios-border/30 ' : 'text-ios-muted hover:text-ios-text :text-white'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {socialContext === SocialContext.MyPartner && (
                    <div className="space-y-3">
                         <button 
                            onClick={() => {
                                if (!isDateNightMode) {
                                    setIsPartnerSessionModalOpen(true);
                                } else {
                                    toggleDateNightMode();
                                }
                            }}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all border ${isDateNightMode ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm' : 'bg-ios-card  border-ios-border  text-ios-muted hover:bg-ios-bg'}`}
                         >
                            <HeartIcon className={`w-4 h-4 ${isDateNightMode ? 'fill-pink-600' : ''}`} />
                            {isDateNightMode ? "Date Night Active" : "Plan Date Night"}
                         </button>

                         {isDateNightMode && (
                             <div className="bg-pink-50/50  border border-pink-200/50  rounded-2xl p-4 space-y-3 shadow-sm animate-fade-in">
                                 <div className="flex flex-col gap-0.5">
                                     <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-pink-600/70 ">Date Night Vibe</p>
                                     <h4 className="text-xs font-semibold text-pink-900 ">What kind of date are you feeling?</h4>
                                 </div>
                                 <div className="flex bg-white/50  p-1 rounded-xl gap-1 border border-pink-200/30 ">
                                     {[
                                         { id: 'out', label: 'Go Out' },
                                         { id: 'inventory', label: 'Stay In' },
                                     ].map(opt => (
                                         <button
                                             key={opt.id}
                                             onClick={() => setDateNightContext(opt.id as 'out' | 'inventory')}
                                             className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${(!dateNightContext && opt.id === 'out') || dateNightContext === opt.id ? 'bg-pink-500 text-white shadow-sm' : 'text-pink-600/70 hover:text-pink-800  :text-pink-200'}`}
                                         >
                                             {opt.label}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         )}
                    </div>
                )}
            </div>

            {/* Get Out There / Map View - Always Available */}
            <div className="space-y-4 pt-3 border-t border-ios-border/30 ">
                {inventorySuggestions.length > 0 && (!isDateNightMode || dateNightContext === 'inventory') && (
                    <div className="pb-2">
                        <SuggestionSection 
                            title={isDateNightMode ? "Cozy Date Idea" : "From Your Inventory"}
                            icon={isDateNightMode ? <HeartIcon className="w-4 h-4 text-pink-500" /> : <CheckCircleIcon className="w-4 h-4" />}
                            items={inventorySuggestions}
                            onSave={saveCure}
                            onAction={completeSuggestion}
                            savedCures={state.savedCures}
                            completedSuggestions={state.completedSuggestions || []}
                        />
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 ml-1">
                        <div className="text-ios-accent"><MapPinIcon className="w-4 h-4" /></div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ios-muted">{isDateNightMode ? "Date Night Outing" : "Get Out There"}</h3>
                    </div>
                    <button 
                        id="map-toggle-btn"
                        onClick={handleMapToggle}
                        className="px-3 py-1.5 bg-ios-bg  hover:bg-ios-border :bg-gray-700 border border-ios-border  rounded-xl text-[9px] font-bold uppercase tracking-wider text-ios-text  transition-colors flex items-center gap-1.5"
                        disabled={fetchingCoords}
                    >
                        {fetchingCoords ? (
                            <>
                                <LoaderIcon className="w-2.5 h-2.5 animate-spin text-ios-accent" />
                                Locating...
                            </>
                        ) : showMap ? (
                            <>
                                <MapPinIcon className="w-2.5 h-2.5 text-red-500" />
                                Hide Map
                            </>
                        ) : (
                            <>
                                <MapPinIcon className="w-2.5 h-2.5 text-ios-accent" />
                                Show Map
                            </>
                        )}
                    </button>
                </div>
                
                {showMap && mapCoords && (
                    <ActivityMap latitude={mapCoords.latitude} longitude={mapCoords.longitude} />
                )}
                
                {localActivitySuggestions.length > 0 && (!isDateNightMode || dateNightContext !== 'inventory') && (
                    <div className="grid gap-4">
                        {localActivitySuggestions.map((item, idx) => (
                            <SuggestionCard 
                                key={idx} 
                                suggestion={item} 
                                onSave={saveCure} 
                                onAction={completeSuggestion} 
                                isSaved={state.savedCures?.some(c => c.suggestion?.title === item.title)}
                                isCompleted={state.completedSuggestions?.includes(item.title)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                 <div className="py-20 flex flex-col items-center justify-center text-ios-muted">
                    <LoaderIcon className="w-8 h-8 mb-4 animate-spin text-ios-accent" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Curating your experience</p>
                </div>
            ) : isRefreshLimitReached ? (
                <div className="bg-white border border-[#E4E0D8] rounded-3xl p-6 text-center shadow-sm animate-fade-in">
                    <img src="/gozi-mascot.png" alt="mascot" className="w-16 h-16 mx-auto mb-4 opacity-80 object-cover" />
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
                    
                    {trendingSuggestions && trendingSuggestions.length > 0 && (
                        <SuggestionSection 
                            title="Trending Cures" 
                            icon={<HeartIcon className="w-4 h-4" />}
                            items={trendingSuggestions}
                            onSave={saveCure}
                            onAction={completeSuggestion}
                            savedCures={state.savedCures}
                            completedSuggestions={state.completedSuggestions || []}
                        />
                    )}

                    {miniGameSuggestions.length > 0 && (
                        <SuggestionSection 
                            title="Mindfulness" 
                            icon={<GamepadIcon className="w-4 h-4" />}
                            items={miniGameSuggestions}
                            onSave={saveCure}
                            onAction={completeSuggestion}
                            savedCures={state.savedCures}
                            completedSuggestions={state.completedSuggestions || []}
                        />
                    )}

                    {inventorySuggestions.length > 0 && (!isDateNightMode || dateNightContext === 'inventory') && (
                        <SuggestionSection 
                            title={isDateNightMode ? "Cozy Date Idea" : "From Your Inventory"}
                            icon={isDateNightMode ? <HeartIcon className="w-4 h-4 text-pink-500" /> : <CheckCircleIcon className="w-4 h-4" />}
                            items={inventorySuggestions}
                            onSave={saveCure}
                            onAction={completeSuggestion}
                            savedCures={state.savedCures}
                            completedSuggestions={state.completedSuggestions || []}
                        />
                    )}

                    {musicSuggestions.length > 0 && (
                        <SuggestionSection
                            title="Music for Your Mood"
                            icon={<SpotifyIcon className="w-4 h-4" />}
                            items={musicSuggestions}
                            onSave={saveCure}
                            onAction={completeSuggestion}
                            savedCures={state.savedCures}
                            completedSuggestions={state.completedSuggestions || []}
                        />
                    )}
                    {externalContentSuggestions.length > 0 && (
                        <SuggestionSection 
                            title="Discovery" 
                            icon={<BookOpenIcon className="w-4 h-4" />}
                            items={externalContentSuggestions}
                            onSave={saveCure}
                            onAction={completeSuggestion}
                            savedCures={state.savedCures}
                            completedSuggestions={state.completedSuggestions || []}
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

            {isTourActive && (
                <WelcomeTour 
                    username={userProfile.username || 'there'} 
                    onComplete={handleTourComplete} 
                />
            )}

            <PartnerSessionModal
                isOpen={isPartnerSessionModalOpen}
                partnerUsername={userProfile.partnerUsername || null}
                onClose={() => setIsPartnerSessionModalOpen(false)}
                onStartSolo={() => {
                    toggleDateNightMode();
                    setIsPartnerSessionModalOpen(false);
                }}
            />
            
            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
                onUpgrade={actions.upgradeSubscription} 
                username={userProfile.username} 
            />

            <PostFirstCurePaywall 
                isOpen={state.suggestionsFetchCount === 1 && isFree && !hasSeenFirstSuggestion}
                onDismiss={() => setHasSeenFirstSuggestion(true)}
                onUpgrade={() => {
                    actions.upgradeSubscription('Best');
                    setHasSeenFirstSuggestion(true);
                }}
            />


        </div>
    );
};

const SuggestionSection: React.FC<{ 
    title: string, 
    icon: React.ReactNode, 
    items: Suggestion[], 
    onSave?: (s: Suggestion) => void, 
    onAction?: (s: Suggestion) => void,
    savedCures: SavedCure[],
    completedSuggestions: string[]
}> = ({ title, icon, items, onSave, onAction, savedCures, completedSuggestions }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
            <div className="text-ios-accent">{icon}</div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ios-muted">{title}</h3>
        </div>
        <div className="grid gap-4">
            {items.map((item, idx) => {
                const isSaved = (savedCures || []).some(c => c.suggestion?.title === item.title);
                const isCompleted = (completedSuggestions || []).includes(item.title);
                return (
                    <SuggestionCard 
                        key={idx} 
                        suggestion={item} 
                        onSave={onSave} 
                        onAction={onAction} 
                        isSaved={isSaved}
                        isCompleted={isCompleted}
                    />
                );
            })}
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
                bgClass: 'bg-red-50  hover:bg-red-100 :bg-red-900/30',
                textClass: 'text-red-600 ',
                borderClass: 'border-red-200 ',
            };
        case 'Podcast':
            return {
                label: 'Listen to Podcast',
                icon: <PodcastIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-purple-50  hover:bg-purple-100',
                textClass: 'text-purple-600 ',
                borderClass: 'border-purple-200 ',
            };
        case 'Book':
            return {
                label: 'Find This Book',
                icon: <BookOpenIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-amber-50  hover:bg-amber-100',
                textClass: 'text-amber-700 ',
                borderClass: 'border-amber-200 ',
            };
        case 'Game':
            return {
                label: 'Play Now',
                icon: <GamepadIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-ios-accent/10 hover:bg-ios-accent/20',
                textClass: 'text-ios-accent ',
                borderClass: 'border-ios-accent/30',
            };
        case 'Local':
            return {
                label: 'Get Directions',
                icon: <MapPinIcon className="w-3.5 h-3.5" />,
                bgClass: 'bg-green-50  hover:bg-green-100',
                textClass: 'text-green-700 ',
                borderClass: 'border-green-200 ',
            };
        default:
            return null;
    }
}

const SuggestionCard: React.FC<{ 
    suggestion: Suggestion; 
    onSave?: (s: Suggestion) => void; 
    onAction?: (s: Suggestion) => void;
    isSaved?: boolean;
    isCompleted?: boolean;
}> = ({ suggestion, onSave, onAction, isSaved = false, isCompleted = false }) => {
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

    const getCategoryEmoji = (category: string) => {
        const lower = category.toLowerCase();
        if (lower.includes('health') || lower.includes('fitness')) return '💪';
        if (lower.includes('entertainment') || lower.includes('movie')) return '🍿';
        if (lower.includes('social')) return '🎉';
        if (lower.includes('work') || lower.includes('productiv')) return '💼';
        if (lower.includes('hobby') || lower.includes('craft')) return '🎨';
        if (lower.includes('shop') || lower.includes('errand')) return '🛒';
        if (lower.includes('lifestyle')) return '🌱';
        if (lower.includes('music')) return '🎵';
        if (lower.includes('food') || lower.includes('dining')) return '🍽️';
        if (lower.includes('mindful') || lower.includes('game')) return '🧘';
        return '✨';
    };

    const cardContent = (
        <div className="p-3 bg-ios-card  rounded-2xl border border-ios-border  shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 mt-0.5 bg-ios-bg  rounded-full flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="text-base font-serif italic text-ios-text  leading-tight">{suggestion.title}</h4>
                            <span 
                                className="text-sm bg-ios-bg  px-1.5 py-0.5 rounded-md flex-shrink-0" 
                                title={suggestion.category}
                            >
                                {getCategoryEmoji(suggestion.category)}
                            </span>
                        </div>
                        <p className="text-[11px] text-ios-muted  mt-0.5 leading-snug">{suggestion.description}</p>
                        
                        {hasLink && platform && (
                            <div className="mt-3">
                                <a 
                                    href={suggestion.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${platform.bgClass} ${platform.textClass} ${platform.borderClass}`}
                                >
                                    {platform.icon}
                                    {platform.label}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Action buttons on the right */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0 ml-auto">
                    {onSave && (
                        <button 
                            onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                onSave(suggestion); 
                            }} 
                            className={`p-1.5 rounded-full transition-colors ${
                                isSaved ? 'text-red-500 hover:text-red-650' : 'text-ios-muted hover:text-ios-accent'
                            }`}
                            title={isSaved ? "Saved to Sanctuary" : "Save for later"}
                        >
                            <HeartIcon className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    {onAction && (
                        <button 
                            onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                if (!isCompleted) onAction(suggestion); 
                            }} 
                            className={`p-1.5 rounded-full transition-all border ${
                                isCompleted 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-600 ' 
                                    : 'bg-ios-bg  text-ios-muted border-transparent hover:text-ios-accent hover:border-ios-accent/20 active:scale-95'
                            }`}
                            title={isCompleted ? "Completed" : "Mark as completed"}
                            disabled={isCompleted}
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (hasLink && !onAction && !onSave) {
        return (
            <a href={suggestion.link} target="_blank" rel="noopener noreferrer" className="block">
                {cardContent}
            </a>
        );
    }

    return (
        <div 
            onClick={(e) => {
                if (isCompleted) return;
                if (suggestion.link) {
                    window.open(suggestion.link, '_blank', 'noopener,noreferrer');
                }
            }} 
            className={`transition-opacity duration-300 ${isCompleted ? 'opacity-60' : 'cursor-pointer'}`}
        >
            {cardContent}
        </div>
    );
};

const PostFirstCurePaywall: React.FC<{ isOpen: boolean; onDismiss: () => void; onUpgrade: () => void }> = ({ isOpen, onDismiss, onUpgrade }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white  rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in">
                <button onClick={onDismiss} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 :text-white z-10">
                    ✕
                </button>
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-ios-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✨</span>
                    </div>
                    <h2 className="text-2xl font-serif italic text-gray-900  mb-2">Unlock Your Sanctuary</h2>
                    <p className="text-sm text-gray-500  mb-6">
                        You've discovered your first personalized suggestion! Upgrade to Premium for unlimited daily refreshes, real-time partner syncing, and deeper inventory integration.
                    </p>
                    <div className="space-y-3">
                        <button onClick={onUpgrade} className="w-full py-4 bg-[#1A1815]  text-white #1A1815] font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#2D2A26] :bg-gray-100 transition-all">
                            Start Free Trial
                        </button>
                        <button onClick={onDismiss} className="w-full py-4 bg-transparent text-gray-500 font-bold text-[10px] uppercase tracking-[0.25em] hover:text-gray-900 :text-white transition-all">
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
