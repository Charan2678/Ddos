/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: {
            light: '#e7f0fd',
            DEFAULT: '#0d6efd',
            dark: '#0a58ca',
            deep: '#031b4e'
          },
          slate: {
            light: '#f8fafc',
            DEFAULT: '#475569',
            dark: '#1e293b',
            deep: '#0f172a'
          },
          accent: '#0dcaf0', // Neon-cyan highlight
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(13, 110, 253, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
        'premium-hover': '0 10px 25px -3px rgba(13, 110, 253, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
