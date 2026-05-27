/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: {
          700: '#1e1e4a',
          800: '#161638',
          900: '#0f0f2e',
          950: '#08081a',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.35s ease-out both',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in':   'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'num-flash':  'numFlash 0.4s ease-out both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        numFlash:  { from: { color: '#a5b4fc' }, to: { } },
      },
    },
  },
  plugins: [],
};
