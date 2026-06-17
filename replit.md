# Gozi Wellness Platform

An AI-powered personal assistant that provides hyper-specific activity suggestions based on the user's mood, social context, available time, and personal inventory (streaming services, games, hobbies, fitness gear, kitchen appliances, musical instruments, etc.).

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (CDN)
- **AI**: Google Gemini (`gemini-2.5-flash`) via `@google/genai`
- **State**: Custom hook-based store (`useAppStore.ts`)
- **Persistence**: `localStorage` via `storageService.ts`

## Project Structure

```
/
├── App.tsx              # Main app with screen routing
├── index.tsx            # Entry point
├── index.html           # HTML shell
├── vite.config.ts       # Vite config (port 5000, host 0.0.0.0)
├── types.ts             # TypeScript interfaces and enums
├── constants.ts         # Achievements, XP rewards, initial state
├── components/          # Reusable UI components
├── screens/             # Page-level components (Today, Chat, Journey, Profile)
├── hooks/               # useAppStore.ts — business logic & state
└── services/
    ├── geminiService.ts       # Gemini API wrapper (PAUSE_GEMINI=true, uses local engine)
    ├── localSuggestionEngine.ts # Local keyword-based suggestion engine
    └── storageService.ts      # localStorage persistence
```

## Running the App

Two processes run concurrently:
- **Frontend** (Vite dev server): port 5000 — the React app
- **API server** (Express): port 3001 — proxied via `/api` in Vite

```bash
npm install
npm run dev
```

To seed Stripe products (run once after connecting Stripe):
```bash
npm run seed
```

## Key Architecture Notes

### AI / Suggestion Engine
- `PAUSE_GEMINI = true` in `geminiService.ts` — all AI calls are stubbed, no real API requests
- `localSuggestionEngine.ts` handles all suggestions locally:
  - **Inventory suggestions**: Scans user's actual items (Netflix, yoga mat, guitar, etc.) and generates specific activity suggestions matched to mood, time, and social context
  - **External content**: Curated static lists of podcasts, books, and YouTube channels organized by mood
  - **Mini games**: Curated browser-based games organized by mood
  - **Local activities**: Curated suggestions by mood and social context (solo / partner / friends)
  - **Smart categorization**: `detectCategory()` uses keyword matching to assign inventory categories
  - **Inventory parsing**: `parseAndCategorize()` handles both structured onboarding text and free-form input

### Achievements System
Six achievements tracked automatically:
- **First Discovery** — Get first activity suggestions
- **Collector** — Add 10+ inventory items
- **Curator** — Build 20+ item inventory
- **Conversationalist** — Send 10+ AI messages
- **Social Butterfly** — Connect with a friend or partner
- **Explorer** — Explore suggestions 5+ times

### Stripe Payments
The app has a full Stripe subscription integration:
- **Products**: "Gozi Premium" with monthly ($4.99) and annual ($49.99) prices — seeded via `npm run seed`
- **Checkout**: Users click "Upgrade" in Profile > Subscription, which fetches live prices from Stripe and redirects to a hosted checkout
- **Webhook**: `/api/stripe/webhook` receives Stripe events and syncs data to PostgreSQL via `stripe-replit-sync`
- **`server/stripeClient.ts`**: Fetches credentials from Replit's Stripe connector (auto-rotated, never hardcoded)
- **`server/routes/stripe.ts`**: `/api/stripe/products`, `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/subscription/:userId`
- **DB table**: `public.users` stores `stripe_customer_id`, `stripe_subscription_id`, `is_premium`
- **`stripe.` schema**: Managed automatically by `stripe-replit-sync` — do NOT manually create tables there

### Privacy Settings
`UserPreferences` now includes: `enableNotifications`, `dataSharing`, `profileVisibility` ('private' | 'friends'), `allowAnalytics`. All managed client-side.

## Environment Variables

- `GEMINI_API_KEY` — Required. Google Gemini API key for AI features. Get one at https://aistudio.google.com/apikey

## Running the App

```bash
npm install
npm run dev
```

Dev server runs at `http://0.0.0.0:5000`.

## Deployment

Configured as a static site:
- Build: `npm run build`
- Public directory: `dist`
