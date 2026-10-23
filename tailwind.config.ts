import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // High visibility palette designed for elderly vision
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        health: {
          take: '#15803d',   // Green for taken
          snooze: '#b45309', // Amber for remind later
          missed: '#b91c1c', // Red for missed
          due: '#1d4ed8',    // Blue for scheduled
        },
      },
      fontSize: {
        // Elderly readable base sizes
        'elderly-base': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        'elderly-lg': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        'elderly-xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        'elderly-2xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '60px',
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '60px',
      },
    },
  },
  plugins: [],
};

export default config;
