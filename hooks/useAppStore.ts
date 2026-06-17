import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Habit, Mood, SocialContext, InventoryItem, ChatMessage, OnboardingData, WeeklySurvey, TimeAvailability, LifeCompanionData, RelationshipStatus, ProactiveSuggestionType, UserPreferences } from '@/types';
import { geminiService } from '@/services/geminiService';
import { INITIAL_APP_STATE, XP_REWARDS, XP_PER_LEVEL, ACHIEVEMENTS } from '@/constants';
import { supabase } from '@/services/supabaseClient';

const GENERIC_HOBBIES = ["reading", "cooking", "gaming", "movies", "music", "exercise"];

export const useAppStore = () => {
    const [data, setData] = useState<LifeCompanionData>({ currentUser: null, users: {} });
    const [state, setState] = useState<AppState>(INITIAL_APP_STATE);

    const audioRef = useRef<{
        inputAudioContext: AudioContext | null,
        outputAudioContext: AudioContext | null,
        micStream: MediaStream | null,
        scriptProcessor: ScriptProcessorNode | null,
        sources: Set<AudioBufferSourceNode>,
        nextStartTime: number,
    }>({
        inputAudioContext: null,
        outputAudioContext: null,
        micStream: null,
        scriptProcessor: null,
        sources: new Set(),
        nextStartTime: 0,
    }).current;

    useEffect(() => {
        const init = async () => {
            const sessionResult = await supabase.auth.getSession().catch((e: any) => {
                console.error("useAppStore init: getSession error", e);
                return null;
            });
            const session = sessionResult?.data?.session;
            if (!session?.user) return;
            const uid = session.user.id;

            // 1. Migration
            const localData = localStorage.getItem('lifeCompanionData');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    const oldUsername = parsed.currentUser || session.user.email;
                    const oldState = parsed.users[oldUsername];
                    
                    if (oldState) {
                         if (oldState.inventory?.length > 0) {
                             const mapped = oldState.inventory.map((i: any) => ({
                                 user_id: uid,
                                 name: i.name,
                                 category: i.category,
                                 confidence: i.confidence?.toString(),
                                 interest: i.interest,
                                 description: i.description
                             }));
                             for (const item of mapped) {
                                 await supabase.from('inventory_items').insert(item);
                             }
                         }
                         await supabase.from('preferences').upsert({
                             id: uid,
                             user_id: uid,
                             living_situation: oldState.userProfile.livingSituation,
                             partner_username: oldState.userProfile.partnerUsername,
                             hobbies: oldState.hobbies || []
                         });
                    }
                    localStorage.removeItem('lifeCompanionData');
                } catch (e) {
                   console.error("Migration failed", e);
                }
            }

            // 2. Load
            const { data: invData } = await supabase.from('inventory_items').select('*').eq('user_id', uid);
            const { data: prefData } = await supabase.from('preferences').select('*').eq('user_id', uid).maybeSingle();
            const { data: profileDataResult } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
            
            let profileData = profileDataResult;
            const userEmail = session.user.email;
            const userName = session.user.user_metadata?.full_name || session.user.email;
            
            if (!profileData) {
                const newProfile = {
                    id: uid,
                    name: userName,
                    email: userEmail,
                    subscription_tier: 'Free',
                    last_survey_date: null,
                    created_at: new Date().toISOString()
                };
                await supabase.from('profiles').insert(newProfile);
                profileData = newProfile;
            } else if (!profileData.name || !profileData.email) {
                await supabase.from('profiles').update({
                    name: userName,
                    email: userEmail
                }).eq('id', uid);
                profileData = { ...profileData, name: userName, email: userEmail };
            }

            const { data: refsData } = await supabase.from('weekly_reflections').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(8);
            const { data: chatData } = await supabase.from('chat_messages').select('*').eq('user_id', uid).order('timestamp', { ascending: true });

            const lastSurveyDate = profileData?.last_survey_date ? new Date(profileData.last_survey_date) : null;
            const createdAt = profileData?.created_at ? new Date(profileData.created_at) : new Date();
            let surveyDue = false;
            const subTier = profileData?.subscription_tier || 'Free';

            const referenceDate = lastSurveyDate || createdAt;
            const days = (new Date().getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
            if (days > 7) {
                surveyDue = true;
            }

            const localFriends = localStorage.getItem(`gozi_friends_${uid}`);
            const friendUsernames = localFriends ? JSON.parse(localFriends) : [];

            // Load friends states
            const allUsersObj: Record<string, AppState> = {};
            try {
                const { data: users } = await supabase.from('profiles').select('*');
                for (const fname of friendUsernames) {
                    const foundUser = users?.find((u: any) => u.name === fname || u.email === fname);
                    if (foundUser) {
                        const fuid = foundUser.id;
                        const { data: invData } = await supabase.from('inventory_items').select('*').eq('user_id', fuid);
                        const { data: prefData } = await supabase.from('preferences').select('*').eq('user_id', fuid).maybeSingle();
                        const publicInvData = invData?.filter((i: any) => i.share_with_friends !== false && i.shareWithFriends !== false) || [];
                        allUsersObj[fuid] = {
                            ...INITIAL_APP_STATE,
                            userProfile: {
                                ...INITIAL_APP_STATE.userProfile,
                                username: foundUser.name || foundUser.email,
                                isLoggedIn: true,
                                onboardingCompleted: true,
                                subscriptionTier: foundUser.subscription_tier || 'Free',
                                livingSituation: prefData?.living_situation || null,
                                partnerUsername: prefData?.partner_username || null,
                            },
                            hobbies: prefData?.hobbies || [],
                            inventory: publicInvData.map((i: any) => ({
                                id: i.id,
                                name: i.name,
                                category: i.category,
                                confidence: Number(i.confidence) || 1,
                                interest: i.interest,
                                description: i.description,
                                shareWithFriends: i.share_with_friends ?? i.shareWithFriends ?? true
                            }))
                        };
                    }
                }
            } catch (e) {
                console.error("Failed to load friend states during init", e);
            }

            const loadedState: AppState = {
                ...INITIAL_APP_STATE,
                isSurveyDue: surveyDue,
                weeklyReflections: refsData || [],
                chatHistory: chatData && chatData.length > 0 ? chatData.map((m: any) => ({
                    id: m.id,
                    sender: m.sender as 'user' | 'ai',
                    text: m.text,
                    timestamp: m.timestamp,
                    suggestions: m.suggestions || [],
                    proactiveSuggestion: m.proactive_suggestion || undefined
                })) : [{
                    id: 'intro',
                    sender: 'ai',
                    text: `Hey ${session.user.user_metadata?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'there'}, I am Gozi your personal assistant, tell me how you are feeling and based on that I will suggest you activities based on what you have.`,
                    timestamp: new Date().toISOString()
                }],
                userProfile: {
                    ...INITIAL_APP_STATE.userProfile,
                    username: session.user.user_metadata.full_name || session.user.email,
                    isLoggedIn: true,
                    onboardingCompleted: !!prefData || (invData && invData.length > 0),
                    subscriptionTier: subTier as any,
                    lastSurveyDate: profileData?.last_survey_date || null,
                    createdAt: profileData?.created_at || null,
                    livingSituation: prefData?.living_situation || null,
                    partnerUsername: prefData?.partner_username || null,
                    friendUsernames: friendUsernames,
                    preferences: {
                        ...INITIAL_APP_STATE.userProfile.preferences,
                        energyDefaults: prefData?.energy_defaults || undefined,
                    }
                },
                hobbies: prefData?.hobbies || [],
                inventory: invData?.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    category: i.category,
                    confidence: Number(i.confidence) || 1,
                    interest: i.interest,
                    description: i.description,
                    shareWithFriends: i.share_with_friends ?? i.shareWithFriends ?? true
                })) || []
            };
            
            setState(loadedState);
            setData(prev => ({ currentUser: uid, users: { ...prev.users, ...allUsersObj, [uid]: loadedState } }));
        };
        init();
    }, []);

    useEffect(() => {
        const currentUser = data.currentUser;
        if(currentUser && data.users[currentUser]){
            setState(data.users[currentUser]);
        } else {
            setState(INITIAL_APP_STATE);
        }
    }, [data]);
    
    // Core state updater that also syncs preferences automatically to Supabase
    const updateCurrentUserState = (updater: (prevState: AppState) => AppState) => {
        setData(prevData => {
            const currentUser = prevData.currentUser;
            if (!currentUser) return prevData;

            const oldState = prevData.users[currentUser] || INITIAL_APP_STATE;
            const newState = updater(oldState);
            
            // Auto-sync preferences if they changed
            const hobbiesChanged = JSON.stringify(newState.hobbies) !== JSON.stringify(oldState.hobbies);
            const prefsChanged = newState.userProfile.livingSituation !== oldState.userProfile.livingSituation || 
                                 newState.userProfile.partnerUsername !== oldState.userProfile.partnerUsername;
            const friendsChanged = JSON.stringify(newState.userProfile.friendUsernames) !== JSON.stringify(oldState.userProfile.friendUsernames);
                                 
            if (hobbiesChanged || prefsChanged) {
                supabase.from('preferences').upsert({
                    id: currentUser, // assuming currentUser is the UUID due to our updated init flow
                    user_id: currentUser,
                    living_situation: newState.userProfile.livingSituation,
                    partner_username: newState.userProfile.partnerUsername,
                    hobbies: newState.hobbies
                }).then(({ error }: any) => { if(error) console.error(error); });
            }

            if (friendsChanged) {
                localStorage.setItem(`gozi_friends_${currentUser}`, JSON.stringify(newState.userProfile.friendUsernames));
            }
            
            return {
                ...prevData,
                users: {
                    ...prevData.users,
                    [currentUser]: newState,
                }
            };
        });
    };

    const setLoading = (isLoading: boolean) => updateCurrentUserState(prev => ({ ...prev, isLoading }));
    const setError = (error: string | null) => updateCurrentUserState(prev => ({ ...prev, error }));

    const checkAndUnlockAchievements = (updatedState: AppState): AppState => {
        const { userProfile, inventory, chatHistory, suggestionsFetchCount } = updatedState;
        const unlocked = new Set(userProfile.achievements);
        let xpGained = 0;
        let goldGained = 0;

        const check = (id: string, condition: boolean) => {
            if (condition && !unlocked.has(id)) {
                unlocked.add(id);
                const ach = ACHIEVEMENTS.find(a => a.id === id);
                if (ach) { xpGained += ach.xp; goldGained += ach.gold; }
            }
        };

        check('FIRST_SUGGESTION', suggestionsFetchCount > 0);
        check('COLLECTOR', inventory.length >= 10);
        check('CURATOR', inventory.length >= 20);
        check('CONVERSATIONALIST', chatHistory.filter(m => m.sender === 'user').length >= 10);
        check('SOCIAL_BUTTERFLY', userProfile.friendUsernames.length > 0 || userProfile.partnerUsername !== null);
        check('EXPLORER', suggestionsFetchCount >= 5);

        const newAchievements = Array.from(unlocked);
        if (newAchievements.length === userProfile.achievements.length && xpGained === 0) {
            return updatedState;
        }

        const newXP = userProfile.xp + xpGained;
        let newLevel = userProfile.level;
        let xpForNextLevel = newXP;
        if (xpForNextLevel >= XP_PER_LEVEL) {
            newLevel += 1;
            xpForNextLevel -= XP_PER_LEVEL;
        }

        return {
            ...updatedState,
            userProfile: {
                ...userProfile,
                achievements: newAchievements,
                xp: xpForNextLevel,
                level: newLevel,
                gold: userProfile.gold + goldGained,
            },
        };
    };

    // --- User & Auth ---
    const login = (username: string) => {
        setData(prevData => {
            // Because username from Supabase could be the UUID or email.
            // We'll trust whatever init() seeded, or fallback if using manual dev login.
            const userExists = !!prevData.users[username];
            const newUsers = { ...prevData.users };
            if (!userExists) {
                 newUsers[username] = {
                    ...INITIAL_APP_STATE,
                    userProfile: {
                        ...INITIAL_APP_STATE.userProfile,
                        username: username,
                        isLoggedIn: true,
                    }
                };
            } else {
                newUsers[username] = {
                    ...newUsers[username],
                    userProfile: {
                        ...newUsers[username].userProfile,
                        isLoggedIn: true,
                    }
                }
            }
            return {
                currentUser: username,
                users: newUsers,
            }
        });
    };

    const logout = () => {
        setData(prevData => ({ ...prevData, currentUser: null }));
        setState(INITIAL_APP_STATE);
        supabase.auth.signOut();
    };
    
    const resetData = () => {
        setData(prevData => {
            const currentUser = prevData.currentUser;
            if (!currentUser) return prevData;

            // Delete user data from Supabase
            supabase.from('chat_messages').delete().eq('user_id', currentUser).then(({ error }: any) => { if (error) console.error(error); });
            supabase.from('inventory_items').delete().eq('user_id', currentUser).then(({ error }: any) => { if (error) console.error(error); });
            supabase.from('weekly_reflections').delete().eq('user_id', currentUser).then(({ error }: any) => { if (error) console.error(error); });
            supabase.from('preferences').delete().eq('user_id', currentUser).then(({ error }: any) => { if (error) console.error(error); });
            supabase.from('profiles').delete().eq('id', currentUser).then(({ error }: any) => { if (error) console.error(error); });

            const newUsers = { ...prevData.users };
            newUsers[currentUser] = {
                ...INITIAL_APP_STATE,
                    userProfile: {
                    ...INITIAL_APP_STATE.userProfile,
                    username: currentUser,
                    isLoggedIn: true,
                    }
            };
            return {
                ...prevData,
                users: newUsers,
            }
        });
    }

    const setOnboardingCompleted = () => {
        updateCurrentUserState(prev => ({ ...prev, userProfile: { ...prev.userProfile, onboardingCompleted: true } }));
    };

    const upgradeSubscription = (tier: 'Premium') => {
        updateCurrentUserState(prev => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                subscriptionTier: tier,
                trialEndDate: null,
            }
        }));
    };
    
    const setActiveScreen = (screen: 'Today' | 'Journey' | 'Profile' | 'Chat') => {
         updateCurrentUserState(prev => ({ ...prev, activeScreen: screen }));
    }

    const addXP = useCallback((amount: number) => {
        updateCurrentUserState(prev => {
            const newXP = prev.userProfile.xp + amount;
            let newLevel = prev.userProfile.level;
            let newStreakFreezes = prev.userProfile.streakFreezes;
            let xpForNextLevel = newXP;

            if (xpForNextLevel >= XP_PER_LEVEL) {
                newLevel += 1;
                xpForNextLevel -= XP_PER_LEVEL;
                newStreakFreezes += 1;
            }

            return {
                ...prev,
                userProfile: {
                    ...prev.userProfile,
                    xp: xpForNextLevel,
                    level: newLevel,
                    streakFreezes: newStreakFreezes
                }
            };
        });
    }, []);

    const setMood = (mood: Mood | null) => {
        updateCurrentUserState(prev => ({ ...prev, currentMood: mood, inventorySuggestions: [], externalContentSuggestions: [], musicSuggestions: [], localActivitySuggestions: [], miniGameSuggestions: [] }));
    };

    const setSocialContext = (context: SocialContext | string) => {
        updateCurrentUserState(prev => ({ ...prev, socialContext: context, inventorySuggestions: [], externalContentSuggestions: [], musicSuggestions: [], localActivitySuggestions: [], miniGameSuggestions: [] }));
    };

    const setTimeAvailability = (time: TimeAvailability | null) => {
        updateCurrentUserState(prev => ({ ...prev, currentTimeAvailability: time, inventorySuggestions: [], externalContentSuggestions: [], musicSuggestions: [], localActivitySuggestions: [], miniGameSuggestions: [] }));
    };

    const toggleDateNightMode = () => {
        updateCurrentUserState(prev => ({ ...prev, isDateNightMode: !prev.isDateNightMode, inventorySuggestions: [], externalContentSuggestions: [], musicSuggestions: [], localActivitySuggestions: [], miniGameSuggestions: [] }));
    };

    const FREE_DAILY_LIMIT = 3;

    const fetchSuggestions = useCallback(() => {
        if (!state.currentMood || !state.socialContext || !state.currentTimeAvailability) return;

        const isFree = state.userProfile.subscriptionTier === 'Free';
        if (state.isSurveyDue) {
            return; // Block fetching if user has a survey due
        }

        const today = new Date().toDateString();
        const sameDay = state.dailyFetchCountDate === today;
        if (isFree && sameDay && (state.dailyFetchCount || 0) >= FREE_DAILY_LIMIT) {
            return;
        }

        setLoading(true);
        setError(null);

        updateCurrentUserState(prev => {
            const today = new Date().toDateString();
            const alreadyAwardedToday = prev.userProfile.lastFetchXPDate === today;
            const newCount = (prev.suggestionsFetchCount || 0) + 1;
            const newDailyCount = (prev.dailyFetchCountDate === today ? (prev.dailyFetchCount || 0) : 0) + 1;
            if (alreadyAwardedToday) {
                return { ...prev, suggestionsFetchCount: newCount, dailyFetchCount: newDailyCount, dailyFetchCountDate: today };
            }
            const newXP = prev.userProfile.xp + XP_REWARDS.SUGGESTION_FETCH;
            let newLevel = prev.userProfile.level;
            let xpForNextLevel = newXP;
            if (xpForNextLevel >= XP_PER_LEVEL) { newLevel += 1; xpForNextLevel -= XP_PER_LEVEL; }
            const updated = { ...prev, suggestionsFetchCount: newCount, dailyFetchCount: newDailyCount, dailyFetchCountDate: today, userProfile: { ...prev.userProfile, xp: xpForNextLevel, level: newLevel, lastFetchXPDate: today } };
            return checkAndUnlockAchievements(updated);
        });

        const fetchAll = async () => {
            try {
                const allUsers = Object.values(data.users);
                const sharedContext = {
                    partner: state.userProfile.partnerUsername 
                        ? allUsers.find(u => u.userProfile.username === state.userProfile.partnerUsername) || null 
                        : null,
                    friends: state.userProfile.friendUsernames
                        .map(f => allUsers.find(u => u.userProfile.username === f))
                        .filter(Boolean) as AppState[],
                };

                // Detect if socialContext is a connected friend's username
                const selectedFriend = allUsers.find(u => u.userProfile.username === state.socialContext);
                const effectiveSocialContext = selectedFriend ? SocialContext.WithFriends : (state.socialContext as SocialContext);

                // Build effective inventory and hobbies based on friendInventoryContext selection
                let targetInventory = state.inventory;
                let targetHobbies = state.hobbies;
                if (selectedFriend) {
                    const sharedFriendInventory = selectedFriend.inventory.filter((i: any) => i.shareWithFriends === true);
                    if (state.friendInventoryContext === 'their') {
                        targetInventory = sharedFriendInventory;
                        targetHobbies = selectedFriend.hobbies; // Hobbies are public by default among friends
                    } else if (state.friendInventoryContext === 'both') {
                        const myIdSet = new Set(state.inventory.map(i => i.name.toLowerCase()));
                        const combinedItems = [...state.inventory];
                        for (const item of sharedFriendInventory) {
                            if (!myIdSet.has(item.name.toLowerCase())) {
                                combinedItems.push(item);
                            }
                        }
                        targetInventory = combinedItems;
                        targetHobbies = Array.from(new Set([...state.hobbies, ...selectedFriend.hobbies]));
                    }
                }

                const effectiveUserState = {
                    ...state,
                    inventory: targetInventory,
                    hobbies: targetHobbies
                };

                try {
                    const inv = await geminiService.getInventorySuggestions(state.currentMood!, effectiveSocialContext, effectiveUserState, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                    updateCurrentUserState(prev => ({ ...prev, inventorySuggestions: inv }));
                } catch (e) { console.error("Inv error", e); }
                
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const ext = await geminiService.getExternalContentSuggestions(state.currentMood!, effectiveSocialContext, effectiveUserState, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                    updateCurrentUserState(prev => ({ ...prev, externalContentSuggestions: ext }));
                } catch (e) { console.error("Ext error", e); }

                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const music = await geminiService.getMusicSuggestions(state.currentMood!);
                    updateCurrentUserState(prev => ({ ...prev, musicSuggestions: music }));
                } catch (e) { console.error("Music error", e); }

                try {
                     const games = await geminiService.getMiniGameSuggestions(state.currentMood!, effectiveSocialContext);
                     updateCurrentUserState(prev => ({ ...prev, miniGameSuggestions: games }));
                } catch (e) { console.error("Games error", e); }
                
                await new Promise(resolve => setTimeout(resolve, 1000));

                 navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const loc = await geminiService.getLocalActivitySuggestions(state.currentMood!, effectiveSocialContext, { latitude, longitude }, effectiveUserState, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                            updateCurrentUserState(prev => ({ ...prev, localActivitySuggestions: loc, isLoading: false }));
                        } catch (e) {
                             console.error("Loc error", e);
                             updateCurrentUserState(prev => ({ ...prev, isLoading: false }));
                        }
                    },
                    async (err) => {
                        console.warn("Geo access denied or failed, using default coordinates (Mankato, MN)", err);
                        try {
                            const loc = await geminiService.getLocalActivitySuggestions(state.currentMood!, effectiveSocialContext, { latitude: 44.1636, longitude: -93.9994 }, effectiveUserState, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                            updateCurrentUserState(prev => ({ ...prev, localActivitySuggestions: loc, isLoading: false }));
                        } catch (e) {
                             console.error("Loc error (fallback)", e);
                             updateCurrentUserState(prev => ({ ...prev, isLoading: false }));
                        }
                    },
                    { timeout: 5000 }
                );
            } catch (e) {
                setError("Failed to fetch suggestions.");
                setLoading(false);
            }
        };

        fetchAll();
    }, [state.currentMood, state.socialContext, state.currentTimeAvailability, state.isDateNightMode, state.friendInventoryContext, state.userProfile.partnerUsername, state.userProfile.friendUsernames, data.users]);

    const fetchDailyRefresh = useCallback((mood?: Mood | null, socialContext?: SocialContext | string | null, timeAvailability?: TimeAvailability | null, forceRefetch: boolean = false) => {
        const todayKey = `dr-${new Date().toDateString()}`;
        const isCompleted = localStorage.getItem(`daily_refresh_completed_${todayKey}`) === 'true';
        if (isCompleted && state.dailyRefresh?.id === todayKey) return;
        if (!forceRefetch && state.dailyRefresh?.id === todayKey) return;

        setLoading(true);
        geminiService.getDailyRefresh(mood, socialContext, timeAvailability).then(data => {
            const newRefresh = {
                id: todayKey,
                type: ProactiveSuggestionType.DailyRefresh,
                title: "Daily Refresh",
                question: data.question,
                answer: data.answer,
                icon: 'Lightbulb'
            };
            updateCurrentUserState(prev => ({...prev, dailyRefresh: newRefresh, isLoading: false}));
        }).catch(err => {
            console.error("fetchDailyRefresh error", err);
            setLoading(false);
        });
    }, [state.dailyRefresh]);
    
    const completeNudge = () => addXP(XP_REWARDS.NUDGE);
    const completeDailyRefresh = () => addXP(XP_REWARDS.DAILY_REFRESH);

    const addHabit = (habit: Omit<Habit, 'id' | 'currentStreak' | 'longestStreak' | 'completions' | 'lastCompletionDate'>) => {
        const newHabit: Habit = { ...habit, id: Date.now().toString(), currentStreak: 0, longestStreak: 0, completions: [], lastCompletionDate: null };
        updateCurrentUserState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    };
    
    const updateHabit = (updatedHabit: Habit) => {
        updateCurrentUserState(prev => ({ ...prev, habits: prev.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h) }));
    };

    const deleteHabit = (habitId: string) => {
        updateCurrentUserState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== habitId) }));
    };

    const completeHabit = (habitId: string) => {
        updateCurrentUserState(prev => {
            const today = new Date().toISOString().split('T')[0];
            const habit = prev.habits.find(h => h.id === habitId);
            if (!habit || habit.completions.some(c => c.date === today)) return prev;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            let newStreak = habit.lastCompletionDate === yesterdayStr ? habit.currentStreak + 1 : 1;
            
            const updatedHabit = { ...habit, currentStreak: newStreak, longestStreak: Math.max(habit.longestStreak, newStreak), lastCompletionDate: today, completions: [...habit.completions, { date: today }] };
            const newHabits = prev.habits.map(h => h.id === habitId ? updatedHabit : h);

            const difficultyXP: Record<string, number> = { Easy: 10, Medium: 25, Hard: 50 };
            const xpGained = difficultyXP[habit.difficulty] || 10;
            
            const newXP = prev.userProfile.xp + xpGained;
            return { ...prev, habits: newHabits, userProfile: { ...prev.userProfile, xp: newXP }};
        });
    };
    
    const addInventoryFromOnboarding = async (onboardingData: OnboardingData) => {
        setLoading(true);
        const { streaming, games, goals, hobbies, inventoryText, gameListText } = onboardingData;
        const combinedText = `Streaming: ${streaming.join(', ')}. Games: ${games.join(', ')}. Specific Games: ${gameListText || 'N/A'}. Other: ${inventoryText}.`;
        const categorizedItems = await geminiService.categorizeInventory(combinedText);
        
        const uid = data.currentUser!;
        const newItemsToInsert = categorizedItems.map((item: any) => ({
             user_id: uid,
             name: item.name,
             category: item.category,
             confidence: item.confidence?.toString(),
             interest: item.interest,
             description: item.description
        }));
        await supabase.from('inventory_items').insert(newItemsToInsert);
        await supabase.from('preferences').upsert({
            id: uid,
            user_id: uid,
            hobbies: hobbies,
            living_situation: null,
            partner_username: null
        });

        updateCurrentUserState(prev => {
            const newItems: InventoryItem[] = categorizedItems.map((item: any) => ({ id: `${Date.now()}-${item.name}`, ...item }));
            const updated = { ...prev, hobbies: [...prev.hobbies, ...hobbies], goals: [...(prev.goals || []), ...goals], inventory: [...prev.inventory, ...newItems], isLoading: false, isSurveyDue: false, userProfile: { ...prev.userProfile, onboardingCompleted: true } };
            return checkAndUnlockAchievements(updated);
        });
    };
    
    const processBulkInventory = async (text: string) => {
        setLoading(true);
        const categorizedItems = await geminiService.categorizeInventory(text);
        const uid = data.currentUser!;
        const newItemsToInsert = categorizedItems.map((item: any) => ({
             user_id: uid,
             name: item.name,
             category: item.category,
             confidence: item.confidence?.toString(),
             interest: item.interest,
             description: item.description
        }));
        await supabase.from('inventory_items').insert(newItemsToInsert);

        updateCurrentUserState(prev => {
            const newItems: InventoryItem[] = categorizedItems.map((item: any) => ({ id: `${Date.now()}-${item.name}`, ...item }));
            const updated = { ...prev, inventory: [...prev.inventory, ...newItems], isLoading: false };
            return checkAndUnlockAchievements(updated);
        });
    };

    const updateInventoryItem = async (item: InventoryItem) => {
        if (item.id && !item.id.includes('-')) {
            // It has a real DB id, update it in Supabase
            await supabase.from('inventory_items').update({
                name: item.name,
                category: item.category,
                confidence: item.confidence?.toString(),
                interest: item.interest,
                description: item.description,
                share_with_friends: item.shareWithFriends ?? true
            }).eq('id', item.id);
        }
        updateCurrentUserState(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === item.id ? item : i) }));
    };

    const deleteInventoryItem = async (itemId: string) => {
        if (itemId && !itemId.includes('-')) {
            await supabase.from('inventory_items').delete().eq('id', itemId);
        }
        updateCurrentUserState(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== itemId) }));
    };

    const setHobbyToDetail = (hobby: string | null) => {
        updateCurrentUserState(prev => ({...prev, hobbyToDetail: hobby}));
    };

    const addHobby = (hobby: string) => {
        const trimmedHobby = hobby.trim();
        if (GENERIC_HOBBIES.includes(trimmedHobby.toLowerCase())) {
            setHobbyToDetail(trimmedHobby);
        } else {
            updateCurrentUserState(prev => {
                if (!prev.hobbies.find(h => h.toLowerCase() === trimmedHobby.toLowerCase())) {
                    return { ...prev, hobbies: [...prev.hobbies, trimmedHobby] };
                }
                return prev;
            });
        }
    };
    
    const addHobbyWithDetails = async (hobby: string, details: string) => {
        setLoading(true);
        const result = await geminiService.processHobbyDetails(hobby, details);
        const uid = data.currentUser!;
        if (result.newInventoryItems && result.newInventoryItems.length > 0) {
             const newItemsToInsert = result.newInventoryItems.map((item: any) => ({
                 user_id: uid,
                 name: item.name,
                 category: item.category,
                 confidence: item.confidence?.toString(),
                 interest: item.interest,
                 description: item.description
            }));
            await supabase.from('inventory_items').insert(newItemsToInsert);
        }

        updateCurrentUserState(prev => {
            const newItems: InventoryItem[] = result.newInventoryItems.map((item: any) => ({
                id: `${Date.now()}-${item.name}`,
                ...item
            }));
            const hobbyExists = prev.hobbies.find(h => h.toLowerCase() === hobby.toLowerCase());
            return {
                ...prev,
                hobbies: hobbyExists ? prev.hobbies : [...prev.hobbies, hobby],
                inventory: [...prev.inventory, ...newItems],
                isLoading: false,
                hobbyToDetail: null,
            };
        });
    };
    
    const deleteHobby = (hobby: string) => {
        updateCurrentUserState(prev => ({ ...prev, hobbies: prev.hobbies.filter(h => h.trim().toLowerCase() !== hobby.trim().toLowerCase()) }));
    };

    const addChatMessage = async (text: string) => {
        const uid = data.currentUser!;
        if (!uid) return;

        const userMsgId = Date.now().toString();
        const userMessage: ChatMessage = { id: userMsgId, sender: 'user', text, timestamp: new Date().toISOString() };
        updateCurrentUserState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMessage], isLoading: true }));

        // Store user message in Supabase
        await supabase.from('chat_messages').insert({
            id: userMsgId,
            user_id: uid,
            sender: 'user',
            text: text,
            timestamp: userMessage.timestamp
        });
        
        const aiResponseData = await geminiService.getChatMessage([...state.chatHistory, userMessage], state.currentMood, state.inventory, state.hobbies);
        
        const aiMsgId = (Date.now() + 1).toString();
        const aiMessage: ChatMessage = { id: aiMsgId, sender: 'ai', text: aiResponseData.responseText, suggestions: aiResponseData.suggestions, timestamp: new Date().toISOString() };
        
        // Store AI message in Supabase
        await supabase.from('chat_messages').insert({
            id: aiMsgId,
            user_id: uid,
            sender: 'ai',
            text: aiResponseData.responseText,
            suggestions: aiResponseData.suggestions || [],
            timestamp: aiMessage.timestamp
        });

        updateCurrentUserState(prev => {
            let newInventory = prev.inventory;
            let newHobbies = prev.hobbies;
            
            if (aiResponseData.newInventoryItems && aiResponseData.newInventoryItems.length > 0) {
                 const itemsToAdd = aiResponseData.newInventoryItems.map((item: any) => ({
                     id: `${Date.now()}-${Math.random()}`,
                     ...item
                 }));
                 newInventory = [...prev.inventory, ...itemsToAdd];
                 
                 const newItemsToInsert = aiResponseData.newInventoryItems.map((item: any) => ({
                     user_id: data.currentUser!,
                     name: item.name,
                     category: item.category,
                     confidence: item.confidence?.toString(),
                     interest: item.interest,
                     description: item.description
                }));
                supabase.from('inventory_items').insert(newItemsToInsert).then(({ error }: any) => { if(error) console.error(error); });
            }
            
            if (aiResponseData.newHobbies && aiResponseData.newHobbies.length > 0) {
                 const uniqueNew = aiResponseData.newHobbies.filter((h: string) => !prev.hobbies.includes(h));
                 newHobbies = [...prev.hobbies, ...uniqueNew];
            }

            const updated = { 
                ...prev, 
                chatHistory: [...prev.chatHistory, aiMessage], 
                isLoading: false,
                inventory: newInventory,
                hobbies: newHobbies
            };
            return checkAndUnlockAchievements(updated);
        });
    };

    const endVoiceChat = useCallback(() => {
        state.voiceSession?.then((session: any) => session.close());
        audioRef.micStream?.getTracks().forEach(track => track.stop());
        if (audioRef.inputAudioContext?.state !== 'closed') audioRef.inputAudioContext?.close();
        if (audioRef.outputAudioContext?.state !== 'closed') audioRef.outputAudioContext?.close();
        audioRef.scriptProcessor?.disconnect();
        updateCurrentUserState(prev => ({ ...prev, isVoiceSessionActive: false, voiceSession: null, currentTranscription: { input: '', output: '' } }));
    }, [state.voiceSession, audioRef]);

    const startVoiceChat = useCallback(async () => {
        if (state.isVoiceSessionActive) return;
        try {
            audioRef.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioRef.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioRef.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const sessionPromise = geminiService.startLiveSession({ onOpen: () => {}, onMessage: async () => {}, onError: () => {}, onClose: () => {} });
            updateCurrentUserState(prev => ({ ...prev, isVoiceSessionActive: true, voiceSession: sessionPromise }));
        } catch (err) {
            setError("Could not access microphone.");
        }
    }, [state.isVoiceSessionActive, audioRef]);

    const dismissWeeklySurvey = useCallback(() => {
        updateCurrentUserState(prev => ({ ...prev, currentWeeklySurvey: null }));
    }, []);

    const fetchWeeklySurvey = useCallback(async () => {
        setLoading(true);
        const questions = await geminiService.getWeeklySurveyQuestions(state.hobbies);
        const newSurvey: WeeklySurvey = { id: `survey-${Date.now()}`, questions, answers: {} };
        updateCurrentUserState(prev => ({ ...prev, currentWeeklySurvey: newSurvey, isLoading: false }));
    }, [state.hobbies]);

    const submitWeeklySurvey = useCallback(async (answers: Record<string, string>) => {
        setLoading(true);
        const result = await geminiService.processSurveyAnswers(answers, state.hobbies, state.inventory);
        
        await supabase.from('weekly_reflections').insert({
            user_id: data.currentUser!,
            responses: answers
        });
        
        const nowStr = new Date().toISOString();
        await supabase.from('profiles').update({ last_survey_date: nowStr }).eq('id', data.currentUser!);
        
        updateCurrentUserState(prev => {
             const uniqueNewHobbies = result.newHobbies.filter((h: string) => !prev.hobbies.includes(h));
            const uniqueNewItems: InventoryItem[] = result.newInventoryItems.map((item: any) => ({ id: `${Date.now()}-${item.name}`, ...item }));
             let newChatMessage: ChatMessage | null = null;
            if (uniqueNewHobbies.length > 0 || uniqueNewItems.length > 0) {
                const text = `Thanks for sharing! I've updated your profile with new hobbies and items to give you better suggestions.`.trim();
                newChatMessage = { id: `survey-summary-${Date.now()}`, sender: 'ai', text, timestamp: new Date().toISOString() };
            }
            return {
                ...prev,
                hobbies: [...prev.hobbies, ...uniqueNewHobbies],
                inventory: [...prev.inventory, ...uniqueNewItems],
                chatHistory: newChatMessage ? [...prev.chatHistory, newChatMessage] : prev.chatHistory,
                userProfile: { ...prev.userProfile, lastSurveyDate: nowStr },
                isSurveyDue: false,
                currentWeeklySurvey: null,
                isLoading: false,
            };
        });
    }, [state.hobbies, state.inventory, data.currentUser]);

    const updateRelationshipStatus = (status: RelationshipStatus) => {
        updateCurrentUserState(prev => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                relationshipStatus: status,
                partnerUsername: status === RelationshipStatus.Single ? null : prev.userProfile.partnerUsername,
                livingSituation: status === RelationshipStatus.Single ? null : prev.userProfile.livingSituation,
            },
        }));
    };

    const setPartnerUsername = (username: string) => {
        updateCurrentUserState(prev => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                partnerUsername: username || null,
                relationshipStatus: RelationshipStatus.InARelationship,
            },
        }));
    };

    const updateLivingSituation = (situation: 'together' | 'separately') => {
        updateCurrentUserState(prev => ({
            ...prev,
            userProfile: { ...prev.userProfile, livingSituation: situation },
        }));
    };

    const updatePreferences = (partial: Partial<UserPreferences>) => {
        updateCurrentUserState(prev => ({
            ...prev,
            userProfile: {
                ...prev.userProfile,
                preferences: { ...prev.userProfile.preferences, ...partial },
            },
        }));
    };

    const setFriendInventoryContext = (context: 'my' | 'their' | 'both') => {
        updateCurrentUserState(prev => ({ ...prev, friendInventoryContext: context, inventorySuggestions: [], externalContentSuggestions: [], musicSuggestions: [], localActivitySuggestions: [], miniGameSuggestions: [] }));
    };

    const loadFriendState = async (username: string) => {
        try {
            const { data: users } = await supabase.from('profiles').select('*');
            let foundUser = users?.find((u: any) => u.name === username || u.email === username);
            
            if (!foundUser) {
                // For mock mode or fallback, if user not found, create a simulated profile
                const fallbackId = `friend-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                
                // Check if already created locally to avoid duplicate creations
                const { data: existingProfiles } = await supabase.from('profiles').select('*');
                const matched = existingProfiles?.find((u: any) => u.id === fallbackId);
                
                if (matched) {
                    foundUser = matched;
                } else {
                    const newProfile = {
                        id: fallbackId,
                        name: username,
                        email: `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
                        subscription_tier: 'Free',
                        last_survey_date: null,
                        created_at: new Date().toISOString()
                    };
                    await supabase.from('profiles').insert(newProfile);
                    
                    // Add mock preferences (hobbies)
                    const mockHobbies = ["reading", "gaming", "cooking", "hiking"];
                    await supabase.from('preferences').upsert({
                        id: fallbackId,
                        user_id: fallbackId,
                        living_situation: 'separately',
                        partner_username: null,
                        hobbies: mockHobbies
                    });
                    
                    // Add mock inventory items
                    const mockItems = [
                        { name: "Kindle E-Reader", category: "Entertainment", confidence: "5", interest: "high", description: "Prefers reading sci-fi and self-help.", share_with_friends: true },
                        { name: "Nintendo Switch", category: "Entertainment", confidence: "5", interest: "high", description: "Loves playing cooperative games.", share_with_friends: true },
                        { name: "Chef's Knife Set", category: "Food & Cooking", confidence: "4", interest: "medium", description: "Enjoys experimenting with new recipes.", share_with_friends: true }
                    ];
                    for (const item of mockItems) {
                        await supabase.from('inventory_items').insert({
                            user_id: fallbackId,
                            ...item
                        });
                    }
                    
                    foundUser = newProfile;
                }
            }

            const uid = foundUser.id;
            const { data: invData } = await supabase.from('inventory_items').select('*').eq('user_id', uid);
            const { data: prefData = {} } = await supabase.from('preferences').select('*').eq('user_id', uid).maybeSingle();
            
            const publicInvData = invData?.filter((i: any) => i.share_with_friends !== false && i.shareWithFriends !== false) || [];

            const loadedState: AppState = {
                ...INITIAL_APP_STATE,
                userProfile: {
                    ...INITIAL_APP_STATE.userProfile,
                    username: foundUser.name || foundUser.email,
                    isLoggedIn: true,
                    onboardingCompleted: true,
                    subscriptionTier: foundUser.subscription_tier || 'Free',
                    livingSituation: prefData?.living_situation || null,
                    partnerUsername: prefData?.partner_username || null,
                },
                hobbies: prefData?.hobbies || [],
                inventory: publicInvData.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    category: i.category,
                    confidence: Number(i.confidence) || 1,
                    interest: i.interest,
                    description: i.description,
                    shareWithFriends: i.share_with_friends ?? i.shareWithFriends ?? true
                }))
            };

            setData(prev => ({
                ...prev,
                users: {
                    ...prev.users,
                    [uid]: loadedState
                }
            }));
        } catch (e) {
            console.error("loadFriendState error", e);
        }
    };

    const syncWithPartner = async (partnerUsername: string): Promise<boolean> => {
        if (partnerUsername === state.userProfile.username) {
            setError("Partner not found or you cannot add yourself.");
            return false;
        }
        
        const { data: users } = await supabase.from('profiles').select('*');
        const partnerUser = users?.find((u: any) => u.name === partnerUsername || u.email === partnerUsername);
        
        if (!partnerUser) {
            setError("Partner not found.");
            return false;
        }

        // Load their state in background from Supabase
        const puid = partnerUser.id;
        const { data: invData } = await supabase.from('inventory_items').select('*').eq('user_id', puid);
        const { data: prefData } = await supabase.from('preferences').select('*').eq('user_id', puid).maybeSingle();
        const publicInvData = invData?.filter((i: any) => i.share_with_friends !== false && i.shareWithFriends !== false) || [];

        const loadedState: AppState = {
            ...INITIAL_APP_STATE,
            userProfile: {
                ...INITIAL_APP_STATE.userProfile,
                username: partnerUser.name || partnerUser.email,
                isLoggedIn: true,
                onboardingCompleted: true,
                subscriptionTier: partnerUser.subscription_tier || 'Free',
                livingSituation: prefData?.living_situation || null,
                partnerUsername: prefData?.partner_username || null,
            },
            hobbies: prefData?.hobbies || [],
            inventory: publicInvData.map((i: any) => ({
                id: i.id,
                name: i.name,
                category: i.category,
                confidence: Number(i.confidence) || 1,
                interest: i.interest,
                description: i.description,
                shareWithFriends: i.share_with_friends ?? i.shareWithFriends ?? true
            }))
        };

        setData(prevData => {
            const currentUser = prevData.currentUser!;
            const newUsers: Record<string, AppState> = { ...prevData.users, [puid]: loadedState };
            newUsers[currentUser] = { ...newUsers[currentUser], userProfile: { ...newUsers[currentUser].userProfile, partnerUsername, relationshipStatus: RelationshipStatus.InARelationship, } };
            newUsers[puid] = { ...newUsers[puid], userProfile: { ...newUsers[puid].userProfile, partnerUsername: newUsers[currentUser].userProfile.username, relationshipStatus: RelationshipStatus.InARelationship, } };
            return { ...prevData, users: newUsers };
        });
        return true;
    };

    const addFriend = async (friendUsername: string): Promise<boolean> => {
        if (friendUsername === state.userProfile.username) {
            setError("You cannot add yourself.");
            return false;
        }
        
        updateCurrentUserState(prev => {
            if(prev.userProfile.friendUsernames.includes(friendUsername)) return prev;
            const updated = { ...prev, userProfile: { ...prev.userProfile, friendUsernames: [...prev.userProfile.friendUsernames, friendUsername] } };
            return checkAndUnlockAchievements(updated);
        });

        await loadFriendState(friendUsername);
        return true;
    };
    
    const removeFriend = (friendUsername: string) => {
        updateCurrentUserState(prev => ({ ...prev, userProfile: { ...prev.userProfile, friendUsernames: prev.userProfile.friendUsernames.filter(f => f !== friendUsername) } }))
    };
    
     const removePartner = () => {
        const partnerUsername = state.userProfile.partnerUsername;
        if (!partnerUsername) return;
        setData(prevData => {
            const currentUser = prevData.currentUser!;
            const newUsers = { ...prevData.users };
            newUsers[currentUser] = { ...newUsers[currentUser], userProfile: { ...newUsers[currentUser].userProfile, partnerUsername: null, relationshipStatus: RelationshipStatus.Single }};
            if (newUsers[partnerUsername]) {
                 newUsers[partnerUsername] = { ...newUsers[partnerUsername], userProfile: { ...newUsers[partnerUsername].userProfile, partnerUsername: null, relationshipStatus: RelationshipStatus.Single }};
            }
            return { ...prevData, users: newUsers };
        });
    };
    
    const exportData = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'life_companion_data.json');
        linkElement.click();
    };

    return {
        state,
        users: data.users,
        actions: {
            login, logout, resetData, setOnboardingCompleted, upgradeSubscription, setActiveScreen,
            addXP, setMood, setSocialContext, setTimeAvailability, toggleDateNightMode, fetchSuggestions,
            fetchDailyRefresh, completeNudge, completeDailyRefresh,
            addHabit, updateHabit, deleteHabit, completeHabit,
            addInventoryFromOnboarding, processBulkInventory, updateInventoryItem, deleteInventoryItem,
            addHobby, deleteHobby, addHobbyWithDetails, setHobbyToDetail,
            addChatMessage, startVoiceChat, endVoiceChat,
            fetchWeeklySurvey, submitWeeklySurvey, dismissWeeklySurvey,
            updateRelationshipStatus, setPartnerUsername, updateLivingSituation, updatePreferences,
            syncWithPartner, addFriend, removeFriend, removePartner,
            exportData, setFriendInventoryContext,
        }
    };
};
