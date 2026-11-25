/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        trail: {
          bg: '#0b1210',
          surface: '#16211c',
          fog: '#e7eee9',
          muted: '#9bb0a4',
          accent: '#c45c26',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
