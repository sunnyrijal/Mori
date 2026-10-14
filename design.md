# Gozi App Design System

This document outlines the core design tokens, typography, and aesthetic philosophy used across the Gozi application. You can use this as a reference guide when working with other designers, AI agents, or developers.

## 1. Typography

The app uses two distinct Google Fonts to create a balance between modern usability and an elegant, editorial "companion" feel.

- **Primary Font (Sans-serif): `DM Sans`**
  - **Usage:** Body text, UI elements, buttons, small tags, and navigation.
  - **Why:** Clean, geometric, and highly readable at small sizes, giving it a modern app feel.
  - **Tailwind class:** `font-sans`

- **Secondary Font (Serif): `Cormorant Garamond`**
  - **Usage:** Headlines, titles, empathetic AI greetings, and stylized emphasis.
  - **Why:** Elegant, warm, and sophisticated. It provides a "journal-like" aesthetic that feels personal and premium rather than purely utilitarian.
  - **Tailwind class:** `font-serif` (often paired with `italic`)

## 2. Color Palette

The color palette intentionally avoids harsh pure blacks or stark whites as backgrounds. Instead, it relies on warm, organic tones to make the app feel inviting and calming.

### Core Backgrounds & Surfaces
- **App Background (`ios-bg`):** `#F7F4EF` (Warm Cream)
  - The default background color for screens, providing a soft, easy-on-the-eyes canvas.
- **Surface/Card (`ios-card`):** `#FFFFFF` (Pure White)
  - Used for elevated UI cards, modals, and input fields so they subtly stand out from the cream background.

### Text & Accents
- **Primary Text (`ios-text`):** `#1A1815` (Warm Charcoal/Off-Black)
  - Used for all primary reading text. Softer than pure black, reducing eye strain.
- **Secondary Text (`ios-muted`):** `#8A8580` (Warm Grey)
  - Used for subtitles, tags, placeholder text, and timestamps.
- **Borders & Dividers (`ios-border`):** `#E4E0D8` (Soft Beige)
  - Used for subtle dividing lines and card outlines.

### Semantic & Accent Colors
- **Dynamic Accent (`ios-accent`):** Variable (Defaults to `#1A1815`)
  - Often changes based on the user's mood or the active theme.
- **Nature Accents:**
  - **Warm Sage:** `#4A7B5C` (Used for positive states, nature-related suggestions, or "correct" Daily Refresh answers)
  - **Light Sage:** `#EBF2ED` (Used as a faint background for tags or pills)
  - **Warm Stone:** `#6B6560` (Used for deeper neutral accents)

## 3. UI Components & Layout Philosophy

Gozi follows a "Modern iOS meets Warm Editorial" design philosophy.

- **Shapes & Corners:** Heavy use of rounded corners to feel friendly and tactile. UI cards typically use `rounded-2xl` or `rounded-xl`, while smaller buttons use full pill shapes (`rounded-full`) or `rounded-lg`.
- **Elevation & Depth:** We avoid heavy shadows. Depth is created using very subtle, soft shadows (`shadow-sm`) combined with the contrast between the `#FFFFFF` cards and the `#F7F4EF` background.
- **Spacing:** Generous padding inside cards (often `p-4` or `p-6`) and wide gaps between sections to prevent the UI from feeling cluttered.
- **Micro-animations:** Interactive elements should feel alive. Buttons slightly shrink when tapped (`active:scale-95`), and new content elegantly fades or slides into view (`animate-fade-in`, `animate-slide-up`).

## 4. The Mascot (Otter)
The 3D otter mascot is a core part of the UI. Rather than just acting as a static logo, the mascot physically interacts with the UI cards (e.g., leaning over the top of a card, pointing at a button). This breaks the "fourth wall" of the UI and adds immense personality.
