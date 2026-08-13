/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        uno: {
          red: '#ff5555',
          blue: '#5555ff',
          green: '#55aa55',
          yellow: '#ffaa00',
          dark: '#111111',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'draw-card': 'drawCard 0.3s ease-out forwards',
        'play-card': 'playCard 0.3s ease-in forwards',
      },
      keyframes: {
        drawCard: {
          '0%': { transform: 'translateY(100px) scale(0.5)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        playCard: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.2) translateY(-50px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
