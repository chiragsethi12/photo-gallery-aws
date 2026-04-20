/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan so unused classes are purged in production
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // Custom color palette for the gallery
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        dark: {
          800: '#0f172a',
          850: '#0d1526',
          900: '#070d1a',
        },
      },
      // Smooth fade-in animation for gallery images
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        shimmer:   'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
};
