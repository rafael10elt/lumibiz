/** @type {import('tailwindcss').Config} */
export default {
  content:[
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0D8BD8',
          'blue-deep': '#0B63C7',
          orange: '#FF9B17',
          'orange-deep': '#FF7A00',
          dark: '#0F172A',
          mist: '#EFF6FF'
        },
        'brand-blue': '#0D8BD8',
        'brand-blue-deep': '#0B63C7',
        'brand-orange': '#FF9B17',
        'brand-orange-deep': '#FF7A00',
        'brand-dark': '#0F172A',
        'brand-gold': '#FF9B17'
      },
      boxShadow: {
        soft: '0 20px 45px -24px rgba(15, 23, 42, 0.25)',
        panel: '0 20px 60px -28px rgba(15, 23, 42, 0.35)',
        glow: '0 14px 34px -18px rgba(13, 139, 216, 0.5)'
      },
      backgroundImage: {
        'brand-radial':
          'radial-gradient(circle at top left, rgba(13, 139, 216, 0.18), transparent 36%), radial-gradient(circle at bottom right, rgba(255, 155, 23, 0.18), transparent 32%)'
      }
    },
  },
  plugins:[],
}
