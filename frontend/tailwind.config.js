/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F',
        surface: '#15151D',
        primary: '#6D28D9',
        secondary: '#00D2FF',
      }
    },
  },
  plugins: [],
}
