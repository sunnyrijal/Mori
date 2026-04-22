import { Mood, SocialContext, TimeAvailability, InventoryCategory, InterestLevel, Suggestion, InventoryItem } from '../types';

// --- Category Detection via Keywords ---

const CATEGORY_KEYWORDS: Record<InventoryCategory, string[]> = {
  [InventoryCategory.Entertainment]: [
    'netflix', 'hulu', 'disney', 'hbo', 'max', 'prime video', 'amazon prime', 'apple tv', 'peacock',
    'crunchyroll', 'paramount', 'showtime', 'streaming', 'youtube premium', 'twitch',
    'playstation', 'ps4', 'ps5', 'xbox', 'nintendo', 'switch', 'steam', 'pc gaming',
    'video game', 'gaming console', 'headphones', 'speakers', 'bluetooth speaker', 'vinyl', 'record player',
    'smart tv', 'projector', 'airpods', 'soundbar', 'earbuds',
  ],
  [InventoryCategory.FoodAndCooking]: [
    'instant pot', 'air fryer', 'blender', 'coffee machine', 'keurig', 'nespresso', 'espresso',
    'coffee maker', 'barbecue', 'bbq', 'grill', 'wok', 'cookbook', 'mixer',
    'food processor', 'sous vide', 'dutch oven', 'cast iron', 'knife set', 'cutting board',
    'slow cooker', 'rice cooker', 'toaster oven', 'waffle maker', 'stand mixer',
  ],
  [InventoryCategory.Beverages]: [
    'wine', 'beer', 'whiskey', 'bourbon', 'scotch', 'cocktail', 'spirits', 'liquor', 'bar cart',
    'kombucha', 'tea set', 'matcha', 'juicer', 'wine glass', 'cocktail shaker', 'bar tools',
  ],
  [InventoryCategory.HobbiesAndCrafts]: [
    'guitar', 'piano', 'keyboard', 'ukulele', 'violin', 'drums', 'bass', 'instrument',
    'paint', 'canvas', 'easel', 'sketch', 'drawing', 'art supply', 'watercolor', 'acrylic',
    'knitting', 'crochet', 'sewing', 'embroidery', 'pottery', 'ceramic', 'clay',
    'photography', 'camera', 'dslr', 'mirrorless', 'lens',
    'kindle', 'e-reader', 'journal', 'notebook',
    'lego', 'puzzle', 'model kit', 'board game', 'card game', 'chess', 'checkers',
    'garden', 'plant', 'succulent', 'bonsai', 'terrarium', 'aquarium',
  ],
  [InventoryCategory.HealthAndFitness]: [
    'yoga mat', 'yoga block', 'yoga strap', 'weights', 'dumbbell', 'barbell', 'kettlebell',
    'bicycle', 'bike', 'treadmill', 'elliptical', 'rowing machine', 'stationary bike',
    'running shoe', 'sneakers', 'resistance band', 'pull-up bar', 'jump rope',
    'foam roller', 'massage gun', 'meditation cushion', 'pilates',
    'tennis racket', 'golf club', 'basketball', 'soccer ball', 'football',
    'hiking boot', 'backpack', 'climbing', 'skis', 'snowboard', 'skateboard', 'surfboard',
    'kayak', 'paddle', 'frisbee', 'baseball', 'badminton', 'racket',
  ],
  [InventoryCategory.WorkAndProductivity]: [
    'laptop', 'macbook', 'monitor', 'desk', 'standing desk', 'office chair',
    'notebook', 'planner', 'whiteboard', 'tablet', 'ipad', 'wacom',
    'mechanical keyboard', 'webcam', 'microphone', 'printer', 'scanner',
  ],
  [InventoryCategory.SocialActivities]: [
    'instagram', 'tiktok', 'twitter', 'x (twitter)', 'facebook', 'reddit', 'discord', 'linkedin',
  ],
  [InventoryCategory.ShoppingAndErrands]: [
    'amazon', 'costco', 'membership', 'subscription box',
  ],
  [InventoryCategory.Other]: [],
};

export function detectCategory(itemName: string): InventoryCategory {
  const lower = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category as InventoryCategory;
    }
  }
  return InventoryCategory.Other;
}

function getItemDescription(category: InventoryCategory): string {
  const map: Partial<Record<InventoryCategory, string>> = {
    [InventoryCategory.Entertainment]: 'Perfect for relaxing and enjoying great content.',
    [InventoryCategory.FoodAndCooking]: 'Great for trying new recipes and enjoying a homemade meal.',
    [InventoryCategory.Beverages]: 'Enjoy a great drink experience.',
    [InventoryCategory.HobbiesAndCrafts]: 'A fulfilling way to express creativity and have fun.',
    [InventoryCategory.HealthAndFitness]: 'Keep your body and mind in great shape.',
    [InventoryCategory.WorkAndProductivity]: 'A tool to help you stay sharp and productive.',
    [InventoryCategory.Other]: 'Part of your personal collection.',
  };
  return map[category] || 'Part of your inventory.';
}

export function parseAndCategorize(text: string): Array<{ name: string; category: InventoryCategory; confidence: number; interest: InterestLevel; description: string }> {
  const items: Array<{ name: string; category: InventoryCategory; confidence: number; interest: InterestLevel; description: string }> = [];

  const sectionPatterns: Array<{ prefix: RegExp; category: InventoryCategory | null }> = [
    { prefix: /^streaming:\s*/i, category: InventoryCategory.Entertainment },
    { prefix: /^games?:\s*/i, category: InventoryCategory.Entertainment },
    { prefix: /^specific games?:\s*/i, category: InventoryCategory.Entertainment },
    { prefix: /^other:\s*/i, category: null },
  ];

  const sections = text.split(/\.\s*|\n/).filter(Boolean);

  for (const section of sections) {
    let sectionCategory: InventoryCategory | null = null;
    let remainingText = section.trim();

    for (const pattern of sectionPatterns) {
      if (pattern.prefix.test(remainingText)) {
        sectionCategory = pattern.category;
        remainingText = remainingText.replace(pattern.prefix, '');
        break;
      }
    }

    const rawItems = remainingText.split(',').map(s => s.trim()).filter(s => s.length > 1 && !/^n\/?a$/i.test(s) && !/^none$/i.test(s));

    for (const rawItem of rawItems) {
      if (!rawItem) continue;
      const category = sectionCategory ?? detectCategory(rawItem);
      if (category === InventoryCategory.SocialActivities) continue;

      items.push({
        name: rawItem,
        category,
        confidence: 0.9,
        interest: InterestLevel.Medium,
        description: getItemDescription(category),
      });
    }
  }

  return items.filter((item, idx, self) =>
    idx === self.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase())
  );
}

// --- Item selectors ---

function getStreamingItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i =>
    ['netflix', 'hulu', 'disney', 'max', 'prime', 'apple tv', 'peacock', 'crunchyroll', 'paramount', 'youtube premium', 'showtime', 'twitch', 'streaming'].some(kw => i.name.toLowerCase().includes(kw))
  );
}
function getGamingItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i =>
    ['playstation', 'ps4', 'ps5', 'xbox', 'nintendo', 'switch', 'steam', 'pc gaming', 'gaming'].some(kw => i.name.toLowerCase().includes(kw))
  );
}
function getBoardGameItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i =>
    ['board game', 'card game', 'chess', 'checkers', 'catan', 'monopoly', 'scrabble', 'risk', 'ticket to ride', 'codenames'].some(kw => i.name.toLowerCase().includes(kw))
  );
}
function getMusicItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i =>
    ['guitar', 'piano', 'keyboard', 'ukulele', 'violin', 'drums', 'bass', 'instrument', 'vinyl', 'record player'].some(kw => i.name.toLowerCase().includes(kw))
  );
}
function getFitnessItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i => i.category === InventoryCategory.HealthAndFitness);
}
function getCookingItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i => i.category === InventoryCategory.FoodAndCooking || i.category === InventoryCategory.Beverages);
}
function getCraftItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i =>
    ['paint', 'canvas', 'sketch', 'draw', 'art', 'watercolor', 'acrylic', 'knitting', 'crochet', 'sewing', 'pottery', 'clay', 'journal', 'lego', 'puzzle', 'camera', 'photography'].some(kw => i.name.toLowerCase().includes(kw))
  );
}

// --- Inventory Suggestions ---

const STREAMING_DESCRIPTIONS: Record<string, string> = {
  [Mood.Tired]: 'Queue up something easy and feel-good — you deserve an effortless evening.',
  [Mood.Bored]: 'Find a new series to sink into. There\'s always something fresh worth discovering.',
  [Mood.Social]: 'Pick something everyone in the room can enjoy together.',
  [Mood.Anxious]: 'Put on a familiar show you know you love — comfort viewing at its best.',
  [Mood.Reflective]: 'Find a documentary or character-driven drama that makes you think.',
  [Mood.Creative]: 'Watch a documentary about art, design, or filmmaking for inspiration.',
  default: 'Discover something fresh and highly rated tonight.',
};

// Maps goal IDs to suggestion categories that should be promoted
const GOAL_CATEGORY_MAP: Record<string, string[]> = {
  'active': ['Health & Fitness'],
  'learn': ['Learning', 'Book', 'Podcast'],
  'creative': ['Creative', 'Music'],
  'relax': ['Entertainment', 'Wellness'],
  'social': ['Social', 'Date Night'],
  'explore': ['Local Activity', 'Outdoor'],
  'habits': ['Health & Fitness', 'Wellness'],
  'music': ['Music'],
  'cook': ['Food & Cooking'],
  'read': ['Book', 'Podcast', 'Learning'],
  'fun': ['Gaming', 'Entertainment'],
  'balance': ['Wellness', 'Mindfulness'],
};

function getGoalBoostCategories(goals: string[]): Set<string> {
  const boosted = new Set<string>();
  for (const goal of goals) {
    for (const [key, cats] of Object.entries(GOAL_CATEGORY_MAP)) {
      if (goal.toLowerCase().includes(key)) {
        cats.forEach(c => boosted.add(c));
      }
    }
  }
  return boosted;
}

function getGoalFallbacks(goals: string[], _mood: Mood, shortTime: boolean): Suggestion[] {
  const extra: Suggestion[] = [];
  const g = goals.map(x => x.toLowerCase()).join(' ');
  if (g.includes('learn') || g.includes('new skill')) {
    extra.push({ title: shortTime ? "Watch a 10-minute tutorial on something you're curious about" : "Spend 30 minutes on a skill you've been meaning to pick up", description: "Even a small investment in learning compounds over time. Pick one topic and start.", category: 'Learning', link: 'https://www.youtube.com/results?search_query=learn+something+new+tutorial', icon: 'Inventory' });
  }
  if (g.includes('habit') || g.includes('routine')) {
    extra.push({ title: 'Set up one new small habit for tomorrow', description: "Write down a single habit you want to build and exactly when you'll do it. Specificity is everything.", category: 'Wellness', link: '', icon: 'Inventory' });
  }
  if (g.includes('explor') || g.includes('outdoor') || g.includes('world')) {
    extra.push({ title: shortTime ? "Take a walk somewhere you haven't been recently" : 'Plan a short local adventure for this week', description: 'New surroundings reset your perspective in a way nothing else does.', category: 'Local Activity', link: '', icon: 'Inventory' });
  }
  if (g.includes('read') || g.includes('reflect') || g.includes('think')) {
    extra.push({ title: shortTime ? "Read one article on a topic you've been curious about" : 'Sit down with a book for 30 minutes', description: 'Uninterrupted reading is one of the most underrated things you can do for yourself.', category: 'Book', link: '', icon: 'Inventory' });
  }
  if (g.includes('balanc') || g.includes('calm') || g.includes('peace')) {
    extra.push({ title: 'Try a 5-minute breathing exercise right now', description: 'Box breathing or 4-7-8 breathing can shift your nervous system in minutes.', category: 'Mindfulness', link: 'https://www.youtube.com/results?search_query=5+minute+breathing+exercise', icon: 'Inventory' });
  }
  return extra;
}

export function generateInventorySuggestions(
  inventory: InventoryItem[],
  hobbies: string[],
  mood: Mood,
  socialContext: SocialContext,
  timeAvailability: TimeAvailability | null,
  isDateNight: boolean,
  goals: string[] = [],
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const shortTime = timeAvailability === TimeAvailability.Under30Mins;

  if (isDateNight && socialContext === SocialContext.MyPartner) {
    const streaming = getStreamingItems(inventory);
    const cooking = getCookingItems(inventory);
    const boardGames = getBoardGameItems(inventory);
    if (streaming.length > 0) suggestions.push({ title: `Watch a romantic film on ${streaming[0].name}`, description: 'Dim the lights, queue something great, and make it a proper date night in.', category: 'Date Night', link: '', icon: 'DateNight' });
    if (cooking.length > 0) suggestions.push({ title: `Cook a special dinner together using your ${cooking[0].name}`, description: 'Cooking side by side is one of the most fun and intimate things you can do.', category: 'Date Night', link: '', icon: 'DateNight' });
    if (boardGames.length > 0) suggestions.push({ title: `Play a game of ${boardGames[0].name} together`, description: 'A little friendly competition always makes for a great evening.', category: 'Date Night', link: '', icon: 'DateNight' });
    if (suggestions.length === 0) suggestions.push({ title: 'Plan a cozy evening at home', description: 'Light some candles, put on your favorite playlist, and enjoy each other\'s company.', category: 'Date Night', link: '', icon: 'DateNight' });
    return suggestions.slice(0, 3);
  }

  if (socialContext === SocialContext.WithFriends) {
    const boardGames = getBoardGameItems(inventory);
    const gaming = getGamingItems(inventory);
    const cooking = getCookingItems(inventory);
    const streaming = getStreamingItems(inventory);
    if (boardGames.length > 0) suggestions.push({ title: `Get a game of ${boardGames[0].name} going`, description: 'Easy to set up and always brings good energy to a group.', category: 'Social', link: '', icon: 'Inventory' });
    if (gaming.length > 0 && !shortTime) suggestions.push({ title: `Host a multiplayer session on ${gaming[0].name}`, description: 'Fire up a multiplayer game and see who comes out on top tonight.', category: 'Gaming', link: '', icon: 'Inventory' });
    if (cooking.length > 0 && !shortTime) suggestions.push({ title: `Cook a group meal together using your ${cooking[0].name}`, description: 'Everyone pitches in — cooking together is always more fun than cooking alone.', category: 'Food & Cooking', link: '', icon: 'Inventory' });
    if (streaming.length > 0) suggestions.push({ title: `Pick a movie on ${streaming[0].name} to watch together`, description: 'Everyone nominates their top pick, vote on it, and settle in.', category: 'Entertainment', link: '', icon: 'Inventory' });
    if (suggestions.length === 0) suggestions.push({ title: 'Have a low-key hangout', description: 'Sometimes the best times are unplanned. Put phones down and just enjoy the company.', category: 'Social', link: '', icon: 'Inventory' });
    return suggestions.slice(0, 3);
  }

  // Solo mode
  const streaming = getStreamingItems(inventory);
  if (streaming.length > 0) {
    suggestions.push({ title: `Settle in with something on ${streaming[0].name}`, description: STREAMING_DESCRIPTIONS[mood] || STREAMING_DESCRIPTIONS.default, category: 'Entertainment', link: '', icon: 'Inventory' });
  }

  const fitnessItems = getFitnessItems(inventory);
  if (fitnessItems.length > 0) {
    const isRelaxMood = [Mood.Tired, Mood.Anxious].includes(mood);
    suggestions.push({
      title: isRelaxMood ? `Gentle stretch using your ${fitnessItems[0].name}` : `Quick workout with your ${fitnessItems[0].name}`,
      description: isRelaxMood ? 'A slow, gentle session to help your body feel lighter and more at ease.' : 'Short on time but high on impact — a focused session will change your entire day.',
      category: 'Health & Fitness',
      link: '',
      icon: 'Inventory',
    });
  }

  const cookingItems = getCookingItems(inventory);
  if (cookingItems.length > 0 && !shortTime) {
    const isEasyMood = [Mood.Tired, Mood.Balanced].includes(mood);
    suggestions.push({
      title: isEasyMood ? `Make a simple, satisfying meal with your ${cookingItems[0].name}` : `Try a new recipe with your ${cookingItems[0].name}`,
      description: isEasyMood ? 'Nothing fancy — just something warm and homemade that hits the spot.' : 'Browse a recipe you\'ve never made before and give it a proper go.',
      category: 'Food & Cooking',
      link: '',
      icon: 'Inventory',
    });
  }

  const musicItems = getMusicItems(inventory);
  if (musicItems.length > 0) {
    const isCreative = [Mood.Creative, Mood.Energized, Mood.Motivated].includes(mood);
    suggestions.push({
      title: isCreative ? `Learn a new song on your ${musicItems[0].name}` : `Spend 30 minutes with your ${musicItems[0].name}`,
      description: isCreative ? 'Pick a song you love and work through it — the progress will feel great.' : 'No pressure to perform. Just play whatever comes naturally.',
      category: 'Music',
      link: '',
      icon: 'Inventory',
    });
  }

  const craftItems = getCraftItems(inventory);
  if (craftItems.length > 0) {
    suggestions.push({
      title: `Spend some time on your ${craftItems[0].name}`,
      description: 'No pressure to create a masterpiece — just enjoy the process and see where it goes.',
      category: 'Creative',
      link: '',
      icon: 'Inventory',
    });
  }

  const gamingItems = getGamingItems(inventory);
  if (gamingItems.length > 0) {
    const isRelax = [Mood.Tired, Mood.Anxious, Mood.Balanced].includes(mood);
    suggestions.push({
      title: isRelax ? `Wind down with a relaxing game on ${gamingItems[0].name}` : `Jump into a session on ${gamingItems[0].name}`,
      description: isRelax ? 'Something calm and exploratory — no pressure, just play.' : 'Pick up where you left off, or start something completely new.',
      category: 'Gaming',
      link: '',
      icon: 'Inventory',
    });
  }

  // Hobby fallback
  if (suggestions.length === 0 && hobbies.length > 0) {
    suggestions.push({
      title: `Spend some time on ${hobbies[0]}`,
      description: `You listed ${hobbies[0]} as one of your interests — now is a great time to enjoy it.`,
      category: 'Hobby',
      link: '',
      icon: 'Inventory',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({ title: 'Take a moment for yourself', description: 'Sometimes the most productive thing you can do is nothing at all. Recharge.', category: 'Wellness', link: '', icon: 'Inventory' });
  }

  // Inject goal-specific suggestions for goals that have no inventory match
  if (goals.length > 0) {
    const fallbacks = getGoalFallbacks(goals, mood, shortTime);
    suggestions.push(...fallbacks);
  }

  // Promote goal-aligned suggestions to the front
  if (goals.length > 0) {
    const boosted = getGoalBoostCategories(goals);
    suggestions.sort((a, b) => {
      const aBoost = boosted.has(a.category) ? -1 : 0;
      const bBoost = boosted.has(b.category) ? -1 : 0;
      return aBoost - bBoost;
    });
  }

  return suggestions.slice(0, 4);
}

// --- External Content ---

const EXTERNAL_CONTENT: Record<string, Suggestion[]> = {
  [Mood.Tired]: [
    { title: 'The Daily — NYT Podcast', description: 'Catch up on what\'s happening in the world in 20 minutes — no effort required.', category: 'Podcast', link: 'https://www.nytimes.com/column/the-daily', icon: 'Podcast' },
    { title: '"Why We Sleep" by Matthew Walker', description: 'Learn the science of sleep and how it affects every aspect of your life.', category: 'Book', link: 'https://www.google.com/search?q=why+we+sleep+matthew+walker', icon: 'Book' },
    { title: 'Chillhop Music — Lofi Radio', description: 'Perfect background music for a quiet, relaxed evening. Just let it play.', category: 'YouTube', link: 'https://www.youtube.com/c/ChillhopMusic', icon: 'YouTube' },
  ],
  [Mood.Energized]: [
    { title: 'How I Built This — Guy Raz', description: 'Hear how founders built iconic companies from nothing. Genuinely inspiring.', category: 'Podcast', link: 'https://www.npr.org/podcasts/510313/how-i-built-this', icon: 'Podcast' },
    { title: '"Atomic Habits" by James Clear', description: 'The most practical book on building good habits and breaking bad ones.', category: 'Book', link: 'https://www.google.com/search?q=atomic+habits+james+clear', icon: 'Book' },
    { title: 'Mark Rober — Engineering & Science', description: 'Satisfyingly clever engineering projects that will make you want to build something.', category: 'YouTube', link: 'https://www.youtube.com/c/MarkRober', icon: 'YouTube' },
  ],
  [Mood.Creative]: [
    { title: 'Creative Pep Talk Podcast', description: 'Practical inspiration for creative people. Great episodes on finding your creative voice.', category: 'Podcast', link: 'https://www.google.com/search?q=creative+pep+talk+podcast', icon: 'Podcast' },
    { title: '"Big Magic" by Elizabeth Gilbert', description: 'A liberating look at creativity — why doing creative work matters and how to start.', category: 'Book', link: 'https://www.google.com/search?q=big+magic+elizabeth+gilbert', icon: 'Book' },
    { title: 'Kurzgesagt — In a Nutshell', description: 'Beautifully animated explainers on fascinating topics. Great for sparking ideas.', category: 'YouTube', link: 'https://www.youtube.com/@kurzgesagt', icon: 'YouTube' },
  ],
  [Mood.Focused]: [
    { title: 'Deep Questions with Cal Newport', description: 'Episodes on how to work deeply, think clearly, and design a meaningful life.', category: 'Podcast', link: 'https://www.thedeeplife.com/listen/', icon: 'Podcast' },
    { title: '"Deep Work" by Cal Newport', description: 'A compelling case for why focused, uninterrupted work is the most valuable skill today.', category: 'Book', link: 'https://www.google.com/search?q=deep+work+cal+newport', icon: 'Book' },
    { title: 'Brain.fm Focus Music', description: 'Science-based music designed to help you enter a flow state quickly.', category: 'YouTube', link: 'https://www.youtube.com/results?search_query=brain.fm+focus+music', icon: 'YouTube' },
  ],
  [Mood.Anxious]: [
    { title: 'Ten Percent Happier with Dan Harris', description: 'Down-to-earth conversations about meditation and managing anxiety. Very approachable.', category: 'Podcast', link: 'https://www.tenpercent.com/podcast', icon: 'Podcast' },
    { title: '"The Untethered Soul" by Michael Singer', description: 'A gentle guide to freeing yourself from anxious thoughts and living in the moment.', category: 'Book', link: 'https://www.google.com/search?q=the+untethered+soul+michael+singer', icon: 'Book' },
    { title: 'Headspace Guided Meditation', description: 'A 10-minute guided session to calm your mind and breathe with intention.', category: 'YouTube', link: 'https://www.youtube.com/results?search_query=headspace+guided+meditation+10+minutes', icon: 'YouTube' },
  ],
  [Mood.Reflective]: [
    { title: 'On Being with Krista Tippett', description: 'Deep, thoughtful conversations on meaning, life, and the human experience.', category: 'Podcast', link: 'https://onbeing.org/series/podcast/', icon: 'Podcast' },
    { title: '"Man\'s Search for Meaning" by Viktor Frankl', description: 'A powerful, short book about finding purpose even in the most difficult circumstances.', category: 'Book', link: 'https://www.google.com/search?q=mans+search+for+meaning+frankl', icon: 'Book' },
    { title: 'Vsauce — Mind-bending Philosophy', description: 'Big questions about existence, consciousness, and the universe — perfect for a reflective mood.', category: 'YouTube', link: 'https://www.youtube.com/@Vsauce', icon: 'YouTube' },
  ],
  [Mood.Social]: [
    { title: 'SmartLess — Jason Bateman & Friends', description: 'A hilarious celebrity interview podcast — great background while hanging out.', category: 'Podcast', link: 'https://www.smartless.com/', icon: 'Podcast' },
    { title: '"The Art of Gathering" by Priya Parker', description: 'Why some gatherings are transformative and others fall flat. A fascinating read.', category: 'Book', link: 'https://www.google.com/search?q=the+art+of+gathering+priya+parker', icon: 'Book' },
    { title: 'Bon Appétit — Cooking Videos', description: 'Fun cooking inspiration — great for planning what to make together.', category: 'YouTube', link: 'https://www.youtube.com/@bonappetit', icon: 'YouTube' },
  ],
  [Mood.Bored]: [
    { title: 'Conan O\'Brien Needs a Friend', description: 'Genuinely funny and unpredictable — great for killing time and laughing a lot.', category: 'Podcast', link: 'https://www.earwolf.com/show/conan-obrien-needs-a-friend/', icon: 'Podcast' },
    { title: '"Project Hail Mary" by Andy Weir', description: 'A ridiculously fun sci-fi novel that\'s completely impossible to put down.', category: 'Book', link: 'https://www.google.com/search?q=project+hail+mary+andy+weir', icon: 'Book' },
    { title: 'Tom Scott — Fascinating Places & Facts', description: 'Short, eye-opening videos about obscure-but-interesting things in the world.', category: 'YouTube', link: 'https://www.youtube.com/@TomScottGo', icon: 'YouTube' },
  ],
  [Mood.Motivated]: [
    { title: 'The Tim Ferriss Show', description: 'Interviews with world-class performers — always leaves you with actionable ideas.', category: 'Podcast', link: 'https://tim.blog/podcast/', icon: 'Podcast' },
    { title: '"Can\'t Hurt Me" by David Goggins', description: 'An unfiltered story of extreme mental toughness that will make you want to push harder.', category: 'Book', link: 'https://www.google.com/search?q=cant+hurt+me+david+goggins', icon: 'Book' },
    { title: 'Improvement Pill — Self Improvement', description: 'Short, well-researched videos on building better habits and improving every area of life.', category: 'YouTube', link: 'https://www.youtube.com/@ImprovementPill', icon: 'YouTube' },
  ],
  [Mood.Balanced]: [
    { title: 'Hidden Brain with Shankar Vedantam', description: 'Fascinating behavioral science explained simply. Every episode teaches you something new.', category: 'Podcast', link: 'https://hiddenbrain.org/', icon: 'Podcast' },
    { title: '"Educated" by Tara Westover', description: 'An extraordinary memoir about self-discovery, family, and the power of education.', category: 'Book', link: 'https://www.google.com/search?q=educated+tara+westover', icon: 'Book' },
    { title: 'Wendover Productions — How the World Works', description: 'Well-researched explainers on logistics, society, and systems. Endlessly interesting.', category: 'YouTube', link: 'https://www.youtube.com/@Wendover', icon: 'YouTube' },
  ],
};

export function generateExternalSuggestions(mood: Mood): Suggestion[] {
  return (EXTERNAL_CONTENT[mood] || EXTERNAL_CONTENT[Mood.Balanced]).slice(0, 3);
}

// --- Spotify Music Suggestions ---

function spotifySuggestion(title: string, description: string, searchQuery: string): Suggestion {
  return {
    title,
    description,
    category: 'Music',
    link: `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`,
    icon: 'Spotify',
  };
}

const SPOTIFY_SUGGESTIONS: Record<string, Suggestion[]> = {
  [Mood.Energized]: [
    spotifySuggestion('Post Malone — Top Tracks', 'High-energy bangers from one of the most streamed artists alive. Great for an energized state.', 'Post Malone top tracks'),
    spotifySuggestion('Workout Energy Playlist', 'High-BPM anthems and adrenaline-pumping tracks to keep you moving.', 'workout energy playlist hip hop'),
    spotifySuggestion('Doja Cat — Hot Pink', 'Fun, unapologetic, and impossible not to dance to.', 'Doja Cat Hot Pink'),
  ],
  [Mood.Focused]: [
    spotifySuggestion('Lofi Hip Hop — Chill Beats', 'The gold standard for focus music. Steady rhythm, no lyrics, zero distractions.', 'lofi hip hop chill beats study'),
    spotifySuggestion('Brian Eno — Ambient 1: Music for Airports', 'The original ambient masterpiece. Designed to fill a space without demanding attention.', 'Brian Eno Ambient 1'),
    spotifySuggestion('Hans Zimmer — Interstellar OST', 'Cinematic, expansive, and perfect for deep work sessions.', 'Hans Zimmer Interstellar soundtrack'),
  ],
  [Mood.Creative]: [
    spotifySuggestion('Tame Impala — Currents', 'Psychedelic pop that opens your mind and keeps ideas flowing.', 'Tame Impala Currents'),
    spotifySuggestion('Indie Creative Mix', 'A mix of indie, alternative, and art-pop from artists who make music on their own terms.', 'indie creative playlist alternative'),
    spotifySuggestion('Bon Iver — For Emma, Forever Ago', 'Raw, intimate, and deeply creative. Perfect for artistic work.', 'Bon Iver For Emma Forever Ago'),
  ],
  [Mood.Tired]: [
    spotifySuggestion('Frank Ocean — Blonde', 'Soft, soulful, and emotionally rich. Perfect for a tired evening.', 'Frank Ocean Blonde'),
    spotifySuggestion('Acoustic Chill Playlist', 'Gentle acoustic tracks — nothing demanding, just warmth and calm.', 'acoustic chill playlist evening'),
    spotifySuggestion('Rex Orange County — Pony', 'Warm, lo-fi pop with a bedroom feel. Easy listening at its best.', 'Rex Orange County Pony'),
  ],
  [Mood.Anxious]: [
    spotifySuggestion('Calm Ambient Mix', 'Slow, atmospheric music designed to lower your heart rate and ease tension.', 'calm ambient relaxing music'),
    spotifySuggestion('Bon Iver — Holocene', 'One of the most calming songs ever recorded. Let it wash over you.', 'Bon Iver Holocene'),
    spotifySuggestion('Sufjan Stevens — Carrie & Lowell', 'Delicate, tender, and quietly beautiful. Deeply soothing.', 'Sufjan Stevens Carrie and Lowell'),
  ],
  [Mood.Reflective]: [
    spotifySuggestion('Iron & Wine — Our Endless Numbered Days', 'Hushed folk ballads for sitting quietly with your thoughts.', 'Iron and Wine Our Endless Numbered Days'),
    spotifySuggestion('Nick Drake — Pink Moon', 'Spare, intimate, and perfect for a reflective mood. Nothing else sounds like this.', 'Nick Drake Pink Moon'),
    spotifySuggestion('Acoustic Singer-Songwriter Mix', 'Storytelling at its finest — artists who wrote music for exactly this kind of moment.', 'acoustic singer songwriter reflective playlist'),
  ],
  [Mood.Social]: [
    spotifySuggestion('Bruno Mars — 24K Magic', 'Feel-good pop-R&B that turns any room into a party.', 'Bruno Mars 24K Magic'),
    spotifySuggestion('The Weeknd — After Hours', 'Sleek, moody R&B for a social evening with great vibes.', 'The Weeknd After Hours'),
    spotifySuggestion('Party Hits Playlist', 'The crowd-pleasers — tracks everyone in the room will know.', 'party hits playlist 2020s'),
  ],
  [Mood.Bored]: [
    spotifySuggestion('Discover Weekly — Spotify', 'Let Spotify\'s algorithm surprise you. Your personalized weekly mix of fresh music.', 'Spotify Discover Weekly new music'),
    spotifySuggestion('Top 50 Global', 'The most-streamed songs on the planet right now. Something will catch your ear.', 'Top 50 Global Spotify chart'),
    spotifySuggestion('Tyler, the Creator — IGOR', 'Experimental, bold, and completely unique. Something to actually listen to properly.', 'Tyler the Creator IGOR'),
  ],
  [Mood.Motivated]: [
    spotifySuggestion('Eminem — Recovery', 'Pure fire. When you need to feel unstoppable, this is the album.', 'Eminem Recovery'),
    spotifySuggestion('Workout Motivation Playlist', 'Aggressive, high-energy tracks for when you need to push harder.', 'motivation workout playlist rap hip hop'),
    spotifySuggestion('Kanye West — Graduation', 'Triumphant, cinematic hip-hop. Made for big moments and big feelings.', 'Kanye West Graduation'),
  ],
  [Mood.Balanced]: [
    spotifySuggestion('Taylor Swift — Midnights', 'Polished pop songwriting at its peak. Hits differently on a balanced day.', 'Taylor Swift Midnights'),
    spotifySuggestion('Indie Pop Gems Playlist', 'Handpicked indie pop tracks from the last decade — feel-good and interesting.', 'indie pop gems playlist chill'),
    spotifySuggestion('Harry Styles — Fine Line', 'Warm, confident, genre-blending pop. Feels good every single time.', 'Harry Styles Fine Line'),
  ],
};

export function generateMusicSuggestions(mood: Mood): Suggestion[] {
  return (SPOTIFY_SUGGESTIONS[mood] || SPOTIFY_SUGGESTIONS[Mood.Balanced]).slice(0, 2);
}

// --- Mini Games ---

const MINI_GAMES: Record<string, Suggestion[]> = {
  [Mood.Bored]: [
    { title: 'Wordle', description: 'The daily word puzzle everyone loves — takes 5 minutes and gives your brain a workout.', category: 'Mini Game', link: 'https://www.nytimes.com/games/wordle', icon: 'Game' },
    { title: 'GeoGuessr', description: 'Guess where in the world you are from a Street View location. Wildly addictive.', category: 'Mini Game', link: 'https://www.geoguessr.com/', icon: 'Game' },
  ],
  [Mood.Focused]: [
    { title: 'Chess Puzzles — Chess.com', description: 'Sharpen your tactical thinking with quick chess puzzles at your own pace.', category: 'Mini Game', link: 'https://www.chess.com/puzzles', icon: 'Game' },
    { title: 'NYT Sudoku', description: 'Classic logic puzzle. Perfect for entering a calm, focused flow state.', category: 'Mini Game', link: 'https://www.nytimes.com/puzzles/sudoku', icon: 'Game' },
  ],
  [Mood.Tired]: [
    { title: 'Wordle', description: 'A gentle 5-minute word puzzle — just enough to feel accomplished without any effort.', category: 'Mini Game', link: 'https://www.nytimes.com/games/wordle', icon: 'Game' },
    { title: 'Solitaire', description: 'The classic card game for a completely mindless and surprisingly satisfying session.', category: 'Mini Game', link: 'https://solitaire.org/', icon: 'Game' },
  ],
  [Mood.Energized]: [
    { title: 'GeoGuessr', description: 'Drop into a random location on Earth and figure out where you are. Very satisfying.', category: 'Mini Game', link: 'https://www.geoguessr.com/', icon: 'Game' },
    { title: 'Quick, Draw! by Google', description: 'Draw objects and let Google\'s AI guess. Fast, fun, and surprisingly competitive.', category: 'Mini Game', link: 'https://quickdraw.withgoogle.com/', icon: 'Game' },
  ],
  [Mood.Creative]: [
    { title: 'Quick, Draw! by Google', description: 'A creative drawing game where Google\'s neural net tries to recognize your sketches.', category: 'Mini Game', link: 'https://quickdraw.withgoogle.com/', icon: 'Game' },
    { title: 'Skribbl.io', description: 'Online multiplayer drawing and guessing game — great for creativity and laughs.', category: 'Mini Game', link: 'https://skribbl.io/', icon: 'Game' },
  ],
  [Mood.Anxious]: [
    { title: '2048', description: 'A simple sliding number puzzle — calm, meditative, and absorbing without any pressure.', category: 'Mini Game', link: 'https://play2048.co/', icon: 'Game' },
    { title: 'Wordle', description: 'Just 5 minutes to solve one puzzle. Gentle enough for an anxious day.', category: 'Mini Game', link: 'https://www.nytimes.com/games/wordle', icon: 'Game' },
  ],
  default: [
    { title: 'Wordle', description: 'The famous daily word puzzle. Just 5 minutes, once a day.', category: 'Mini Game', link: 'https://www.nytimes.com/games/wordle', icon: 'Game' },
    { title: 'Chess.com Puzzles', description: 'Quick tactical chess puzzles to sharpen your mind any time of day.', category: 'Mini Game', link: 'https://www.chess.com/puzzles', icon: 'Game' },
  ],
};

export function generateMiniGameSuggestions(mood: Mood): Suggestion[] {
  return (MINI_GAMES[mood] || MINI_GAMES.default) as Suggestion[];
}

// --- Local Activities ---

interface LocalActivitiesMap {
  [mood: string]: Partial<Record<SocialContext, Suggestion[]>>;
}

const LOCAL_ACTIVITIES: LocalActivitiesMap = {
  [Mood.Energized]: {
    [SocialContext.JustMe]: [
      { title: 'Go for a run somewhere new', description: 'Pick a route you haven\'t tried before. Energized days are made for this.', category: 'Local Activity', link: 'https://www.google.com/maps/search/running+trails+near+me', icon: 'Local' },
      { title: 'Find a local farmers market', description: 'Browse fresh produce and artisan goods — a great way to spend an energetic morning.', category: 'Local Activity', link: 'https://www.google.com/maps/search/farmers+market+near+me', icon: 'Local' },
    ],
    [SocialContext.WithFriends]: [
      { title: 'Find a local sports court or field', description: 'Shoot some hoops, kick a ball around — active and fun for a group.', category: 'Local Activity', link: 'https://www.google.com/maps/search/sports+court+near+me', icon: 'Local' },
    ],
    [SocialContext.MyPartner]: [
      { title: 'Explore a new neighborhood together', description: 'Walk somewhere neither of you has been before and discover what\'s there.', category: 'Local Activity', link: 'https://www.google.com/maps/search/parks+near+me', icon: 'Local' },
    ],
  },
  [Mood.Tired]: {
    [SocialContext.JustMe]: [
      { title: 'Find a cozy café nearby', description: 'Sit somewhere quiet, order something warm, and just exist for a little while.', category: 'Local Activity', link: 'https://www.google.com/maps/search/cozy+cafe+near+me', icon: 'Local' },
      { title: 'Take a slow walk in a nearby park', description: 'Fresh air without any agenda. Even 20 minutes outside changes your whole state.', category: 'Local Activity', link: 'https://www.google.com/maps/search/park+near+me', icon: 'Local' },
    ],
    [SocialContext.WithFriends]: [
      { title: 'Find a chill café or dessert spot', description: 'Somewhere low-key you can all sit, chat, and not have to do much.', category: 'Local Activity', link: 'https://www.google.com/maps/search/cafe+near+me', icon: 'Local' },
    ],
    [SocialContext.MyPartner]: [
      { title: 'Find a quiet spot to sit and decompress', description: 'A park bench, a waterfront — anywhere peaceful and away from screens.', category: 'Local Activity', link: 'https://www.google.com/maps/search/park+near+me', icon: 'Local' },
    ],
  },
  [Mood.Social]: {
    [SocialContext.JustMe]: [
      { title: 'Visit a local bar or lounge', description: 'Sometimes the best solo social activity is a bar where you can people-watch in peace.', category: 'Local Activity', link: 'https://www.google.com/maps/search/bar+near+me', icon: 'Local' },
    ],
    [SocialContext.WithFriends]: [
      { title: 'Find a bar or brewpub nearby', description: 'Happy hour energy is unmatched for this kind of vibe.', category: 'Local Activity', link: 'https://www.google.com/maps/search/bar+near+me', icon: 'Local' },
      { title: 'Look for a trivia night nearby', description: 'Trivia nights are one of the best group activities — fun, competitive, and free.', category: 'Local Activity', link: 'https://www.google.com/maps/search/trivia+night+near+me', icon: 'Local' },
    ],
    [SocialContext.MyPartner]: [
      { title: 'Try a new restaurant for dinner out', description: 'Go somewhere new instead of your usual spots — discovery is part of the fun.', category: 'Local Activity', link: 'https://www.google.com/maps/search/restaurant+near+me', icon: 'Local' },
    ],
  },
  [Mood.Motivated]: {
    [SocialContext.JustMe]: [
      { title: 'Find a local gym or fitness class', description: 'Use that motivation — a class or gym session will feel amazing right now.', category: 'Local Activity', link: 'https://www.google.com/maps/search/gym+near+me', icon: 'Local' },
    ],
    [SocialContext.WithFriends]: [
      { title: 'Find an escape room nearby', description: 'A great challenge for a motivated group. Teamwork, puzzle-solving, and fun.', category: 'Local Activity', link: 'https://www.google.com/maps/search/escape+room+near+me', icon: 'Local' },
    ],
    [SocialContext.MyPartner]: [
      { title: 'Take on a shared challenge nearby', description: 'A climbing gym, mini golf, or any activity where you can compete and connect.', category: 'Local Activity', link: 'https://www.google.com/maps/search/activities+near+me', icon: 'Local' },
    ],
  },
  default: {
    [SocialContext.JustMe]: [
      { title: 'Take a walk somewhere you haven\'t been', description: 'Pick a direction and explore. You might discover something great.', category: 'Local Activity', link: 'https://www.google.com/maps/search/parks+near+me', icon: 'Local' },
    ],
    [SocialContext.WithFriends]: [
      { title: 'See what\'s happening nearby today', description: 'Check local events or just head somewhere and improvise.', category: 'Local Activity', link: 'https://www.google.com/maps/search/things+to+do+near+me', icon: 'Local' },
    ],
    [SocialContext.MyPartner]: [
      { title: 'Explore somewhere new together', description: 'Go somewhere neither of you has been before. Novelty is one of the best things for a relationship.', category: 'Local Activity', link: 'https://www.google.com/maps/search/things+to+do+near+me', icon: 'Local' },
    ],
  },
};

export function generateLocalSuggestions(
  mood: Mood,
  socialContext: SocialContext,
  isDateNight: boolean,
): Suggestion[] {
  if (isDateNight) {
    return [
      { title: 'Find a romantic restaurant nearby', description: 'Somewhere special — look for ambiance as much as food.', category: 'Date Night', link: 'https://www.google.com/maps/search/romantic+restaurant+near+me', icon: 'DateNight' },
      { title: 'Discover a scenic viewpoint or lookout', description: 'City lights or a sunset view make for a perfect date night backdrop.', category: 'Date Night', link: 'https://www.google.com/maps/search/scenic+viewpoint+near+me', icon: 'DateNight' },
    ];
  }

  const moodMap = LOCAL_ACTIVITIES[mood] || LOCAL_ACTIVITIES.default;
  const contextSuggestions = (moodMap[socialContext] || LOCAL_ACTIVITIES.default[socialContext]) as Suggestion[] | undefined;
  return contextSuggestions || [];
}
