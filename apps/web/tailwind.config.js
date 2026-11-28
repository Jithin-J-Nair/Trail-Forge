/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        trail: {
          bg: '#0C1418',
          surface: 'rgba(16, 28, 32, 0.72)',
          border: 'rgba(232, 238, 233, 0.1)',
          fog: '#E8EEE9',
          muted: '#8B9A93',
          // Semantic accents (cartographic dusk)
          teal: '#3FA894',
          amber: '#C9955A',
          // Legacy keys remapped so existing HUD classes keep working
          cyan: '#3FA894',
          violet: '#C9955A',
          verified: '#5CBF8A',
          review: '#D4A35A',
          accent: '#C9955A',
        },
      },
      borderRadius: {
        glass: '14px',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: [
          '"Source Sans 3"',
          '"Noto Sans JP"',
          'Hiragino Sans',
          'Yu Gothic',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glass: '0 16px 48px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        glass: '22px',
      },
      keyframes: {
        'tf-rise': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'tf-drift': {
          from: { transform: 'translate3d(0, 0, 0)' },
          to: { transform: 'translate3d(-2.5%, 1.5%, 0)' },
        },
        'tf-glow': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.75' },
        },
      },
      animation: {
        'tf-rise': 'tf-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'tf-drift': 'tf-drift 28s ease-in-out alternate infinite',
        'tf-glow': 'tf-glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
