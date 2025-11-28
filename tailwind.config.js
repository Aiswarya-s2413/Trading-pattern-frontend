/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'brand-primary': '#3b82f6',
        'brand-accent': '#8b5cf6',
      }
    },
  },
  plugins: [],
}
