/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './server/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 18px 50px rgba(2, 6, 23, 0.45)'
      }
    }
  },
  plugins: []
}
