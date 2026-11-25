/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        trail: {
          bg: '#05070D',
          surface: 'rgba(14, 18, 30, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
          fog: '#E8ECF5',
          muted: '#8A94A8',
          cyan: '#4FE3FF',
          violet: '#8B7BFF',
          verified: '#4FE3A3',
          review: '#FFB547',
          accent: '#4FE3FF',
        },
      },
      borderRadius: {
        glass: '16px',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Noto Sans JP"', 'Hiragino Sans', 'Yu Gothic', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 12px 40px rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        glass: '24px',
      },
    },
  },
  plugins: [],
};
