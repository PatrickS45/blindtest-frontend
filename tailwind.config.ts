import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs principales
        primary: {
          DEFAULT: '#FF3366',
          dark: '#CC0044',
          light: '#FF6B9D',
        },
        secondary: '#00D9FF',
        accent: '#FFD700',

        // Couleurs par mode de jeu
        mode: {
          accumul: '#4A90E2',    // Bleu classique
          reflexo: '#F5A623',    // Orange énergique
          qcm: '#7B68EE',        // Violet moderne
          rafale: '#50E3C2',     // Turquoise dynamique
          chaud: '#E94B3C',      // Rouge chaud
          tueurs: '#9013FE',     // Violet foncé
        },

        // États
        success: '#27AE60',
        error: '#E74C3C',
        warning: '#F39C12',

        // Neutres
        bg: {
          dark: '#0A0E27',
          medium: '#1A1F3A',
          card: '#1A1F3A',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B8C5D6',
        },
      },
      fontFamily: {
        display: ['Fredoka', 'sans-serif'],  // Titres, boutons
        body: ['Inter', 'sans-serif'],       // Textes
        mono: ['JetBrains Mono', 'monospace'], // Code, room codes
      },
      fontSize: {
        'hero': 'clamp(2rem, 5vw, 4rem)',
        'title': 'clamp(1.5rem, 3vw, 2.5rem)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 51, 102, 0.5)',
        'glow-lg': '0 0 40px rgba(255, 51, 102, 0.6)',
        'glow-xl': '0 0 60px rgba(255, 51, 102, 0.8)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF3366 0%, #FF6B9D 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'flash': 'flash 0.5s ease-in-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'fade-in': {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'flash': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.3' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        'slide-up': {
          'from': {
            transform: 'translateY(100px)',
            opacity: '0',
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config
