import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PEAK palette with 'peak-' prefix for clarity
        // Forest Green - Primary brand color representing mountain forests
        'peak-forest': {
          50: '#F4F7F5',
          100: '#EAEFEC',
          200: '#D5DEDA',
          300: '#B5C5BE',
          400: '#8BA499',
          500: '#2D5A47',
          600: '#264C3C',
          700: '#1F3F32',
          800: '#193127',
          900: '#12241C',
          950: '#0B1711',
          DEFAULT: '#2D5A47',
        },
        // Brass - Luxury accent color for premium elements
        'peak-brass': {
          50: '#FBF9F3',
          100: '#F8F3E6',
          200: '#F0E7CE',
          300: '#E6D5A9',
          400: '#D7BC78',
          500: '#B8860B',
          600: '#9C7209',
          700: '#815E08',
          800: '#654A06',
          900: '#4A3604',
          950: '#2E2203',
          DEFAULT: '#B8860B',
        },
        // Burgundy - Rich accent for special elements and warnings
        'peak-burgundy': {
          50: '#F8F5F5',
          100: '#F0EAEB',
          200: '#E2D5D7',
          300: '#CDB6B9',
          400: '#B18C91',
          500: '#722F37',
          600: '#61282F',
          700: '#502127',
          800: '#3F1A1E',
          900: '#2E1316',
          950: '#1D0C0E',
          DEFAULT: '#722F37',
        },
        // Navy - Secondary color for depth and contrast
        'peak-navy': {
          50: '#F3F5F7',
          100: '#E8EBEF',
          200: '#D2D8DF',
          300: '#B0BAC7',
          400: '#8393A7',
          500: '#1E3A5F',
          600: '#193151',
          700: '#152943',
          800: '#112034',
          900: '#0C1726',
          950: '#080F18',
          DEFAULT: '#1E3A5F',
        },
        // Neutral and accent colors
        'peak-cream': '#FAF7F2',
        'peak-stone': '#E7E5E4',
        'peak-charcoal': '#2C3E50',
        'peak-snow': '#FFFFFF',
        'peak-slate': '#64748B',
        // Wood tones for natural warmth
        'peak-wood': {
          light: '#D4A574',
          DEFAULT: '#8B6914',
          dark: '#5D4037',
        },
        'peak-copper': '#B87333',
      },
      fontFamily: {
        // Primary font families
        'serif': ['"Libre Baskerville"', 'Georgia', 'serif'],
        'sans': ['"Inter"', '"Segoe UI"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'Consolas', 'monospace'],
        // Semantic aliases for design consistency
        'display': ['"Libre Baskerville"', 'Georgia', 'serif'],
        'heading': ['"Libre Baskerville"', 'Georgia', 'serif'],
        'body': ['"Inter"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        // PEAK shadow system using charcoal (#2C3E50) for consistency
        'peak-sm': '0 1px 2px 0 rgba(44, 62, 80, 0.05)',
        'peak-md': '0 4px 6px -1px rgba(44, 62, 80, 0.1), 0 2px 4px -2px rgba(44, 62, 80, 0.1)',
        'peak-lg': '0 10px 15px -3px rgba(44, 62, 80, 0.1), 0 4px 6px -4px rgba(44, 62, 80, 0.1)',
        // Specialty shadows for specific UI elements
        'peak-frame': '0 2px 8px rgba(44, 62, 80, 0.08), 0 0 0 1px rgba(231, 229, 228, 0.8)',
        'peak-lift': '0 12px 24px -8px rgba(44, 62, 80, 0.15), 0 4px 8px -4px rgba(44, 62, 80, 0.1)',
        'peak-card': '0 8px 24px -4px rgba(44, 62, 80, 0.12), 0 4px 8px -2px rgba(44, 62, 80, 0.06)',
      },
      borderRadius: {
        // PEAK border radius scale for consistent roundness
        'peak-sm': '0.25rem',
        'peak-md': '0.5rem',
        'peak-lg': '0.75rem',
        'peak-xl': '1rem',
      },
      spacing: {
        // PEAK-specific spacing tokens if needed
      },
    },
  },
  plugins: [],
};

export default config;
