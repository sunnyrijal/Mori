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
        'ios-bg': '#FFFFFF',
        'ios-card': '#FFFFFF',
        'ios-text': '#000000',
        'ios-muted': '#555555',
        'ios-border': '#E5E5E5',
        'ios-accent': '#4A7B5C',
        'warm-cream': '#FFFFFF',
        'warm-sage': '#4A7B5C',
        'warm-sage-light': '#EBF2ED',
        'warm-stone': '#555555',
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
