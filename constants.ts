import { AppState, Mood, SocialContext, RelationshipStatus, Achievement } from './types';

export const XP_PER_LEVEL = 1000;
export const XP_REWARDS = {
    NUDGE: 5,
    DAILY_REFRESH: 25,
    SUGGESTION_FETCH: 10,
};

export const MOODS: { name: Mood; color: string; icon: string }[] = [
    { name: Mood.Energized, color: 'text-ios-text', icon: '⚡️' },
    { name: Mood.Focused, color: 'text-ios-text', icon: '🎯' },
    { name: Mood.Balanced, color: 'text-ios-text', icon: '⚖️' },
    { name: Mood.Creative, color: 'text-ios-text', icon: '🎨' },
    { name: Mood.Social, color: 'text-ios-text', icon: '👥' },
    { name: Mood.Tired, color: 'text-ios-text', icon: '😴' },
    { name: Mood.Bored, color: 'text-ios-text', icon: '😑' },
    { name: Mood.Anxious, color: 'text-ios-text', icon: '😟' },
    { name: Mood.Motivated, color: 'text-ios-text', icon: '🔥' },
    { name: Mood.Reflective, color: 'text-ios-text', icon: '🤔' },
];

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'FIRST_SUGGESTION', name: 'First Discovery', description: 'Get your first set of activity suggestions.', xp: 50, gold: 5 },
    { id: 'COLLECTOR', name: 'Collector', description: 'Add 10 items to your inventory.', xp: 50, gold: 5 },
    { id: 'CURATOR', name: 'Curator', description: 'Build an inventory of 20 or more items.', xp: 100, gold: 10 },
    { id: 'CONVERSATIONALIST', name: 'Conversationalist', description: 'Send 10 messages to the AI companion.', xp: 50, gold: 5 },
    { id: 'SOCIAL_BUTTERFLY', name: 'Social Butterfly', description: 'Connect with a friend or partner in the app.', xp: 75, gold: 8 },
    { id: 'EXPLORER', name: 'Explorer', description: 'Explore activity suggestions 5 times.', xp: 100, gold: 10 },
];

const getTrialEndDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
};

export const INITIAL_APP_STATE: AppState = {
    userProfile: {
        isLoggedIn: false,
        username: null,
        onboardingCompleted: false,
        subscriptionTier: 'Free',
        trialEndDate: getTrialEndDate(),
        level: 1,
        xp: 0,
        gold: 0,
        streakFreezes: 0,
        relationshipStatus: RelationshipStatus.Single,
        partnerUsername: null,
        livingSituation: null,
        friendUsernames: [],
        preferences: {
            enableNotifications: true,
            dataSharing: true,
            profileVisibility: 'friends',
            allowAnalytics: false,
        },
        achievements: [],
        lastSurveyDate: null,
        lastFetchXPDate: null,
    },
    habits: [],
    hobbies: [],
    goals: [],
    inventory: [],
    commitments: [],
    aspirations: [],
    chatHistory: [
        {
            id: 'initial-ai-message',
            sender: 'ai',
            text: "Hello! I'm your Life Companion. Tell me what you have — streaming services, hobbies, gear, games — and I'll suggest exactly what to do with your time. What mood are you in today?",
            timestamp: new Date().toISOString(),
        }
    ],
    currentMood: null,
    socialContext: SocialContext.JustMe,
    currentTimeAvailability: null,
    isDateNightMode: false,
    inventorySuggestions: [],
    externalContentSuggestions: [],
    musicSuggestions: [],
    localActivitySuggestions: [],
    miniGameSuggestions: [],
    dailyRefresh: null,
    isLoading: false,
    error: null,
    activeScreen: 'Today',
    isSurveyDue: true,
    currentWeeklySurvey: null,
    voiceSession: null,
    isVoiceSessionActive: false,
    currentTranscription: {
        input: '',
        output: '',
    },
    sharedContext: {
        partner: null,
        friends: [],
    },
    hobbyToDetail: null,
    suggestionsFetchCount: 0,
    dailyFetchCount: 0,
    dailyFetchCountDate: null,
};
