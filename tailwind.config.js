/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter is primary. Manjari is fallback.
        sans: ['Inter', 'Manjari', 'sans-serif'],
      },
    },
  },
  plugins: [],
};