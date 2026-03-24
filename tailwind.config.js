/** @type {import('tailwindcss').Config} */
export default {
  content:[
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita o dark mode no sistema
  theme: {
    extend: {
      colors: {
        'brand-gold': '#BFA16A',
        'brand-dark': '#373737',
      }
    },
  },
  plugins:[],
}