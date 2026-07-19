/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6D5DFB',
          light: '#8B7CFB',
          dark: '#5b4ae8',
          glow: 'rgba(109, 93, 251, 0.35)',
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#6D5DFB',
          600: '#5b4ae8',
          700: '#4f3fd4',
          800: '#4338b8',
          900: '#3730a3',
        },
        sidebar: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
          active: '#2d1f6e',
          border: '#334155',
          muted: '#94A3B8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.07)',
        card: '0 2px 12px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04)',
        glass: '0 8px 40px rgba(109, 93, 251, 0.18), 0 2px 8px rgba(0,0,0,0.06)',
        hero: '0 20px 60px -12px rgba(109, 93, 251, 0.45)',
        float: '0 12px 32px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        /* Single layer — do NOT use two bg-* classes or the gradient gets replaced */
        hero:
          'linear-gradient(125deg, #6D5DFB 0%, #7B6DFC 35%, #6B5CE8 65%, #5b4ae8 100%), radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255,255,255,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(139,124,251,0.3) 0%, transparent 50%)',
        'hero-gradient':
          'linear-gradient(125deg, #6D5DFB 0%, #7B6DFC 35%, #6B5CE8 65%, #5b4ae8 100%)',
        'cta-gradient': 'linear-gradient(135deg, #6D5DFB 0%, #8B7CFB 50%, #6D5DFB 100%)',
        'page-mesh':
          'radial-gradient(at 0% 0%, rgba(109,93,251,0.06) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139,124,251,0.04) 0px, transparent 40%)',
      },
    },
  },
  plugins: [],
};
