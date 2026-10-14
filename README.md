<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DailyPal (Gozi) - App Walkthrough & Documentation

Welcome to **DailyPal** (featuring the AI companion **Gozi**)! This document outlines everything you need to know about the app, including the entire onboarding flow, the homepage, how the chat works, and how the app uses your inventory to make customized suggestions.

## 1. Onboarding Flow

When a user first opens the app, they are guided through a personalized onboarding flow to tailor Gozi's suggestions to their lifestyle, hobbies, and belongings. 

The steps are exactly ordered as follows:

1. **Welcome Step**
   - **Text**: "Hello, [username]. Welcome home." 
   - **Mascot**: The Gozi mascot is introduced.
   - **Explanation**: "I'll learn what you own, what you love, and how you're feeling, then suggest exactly what to do with your time, every single day."
   - **Action**: Gozi requests location access (to suggest nearby activities and events).
2. **Personal Passions (Hobbies)**
   - **Question**: "What brings you joy?" (Select all that apply)
   - **Options**: Reading, Hiking, Photography, Cooking, Fitness, Yoga, Drawing, Music, Travel, Gardening, Gaming, Writing, Cycling, Meditation, Crafts, Dancing, Film, Podcasts.
   - **Action**: Users can also type in custom hobbies.
3. **Gaming Platforms (Where do you play?)**
   - **Question**: "Where do you play?"
   - **Options**: PC, PlayStation, Xbox, Nintendo Switch, Mobile Games, Board Games, Other.
4. **Game Details (What are you playing?)**
   - *(Only shows if the user selected specific platforms like PC, PS, Xbox, Switch, or Mobile)*
   - **Action**: The app asks the user to list their favorite games for the selected platforms (e.g., "Elden Ring, Baldur's Gate 3...").
5. **Streaming & Content**
   - **Question**: "Streaming & Content"
   - **Options**: Netflix, Hulu, Disney+, YouTube, Max, Prime Video, Apple TV+, Other.
6. **Goals (What are you working towards?)**
   - **Question**: "What are you working towards?"
   - **Options**: Get more active, Learn something new, Be more creative, Relax & recharge, Cook & eat well, Quality time with others, Explore my world, Build better habits, Dive into music, Read & reflect more, More fun & entertainment, Find more balance.
7. **Inventory (Finishing Touches)**
   - **Question**: "Describe your space."
   - **Explanation**: Users type in a free-form text box about what they own (e.g., "My golden retriever Sparky, a guitar, DSLR camera"). 
   - **Why this matters**: Gozi uses this inventory to suggest activities that are actually possible with what the user owns, not just generic ideas.

---

## 2. Homepage (Today Screen)

The homepage is the central hub where Gozi provides tailored recommendations based on the user's current context.

### Features & Interactions:
- **Greeting & Profile**: Displays a time-based greeting (Good Morning/Afternoon/Evening) and the user's username. Tapping the avatar goes to the Profile screen where you can access your **Sanctuary (Saved Cures)**.
- **Weekly Check-in**: If a survey is due, a banner appears to prompt the user to reflect on their progress. Feedback directly impacts future suggestions, avoiding activities you previously rated < 6/10.
- **Progress Card**: Displays the user's current level, XP, and streaks.
- **Daily Refresh (Trivia/Knowledge)**: A daily question appears (e.g., trivia or a reflection prompt). The user answers it to earn XP (+25 XP).
- **Current Context Module**: 
  - **Mood Selection**: Users can select how they are feeling right now.
  - **Social Context**: Users specify who they are with (e.g., Alone, With Friends, With Partner).
  - **Time Availability**: Users specify how much time they have (e.g., 15 mins, 1 hour, All Day).
  - **Friend Sync**: If the user is with a friend who also has the app, they can toggle whose inventory to use for suggestions ("At My Place", "At Theirs", or "Both Combined").
  - **Date Night Mode / Partner Sync**: If "Partner" is selected, users can plan a Date Night. If a partner isn't linked or available, a **Partner Session Modal** provides an invite link or allows for solo continuation.
- **Get Out There (Activity Map)**: An interactive map showing local activities, walking trails, or nearby spots based on the user's location.
- **AI Curated Suggestions**: 
  - Generates suggestions broken down by categories:
    - **Trending Cures**: Curated, time-and-season-appropriate editorial suggestions.
    - **Mindfulness / Mini-games**
    - **From Your Inventory**
    - **Music for Your Mood** (Spotify integrations)
    - **Discovery** (YouTube, Podcasts, Books)
  - **Frictionless Inventory Tracking**: Users can mark "I did this!" on a suggestion. If it uses an inventory item, Gozi asks "Did you use this up?" to seamlessly maintain an accurate pantry/inventory.
  - **Paywall Banner**: The paywall triggers softly after the very first suggestion fetch is completed, offering to upgrade while keeping the current fetch accessible.

---

## 3. Chat System & AI Companion

The Chat Screen allows for direct conversational interaction with Gozi.

- **Text Chat**: Users can text Gozi for specific advice, venting, or brainstorming.
- **Voice Chat**: Users can tap the microphone icon to enter a live voice session. The app provides real-time transcription ("Listening...") and speaks back.
- **AI Smart Suggestions**: When Gozi replies, it often provides actionable bubble prompts (suggestions) at the bottom of the message. The user can simply tap one of these bubbles to quickly reply or trigger an action without typing.

---

## 4. Inventory System

The inventory is a core pillar of how DailyPal differentiates itself from generic suggestion apps.

- **Initial Setup**: During onboarding, users describe their space and belongings in plain text.
- **Continuous Learning**: As users chat with Gozi, the AI picks up on new items or hobbies mentioned and updates the user's profile.
- **Contextual Awareness**: Suggestions are constrained by what the user actually owns. If a user has 15 minutes, is feeling creative, and owns a sketchbook, Gozi will specifically suggest sketching rather than a generic "do art" prompt.
- **Frictionless Maintenance (Quick Add)**: The system naturally prunes and maintains inventory through simple prompt interactions when you complete a suggested activity.
- **Friend Combinations**: When hanging out with friends on the app, the system can cross-reference both users' inventories to find overlapping activities.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. Run the app:
   `npm run dev`
