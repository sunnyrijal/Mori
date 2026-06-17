import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { InventoryCategory, InterestLevel, Mood, SocialContext, ChatMessage, InventoryItem, Suggestion, TimeAvailability, AppState, SharedContext, SurveyQuestion } from "@/types";
import { parseAndCategorize, generateInventorySuggestions, generateExternalSuggestions, generateMiniGameSuggestions, generateLocalSuggestions, generateMusicSuggestions, getRandomSpontaneousGame } from "@/services/localSuggestionEngine";

if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
    console.warn("Gemini API key not configured — AI features will be unavailable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || 'paused' });

const PAUSE_GEMINI = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'paused' || process.env.API_KEY === 'paused';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(params: any, retries = 3, backoff = 2000) {
    if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
        throw new Error("MissingAPIKeyError: Gemini API key is not configured.");
    }
    if (PAUSE_GEMINI) {
        throw new Error("Gemini API is currently paused.");
    }
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error: any) {
            const isRateLimit = error?.status === 429 || error?.code === 429 ||
                (error?.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));
            if (isRateLimit && i < retries - 1) {
                console.warn(`Gemini API Rate Limit hit (Attempt ${i + 1}/${retries}). Retrying in ${backoff}ms...`);
                await delay(backoff);
                backoff *= 2;
            } else {
                throw error;
            }
        }
    }
    throw new Error("Gemini API request failed after max retries due to rate limits.");
}

const inventorySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: Object.values(InventoryCategory) },
            confidence: { type: Type.NUMBER },
            interest: { type: Type.STRING, enum: Object.values(InterestLevel) },
            description: { type: Type.STRING },
        },
        required: ["name", "category", "confidence", "interest", "description"],
    },
};



const singleSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        reason: { type: Type.STRING },
        category: { type: Type.STRING },
        duration_minutes: { type: Type.NUMBER }
    },
    required: ["title", "subtitle", "reason", "category", "duration_minutes"]
};

const buildSocialContextPrompt = (userState: AppState, _sharedContext: SharedContext, reflections: any[] = []): string => {
    // LAYER 1 — WHO THEY ARE
    const createdAtStr = userState.userProfile.createdAt;
    const isFirstWeek = createdAtStr && (new Date().getTime() - new Date(createdAtStr).getTime() < 7 * 24 * 60 * 60 * 1000);
    const usageStage = isFirstWeek ? "first week" : "veteran user";

    let layer1 = `LAYER 1 — WHO THEY ARE\n`;
    layer1 += `- Living situation: ${userState.userProfile.livingSituation || 'solo'}\n`;
    if (userState.userProfile.partnerUsername) {
        layer1 += `- Partner name: ${userState.userProfile.partnerUsername}\n`;
    }
    layer1 += `- Energy defaults: ${userState.userProfile.preferences?.energyDefaults || 'flexible'}\n`;
    layer1 += `- Usage stage: ${usageStage}\n`;

    // LAYER 2 — WHAT THEY OWN
    const groupedInv = userState.inventory.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item.name);
        return acc;
    }, {} as Record<string, string[]>);

    let layer2 = `LAYER 2 — WHAT THEY OWN\nYou have access to:\n`;
    if (Object.keys(groupedInv).length === 0) layer2 += `- None listed\n`;
    else {
        for (const [cat, items] of Object.entries(groupedInv)) {
            layer2 += `- ${cat}: ${items.join(', ')}\n`;
        }
    }

    // LAYER 3 — THEIR TASTE PROFILE
    let layer3 = ``;
    if (reflections.length >= 2) {
        const enjoyed: string[] = [];
        const disliked: string[] = [];
        for (const r of reflections) {
            if (r.responses) {
                for (const [title, rating] of Object.entries(r.responses)) {
                    if (typeof rating === 'number' || !isNaN(Number(rating))) {
                        const num = Number(rating);
                        if (num >= 4) enjoyed.push(title);
                        if (num <= 2) disliked.push(title);
                    } else if (typeof rating === 'string') {
                        // fallback if strings were used in responses
                        if (rating.toLowerCase().includes('enjoy') || rating.toLowerCase().includes('great')) enjoyed.push(title);
                    }
                }
            }
        }
        layer3 = `LAYER 3 — THEIR TASTE PROFILE (learned from past reflections):\n`;
        layer3 += `- Activities this person genuinely enjoyed: ${enjoyed.length > 0 ? enjoyed.join(', ') : 'none explicitly rated yet'}\n`;
        layer3 += `- Activities that did not land well: ${disliked.length > 0 ? disliked.join(', ') : 'none explicitly rated yet'}\n`;
        layer3 += `- Current streak: they have completed ${reflections.length} weekly reflections, meaning suggestions should feel increasingly personalized.\n`;
        layer3 += `Use this to bias suggestions toward what has worked before.\n`;
    }

    // LAYER 4 — RIGHT NOW
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = "evening";
    if (hour < 12) timeOfDay = "morning";
    else if (hour < 17) timeOfDay = "afternoon";
    else if (hour > 21) timeOfDay = "late night";

    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const dayOfWeek = isWeekend ? "weekend" : "weeknight";
    
    // Map current mood to energy level roughly
    let energyLevel = userState.currentMood || 'Medium';

    let layer4 = `LAYER 4 — RIGHT NOW\n`;
    layer4 += `- Social context: ${userState.socialContext || 'Solo'}\n`;
    layer4 += `- Energy level: ${energyLevel}\n`;
    layer4 += `- Time of day: ${timeOfDay}\n`;
    layer4 += `- Day of week: ${dayOfWeek}\n`;

    const instructionBlock = `Based on everything above, suggest ONE specific activity for right now. Rules:
- Only use what they already own. Never suggest buying anything.
- Be specific. Not 'watch something on Netflix' — say 'Watch Severance on Apple TV+, it's perfect for low-energy evenings and you own it.'
- Match the energy level precisely. Low energy = passive. High energy = engaged.
- If it's a two-player game and they're solo, skip it.
- Write in second person, warm and calm tone. 3 sentences max.
- End with one sentence explaining why this fits them right now specifically.`;

    return `${layer1}\n${layer2}\n${layer3 ? layer3 + '\n' : ''}${layer4}\n\n${instructionBlock}`;
};

const DAILY_REFRESH_QUESTIONS = [
    // Geography & Nature
    { question: "What country has the most natural lakes in the world?", answer: "Canada — it holds over 60% of the world's freshwater lakes, more than the rest of the world combined." },
    { question: "Which is the world's largest desert?", answer: "Antarctica. It's a cold desert covering 14.2 million km². The Sahara is only the largest hot desert." },
    { question: "What percentage of Earth's surface is covered by ocean?", answer: "About 71%. And yet over 80% of the ocean floor remains unmapped and unexplored." },
    { question: "Which country has the most time zones?", answer: "France — with 12 time zones across its overseas territories, more than any other country including Russia." },
    { question: "What is the world's smallest country by land area?", answer: "Vatican City, at just 0.44 km² — small enough to walk across in about 15 minutes." },
    { question: "Where is the world's highest waterfall?", answer: "Angel Falls in Venezuela — it drops 979 metres (3,212 ft), nearly 20 times the height of Niagara Falls." },
    { question: "Which river flows through the most countries?", answer: "The Danube — it passes through or borders 10 countries across Central and Eastern Europe." },
    { question: "What is the deepest lake on Earth?", answer: "Lake Baikal in Russia, reaching 1,642 metres deep. It holds about 20% of the world's unfrozen surface fresh water." },
    { question: "Which city is both the largest and the most populated in the world by urban area?", answer: "Tokyo, Japan — home to roughly 37 million people in its greater metropolitan area." },
    { question: "What country has the longest coastline?", answer: "Canada, with 202,080 km of coastline — more than twice the next closest country." },
    // Science & Space
    { question: "How long does light from the Sun take to reach Earth?", answer: "About 8 minutes and 20 seconds — so the Sun you see is always slightly in the past." },
    { question: "Which planet has the most moons in our solar system?", answer: "Saturn, with 146 confirmed moons as of 2024 — surpassing Jupiter's 95." },
    { question: "What is the hardest natural substance on Earth?", answer: "Diamond, which scores 10 on the Mohs hardness scale. It can only be scratched by another diamond." },
    { question: "How old is the universe estimated to be?", answer: "Approximately 13.8 billion years — calculated from measurements of the cosmic microwave background radiation." },
    { question: "What is the most abundant element in the universe by mass?", answer: "Hydrogen — it makes up about 74% of all visible matter in the universe." },
    { question: "At what temperature do Celsius and Fahrenheit meet?", answer: "−40 degrees. At −40°C and −40°F, the scales converge at exactly the same point." },
    { question: "What was the first living creature sent to space?", answer: "Laika, a Soviet dog, in 1957 aboard Sputnik 2. She was the first animal to orbit Earth." },
    { question: "How many bones does a newborn baby have?", answer: "Around 270-300 — many more than the 206 adults have, because bones fuse together as we grow." },
    { question: "What is the speed of light?", answer: "299,792,458 metres per second (about 300,000 km/s) — fast enough to circle Earth 7.5 times in one second." },
    { question: "Which planet rotates on its side with an axial tilt of 98 degrees?", answer: "Uranus — it essentially rolls around the Sun on its side, causing extreme 42-year seasons." },
    // History & Culture
    { question: "What year was the printing press invented, and by whom?", answer: "Around 1440, by Johannes Gutenberg in Germany — it transformed literacy, religion, and science across Europe." },
    { question: "Which civilisation built Machu Picchu?", answer: "The Inca Empire, in the 15th century. It sits at 2,430 metres above sea level in the Peruvian Andes." },
    { question: "How long did the Roman Empire last?", answer: "The Western Roman Empire lasted from 27 BC to 476 AD — roughly 500 years. The Eastern Roman (Byzantine) Empire continued until 1453." },
    { question: "What was the first country to give women the right to vote?", answer: "New Zealand in 1893 — over 25 years before the United States and United Kingdom." },
    { question: "How many languages are currently spoken in the world?", answer: "Over 7,100 — though half the world's population speaks only 23 of them as their first language." },
    { question: "Where was the world's first university founded?", answer: "The University of Bologna, in Italy, founded in 1088 — still operating today, over 900 years later." },
    { question: "What was the deadliest war in human history?", answer: "World War II — with an estimated 70–85 million deaths, roughly 3% of the world's population at the time." },
    { question: "Which ancient wonder of the world still exists today?", answer: "The Great Pyramid of Giza — the only surviving structure from the original Seven Wonders of the Ancient World." },
    { question: "When did the Berlin Wall fall?", answer: "November 9, 1989 — after 28 years dividing East and West Berlin, it came down as the Cold War collapsed." },
    { question: "Who was the first person to circumnavigate the globe?", answer: "Juan Sebastián Elcano completed the first circumnavigation in 1522, after Magellan died en route in the Philippines." },
    // Human Body & Health
    { question: "How many cells are in the human body?", answer: "About 37 trillion — and they're outnumbered by bacteria on and inside your body by roughly the same number." },
    { question: "What is the largest organ in the human body?", answer: "The skin — it covers about 2 square metres and accounts for roughly 16% of your body weight." },
    { question: "How long do human red blood cells live?", answer: "About 120 days. Your body produces around 2 million new red blood cells every single second." },
    { question: "Which part of the brain controls balance and coordination?", answer: "The cerebellum — often called the 'little brain', it sits at the back and processes movement signals." },
    { question: "How much blood does the human heart pump per day?", answer: "About 7,570 litres (2,000 gallons) — enough to fill a large swimming pool every week." },
    { question: "What percentage of human DNA is shared with bananas?", answer: "About 60% — all life on Earth shares common genetic ancestry, which is reflected in DNA similarities." },
    // Technology & Innovation
    { question: "When was the World Wide Web invented?", answer: "1989, by Tim Berners-Lee at CERN in Switzerland. It became publicly available in 1991." },
    { question: "What year was the first iPhone released?", answer: "2007, by Steve Jobs at Apple. It combined a phone, iPod, and internet device into one touchscreen device." },
    { question: "How many photos are taken every day worldwide?", answer: "Approximately 1.8 trillion photos per year — that's around 5 billion every single day, mostly on smartphones." },
    { question: "What was the first search engine ever created?", answer: "Archie, in 1990 — it was built to index FTP files. Yahoo and Google came years later." },
    { question: "Which country has the fastest average internet speed in the world?", answer: "As of recent reports, the UAE or Singapore regularly top the charts, exceeding 300 Mbps on average." },
    // Arts, Literature & Music
    { question: "Who painted the Sistine Chapel ceiling?", answer: "Michelangelo, between 1508 and 1512 — lying on his back on scaffolding for four years, largely by himself." },
    { question: "Which Shakespeare play features the line 'To be or not to be'?", answer: "Hamlet — spoken in Act III, Scene I. It's one of the most quoted lines in the English language." },
    { question: "What is the best-selling book of all time?", answer: "The Bible, with an estimated 5 billion copies distributed — making it nearly impossible to accurately rank." },
    { question: "How many symphonies did Beethoven compose?", answer: "Nine — including the iconic Ninth Symphony, which he composed while completely deaf." },
    { question: "Which country invented the piano?", answer: "Italy — Bartolomeo Cristofori of Padua invented the first piano around 1700 in Florence." },
    // Economy & Society
    { question: "Which country consumes the most coffee per capita?", answer: "Finland — Finns drink an average of 12 kg of coffee per person per year, more than any other nation." },
    { question: "What is the most spoken language in the world by total speakers?", answer: "English, with about 1.5 billion total speakers — though Mandarin Chinese has the most native speakers." },
    { question: "Which city has the world's busiest airport?", answer: "Hartsfield-Jackson Atlanta International Airport — it has handled the most passengers annually for over 20 years." },
    { question: "How much food is wasted globally each year?", answer: "About 1.3 billion tonnes — roughly one-third of all food produced for human consumption globally." },
    { question: "What was the first country to introduce a national park?", answer: "The United States — Yellowstone was designated the world's first national park in 1872." },
];

function getFunnyFallbackQuestion(mood?: string | null, socialContext?: string | null, _timeAvailability?: string | null) {
    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / 86400000);

    if (mood === 'Tired') {
        const tiredQ = [
            { question: "Why did the coffee file a police report?", answer: "It got mugged! Just like you might feel right now. Go get a fresh cup!" },
            { question: "Scientists say sleeping is a way of charging your body. What does it make you if you hit snooze 5 times?", answer: "A phone on 1% that refuses to plug in. Sleep is calling, answer it!" },
            { question: "What is the official state of a person who had 3 cups of coffee but is still yawning?", answer: "A caffeine-resistant lifeform. Power down for 10 minutes!" }
        ];
        return tiredQ[dayIndex % tiredQ.length];
    }
    
    if (mood === 'Energized') {
        const energizedQ = [
            { question: "If you have an excessive amount of energy right now, what is the speed limit of a human running on excitement?", answer: "Exactly 1 red bull over the speed limit. Watch out for radar guns!" },
            { question: "What is the term for when you clean the entire house at midnight because of a burst of energy?", answer: "Productive panic. Channel that fire into something fun!" }
        ];
        return energizedQ[dayIndex % energizedQ.length];
    }
    
    if (mood === 'Focused') {
        const focusedQ = [
            { question: "If concentration was a currency, why would reading this question make you slightly poorer?", answer: "Because you just spent 5 seconds of absolute focus reading it. Go focus on your next activity!" }
        ];
        return focusedQ[0];
    }
    
    if (mood === 'Creative') {
        const creativeQ = [
            { question: "Why did the artist go to jail?", answer: "Because they were framed! Keep creating masterpieces (just legally)." }
        ];
        return creativeQ[0];
    }
    
    if (mood === 'Anxious') {
        const anxiousQ = [
            { question: "What did the nervous tomato say to the salad dressing?", answer: "'Don't look, I'm dressing!' Take a deep breath, you've got this!" }
        ];
        return anxiousQ[0];
    }
    
    if (mood === 'Social') {
        const socialQ = [
            { question: "Why do we tell actors to 'break a leg'?", answer: "Because every play has a cast! Go hang out and make some memories with your cast!" }
        ];
        return socialQ[0];
    }

    if (mood === 'Bored') {
        const boredQ = [
            { question: "What is the official state sport of people who are extremely bored at home?", answer: "Opening the fridge every 10 minutes hoping new food has spawned. Spoiler: it hasn't." }
        ];
        return boredQ[0];
    }

    if (mood === 'Motivated') {
        const motivatedQ = [
            { question: "What do you call a motivation speaker who is also a tree?", answer: "A trunk-speaker. Branch out and accomplish your goals today!" }
        ];
        return motivatedQ[0];
    }

    if (socialContext === 'MyPartner' || socialContext === 'Partner') {
        const partnerQ = [
            { question: "Why did the couple go to the gym together?", answer: "Because they wanted their relationship to work out! Have a great time together!" }
        ];
        return partnerQ[0];
    }

    if (socialContext === 'Alone') {
        const aloneQ = [
            { question: "What is the main benefit of being alone right now?", answer: "You don't have to share your snacks or explain why you're watching that video for the fifth time." }
        ];
        return aloneQ[0];
    }

    if (socialContext === 'Friends') {
        const friendsQ = [
            { question: "Why did the three friends go to the restaurant together?", answer: "Because they heard good food tastes 3x better when shared with friends who laugh at your bad jokes." }
        ];
        return friendsQ[0];
    }

    return DAILY_REFRESH_QUESTIONS[dayIndex % DAILY_REFRESH_QUESTIONS.length];
}

export const geminiService = {
    async getDailyRefresh(mood?: string | null, socialContext?: string | null, timeAvailability?: string | null) {
        if (PAUSE_GEMINI) {
            return getFunnyFallbackQuestion(mood, socialContext, timeAvailability);
        }
        try {
            const contextStr = `Current Mood: ${mood || 'Balanced'}, Social Context: ${socialContext || 'Alone'}, Time Available: ${timeAvailability || 'Any'}`;
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Generate a single, funny, and lighthearted trivia question or riddle that relates to the user's current context: ${contextStr}. For example, if they are Tired, ask something funny about sleep or coffee. If they are Social, ask something funny about group psychology, parties, or friendship. Keep it light, engaging, and humorous. Provide a 'question' and a short 'answer'.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING },
                        },
                        required: ["question", "answer"],
                    },
                    temperature: 0.85,
                }
            });
            return JSON.parse(response.text || '{}');
        } catch (error) {
            console.error("Error fetching daily refresh:", error);
            return getFunnyFallbackQuestion(mood, socialContext, timeAvailability);
        }
    },

    async categorizeInventory(text: string) {
        if (PAUSE_GEMINI) {
            return parseAndCategorize(text);
        }
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Analyze the following text which lists a user's items, hobbies, or subscriptions. Categorize each distinct item. Here's the text: "${text}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: inventorySchema,
                }
            });
            return JSON.parse(response.text || '[]');
        } catch (error) {
            console.error("Error categorizing inventory:", error);
            return parseAndCategorize(text);
        }
    },

    async getInventorySuggestions(mood: Mood, socialContext: SocialContext, userState: AppState, sharedContext: SharedContext, timeAvailability: TimeAvailability | null, isDateNight: boolean): Promise<Suggestion[]> {
        if (PAUSE_GEMINI) {
            return generateInventorySuggestions(userState.inventory, userState.hobbies, mood, socialContext, timeAvailability, isDateNight, userState.goals || []);
        }
        const socialPrompt = buildSocialContextPrompt(userState, sharedContext, userState.weeklyReflections);
        const prompt = `You are an expert activity suggestion AI. Based on the user's records:\n\n${socialPrompt}`;
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: singleSuggestionSchema }
            });
            const data = JSON.parse(response.text || '{}');
            const suggestion: Suggestion = {
                title: data.title || "Relaxing moment",
                description: `${data.subtitle || ''}\n\n${data.reason || ''}`.trim(),
                category: data.category || "General",
                icon: isDateNight ? 'DateNight' : 'Inventory'
            };
            return [suggestion];
        } catch (error) {
            console.error("Error getting inventory suggestions:", error);
            return generateInventorySuggestions(userState.inventory, userState.hobbies, mood, socialContext, timeAvailability, isDateNight, userState.goals || []);
        }
    },

    async getExternalContentSuggestions(mood: Mood, _socialContext: SocialContext, userState: AppState, sharedContext: SharedContext, timeAvailability: TimeAvailability | null, isDateNight: boolean): Promise<Suggestion[]> {
        if (PAUSE_GEMINI) {
            return generateExternalSuggestions(mood);
        }
        const socialPrompt = buildSocialContextPrompt(userState, sharedContext, userState.weeklyReflections);
        const prompt = `You are a media discovery AI. Based on the user's records, suggest ONE digital content activity (podcast, video, or book) for someone who is ${mood} with ${timeAvailability} available.\n\n${socialPrompt}`;
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: singleSuggestionSchema }
            });
            const data = JSON.parse(response.text || '{}');
            const suggestion: Suggestion = {
                title: data.title || "Relaxing moment",
                description: `${data.subtitle || ''}\n\n${data.reason || ''}`.trim(),
                category: data.category || "General",
                icon: isDateNight ? 'DateNight' : 'Book'
            };
            return [suggestion];
        } catch (error) {
            console.error("Error getting external content suggestions:", error);
            return generateExternalSuggestions(mood);
        }
    },

    async getMusicSuggestions(mood: Mood): Promise<Suggestion[]> {
        return generateMusicSuggestions(mood);
    },

    async getMiniGameSuggestions(mood: Mood, _socialContext: SocialContext): Promise<Suggestion[]> {
        if (PAUSE_GEMINI) {
            return generateMiniGameSuggestions(mood);
        }
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Suggest ONE specific, free, browser-based mini-game for a user feeling ${mood}. Focus on brain-training, logic puzzles, or relaxing games.`,
                config: { responseMimeType: "application/json", responseSchema: singleSuggestionSchema }
            });
            const data = JSON.parse(response.text || '{}');
            const suggestion: Suggestion = {
                title: data.title || "Game time",
                description: `${data.subtitle || ''}\n\n${data.reason || ''}`.trim(),
                category: data.category || "Game",
                icon: 'Game'
            };
            return [suggestion];
        } catch (error) {
            console.error("Error getting mini game suggestions:", error);
            return generateMiniGameSuggestions(mood);
        }
    },

    async getLocalActivitySuggestions(mood: Mood, socialContext: SocialContext, userLocation: { latitude: number; longitude: number }, userState: AppState, sharedContext: SharedContext, _timeAvailability: TimeAvailability | null, isDateNight: boolean): Promise<Suggestion[]> {
        if (PAUSE_GEMINI) {
            const list = generateLocalSuggestions(mood, socialContext, isDateNight);
            return [...list, getRandomSpontaneousGame()];
        }
        try {
            const socialPrompt = buildSocialContextPrompt(userState, sharedContext, userState.weeklyReflections);
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Find ONE specific local activity for someone feeling ${mood} in a '${socialContext}' context.\n${socialPrompt}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: singleSuggestionSchema,
                    tools: [{ googleMaps: {} }],
                    toolConfig: {
                        retrievalConfig: {
                            latLng: { latitude: userLocation.latitude, longitude: userLocation.longitude }
                        }
                    }
                }
            });
            const text = response.text || '{}';
            const data = JSON.parse(text);
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            
            let link = "";
            if (groundingChunks.length > 0 && groundingChunks[0].maps) {
                link = groundingChunks[0].maps.uri || "";
            }

            const suggestion: Suggestion = {
                title: data.title || "Local outing",
                description: `${data.subtitle || ''}\n\n${data.reason || ''}`.trim(),
                category: data.category || "Local",
                link: link,
                icon: isDateNight ? 'DateNight' : 'Local'
            };
            return [suggestion, getRandomSpontaneousGame()];
        } catch (error) {
            console.error("Error getting local activity suggestions:", error);
            const list = generateLocalSuggestions(mood, socialContext, isDateNight);
            return [...list, getRandomSpontaneousGame()];
        }
    },

    async getChatMessage(history: ChatMessage[], mood: Mood | null, inventory: InventoryItem[], hobbies: string[]) {
        if (PAUSE_GEMINI) {
            const inventoryList = inventory.map(i => i.name).join(', ') || 'nothing added yet';
            const hobbyList = hobbies.join(', ') || 'none listed yet';
            return {
                responseText: `Hi, I am Gozi! Based on your inventory (${inventoryList}) and hobbies (${hobbyList}), I can help you find the perfect activity. What kind of vibe are you going for — something active, creative, relaxing, or social?`,
                suggestions: ["Something relaxing", "Something active", "Something creative", "Something social"],
                newInventoryItems: [],
                newHobbies: [],
            };
        }
        const chatHistory = history.map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `You are Gozi, a supportive AI companion. Help the user decide on an activity based on their inventory and hobbies.\n\nMood: ${mood}\nInventory: ${inventory.map(i => i.name).join(', ')}\nHobbies: ${hobbies.join(', ')}\n\nConversation:\n${chatHistory}\n\nRespond with JSON: { "responseText": "...", "suggestions": ["...", "..."], "newInventoryItems": [], "newHobbies": [] }`;
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            responseText: { type: Type.STRING },
                            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            newInventoryItems: inventorySchema,
                            newHobbies: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["responseText", "suggestions"]
                    }
                }
            });
            return JSON.parse(response.text || '{}');
        } catch (error) {
            console.error("Error getting chat message:", error);
            return { responseText: "I'm having a little trouble connecting right now. Please try again in a moment.", suggestions: [] };
        }
    },

    async getWeeklySurveyQuestions(existingHobbies: string[]): Promise<SurveyQuestion[]> {
        if (PAUSE_GEMINI) {
            return [
                { question: "What is your favorite way to spend a free afternoon?", options: ["Reading or listening to a podcast", "Getting outside for a walk or exercise", "Cooking or trying a new recipe", "Gaming or watching something"] },
                { question: "Which of these sounds most appealing right now?", options: ["A cozy evening at home", "Going out with friends", "A solo adventure", "A creative project"] },
                { question: "What kind of content do you enjoy most?", options: ["Podcasts and audiobooks", "Books", "YouTube and documentaries", "Music"] },
            ];
        }
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Generate 3 engaging multiple-choice questions to learn more about a user's preferences for activity suggestions. Each should have 4 options. User's existing hobbies: ${existingHobbies.join(', ')}.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["question", "options"]
                        }
                    }
                }
            });
            return JSON.parse(response.text || '[]');
        } catch (error) {
            console.error("Error fetching weekly survey:", error);
            return [
                { question: "What is your favorite way to spend a free afternoon?", options: ["Reading or listening to a podcast", "Getting outside for a walk or exercise", "Cooking or trying a new recipe", "Gaming or watching something"] },
                { question: "Which of these sounds most appealing right now?", options: ["A cozy evening at home", "Going out with friends", "A solo adventure", "A creative project"] },
                { question: "What kind of content do you enjoy most?", options: ["Podcasts and audiobooks", "Books", "YouTube and documentaries", "Music"] },
            ];
        }
    },

    async processSurveyAnswers(answers: Record<string, string>, existingHobbies: string[], existingInventory: InventoryItem[]) {
        if (PAUSE_GEMINI) {
            return { newHobbies: [], newInventoryItems: [] };
        }
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Based on these survey answers, extract any new hobbies or inventory items not already listed.\n\nAnswers: ${JSON.stringify(answers)}\nExisting hobbies: ${existingHobbies.join(', ')}\nExisting inventory: ${existingInventory.map(i => i.name).join(', ')}\n\nRespond with { "newHobbies": [], "newInventoryItems": [] }`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            newHobbies: { type: Type.ARRAY, items: { type: Type.STRING } },
                            newInventoryItems: inventorySchema,
                        },
                        required: ["newHobbies", "newInventoryItems"]
                    }
                }
            });
            return JSON.parse(response.text || '{"newHobbies":[],"newInventoryItems":[]}');
        } catch (error) {
            console.error("Error processing survey answers:", error);
            return { newHobbies: [], newInventoryItems: [] };
        }
    },

    async processHobbyDetails(hobby: string, details: string) {
        if (PAUSE_GEMINI) {
            return { newInventoryItems: [] };
        }
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `The user listed "${hobby}" as a hobby with details: "${details}". Extract any specific items or equipment they might own related to this hobby.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { newInventoryItems: inventorySchema },
                        required: ["newInventoryItems"]
                    }
                }
            });
            return JSON.parse(response.text || '{"newInventoryItems":[]}');
        } catch (error) {
            console.error("Error processing hobby details:", error);
            return { newInventoryItems: [] };
        }
    },

    async startLiveSession(callbacks: { onOpen: () => void; onMessage: (msg: LiveServerMessage) => void; onError: (e: Event) => void; onClose: (e: CloseEvent) => void }) {
        if (PAUSE_GEMINI) {
            throw new Error("Voice chat is paused in demo mode.");
        }
        const liveCallbacks = {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        };
        const session = await ai.live.connect({
            model: 'gemini-2.0-flash-live-001',
            config: { responseModalities: [Modality.AUDIO] },
            callbacks: liveCallbacks as any,
        });
        return session;
    },
};
