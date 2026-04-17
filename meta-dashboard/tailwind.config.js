/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          500: '#4267B2',
          600: '#365899',
          700: '#2a4780',
        },
        meta: {
          blue: '#1877F2',
          green: '#42b72a',
          red: '#FA383E',
          yellow: '#F7B928',
        }
      },
    },
  },
  plugins: [],
}
