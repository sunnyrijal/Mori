/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.tsx",
    "./*.ts",
    "./screens/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        'ios-bg': '#F7F4EF',
        'ios-card': '#FFFFFF',
        'ios-text': '#1A1815',
        'ios-muted': '#8A8580',
        'ios-border': '#E4E0D8',
        'ios-accent': 'var(--mood-accent, #1A1815)',
        'warm-cream': '#F7F4EF',
        'warm-sage': '#4A7B5C',
        'warm-sage-light': '#EBF2ED',
        'warm-stone': '#6B6560',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
