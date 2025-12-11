/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fondos negros
        background: {
          DEFAULT: '#0a0a0a',
          elevated: '#141414',
          card: '#1a1a1a',
        },
        // Colores vivos con alto contraste
        vivid: {
          cyan: '#00D9FF',
          magenta: '#FF006E',
          green: '#00FF88',
          yellow: '#FFD60A',
          purple: '#A855F7',
          blue: '#3B82F6',
        },
        // Texto con contraste óptimo
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3',
          tertiary: '#737373',
        },
        // Bordes
        border: {
          primary: '#2a2a2a',
          secondary: '#404040',
          accent: '#00D9FF',
        },
      },
      backgroundImage: {
        'gradient-vivid': 'linear-gradient(135deg, #00D9FF 0%, #FF006E 100%)',
        'gradient-purple': 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
        'gradient-green': 'linear-gradient(135deg, #00FF88 0%, #00D9FF 100%)',
      },
    },
  },
  plugins: [],
}
