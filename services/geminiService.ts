import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { InventoryCategory, InterestLevel, Mood, SocialContext, ChatMessage, InventoryItem, Suggestion, TimeAvailability, AppState, SharedContext, SurveyQuestion } from "@/types";
import { parseAndCategorize, generateInventorySuggestions, generateExternalSuggestions, generateMiniGameSuggestions, generateLocalSuggestions, generateMusicSuggestions } from "@/services/localSuggestionEngine";

if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
    console.warn("Gemini API key not configured — AI features will be unavailable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || 'paused' });

const PAUSE_GEMINI = false;

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

const suggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            link: { type: Type.STRING },
        },
        required: ["title", "description", "category", "link"],
    }
};

const buildSocialContextPrompt = (userState: AppState, sharedContext: SharedContext): string => {
    let prompt = `Main user "${userState.userProfile.username}"'s data:\n- Hobbies: ${userState.hobbies.join(', ') || 'None'}\n- Inventory: ${userState.inventory.map(i => i.name).join(', ') || 'None'}\n- Living Situation: ${userState.userProfile.livingSituation || 'Unknown'}\n- Energy Defaults: ${userState.userProfile.preferences?.energyDefaults || 'Unknown'}`;
    if (sharedContext.partner) {
        prompt += `\n\nPartner "${sharedContext.partner.userProfile.username}"'s data:\n- Hobbies: ${sharedContext.partner.hobbies.join(', ') || 'None'}\n- Inventory: ${sharedContext.partner.inventory.map(i => i.name).join(', ') || 'None'}`;
    }
    if (sharedContext.friends.length > 0) {
        sharedContext.friends.forEach(friend => {
            prompt += `\n\nFriend "${friend.userProfile.username}"'s data:\n- Hobbies: ${friend.hobbies.join(', ') || 'None'}\n- Inventory: ${friend.inventory.map(i => i.name).join(', ') || 'None'}`;
        });
    }
    return prompt;
};

export const geminiService = {
    async getDailyRefresh() {
        if (PAUSE_GEMINI) {
            const questions = [
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
            // Use a date-based seed for deterministic daily rotation (same question all day, new one tomorrow)
            const today = new Date();
            const dayIndex = Math.floor(today.getTime() / 86400000);
            const picked = questions[dayIndex % questions.length];
            return picked;
        }
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: "Generate a single, interesting trivia question from general knowledge, geography, science, or history. Provide a 'question' and a short 'answer'.",
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
                    temperature: 0.8,
                }
            });
            return JSON.parse(response.text || '{}');
        } catch (error) {
            console.error("Error fetching daily refresh:", error);
            return { question: "Could not load a question. Try again later!", answer: "" };
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
        const socialPrompt = buildSocialContextPrompt(userState, sharedContext);
        const prompt = `You are an expert activity suggestion AI. Based on the user's inventory and context, suggest 2-4 hyper-specific activities.\n\nMood: ${mood}\nSocial: ${socialContext}\nTime: ${timeAvailability}\nDate Night: ${isDateNight}\nUser Goals: ${(userState.goals || []).join(', ')}\n\nUSER DATA:\n${socialPrompt}`;
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: suggestionsSchema }
            });
            const data = JSON.parse(response.text || '[]');
            return data.map((d: any) => ({ ...d, icon: isDateNight ? 'DateNight' : 'Inventory' }));
        } catch (error) {
            console.error("Error getting inventory suggestions:", error);
            return [{
                title: "Suggestions unavailable",
                description: "Please check your Gemini API key or try again later.",
                category: "System",
                link: "",
                icon: isDateNight ? 'DateNight' : 'Inventory'
            }];
        }
    },

    async getExternalContentSuggestions(mood: Mood, _socialContext: SocialContext, userState: AppState, sharedContext: SharedContext, timeAvailability: TimeAvailability | null, isDateNight: boolean): Promise<Suggestion[]> {
        if (PAUSE_GEMINI) {
            return generateExternalSuggestions(mood);
        }
        const socialPrompt = buildSocialContextPrompt(userState, sharedContext);
        const prompt = `Suggest one podcast, one book, and one YouTube video for a user feeling ${mood} with ${timeAvailability} available.\n\nUSER DATA:\n${socialPrompt}`;
        try {
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: suggestionsSchema }
            });
            const suggestions = JSON.parse(response.text || '[]');
            return suggestions.map((s: any) => {
                let icon: Suggestion['icon'] = 'Book';
                if (s.category === 'Podcast') icon = 'Podcast';
                if (s.category === 'YouTube Video') icon = 'YouTube';
                return { ...s, icon: isDateNight ? 'DateNight' : icon };
            }).slice(0, 3);
        } catch (error) {
            console.error("Error getting external content suggestions:", error);
            return [{
                title: "Suggestions unavailable",
                description: "Please check your Gemini API key or try again later.",
                category: "System",
                link: "",
                icon: 'Book'
            }];
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
                contents: `Suggest 2 specific, free, browser-based mini-games for a user feeling ${mood}. Focus on brain-training, logic puzzles, or relaxing games.`,
                config: { responseMimeType: "application/json", responseSchema: suggestionsSchema }
            });
            const data = JSON.parse(response.text || '[]');
            return data.map((d: any) => ({ ...d, icon: 'Game' }));
        } catch (error) {
            console.error("Error getting mini game suggestions:", error);
            return [{
                title: "Suggestions unavailable",
                description: "Please check your Gemini API key or try again later.",
                category: "System",
                link: "",
                icon: 'Game'
            }];
        }
    },

    async getLocalActivitySuggestions(mood: Mood, socialContext: SocialContext, userLocation: { latitude: number; longitude: number }, userState: AppState, sharedContext: SharedContext, _timeAvailability: TimeAvailability | null, isDateNight: boolean): Promise<Suggestion[]> {
        if (PAUSE_GEMINI) {
            return generateLocalSuggestions(mood, socialContext, isDateNight);
        }
        try {
            const socialPrompt = buildSocialContextPrompt(userState, sharedContext);
            const response = await generateWithRetry({
                model: 'gemini-2.5-flash',
                contents: `Find 2-3 specific local activities for someone feeling ${mood} in a '${socialContext}' context.\n${socialPrompt}`,
                config: {
                    tools: [{ googleMaps: {} }],
                    toolConfig: {
                        retrievalConfig: {
                            latLng: { latitude: userLocation.latitude, longitude: userLocation.longitude }
                        }
                    }
                }
            });
            const text = response.text || '';
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const suggestions: Suggestion[] = [];
            if (groundingChunks.length > 0) {
                for (const chunk of groundingChunks) {
                    if (chunk.maps) {
                        suggestions.push({
                            title: chunk.maps.title || 'Nearby Activity',
                            description: `A great local spot for a ${mood} day.`,
                            category: (chunk.maps as any).placeSubtypes?.[0] || 'Local Activity',
                            link: chunk.maps.uri,
                            icon: isDateNight ? 'DateNight' : 'Local'
                        });
                    }
                }
            }
            if (suggestions.length === 0 && text) {
                const lines = text.split('\n');
                const regex = /-\s*\*\*(.*?):\*\*\s*(.*)/;
                for (const line of lines) {
                    const match = line.match(regex);
                    if (match) {
                        suggestions.push({ title: match[1].trim(), description: match[2].trim(), category: "Local Activity", icon: isDateNight ? 'DateNight' : 'Local' });
                    }
                }
            }
            return suggestions.length > 0 ? suggestions.slice(0, 3) : [{
                title: "Suggestions unavailable",
                description: "Please check your Gemini API key or try again later.",
                category: "System",
                link: "",
                icon: 'Local'
            }];
        } catch (error) {
            console.error("Error getting local activity suggestions:", error);
            return [{
                title: "Suggestions unavailable",
                description: "Please check your Gemini API key or try again later.",
                category: "System",
                link: "",
                icon: 'Local'
            }];
        }
    },

    async getChatMessage(history: ChatMessage[], mood: Mood | null, inventory: InventoryItem[], hobbies: string[]) {
        if (PAUSE_GEMINI) {
            const inventoryList = inventory.map(i => i.name).join(', ') || 'nothing added yet';
            const hobbyList = hobbies.join(', ') || 'none listed yet';
            return {
                responseText: `Based on your inventory (${inventoryList}) and hobbies (${hobbyList}), I can help you find the perfect activity. What kind of vibe are you going for — something active, creative, relaxing, or social?`,
                suggestions: ["Something relaxing", "Something active", "Something creative", "Something social"],
                newInventoryItems: [],
                newHobbies: [],
            };
        }
        const chatHistory = history.map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `You are a supportive life companion AI. Help the user decide on an activity based on their inventory and hobbies.\n\nMood: ${mood}\nInventory: ${inventory.map(i => i.name).join(', ')}\nHobbies: ${hobbies.join(', ')}\n\nConversation:\n${chatHistory}\n\nRespond with JSON: { "responseText": "...", "suggestions": ["...", "..."], "newInventoryItems": [], "newHobbies": [] }`;
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
            return [];
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
