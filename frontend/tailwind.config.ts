import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          primary: '#B4FF4D',
          dark: '#8ED138',
          glow: 'rgba(180,255,77,0.15)',
        },
        bg: {
          base: '#0A0A0A',
          card: '#111111',
          hover: '#181818',
          secondary: '#151515',
        },
        border: {
          DEFAULT: '#1E1E1E',
          light: '#2A2A2A',
        },
        val: {
          red: '#FF4655',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(180,255,77,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(180,255,77,0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-shine': 'linear-gradient(105deg, transparent 40%, rgba(180,255,77,0.03) 50%, transparent 60%)',
      },
    },
  },
  plugins: [],
} satisfies Config
