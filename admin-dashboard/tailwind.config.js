/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zambia: {
          navy: '#1e3a8a',
          red: '#de2010',
          black: '#000000',
          orange: '#ef7d00'
        }
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(18rem)' }, // 72 units = 18rem
        }
      },
      animation: {
        scan: 'scan 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
