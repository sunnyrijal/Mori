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
            const { data: { session } } = await supabase.auth.getSession();
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
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();

            const lastSurveyDate = profileData?.last_survey_date ? new Date(profileData.last_survey_date) : null;
            let surveyDue = false;
            const subTier = profileData?.subscription_tier || 'Free';
            if (subTier === 'Premium') {
                if (!lastSurveyDate) {
                    surveyDue = true;
                } else {
                    const days = (new Date().getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (days > 7) surveyDue = true;
                }
            }

            const loadedState: AppState = {
                ...INITIAL_APP_STATE,
                isSurveyDue: surveyDue,
                userProfile: {
                    ...INITIAL_APP_STATE.userProfile,
                    username: session.user.user_metadata.full_name || session.user.email,
                    isLoggedIn: true,
                    subscriptionTier: subTier as any,
                    lastSurveyDate: profileData?.last_survey_date || null,
                    livingSituation: prefData?.living_situation || null,
                    partnerUsername: prefData?.partner_username || null,
                },
                hobbies: prefData?.hobbies || [],
                inventory: invData?.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    category: i.category,
                    confidence: Number(i.confidence) || 1,
                    interest: i.interest,
                    description: i.description
                })) || []
            };
            
            setState(loadedState);
            setData({ currentUser: uid, users: { [uid]: loadedState } });
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
                                 
            if (hobbiesChanged || prefsChanged) {
                supabase.from('preferences').upsert({
                    id: currentUser, // assuming currentUser is the UUID due to our updated init flow
                    user_id: currentUser,
                    living_situation: newState.userProfile.livingSituation,
                    partner_username: newState.userProfile.partnerUsername,
                    hobbies: newState.hobbies
                }).then(({ error }) => { if(error) console.error(error); });
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

    const setSocialContext = (context: SocialContext) => {
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
        if (!isFree && state.isSurveyDue) {
            return; // Block fetching if Premium user has a survey due
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
                const allUsers = data.users;
                const sharedContext = {
                    partner: state.userProfile.partnerUsername ? allUsers[state.userProfile.partnerUsername] || null : null,
                    friends: state.userProfile.friendUsernames.map(f => allUsers[f]).filter(Boolean) as AppState[],
                };

                try {
                    const inv = await geminiService.getInventorySuggestions(state.currentMood!, state.socialContext!, state, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                    updateCurrentUserState(prev => ({ ...prev, inventorySuggestions: inv }));
                } catch (e) { console.error("Inv error", e); }
                
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const ext = await geminiService.getExternalContentSuggestions(state.currentMood!, state.socialContext!, state, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                    updateCurrentUserState(prev => ({ ...prev, externalContentSuggestions: ext }));
                } catch (e) { console.error("Ext error", e); }

                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const music = await geminiService.getMusicSuggestions(state.currentMood!);
                    updateCurrentUserState(prev => ({ ...prev, musicSuggestions: music }));
                } catch (e) { console.error("Music error", e); }

                try {
                     const games = await geminiService.getMiniGameSuggestions(state.currentMood!, state.socialContext!);
                     updateCurrentUserState(prev => ({ ...prev, miniGameSuggestions: games }));
                } catch (e) { console.error("Games error", e); }
                
                await new Promise(resolve => setTimeout(resolve, 1000));

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const loc = await geminiService.getLocalActivitySuggestions(state.currentMood!, state.socialContext!, { latitude, longitude }, state, sharedContext, state.currentTimeAvailability, state.isDateNightMode);
                            updateCurrentUserState(prev => ({ ...prev, localActivitySuggestions: loc, isLoading: false }));
                        } catch (e) {
                             console.error("Loc error", e);
                             updateCurrentUserState(prev => ({ ...prev, isLoading: false }));
                        }
                    },
                    (err) => {
                        console.warn("Geo access denied or failed", err);
                         updateCurrentUserState(prev => ({ ...prev, isLoading: false }));
                    }
                );
            } catch (e) {
                setError("Failed to fetch suggestions.");
                setLoading(false);
            }
        };

        fetchAll();
    }, [state.currentMood, state.socialContext, state.currentTimeAvailability, state.isDateNightMode, state.userProfile.partnerUsername, state.userProfile.friendUsernames, data.users]);

    const fetchDailyRefresh = useCallback(() => {
        const todayKey = `dr-${new Date().toDateString()}`;
        if (state.dailyRefresh?.id === todayKey) return;
        setLoading(true);
        geminiService.getDailyRefresh().then(data => {
            const newRefresh = {
                id: todayKey,
                type: ProactiveSuggestionType.DailyRefresh,
                title: "Daily Refresh",
                question: data.question,
                answer: data.answer,
                icon: 'Lightbulb'
            };
            updateCurrentUserState(prev => ({...prev, dailyRefresh: newRefresh, isLoading: false}));
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

        updateCurrentUserState(prev => {
            const newItems: InventoryItem[] = categorizedItems.map((item: any) => ({ id: `${Date.now()}-${item.name}`, ...item }));
            const updated = { ...prev, hobbies: [...prev.hobbies, ...hobbies], goals: [...(prev.goals || []), ...goals], inventory: [...prev.inventory, ...newItems], isLoading: false, userProfile: { ...prev.userProfile, onboardingCompleted: true } };
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
                description: item.description
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
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date().toISOString() };
        updateCurrentUserState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMessage], isLoading: true }));
        
        const aiResponseData = await geminiService.getChatMessage([...state.chatHistory, userMessage], state.currentMood, state.inventory, state.hobbies);
        
        const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponseData.responseText, suggestions: aiResponseData.suggestions, timestamp: new Date().toISOString() };
        
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
                supabase.from('inventory_items').insert(newItemsToInsert).then(({ error }) => { if(error) console.error(error); });
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

    const syncWithPartner = (partnerUsername: string): boolean => {
        if (!data.users[partnerUsername] || partnerUsername === state.userProfile.username) {
            setError("User not found or you cannot add yourself.");
            return false;
        }
        setData(prevData => {
            const currentUser = prevData.currentUser!;
            const newUsers = { ...prevData.users };
            newUsers[currentUser] = { ...newUsers[currentUser], userProfile: { ...newUsers[currentUser].userProfile, partnerUsername, relationshipStatus: RelationshipStatus.InARelationship, } };
            newUsers[partnerUsername] = { ...newUsers[partnerUsername], userProfile: { ...newUsers[partnerUsername].userProfile, partnerUsername: currentUser, relationshipStatus: RelationshipStatus.InARelationship, } };
            return { ...prevData, users: newUsers };
        });
        return true;
    };

    const addFriend = (friendUsername: string): boolean => {
         if (!data.users[friendUsername] || friendUsername === state.userProfile.username) {
            setError("User not found or you cannot add yourself.");
            return false;
        }
         updateCurrentUserState(prev => {
            if(prev.userProfile.friendUsernames.includes(friendUsername)) return prev;
            const updated = { ...prev, userProfile: { ...prev.userProfile, friendUsernames: [...prev.userProfile.friendUsernames, friendUsername] } };
            return checkAndUnlockAchievements(updated);
         });
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
            exportData,
        }
    };
};
