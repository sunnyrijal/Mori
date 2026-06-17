export enum Mood {
    Energized = "Energized",
    Focused = "Focused",
    Balanced = "Balanced",
    Creative = "Creative",
    Social = "Social",
    Tired = "Tired",
    Bored = "Bored",
    Anxious = "Anxious",
    Motivated = "Motivated",
    Reflective = "Reflective",
}

export enum HabitCategory {
    Health = "Health",
    Mind = "Mind",
    Productivity = "Productivity",
    PersonalGrowth = "Personal Growth",
    Social = "Social",
    Home = "Home",
}

export enum HabitDifficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
}

export enum HabitFrequency {
    Daily = "Daily",
    Weekly = "Weekly",
    Monthly = "Monthly",
}

export enum InventoryCategory {
    HobbiesAndCrafts = "Hobbies & Crafts",
    Entertainment = "Entertainment",
    HealthAndFitness = "Health & Fitness",
    WorkAndProductivity = "Work & Productivity",
    SocialActivities = "Social Activities",
    FoodAndCooking = "Food & Cooking",
    Beverages = "Beverages",
    ShoppingAndErrands = "Shopping & Errands",
    Other = "Other",
}

export enum InterestLevel {
    High = "High",
    Medium = "Medium",
    Low = "Low",
}

export enum RelationshipStatus {
    Single = "Single",
    InARelationship = "In a Relationship",
}

export enum SocialContext {
    JustMe = "Just Me",
    MyPartner = "My Partner",
    WithFriends = "With Friends",
}

export enum TimeAvailability {
    Under30Mins = "< 30 mins",
    OneToTwoHours = "1-2 hours",
    HalfDay = "Half-day",
    FullDay = "Full-day",
}

export enum Priority {
    High = "High",
    Medium = "Medium",
    Low = "Low",
}

export enum AspirationStatus {
    Active = "Active",
    Paused = "Paused",
    Completed = "Completed",
}

export enum ProactiveSuggestionType {
    Wellness = "Wellness",
    DailyRefresh = "Daily Refresh",
}

export enum ExternalContentType {
    Podcast = "Podcast",
    Book = "Book",
    YouTube = "YouTube Video",
}

export interface UserPreferences {
    enableNotifications: boolean;
    dataSharing: boolean;
    profileVisibility: 'private' | 'friends';
    allowAnalytics: boolean;
    energyDefaults?: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    xp: number;
    gold: number;
}

export interface UserProfile {
    isLoggedIn: boolean;
    username: string | null;
    onboardingCompleted: boolean;
    subscriptionTier: 'Free' | 'Premium';
    trialEndDate: string | null;
    level: number;
    xp: number;
    gold: number;
    streakFreezes: number;
    relationshipStatus: RelationshipStatus;
    partnerUsername: string | null;
    livingSituation: 'together' | 'separately' | null;
    friendUsernames: string[];
    preferences: UserPreferences;
    achievements: string[];
    lastSurveyDate: string | null;
    lastFetchXPDate: string | null;
    createdAt?: string;
}

export interface HabitCompletion {
    date: string;
}

export interface Habit {
    id: string;
    name: string;
    category: HabitCategory;
    difficulty: HabitDifficulty;
    frequency: HabitFrequency;
    reminderTime?: string;
    currentStreak: number;
    longestStreak: number;
    completions: HabitCompletion[];
    lastCompletionDate: string | null;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: InventoryCategory;
    confidence: number;
    interest: InterestLevel;
    description: string;
    shareWithFriends?: boolean;
}

export interface ProactiveSuggestion {
    id: string;
    type: ProactiveSuggestionType;
    title: string;
    question: string;
    answer?: string;
    icon: string;
    link?: string;
    feedback?: 'positive' | 'negative' | null;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
    suggestions?: string[];
    proactiveSuggestion?: ProactiveSuggestion;
}

export interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}

export interface Commitment {
    id: string;
    title: string;
    dueDate: string;
    priority: Priority;
    subtasks: Subtask[];
    completed: boolean;
}

export interface Milestone {
    id: string;
    text: string;
    completed: boolean;
}

export interface Aspiration {
    id: string;
    title: string;
    milestones: Milestone[];
    status: AspirationStatus;
}

export interface Suggestion {
    title: string;
    description: string;
    category: string;
    link?: string;
    icon: 'Inventory' | 'Podcast' | 'Book' | 'YouTube' | 'Local' | 'Spotify' | 'DateNight' | 'Game';
}

export interface SurveyQuestion {
    question: string;
    options: string[];
}

export interface WeeklyReflection {
    id: string;
    user_id: string;
    responses: Record<string, string>;
    created_at: string;
}

export interface WeeklySurvey {
    id: string;
    questions: SurveyQuestion[];
    answers: Record<string, string>;
}

export interface SharedContext {
    partner: AppState | null;
    friends: AppState[];
}

export interface AppState {
    userProfile: UserProfile;
    habits: Habit[];
    hobbies: string[];
    goals: string[];
    inventory: InventoryItem[];
    commitments: Commitment[];
    aspirations: Aspiration[];
    chatHistory: ChatMessage[];
    currentMood: Mood | null;
    socialContext: SocialContext | string | null;
    currentTimeAvailability: TimeAvailability | null;
    isDateNightMode: boolean;
    inventorySuggestions: Suggestion[];
    externalContentSuggestions: Suggestion[];
    musicSuggestions: Suggestion[];
    localActivitySuggestions: Suggestion[];
    miniGameSuggestions: Suggestion[];
    dailyRefresh: ProactiveSuggestion | null;
    isLoading: boolean;
    error: string | null;
    activeScreen: 'Today' | 'Journey' | 'Chat' | 'Profile';
    isSurveyDue: boolean;
    currentWeeklySurvey: WeeklySurvey | null;
    voiceSession: any;
    isVoiceSessionActive: boolean;
    currentTranscription: {
        input: string;
        output: string;
    };
    sharedContext?: SharedContext;
    hobbyToDetail: string | null;
    suggestionsFetchCount: number;
    dailyFetchCount: number;
    dailyFetchCountDate: string | null;
    weeklyReflections?: WeeklyReflection[];
    friendInventoryContext?: 'my' | 'their' | 'both';
}

export interface OnboardingData {
    streaming: string[];
    games: string[];
    gameListText: string;
    goals: string[];
    hobbies: string[];
    inventoryText: string;
}

export interface LifeCompanionData {
    currentUser: string | null;
    users: Record<string, AppState>;
}
